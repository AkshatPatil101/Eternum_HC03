"""
feature_engineering.py
"""
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler
from sklearn.impute import KNNImputer
import joblib


VITAL_COLS = [
    "hr", "bp_sys", "bp_dia", "spo2", "rr",
    "gcs", "temp", "glucose",
]
SYMPTOM_COLS = [
    "pupils_unequal", "chest_pain", "sweating", "collapse",
    "road_accident", "bleeding", "breathlessness", "wheezing",
    "confusion", "drug_intake", "pregnancy", "known_diabetes",
    "ecg_abnormal",
]


class TriageFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Fit on training set (learns imputer and scaler statistics).
    Transform is deterministic given the same input.
    """

    def __init__(self):
        self.imputer = KNNImputer(n_neighbors=5, weights="distance")
        self.scaler  = StandardScaler()
        self.fitted  = False

    # ── Derived features (stateless) ─────────────────────────────────────────
    @staticmethod
    def _derive(df: pd.DataFrame) -> pd.DataFrame:
        d = df.copy()

        # Haemodynamic
        d["shock_index"]      = d["hr"] / d["bp_sys"].clip(lower=1)
        d["pulse_pressure"]   = d["bp_sys"] - d["bp_dia"]
        d["map"]              = d["bp_dia"] + d["pulse_pressure"] / 3

        # Respiratory
        d["spo2_rr_ratio"]    = d["spo2"] / d["rr"].clip(lower=1)

        # Critical pattern flags (deterministic rule encoding)
        d["flag_shock"]       = ((d["shock_index"] > 1.0) &
                                  (d["bp_sys"] < 90)).astype(int)
        d["flag_resp_fail"]   = ((d["spo2"] < 90) &
                                  (d["rr"] > 24)).astype(int)
        d["flag_neuro_risk"]  = ((d["gcs"] < 9) |
                                  (d["pupils_unequal"] == 1)).astype(int)
        d["flag_cardiac_risk"]= ((d["chest_pain"] == 1) &
                                  ((d["hr"] < 50) | (d["hr"] > 120))).astype(int)
        d["flag_sepsis"]      = (((d["temp"] > 38.3) | (d["temp"] < 36.0)) &
                                  (d["hr"] > 90) &
                                  (d["bp_sys"] < 100)).astype(int)
        d["flag_overdose"]    = ((d["gcs"] < 9) &
                                  (d["drug_intake"] == 1)).astype(int)
        d["flag_ob_hemorrhage"]= ((d["pregnancy"] == 1) &
                                   (d["bleeding"] == 1) &
                                   (d["bp_sys"] < 90)).astype(int)
        d["flag_dka_hypo"]    = ((d["known_diabetes"] == 1) &
                                  ((d["glucose"] < 60) |
                                   (d["glucose"] > 300))).astype(int)

        # Interaction terms
        d["hr_x_spo2"]        = d["hr"] * d["spo2"]
        d["gcs_x_bp"]         = d["gcs"] * d["bp_sys"]
        d["temp_x_hr"]        = d["temp"] * d["hr"]

        # SOFA proxy (simplified, no lab values)
        sofa = np.zeros(len(d))
        sofa += np.where(d["spo2"] < 90, 2, 0)
        sofa += np.where(d["map"] < 70,  2, 0)
        sofa += np.where(d["gcs"] < 13,
                         np.where(d["gcs"] < 9, 3, 1), 0)
        d["sofa_proxy"] = sofa

        # Missingness indicator features (retain info about what wasn't measured)
        for col in ["ecg_abnormal", "glucose", "bp_sys", "spo2"]:
            d[f"{col}_missing"] = d[col].isna().astype(int)

        return d

    def fit(self, X: pd.DataFrame, y=None):
        d = self._derive(X)
        num_cols = [c for c in d.columns
                    if c not in SYMPTOM_COLS and d[c].dtype != object]
        self.imputer.fit(d[num_cols])
        self.num_cols_ = num_cols
        self.scaler.fit(self.imputer.transform(d[num_cols]))
        self.fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        d = self._derive(X)
        num_vals = self.imputer.transform(d[self.num_cols_])
        num_scaled = self.scaler.transform(num_vals)

        # Symptom cols: fill missing binary with 0 (unknown = absent)
        sym = d[SYMPTOM_COLS].fillna(0).values

        return np.hstack([num_scaled, sym])

    def get_feature_names(self) -> list:
        return self.num_cols_ + SYMPTOM_COLS

    def save(self, path: str = "feature_engineer.joblib"):
        joblib.dump(self, path)

    @staticmethod
    def load(path: str = "feature_engineer.joblib"):
        return joblib.load(path)
