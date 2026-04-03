# =============================================================================
# SMART ROUTING ENGINE — AmbuRoute
# Role    : Capability matching + ranking ONLY
# Distance/ETA/routing : handled entirely by frontend via Google Maps API
#
# Input   : severity, specialties needed, equipment needed, vitals
# Output  : ranked list of capable hospitals (with hospital lat/lng for Maps)
#
# NOTE    : Patient GPS is NOT an input here. The frontend passes patient
#           location directly to Google Maps — this engine never sees it.
# =============================================================================

import time
import threading
from hospitals_db import get_hospitals_with_live_beds

# ---------------------------------------------------------------------------
# SOFT RESERVATION STORE
# ---------------------------------------------------------------------------
# Structure:
#   RESERVATIONS = {
#       "H01": [
#           { "patient_id": "P001", "resource": "icu_bed", "expires_at": 1234567890.0 },
#           ...
#       ]
#   }
#
# In production: replace with Redis with TTL keys.
# For prototype: in-memory dict, auto-cleaned on every route call.
# ---------------------------------------------------------------------------

RESERVATION_TTL_SECONDS = 15 * 60   # 15 minutes
RESERVATIONS: dict[str, list] = {}
_reservation_lock = threading.Lock()


def _purge_expired():
    """Remove all reservations whose TTL has elapsed. Called before every route."""
    now = time.time()
    with _reservation_lock:
        for hospital_id in list(RESERVATIONS.keys()):
            RESERVATIONS[hospital_id] = [
                r for r in RESERVATIONS[hospital_id]
                if r["expires_at"] > now
            ]
            if not RESERVATIONS[hospital_id]:
                del RESERVATIONS[hospital_id]


def _count_reserved(hospital_id: str, resource: str) -> int:
    """Count how many active reservations exist for a given resource at a hospital."""
    now = time.time()
    with _reservation_lock:
        return sum(
            1 for r in RESERVATIONS.get(hospital_id, [])
            if r["resource"] == resource and r["expires_at"] > now
        )


def _make_reservation(patient_id: str, hospital_id: str, resource: str):
    """Create a soft reservation for a patient at a hospital."""
    with _reservation_lock:
        if hospital_id not in RESERVATIONS:
            RESERVATIONS[hospital_id] = []
        RESERVATIONS[hospital_id].append({
            "patient_id": patient_id,
            "resource":   resource,
            "reserved_at": time.time(),
            "expires_at":  time.time() + RESERVATION_TTL_SECONDS,
        })


def confirm_arrival(patient_id: str, hospital_id: str):
    """
    Call this when the ambulance confirms arrival at the hospital.
    Converts the soft reservation into a permanent deduction
    (removes the TTL-based entry — the bed stays occupied until
    the hospital system updates its count).
    """
    with _reservation_lock:
        if hospital_id in RESERVATIONS:
            RESERVATIONS[hospital_id] = [
                r for r in RESERVATIONS[hospital_id]
                if r["patient_id"] != patient_id
            ]
    # In production: trigger a call to hospital bed management API here.
    print(f"[RESERVATION] Patient {patient_id} confirmed at {hospital_id}. "
          f"Soft reservation converted to confirmed occupancy.")


def cancel_reservation(patient_id: str, hospital_id: str):
    """
    Call this if the ambulance is re-routed to a different hospital.
    Frees the tentative hold immediately.
    """
    with _reservation_lock:
        if hospital_id in RESERVATIONS:
            RESERVATIONS[hospital_id] = [
                r for r in RESERVATIONS[hospital_id]
                if r["patient_id"] != patient_id
            ]
    print(f"[RESERVATION] Reservation for {patient_id} at {hospital_id} cancelled.")

# ---------------------------------------------------------------------------
# SPECIALTY SYNONYM NORMALISATION
# Maps triage model output tags → our DB vocabulary
# ---------------------------------------------------------------------------
SPECIALTY_SYNONYMS = {
    "surgeon":            "general_surgeon",
    "surgery":            "general_surgeon",
    "cardiac":            "cardiology",
    "heart":              "cardiology",
    "heart_surgery":      "cardiac_surgery",
    "neuro":              "neurology",
    "brain":              "neurology",
    "brain_surgery":      "neurosurgery",
    "spine":              "spine_surgery",
    "bone":               "orthopedics",
    "fracture":           "orthopedics",
    "kidney":             "nephrology",
    "dialysis_needed":    "nephrology",
    "cancer":             "oncology",
    "liver":              "transplant",
    "transplant_liver":   "transplant",
    "mental":             "psychiatry",
    "psych":              "psychiatry",
    "child":              "pediatrics",
    "burn":               "burns",
    "icu":                "ICU",
    "ventilator_needed":  "ICU",
    "ccu":                "CCU",
    "nicu":               "NICU",
    # Added mappings to bridge ML output to DB
    "general surgeon":    "general_surgeon",
    "trauma surgeon":     "trauma",
    "infectious disease specialist": "infectious_disease",
    "intensivist":        "ICU",
}

