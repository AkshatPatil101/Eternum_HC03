"""
synthetic_data_generator.py  (v2 -- MIMIC-calibrated, balanced, with age/gender/severity)

Generates a balanced dataset of 40,000 emergency triage records (5,000 per type)
with MIMIC-IV calibrated vital sign distributions, age, gender, continuous severity
score (0-100), specialist doctor assignment, and required equipment.
"""

import numpy as np
import pandas as pd
import json
import os
from diagnosis_mappings import (
    EMERGENCY_CONFIG, EMERGENCY_TYPES, CARE_NEED_COLS,
    get_specialists, get_equipment, get_severity_tier,
)

np.random.seed(42)

N_PER_TYPE = 2_500   # balanced: 2500 per emergency type
N_TOTAL = N_PER_TYPE * len(EMERGENCY_TYPES)  # 20,000

# ── Load MIMIC calibration if available ──
CALIBRATION_PATH = os.path.join(os.path.dirname(__file__), "mimic_calibration.json")
MIMIC_CAL = {}
if os.path.exists(CALIBRATION_PATH):
    with open(CALIBRATION_PATH) as f:
        MIMIC_CAL = json.load(f)
    print("  MIMIC calibration loaded.")
else:
    print("  WARNING: No MIMIC calibration found. Using clinical defaults only.")


def clamp(x, lo, hi):
    return np.clip(x, lo, hi)


def mimic_param(etype, vital, default_mean, default_std):
    """Get mean/std from MIMIC calibration, falling back to clinical defaults."""
    if etype in MIMIC_CAL and vital in MIMIC_CAL[etype]:
        cal = MIMIC_CAL[etype][vital]
        # Blend: 60% clinical default + 40% MIMIC (MIMIC is small demo data)
        mean = 0.6 * default_mean + 0.4 * cal["mean"]
        std = 0.6 * default_std + 0.4 * cal["std"]
        return mean, std
    return default_mean, default_std


# ── Age/Gender generation per type ──
AGE_CONFIG = {
    "cardiac":            {"mean": 62, "std": 12, "min": 30, "max": 95, "male_ratio": 0.65},
    "trauma":             {"mean": 35, "std": 15, "min": 5,  "max": 80, "male_ratio": 0.70},
    "respiratory":        {"mean": 55, "std": 18, "min": 5,  "max": 90, "male_ratio": 0.55},
    "stroke_neuro":       {"mean": 65, "std": 14, "min": 20, "max": 95, "male_ratio": 0.55},
    "sepsis":             {"mean": 58, "std": 16, "min": 10, "max": 90, "male_ratio": 0.52},
    "poisoning_overdose": {"mean": 32, "std": 14, "min": 14, "max": 70, "male_ratio": 0.60},
    "obstetric":          {"mean": 28, "std": 6,  "min": 16, "max": 45, "male_ratio": 0.0},
    "diabetic":           {"mean": 52, "std": 18, "min": 10, "max": 90, "male_ratio": 0.55},
}


def sample_demographics(etype, n):
    cfg = AGE_CONFIG[etype]
    # Override with MIMIC if available
    if "age" in MIMIC_CAL and etype in MIMIC_CAL["age"]:
        age_mean = 0.6 * cfg["mean"] + 0.4 * MIMIC_CAL["age"][etype]["mean"]
        age_std = 0.6 * cfg["std"] + 0.4 * MIMIC_CAL["age"][etype]["std"]
    else:
        age_mean, age_std = cfg["mean"], cfg["std"]

    if "gender" in MIMIC_CAL and etype in MIMIC_CAL["gender"]:
        male_ratio = 0.6 * cfg["male_ratio"] + 0.4 * MIMIC_CAL["gender"][etype]["male_ratio"]
    else:
        male_ratio = cfg["male_ratio"]

    age = clamp(np.random.normal(age_mean, age_std, n), cfg["min"], cfg["max"]).astype(int)
    gender = np.random.choice([0, 1], n, p=[1 - male_ratio, male_ratio])  # 0=F, 1=M
    return age, gender


# ═══════════════════════════════════════════════════════════════════════
#  PER-TYPE VITAL SIGN SAMPLERS (MIMIC-calibrated)
# ═══════════════════════════════════════════════════════════════════════

