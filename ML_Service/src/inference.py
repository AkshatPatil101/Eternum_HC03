"""
inference.py

The core TriagePredictor class that provides a real-time prediction pipeline.
Takes raw patient vitals and symptoms -> preprocesses -> ensembles models
-> identifies diagnosis -> calculates severity -> prescribes care resources.
"""

import os
import pickle
import pandas as pd
import numpy as np
import xgboost as xgb
from feature_engineering import Preprocessor, INPUT_FEATURES, SYMPTOM_COLS
from diagnosis_mappings import (
    EMERGENCY_TYPES, EMERGENCY_CONFIG,
    get_specialists, get_equipment, get_severity_tier,
    SEVERITY_TIERS, BASE_SEVERITY
)

NORMAL_RANGES = {
    "hr":      (60, 100),
    "bp_sys":  (90, 140),
    "bp_dia":  (60, 90),
    "spo2":    (95, 100),
    "rr":      (12, 20),
    "gcs":     (15, 15),
    "temp":    (36.1, 37.5),
    "glucose": (70, 140),
}

# Relative to this script inside pipeline/src
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Copying severity logic functions that were defined in synthetic data generation
# to ensure logic is locked and exactly matches data rules for consistency
def compute_vitals_derangement(row):
    total = 0.0
    count = 0
    hr = row.get("hr", np.nan)
    if not pd.isna(hr):
        if hr < 40: total += 1.0
        elif hr < 50: total += 0.7
        elif hr < 60: total += 0.3
        elif hr > 150: total += 1.0
        elif hr > 130: total += 0.7
        elif hr > 110: total += 0.4
        elif hr > 100: total += 0.15
        count += 1
    bp = row.get("bp_sys", np.nan)
    if not pd.isna(bp):
        if bp < 70: total += 1.0
        elif bp < 80: total += 0.8
        elif bp < 90: total += 0.5
        elif bp > 200: total += 0.9
        elif bp > 180: total += 0.6
        elif bp > 160: total += 0.3
        count += 1
    spo2 = row.get("spo2", np.nan)
    if not pd.isna(spo2):
        if spo2 < 80: total += 1.0
        elif spo2 < 85: total += 0.8
        elif spo2 < 90: total += 0.6
        elif spo2 < 93: total += 0.3
        elif spo2 < 95: total += 0.1
        count += 1
    gcs = row.get("gcs", np.nan)
    if not pd.isna(gcs):
        if gcs <= 5: total += 1.0
        elif gcs <= 8: total += 0.8
        elif gcs <= 10: total += 0.5
        elif gcs <= 12: total += 0.25
        elif gcs <= 14: total += 0.05
        count += 1
    rr = row.get("rr", np.nan)
    if not pd.isna(rr):
        if rr < 6 or rr > 35: total += 1.0
        elif rr < 8 or rr > 30: total += 0.7
        elif rr < 10 or rr > 25: total += 0.4
        elif rr < 12 or rr > 20: total += 0.15
        count += 1
    temp = row.get("temp", np.nan)
    if not pd.isna(temp):
        if temp < 35.0 or temp > 40.0: total += 1.0
        elif temp < 35.5 or temp > 39.5: total += 0.7
        elif temp < 36.0 or temp > 38.5: total += 0.35
        elif temp < 36.1 or temp > 37.5: total += 0.1
        count += 1
    glucose = row.get("glucose", np.nan)
    if not pd.isna(glucose):
        if glucose < 40 or glucose > 500: total += 1.0
        elif glucose < 55 or glucose > 350: total += 0.7
        elif glucose < 70 or glucose > 250: total += 0.35
        elif glucose > 140: total += 0.1
        count += 1
    return total / max(count, 1)

def compute_complication_flags(row):
    score = 0.0
    bp = row.get("bp_sys", 120)
    hr = row.get("hr", 80)
    if bp > 0:
        si = hr / bp
        if si > 1.4: score += 1.0
        elif si > 1.2: score += 0.7
        elif si > 1.0: score += 0.4
    spo2 = row.get("spo2", 97)
    rr = row.get("rr", 16)
    if spo2 < 85 and rr > 30: score += 1.0
    elif spo2 < 90 and rr > 25: score += 0.8
    elif spo2 < 90: score += 0.5
    elif rr > 30: score += 0.3
    gcs = row.get("gcs", 15)
    pupils = row.get("pupils_unequal", 0)
    if gcs <= 5 and pupils == 1: score += 1.0
    elif gcs < 9 and pupils == 1: score += 0.9
    elif gcs < 9: score += 0.7
    elif gcs < 12 and pupils == 1: score += 0.5
    elif pupils == 1: score += 0.3
    temp = row.get("temp", 37.0)
    sirs_count = 0
    if temp > 38.3 or temp < 36.0: sirs_count += 1
    if hr > 90: sirs_count += 1
    if bp < 100: sirs_count += 1
    if rr > 20: sirs_count += 1
    if sirs_count >= 3: score += 0.8
    elif sirs_count >= 2: score += 0.3
    return min(1.0, score / 3.0)

