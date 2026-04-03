"""
evaluation.py
"""
import numpy as np
import pandas as pd
from sklearn.metrics import (
    classification_report, confusion_matrix,
    log_loss, brier_score_loss
)
import shap
import matplotlib.pyplot as plt

EMERGENCY_TYPES = [
    "cardiac", "trauma", "respiratory", "stroke_neuro",
    "sepsis", "poisoning_overdose", "obstetric", "diabetic"
]


def evaluate_classification(y_true, y_pred, y_prob, label: str = "ensemble"):
    print(f"\n{'─'*60}")
    print(f"  {label.upper()} — PERFORMANCE METRICS (%)")
    print(f"{'─'*60}")
    
    # Get the report as a dictionary
    report = classification_report(y_true, y_pred, 
                                   target_names=EMERGENCY_TYPES, 
                                   output_dict=True)
    
    # Convert to DataFrame and focus on the main classes
    stats = pd.DataFrame(report).transpose()
    
    # Filter to main classes for the table
    main_classes = stats.loc[EMERGENCY_TYPES].copy()
    
    # Convert to % format
    for col in ["precision", "recall", "f1-score"]:
        main_classes[col] = (main_classes[col] * 100).map("{:.2f}%".format)
    
    # Rename columns for clarity
    main_classes.columns = ["Precision (%)", "Recall (%)", "F1 Score (%)", "Support"]
    
    print(main_classes.to_string())
    
    overall_acc = report["accuracy"] * 100
    print(f"\n  OVERALL ACCURACY: {overall_acc:.2f}%")

    ll = log_loss(y_true, y_prob)
    print(f"  Log-loss:         {ll:.4f}")

    # Expected Calibration Error (ECE) — proxy via confidence histogram
    conf = y_prob.max(axis=1)
    correct = (y_pred == y_true).astype(float)
    ece = np.mean(np.abs(conf - correct))
    print(f"  ECE proxy:        {ece:.4f}")

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    cm_df = pd.DataFrame(cm, index=EMERGENCY_TYPES, columns=EMERGENCY_TYPES)
    print("\n  Confusion Matrix (Counts):")
    print(cm_df.to_string())
    return cm_df


def evaluate_care_needs(y_true_care, y_pred_care, care_cols):
    """Per-label precision, recall, F1 for the care-need multi-label task."""
    from sklearn.metrics import precision_recall_fscore_support
    p, r, f, _ = precision_recall_fscore_support(
        y_true_care, y_pred_care, average=None
    )
    results = pd.DataFrame({
        "care_need": care_cols,
        "precision": p.round(3),
        "recall":    r.round(3),
        "f1":        f.round(3),
    })
    print("\n  CARE NEEDS — per-label metrics:")
    print(results.to_string(index=False))
    return results


def shap_analysis(model_xgb, X_val: np.ndarray,
                  feature_names: list, n_samples: int = 500):
    """SHAP summary for interpretability — uses the XGBoost model."""
    X_sub = X_val[:n_samples]
    explainer = shap.TreeExplainer(model_xgb)
    shap_values = explainer.shap_values(X_sub)   

    # Aggregate mean |SHAP| across all classes for global importance
    if isinstance(shap_values, list):
        # shap_values is a list of [n_samples, n_features] arrays
        shap_array = np.abs(np.array(shap_values)) 
        mean_abs = shap_array.mean(axis=(0, 1))
    else:
        if len(shap_values.shape) == 3:
            mean_abs = np.abs(shap_values).mean(axis=(0, 2))
        else:
            mean_abs = np.abs(shap_values).mean(axis=0)

    if len(mean_abs) != len(feature_names):
        print("⚠️ Warning: Length mismatch in SHAP. Returning empty importance.")
        return shap_values, pd.Series()

    importance = pd.Series(mean_abs, index=feature_names).sort_values(
        ascending=False
    )
    print("\n  Top 15 features by mean |SHAP|:")
    print(importance.head(15).to_string())
    return shap_values, importance