# ---------------------------------------------------------------------------
# SCORING WEIGHTS — shift by severity
# No "time" weight here. Time is handled by Google Maps on the frontend.
# ---------------------------------------------------------------------------
WEIGHTS = {
    "CRITICAL": {"specialty": 0.45, "equipment": 0.30, "bed": 0.15, "level": 0.10},
    "URGENT":   {"specialty": 0.40, "equipment": 0.25, "bed": 0.20, "level": 0.15},
    "STABLE":   {"specialty": 0.35, "equipment": 0.20, "bed": 0.25, "level": 0.20},
}

# Vitals thresholds — used to flag "patient is critical" in output
# Frontend can use this to warn paramedic to choose closest hospital
CRITICAL_VITALS_THRESHOLDS = {
    "spo2_below": 88,
    "bp_sys_below": 80,
    "gcs_below": 9,
    "hr_above": 150,
    "hr_below": 40,
}


# ---------------------------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------------------------

def normalise_specialties(raw_list: list) -> list:
    """Normalise triage model specialty tags to our DB vocabulary."""
    normalised = []
    for s in raw_list:
        key = s.lower().strip()
        normalised.append(SPECIALTY_SYNONYMS.get(key, key))
    return list(set(normalised))


def specialty_match_score(needed: list, hospital_specialties: list) -> float:
    """
    0.0 to 1.0.
    Fraction of required specialties the hospital has.
    Returns 1.0 if no specialty needed (any ER will do).
    """
    if not needed:
        return 1.0
    matched = sum(1 for s in needed if s in hospital_specialties)
    return round(matched / len(needed), 3)


def equipment_match_score(needed_equipment: list, hospital_equipment: list) -> float:
    """0.0 to 1.0. Fraction of required equipment the hospital has."""
    if not needed_equipment:
        return 1.0
    matched = sum(1 for e in needed_equipment if e in hospital_equipment)
    return round(matched / len(needed_equipment), 3)


def bed_score(hospital: dict) -> float:
    """
    0.0 to 1.0. Score based on EFFECTIVE bed availability.
    Subtracts active soft reservations before scoring so that
    a bed tentatively held for another patient is not double-counted.
    """
    hospital_id = hospital["id"]
    total       = hospital.get("total_beds", 1)

    # Subtract active reservations from reported free counts
    icu_reserved = _count_reserved(hospital_id, "icu_bed")
    gen_reserved = _count_reserved(hospital_id, "general_bed")

    icu_free = max(0, hospital.get("icu_beds_free", 0) - icu_reserved)
    gen_free = max(0, hospital.get("general_beds_free", 0) - gen_reserved)

    if icu_free > 0:
        return min(1.0, 0.6 + (icu_free / max(total * 0.10, 1)) * 0.4)
    elif gen_free > 0:
        return min(1.0, 0.3 + (gen_free / max(total * 0.25, 1)) * 0.3)
    else:
        return 0.05  # hospital appears full — still last resort


def level_score(level: int) -> float:
    """Higher-level hospitals score higher for capability."""
    return {1: 1.0, 2: 0.7, 3: 0.4}.get(level, 0.4)


def vitals_are_critical(vitals: dict) -> bool:
    """Returns True if vitals indicate patient is in a dangerous state."""
    v = vitals
    t = CRITICAL_VITALS_THRESHOLDS
    return (
        v.get("spo2",   100) < t["spo2_below"]   or
        v.get("bp_sys", 120) < t["bp_sys_below"]  or
        v.get("gcs",     15) < t["gcs_below"]     or
        v.get("hr",      70) > t["hr_above"]      or
        v.get("hr",      70) < t["hr_below"]
    )


