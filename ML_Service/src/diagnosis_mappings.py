"""
diagnosis_mappings.py
Centralised mapping: emergency_type -> specialist doctors, equipment, hospital specialty tags.
Used by both data generator and inference pipeline.
"""

# ── Emergency type → specialist doctor(s) ──
# severity_threshold: above this severity, add the "severe" specialists too
EMERGENCY_CONFIG = {
    "cardiac": {
        "base_severity": 80,
        "specialists": ["Cardiologist"],
        "specialists_severe": ["Interventional Cardiologist", "Cardiac Surgeon"],
        "equipment": ["ecg", "defibrillator", "cath_lab", "ventilator"],
        "equipment_severe": ["ecmo"],
        "care_needs": ["need_icu", "need_cardiologist", "need_cath_lab"],
        "hospital_specialty_tags": ["cardiology", "cardiac_surgery", "ICU", "CCU"],
    },
    "trauma": {
        "base_severity": 75,
        "specialists": ["Trauma Surgeon", "General Surgeon"],
        "specialists_severe": ["Neurosurgeon", "Spine Surgeon"],  # if GCS < 9
        "equipment": ["CT", "blood_bank", "ventilator"],
        "equipment_severe": ["MRI"],
        "care_needs": ["need_icu", "need_ot", "need_blood_bank"],
        "hospital_specialty_tags": ["general_surgeon", "orthopedics", "ICU"],
    },
    "respiratory": {
        "base_severity": 65,
        "specialists": ["Pulmonologist"],
        "specialists_severe": ["Intensivist", "Thoracic Surgeon"],
        "equipment": ["ventilator"],
        "equipment_severe": ["ecmo"],
        "care_needs": ["need_icu", "need_ventilator"],
        "hospital_specialty_tags": ["ICU"],
    },
    "stroke_neuro": {
        "base_severity": 78,
        "specialists": ["Neurologist"],
        "specialists_severe": ["Neurosurgeon", "Interventional Neuroradiologist"],
        "equipment": ["CT", "MRI"],
        "equipment_severe": ["ventilator"],
        "care_needs": ["need_icu", "need_neurosurgeon", "need_ct_scan"],
        "hospital_specialty_tags": ["neurology", "neurosurgery", "ICU"],
    },
    "sepsis": {
        "base_severity": 70,
        "specialists": ["Intensivist"],
        "specialists_severe": ["Infectious Disease Specialist"],
        "equipment": ["ventilator"],
        "equipment_severe": ["dialysis"],
        "care_needs": ["need_icu", "need_ventilator"],
        "hospital_specialty_tags": ["ICU"],
    },
    "poisoning_overdose": {
        "base_severity": 60,
        "specialists": ["Emergency Physician"],
        "specialists_severe": ["Toxicologist", "Intensivist"],
        "equipment": ["ventilator"],
        "equipment_severe": ["dialysis"],
        "care_needs": ["need_icu", "need_toxicology"],
        "hospital_specialty_tags": ["ICU"],
    },
    "obstetric": {
        "base_severity": 72,
        "specialists": ["Obstetrician"],
        "specialists_severe": ["Anesthesiologist", "Maternal-Fetal Medicine Specialist"],
        "equipment": ["blood_bank"],
        "equipment_severe": ["ventilator"],
        "care_needs": ["need_ot", "need_obstetrician", "need_blood_bank"],
        "hospital_specialty_tags": ["gynecology", "ICU"],
    },
    "diabetic": {
        "base_severity": 50,
        "specialists": ["Emergency Physician"],
        "specialists_severe": ["Endocrinologist", "Intensivist"],
        "equipment": [],
        "equipment_severe": ["ventilator"],
        "care_needs": ["need_icu"],
        "hospital_specialty_tags": ["ICU"],
    },
}

EMERGENCY_TYPES = list(EMERGENCY_CONFIG.keys())

# Added exact BASE_SEVERITY lookup from generator script
BASE_SEVERITY = {
    cfg_name: cfg['base_severity'] for cfg_name, cfg in EMERGENCY_CONFIG.items()
}

CARE_NEED_COLS = [
    "need_icu", "need_ventilator", "need_ot",
    "need_cardiologist", "need_neurosurgeon", "need_blood_bank",
    "need_cath_lab", "need_toxicology", "need_obstetrician", "need_ct_scan",
]

# Severity tier thresholds
SEVERITY_TIERS = {
    "CRITICAL": 50,   # severity_score >= 50
    "URGENT": 35,     # 35 <= severity_score < 50
    "STABLE": 0,      # severity_score < 35
}


def get_severity_tier(score: float) -> str:
    if score >= SEVERITY_TIERS["CRITICAL"]:
        return "CRITICAL"
    elif score >= SEVERITY_TIERS["URGENT"]:
        return "URGENT"
    return "STABLE"


def get_specialists(emergency_type: str, severity_score: float,
                    gcs: float = 15) -> list:
    """Get required specialists based on emergency type and severity."""
    config = EMERGENCY_CONFIG[emergency_type]
    docs = list(config["specialists"])
    if severity_score >= 45:
        docs.extend(config["specialists_severe"])
    # Special rules
    if emergency_type == "trauma" and gcs < 9:
        if "Neurosurgeon" not in docs:
            docs.append("Neurosurgeon")
    return list(set(docs))


def get_equipment(emergency_type: str, severity_score: float) -> list:
    """Get required equipment based on emergency type and severity."""
    config = EMERGENCY_CONFIG[emergency_type]
    equip = list(config["equipment"])
    if severity_score >= 45:
        equip.extend(config["equipment_severe"])
    return list(set(equip))


def get_hospital_specialty_tags(emergency_type: str) -> list:
    """Get hospital specialty tags needed for matching."""
    return EMERGENCY_CONFIG[emergency_type]["hospital_specialty_tags"]