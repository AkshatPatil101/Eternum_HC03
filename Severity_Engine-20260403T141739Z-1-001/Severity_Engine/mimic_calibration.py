"""
mimic_calibration.py
Extracts realistic vital sign distributions from MIMIC-IV demo dataset
to calibrate synthetic data generation parameters.
"""
import pandas as pd
import numpy as np
import json
import os

MIMIC_BASE = os.path.join(os.path.dirname(__file__), "..", "..", "archive", "mimic-iv-clinical-database-demo-2.2")

# ── MIMIC-IV Item IDs for vital signs ──
VITAL_ITEM_IDS = {
    220045: "heart_rate",
    220050: "bp_sys",   # arterial
    220179: "bp_sys",   # non-invasive (merge)
    220051: "bp_dia",   # arterial
    220180: "bp_dia",   # non-invasive (merge)
    220277: "spo2",
    220210: "resp_rate",
    223762: "temp_c",
    223761: "temp_f",
    220739: "gcs_eye",
    223901: "gcs_motor",
    223900: "gcs_verbal",
    226537: "glucose",
    225664: "glucose",
    220621: "glucose",
}

# ── ICD-9/10 → Emergency type mapping ──
def classify_icd(title):
    if pd.isna(title):
        return None
    t = title.lower()
    if any(w in t for w in ["myocard", "cardiac", "heart fail", "coronary",
                            "atrial fib", "ventricul", "angina", "arrest"]):
        return "cardiac"
    if any(w in t for w in ["fracture", "trauma", "accident", "contusion",
                            "laceration", "crush", "disloc"]):
        return "trauma"
    if any(w in t for w in ["pneumonia", "asthma", "copd", "respiratory",
                            "pulmonary em", "pneumothorax", "bronch"]):
        return "respiratory"
    if any(w in t for w in ["stroke", "cerebr", "intracranial", "epilep",
                            "seizure", "meningitis", "brain"]):
        return "stroke_neuro"
    if any(w in t for w in ["sepsis", "septic", "infection", "cellulitis",
                            "abscess", "endocarditis"]):
        return "sepsis"
    if any(w in t for w in ["poison", "overdose", "toxic", "drug abuse",
                            "alcohol", "venom"]):
        return "poisoning_overdose"
    if any(w in t for w in ["pregnan", "obstet", "placent", "eclamp",
                            "postpartum", "ectopic"]):
        return "obstetric"
    if any(w in t for w in ["diabet", "ketoacid", "hypoglyc", "hyperglyce"]):
        return "diabetic"
    return None


def extract_vitals():
    """Extract per-patient vital sign summary (mean per stay)."""
    print("  Loading chartevents (this may take a moment)...")
    item_ids = list(VITAL_ITEM_IDS.keys())
    chunks = pd.read_csv(
        os.path.join(MIMIC_BASE, "icu", "chartevents.csv"),
        usecols=["subject_id", "itemid", "valuenum"],
        chunksize=100_000,
    )
    dfs = []
    for chunk in chunks:
        filtered = chunk[chunk["itemid"].isin(item_ids)].copy()
        if len(filtered) > 0:
            dfs.append(filtered)
    vitals = pd.concat(dfs)
    vitals["vital_name"] = vitals["itemid"].map(VITAL_ITEM_IDS)

    # Convert Fahrenheit to Celsius
    f_mask = vitals["vital_name"] == "temp_f"
    vitals.loc[f_mask, "valuenum"] = (vitals.loc[f_mask, "valuenum"] - 32) * 5 / 9
    vitals.loc[f_mask, "vital_name"] = "temp_c"

    # GCS: sum eye + motor + verbal per subject
    gcs_components = vitals[vitals["vital_name"].isin(["gcs_eye", "gcs_motor", "gcs_verbal"])]
    gcs_total = gcs_components.groupby("subject_id")["valuenum"].sum().reset_index()
    gcs_total.columns = ["subject_id", "valuenum"]
    gcs_total["vital_name"] = "gcs"
    # Clamp GCS to valid range
    gcs_total["valuenum"] = gcs_total["valuenum"].clip(3, 15)

    # Non-GCS vitals: average per patient
    non_gcs = vitals[~vitals["vital_name"].isin(["gcs_eye", "gcs_motor", "gcs_verbal"])]
    patient_vitals = non_gcs.groupby(["subject_id", "vital_name"])["valuenum"].mean().reset_index()
    patient_vitals = pd.concat([patient_vitals, gcs_total], ignore_index=True)

    # Pivot to wide format
    wide = patient_vitals.pivot_table(
        index="subject_id", columns="vital_name", values="valuenum", aggfunc="mean"
    ).reset_index()

    return wide


