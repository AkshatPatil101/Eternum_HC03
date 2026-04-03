"""
inference.py
Accepts a single patient record dict (as would come from an EMT tablet)
and returns predictions + SHAP explanation.
"""
import numpy as np
import pandas as pd
import joblib
import shap
import os
from pytorch_tabnet.tab_model import TabNetClassifier

EMERGENCY_TYPES = [
    "cardiac", "trauma", "respiratory", "stroke_neuro",
    "sepsis", "poisoning_overdose", "obstetric", "diabetic"
]
CARE_NEED_COLS = [
    "need_icu", "need_ventilator", "need_ot",
    "need_cardiologist", "need_neurosurgeon", "need_blood_bank",
    "need_cath_lab", "need_toxicology", "need_obstetrician", "need_ct_scan",
]


class TriagePredictor:

    def __init__(self,
                 fe_path="feature_engineer.joblib",
                 xgb_path="model_xgboost.joblib",
                 lgbm_path="model_lightgbm.joblib",
                 care_path="model_care_needs.joblib",
                 weights_path="ensemble_weights.joblib"):

        self.fe          = joblib.load(fe_path)
        self.model_xgb   = joblib.load(xgb_path)
        self.model_lgbm  = joblib.load(lgbm_path)
        self.care_model  = joblib.load(care_path)
        self.weights     = joblib.load(weights_path)
        self.explainer   = shap.TreeExplainer(self.model_xgb)

    def predict(self, patient_dict: dict) -> dict:
        expected_cols = [
            "hr", "bp_sys", "bp_dia", "spo2", "rr", "gcs", "temp", "glucose",
            "pupils_unequal", "chest_pain", "sweating", "collapse",
            "road_accident", "bleeding", "breathlessness", "wheezing",
            "confusion", "drug_intake", "pregnancy", "known_diabetes",
            "ecg_abnormal"
        ]
        # Ensure all columns exist, fill with NaN if missing
        full_dict = {col: patient_dict.get(col, np.nan) for col in expected_cols}
        
        row = pd.DataFrame([full_dict])
        X   = self.fe.transform(row)


        # Ensemble probabilities (2-Model)
        p_xgb  = self.model_xgb.predict_proba(X)
        p_lgbm = self.model_lgbm.predict_proba(X)

        w = self.weights
        blended = (w["w_xgb"] * p_xgb +
                   w["w_lgbm"] * p_lgbm)
        blended = np.clip(blended, 1e-9, 1 - 1e-9)
        blended /= blended.sum(axis=1, keepdims=True)

        pred_idx  = int(np.argmax(blended[0]))
        pred_type = EMERGENCY_TYPES[pred_idx]
        confidence = float(blended[0, pred_idx])

        # Care needs (chained)
        X_aug = np.hstack([X, blended])
        care_pred = self.care_model.predict(X_aug)[0]
        care_needs = [c.replace("need_", "").upper() 
                      for c, v in zip(CARE_NEED_COLS, care_pred) if v == 1]

        # SHAP
        try:
            shap_vals = self.explainer.shap_values(X)
            feature_names = self.fe.get_feature_names()
            
            # XGBoost multiclass SHAP is typically (samples, features, classes)
            if len(shap_vals.shape) == 3:
                class_shap = shap_vals[0, :, pred_idx]
            else:
                class_shap = shap_vals[0]
                    
            top_idx = np.argsort(np.abs(class_shap))[::-1][:5]
            top_features = [
                f"{feature_names[i]} ({'+' if class_shap[i] > 0 else '-'}{abs(class_shap[i]):.2f})"
                for i in top_idx
            ]
        except:
            top_features = ["Explanation N/A"]

        # Final score
        return {
            "Type": pred_type.upper(),
            "Conf": f"{confidence*100:.1f}%",
            "Care": ", ".join(care_needs) if care_needs else "ROUTINE",
            "Features": " | ".join(top_features)
        }

