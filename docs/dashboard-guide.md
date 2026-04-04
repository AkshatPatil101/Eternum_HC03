# Dashboard Guide — Pages, Components & Data Flow

> [← Back to README](../README.md)

---

## Application Routing

**File:** `Frontend/src/App.jsx`

| Route | Component | Role |
|-------|-----------|------|
| `/` | `Landing` | Public — product overview |
| `/select` | `LoginSelection` | Public — role selector |
| `/dashboard` | `Dashboard` | CMO / Dispatch Controller |
| `/emt` | `EmtInterface` | Paramedic / EMT |
| `/hospital-admin` | `HospitalAdmin` | Hospital Administration |
| `/mass-casualty` | `MassCasualtyMode` | CMO — MCI control room |
| `/coming-soon` | `ComingSoon` | Placeholder |

---

## Page: Landing (`/`)

**File:** `Frontend/pages/Landing/Landing.jsx`

The product landing page. Entry point for all users. Presents the system brand, value proposition, and entry CTA routing to `/select`.

---

## Page: Login Selection (`/select`)

**File:** `Frontend/pages/LoginSelection/LoginSelection.jsx`

A role-selector screen. Users choose their operational role:
- **CMO / Dispatch Controller** → routes to `/dashboard`
- **Paramedic / EMT** → routes to `/emt`
- **Hospital Admin** → routes to `/hospital-admin`

---

## Page: Command Dashboard (`/dashboard`)

**File:** `Frontend/pages/Dashboard/Dashboard.jsx`

The primary dispatch interface for the Chief Medical Officer or dispatch controller.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Top Nav: SENTINEL AI | Case Queue | Decision Intel | Emergency  │
│           Mode Badge | Mass Casualty Toggle | Actions            │
├────────┬─────────────────────────────────────┬───────────────────┤
│ Float. │                                     │                   │
│ Side   │     3D MapLibre GL Map              │  Decision Intel   │
│ Nav    │     (pitch 60°, zoom 16, 3D ambu.)  │  Panel            │
│        │     Hospital POI overlays           │                   │
│        │     Ambulance GLB 3D animation      │                   │
└────────┴─────────────────────────────────────┴───────────────────┘
│  Left Panel: Case Queue                                          │
└──────────────────────────────────────────────────────────────────┘
```

### Left Panel — Case Queue

A vertical scrollable list of active emergency cases, each card showing:
- Severity badge (`CRITICAL` / `MODERATE` / `STABLE`)
- Case ID (e.g., `#CASE-4402`)
- Incident type and patient count
- Quick-glance vitals (HR, BP)
- Assignment status (`PENDING` / `ASSIGNED`)

### Right Panel — Decision Intelligence

When a case is selected, this panel shows:

1. **Resource Needs** — AI-predicted requirements grid (ICU Bed: Required, Ventilator: Priority, etc.)
2. **Recommended Facility Card** — Hospital name, fit score (%), distance, ETA, and a **Route Unit** button
3. **Why This Hospital? (Explainability)** — Bullet-point reasoning:
   - Real-time ICU/ventilator availability
   - Closest facility with the required specialist on-call
   - Traffic-optimized ETA comparison vs alternatives

### Floating Side Navigation

A vertical icon bar (left center) for quick access:
| Icon | Route |
|------|-------|
| `clinical_notes` | `/select` |
| `emergency` | `/mass-casualty` |
| `monitor_heart` | `/coming-soon` |
| `medical_services` | `/coming-soon` |
| `history` | `/coming-soon` |

### 3D Map Layer

