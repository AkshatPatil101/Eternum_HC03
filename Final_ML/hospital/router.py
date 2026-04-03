"""
router.py

Bridging Inference outputs with the mock hospital database to 
intelligently route patients based on severity, bed capacity, doctors, 
and equipment.
"""

from hospitals_db import fetch_live_hospital_status

class HospitalRouter:
    def __init__(self):
        pass
        
    def find_best_hospitals(self, inference_output):
        """
        Takes the output from TriagePredictor.
        Returns a sorted list of eligible hospitals based purely on readiness and capabilities.
        Downstream Maps API will use this list to sort based on ETA and distance.
        """
        print("Finding eligible hospitals for patient based on readiness...")
        if inference_output.get("status") != "success":
            return {"error": "Invalid inference output"}
            
        severity_tier = inference_output["severity"]["tier"]
        severity_score = inference_output["severity"]["score"]
        care_plan = inference_output["care_plan"]
        
        needed_specialists = set(care_plan["specialists_needed"])
        needed_equip = set(care_plan["Equipment_needed"] if "Equipment_needed" in care_plan else care_plan["equipment_needed"])
        needed_tags = set(care_plan["hospital_tags_needed"])
        
        # 1. Fetch live status of all real-time hospitals
        live_hospitals = fetch_live_hospital_status()
        
        ranked_hospitals = []
        for hosp in live_hospitals:
            # --- Hard Constraints based on Severity ---
            failed_hard_constraints = []
            
            # 1. ICU Beds if critical/urgent
            if severity_tier in ["CRITICAL", "URGENT"] and hosp["available_beds"]["ICU"] <= 0:
                failed_hard_constraints.append("No ICU Beds")
                
            # 2. Critical equipment missing
            missing_equip = needed_equip - set(hosp["equipment"])
            if missing_equip:
                failed_hard_constraints.append(f"Missing Equip: {', '.join(missing_equip)}")
                
            # 3. Critical specialist missing IF tier is CRITICAL
            missing_specialists = needed_specialists - set(hosp["available_specialists"])
            present_specialists = needed_specialists.intersection(set(hosp["available_specialists"]))
            
            # If critical, they need AT LEAST ONE of the relevant specialists immediately
            if severity_tier == "CRITICAL" and len(present_specialists) == 0:
                failed_hard_constraints.append(f"No Needed Specialists Present (Missing: {', '.join(missing_specialists)})")
            
            # Skip hospital if it fails life-saving hard constraints on a critical patient
            if severity_tier == "CRITICAL" and failed_hard_constraints:
                continue
                
            # --- Scoring Details ---    
            score = 0
            
            # Equip score (0 to ~30)
            equip_present = len(set(hosp["equipment"]).intersection(needed_equip))
            score += equip_present * 10
            
            # Tag match (0 to ~20)
            tags_present = len(set(hosp["specialties"]).intersection(needed_tags))
            score += tags_present * 5
            
            # Specialist score (0 to ~50)
            specs_present = len(set(hosp["available_specialists"]).intersection(needed_specialists))
            score += specs_present * 20
            
            # Penalty for missing docs on non-critical (since critical filters out totally)
            if severity_tier in ["URGENT", "STABLE"] and missing_specialists:
                score -= len(missing_specialists) * 15
            
            # Package Hospital Res
            ranked_hospitals.append({
                "hospital_id": hosp["id"],
                "name": hosp["name"],
                "capability_score": round(score, 1),
                "live_icu_beds": hosp["available_beds"]["ICU"],
                "live_gen_beds": hosp["available_beds"]["General"],
                "docs_present": list(set(hosp["available_specialists"]).intersection(needed_specialists)),
                "docs_missing": list(missing_specialists),
                "equip_missing": list(missing_equip),
                "rejected_reasons": failed_hard_constraints # For debug/transparent UI
            })
            
        # Sort entirely by Capability Score descending
        ranked_hospitals.sort(key=lambda x: x["capability_score"], reverse=True)
        return ranked_hospitals
