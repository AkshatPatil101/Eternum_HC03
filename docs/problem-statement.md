# Problem Statement & Solution Context

> [← Back to README](../README.md)

---

## The Problem

During medical emergencies, ambulances are routinely dispatched to the **nearest hospital** — only to arrive and discover that the required ventilator is occupied, the relevant specialist is off-duty, or the ICU is at capacity. This reactive routing wastes the most critical minutes of a patient's **golden hour** — the first 60 minutes following a traumatic injury or cardiac event, during which treatment is most likely to prevent death.

The problem compounds during **mass casualty events**: a major accident can simultaneously flood a single trauma center while other capable facilities nearby sit underutilized. There is no system today that prevents this concentration at the point of dispatch.

### The Core Bottlenecks

| Bottleneck | Description |
|---|---|
| **Blind routing** | Dispatch centers use only GPS distance. Hospital capability is invisible at dispatch time. |
| **Discovery on arrival** | EMTs and paramedics learn of resource unavailability (ventilator, specialist, ICU) only after arrival, wasting irreversible minutes. |
| **No load distribution** | During multi-patient events, there is no mechanism to prevent all ambulances from routing to the same facility. |
| **Zero reservation** | Beds/equipment are not held for an inbound patient, so double-routing occurs. |
| **Black-box dispatch** | Dispatchers cannot explain *why* a hospital was chosen. Auditing is impossible. |

---

## The HC03 Challenge

> *"What is needed is a system that predicts what a patient will need before arrival and routes the ambulance to the nearest hospital that is actually capable of treating them right now."*

This project is the answer to HC03 — a hackathon challenge requiring:

1. A **severity prediction model** that takes initial vitals and symptom inputs and outputs predicted care requirements (ICU, ventilator, specialist type).
2. A **constraint-based optimization engine** routing to the optimal hospital given equipment availability, load, specialist availability, and transit time simultaneously.
3. An **interactive map dashboard** simulating ambulance routing with real-time hospital status updates.
4. An **explainability panel** stating exactly why a specific hospital was chosen over alternatives.
5. A **batch-optimization mode** that handles simultaneous multi-patient routing during a mass casualty event without overloading a single facility.

---

## Our Solution: Sentinel AI — Ignisia

### Two-Engine Architecture

**Engine 1 — AI Triage (TriagePredictor)**

An ML inference pipeline that takes raw EMT-reported vitals and symptom flags and produces:
- A predicted **emergency type** (e.g., `cardiac`, `stroke_neuro`, `trauma`) with a confidence score
- A 0–100 **severity score** computed via a five-factor clinical formula
- A **severity tier** (`CRITICAL / URGENT / STABLE`)
- A complete **care plan**: required specialists, equipment, hospital specialty tags

**Engine 2 — Constraint-Based Router (route_patient)**

A deterministic scoring engine that, given the care plan, evaluates a live grid of 18 regional Pune hospitals against four simultaneous constraints:
- Specialty match (does this hospital have the required doctors?)
- Equipment match (does this hospital have the required devices?)
- Bed availability (with active reservations deducted)
- Hospital capability level (Tier 1 / Tier 2 / Tier 3)

Weights shift dynamically based on severity tier — a CRITICAL patient weighs specialty match most heavily; a STABLE patient weighs bed availability more.

### Mass Casualty Mode

During a multi-patient event, the system:
- Routes each patient independently through the two-engine pipeline
- The soft reservation system automatically deducts held beds from subsequent patients' scoring, preventing capacity concentration
- The Mass Casualty Mode dashboard provides a live control room view of all active cases, regional capacity grid, AI redistribution recommendations, and incident site markers

---

## Expected Outcome

A centralized emergency dispatch platform that:
- Accepts EMT-reported patient vitals and symptoms
- Predicts critical care needs using a trained ML ensemble
- Routes the ambulance to the **optimal capable hospital**, not just the nearest
- Displays the routing rationale, specialties matched, equipment matched, and bed counts
- Dynamically prevents double-routing via soft reservations
- Scales to simultaneous multi-patient events without concentrating load on a single facility

---

> 📖 **[ML Pipeline Deep Dive →](ml-pipeline.md)**
> 📖 **[Routing Engine Details →](routing-engine.md)**