See the [3D Map Technical Stack](#3d-map--map3djsx) section below.

---

## Page: EMT Interface (`/emt`)

**File:** `Frontend/pages/EmtInterface/EmtInterface.jsx`

The primary data entry interface for paramedics in the field. Designed for fast, low-friction data input under pressure.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Top Nav: Clinical Architect | Unit 742 sidebar                  │
├──────────────────────────────────────────────┬───────────────────┤
│  Primary Vitals (3-card row)                 │  Route           │
│  [ BPM ] [ SYS/DIA ] [ SpO2 ]               │  Intelligence    │
│                                              │  Panel           │
│  Secondary Vitals (3-card row)               │                  │
│  [ GCS ] [ Temp°C ] [ RR ]                  │  [Analyze        │
│                                              │   & Route]       │
│  Patient Info: Age | Gender                  │                  │
│                                              │                  │
│  Symptoms (13 toggle buttons, 4-col grid)    │                  │
└──────────────────────────────────────────────┴───────────────────┘
```

### Vitals Cards

Each vital occupies a card (`VitalsCard` component) with:
- Large numeric input (editable `<input type="number">`)
- Colored Material Symbol icon per vital
- Label badge

Blood pressure uses a special `BloodPressureCard` with dual inputs (systolic / diastolic).

### Symptom Toggles

13 symptom flags as toggle buttons: `Pupils Unequal`, `Chest Pain`, `Sweating`, `Collapse`, `Road Accident`, `Bleeding`, `Breathlessness`, `Wheezing`, `Confusion`, `Drug Intake`, `Pregnancy`, `Diabetes`, `ECG Abnormal`.

Selected symptoms turn teal; unselected are neutral. State is compiled into `0/1` flags automatically.

### Compiled Patient Data Object

A `useEffect` hook reactively compiles all vitals, demographics, and symptom flags into a single structured `ptData` object kept in sync with all input state.

### Analyze & Route Button

On click:
1. `ptData` is sent via `POST http://localhost:8000/triage`
2. The response (ranked hospitals + care plan) is returned
3. The result is pushed downstream (via `/dispatch-route`) to the WebSocket bridge, which triggers the 3D map animation in the command dashboard

### Symptom Key Mapping

| Display Label | API Key |
|--------------|---------|
| Pupils Unequal | `pupils_unequal` |
| Chest Pain | `chest_pain` |
| Sweating | `sweating` |
| Collapse | `collapse` |
| Road Accident | `road_accident` |
| Bleeding | `bleeding` |
| Breathlessness | `breathlessness` |
| Wheezing | `wheezing` |
| Confusion | `confusion` |
| Drug Intake | `drug_intake` |
| Pregnancy | `pregnancy` |
| Diabetes | `known_diabetes` |
| ECG Abnormal | `ecg_abnormal` |

---

## Page: Mass Casualty Mode (`/mass-casualty`)

**File:** `Frontend/pages/MassCasualtyMode/MassCasualtyMode.jsx`

A full-screen MCI (Mass Casualty Incident) control room. Activated during multi-patient events.

### Bento Grid Layout (Top Row)

**Left (8/12 cols) — Regional Map Visualizer:**
- Static map image with SVG routing path overlay (dashed lines from incident sites to hospitals)
- Interactive incident markers:
  - `MCI SITE ALPHA` — pulsing red dot, hover shows patient count
  - `TRIAGE VAN 4` — green dot, hover shows status
- Capacity summary card (top-left overlay): Total Victims counter + fill bar
- Map controls (zoom in/out/center)

**Right (4/12 cols) — Hospital Capacity Dashboard:**
- Per-hospital capacity bars with color-coded load:
  - North Memorial Trauma → 98% → red (`Diverting non-MCI`)
  - St. Jude General → 42% → teal (`Accepting Level 2-3`)
  - City Central ER → 76% → orange (`ICU Limited`)
- **AI Logistics Recommendation** card: Sentinel AI suggestion for redistribution of incoming patients to prevent capacity concentration

### Active Critical Cases Feed (Bottom)

A 3-column grid of patient cards, each showing:
- START triage tag: `RED - IMMEDIATE` / `YELLOW - DELAYED` / `GREEN - MINOR`
- Patient ID and identity (identified/unidentified)
- Case description (Severe Trauma, Fractures/Blood Loss, Respiratory Distress)
- Two vital cards (HR, SpO₂ or BP)
- ETA and destination hospital

### Floating Notification Bar

Fixed at the bottom center — displays active system alerts (e.g., *"North Memorial at Max Capacity — Rerouting Hub Active"*) with a **Confirm Redirect** action button.

---

## Page: Hospital Admin (`/hospital-admin`)

**File:** `Frontend/pages/HospitalAdmin/HospitalAdmin.jsx`

Hospital-side interface for bed management, ICU occupancy tracking, specialist on-duty updates, and incoming transfer readiness. (~27KB — most complex admin page.)

---

## 3D Map — `Map3D.jsx`

**File:** `Frontend/src/components/Map3D.jsx`

### Tech Stack

| Component | Library | Detail |
|-----------|---------|--------|
| Base Map | MapLibre GL v5 | OpenFreeMap vector tiles |
| 3D Configuration | MapLibre | Pitch 60°, Zoom 16, Antialias WebGL |
| 3D Ambulance | Three.js + GLTFLoader | Custom WebGL layer, `Ambulance.glb` model |
| Hospital POIs | MapLibre Symbol Layer | Custom canvas-drawn red cross icon |
| Route Geometry | OSRM Public API | Real driving-road coordinates |
| Animation | `requestAnimationFrame` | 35 m/s simulated speed + bearing rotation |
| Live Updates | WebSocket | `ws://localhost:8080` |

### Ambulance Animation (`Userrouting.jsx`)

The `useRouting` hook manages:
1. **Route fetch** — `GET https://router.project-osrm.org/route/v1/driving/{from};{to}?overview=full&geometries=geojson`
2. **Distance array** — Haversine-calculated cumulative distances along route segments
3. **Frame animation** — Interpolates ambulance position along route at 35 m/s, computing bearing for model rotation
4. **Trail rendering** — Live polyline trace of ambulance path (MapLibre GeoJSON source updated per frame)
5. **Markers** — Blue origin marker, red destination marker

Two ambulances animate simultaneously along independent routes.

### Hospital / Clinic Markers

On map style load, a canvas-drawn red cross icon is registered as a MapLibre image. A symbol layer is added over the OpenFreeMap POI vector source, filtered to `class == "hospital"` or `class == "clinic"`, showing the icon + name label in red.

---

> 📖 **[API Reference →](api-reference.md)**
> 📖 **[Installation →](installation.md)**
