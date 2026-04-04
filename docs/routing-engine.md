# Routing Engine — Constraint-Based Hospital Matching

> [← Back to README](../README.md)

---

## Overview

The routing engine (`ML_Service/hospital/router.py`) is a **deterministic, constraint-based optimizer** that receives the triage care plan and outputs a ranked list of hospitals that can actually treat the patient right now.

> **Key Design Decision:** The engine handles *capability matching and ranking only*. Distance and ETA are delegated entirely to the frontend via the Google Maps / OSRM API. This keeps the scoring pure and allows GPS-agnostic testing of the routing logic.

---

## Input / Output Contract

### Input

```python
{
    "patient_id":       str,
    "severity":         "CRITICAL" | "URGENT" | "STABLE",
    "specialty_needed": list[str],   # from TriagePredictor care plan
    "equipment_needed": list[str],   # from TriagePredictor care plan
    "vitals":           dict         # hr, bp_sys, bp_dia, spo2, gcs
}
```

### Output

```python
{
    "patient_id":             str,
    "severity":               str,
    "vitals_critical_flag":   bool,         # warns frontend paramedic
    "specialties_requested":  list[str],
    "equipment_requested":    list[str],
    "matched_hospitals":      list[HospitalScore],  # ranked by composite score
    "total_matched":          int,
    "scoring_weights_used":   dict
}
```

---

## Routing Pipeline

```
raw input
    ↓
[1] Purge expired soft reservations (TTL check)
    ↓
[2] Normalise specialty synonyms
    ↓
[3] Load live hospital grid (get_hospitals_with_live_beds)
    ↓
[4] Hard filter — can_handle_patient()
    ↓
[5] Score each capable hospital — score_hospital()
    ↓
[6] Sort by composite score (descending)
    ↓
[7] Soft-reserve top hospital
    ↓
output: ranked list + reservation metadata
```

---

## Step 2 — Specialty Synonym Normalisation

The triage model may output specialty tags in various formats. The engine normalises them to a consistent DB vocabulary before matching:

| Raw Tag | Normalised |
|---------|-----------|
| `"surgeon"`, `"surgery"` | `general_surgeon` |
| `"cardiac"`, `"heart"` | `cardiology` |
| `"neuro"`, `"brain"` | `neurology` |
| `"brain_surgery"` | `neurosurgery` |
| `"ventilator_needed"` | `ICU` |
| `"intensivist"` | `ICU` |
| `"trauma surgeon"` | `trauma` |
| `"infectious disease specialist"` | `infectious_disease` |

---

## Step 4 — Hard Filters (`can_handle_patient`)

A hospital is **excluded** (not scored) if any of these conditions are true:

| Rule | Condition |
|------|-----------|
| No ER | `er_capable == False` |
| CRITICAL without ICU | `severity == CRITICAL` and `"ICU" not in specialties` |
| Zero specialty match | Needed specialties exist but hospital covers none of them |
| CRITICAL equipment gap | `severity == CRITICAL` and equipment match < 50% |

These are hard gates — no amount of scoring can compensate for failing a hard filter.

---

## Step 5 — Composite Scoring

Each passing hospital receives a weighted composite score:

```
composite = (specialty_match × w_spec)
          + (equipment_match × w_equip)
          + (bed_score       × w_bed)
          + (level_score     × w_level)
```

### Scoring Weights by Severity Tier

| Factor | CRITICAL | URGENT | STABLE |
|--------|---------|--------|--------|
| Specialty Match | **0.45** | 0.40 | 0.35 |
| Equipment Match | **0.30** | 0.25 | 0.20 |
| Bed Score | 0.15 | 0.20 | **0.25** |
| Hospital Level | 0.10 | 0.15 | **0.20** |

> For CRITICAL patients, capability (specialty + equipment) accounts for 75% of the score. For STABLE, bed availability and hospital level carry more weight.

### Sub-Score Definitions

#### Specialty Match Score
```
matched_specialties / total_needed_specialties
```
Returns `1.0` if no specialties are needed (general ER suffices).

#### Equipment Match Score
```
matched_equipment / total_needed_equipment
```
Returns `1.0` if no equipment is needed.

#### Bed Score
Subtracts active soft reservations from reported free bed counts before scoring:

```python
icu_free = max(0, hospital.icu_beds_free - active_icu_reservations)
gen_free = max(0, hospital.general_beds_free - active_gen_reservations)

if icu_free > 0:
    return min(1.0, 0.6 + (icu_free / max(total_beds * 0.10, 1)) * 0.4)
elif gen_free > 0:
    return min(1.0, 0.3 + (gen_free / max(total_beds * 0.25, 1)) * 0.3)
else:
    return 0.05   # last resort — appears full but never completely excluded
```

#### Hospital Level Score
| Level | Score |
|-------|-------|
| 1 (Super Specialty) | 1.0 |
| 2 (Multi Specialty) | 0.7 |
| 3 (General / Govt) | 0.4 |

