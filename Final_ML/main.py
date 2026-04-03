"""
main.py

End-to-End System Demonstration.
Combines TriagePredictor and HospitalRouter to process raw ambulance data
and produce actionable hospital routes.
"""

import sys
import os

# Setup sys path so python can find the modules without complex env setups
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "src"))
sys.path.append(os.path.join(BASE_DIR, "hospital"))

import json
from src.inference import TriagePredictor
from hospital.router import route_patient, print_routing_result

def main():
    print("====================================")
    print("Ignisia Emergency Triage API Server Simulator")
    print("====================================")
    
    # Initialize Core Engines
    try:
        predictor = TriagePredictor()
    except Exception as e:
        print(f"Error initializing system: {e}")
        print("Please ensure you have run 'python pipeline/src/train_models.py' first!")
        return

    # Mock Patient Inputs
    print("\n[DISPATCH]: Processing new incoming patient...")
    
    # 1. Critical Sepsis Patient
    pt_critical = {
        "hr": 145, 
        "bp_sys": 80, 
        "spo2": 88, 
        "gcs": 8, 
        "temp": 40.5, 
        "rr": 32,
        "confusion": 1, 
        "age": 75, 
        "gender": 1
    }
    
    # 2. Stable Trauma Patient
    pt_stable = {
        "hr": 85,
        "bp_sys": 135,
        "spo2": 99,
        "gcs": 15,
        "temp": 37.1,
        "rr": 16,
        "road_accident": 1,
        "bleeding": 1,
        "age": 28,
        "gender": 0
    }
    
    # --- Scenario 1 ---
    print("\n>>> Scenario 1: Unstable Patient")
    res1 = predictor.run_pipeline(pt_critical)
    print("\n[AI Inference Output]:")
    print(json.dumps(res1, indent=2))
    
    if res1["status"] == "success":
        amburoute_input_1 = {
            "patient_id": "P_UNSTABLE",
            "severity": res1["severity"]["tier"],
            "specialty_needed": res1["care_plan"]["specialists_needed"],
            "equipment_needed": res1["care_plan"]["equipment_needed"],
            "vitals": pt_critical
        }
        routes1 = route_patient(amburoute_input_1)
        print_routing_result(routes1)

    # --- Scenario 2 ---
    print("\n\n>>> Scenario 2: Stable Patient")
    res2 = predictor.run_pipeline(pt_stable)
    print("\n[AI Inference Output]:")
    print(json.dumps(res2, indent=2))
    
    if res2["status"] == "success":
        amburoute_input_2 = {
            "patient_id": "P_STABLE",
            "severity": res2["severity"]["tier"],
            "specialty_needed": res2["care_plan"]["specialists_needed"],
            "equipment_needed": res2["care_plan"]["equipment_needed"],
            "vitals": pt_stable
        }
        routes2 = route_patient(amburoute_input_2)
        print_routing_result(routes2)

if __name__ == "__main__":
    main()
