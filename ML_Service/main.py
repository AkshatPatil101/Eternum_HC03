import os
import sys
import json
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# --- Path Setup (matching your main.py logic) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "src"))
sys.path.append(os.path.join(BASE_DIR, "hospital"))

from src.inference import TriagePredictor
from hospital.router import route_patient

# Trauma Vision model (lazy-loaded so startup doesn't fail if torch is missing)
try:
    from src.trauma_vision import TraumaVisionPredictor
    vision_predictor = TraumaVisionPredictor()
    print("TraumaVision model loaded successfully.")
except Exception as _ve:
    vision_predictor = None
    print(f"[WARN] TraumaVision not available: {_ve}")

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
    # Vital signs
    hr: float
    bp_sys: float
    bp_dia: float = 80.0
    spo2: float
    gcs: float
    temp: float
    rr: float
    age: int
    gender: int
    glucose: float = 100.0
    # All symptom flags (matching SYMPTOM_COLS in feature_engineering.py)
    pupils_unequal: int = 0
    chest_pain: int = 0
    sweating: int = 0
    collapse: int = 0
    road_accident: int = 0
    bleeding: int = 0
    breathlessness: int = 0
    wheezing: int = 0
    confusion: int = 0
    drug_intake: int = 0
    pregnancy: int = 0
    known_diabetes: int = 0
    ecg_abnormal: int = 0
    # Optional override from trauma vision
    trauma_scene_high_severity: bool = False

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
    pt_dict = patient.model_dump()

    # 2. Run AI Inference (TriagePredictor)
    try:
        triage_res = predictor.run_pipeline(pt_dict)
        # Apply Trauma override if the frontend says the photo was CRITICAL
        if patient.trauma_scene_high_severity:
            triage_res["severity"]["tier"] = "CRITICAL"
            triage_res["severity"]["score"] = max(triage_res["severity"].get("score", 0), 85)
            triage_res["severity"]["override_source"] = "Trauma Vision AI"
    except Exception as e:
        import traceback
        print(traceback.format_exc())
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

@app.get("/trauma-scan/status")
async def get_trauma_scan_status():
    return {"available": vision_predictor is not None}

@app.post("/trauma-scan")
async def run_trauma_scan(file: UploadFile = File(...)):
    if not vision_predictor:
        raise HTTPException(status_code=503, detail="TraumaVision model not available.")
    
    try:
        contents = await file.read()
        result = vision_predictor.predict(contents)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)