---

## Step 7 — Soft Reservation System

### How It Works

When the top-ranked hospital is selected, the engine automatically places a **soft reservation** on a bed:

- `CRITICAL / URGENT` → reserves an `icu_bed`
- `STABLE` → reserves a `general_bed`

The reservation expires in **15 minutes** (TTL). If the ambulance is re-routed or does not confirm arrival, the hold is released automatically.

### Reservation Store

```python
RESERVATIONS = {
    "H01": [
        {
            "patient_id": "P001",
            "resource":   "icu_bed",
            "reserved_at": 1712193600.0,
            "expires_at":  1712194500.0    # reserved_at + 900s
        }
    ]
}
```

### Reservation Lifecycle

| Action | Function | Effect |
|--------|----------|--------|
| New routing | `_make_reservation()` | Creates TTL entry |
| Subsequent routing | `_purge_expired()` + `_count_reserved()` | Expired entries removed; live reservations deducted from bed scores |
| Ambulance arrives | `confirm_arrival()` | Removes reservation (bed now permanently occupied) |
| Re-routed | `cancel_reservation()` | Immediately frees the tentative hold |

> **Production note:** Replace the in-memory dict with **Redis TTL keys** for multi-process and multi-server deployments.

### Vitals Critical Flag

The engine also evaluates vitals against critical thresholds:

| Vital | Threshold |
|-------|-----------|
| `spo2` | < 88% → critical |
| `bp_sys` | < 80 mmHg → critical |
| `gcs` | < 9 → critical |
| `hr` | > 150 or < 40 → critical |

If any threshold is breached, `vitals_critical_flag: true` is returned. The frontend uses this to warn the paramedic to prioritize the geographically closest capable hospital.

---

## Hospital Database

**File:** `ML_Service/hospital/hospitals_db.py`

18 Pune hospitals modelled from real institutions with realistic bed counts, specialties, and equipment. Bed availability is randomised per request run to simulate a live state.

### Tier 1 — Full Super-Specialty (8 hospitals)

| ID | Hospital | Area | Beds | Notable Capabilities |
|----|----------|------|------|---------------------|
| H01 | Ruby Hall Clinic (Sassoon Road) | Camp / Central | 600 | Neuro-interventional cath lab, ECMO, transplant |
| H02 | Deenanath Mangeshkar Hospital | Erandwane | 750 | Largest charitable. Robotic surgery, cancer research |
| H03 | Sahyadri Super Speciality (Deccan) | Deccan | 202 | Bone marrow transplant, liver transplant |
| H04 | Apollo Jehangir Hospital | Camp | 350 | 9 OTs, 24hr ER, Robotic surgery |
| H05 | Kokilaben Hospital Pune (Kharadi) | East Pune | 300 | Serves IT corridor, East Pune |
| H06 | Manipal Hospital Baner | West Pune | 250 | Launched 2022. Serves Baner, Wakad, Aundh |
| H07 | Nanavati Max Hospital (Viman Nagar) | Airport area | 280 | ECMO, covers Kalyani Nagar corridor |
| H08 | DPU Super Specialty (Pimpri) | PCMC | 500 | Heart transplant, 18 OTs, largest in PCMC |

### Tier 2 — Multi-Specialty (6 hospitals)

| ID | Hospital | Area | Beds | Notable Capabilities |
|----|----------|------|------|---------------------|
| H09 | Sancheti Hospital | Shivajinagar | 300 | Best ortho & trauma in Pune. 2500+ surgeries/yr |
| H10 | Sahyadri Hadapsar | East Pune | 201 | 46 ICU beds. Covers Magarpatta, Wagholi |
| H11 | Sahyadri Nagar Road | Yerawada | 130 | Cath lab + IVF. Serves Kalyani Nagar |
| H12 | Lokmanya Hospital (Chinchwad) | PCMC | 250 | Burns unit, Level 1 trauma for PCMC |
| H13 | AIMS Multispeciality (Aundh) | NW Pune | 250 | Modern ICU. Serves Baner, Wakad |
| H14 | VishwaRaj Hospital (Loni Kalbhor) | SE Pune | 200 | Serves rural SE Pune, Solapur highway |

### Tier 3 — General / Stabilise-First (4 hospitals)

| ID | Hospital | Area | Beds | Notable Capabilities |
|----|----------|------|------|---------------------|
| H15 | Sassoon General Hospital | Camp | 1400 | Largest govt hospital in Pune. Free care. |
| H16 | KEM Hospital | Rasta Peth | 400 | Good generalist ER. Reasonable ICU. |
| H17 | Surya Sahyadri (Kasba Peth) | Old Pune | 65 | Burns centre + trauma. Old city area. |
| H18 | Pawana Hospital (Somatane) | Expressway | 203 | Critical for Mumbai-Pune expressway accidents |

---

> 📖 **[ML Pipeline Details →](ml-pipeline.md)**
> 📖 **[API Reference →](api-reference.md)**