if __name__ == "__main__":
    # 🧪 TEST SUITE: Standard Cases
    STANDARD_CASES = [
        ("Massive MI", "CARDIAC", {
            "hr": 115, "bp_sys": 90, "bp_dia": 60, "spo2": 92, "rr": 24, "gcs": 15,
            "chest_pain": 1, "sweating": 1, "ecg_abnormal": 1, "confusion": 0
        }),
        ("Multi-Trauma", "TRAUMA", {
            "hr": 130, "bp_sys": 80, "bp_dia": 50, "spo2": 88, "rr": 30, "gcs": 12,
            "road_accident": 1, "bleeding": 1, "collapse": 1
        }),
        ("Acute Asthma", "RESPIRATORY", {
            "hr": 105, "bp_sys": 130, "bp_dia": 85, "spo2": 82, "rr": 32, "gcs": 15,
            "breathlessness": 1, "wheezing": 1
        }),
        ("Acute Stroke", "STROKE_NEURO", {
            "hr": 85, "bp_sys": 190, "bp_dia": 110, "spo2": 98, "rr": 18, "gcs": 9,
            "pupils_unequal": 1, "confusion": 1, "collapse": 1
        }),
        ("Opioid Overdose", "POISONING_OVERDOSE", {
            "hr": 55, "bp_sys": 100, "bp_dia": 70, "spo2": 80, "rr": 6, "gcs": 6,
            "drug_intake": 1, "confusion": 1
        }),
        ("OB Hemorrhage", "OBSTETRIC", {
            "hr": 120, "bp_sys": 85, "bp_dia": 50, "pregnancy": 1, "bleeding": 1, "collapse": 1
        })
    ]

    # 🏔️ EDGE CASES: Atypical Presentations (High Difficulty)
    EDGE_CASES = [
        ("Silent MI (NSTEMI)", "CARDIAC", {
            "hr": 95, "bp_sys": 105, "bp_dia": 65, "spo2": 96, "rr": 20, "gcs": 15,
            "sweating": 1, "ecg_abnormal": 1  # No chest pain!
        }),
        ("Internal Bleeding", "TRAUMA", {
            "hr": 125, "bp_sys": 95, "bp_dia": 60, "spo2": 97, "rr": 22, 
            "road_accident": 1, "sweating": 1  # No visible bleeding!
        }),
        ("Neurogenic Shock", "TRAUMA", {
            "hr": 55, "bp_sys": 85, "bp_dia": 45, "spo2": 98, "gcs": 12,
            "road_accident": 1, "pupils_unequal": 1  # Low BP AND Low HR (Strange!)
        }),
        ("Septic Embolism", "SEPSIS", {
            "hr": 110, "bp_sys": 110, "bp_dia": 70, "temp": 39.1,
            "confusion": 1, "pupils_unequal": 1 # Looks like Stroke + Sepsis
        }),
        ("Anaphylaxis", "RESPIRATORY", {
            "hr": 130, "bp_sys": 85, "bp_dia": 50, "spo2": 88, "rr": 30,
            "breathlessness": 1, "wheezing": 1 # Respiratory + Shock
        }),
        ("Euglycemic DKA", "DIABETIC", {
            "hr": 110, "bp_sys": 115, "bp_dia": 75, "known_diabetes": 1,
            "glucose": 130, "breathlessness": 1, "confusion": 1 # Acidosis but Glucose Normal!
        }),
        ("Preeclampsia", "OBSTETRIC", {
            "hr": 95, "bp_sys": 185, "bp_dia": 115, "pregnancy": 1,
            "confusion": 1, "ecg_abnormal": 1 # OB but looks like Stroke/Cardiac
        }),
        ("Stimulant Toxicity", "POISONING_OVERDOSE", {
            "hr": 145, "bp_sys": 190, "bp_dia": 110, "temp": 38.8,
            "sweating": 1, "confusion": 1 # Overdose but looks like Sepsis/Stroke
        })
    ]

    def run_suite(title, cases):
        print(f"\n{'━'*120}")
        print(f"  ▶ {title.upper()}")
        print(f"{'━'*120}")
        print(f"{'CLINICAL CASE':<22} | {'EXPECTED':<12} | {'PREDICTED':<12} | {'CONF':<7} | {'STA'} | {'RESOURCES'}")
        print(f"{'─'*120}")
        
        predictor = TriagePredictor()
        for name, expected, patient in cases:
            res = predictor.predict(patient)
            status = "✅" if res['Type'] == expected else "❌"
            print(f"{name:<22} | {expected:<12} | {res['Type']:<12} | {res['Conf']:<7} | {status}  | {res['Care']}")
            print(f"  └─ SHAP Drivers: {res['Features']}\n")

    run_suite("Standard Clinical Scenarios", STANDARD_CASES)
    run_suite("Atypical Edge Cases (Acuity/Confusion Risks)", EDGE_CASES)

