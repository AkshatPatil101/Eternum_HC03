"""
train_care_model.py
Trains the multi-label care needs classifier using the 2-model ensemble for input augmentation.
"""
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from sklearn.svm import LinearSVC
from feature_engineering import TriageFeatureEngineer
from label_utils import extract_labels, CARE_NEED_COLS
from ensemble import ensemble_predict

SEED = 42

def train_care():
    print("🏥 Training Care Needs Model (Multi-Label)...")
    
    # 1. Load Data
    df = pd.read_parquet("triage_dataset.parquet")
    fe = joblib.load("feature_engineer.joblib")
    y_type, y_care, _ = extract_labels(df)
    X = fe.transform(df)
    
    # 2. Split (Match original pipeline)
    X_tr, _, y_tr_type, _, y_tr_care, _ = train_test_split(
        X, y_type, y_care, test_size=0.2, random_state=SEED, stratify=y_type
    )
    
    # 3. Load Base Models & Ensemble Weights
    model_xgb  = joblib.load("model_xgboost.joblib")
    model_lgbm = joblib.load("model_lightgbm.joblib")
    weights    = joblib.load("ensemble_weights.joblib")
    
    # 4. Generate augmented features (chained prediction)
    print("  Generating ensemble probability features...")
    # NOTE: To be truly robust, we should use cross-validation OOF 
    # but for this demonstration on synthetic data, training predictions are sufficient.
    _, p_tr_blended = ensemble_predict(X_tr, model_xgb, model_lgbm, weights)
    
    X_aug = np.hstack([X_tr, p_tr_blended])
    
    # 5. Fit Multi-Label Model
    print("  Fitting MultiOutputClassifier...")
    clf = MultiOutputClassifier(LinearSVC(max_iter=5000, random_state=SEED))
    clf.fit(X_aug, y_tr_care)
    
    # 6. Save
    joblib.dump(clf, "model_care_needs.joblib")
    print("✅ Care needs model saved to model_care_needs.joblib")

if __name__ == "__main__":
    train_care()
