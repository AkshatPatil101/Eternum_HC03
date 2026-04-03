"""
train_pipeline.py  — single entry point for the full training run
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import joblib
import os

from synthetic_data_generator import generate_dataset
from feature_engineering import TriageFeatureEngineer
from label_utils import extract_labels
from train_xgboost import train_xgboost
from train_lightgbm import train_lightgbm
from train_tabnet import train_tabnet
from ensemble import fit_ensemble_weights, ensemble_predict
from evaluation import evaluate_classification, evaluate_care_needs, shap_analysis

CARE_NEED_COLS = [
    "need_icu", "need_ventilator", "need_ot",
    "need_cardiologist", "need_neurosurgeon", "need_blood_bank",
    "need_cath_lab", "need_toxicology", "need_obstetrician", "need_ct_scan",
]

SEED = 42


def run():
    # ── 1. Data ───────────────────────────────────────────────────────────────
    df = generate_dataset(n=20_000)

    y_type, y_care, y_severity = extract_labels(df)

    # Exclude columns that shouldn't be in the model
    drop_cols = ["emergency_type", "emergency_type_label", "severity", "shock_index"] + CARE_NEED_COLS
    feature_cols = [c for c in df.columns if c not in drop_cols]
    X_raw = df[feature_cols]

    (X_tr_raw, X_tmp_raw,
     y_tr_type, y_tmp_type,
     y_tr_care, y_tmp_care) = train_test_split(
        X_raw, y_type, y_care,
        test_size=0.30, stratify=y_type, random_state=SEED
    )
    X_val_raw, X_te_raw, y_val_type, y_te_type, y_val_care, y_te_care = \
        train_test_split(
            X_tmp_raw, y_tmp_type, y_tmp_care,
            test_size=0.50, stratify=y_tmp_type, random_state=SEED
        )

    # ── 2. Feature engineering ────────────────────────────────────────────────
    fe = TriageFeatureEngineer()
    X_tr  = fe.fit_transform(X_tr_raw)
    X_val = fe.transform(X_val_raw)
    X_te  = fe.transform(X_te_raw)
    fe.save("feature_engineer.joblib")
    feature_names = fe.get_feature_names()

    # ── 3. Train base models ──────────────────────────────────────────────────
    # Note: Using small trial counts as per user preference (implied) or standard test run
    print("\n── Training XGBoost (50 trials) ──")
    model_xgb   = train_xgboost(X_tr, y_tr_type, n_trials=50, seed=SEED)

    print("\n── Training LightGBM (50 trials) ──")
    model_lgbm  = train_lightgbm(X_tr, y_tr_type, n_trials=50, seed=SEED)

    print("\n── Training TabNet (2 trials) ──")
    model_tabnet = train_tabnet(X_tr, y_tr_type, n_trials=2, seed=SEED)

    # ── 4. Bayesian ensemble weighting (on val set) ───────────────────────────
    print("\n── Fitting ensemble weights (300 trials) ──")
    p_val_xgb   = model_xgb.predict_proba(X_val)
    p_val_lgbm  = model_lgbm.predict_proba(X_val)
    p_val_tabnet = model_tabnet.predict_proba(X_val.astype("float32"))

    weights = fit_ensemble_weights(
        p_val_xgb, p_val_lgbm, p_val_tabnet,
        y_val_type, n_trials=300, seed=SEED
    )

    # ── 5. Evaluate on held-out test set ──────────────────────────────────────
    print("\n── Evaluation on test set ──")
    y_pred_type, y_prob_type = ensemble_predict(
        X_te, model_xgb, model_lgbm, model_tabnet, weights
    )
    evaluate_classification(y_te_type, y_pred_type, y_prob_type)

    # Care needs: chained prediction — append predicted type probabilities
    X_te_augmented = np.hstack([X_te, y_prob_type])
    X_tr_augmented = np.hstack([
        X_tr,
        model_xgb.predict_proba(X_tr) * weights["w_xgb"] +
        model_lgbm.predict_proba(X_tr) * weights["w_lgbm"] +
        model_tabnet.predict_proba(X_tr.astype("float32")) * weights["w_tabnet"]
    ])

    # Simple LightGBM multi-label chain for care needs
    from sklearn.multioutput import MultiOutputClassifier
    import lightgbm as lgb
    care_model = MultiOutputClassifier(
        lgb.LGBMClassifier(n_estimators=300, verbose=-1, random_state=SEED),
        n_jobs=-1
    )
    care_model.fit(X_tr_augmented, y_tr_care)
    y_pred_care = care_model.predict(X_te_augmented)
    evaluate_care_needs(y_te_care, y_pred_care, CARE_NEED_COLS)
    joblib.dump(care_model, "model_care_needs.joblib")

    # SHAP
    try:
        shap_analysis(model_xgb, X_te, feature_names)
    except Exception as e:
        print(f"SHAP analysis failed: {e}")

    print("\n── All models saved. Pipeline complete. ──")


if __name__ == "__main__":
    run()