def extract_patient_diagnoses():
    """Map patients to emergency types via ICD codes."""
    diag = pd.read_csv(os.path.join(MIMIC_BASE, "hosp", "diagnoses_icd.csv"))
    icd_dict = pd.read_csv(os.path.join(MIMIC_BASE, "hosp", "d_icd_diagnoses.csv"))
    diag_full = diag.merge(icd_dict, on=["icd_code", "icd_version"], how="left")
    diag_full["emergency_type"] = diag_full["long_title"].apply(classify_icd)

    # Take the primary (seq_num=1) classified diagnosis, or fallback to any
    classified = diag_full[diag_full["emergency_type"].notna()]
    primary = classified.sort_values("seq_num").drop_duplicates(subset="subject_id", keep="first")
    return primary[["subject_id", "emergency_type"]]


def extract_demographics():
    """Get age and gender from patients table."""
    patients = pd.read_csv(os.path.join(MIMIC_BASE, "hosp", "patients.csv"))
    patients = patients.rename(columns={"anchor_age": "age"})
    patients["gender_numeric"] = (patients["gender"] == "M").astype(int)
    return patients[["subject_id", "age", "gender_numeric"]]


def calibrate():
    """
    Main calibration: merge vitals + diagnoses + demographics,
    compute per-emergency-type distributions, save to JSON.
    """
    print("=" * 60)
    print("  MIMIC-IV Calibration for Synthetic Data Generation")
    print("=" * 60)

    vitals_wide = extract_vitals()
    diag_map = extract_patient_diagnoses()
    demographics = extract_demographics()

    # Merge
    merged = vitals_wide.merge(diag_map, on="subject_id", how="inner")
    merged = merged.merge(demographics, on="subject_id", how="left")

    print(f"\n  Patients with vitals + diagnosis: {len(merged)}")
    print(f"  Emergency type distribution:")
    print(merged["emergency_type"].value_counts().to_string())

    # Compute per-type distributions
    vital_cols = ["heart_rate", "bp_sys", "bp_dia", "spo2",
                  "resp_rate", "temp_c", "gcs", "glucose"]

    calibration = {}
    # Overall (fallback) distributions
    overall = {}
    for col in vital_cols:
        if col in merged.columns:
            vals = merged[col].dropna()
            if len(vals) > 0:
                overall[col] = {
                    "mean": round(float(vals.mean()), 2),
                    "std": round(float(vals.std()), 2),
                    "min": round(float(vals.min()), 2),
                    "max": round(float(vals.max()), 2),
                    "n": int(len(vals)),
                }
    calibration["overall"] = overall

    # Per-emergency-type distributions
    for etype, group in merged.groupby("emergency_type"):
        etype_stats = {}
        for col in vital_cols:
            if col in group.columns:
                vals = group[col].dropna()
                if len(vals) >= 3:  # need at least 3 samples
                    etype_stats[col] = {
                        "mean": round(float(vals.mean()), 2),
                        "std": round(float(vals.std()), 2),
                        "min": round(float(vals.min()), 2),
                        "max": round(float(vals.max()), 2),
                        "n": int(len(vals)),
                    }
        calibration[etype] = etype_stats

    # Age distributions
    age_stats = {}
    for etype, group in merged.groupby("emergency_type"):
        ages = group["age"].dropna()
        if len(ages) >= 3:
            age_stats[etype] = {
                "mean": round(float(ages.mean()), 1),
                "std": round(float(ages.std()), 1),
            }
    calibration["age"] = age_stats

    # Gender ratios
    gender_stats = {}
    for etype, group in merged.groupby("emergency_type"):
        genders = group["gender_numeric"].dropna()
        if len(genders) >= 3:
            gender_stats[etype] = {
                "male_ratio": round(float(genders.mean()), 3),
            }
    calibration["gender"] = gender_stats

    # Save
    out_path = os.path.join(os.path.dirname(__file__), "mimic_calibration.json")
    with open(out_path, "w") as f:
        json.dump(calibration, f, indent=2)

    print(f"\n  Calibration saved to {out_path}")
    print(f"  Emergency types found: {list(calibration.keys())}")

    # Print summary
    print("\n  -- Per-type vital sign means (MIMIC-calibrated) --")
    for etype in ["cardiac", "trauma", "respiratory", "stroke_neuro",
                   "sepsis", "poisoning_overdose", "obstetric", "diabetic"]:
        if etype in calibration:
            stats = calibration[etype]
            parts = [f"{k}={v['mean']:.1f}±{v['std']:.1f}" for k, v in stats.items()]
            print(f"  {etype:22s}: {', '.join(parts)}")
        else:
            print(f"  {etype:22s}: (no MIMIC data — will use clinical defaults)")

    return calibration


if __name__ == "__main__":
    calibrate()