def sample_cardiac(n):
    """MI / arrest. HR irregular, BP low or high, chest pain."""
    m_hr, s_hr = mimic_param("cardiac", "heart_rate", 95, 28)
    hr_choices = np.stack([
        np.random.normal(42, 8, n),          # bradycardic (arrest)
        np.random.normal(m_hr + 20, s_hr, n), # tachycardic
        np.random.normal(m_hr - 10, 15, n),   # near-normal
    ], axis=1)
    choice_idx = np.random.choice([0, 1, 2], size=n, p=[0.15, 0.45, 0.40])
    hr = hr_choices[np.arange(n), choice_idx]

    m_bp, s_bp = mimic_param("cardiac", "bp_sys", 120, 30)
    bp_sys = np.where(choice_idx == 0,
                      np.random.normal(68, 12, n),
                      np.random.normal(m_bp + 30, s_bp, n))
    bp_dia = bp_sys * np.random.uniform(0.55, 0.68, n)

    m_spo2, s_spo2 = mimic_param("cardiac", "spo2", 91, 6)
    spo2 = clamp(np.random.normal(m_spo2, s_spo2, n), 60, 100)

    m_rr, s_rr = mimic_param("cardiac", "resp_rate", 22, 6)
    rr = clamp(np.random.normal(m_rr, s_rr, n), 6, 45)

    gcs = np.where(choice_idx == 0,
                   np.random.choice([3, 4, 5], n),
                   np.random.randint(12, 16, n))

    m_temp, s_temp = mimic_param("cardiac", "temp_c", 36.8, 0.5)
    temp = np.random.normal(m_temp, s_temp, n)

    m_gluc, s_gluc = mimic_param("cardiac", "glucose", 140, 40)
    glucose = np.random.normal(m_gluc, s_gluc, n)

    pupils_unequal = np.random.choice([0, 1], n, p=[0.9, 0.1])
    chest_pain     = np.random.choice([0, 1], n, p=[0.05, 0.95])
    sweating       = np.random.choice([0, 1], n, p=[0.15, 0.85])
    collapse       = (choice_idx == 0).astype(int)
    road_accident  = np.zeros(n, int)
    bleeding       = np.zeros(n, int)
    breathlessness = np.random.choice([0, 1], n, p=[0.40, 0.60])
    wheezing       = np.zeros(n, int)
    confusion      = np.random.choice([0, 1], n, p=[0.70, 0.30])
    drug_intake    = np.zeros(n, int)
    pregnancy      = np.zeros(n, int)
    known_diabetes = np.random.choice([0, 1], n, p=[0.70, 0.30])
    ecg_abnormal   = np.random.choice([0, 1], n, p=[0.10, 0.90])
    return locals()


def sample_trauma(n):
    m_hr, s_hr = mimic_param("trauma", "heart_rate", 118, 22)
    hr     = clamp(np.random.normal(m_hr, s_hr, n), 40, 180)

    m_bp, s_bp = mimic_param("trauma", "bp_sys", 88, 22)
    bp_sys = clamp(np.random.normal(m_bp, s_bp, n), 40, 180)
    bp_dia = bp_sys * np.random.uniform(0.55, 0.68, n)

    m_spo2, s_spo2 = mimic_param("trauma", "spo2", 94, 5)
    spo2   = clamp(np.random.normal(m_spo2, s_spo2, n), 60, 100)

    m_rr, s_rr = mimic_param("trauma", "resp_rate", 24, 6)
    rr     = clamp(np.random.normal(m_rr, s_rr, n), 6, 45)

    m_gcs, s_gcs = mimic_param("trauma", "gcs", 10, 4)
    gcs    = clamp(np.random.normal(m_gcs, s_gcs, n), 3, 15).astype(int)

    m_temp, s_temp = mimic_param("trauma", "temp_c", 36.5, 0.8)
    temp   = np.random.normal(m_temp, s_temp, n)

    m_gluc, s_gluc = mimic_param("trauma", "glucose", 120, 30)
    glucose = np.random.normal(m_gluc, s_gluc, n)

    pupils_unequal = np.where(gcs < 9,
                              np.random.choice([0, 1], n, p=[0.4, 0.6]),
                              np.zeros(n, int))
    chest_pain  = np.random.choice([0, 1], n, p=[0.60, 0.40])
    sweating    = np.random.choice([0, 1], n, p=[0.30, 0.70])
    collapse    = np.random.choice([0, 1], n, p=[0.40, 0.60])
    road_accident = np.random.choice([0, 1], n, p=[0.10, 0.90])
    bleeding    = np.random.choice([0, 1], n, p=[0.15, 0.85])
    breathlessness = np.random.choice([0, 1], n, p=[0.50, 0.50])
    wheezing    = np.zeros(n, int)
    confusion   = np.where(gcs < 10, np.ones(n, int), np.zeros(n, int))
    drug_intake = np.zeros(n, int)
    pregnancy   = np.zeros(n, int)
    known_diabetes = np.zeros(n, int)
    ecg_abnormal = np.random.choice([0, 1], n, p=[0.80, 0.20])
    return locals()