def compute_symptom_burden(row):
    active = sum(1 for s in SYMPTOM_COLS if row.get(s, 0) == 1)
    return min(1.0, active / 6.0)

def compute_age_risk(age):
    if pd.isna(age): return 0.3
    if age < 5: return 0.9
    elif age < 15: return 0.5
    elif age < 40: return 0.1
    elif age < 55: return 0.2
    elif age < 65: return 0.4
    elif age < 75: return 0.65
    else: return 0.9

def compute_severity_score(row, emergency_type):
    vitals_d = compute_vitals_derangement(row)
    base_s = BASE_SEVERITY.get(emergency_type, 50) / 100.0
    comp_f = compute_complication_flags(row)
    symp_b = compute_symptom_burden(row)
    age_r = compute_age_risk(row.get("age", 50))
    raw = (30 * vitals_d + 20 * base_s + 25 * comp_f + 15 * symp_b + 10 * age_r)
    # Add minimal deterministic adjustment to smooth mapping
    return np.clip(raw, 0, 100)

class TriagePredictor:
    def __init__(self):
        """Loads models and preprocessor upon instantiation."""
        print("Initializing TriagePredictor. Loading models...")
        
        # Load Preprocessor
        self.preprocessor = Preprocessor()
        self.preprocessor.load(os.path.join(MODELS_DIR, 'preprocessor.pkl'))
        
        # Load XGBoost
        self.xgb_model = xgb.XGBClassifier()
        self.xgb_model.load_model(os.path.join(MODELS_DIR, 'xgb_model.json'))
        
        # Load LightGBM
        with open(os.path.join(MODELS_DIR, 'lgbm_model.pkl'), 'rb') as f:
            self.lgbm_model = pickle.load(f)
            
        print("Engine Ready.")

    def run_pipeline(self, patient_dict):
        """
        Runs the full inference engine pipeline:
        1. Prepares input
        2. Diagnosis Model Ensemble
        3. Formula-based Severity Calculation
        4. Translates needs to bridge formats
        """
        # Ensure all INPUT_FEATURES are present, default to sensible values
        clean_input = {col: patient_dict.get(col, np.nan) for col in INPUT_FEATURES}
        
        # ── Compute engineered features expected by the trained XGB/LGBM models ──
        hr      = clean_input.get("hr",     80)
        bp_sys  = clean_input.get("bp_sys", 120)
        spo2    = clean_input.get("spo2",   98)
        rr      = clean_input.get("rr",     16)
        gcs     = clean_input.get("gcs",    15)
        temp    = clean_input.get("temp",   37.0)
        preg    = clean_input.get("pregnancy", 0)
        chest   = clean_input.get("chest_pain", 0)
        ecg     = clean_input.get("ecg_abnormal", 0)

        bp_safe = max(bp_sys, 1.0)
        shock_index    = hr / bp_safe
        shock_index_sq = shock_index ** 2

        # MEWS proxy (Modified Early Warning Score approximation)
        mews_proxy = 0
        if rr < 9 or rr > 30:  mews_proxy += 2
        elif rr < 14 or rr > 20: mews_proxy += 1
        if hr < 40 or hr > 130: mews_proxy += 2
        elif hr < 50 or hr > 100: mews_proxy += 1
        if bp_sys < 70: mews_proxy += 3
        elif bp_sys < 80: mews_proxy += 2
        elif bp_sys < 100: mews_proxy += 1
        if gcs < 9: mews_proxy += 3
        elif gcs < 13: mews_proxy += 1
        if temp < 35 or temp > 39.1: mews_proxy += 2

        hypoxia_flag   = 1 if spo2 < 90 else 0
        neuro_flag     = 1 if gcs < 13 else 0
        cardiac_risk   = 1 if (chest == 1 or ecg == 1) else 0
        obstetric_risk = 1 if preg == 1 else 0

        # SIRS score
        sirs_score = 0
        if temp > 38.3 or temp < 36.0: sirs_score += 1
        if hr > 90:  sirs_score += 1
        if rr > 20:  sirs_score += 1
        if bp_sys < 100: sirs_score += 1

        clean_input.update({
            "shock_index":    round(shock_index, 4),
            "shock_index_sq": round(shock_index_sq, 4),
            "mews_proxy":     mews_proxy,
            "hypoxia_flag":   hypoxia_flag,
            "neuro_flag":     neuro_flag,
            "cardiac_risk":   cardiac_risk,
            "obstetric_risk": obstetric_risk,
            "sirs_score":     sirs_score,
        })

        df_input = pd.DataFrame([clean_input])

        # ── Build the full 30-feature vector for the classifier models ────────
        # The XGB/LGBM models were trained on 30 features (23 raw + 7 engineered).
        # We bypass the saved StandardScaler (which only has 23 features) and
        # pass the pre-imputed raw values directly — tree models don't require scaling.
        XGB_FEATURES = [
            'hr', 'bp_sys', 'spo2', 'rr', 'gcs', 'temp', 'glucose',
            'pupils_unequal', 'chest_pain', 'sweating', 'collapse',
            'road_accident', 'bleeding', 'breathlessness', 'wheezing',
            'confusion', 'drug_intake', 'pregnancy', 'known_diabetes',
            'ecg_abnormal', 'age', 'gender',
            'shock_index', 'shock_index_sq', 'mews_proxy',
            'hypoxia_flag', 'neuro_flag', 'cardiac_risk', 'obstetric_risk', 'sirs_score'
        ]
        # Fill any remaining NaN with 0
        for feat in XGB_FEATURES:
            if feat not in clean_input or pd.isna(clean_input.get(feat)):
                clean_input[feat] = 0
        X_full = pd.DataFrame([{f: clean_input[f] for f in XGB_FEATURES}])

        # 2. DIAGNOSIS ENSEMBLE CLASSIFICATION
        try:
            xgb_prob  = self.xgb_model.predict_proba(X_full)[0]
            lgbm_prob = self.lgbm_model.predict_proba(X_full)[0]
        except Exception as e:
            return {"status": "error", "message": f"Classification failed: {e}"}

        
        # Merge via Simple Soft Voting
        ensemble_prob = (xgb_prob + lgbm_prob) / 2.0
        class_idx = np.argmax(ensemble_prob)
        confidence = ensemble_prob[class_idx]
        
        emergency_type = EMERGENCY_TYPES[class_idx]
        
        # 3. SEVERITY REGRESSION (FORMULA BUILD)
        # Pass the unscaled, raw data for evaluation
        severity_score = compute_severity_score(clean_input, emergency_type)
        severity_tier = get_severity_tier(severity_score)
        
        # 4. RESOURCES ALLOCATION
        gcs_val = clean_input.get("gcs", 15)
        specialists = get_specialists(emergency_type, severity_score, gcs_val)
        equipment = get_equipment(emergency_type, severity_score)
        base_hosp_tags = EMERGENCY_CONFIG[emergency_type]['hospital_specialty_tags']
        
        res = {
            "status": "success",
            "diagnosis": {
                "emergency_type": emergency_type,
                "confidence": round(float(confidence), 3)
            },
            "severity": {
                "score": round(float(severity_score), 1),
                "tier": severity_tier
            },
            "care_plan": {
                "specialists_needed": specialists,
                "equipment_needed": equipment,
                "hospital_tags_needed": base_hosp_tags
            }
        }
        return res

if __name__ == "__main__":
    # Test script locally when run directly
    print("Testing TriagePredictor Inference...")
    engine = TriagePredictor()
    
    test_patient_urgent = {
        "hr": 140, "bp_sys": 80, "spo2": 88, "gcs": 7, "temp": 40.1, 
        "confusion": 1, "age": 75, "gender": 1
    }
    
    test_patient_stable = {
        "hr": 85, "bp_sys": 125, "spo2": 98, "gcs": 15, "temp": 37.1,
        "age": 45, "gender": 0, "known_diabetes": 1
    }
    
    import json
    print("\n--- Urgent Patient ---")
    print(json.dumps(engine.run_pipeline(test_patient_urgent), indent=2))
    print("\n--- Stable Patient ---")
    print(json.dumps(engine.run_pipeline(test_patient_stable), indent=2))