def score_hospital(hospital: dict, needed_specs: list,
                   needed_equip: list, w: dict) -> dict:
    """
    Compute composite capability score for a single hospital.
    Returns a dict with score breakdown.
    """
    spec_score  = specialty_match_score(needed_specs, hospital["specialties"])
    equip_score = equipment_match_score(needed_equip, hospital["equipment"])
    b_score     = bed_score(hospital)
    l_score     = level_score(hospital.get("level", 3))

    composite = round(
        spec_score  * w["specialty"]  +
        equip_score * w["equipment"]  +
        b_score     * w["bed"]        +
        l_score     * w["level"],
        4
    )

    return {
        "hospital_id":        hospital["id"],
        "name":               hospital["name"],
        "area":               hospital["area"],
        "lat":                hospital["lat"],
        "lng":                hospital["lng"],
        "level":              hospital["level"],
        "score":              composite,
        "specialty_match":    spec_score,
        "equipment_match":    equip_score,
        "bed_score":          b_score,
        "icu_beds_free":      hospital.get("icu_beds_free", 0),
        "general_beds_free":  hospital.get("general_beds_free", 0),
        "trauma_center":      hospital.get("trauma_center", False),
        "nabh_accredited":    hospital.get("nabh_accredited", False),
        "er_capable":         hospital.get("er_capable", False),
        "specialties":        hospital["specialties"],
        "equipment":          hospital["equipment"],
    }


# ---------------------------------------------------------------------------
# FILTER — only hospitals that meet minimum capability threshold
# ---------------------------------------------------------------------------

def can_handle_patient(hospital: dict, needed_specs: list,
                        needed_equip: list, severity: str) -> bool:
    """
    Hard filter. A hospital is included only if:
    - It has at least partial specialty match (>0% if specialties are needed)
    - It has ER capability
    - For CRITICAL: must have ICU
    - For CRITICAL: equipment match must be at least 50%
    """
    if not hospital.get("er_capable", False):
        return False

    if severity == "CRITICAL" and "ICU" not in hospital["specialties"]:
        return False

    if needed_specs:
        spec_match = specialty_match_score(needed_specs, hospital["specialties"])
        if spec_match == 0.0:
            return False  # zero match — this hospital literally can't help

    if needed_equip and severity == "CRITICAL":
        equip_match = equipment_match_score(needed_equip, hospital["equipment"])
        if equip_match < 0.5:
            return False  # CRITICAL patient, missing too much equipment

    return True


# ---------------------------------------------------------------------------
# MAIN ROUTING FUNCTION
# ---------------------------------------------------------------------------

def route_patient(patient_input: dict) -> dict:
    """
    Main entry point.

    Input:
        {
            "patient_id":       str,
            "severity":         "CRITICAL" | "URGENT" | "STABLE",
            "specialty_needed": list[str],   # from triage model
            "equipment_needed": list[str],   # from triage model
            "vitals":           { "hr", "bp_sys", "bp_dia", "spo2", "gcs" }
        }
        NOTE: No GPS. Patient location is handled entirely by the frontend.

    Output:
        {
            "patient_id":              str,
            "severity":                str,
            "vitals_critical_flag":    bool,   # frontend can warn paramedic
            "specialties_requested":   list,
            "equipment_requested":     list,
            "matched_hospitals":       list of hospital dicts ranked by score,
                                       each includes lat/lng for Google Maps
            "total_matched":           int,
            "scoring_weights_used":    dict
        }
    """

    # Always clean up expired reservations before scoring
    _purge_expired()

    # --- Defaults for missing input ---
    patient_input.setdefault("severity", "URGENT")
    patient_input.setdefault("specialty_needed", [])
    patient_input.setdefault("equipment_needed", [])
    patient_input.setdefault("vitals", {})

    severity = patient_input["severity"].upper()
    if severity not in WEIGHTS:
        severity = "URGENT"

    # Normalise specialty tags
    needed_specs = normalise_specialties(patient_input["specialty_needed"])
    needed_equip = [e.lower().strip() for e in patient_input["equipment_needed"]]
    vitals       = patient_input["vitals"]
    w            = WEIGHTS[severity]

    # Load hospital data (with simulated live bed counts)
    all_hospitals = get_hospitals_with_live_beds()

    # Filter — only hospitals that can actually handle this patient
    capable = [
        h for h in all_hospitals
        if can_handle_patient(h, needed_specs, needed_equip, severity)
    ]

    # Score all capable hospitals
    scored = [
        score_hospital(h, needed_specs, needed_equip, w)
        for h in capable
    ]

    # Sort by score descending
    ranked = sorted(scored, key=lambda x: x["score"], reverse=True)

    # --- Soft reservation ---
    # Reserve an ICU bed at the top-ranked hospital for CRITICAL/URGENT,
    # general bed for STABLE. Expires in 15 mins if not confirmed.
    patient_id = patient_input.get("patient_id", "UNKNOWN")
    if ranked:
        top = ranked[0]
        resource = "icu_bed" if severity in ("CRITICAL", "URGENT") else "general_bed"
        _make_reservation(patient_id, top["hospital_id"], resource)
        ranked[0]["reservation_status"] = "tentatively_reserved"
        ranked[0]["reservation_expires_in_mins"] = RESERVATION_TTL_SECONDS // 60
        print(f"[RESERVATION] {resource} tentatively reserved at "
              f"{top['name']} for patient {patient_id} "
              f"(expires in {RESERVATION_TTL_SECONDS//60} mins)")

    # All other hospitals — no reservation
    for h in ranked[1:]:
        h["reservation_status"] = "not_reserved"

    return {
        "patient_id":            patient_input.get("patient_id", "UNKNOWN"),
        "severity":              severity,
        "vitals_critical_flag":  vitals_are_critical(vitals),
        "specialties_requested": needed_specs,
        "equipment_requested":   needed_equip,
        "matched_hospitals":     ranked,
        "total_matched":         len(ranked),
        "scoring_weights_used":  w,
    }