def sample_respiratory(n):
    m_hr, s_hr = mimic_param("respiratory", "heart_rate", 108, 18)
    hr     = clamp(np.random.normal(m_hr, s_hr, n), 40, 180)

    m_bp, s_bp = mimic_param("respiratory", "bp_sys", 130, 20)
    bp_sys = clamp(np.random.normal(m_bp, s_bp, n), 60, 210)
    bp_dia = bp_sys * np.random.uniform(0.55, 0.68, n)

    m_spo2, s_spo2 = mimic_param("respiratory", "spo2", 83, 7)
    spo2   = clamp(np.random.normal(m_spo2, s_spo2, n), 55, 100)  # critically low

    m_rr, s_rr = mimic_param("respiratory", "resp_rate", 30, 8)
    rr     = clamp(np.random.normal(m_rr, s_rr, n), 6, 55)

    m_gcs, s_gcs = mimic_param("respiratory", "gcs", 13, 2)
    gcs    = clamp(np.random.normal(m_gcs, s_gcs, n), 3, 15).astype(int)

    m_temp, s_temp = mimic_param("respiratory", "temp_c", 37.2, 0.8)
    temp   = np.random.normal(m_temp, s_temp, n)

    m_gluc, s_gluc = mimic_param("respiratory", "glucose", 110, 25)
    glucose = np.random.normal(m_gluc, s_gluc, n)

    pupils_unequal = np.zeros(n, int)
    chest_pain  = np.random.choice([0, 1], n, p=[0.50, 0.50])
    sweating    = np.random.choice([0, 1], n, p=[0.40, 0.60])
    collapse    = np.random.choice([0, 1], n, p=[0.70, 0.30])
    road_accident = np.zeros(n, int)
    bleeding    = np.zeros(n, int)
    breathlessness = np.ones(n, int)
    wheezing    = np.random.choice([0, 1], n, p=[0.25, 0.75])
    confusion   = np.random.choice([0, 1], n, p=[0.60, 0.40])
    drug_intake = np.zeros(n, int)
    pregnancy   = np.zeros(n, int)
    known_diabetes = np.zeros(n, int)
    ecg_abnormal = np.random.choice([0, 1], n, p=[0.70, 0.30])
    return locals()


def sample_stroke_neuro(n):
    m_hr, s_hr = mimic_param("stroke_neuro", "heart_rate", 88, 18)
    hr     = clamp(np.random.normal(m_hr, s_hr, n), 40, 160)

    m_bp, s_bp = mimic_param("stroke_neuro", "bp_sys", 175, 30)
    bp_sys = clamp(np.random.normal(m_bp, s_bp, n), 80, 260)  # hypertensive
    bp_dia = bp_sys * np.random.uniform(0.55, 0.68, n)

    m_spo2, s_spo2 = mimic_param("stroke_neuro", "spo2", 94, 5)
    spo2   = clamp(np.random.normal(m_spo2, s_spo2, n), 70, 100)

    m_rr, s_rr = mimic_param("stroke_neuro", "resp_rate", 18, 5)
    rr     = clamp(np.random.normal(m_rr, s_rr, n), 6, 40)

    m_gcs, s_gcs = mimic_param("stroke_neuro", "gcs", 9, 4)
    gcs    = clamp(np.random.normal(m_gcs, s_gcs, n), 3, 15).astype(int)

    m_temp, s_temp = mimic_param("stroke_neuro", "temp_c", 37.0, 0.7)
    temp   = np.random.normal(m_temp, s_temp, n)

    m_gluc, s_gluc = mimic_param("stroke_neuro", "glucose", 130, 35)
    glucose = np.random.normal(m_gluc, s_gluc, n)

    pupils_unequal = np.where(gcs < 10,
                              np.random.choice([0, 1], n, p=[0.20, 0.80]),
                              np.random.choice([0, 1], n, p=[0.70, 0.30]))
    chest_pain  = np.zeros(n, int)
    sweating    = np.random.choice([0, 1], n, p=[0.60, 0.40])
    collapse    = np.random.choice([0, 1], n, p=[0.30, 0.70])
    road_accident = np.zeros(n, int)
    bleeding    = np.zeros(n, int)
    breathlessness = np.random.choice([0, 1], n, p=[0.60, 0.40])
    wheezing    = np.zeros(n, int)
    confusion   = np.random.choice([0, 1], n, p=[0.20, 0.80])
    drug_intake = np.zeros(n, int)
    pregnancy   = np.zeros(n, int)
    known_diabetes = np.zeros(n, int)
    ecg_abnormal = np.random.choice([0, 1], n, p=[0.60, 0.40])
    return locals()


