# Installation & Setup Guide

> [← Back to README](../README.md)

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| Python | 3.10+ | For the ML Service |
| Node.js | 18+ | For Backend + Frontend |
| npm | 9+ | Bundled with Node.js 18+ |
| GPU (optional) | CUDA 11.8+ | Accelerates XGBoost training only |

---

## Repository Structure

```
Eternum_Latest/
├── ML_Service/   # Python FastAPI
├── Backend/      # Node.js WebSocket bridge
├── Frontend/     # React 19 Vite app
└── docs/         # Documentation
```

All three services run independently and communicate via HTTP and WebSocket. Start them in separate terminals.

---

## Service 1 — ML Service (AI Triage + Routing API)

### Install Dependencies

```bash
cd ML_Service
pip install fastapi uvicorn[standard] xgboost lightgbm scikit-learn pandas numpy
```

For GPU-accelerated XGBoost training (optional):
```bash
pip install xgboost[cuda]
```

### Start the Server

```bash
python main.py
# → Uvicorn serves on http://0.0.0.0:8000
```

On startup, the server:
1. Loads `models/preprocessor.pkl` (KNNImputer + StandardScaler)
2. Loads `models/xgb_model.json` (XGBoost classifier)
3. Loads `models/lgbm_model.pkl` (LightGBM classifier)
4. Prints: `AI Models and Routing Engine loaded successfully.`

### Verify

```bash
curl http://localhost:8000/
# Expected: { "status": "online", "message": "Ignisia Emergency Triage API Server" }
```

---

## Service 2 — Backend (WebSocket Bridge)

### Install Dependencies

```bash
cd Backend
npm install
```

Installed packages: `express`, `ws`, `cors`, `nodemon` (dev).

### Start the Server

```bash
npm run dev
# → http://localhost:8080
# → WebSocket ready at ws://localhost:8080
```

### Verify

```bash
curl -X POST http://localhost:8080/dispatch-route \
  -H "Content-Type: application/json" \
  -d '{ "from": { "lat": 18.51, "lng": 73.85 }, "to": { "lat": 18.53, "lng": 73.87 } }'
# Expected: { "message": "Data received. Queuing for WebSocket push in 4s." }
```

---

## Service 3 — Frontend (React Dashboard)

### Install Dependencies

```bash
cd Frontend
npm install
```

Key packages: `react@19`, `react-router-dom@7`, `maplibre-gl@5`, `three@0.183`, `tailwindcss@3`.

### Start the Dev Server

```bash
npm run dev
# → http://localhost:5173
```

### Assets

Place the 3D ambulance model at:
```
Frontend/public/Ambulance.glb
```

The `Map3D.jsx` component loads this file via `GLTFLoader`. Without it, the map still renders but no 3D ambulance models appear.

---

## Optional — Train ML Models from Scratch

Pre-trained models are included in `ML_Service/models/`. Only run this if you have a new dataset or want to retrain.

### Dataset

Place the parquet dataset at:
```
ML_Service/data/triage_dataset_v2.parquet
```

### Run Training

```bash
cd ML_Service
python src/train_models.py
```

This:
1. Loads and preprocesses the parquet dataset
2. Trains XGBoost (GPU if available, else CPU fallback)
3. Trains LightGBM with balanced class weights
4. Evaluates individual models + soft-vote ensemble
5. Prints weighted F1, accuracy, and a classification report per Emergency Type
6. Saves:
   - `models/xgb_model.json`
   - `models/lgbm_model.pkl`
   - `models/preprocessor.pkl`

### Test Inference Locally

```bash
cd ML_Service/src
python inference.py
```

Runs two test patients (urgent cardiac, stable diabetic) and prints structured JSON results.

---

## Port Configuration

| Service | Default Port | Env Override | Config Location |
|---------|-------------|-------------|----------------|
| ML Service | `8000` | Modify `main.py:uvicorn.run(app, port=...)` | `ML_Service/main.py` |
| WebSocket Bridge | `8080` | Modify `server.js:PORT` | `Backend/src/server.js` |
| Frontend | `5173` | `vite.config.js: server.port` | `Frontend/vite.config.js` |

If you change any port, also update the corresponding fetch/WebSocket URLs:
- `EmtInterface.jsx` line 81: `http://localhost:8000/triage`
- `Map3D.jsx` line 54: `ws://localhost:8080`

---

## Production Deployment Notes

| Concern | Development | Production |
|---------|-------------|-----------|
| **CORS** | Open (`*`) in both services | Restrict to frontend origin |
| **Soft Reservations** | In-memory Python dict | Replace with Redis TTL keys |
| **Hospital Beds** | Randomized per request | Connect to real bed management API |
| **Ambulance asset** | Local `/public/Ambulance.glb` | Host on CDN |
| **WS relay delay** | Hard-coded 4s in `server.js` | Make configurable via env |
| **Models** | Loaded at startup | Consider model registry (MLflow) |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Initialization Error` on ML startup | Missing model files | Check `ML_Service/models/` for all 3 files |
| `Inference failed: preprocessing failed` | Feature shape mismatch | Ensure preprocessor.pkl matches training feature list |
| Map tiles don't load | Network issue | OpenFreeMap requires internet access for tile fetching |
| Ambulance GLB not showing | Missing `Ambulance.glb` | Place GLB in `Frontend/public/` |
| WebSocket disconnected | Wrong port / backend not running | Start backend first, check port 8080 |
| TRIAGE POST 500 | ML service not running | Start ML service on port 8000 first |

---

> 📖 **[API Reference →](api-reference.md)**
> 📖 **[ML Pipeline →](ml-pipeline.md)**
