# ML Pipeline — Architecture & Design

> [← Back to README](../README.md)

---

## Overview

The ML Service is a **FastAPI microservice** (`ML_Service/`) that exposes a single `/triage` endpoint. Internally, it runs a four-stage inference pipeline:

```
Raw Vitals + Symptoms
        ↓
  [1] PREPROCESS      KNN Impute + StandardScale + Shock Index
        ↓
  [2] DIAGNOSE        XGBoost + LightGBM soft-vote → emergency_type
        ↓
  [3] SCORE           5-index formula → severity_score → tier
        ↓
  [4] PLAN            Specialists + Equipment + Hospital Tags
```

---

## Stage 1 — Feature Engineering & Preprocessing

**File:** `ML_Service/src/feature_engineering.py`

### Input Feature Set (22 features)

| Group | Features |
|-------|---------|
| **Vitals (7)** | `hr`, `bp_sys`, `spo2`, `rr`, `gcs`, `temp`, `glucose` |
| **Symptoms (13)** | `pupils_unequal`, `chest_pain`, `sweating`, `collapse`, `road_accident`, `bleeding`, `breathlessness`, `wheezing`, `confusion`, `drug_intake`, `pregnancy`, `known_diabetes`, `ecg_abnormal` |
| **Demographics (2)** | `age`, `gender` |
| **Derived (1)** | `shock_index` = `hr / bp_sys` |

### Preprocessing Steps (class `Preprocessor`)

1. **Symptom defaults** — Any symptom column not reported is filled with `0` (assumed absent)
2. **Shock Index** — Computed as `hr / max(bp_sys, 1)` with zero-division guard
3. **KNN Imputation** — `KNNImputer(n_neighbors=5, weights='distance')` fills missing vitals using the 5 nearest training neighbors weighted by distance
4. **Standard Scaling** — `StandardScaler` normalizes all 22 features to zero mean and unit variance
5. **Serialization** — Fitted preprocessor saved to `models/preprocessor.pkl` for identical inference-time transforms

### Training vs Inference

The `Preprocessor` class maintains separate `fit_transform()` (training) and `transform()` (inference) methods. The state is saved after training and loaded at API startup, ensuring the exact same scaling parameters are applied to incoming patient data.

---

## Stage 2 — Diagnosis Classification Ensemble

**File:** `ML_Service/src/inference.py` (class `TriagePredictor`)
**Training:** `ML_Service/src/train_models.py`

### Target Classes (8 Emergency Types)

| Index | Class | Base Severity |
|-------|-------|--------------|
| 0 | `cardiac` | 80 |
| 1 | `trauma` | 75 |
| 2 | `respiratory` | 65 |
| 3 | `stroke_neuro` | 78 |
| 4 | `sepsis` | 70 |
| 5 | `poisoning_overdose` | 60 |
| 6 | `obstetric` | 72 |
| 7 | `diabetic` | 50 |

### Model 1 — XGBoost Classifier

```python
XGBClassifier(
    objective='multi:softprob',
    num_class=8,
    learning_rate=0.05,
    max_depth=6,
    n_estimators=300,
    tree_method='hist',        # GPU-accelerated with CUDA fallback
    eval_metric='mlogloss',
    random_state=42
)
```

- Serialized as `models/xgb_model.json` using XGBoost native format
- GPU training attempted first; falls back to CPU automatically

### Model 2 — LightGBM Classifier

```python
LGBMClassifier(
    objective='multiclass',
    num_class=8,
    learning_rate=0.05,
    max_depth=6,
    n_estimators=300,
    random_state=42,
    class_weight='balanced'    # Handles class imbalance across emergency types
)
```

- Serialized as `models/lgbm_model.pkl` via pickle

### Ensemble — Soft Voting

```python
xgb_prob   = xgb_model.predict_proba(X_proc)[0]   # shape: (8,)
lgbm_prob  = lgbm_model.predict_proba(X_proc)[0]  # shape: (8,)

ensemble_prob = (xgb_prob + lgbm_prob) / 2.0       # equal weight average
class_idx     = np.argmax(ensemble_prob)
confidence    = ensemble_prob[class_idx]
emergency_type = EMERGENCY_TYPES[class_idx]
```

Equal-weight soft voting averages the probability distributions from both models before taking the argmax. This reduces individual model variance and improves calibration on rare emergency types.

---

## Stage 3 — Severity Scoring Formula

**File:** `ML_Service/src/inference.py`

The severity score is a **deterministic formula** (not ML) — it uses patient vitals directly to compute a 0–100 score. This design choice ensures:
- Predictable, auditable results (no black box)
- Consistency with the training data generation rules
- Fast computation with no additional model load

### Formula

```
severity_score = clip(
    30 × VitalsDerangement
  + 20 × BaseSeverity
  + 25 × ComplicationFlags
  + 15 × SymptomBurden
  + 10 × AgeRisk,
  min=0, max=100
)
```

### Component Breakdown