def sample_sepsis(n):
    temp_low  = np.random.normal(35.2, 0.6, n)
    temp_high = np.random.normal(39.5, 0.8, n)
    temp_mask = np.random.choice([0, 1], n, p=[0.30, 0.70])
    temp = np.where(temp_mask == 1, temp_high, temp_low)

    m_hr, s_hr = mimic_param("sepsis", "heart_rate", 118, 22)
    hr     = clamp(np.random.normal(m_hr, s_hr, n), 40, 200)

    m_bp, s_bp = mimic_param("sepsis", "bp_sys", 82, 18)
    bp_sys = clamp(np.random.normal(m_bp, s_bp, n), 40, 160)
    bp_dia = bp_sys * np.random.uniform(0.55, 0.68, n)

    m_spo2, s_spo2 = mimic_param("sepsis", "spo2", 91, 7)
    spo2   = clamp(np.random.normal(m_spo2, s_spo2, n), 60, 100)

    m_rr, s_rr = mimic_param("sepsis", "resp_rate", 26, 6)
    rr     = clamp(np.random.normal(m_rr, s_rr, n), 6, 50)

    m_gcs, s_gcs = mimic_param("sepsis", "gcs", 11, 3)
    gcs    = clamp(np.random.normal(m_gcs, s_gcs, n), 3, 15).astype(int)

    m_gluc, s_gluc = mimic_param("sepsis", "glucose", 155, 50)
    glucose = clamp(np.random.normal(m_gluc, s_gluc, n), 40, 400)

    pupils_unequal = np.zeros(n, int)
    chest_pain  = np.zeros(n, int)
    sweating    = np.random.choice([0, 1], n, p=[0.30, 0.70])
    collapse    = np.random.choice([0, 1], n, p=[0.50, 0.50])
    road_accident = np.zeros(n, int)
    bleeding    = np.zeros(n, int)
    breathlessness = np.random.choice([0, 1], n, p=[0.40, 0.60])
    wheezing    = np.zeros(n, int)
    confusion   = np.random.choice([0, 1], n, p=[0.30, 0.70])
    drug_intake = np.zeros(n, int)
    pregnancy   = np.zeros(n, int)
    known_diabetes = np.random.choice([0, 1], n, p=[0.50, 0.50])
    ecg_abnormal = np.random.choice([0, 1], n, p=[0.70, 0.30])
    return locals()


def sample_poisoning(n):
    m_hr, s_hr = mimic_param("poisoning_overdose", "heart_rate", 58, 25)
    hr     = clamp(np.random.normal(m_hr, s_hr, n), 20, 160)

    m_bp, s_bp = mimic_param("poisoning_overdose", "bp_sys", 90, 20)
    bp_sys = clamp(np.random.normal(m_bp, s_bp, n), 40, 170)
    bp_dia = bp_sys * np.random.uniform(0.55, 0.68, n)

    m_spo2, s_spo2 = mimic_param("poisoning_overdose", "spo2", 87, 9)
    spo2   = clamp(np.random.normal(m_spo2, s_spo2, n), 55, 100)

    m_rr, s_rr = mimic_param("poisoning_overdose", "resp_rate", 10, 5)
    rr     = clamp(np.random.normal(m_rr, s_rr, n), 2, 35)  # depressed breathing

    m_gcs, s_gcs = mimic_param("poisoning_overdose", "gcs", 7, 4)
    gcs    = clamp(np.random.normal(m_gcs, s_gcs, n), 3, 15).astype(int)

    m_temp, s_temp = mimic_param("poisoning_overdose", "temp_c", 36.3, 1.0)
    temp   = np.random.normal(m_temp, s_temp, n)

    m_gluc, s_gluc = mimic_param("poisoning_overdose", "glucose", 105, 30)
    glucose = np.random.normal(m_gluc, s_gluc, n)

    pupils_unequal = np.random.choice([0, 1], n, p=[0.50, 0.50])
    chest_pain  = np.zeros(n, int)
    sweating    = np.random.choice([0, 1], n, p=[0.40, 0.60])
    collapse    = np.random.choice([0, 1], n, p=[0.20, 0.80])
    road_accident = np.zeros(n, int)
    bleeding    = np.zeros(n, int)
    breathlessness = np.random.choice([0, 1], n, p=[0.30, 0.70])
    wheezing    = np.zeros(n, int)
    confusion   = np.random.choice([0, 1], n, p=[0.10, 0.90])
    drug_intake = np.ones(n, int)
    pregnancy   = np.zeros(n, int)
    known_diabetes = np.zeros(n, int)
    ecg_abnormal = np.random.choice([0, 1], n, p=[0.60, 0.40])
    return locals()


def sample_obstetric(n):
    m_hr, s_hr = mimic_param("obstetric", "heart_rate", 112, 20)
    hr     = clamp(np.random.normal(m_hr if "obstetric" in MIMIC_CAL else 112, 20, n), 60, 180)

    m_bp, s_bp = mimic_param("obstetric", "bp_sys", 95, 22)
    bp_sys = clamp(np.random.normal(95, 22, n), 50, 180)
    bp_dia = bp_sys * np.random.uniform(0.55, 0.68, n)

    spo2   = clamp(np.random.normal(96, 4, n), 78, 100)
    rr     = clamp(np.random.normal(22, 5, n), 10, 40)
    gcs    = clamp(np.random.normal(13, 2, n), 3, 15).astype(int)
    temp   = np.random.normal(37.1, 0.7, n)
    glucose = np.random.normal(115, 25, n)

    pupils_unequal = np.zeros(n, int)
    chest_pain  = np.zeros(n, int)
    sweating    = np.random.choice([0, 1], n, p=[0.40, 0.60])
    collapse    = np.random.choice([0, 1], n, p=[0.40, 0.60])
    road_accident = np.zeros(n, int)
    bleeding    = np.random.choice([0, 1], n, p=[0.05, 0.95])
    breathlessness = np.random.choice([0, 1], n, p=[0.60, 0.40])
    wheezing    = np.zeros(n, int)
    confusion   = np.random.choice([0, 1], n, p=[0.70, 0.30])
    drug_intake = np.zeros(n, int)
    pregnancy   = np.ones(n, int)
    known_diabetes = np.random.choice([0, 1], n, p=[0.80, 0.20])
    ecg_abnormal = np.random.choice([0, 1], n, p=[0.80, 0.20])
    return locals()


