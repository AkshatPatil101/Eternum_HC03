"""
label_utils.py
"""
import pandas as pd
import numpy as np

EMERGENCY_TYPES = [
    "cardiac", "trauma", "respiratory", "stroke_neuro",
    "sepsis", "poisoning_overdose", "obstetric", "diabetic"
]

CARE_NEED_COLS = [
    "need_icu", "need_ventilator", "need_ot",
    "need_cardiologist", "need_neurosurgeon", "need_blood_bank",
    "need_cath_lab", "need_toxicology", "need_obstetrician", "need_ct_scan",
]

SEVERITY_MAP = {"low": 0, "moderate": 1, "high": 2, "critical": 3}


def extract_labels(df: pd.DataFrame):
    """
    Returns
    -------
    y_type     : np.ndarray shape (n,)        — integer class 0-7
    y_care     : np.ndarray shape (n, 10)     — multi-label binary
    y_severity : np.ndarray shape (n,)        — ordinal 0-3
    """
    y_type     = df["emergency_type_label"].values.astype(int)
    y_care     = df[CARE_NEED_COLS].fillna(0).values.astype(int)
    y_severity = df["severity"].map(SEVERITY_MAP).fillna(0).values.astype(int)
    return y_type, y_care, y_severity


def class_weights(y: np.ndarray) -> dict:
    """Inverse-frequency weights for XGBoost/LightGBM sample_weight."""
    from sklearn.utils.class_weight import compute_class_weight
    classes = np.unique(y)
    weights = compute_class_weight("balanced", classes=classes, y=y)
    return dict(zip(classes, weights))