# ---------------------------------------------------------------------------
# PRETTY PRINT (for testing / CLI)
# ---------------------------------------------------------------------------

def print_routing_result(result: dict):
    SEP = "=" * 68
    print(f"\n{SEP}")
    print(f"  ROUTING RESULT  -  Patient {result['patient_id']}")
    print(f"  Severity        : {result['severity']}")
    print(f"  Needs (specs)   : {', '.join(result['specialties_requested']) or 'General ER'}")
    print(f"  Needs (equip)   : {', '.join(result['equipment_requested']) or 'None'}")
    print(f"  Vitals critical : {result['vitals_critical_flag']}")
    print(f"  Total matched   : {result['total_matched']} hospitals")
    print(SEP)

    for i, h in enumerate(result["matched_hospitals"], 1):
        tag = "  *  BEST MATCH" if i == 1 else f"  {i}."
        print(f"\n{tag}  [{h['hospital_id']}] {h['name']}")
        print(f"       Area          : {h['area']}")
        print(f"       GPS           : {h['lat']}, {h['lng']}")
        print(f"       Score         : {h['score']}  (Level {h['level']})")
        print(f"       Spec match    : {h['specialty_match']*100:.0f}%  |  "
              f"Equip match: {h['equipment_match']*100:.0f}%")
        print(f"       ICU beds free : {h['icu_beds_free']}  |  "
              f"Gen beds free: {h['general_beds_free']}")
        print(f"       Trauma centre : {h['trauma_center']}  |  "
              f"NABH: {h['nabh_accredited']}")

    print(f"\n  Weights used: {result['scoring_weights_used']}")
    print(f"{SEP}\n")


# ---------------------------------------------------------------------------
# TEST SCENARIOS
# ---------------------------------------------------------------------------

if __name__ == "__main__":

    print("\n" + "="*68)
    print("  SMART ROUTING ENGINE - CAPABILITY MATCHING ONLY - TEST RUNS")
    print("="*68)

    # ------------------------------------------------------------------
    # Scenario 1: CRITICAL cardiac arrest - Hinjawadi
    # ------------------------------------------------------------------
    p1 = {
        "patient_id":       "P001",
        "severity":         "CRITICAL",
        "specialty_needed": ["cardiology", "cardiac_surgery", "ICU"],
        "equipment_needed": ["ventilator", "cath_lab", "defibrillator"],
        "vitals": {"hr": 145, "bp_sys": 75, "bp_dia": 50, "spo2": 85, "gcs": 8},
    }

    # ------------------------------------------------------------------
    # Scenario 2: URGENT road accident — Kharadi
    # ------------------------------------------------------------------
    p2 = {
        "patient_id":       "P002",
        "severity":         "URGENT",
        "specialty_needed": ["orthopedics", "trauma", "general_surgeon"],
        "equipment_needed": ["CT", "blood_bank", "ventilator"],
        "vitals": {"hr": 110, "bp_sys": 95, "bp_dia": 65, "spo2": 94, "gcs": 13},
    }

    # ------------------------------------------------------------------
    # Scenario 3: STABLE nephrology — Deccan
    # ------------------------------------------------------------------
    p3 = {
        "patient_id":       "P003",
        "severity":         "STABLE",
        "specialty_needed": ["nephrology"],
        "equipment_needed": ["dialysis", "CT"],
        "vitals": {"hr": 88, "bp_sys": 135, "bp_dia": 88, "spo2": 97, "gcs": 15},
    }

    # ------------------------------------------------------------------
    # Scenario 4: Missing input — resilience test
    # ------------------------------------------------------------------
    p4 = {
        "patient_id": "P004",
        "severity":   "CRITICAL",
        # no specialty, no equipment, no vitals, no gps
    }

    for p in [p1, p2, p3, p4]:
        result = route_patient(p)
        print_routing_result(result)
