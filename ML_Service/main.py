import os
import sys
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# --- Path Setup (matching your main.py logic) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "src"))
sys.path.append(os.path.join(BASE_DIR, "hospital"))

from src.inference import TriagePredictor
from hospital.router import route_patient

# --- Initialize FastAPI and Core Engines ---
app = FastAPI(title="Ignisia Emergency Triage API")

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # front-end URLs
    allow_credentials=True,
    allow_methods=["*"],         # GET, POST, etc.
    allow_headers=["*"],         # Allow headers like Content-Type
)


try:
    predictor = TriagePredictor()
    print("AI Models and Routing Engine loaded successfully.")
except Exception as e:
    print(f"Initialization Error: {e}")
    predictor = None

# --- Data Schemas ---
class PatientData(BaseModel):
    # Required vital signs based on your main.py scenarios
    hr: float
    bp_sys: float
    spo2: float
    gcs: float
    temp: float
    rr: float
    age: int
    gender: int
    # Optional flags
    confusion: int = 0
    road_accident: int = 0
    bleeding: int = 0

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"status": "online", "message": "Ignisia Emergency Triage API Server"}

@app.post("/triage")
async def get_hospital_routing(patient: PatientData):
    """
    Receives raw patient data, runs AI triage, 
    and returns a ranked list of hospitals.
    """
    if not predictor:
        raise HTTPException(status_code=500, detail="Inference engine not initialized.")

    # 1. Convert Pydantic model to dictionary for the predictor
    pt_dict = patient.dict()

    # 2. Run AI Inference (TriagePredictor)
    try:
        triage_res = predictor.run_pipeline(pt_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

    if triage_res.get("status") != "success":
        raise HTTPException(status_code=400, detail="AI failed to process patient vitals.")

    # 3. Format input for HospitalRouter
    routing_input = {
        "patient_id": "API_REQUEST_" + str(os.urandom(2).hex()),
        "severity": triage_res["severity"]["tier"],
        "specialty_needed": triage_res["care_plan"]["specialists_needed"],
        "equipment_needed": triage_res["care_plan"]["equipment_needed"],
        "vitals": pt_dict
    }

    # 4. Get Routing Result
    try:
        hospital_routes = route_patient(routing_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing failed: {str(e)}")

    # 5. Return combined data
    return {
        "triage_summary": triage_res["severity"],
        "care_plan": triage_res["care_plan"],
        "hospitals": hospital_routes
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)