def sample_diabetic(n):
    glucose_low  = clamp(np.random.normal(38, 10, n), 10, 70)   # hypoglycemia
    glucose_high = clamp(np.random.normal(420, 80, n), 250, 700) # hyperglycemia/DKA
    glucose_mask = np.random.choice([0, 1], n, p=[0.45, 0.55])
    glucose = np.where(glucose_mask == 1, glucose_high, glucose_low)

    m_hr, s_hr = mimic_param("diabetic", "heart_rate", 105, 20)
    hr     = clamp(np.random.normal(m_hr, s_hr, n), 40, 170)

    m_bp, s_bp = mimic_param("diabetic", "bp_sys", 105, 25)
    bp_sys = clamp(np.random.normal(m_bp, s_bp, n), 50, 200)
    bp_dia = bp_sys * np.random.uniform(0.55, 0.68, n)

    m_spo2, s_spo2 = mimic_param("diabetic", "spo2", 95, 4)
    spo2   = clamp(np.random.normal(m_spo2, s_spo2, n), 75, 100)

    m_rr, s_rr = mimic_param("diabetic", "resp_rate", 20, 6)
    rr     = clamp(np.random.normal(m_rr, s_rr, n), 6, 42)

    m_gcs, s_gcs = mimic_param("diabetic", "gcs", 10, 4)
    gcs    = clamp(np.random.normal(m_gcs, s_gcs, n), 3, 15).astype(int)

    temp   = np.random.normal(36.9, 0.7, n)

    pupils_unequal = np.zeros(n, int)
    chest_pain  = np.random.choice([0, 1], n, p=[0.70, 0.30])
    sweating    = np.where(glucose_mask == 0,
                           np.ones(n, int),   # hypo -> sweating
                           np.random.choice([0, 1], n, p=[0.60, 0.40]))
    collapse    = np.random.choice([0, 1], n, p=[0.40, 0.60])
    road_accident = np.zeros(n, int)
    bleeding    = np.zeros(n, int)
    breathlessness = np.random.choice([0, 1], n, p=[0.60, 0.40])
    wheezing    = np.zeros(n, int)
    confusion   = np.where(gcs < 10, np.ones(n, int),
                           np.random.choice([0, 1], n, p=[0.50, 0.50]))
    drug_intake = np.zeros(n, int)
    pregnancy   = np.zeros(n, int)
    known_diabetes = np.ones(n, int)
    ecg_abnormal = np.random.choice([0, 1], n, p=[0.60, 0.40])
    return locals()


SAMPLERS = {
    "cardiac":            sample_cardiac,
    "trauma":             sample_trauma,
    "respiratory":        sample_respiratory,
    "stroke_neuro":       sample_stroke_neuro,
    "sepsis":             sample_sepsis,
    "poisoning_overdose": sample_poisoning,
    "obstetric":          sample_obstetric,
    "diabetic":           sample_diabetic,
}

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
EXCLUDE = {"n", "locals"}


# ═══════════════════════════════════════════════════════════════════════
#  SEVERITY SCORE CALCULATION (continuous 0-100)
# ═══════════════════════════════════════════════════════════════════════

# Normal reference ranges for vitals derangement scoring
NORMAL_RANGES = {
    "hr":      (60, 100),
    "bp_sys":  (90, 140),
    "bp_dia":  (60, 90),
    "spo2":    (95, 100),
    "rr":      (12, 20),
    "gcs":     (15, 15),  # 15 is normal; lower = worse
    "temp":    (36.1, 37.5),
    "glucose": (70, 140),
}

# Critical thresholds (life-threatening values)
CRITICAL_THRESHOLDS = {
    "hr":      {"low": 40, "high": 150},
    "bp_sys":  {"low": 70, "high": 200},
    "spo2":    {"low": 85, "high": None},   # only low is critical
    "rr":      {"low": 6,  "high": 35},
    "gcs":     {"low": 8,  "high": None},   # only low is critical
    "temp":    {"low": 35.0, "high": 39.5},
    "glucose": {"low": 50, "high": 350},
}

