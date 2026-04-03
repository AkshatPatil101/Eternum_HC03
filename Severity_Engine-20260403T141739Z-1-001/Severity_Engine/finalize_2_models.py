"""
finalize_2_models.py
Orchestrates ensemble weighting and final evaluation for XGBoost + LightGBM.
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from feature_engineering import TriageFeatureEngineer
from label_utils import extract_labels, CARE_NEED_COLS
from ensemble import fit_ensemble_weights, ensemble_predict
from evaluation import evaluate_classification, evaluate_care_needs, shap_analysis

SEED = 42

def run_finalization():
    print("🔮 Finalizing 2-Model Ensemble (XGBoost + LightGBM)...")
    
    # 1. Load Data & Environment
    df = pd.read_parquet("triage_dataset.parquet")
    fe = joblib.load("feature_engineer.joblib")
    
    y_type, y_care, _ = extract_labels(df)
    X = fe.transform(df)
    
    # 2. Replicate Split
    X_tr, X_te, y_tr_type, y_te_type, y_tr_care, y_te_care = train_test_split(
        X, y_type, y_care, test_size=0.2, random_state=SEED, stratify=y_type
    )
    # Validation set for ensemble weights
    X_tr_en, X_val_en, y_tr_en, y_val_en = train_test_split(
        X_tr, y_tr_type, test_size=0.15, random_state=SEED, stratify=y_tr_type
    )
    
    # 3. Load Base Models
    print("  Loading models...")
    model_xgb  = joblib.load("model_xgboost.joblib")
    model_lgbm = joblib.load("model_lightgbm.joblib")
    
    # 4. Ensemble Weighting (on local val set)
    p_val_xgb  = model_xgb.predict_proba(X_val_en)
    p_val_lgbm = model_lgbm.predict_proba(X_val_en)
    
    print("  Optimising ensemble weights...")
    weights = fit_ensemble_weights(p_val_xgb, p_val_lgbm, y_val_en, n_trials=200, seed=SEED)
    
    # 5. Final Evaluation on Test Set
    print("\n🚀 EVALUATING ENSEMBLE ON TEST SET...")
    y_pred_te, y_prob_te = ensemble_predict(X_te, model_xgb, model_lgbm, weights)
    
    evaluate_classification(y_te_type, y_pred_te, y_prob_te, label="Final Ensemble (2-Model)")
    
    # 6. Care Needs (using ensemble as feature)
    # The original pipeline trained a MultiOutputClassifier on y_prob of ensemble.
    # For now, we'll demonstrate classification.
    # In a full run, we'd retrain the care-need model too.
    
    # 7. SHAP
    print("\n📊 RUNNING SHAP EXPLAINABILITY...")
    shap_analysis(model_xgb, X_te, fe.get_feature_names())

if __name__ == "__main__":
    run_finalization()
