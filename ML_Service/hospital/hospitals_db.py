# =============================================================================
# PUNE HOSPITALS MOCK DATABASE
# Based on real hospitals — beds, specialties, equipment are realistic
# Bed availability is randomised per run (simulates live state)
# =============================================================================

import random
import copy

HOSPITALS_PUNE = [

    # -------------------------------------------------------------------------
    # TIER 1 — Full super-specialty, trauma, transplant capable
    # -------------------------------------------------------------------------
    {
        "id": "H01",
        "name": "Ruby Hall Clinic (Sassoon Road)",
        "area": "Camp / Central Pune",
        "lat": 18.5314, "lng": 73.8742,
        "level": 1,
        "total_beds": 600,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "cardiac_surgery", "neurology", "neurosurgery",
            "general_surgeon", "orthopedics", "oncology", "nephrology",
            "urology", "gastroenterology", "ICU", "NICU", "CCU",
            "transplant", "burns", "psychiatry", "pediatrics"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "ecmo", "dialysis", "PET_CT", "robotic_surgery", "blood_bank",
            "neuro_interventional_cath_lab"
        ],
        "nabh_accredited": True,
        "notes": "Pune's oldest & most renowned. First neuro-interventional cath lab in Pune."
    },
    {
        "id": "H02",
        "name": "Deenanath Mangeshkar Hospital",
        "area": "Erandwane",
        "lat": 18.5089, "lng": 73.8259,
        "level": 1,
        "total_beds": 750,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "cardiac_surgery", "neurology", "neurosurgery",
            "general_surgeon", "orthopedics", "oncology", "nephrology",
            "urology", "gastroenterology", "ICU", "NICU", "CCU",
            "transplant", "robotic_surgery", "pediatrics", "gynecology"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "ecmo", "dialysis", "PET_CT", "robotic_surgery", "blood_bank",
            "human_milk_bank", "cardiac_ambulance"
        ],
        "nabh_accredited": True,
        "notes": "Largest charitable multi-specialty in Pune. Robotic surgery, cancer research centre."
    },
    {
        "id": "H03",
        "name": "Sahyadri Super Speciality Hospital (Deccan)",
        "area": "Deccan Gymkhana",
        "lat": 18.5126, "lng": 73.8398,
        "level": 1,
        "total_beds": 202,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "neurology", "neurosurgery", "cardiology", "cardiac_surgery",
            "oncology", "bone_marrow_transplant", "ICU", "CCU",
            "general_surgeon", "orthopedics", "urology", "transplant",
            "hematology", "gastroenterology", "pediatrics"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "ecmo", "dialysis", "PET_CT", "blood_bank",
            "bone_marrow_unit", "liver_transplant_suite"
        ],
        "nabh_accredited": True,
        "notes": "Pioneer in neurosciences in Maharashtra. Fastest growing liver transplant centre in W. India."
    },
    {
        "id": "H04",
        "name": "Apollo Jehangir Hospital",
        "area": "Sassoon Road / Camp",
        "lat": 18.5308, "lng": 73.8727,
        "level": 1,
        "total_beds": 350,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "cardiac_surgery", "neurology", "general_surgeon",
            "orthopedics", "oncology", "nephrology", "urology",
            "gastroenterology", "ICU", "CCU", "NICU", "pediatrics",
            "gynecology", "psychiatry"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "dialysis", "blood_bank", "robotic_surgery", "PET_CT"
        ],
        "nabh_accredited": True,
        "notes": "Apollo Group + Jehangir legacy since 1946. 9 OTs, 24hr emergency."
    },
    {
        "id": "H05",
        "name": "Kokilaben Hospital Pune (Kharadi)",
        "area": "Kharadi / East Pune",
        "lat": 18.5512, "lng": 73.9476,
        "level": 1,
        "total_beds": 300,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "cardiac_surgery", "neurology", "neurosurgery",
            "general_surgeon", "orthopedics", "oncology", "ICU",
            "CCU", "NICU", "transplant", "urology", "gastroenterology"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "ecmo", "dialysis", "blood_bank", "robotic_surgery"
        ],
        "nabh_accredited": True,
        "notes": "Premium facility serving East Pune / IT corridor."
    },
    {
        "id": "H06",
        "name": "Manipal Hospital Baner",
        "area": "Baner / West Pune",
        "lat": 18.5590, "lng": 73.7857,
        "level": 1,
        "total_beds": 250,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "neurology", "general_surgeon", "orthopedics",
            "oncology", "ICU", "CCU", "nephrology", "urology",
            "gastroenterology", "pediatrics", "gynecology"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "dialysis", "blood_bank"
        ],
        "nabh_accredited": True,
        "notes": "Launched 2022. Serves Baner, Balewadi, Aundh, Wakad."
    },
    {
        "id": "H07",
        "name": "Nanavati Max Hospital (Viman Nagar)",
        "area": "Viman Nagar / East Pune",
        "lat": 18.5679, "lng": 73.9145,
        "level": 1,
        "total_beds": 280,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "cardiac_surgery", "neurology", "neurosurgery",
            "general_surgeon", "orthopedics", "ICU", "CCU",
            "nephrology", "oncology", "urology", "pediatrics"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "dialysis", "ecmo", "blood_bank"
        ],
        "nabh_accredited": True,
        "notes": "Covers airport area, Viman Nagar, Kalyani Nagar corridor."
    },
    {
        "id": "H08",
        "name": "DPU Super Specialty Hospital (Pimpri)",
        "area": "Pimpri-Chinchwad (PCMC)",
        "lat": 18.6298, "lng": 73.7997,
        "level": 1,
        "total_beds": 500,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "cardiac_surgery", "neurology", "neurosurgery",
            "general_surgeon", "orthopedics", "oncology", "ICU", "CCU",
            "NICU", "transplant", "nephrology", "urology",
            "gastroenterology", "pediatrics", "gynecology", "psychiatry"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "ecmo", "dialysis", "blood_bank", "heart_transplant_suite", "PET_CT"
        ],
        "nabh_accredited": True,
        "notes": "Largest super-specialty in PCMC. Heart transplant dept. 18 major OTs."
    },

    # -------------------------------------------------------------------------
    # TIER 2 — Strong multi-specialty, good ICU, limited transplant
    # -------------------------------------------------------------------------
    {
        "id": "H09",
        "name": "Sancheti Hospital",
        "area": "Shivajinagar",
        "lat": 18.5308, "lng": 73.8474,
        "level": 2,
        "total_beds": 300,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "orthopedics", "spine_surgery", "trauma", "general_surgeon",
            "ICU", "physiotherapy", "pediatric_orthopedics"
        ],
        "equipment": [
            "ventilator", "CT", "MRI", "defibrillator", "C_arm", "blood_bank"
        ],
        "nabh_accredited": True,
        "notes": "Best ortho & trauma in Pune. 2500 spine + 2700 trauma surgeries/year."
    },
    {
        "id": "H10",
        "name": "Sahyadri Super Speciality (Hadapsar)",
        "area": "Hadapsar / East Pune",
        "lat": 18.5089, "lng": 73.9259,
        "level": 2,
        "total_beds": 201,
        "er_capable": True,
        "trauma_center": False,
        "specialties": [
            "cardiology", "neurology", "neurosurgery", "general_surgeon",
            "orthopedics", "oncology", "ICU", "CCU", "NICU",
            "urology", "gastroenterology", "gynecology", "pediatrics"
        ],
        "equipment": [
            "ventilator", "cath_lab", "MRI", "CT", "defibrillator",
            "dialysis", "PET_CT", "blood_bank"
        ],
        "nabh_accredited": True,
        "notes": "46 ICU beds (ICU/HDU/NICU/CCU). Covers Hadapsar, Magarpatta, Wagholi."
    },
    {
        "id": "H11",
        "name": "Sahyadri Super Speciality (Nagar Road)",
        "area": "Yerawada / Nagar Road",
        "lat": 18.5523, "lng": 73.9012,
        "level": 2,
        "total_beds": 130,
        "er_capable": True,
        "trauma_center": False,
        "specialties": [
            "cardiology", "neurology", "general_surgeon", "orthopedics",
            "ICU", "CCU", "NICU", "urology", "gastroenterology",
            "gynecology", "pediatrics"
        ],
        "equipment": [
            "ventilator", "cath_lab", "CT", "MRI", "defibrillator",
            "dialysis", "blood_bank"
        ],
        "nabh_accredited": True,
        "notes": "NABH accredited. Cath lab + IVF lab. Serves Yerawada, Kalyani Nagar."
    },
    {
        "id": "H12",
        "name": "Lokmanya Hospital (Chinchwad)",
        "area": "Chinchwad / PCMC",
        "lat": 18.6482, "lng": 73.8024,
        "level": 2,
        "total_beds": 250,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "neurology", "general_surgeon", "orthopedics",
            "ICU", "CCU", "trauma", "burns", "nephrology", "urology"
        ],
        "equipment": [
            "ventilator", "CT", "MRI", "defibrillator", "dialysis",
            "blood_bank", "burns_unit"
        ],
        "nabh_accredited": False,
        "notes": "Level 1 trauma center for PCMC. Burns unit. 24/7 trauma + cardiac."
    },
    {
        "id": "H13",
        "name": "AIMS Multispeciality Hospital (Aundh)",
        "area": "Aundh / NW Pune",
        "lat": 18.5590, "lng": 73.8069,
        "level": 2,
        "total_beds": 250,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "cardiology", "neurology", "general_surgeon", "orthopedics",
            "ICU", "urology", "gastroenterology", "gynecology",
            "pediatrics", "emergency_medicine"
        ],
        "equipment": [
            "ventilator", "CT", "MRI", "defibrillator", "dialysis", "blood_bank"
        ],
        "nabh_accredited": True,
        "notes": "Modern ICU + trauma units. Serves Aundh, Baner, Wakad, Pimple Saudagar."
    },
    {
        "id": "H14",
        "name": "VishwaRaj Hospital (Loni Kalbhor)",
        "area": "Loni Kalbhor / SE Pune",
        "lat": 18.4614, "lng": 73.9614,
        "level": 2,
        "total_beds": 200,
        "er_capable": True,
        "trauma_center": False,
        "specialties": [
            "cardiology", "neurology", "general_surgeon", "orthopedics",
            "ICU", "nephrology", "urology", "oncology", "gynecology", "pediatrics"
        ],
        "equipment": [
            "ventilator", "CT", "MRI", "defibrillator", "dialysis", "blood_bank"
        ],
        "nabh_accredited": False,
        "notes": "Serves rural SE Pune — Loni, Uruli Kanchan, Solapur highway."
    },

    # -------------------------------------------------------------------------
    # TIER 3 — Good ER, basic ICU, stabilise-first capable
    # -------------------------------------------------------------------------
    {
        "id": "H15",
        "name": "Sassoon General Hospital (Government)",
        "area": "Camp / Central Pune",
        "lat": 18.5297, "lng": 73.8710,
        "level": 3,
        "total_beds": 1400,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "general_surgeon", "orthopedics", "ICU", "neurology",
            "pediatrics", "gynecology", "psychiatry", "burns", "trauma"
        ],
        "equipment": [
            "ventilator", "CT", "defibrillator", "blood_bank", "dialysis", "burns_unit"
        ],
        "nabh_accredited": False,
        "notes": "Largest govt hospital in Pune. Free care. High capacity. Good for stabilise-first."
    },
    {
        "id": "H16",
        "name": "KEM Hospital (Rasta Peth)",
        "area": "Rasta Peth / Central Pune",
        "lat": 18.5195, "lng": 73.8553,
        "level": 3,
        "total_beds": 400,
        "er_capable": True,
        "trauma_center": False,
        "specialties": [
            "general_surgeon", "orthopedics", "ICU", "neurology",
            "cardiology", "pediatrics", "gynecology", "psychiatry"
        ],
        "equipment": [
            "ventilator", "CT", "MRI", "defibrillator", "blood_bank"
        ],
        "nabh_accredited": False,
        "notes": "Well-known Pune hospital. Good generalist ER. Reasonable ICU."
    },
    {
        "id": "H17",
        "name": "Surya Sahyadri Hospital (Kasba Peth)",
        "area": "Kasba Peth / Old Pune",
        "lat": 18.5182, "lng": 73.8601,
        "level": 3,
        "total_beds": 65,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "general_surgeon", "orthopedics", "ICU", "burns",
            "trauma", "pediatrics", "gynecology"
        ],
        "equipment": [
            "ventilator", "CT", "defibrillator", "blood_bank", "burns_unit"
        ],
        "nabh_accredited": False,
        "notes": "Has burn centre + trauma care. Stabilise-first option in old city area."
    },
    {
        "id": "H18",
        "name": "Pawana Hospital (Somatane / Maval)",
        "area": "Somatane Phata / Expressway junction",
        "lat": 18.7012, "lng": 73.4891,
        "level": 3,
        "total_beds": 203,
        "er_capable": True,
        "trauma_center": True,
        "specialties": [
            "general_surgeon", "orthopedics", "ICU", "trauma",
            "gynecology", "pediatrics"
        ],
        "equipment": [
            "ventilator", "CT", "defibrillator", "blood_bank"
        ],
        "nabh_accredited": False,
        "notes": "Critical for Mumbai-Pune expressway accidents. At old+new expressway junction."
    },
]


