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
from hospital.router import HospitalRouter

def main():
    print("====================================")
    print("Ignisia Emergency Triage System")
    print("====================================")
    
    # Initialize Core Engines
    try:
        predictor = TriagePredictor()
        router = HospitalRouter()
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
        "gcs": 13, 
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
    
    print("\n>>> Scenario 1: Unstable Patient")
    res1 = predictor.run_pipeline(pt_critical)
    print("\n[AI Inference Output]:")
    print(json.dumps(res1, indent=2))
    
    routes1 = router.find_best_hospitals(res1)
    print("\n[Hospital Routing Readiness Output (Top 3 Eligible)]: ")
    for r in routes1[:3]:
        print(f" - {r['name']} | Capability Score: {r['capability_score']} | Docs Missing: {r['docs_missing']}")


    print("\n\n>>> Scenario 2: Stable Patient")
    res2 = predictor.run_pipeline(pt_stable)
    print("\n[AI Inference Output]:")
    print(json.dumps(res2, indent=2))
    
    routes2 = router.find_best_hospitals(res2)
    print("\n[Hospital Routing Readiness Output (Top 3 Eligible)]: ")
    for r in routes2[:3]:
        print(f" - {r['name']} | Capability Score: {r['capability_score']} | Docs Missing: {r['docs_missing']}")

if __name__ == "__main__":
    main()
