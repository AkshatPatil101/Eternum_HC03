# API Reference

> [← Back to README](../README.md)

---

## Services Overview

| Service | Base URL | Protocol | Purpose |
|---------|---------|----------|---------|
| ML Service | `http://localhost:8000` | HTTP / REST | Triage inference + hospital routing |
| WebSocket Bridge | `http://localhost:8080` | HTTP + WebSocket | Live map dispatch relay |

---

## ML Service — FastAPI

**Startup:**
```bash
cd ML_Service
python main.py
# uvicorn serves on 0.0.0.0:8000
```

**Interactive Docs (auto-generated):** `http://localhost:8000/docs`

---

### `GET /`

Health check. Returns server status.

**Response:**
```json
{
    "status": "online",
    "message": "Ignisia Emergency Triage API Server"
}
```

---

### `POST /triage`

The core endpoint. Accepts raw patient vitals + symptom flags, runs the full AI inference pipeline, and returns a triage summary + ranked hospital list.

#### Request Body Schema (`PatientData`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hr` | `float` | ✅ | Heart rate (bpm) |
| `bp_sys` | `float` | ✅ | Systolic blood pressure (mmHg) |
| `spo2` | `float` | ✅ | Oxygen saturation (%) |
| `gcs` | `float` | ✅ | Glasgow Coma Scale (3–15) |
| `temp` | `float` | ✅ | Temperature (°C) |
| `rr` | `float` | ✅ | Respiratory rate (breaths/min) |
| `age` | `int` | ✅ | Patient age (years) |
| `gender` | `int` | ✅ | 0 = Male, 1 = Female, 2 = Other |
| `confusion` | `int` | ⬜ default 0 | Confusion flag (0/1) |
| `road_accident` | `int` | ⬜ default 0 | Road accident flag (0/1) |
| `bleeding` | `int` | ⬜ default 0 | Active bleeding flag (0/1) |
| `pupils_unequal` | `int` | ⬜ default 0 | Unequal pupils (0/1) |
| `chest_pain` | `int` | ⬜ default 0 | Chest pain (0/1) |
| `sweating` | `int` | ⬜ default 0 | Diaphoresis (0/1) |
| `collapse` | `int` | ⬜ default 0 | Collapse/syncope (0/1) |
| `breathlessness` | `int` | ⬜ default 0 | Breathlessness (0/1) |
| `wheezing` | `int` | ⬜ default 0 | Wheezing (0/1) |
| `drug_intake` | `int` | ⬜ default 0 | Drug intake / OD flag (0/1) |
| `pregnancy` | `int` | ⬜ default 0 | Current pregnancy (0/1) |
| `known_diabetes` | `int` | ⬜ default 0 | Known diabetic (0/1) |
| `ecg_abnormal` | `int` | ⬜ default 0 | ECG abnormality (0/1) |

#### Example Request — Critical Cardiac

```bash
curl -X POST http://localhost:8000/triage \
  -H "Content-Type: application/json" \
  -d '{
    "hr": 145,
    "bp_sys": 75,
    "spo2": 85,
    "gcs": 8,
    "temp": 37.2,
    "rr": 28,
    "age": 62,
    "gender": 0,
    "chest_pain": 1,
    "sweating": 1,
    "ecg_abnormal": 1
  }'
```

#### Example Request — Stable Diabetic

```bash
curl -X POST http://localhost:8000/triage \
  -H "Content-Type: application/json" \
  -d '{
    "hr": 88,
    "bp_sys": 130,
    "spo2": 97,
    "gcs": 15,
    "temp": 37.1,
    "rr": 16,
    "age": 55,
    "gender": 1,
    "known_diabetes": 1
  }'
```

#### Response Schema

```json
{
    "triage_summary": {
        "score": 78.4,
        "tier": "CRITICAL"
    },
    "care_plan": {
        "specialists_needed": [
            "Cardiologist",
            "Interventional Cardiologist",
            "Cardiac Surgeon"
        ],
        "equipment_needed": [
            "ecg",
            "defibrillator",
            "cath_lab",
            "ventilator",
            "ecmo"
        ],
        "hospital_tags_needed": [
            "cardiology",
            "cardiac_surgery",
            "ICU",
            "CCU"
        ]
    },
    "hospitals": {
        "patient_id": "API_REQUEST_a3f1",
        "severity": "CRITICAL",
        "vitals_critical_flag": true,
        "specialties_requested": ["cardiology", "cardiac_surgery", "ICU", "CCU"],
        "equipment_requested": ["ecg", "defibrillator", "cath_lab", "ventilator", "ecmo"],
        "matched_hospitals": [
            {
                "hospital_id": "H01",
                "name": "Ruby Hall Clinic (Sassoon Road)",
                "area": "Camp / Central Pune",
                "lat": 18.5314,
                "lng": 73.8742,
                "level": 1,
                "score": 0.9312,
                "specialty_match": 1.0,
                "equipment_match": 1.0,
                "bed_score": 0.72,
                "icu_beds_free": 3,
                "general_beds_free": 48,
                "trauma_center": true,
                "nabh_accredited": true,
                "er_capable": true,
                "specialties": ["cardiology", "cardiac_surgery", "ICU", "CCU", "..."],
                "equipment": ["ventilator", "cath_lab", "MRI", "CT", "ecmo", "..."],
                "reservation_status": "tentatively_reserved",
                "reservation_expires_in_mins": 15
            },
            {
                "hospital_id": "H02",
                "name": "Deenanath Mangeshkar Hospital",
                "score": 0.8874,
                "specialty_match": 1.0,
                "equipment_match": 1.0,
                "icu_beds_free": 1,
                "reservation_status": "not_reserved"
            }
        ],
        "total_matched": 6,
        "scoring_weights_used": {
            "specialty": 0.45,
            "equipment": 0.30,
            "bed": 0.15,
            "level": 0.10
        }
    }
}
```

#### Error Responses

| Status | Condition | Response |
|--------|-----------|----------|
| `500` | Inference engine not initialized | `{ "detail": "Inference engine not initialized." }` |
| `500` | Preprocessing failure | `{ "detail": "Inference failed: <error>" }` |
| `500` | Routing failure | `{ "detail": "Routing failed: <error>" }` |
| `400` | AI failed on vitals | `{ "detail": "AI failed to process patient vitals." }` |

---

## WebSocket Bridge — Node.js

**Startup:**
```bash
cd Backend
npm run dev
# Express on http://localhost:8080
# WebSocket on ws://localhost:8080
```

---

### `POST /dispatch-route`

Accepts routing data and pushes it to **all connected WebSocket clients** (the Map3D dashboard) after a 4-second relay delay.

#### Request Body

```json
{
    "from": { "lat": 18.5174, "lng": 73.8553 },
    "to":   { "lat": 18.5314, "lng": 73.8742 }
}
```

#### Response (HTTP 202)

```json
{
    "message": "Data received. Queuing for WebSocket push in 4s."
}
```

#### WebSocket Push Payload

The WebSocket server broadcasts the same `from/to` object to all connected clients. The `Map3D.jsx` component listens on `ws://localhost:8080` and calls `drawRoute()` when it receives the event:

```javascript
wsRef.current.onmessage = (event) => {
    const routeData = JSON.parse(event.data);
    if (drawRoute && routeData.from && routeData.to) {
        drawRoute([{ from: routeData.from, to: routeData.to }]);
    }
};
```

---

## CORS Configuration

Both services have CORS open to all origins (`*`) for development. Restrict to specific frontend origins before any production deployment.

---

> 📖 **[Dashboard Guide →](dashboard-guide.md)**
> 📖 **[Installation →](installation.md)**