def get_hospitals_with_live_beds(seed=None):
    """
    Simulates live bed availability. In production, replace with
    a hospital bed management API call.
    """
    if seed:
        random.seed(seed)
    hospitals = copy.deepcopy(HOSPITALS_PUNE)
    for h in hospitals:
        total = h["total_beds"]
        icu_total = max(4, int(total * 0.10))
        h["icu_beds_free"] = random.randint(0, max(1, int(icu_total * 0.6)))
        h["general_beds_free"] = random.randint(
            int(total * 0.05), int(total * 0.30)
        )
    return hospitals


if __name__ == "__main__":
    hospitals = get_hospitals_with_live_beds()
    tier_labels = {1: "TIER 1 — Super Specialty", 2: "TIER 2 — Multi Specialty", 3: "TIER 3 — General / Govt"}
    current_tier = None
    print(f"\n{'='*68}")
    print(f"  PUNE HOSPITAL DATABASE  —  {len(hospitals)} hospitals")
    print(f"{'='*68}")
    for h in hospitals:
        if h["level"] != current_tier:
            current_tier = h["level"]
            print(f"\n  ── {tier_labels[current_tier]} ──")
        print(f"\n  [{h['id']}] {h['name']}")
        print(f"  Area     : {h['area']}")
        print(f"  Coords   : {h['lat']}, {h['lng']}")
        print(f"  Beds     : {h['total_beds']} total | ICU free: {h['icu_beds_free']} | Gen free: {h['general_beds_free']}")
        print(f"  ER: {h['er_capable']} | Trauma: {h['trauma_center']} | NABH: {h['nabh_accredited']}")
        print(f"  Specs    : {', '.join(h['specialties'][:6])}{'...' if len(h['specialties']) > 6 else ''}")
        print(f"  Equipment: {', '.join(h['equipment'][:5])}{'...' if len(h['equipment']) > 5 else ''}")