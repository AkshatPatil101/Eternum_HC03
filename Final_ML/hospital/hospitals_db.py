"""
hospitals_db.py

Contains the mocked hospital database data and functions to check
live resource availability.
"""
import random

# Core Mock DB setup with locations and specialties
MOCK_HOSPITALS = [
    {
        "id": "H001",
        "name": "Apollo Hospitals",
        "location": {"lat": 12.9664, "lng": 77.5878}, # Central Bangalore
        "tier": "Tier 1",
        "bed_capacity": {
            "ICU": {"total": 50, "occupied_base": 42},
            "OT": {"total": 10, "occupied_base": 7},
            "General": {"total": 200, "occupied_base": 150}
        },
        "equipment": ["CT", "MRI", "blood_bank", "ventilator", "cath_lab", "ecg", "defibrillator", "ecmo", "dialysis"],
        "specialties": ["cardiology", "neurology", "neurosurgery", "general_surgeon", "ICU", "CCU", "cardiac_surgery"],
        "specialist_roles": [
            "Cardiologist", "Interventional Cardiologist", "Cardiac Surgeon",
            "Neurologist", "Neurosurgeon", "General Surgeon", "Intensivist"
        ]
    },
    {
        "id": "H002",
        "name": "Manipal Hospital",
        "location": {"lat": 12.9592, "lng": 77.6485}, # Indiranagar
        "tier": "Tier 1",
        "bed_capacity": {
            "ICU": {"total": 60, "occupied_base": 55},
            "OT": {"total": 12, "occupied_base": 9},
            "General": {"total": 250, "occupied_base": 180}
        },
        "equipment": ["CT", "MRI", "blood_bank", "ventilator", "ecg", "defibrillator", "dialysis"],
        "specialties": ["neurology", "orthopedics", "general_surgeon", "ICU", "gynecology"],
        "specialist_roles": [
            "Neurologist", "Spine Surgeon", "General Surgeon", "Intensivist",
            "Obstetrician", "Emergency Physician"
        ]
    },
    {
        "id": "H003",
        "name": "Fortis Hospital",
        "location": {"lat": 12.8938, "lng": 77.5979}, # Bannerghatta
        "tier": "Tier 1",
        "bed_capacity": {
            "ICU": {"total": 45, "occupied_base": 30},
            "OT": {"total": 8, "occupied_base": 4},
            "General": {"total": 150, "occupied_base": 100}
        },
        "equipment": ["CT", "blood_bank", "ventilator", "cath_lab", "ecg", "defibrillator"],
        "specialties": ["cardiology", "orthopedics", "ICU"],
        "specialist_roles": [
            "Cardiologist", "Trauma Surgeon", "Orthopedic Surgeon", "Intensivist"
        ]
    },
    {
        "id": "H004",
        "name": "St. John's Medical College",
        "location": {"lat": 12.9298, "lng": 77.6190}, # Koramangala
        "tier": "Tier 2",
        "bed_capacity": {
            "ICU": {"total": 80, "occupied_base": 75},
            "OT": {"total": 15, "occupied_base": 10},
            "General": {"total": 400, "occupied_base": 350}
        },
        "equipment": ["CT", "MRI", "blood_bank", "ventilator", "ecg", "defibrillator", "dialysis"],
        "specialties": ["general_surgeon", "orthopedics", "ICU", "gynecology", "cardiology"],
        "specialist_roles": [
            "General Surgeon", "Trauma Surgeon", "Obstetrician", 
            "Maternal-Fetal Medicine Specialist", "Emergency Physician",
            "Infectious Disease Specialist"
        ]
    },
    {
        "id": "H005",
        "name": "Sparsh Super Specialty",
        "location": {"lat": 13.0645, "lng": 77.5255}, # Yeshwanthpur
        "tier": "Tier 2",
        "bed_capacity": {
            "ICU": {"total": 30, "occupied_base": 20},
            "OT": {"total": 6, "occupied_base": 3},
            "General": {"total": 120, "occupied_base": 80}
        },
        "equipment": ["CT", "ventilator", "ecg", "defibrillator"],
        "specialties": ["orthopedics", "general_surgeon", "ICU"],
        "specialist_roles": [
            "Trauma Surgeon", "Spine Surgeon", "General Surgeon", "Intensivist"
        ]
    },
    {
        "id": "H006",
        "name": "Sakra World Hospital",
        "location": {"lat": 12.9360, "lng": 77.6830}, # Bellandur
        "tier": "Tier 1",
        "bed_capacity": {
            "ICU": {"total": 40, "occupied_base": 25},
            "OT": {"total": 10, "occupied_base": 5},
            "General": {"total": 180, "occupied_base": 120}
        },
        "equipment": ["CT", "MRI", "blood_bank", "ventilator", "cath_lab", "ecg", "defibrillator", "dialysis"],
        "specialties": ["cardiology", "neurology", "orthopedics", "ICU"],
        "specialist_roles": [
            "Cardiologist", "Interventional Cardiologist", "Neurologist", 
            "Trauma Surgeon", "Intensivist", "Endocrinologist"
        ]
    },
    {
        "id": "H007",
        "name": "Local Government Hospital",
        "location": {"lat": 12.9716, "lng": 77.5946}, # Central
        "tier": "Tier 3",
        "bed_capacity": {
            "ICU": {"total": 20, "occupied_base": 19},
            "OT": {"total": 4, "occupied_base": 4},
            "General": {"total": 100, "occupied_base": 95}
        },
        "equipment": ["ecg", "defibrillator", "ventilator"],
        "specialties": ["general_surgeon"],
        "specialist_roles": [
            "Emergency Physician", "General Surgeon"
        ]
    },
    {
        "id": "H008",
        "name": "BGS Gleneagles Global",
        "location": {"lat": 12.9069, "lng": 77.5029}, # Kengeri
        "tier": "Tier 1",
        "bed_capacity": {
            "ICU": {"total": 45, "occupied_base": 30},
            "OT": {"total": 12, "occupied_base": 6},
            "General": {"total": 200, "occupied_base": 140}
        },
        "equipment": ["CT", "MRI", "blood_bank", "ventilator", "ecg", "defibrillator", "dialysis", "ecmo"],
        "specialties": ["cardiology", "neurology", "ICU", "gynecology"],
        "specialist_roles": [
            "Pulmonologist", "Thoracic Surgeon", "Neurologist", "Interventional Neuroradiologist",
            "Toxicologist", "Intensivist"
        ]
    }
]

def fetch_live_hospital_status():
    """
    Simulates a live database pull. Adds random jitter to bed occupancies
    and dynamically resolves on-call doctor availability based on roles.
    """
    live_status = []
    
    for h in MOCK_HOSPITALS:
        # Create deep copy config
        hosp = h.copy()
        
        # 1. Calculate dynamic bed availability
        hosp["available_beds"] = {}
        for b_type, counts in h["bed_capacity"].items():
            # Add some random noise between -3 and +3 to base occupancy to mock live state
            noise = random.randint(-3, 3)
            # Ensure occupancy stays within valid bounds (0 to total)
            occ = max(0, min(counts["total"], counts["occupied_base"] + noise))
            hosp["available_beds"][b_type] = counts["total"] - occ
            
        # 2. Assign dynamic specialist availability (simulating doctors marking themselves on shift)
        hosp["available_specialists"] = []
        for i, role in enumerate(h["specialist_roles"]):
            # Primary specialist is always available for Tier 1, others have 80% chance
            if i == 0 and hosp["tier"] == "Tier 1":
                hosp["available_specialists"].append(role)
            elif random.random() < 0.8:
                hosp["available_specialists"].append(role)
                
        live_status.append(hosp)
        
    return live_status
