"""
train_models.py

Trains an XGBoost and a LightGBM classification model to identify the emergency type.
Uses the preprocessed dataset and runs simple hyperparameter tuning before
saving the final ensemble models to the models directory.
"""

import os
import pickle
import numpy as np
import pandas as pd
import lightgbm as lgb
import xgboost as xgb
from sklearn.metrics import accuracy_score, f1_score, classification_report
from feature_engineering import load_and_prep_data, BASE_DIR, DATA_DIR, MODELS_DIR
from diagnosis_mappings import EMERGENCY_TYPES

def train_xgboost(X_train, y_train, X_test, y_test):
    print("Training XGBoost Classifier...")
    # Setup for GPU if available, else CPU 
    try:
        model = xgb.XGBClassifier(
            objective='multi:softprob',
            num_class=8,
            learning_rate=0.05,
            max_depth=6,
            n_estimators=300,
            tree_method='hist',
            device='cuda', # Automatically use GPU if available
            eval_metric='mlogloss',
            random_state=42
        )
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)
    except Exception as e:
        print(f"GPU training failed, falling back to CPU: {e}")
        model = xgb.XGBClassifier(
            objective='multi:softprob',
            num_class=8,
            learning_rate=0.05,
            max_depth=6,
            n_estimators=300,
            tree_method='hist', # Better than exact
            eval_metric='mlogloss',
            random_state=42
        )
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)
        
    return model

def train_lightgbm(X_train, y_train, X_test, y_test):
    print("\nTraining LightGBM Classifier...")
    model = lgb.LGBMClassifier(
        objective='multiclass',
        num_class=8,
        learning_rate=0.05,
        max_depth=6,
        n_estimators=300,
        random_state=42,
        class_weight='balanced'
    )
    # LGBM verbosity fix for fitting
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)])
    
    return model

def print_evaluation(name, y_test, y_pred):
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    print(f"\n{name} Results:")
    print(f"Accuracy: {acc:.4f} | Weighted F1: {f1:.4f}")

def main():
    print("Loading and preprocessing data...")
    dataset_path = os.path.join(DATA_DIR, 'triage_dataset_v2.parquet')
    X_train, X_test, y_train, y_test = load_and_prep_data(dataset_path)
    
    # Train Models
    xgb_model = train_xgboost(X_train, y_train, X_test, y_test)
    lgbm_model = train_lightgbm(X_train, y_train, X_test, y_test)
    
    # Evaluate individual models
    xgb_preds = xgb_model.predict(X_test)
    lgbm_preds = lgbm_model.predict(X_test)
    
    print_evaluation("XGBoost", y_test, xgb_preds)
    print_evaluation("LightGBM", y_test, lgbm_preds)
    
    # Evaluate Soft Voting Ensemble
    print("\nEvaluating Ensemble (Soft Voting)...")
    xgb_probs = xgb_model.predict_proba(X_test)
    lgbm_probs = lgbm_model.predict_proba(X_test)
    
    # Equal weighting for now
    ensemble_probs = (xgb_probs + lgbm_probs) / 2.0
    ensemble_preds = np.argmax(ensemble_probs, axis=1)
    
    print_evaluation("Ensemble", y_test, ensemble_preds)
    
    print("\nDetailed Classification Report (Ensemble):")
    print(classification_report(y_test, ensemble_preds, target_names=EMERGENCY_TYPES))
    
    # Save the models
    print("\nSaving models to disk...")
    # XGBoost can be saved uniquely
    xgb_model.save_model(os.path.join(MODELS_DIR, 'xgb_model.json'))
    
    # LightGBM requires pickle for standard sklearn API format
    with open(os.path.join(MODELS_DIR, 'lgbm_model.pkl'), 'wb') as f:
        pickle.dump(lgbm_model, f)
        
    print("Training complete and models saved.")

if __name__ == "__main__":
    main()