BASE_SEVERITY = {
    "cardiac": 80, "trauma": 75, "stroke_neuro": 78, "respiratory": 65,
    "sepsis": 70, "poisoning_overdose": 60, "obstetric": 72, "diabetic": 50,
}


def compute_vitals_derangement(row):
    """
    Score how far each vital deviates from normal.
    Returns 0-1 where 1 = maximally deranged.
    Uses distinct scoring per vital for clinical accuracy.
    """
    total = 0.0
    count = 0

    # Heart Rate: normal 60-100
    hr = row.get("hr", np.nan)
    if not pd.isna(hr):
        if hr < 40:
            total += 1.0
        elif hr < 50:
            total += 0.7
        elif hr < 60:
            total += 0.3
        elif hr > 150:
            total += 1.0
        elif hr > 130:
            total += 0.7
        elif hr > 110:
            total += 0.4
        elif hr > 100:
            total += 0.15
        count += 1

    # BP Systolic: normal 90-140
    bp = row.get("bp_sys", np.nan)
    if not pd.isna(bp):
        if bp < 70:
            total += 1.0
        elif bp < 80:
            total += 0.8
        elif bp < 90:
            total += 0.5
        elif bp > 200:
            total += 0.9
        elif bp > 180:
            total += 0.6
        elif bp > 160:
            total += 0.3
        count += 1

    # SpO2: normal 95-100, lower = worse
    spo2 = row.get("spo2", np.nan)
    if not pd.isna(spo2):
        if spo2 < 80:
            total += 1.0
        elif spo2 < 85:
            total += 0.8
        elif spo2 < 90:
            total += 0.6
        elif spo2 < 93:
            total += 0.3
        elif spo2 < 95:
            total += 0.1
        count += 1

    # GCS: 15 is normal, 3 is worst
    gcs = row.get("gcs", np.nan)
    if not pd.isna(gcs):
        if gcs <= 5:
            total += 1.0
        elif gcs <= 8:
            total += 0.8
        elif gcs <= 10:
            total += 0.5
        elif gcs <= 12:
            total += 0.25
        elif gcs <= 14:
            total += 0.05
        count += 1

    # RR: normal 12-20
    rr = row.get("rr", np.nan)
    if not pd.isna(rr):
        if rr < 6 or rr > 35:
            total += 1.0
        elif rr < 8 or rr > 30:
            total += 0.7
        elif rr < 10 or rr > 25:
            total += 0.4
        elif rr < 12 or rr > 20:
            total += 0.15
        count += 1

    # Temperature: normal 36.1-37.5
    temp = row.get("temp", np.nan)
    if not pd.isna(temp):
        if temp < 35.0 or temp > 40.0:
            total += 1.0
        elif temp < 35.5 or temp > 39.5:
            total += 0.7
        elif temp < 36.0 or temp > 38.5:
            total += 0.35
        elif temp < 36.1 or temp > 37.5:
            total += 0.1
        count += 1

    # Glucose: normal 70-140
    glucose = row.get("glucose", np.nan)
    if not pd.isna(glucose):
        if glucose < 40 or glucose > 500:
            total += 1.0
        elif glucose < 55 or glucose > 350:
            total += 0.7
        elif glucose < 70 or glucose > 250:
            total += 0.35
        elif glucose > 140:
            total += 0.1
        count += 1

    return total / max(count, 1)


def compute_complication_flags(row):
    """Score based on clinical complication indicators (0-1). More aggressive."""
    score = 0.0

    # Shock index (HR/SBP > 1.0 indicates shock)
    bp = row.get("bp_sys", 120)
    hr = row.get("hr", 80)
    if bp > 0:
        si = hr / bp
        if si > 1.4:
            score += 1.0
        elif si > 1.2:
            score += 0.7
        elif si > 1.0:
            score += 0.4

    # Respiratory failure (SpO2 < 90 + RR > 25)
    spo2 = row.get("spo2", 97)
    rr = row.get("rr", 16)
    if spo2 < 85 and rr > 30:
        score += 1.0
    elif spo2 < 90 and rr > 25:
        score += 0.8
    elif spo2 < 90:
        score += 0.5
    elif rr > 30:
        score += 0.3

    # Neurological risk (GCS < 9 or unequal pupils)
    gcs = row.get("gcs", 15)
    pupils = row.get("pupils_unequal", 0)
    if gcs <= 5 and pupils == 1:
        score += 1.0
    elif gcs < 9 and pupils == 1:
        score += 0.9
    elif gcs < 9:
        score += 0.7
    elif gcs < 12 and pupils == 1:
        score += 0.5
    elif pupils == 1:
        score += 0.3

    # Sepsis indicators (2+ SIRS criteria)
    temp = row.get("temp", 37.0)
    sirs_count = 0
    if temp > 38.3 or temp < 36.0:
        sirs_count += 1
    if hr > 90:
        sirs_count += 1
    if bp < 100:
        sirs_count += 1
    if rr > 20:
        sirs_count += 1
    if sirs_count >= 3:
        score += 0.8
    elif sirs_count >= 2:
        score += 0.3

    # Normalize: max possible ~3.8, scale to 0-1
    return min(1.0, score / 3.0)