#### Vitals Derangement (weight: 30%)
Graded penalty per vital, averaged across available vitals:

| Vital | Penalty Thresholds |
|-------|-------------------|
| `hr` | < 40 → 1.0 \| < 60 → 0.3 \| > 110 → 0.4 \| > 150 → 1.0 |
| `bp_sys` | < 70 → 1.0 \| < 90 → 0.5 \| > 160 → 0.3 \| > 200 → 0.9 |
| `spo2` | < 80 → 1.0 \| < 90 → 0.6 \| < 95 → 0.1 |
| `gcs` | ≤ 5 → 1.0 \| ≤ 8 → 0.8 \| ≤ 12 → 0.25 |
| `rr` | < 6 or > 35 → 1.0 \| < 10 or > 25 → 0.4 |
| `temp` | < 35.0 or > 40.0 → 1.0 \| < 36.0 or > 38.5 → 0.35 |
| `glucose` | < 40 or > 500 → 1.0 \| < 70 or > 250 → 0.35 |

#### Base Severity (weight: 20%)
Emergency-type specific prior severity (`BASE_SEVERITY[emergency_type] / 100`). Cardiac = 0.80, Stroke = 0.78, Trauma = 0.75, etc.

#### Complication Flags (weight: 25%)
Composite of four clinical danger signals, capped at 1.0:

| Signal | Logic |
|--------|-------|
| **Shock Index** | `hr / bp_sys` > 1.4 → +1.0 \| > 1.0 → +0.4 |
| **Respiratory Failure** | `spo2 < 85 and rr > 30` → +1.0 \| `spo2 < 90` → +0.5 |
| **Neuro Crisis** | `gcs ≤ 5 and pupils_unequal` → +1.0 \| `gcs < 9` → +0.7 |
| **SIRS Criteria** | Count of: temp abnormal, hr > 90, bp < 100, rr > 20 — ≥3 met → +0.8 |

#### Symptom Burden (weight: 15%)
`min(1.0, active_symptom_count / 6.0)` — saturates at 6 active symptoms

#### Age Risk (weight: 10%)
| Age Range | Risk Score |
|-----------|-----------|
| < 5 | 0.9 |
| 5–14 | 0.5 |
| 15–39 | 0.1 |
| 40–54 | 0.2 |
| 55–64 | 0.4 |
| 65–74 | 0.65 |
| ≥ 75 | 0.9 |

### Severity Tiers

| Score | Tier |
|-------|------|
| ≥ 50 | `CRITICAL` |
| 35–49 | `URGENT` |
| < 35 | `STABLE` |

---

## Stage 4 — Care Plan Generation

**File:** `ML_Service/src/diagnosis_mappings.py`

Based on `emergency_type` and `severity_score`, the system prescribes:

### Specialist Assignment

```python
specialists = base_specialists
if severity_score >= 45:
    specialists += severe_specialists
if emergency_type == "trauma" and gcs < 9:
    specialists += ["Neurosurgeon"]
```

### Equipment Assignment

```python
equipment = base_equipment
if severity_score >= 45:
    equipment += equipment_severe
```

### Emergency Config Table

| Emergency | Base Specialists | Severe Specialists | Base Equipment | Severe Equipment | Hospital Tags |
|-----------|-----------------|-------------------|----------------|-----------------|---------------|
| `cardiac` | Cardiologist | Interventional Cardiologist, Cardiac Surgeon | ecg, defibrillator, cath_lab, ventilator | ecmo | cardiology, cardiac_surgery, ICU, CCU |
| `trauma` | Trauma Surgeon, General Surgeon | Neurosurgeon, Spine Surgeon | CT, blood_bank, ventilator | MRI | general_surgeon, orthopedics, ICU |
| `respiratory` | Pulmonologist | Intensivist, Thoracic Surgeon | ventilator | ecmo | ICU |
| `stroke_neuro` | Neurologist | Neurosurgeon, INR Specialist | CT, MRI | ventilator | neurology, neurosurgery, ICU |
| `sepsis` | Intensivist | Infectious Disease Specialist | ventilator | dialysis | ICU |
| `poisoning_overdose` | Emergency Physician | Toxicologist, Intensivist | ventilator | dialysis | ICU |
| `obstetric` | Obstetrician | Anesthesiologist, MFM Specialist | blood_bank | ventilator | gynecology, ICU |
| `diabetic` | Emergency Physician | Endocrinologist, Intensivist | — | ventilator | ICU |

---

## Model Files

| File | Size | Format | Notes |
|------|------|--------|-------|
| `models/xgb_model.json` | ~5.1 MB | XGBoost native JSON | CPU/GPU portable |
| `models/lgbm_model.pkl` | ~8.1 MB | pickle | sklearn API |
| `models/preprocessor.pkl` | ~3.3 MB | pickle | KNNImputer + StandardScaler state |

---

> 📖 **[Routing Engine Details →](routing-engine.md)**
> 📖 **[API Reference →](api-reference.md)**