def compute_symptom_burden(row):
    """Count of active symptoms normalized to 0-1."""
    symptom_keys = SYMPTOM_COLS
    active = sum(1 for s in symptom_keys if row.get(s, 0) == 1)
    return min(1.0, active / 6.0)  # 6+ symptoms = max burden


def compute_age_risk(age):
    """U-shaped age risk: higher for very young (<5) and elderly (>70)."""
    if pd.isna(age):
        return 0.3  # unknown age = moderate risk
    if age < 5:
        return 0.9
    elif age < 15:
        return 0.5
    elif age < 40:
        return 0.1
    elif age < 55:
        return 0.2
    elif age < 65:
        return 0.4
    elif age < 75:
        return 0.65
    else:
        return 0.9


def compute_severity_score(row, emergency_type):
    """
    Compute continuous severity score (0-100).

    Formula (weights sum to 100):
      severity = 30 * vitals_derangement       (how abnormal are vitals)
               + 20 * (base_severity / 100)     (intrinsic danger of emergency type)
               + 25 * complication_flags         (shock, resp failure, neuro risk)
               + 15 * symptom_burden             (number of active symptoms)
               + 10 * age_risk                   (age-adjusted risk)
    """
    vitals_d = compute_vitals_derangement(row)
    base_s = BASE_SEVERITY.get(emergency_type, 50) / 100.0
    comp_f = compute_complication_flags(row)
    symp_b = compute_symptom_burden(row)
    age_r = compute_age_risk(row.get("age", 50))

    raw = (30 * vitals_d +
           20 * base_s +
           25 * comp_f +
           15 * symp_b +
           10 * age_r)

    # Add small noise for realistic variation
    noise = np.random.normal(0, 2.0)
    return np.clip(raw + noise, 0, 100)


# ═══════════════════════════════════════════════════════════════════════
#  CARE NEEDS ASSIGNMENT (rule-based, same as before but enhanced)
# ═══════════════════════════════════════════════════════════════════════

def assign_care_needs(df):
    """Rule-based multi-label care need assignment."""
    d = df.copy()
    d["shock_index"] = d["hr"] / d["bp_sys"].clip(lower=1)

    for col in CARE_NEED_COLS:
        d[col] = 0

    # -- Cardiac --
    cardiac = d["emergency_type"] == "cardiac"
    d.loc[cardiac, "need_icu"] = 1
    d.loc[cardiac, "need_cardiologist"] = 1
    d.loc[cardiac, "need_cath_lab"] = 1
    d.loc[cardiac & (d["hr"] < 50) & (d["spo2"] < 90), "need_ventilator"] = 1

    # -- Trauma --
    trauma = d["emergency_type"] == "trauma"
    d.loc[trauma, "need_icu"] = 1
    d.loc[trauma, "need_ot"] = 1
    d.loc[trauma, "need_blood_bank"] = 1
    d.loc[trauma & (d["gcs"] < 9), "need_neurosurgeon"] = 1
    d.loc[trauma & (d["gcs"] < 9), "need_ct_scan"] = 1
    d.loc[trauma & (d["shock_index"] > 1.0), "need_ventilator"] = 1

    # -- Respiratory --
    resp = d["emergency_type"] == "respiratory"
    d.loc[resp, "need_icu"] = 1
    d.loc[resp & (d["spo2"] < 90), "need_ventilator"] = 1

    # -- Stroke / Neuro --
    neuro = d["emergency_type"] == "stroke_neuro"
    d.loc[neuro, "need_icu"] = 1
    d.loc[neuro, "need_ct_scan"] = 1
    d.loc[neuro, "need_neurosurgeon"] = 1

    # -- Sepsis --
    sepsis = d["emergency_type"] == "sepsis"
    d.loc[sepsis, "need_icu"] = 1
    d.loc[sepsis & (d["bp_sys"] < 90) & (d["hr"] > 100), "need_ventilator"] = 1

    # -- Poisoning / Overdose --
    poison = d["emergency_type"] == "poisoning_overdose"
    d.loc[poison, "need_icu"] = 1
    d.loc[poison, "need_toxicology"] = 1
    d.loc[poison & (d["gcs"] < 9), "need_ventilator"] = 1

    # -- Obstetric --
    obs = d["emergency_type"] == "obstetric"
    d.loc[obs, "need_ot"] = 1
    d.loc[obs, "need_obstetrician"] = 1
    d.loc[obs, "need_blood_bank"] = 1
    d.loc[obs & (d["shock_index"] > 1.0), "need_icu"] = 1

    # -- Diabetic --
    diab = d["emergency_type"] == "diabetic"
    d.loc[diab & (d["gcs"] < 10), "need_icu"] = 1

    return d


# ═══════════════════════════════════════════════════════════════════════
#  NOISE / MISSINGNESS
# ═══════════════════════════════════════════════════════════════════════

def add_noise(df, missing_rate=0.05):
    """Inject realistic ambulance-field missingness."""
    d = df.copy()
    for col, rate in [("ecg_abnormal", 0.30), ("glucose", 0.15),
                      ("pupils_unequal", 0.10)]:
        mask = np.random.rand(len(d)) < rate
        d.loc[mask, col] = np.nan
    for col in ["bp_sys", "bp_dia", "spo2", "rr"]:
        mask = np.random.rand(len(d)) < missing_rate
        d.loc[mask, col] = np.nan
    # Age/gender occasionally missing
    mask = np.random.rand(len(d)) < 0.05
    d.loc[mask, "age"] = np.nan
    mask = np.random.rand(len(d)) < 0.02
    d.loc[mask, "gender"] = np.nan
    return d


# ═══════════════════════════════════════════════════════════════════════
#  MAIN GENERATION PIPELINE
# ═══════════════════════════════════════════════════════════════════════

def build_records(n_per_type=N_PER_TYPE):
    """Build balanced dataset with all features."""
    frames = []
    cols_to_keep = set(VITAL_COLS + SYMPTOM_COLS)

    for etype in EMERGENCY_TYPES:
        n = n_per_type
        raw = SAMPLERS[etype](n)
        keep = {k: v for k, v in raw.items() if k in cols_to_keep}
        df = pd.DataFrame(keep)
        df["emergency_type"] = etype

        # Add age and gender
        age, gender = sample_demographics(etype, n)
        df["age"] = age
        df["gender"] = gender

        frames.append(df)

    df = pd.concat(frames, ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Numeric rounding
    for c in ["hr", "bp_sys", "bp_dia", "rr", "glucose"]:
        df[c] = df[c].round(1)
    for c in ["spo2", "temp"]:
        df[c] = df[c].round(1)

    return df


def generate_dataset(n_per_type=N_PER_TYPE,
                     path="triage_dataset_v2.parquet"):
    """Full generation pipeline: records + severity + care needs + noise."""
    total = n_per_type * len(EMERGENCY_TYPES)
    print(f"Generating {total} triage records ({n_per_type} per type)...")

    df = build_records(n_per_type)

    # Compute severity score (needs full row data)
    print("  Computing severity scores...")
    severity_scores = []
    for _, row in df.iterrows():
        score = compute_severity_score(row.to_dict(), row["emergency_type"])
        severity_scores.append(round(score, 1))
    df["severity_score"] = severity_scores
    df["severity_tier"] = df["severity_score"].apply(get_severity_tier)

    # Assign care needs
    df = assign_care_needs(df)

    # Assign specialist doctors and equipment
    print("  Assigning specialists and equipment...")
    specialists_list = []
    equipment_list = []
    for _, row in df.iterrows():
        specs = get_specialists(row["emergency_type"], row["severity_score"],
                               row.get("gcs", 15))
        equip = get_equipment(row["emergency_type"], row["severity_score"])
        specialists_list.append("|".join(specs))
        equipment_list.append("|".join(equip))
    df["specialist_doctors"] = specialists_list
    df["required_equipment"] = equipment_list

    # Add noise (AFTER severity/care computation so labels are clean)
    df = add_noise(df)

    # Encode emergency_type as integer label
    type_map = {t: i for i, t in enumerate(EMERGENCY_TYPES)}
    df["emergency_type_label"] = df["emergency_type"].map(type_map)

    # Save
    df.to_parquet(path, index=False)
    print(f"\nSaved to {path}  shape={df.shape}")
    print(f"\n--- Emergency Type Distribution ---")
    print(df["emergency_type"].value_counts().to_string())
    print(f"\n--- Severity Tier Distribution ---")
    print(df["severity_tier"].value_counts().to_string())
    print(f"\n--- Severity Score Stats ---")
    print(df["severity_score"].describe().to_string())
    print(f"\n--- Age Stats ---")
    print(df["age"].describe().to_string())
    print(f"\n--- Gender Distribution (0=F, 1=M) ---")
    print(df["gender"].value_counts().to_string())
    print(f"\n--- Sample Records ---")
    sample_cols = ["emergency_type", "age", "gender", "hr", "bp_sys", "spo2",
                   "gcs", "severity_score", "severity_tier",
                   "specialist_doctors", "required_equipment"]
    print(df[sample_cols].head(10).to_string())

    # Also save a CSV for easier review
    csv_path = path.replace(".parquet", ".csv")
    df.to_csv(csv_path, index=False)
    print(f"\nCSV copy saved to {csv_path}")

    return df


if __name__ == "__main__":
    df = generate_dataset()
