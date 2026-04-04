import React, { useState, useEffect } from "react";
import supabase from "../../src/lib/supabase";

const HOSPITALS_PUNE = [
  {
    "id": "H01",
    "name": "Ruby Hall Clinic (Sassoon Road)",
    "mapped_to": "Rangehills Dispensary",
    "lat": 18.5508, "lng": 73.8415,
    "area": "Camp / Central Pune",
    "level": 1,
    "total_beds": 600,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "cardiac_surgery", "neurology", "neurosurgery", "general_surgeon", "orthopedics", "oncology", "nephrology", "urology", "gastroenterology", "ICU", "NICU", "CCU", "transplant", "burns", "psychiatry", "pediatrics"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "ecmo", "dialysis", "PET_CT", "robotic_surgery", "blood_bank", "neuro_interventional_cath_lab"],
    "nabh_accredited": true
  },
  {
    "id": "H02",
    "name": "Deenanath Mangeshkar Hospital",
    "mapped_to": "Dr. Jain's Dental Care",
    "lat": 18.5428, "lng": 73.8386,
    "area": "Erandwane",
    "level": 1,
    "total_beds": 750,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "cardiac_surgery", "neurology", "neurosurgery", "general_surgeon", "orthopedics", "oncology", "nephrology", "urology", "gastroenterology", "ICU", "NICU", "CCU", "transplant", "robotic_surgery", "pediatrics", "gynecology"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "ecmo", "dialysis", "PET_CT", "robotic_surgery", "blood_bank", "human_milk_bank", "cardiac_ambulance"],
    "nabh_accredited": true
  },
  {
    "id": "H03",
    "name": "Sahyadri Super Speciality Hospital (Deccan)",
    "mapped_to": "Dalvi Hospital",
    "lat": 18.5330, "lng": 73.8486,
    "area": "Deccan Gymkhana",
    "level": 1,
    "total_beds": 202,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["neurology", "neurosurgery", "cardiology", "cardiac_surgery", "oncology", "bone_marrow_transplant", "ICU", "CCU", "general_surgeon", "orthopedics", "urology", "transplant", "hematology", "gastroenterology", "pediatrics"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "ecmo", "dialysis", "PET_CT", "blood_bank", "bone_marrow_unit", "liver_transplant_suite"],
    "nabh_accredited": true
  },
  {
    "id": "H04",
    "name": "Apollo Jehangir Hospital",
    "mapped_to": "Sancheti Hospital",
    "lat": 18.5299, "lng": 73.8529,
    "area": "Sassoon Road / Camp",
    "level": 1,
    "total_beds": 350,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "cardiac_surgery", "neurology", "general_surgeon", "orthopedics", "oncology", "nephrology", "urology", "gastroenterology", "ICU", "CCU", "NICU", "pediatrics", "gynecology", "psychiatry"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "dialysis", "blood_bank", "robotic_surgery", "PET_CT"],
    "nabh_accredited": true
  },
  {
    "id": "H05",
    "name": "Kokilaben Hospital Pune (Kharadi)",
    "mapped_to": "ASG Eye Hospital",
    "lat": 18.5289, "lng": 73.8436,
    "area": "Kharadi / East Pune",
    "level": 1,
    "total_beds": 300,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "cardiac_surgery", "neurology", "neurosurgery", "general_surgeon", "orthopedics", "oncology", "ICU", "CCU", "NICU", "transplant", "urology", "gastroenterology"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "ecmo", "dialysis", "blood_bank", "robotic_surgery"],
    "nabh_accredited": true
  },
  {
    "id": "H06",
    "name": "Manipal Hospital Baner",
    "mapped_to": "Wagh Eye Clinic",
    "lat": 18.5252, "lng": 73.8437,
    "area": "Baner / West Pune",
    "level": 1,
    "total_beds": 250,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "neurology", "general_surgeon", "orthopedics", "oncology", "ICU", "CCU", "nephrology", "urology", "gastroenterology", "pediatrics", "gynecology"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "dialysis", "blood_bank"],
    "nabh_accredited": true
  },
  {
    "id": "H07",
    "name": "Nanavati Max Hospital (Viman Nagar)",
    "mapped_to": "Dr. Karve Children's Hospital",
    "lat": 18.5252, "lng": 73.8499,
    "area": "Viman Nagar / East Pune",
    "level": 1,
    "total_beds": 280,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "cardiac_surgery", "neurology", "neurosurgery", "general_surgeon", "orthopedics", "ICU", "CCU", "nephrology", "oncology", "urology", "pediatrics"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "dialysis", "ecmo", "blood_bank"],
    "nabh_accredited": true
  },
  {
    "id": "H08",
    "name": "DPU Super Specialty Hospital (Pimpri)",
    "mapped_to": "Pune Fertility Center",
    "lat": 18.5312, "lng": 73.8465,
    "area": "Pimpri-Chinchwad (PCMC)",
    "level": 1,
    "total_beds": 500,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "cardiac_surgery", "neurology", "neurosurgery", "general_surgeon", "orthopedics", "oncology", "ICU", "CCU", "NICU", "transplant", "nephrology", "urology", "gastroenterology", "pediatrics", "gynecology", "psychiatry"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "ecmo", "dialysis", "blood_bank", "heart_transplant_suite", "PET_CT"],
    "nabh_accredited": true
  },
  {
    "id": "H09",
    "name": "Sancheti Hospital",
    "mapped_to": "Pandit Clinic",
    "lat": 18.5233, "lng": 73.8496,
    "area": "Shivajinagar",
    "level": 2,
    "total_beds": 300,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["orthopedics", "spine_surgery", "trauma", "general_surgeon", "ICU", "physiotherapy", "pediatric_orthopedics"],
    "equipment": ["ventilator", "CT", "MRI", "defibrillator", "C_arm", "blood_bank"],
    "nabh_accredited": true
  },
  {
    "id": "H10",
    "name": "Sahyadri Super Speciality (Hadapsar)",
    "mapped_to": "The Urology Clinic (Dr. Ketan Pai)",
    "lat": 18.5223, "lng": 73.8517,
    "area": "Hadapsar / East Pune",
    "level": 2,
    "total_beds": 201,
    "er_capable": true,
    "trauma_center": false,
    "specialties": ["cardiology", "neurology", "neurosurgery", "general_surgeon", "orthopedics", "oncology", "ICU", "CCU", "NICU", "urology", "gastroenterology", "gynecology", "pediatrics"],
    "equipment": ["ventilator", "cath_lab", "MRI", "CT", "defibrillator", "dialysis", "PET_CT", "blood_bank"],
    "nabh_accredited": true
  },
  {
    "id": "H11",
    "name": "Sahyadri Super Speciality (Nagar Road)",
    "mapped_to": "eshavari clinic",
    "lat": 18.5265, "lng": 73.8540,
    "area": "Yerawada / Nagar Road",
    "level": 2,
    "total_beds": 130,
    "er_capable": true,
    "trauma_center": false,
    "specialties": ["cardiology", "neurology", "general_surgeon", "orthopedics", "ICU", "CCU", "NICU", "urology", "gastroenterology", "gynecology", "pediatrics"],
    "equipment": ["ventilator", "cath_lab", "CT", "MRI", "defibrillator", "dialysis", "blood_bank"],
    "nabh_accredited": true
  },
  {
    "id": "H12",
    "name": "Lokmanya Hospital (Chinchwad)",
    "mapped_to": "Kamla Nehru Hospital",
    "lat": 18.5227, "lng": 73.8622,
    "area": "Chinchwad / PCMC",
    "level": 2,
    "total_beds": 250,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "neurology", "general_surgeon", "orthopedics", "ICU", "CCU", "trauma", "burns", "nephrology", "urology"],
    "equipment": ["ventilator", "CT", "MRI", "defibrillator", "dialysis", "blood_bank", "burns_unit"],
    "nabh_accredited": false
  },
  {
    "id": "H13",
    "name": "AIMS Multispeciality Hospital (Aundh)",
    "mapped_to": "Milenkari Clinic",
    "lat": 18.5242, "lng": 73.8610,
    "area": "Aundh / NW Pune",
    "level": 2,
    "total_beds": 250,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["cardiology", "neurology", "general_surgeon", "orthopedics", "ICU", "urology", "gastroenterology", "gynecology", "pediatrics", "emergency_medicine"],
    "equipment": ["ventilator", "CT", "MRI", "defibrillator", "dialysis", "blood_bank"],
    "nabh_accredited": true
  },
  {
    "id": "H14",
    "name": "VishwaRaj Hospital (Loni Kalbhor)",
    "mapped_to": "Surya Sahyadri Hospital",
    "lat": 18.5212, "lng": 73.8558,
    "area": "Loni Kalbhor / SE Pune",
    "level": 2,
    "total_beds": 200,
    "er_capable": true,
    "trauma_center": false,
    "specialties": ["cardiology", "neurology", "general_surgeon", "orthopedics", "ICU", "nephrology", "urology", "oncology", "gynecology", "pediatrics"],
    "equipment": ["ventilator", "CT", "MRI", "defibrillator", "dialysis", "blood_bank"],
    "nabh_accredited": false
  },
  {
    "id": "H15",
    "name": "Sassoon General Hospital (Government)",
    "mapped_to": "Manish Clinic",
    "lat": 18.5196, "lng": 73.8574,
    "area": "Camp / Central Pune",
    "level": 3,
    "total_beds": 1400,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["general_surgeon", "orthopedics", "ICU", "neurology", "pediatrics", "gynecology", "psychiatry", "burns", "trauma"],
    "equipment": ["ventilator", "CT", "defibrillator", "blood_bank", "dialysis", "burns_unit"],
    "nabh_accredited": false
  },
  {
    "id": "H16",
    "name": "KEM Hospital (Rasta Peth)",
    "mapped_to": "Paras Clinic",
    "lat": 18.5215, "lng": 73.8625,
    "area": "Rasta Peth / Central Pune",
    "level": 3,
    "total_beds": 400,
    "er_capable": true,
    "trauma_center": false,
    "specialties": ["general_surgeon", "orthopedics", "ICU", "neurology", "cardiology", "pediatrics", "gynecology", "psychiatry"],
    "equipment": ["ventilator", "CT", "MRI", "defibrillator", "blood_bank"],
    "nabh_accredited": false
  },
  {
    "id": "H17",
    "name": "Surya Sahyadri Hospital (Kasba Peth)",
    "mapped_to": "Dr. Saha Clinic",
    "lat": 18.5152, "lng": 73.8612,
    "area": "Kasba Peth / Old Pune",
    "level": 3,
    "total_beds": 65,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["general_surgeon", "orthopedics", "ICU", "burns", "trauma", "pediatrics", "gynecology"],
    "equipment": ["ventilator", "CT", "defibrillator", "blood_bank", "burns_unit"],
    "nabh_accredited": false
  },
  {
    "id": "H18",
    "name": "Pawana Hospital (Somatane / Maval)",
    "mapped_to": "Naik Hospital, Pune",
    "lat": 18.5103, "lng": 73.8593,
    "area": "Somatane Phata / Expressway junction",
    "level": 3,
    "total_beds": 203,
    "er_capable": true,
    "trauma_center": true,
    "specialties": ["general_surgeon", "orthopedics", "ICU", "trauma", "gynecology", "pediatrics"],
    "equipment": ["ventilator", "CT", "defibrillator", "blood_bank"],
    "nabh_accredited": false
  }
];

const PatientIntakeDashboard = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const availableSymptoms = [
    "Pupils Unequal", "Chest Pain", "Sweating", "Collapse",
    "Road Accident", "Bleeding", "Breathlessness", "Wheezing",
    "Confusion", "Drug Intake", "Pregnancy", "Diabetes", "ECG Abnormal"
  ];




  const [heartRate, setHeartRate] = useState("80");
  const [bpSystolic, setBpSystolic] = useState("120");
  const [bpDiastolic, setBpDiastolic] = useState("80");
  const [spo2, setSpo2] = useState("98");


  const [gcs, setGcs] = useState("15");
  const [temp, setTemp] = useState("37.0");
  const [rr, setRr] = useState("16");
  const [age, setAge] = useState("45");
  const [gender, setGender] = useState("0");
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [routingResults, setRoutingResults] = useState(null);

  // ── Trauma Scene Photo ────────────────────────────────────────────────────
  const [scenePhoto, setScenePhoto] = useState(null);              // File object
  const [scenePhotoPreview, setScenePhotoPreview] = useState(null); // object URL
  const [traumaScan, setTraumaScan] = useState(null);              // API result
  const [traumaScanLoading, setTraumaScanLoading] = useState(false);
  const traumaFileRef = React.useRef();

  const handleScenePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScenePhoto(file);
    setScenePhotoPreview(URL.createObjectURL(file));
    setTraumaScan(null);
    setTraumaScanLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("http://localhost:8000/trauma-scan", { method: "POST", body: form });
      if (res.status === 503) {
        setTraumaScan({ severity: "unavailable", confidence: 0, is_high_severity: false, scores: null, unavailable: true });
        return;
      }
      const data = await res.json();
      setTraumaScan(data.result);
      // Auto-apply high-severity symptoms if CRITICAL scene detected
      if (data.result?.is_high_severity) {
        setSelectedSymptoms(prev => {
          const critical = ["Road Accident", "Bleeding"];
          return [...new Set([...prev, ...critical])];
        });
      }
    } catch {
      setTraumaScan({ severity: "unavailable", confidence: 0, is_high_severity: false, scores: null, unavailable: true });
    } finally {
      setTraumaScanLoading(false);
    }
  };

  // ── Vitals / symptom computed state ──────────────────────────────────────
  const [ptData, setPtData] = useState({});

  useEffect(() => {

    const symptomKeyMap = {
      "Pupils Unequal": "pupils_unequal",
      "Chest Pain": "chest_pain",
      "Sweating": "sweating",
      "Collapse": "collapse",
      "Road Accident": "road_accident",
      "Bleeding": "bleeding",
      "Breathlessness": "breathlessness",
      "Wheezing": "wheezing",
      "Confusion": "confusion",
      "Drug Intake": "drug_intake",
      "Pregnancy": "pregnancy",
      "Diabetes": "known_diabetes",      // ← matches model's SYMPTOM_COLS
      "ECG Abnormal": "ecg_abnormal"
    };

    const symptomMap = {};
    availableSymptoms.forEach(sym => {
      const key = symptomKeyMap[sym];
      if (key) symptomMap[key] = selectedSymptoms.includes(sym) ? 1 : 0;
    });

    const data = {
      hr: Number(heartRate),
      bp_sys: Number(bpSystolic),
      bp_dia: Number(bpDiastolic),
      spo2: Number(spo2),
      gcs: Number(gcs),
      temp: Number(temp),
      rr: Number(rr),
      age: Number(age),
      gender: Number(gender),
      glucose: 100,                     // default normal blood glucose
      ...symptomMap
    };

    setPtData(data);
  }, [heartRate, bpSystolic, bpDiastolic, spo2, gcs, temp, rr, age, gender, selectedSymptoms]);




  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };


  async function sendTriageData(patientData) {
    try {
      // Append trauma override flag to force backend severity adjustment
      const payload = {
        ...patientData,
        trauma_scene_high_severity: traumaScan?.is_high_severity ? true : false
      };

      const response = await fetch("http://localhost:8000/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();


      if (!result || !result.hospitals) {
        console.error("Invalid response format from /triage", result);
        return;
      }

      // matched_hospitals may be empty for very stable patients — that's OK
      const matchedHospitals = result.hospitals.matched_hospitals || [];



      const freshLat = 18.5194 + (Math.random() * 0.04 - 0.02);
      const freshLng = 73.8519 + (Math.random() * 0.008 - 0.004);




      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      };



      const enrichedHospitals = matchedHospitals.map(hospital => {
        const localData = HOSPITALS_PUNE.find(h => h.id === hospital.hospital_id);
        const dist = calculateDistance(freshLat, freshLng, localData?.lat || 0, localData?.lng || 0);

        // Blend the backend AI score with proximity 
        // Real-world: a phenomenal hospital 1km away is better than a perfect hospital 20km away.
        const distancePenalty = dist * 2.5;
        const finalScore = (hospital.score * 100) - distancePenalty;

        return {
          ...hospital,
          real_lat: localData?.lat || 0,
          real_lng: localData?.lng || 0,
          mapped_to: localData?.mapped_to || hospital.name,
          dist_km: dist,
          final_blend_score: finalScore
        };
      });

      // Sort by the blended routing engine score (highest score first)
      enrichedHospitals.sort((a, b) => b.final_blend_score - a.final_blend_score);

      // ── Trauma Vision override ───────────────────────────────────────────
      let finalHospitalList = enrichedHospitals;
      let overrideApplied = false;

      if (traumaScan?.is_high_severity) {
        // Filter to Level 1 Trauma Centers only
        const l1Trauma = enrichedHospitals.filter(h => {
          const local = HOSPITALS_PUNE.find(lh => lh.id === h.hospital_id);
          return local?.level === 1 && local?.trauma_center === true;
        });
        if (l1Trauma.length > 0) {
          finalHospitalList = l1Trauma;
          overrideApplied = true;
        }
        console.warn('[TraumaVision] HIGH SEVERITY — restricted to Level 1 Trauma Centers:', l1Trauma.map(h => h.hospital_id));
      }

      const bestChoice = finalHospitalList.length > 0
        ? finalHospitalList[0]
        : { hospital_id: 'H15', equipment: [], mapped_to: 'Sassoon General Hospital', real_lng: 73.8710, real_lat: 18.5297, dist_km: 0.5, score: 0 };

      // Save for UI Rendering
      setRoutingResults({
        recommended: bestChoice,
        alternatives: finalHospitalList.slice(1, 4),
        override_applied: overrideApplied,
        original_count: enrichedHospitals.length,
        vitals_severity: result.triage_summary?.tier
      });


      try {
        const finalPatientId = patientId.trim() || (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `pt-${Date.now()}`);
        const finalPatientName = patientName.trim() || "Unknown Patient";
        const { error: dbError } = await supabase.from('triage_cases').insert([{
          patient_id: finalPatientId,
          patient_name: finalPatientName,
          age: patientData.age,
          gender: patientData.gender === 1 ? 'female' : (patientData.gender === 0 ? 'male' : 'other'),
          heart_rate: patientData.hr,
          systolic_bp: patientData.bp_sys,
          diastolic_bp: patientData.bp_dia,
          oxygen_saturation: patientData.spo2,
          respiratory_rate: patientData.rr,
          temperature: patientData.temp,
          symptoms: patientData,
          // result.triage_summary.tier = "CRITICAL" | "URGENT" | "STABLE"
          severity_level: (result.triage_summary?.tier || 'critical').toLowerCase().replace('urgent', 'moderate'),
          requires_icu: result.care_plan?.equipment_needed?.includes('ICU') || false,
          requires_ventilator: result.care_plan?.equipment_needed?.includes('ventilator') || false,
          required_specialist: result.care_plan?.specialists_needed?.[0] || null,
          assigned_hospital_id: bestChoice.hospital_id,
          triage_status: 'active',
          trauma_scene_severity: traumaScan?.unavailable ? null : (traumaScan?.severity || null),
          trauma_scene_confidence: traumaScan?.unavailable ? null : (traumaScan?.confidence || null),
        }]);
        if (dbError) {
          console.error("Supabase Data Push Error:", dbError);
        } else {
          console.log("[Supabase] triage_cases row inserted successfully");
        }
      } catch (dbEx) {
        console.error("Exception during Supabase insert:", dbEx);
        alert("Crash in React Component: " + dbEx.message);
      }
      const dispatchPayload = {
        result: result,
        hospital_name: bestChoice.mapped_to,
        severity: result.triage_summary?.tier || 'CRITICAL',
        equipments: bestChoice.equipment,
        coordinates: { lng: bestChoice.real_lng, lat: bestChoice.real_lat },
        user_location: { lng: freshLng, lat: freshLat },
        distance_km: bestChoice.dist_km.toFixed(2),
        timestamp: new Date().toISOString()
      };
      console.log('[Dispatch Payload]', dispatchPayload);
      console.log(`🚀 New Mission: ${freshLat.toFixed(4)}, ${freshLng.toFixed(4)} -> ${bestChoice.mapped_to}`);

      // Dispatch to control room — fire-and-forget, NEVER block triage
      fetch("http://localhost:8080/dispatch-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dispatchPayload)
      }).then(r => {
        if (r.ok) console.log('[Dispatch] ✅ Control room acknowledged');
        else console.warn('[Dispatch] ⚠️ Control room returned', r.status);
      }).catch(err => {
        console.warn('[Dispatch] ❌ Control room unreachable:', err.message);
      });

      return result;
    } catch (error) {
      console.error("Critical Triage Error:", error);
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body">
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-8">
          <div className="text-lg font-bold tracking-tighter text-slate-900">Clinical Architect</div>
          <nav className="hidden md:flex gap-6">
            <a href="#" className="text-slate-500 font-medium hover:text-teal-600 transition-colors">Dashboard</a>
            <a href="#" className="text-slate-500 font-medium hover:text-teal-600 transition-colors">Emergency</a>
            <a href="#" className="text-slate-500 font-medium hover:text-teal-600 transition-colors">Resources</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input type="text" placeholder="Search protocol..." className="bg-surface-container-high border-none rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-secondary/40 w-64" />
          </div>
          <button className="text-slate-500 hover:text-teal-600 transition-colors p-2"><span className="material-symbols-outlined">notifications</span></button>
          <button className="text-slate-500 hover:text-teal-600 transition-colors p-2"><span className="material-symbols-outlined">settings</span></button>
          <img alt="EMT Lead" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArHIPuvr9vsqvahTLnLl6DiI9GBf462dU0FRb9xRbv0zxbKQJOvl_f9vJfB58H_h9SvD4ioBr8_81kQN9F61tplI5eXWRf4UQBNOrnQlzo3ftqm0Jj5Sf9zEHlPApapd-rWsAHREzkweiTw-6-vlJoxhb99M5hWv6rgIj59o2lzkFn5iuzIQOfY3zYZOZYWgkx1IH60buxzEh5C0T7eebIrt6dGTQlZUTHlkBQfct7sfNlvY2ZDCqUcRGNWlziOGbGmqd2ChDnYXq1" className="w-8 h-8 rounded-full border border-outline-variant" />
        </div>
      </header>

      <aside className="h-screen w-64 fixed left-0 top-0 pt-16 flex flex-col gap-2 p-4 border-r border-slate-200 bg-slate-100">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,106,98,0.6)]"></div>
          </div>
          <div>
            <div className="text-slate-900 font-headline font-bold text-xs uppercase tracking-widest">Unit 742</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">On-Call | Station 4</div>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          <a className="flex items-center gap-3 px-4 py-3 bg-white text-teal-700 rounded-lg shadow-sm font-headline uppercase text-[11px] tracking-widest font-bold" href="#"><span className="material-symbols-outlined text-[20px]">emergency_share</span>Active Dispatch</a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200/50 hover:translate-x-1 transition-all font-headline uppercase text-[11px] tracking-widest font-bold" href="#"><span className="material-symbols-outlined text-[20px]">menu_book</span>Protocol Manuals</a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200/50 hover:translate-x-1 transition-all font-headline uppercase text-[11px] tracking-widest font-bold" href="#"><span className="material-symbols-outlined text-[20px]">history</span>Patient History</a>
        </nav>
        <button className="mt-4 mb-6 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-headline text-[11px] uppercase tracking-widest font-bold shadow-lg active:scale-95 transition-transform">New Dispatch</button>
      </aside>


      <main className="ml-64 pt-20 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(186,26,26,0.6)]"></span>
              <span className="text-label-sm uppercase tracking-[0.05em] font-bold text-slate-500 text-[10px]">Critical Response Active</span>
            </div>
            <h1 className="text-display-lg text-4xl font-extrabold text-primary tracking-tight mb-2">Patient Intake</h1>
            <p className="text-slate-500 max-w-2xl font-body">Initialize diagnostic protocol for Case #8291-B. All metrics are compiled in real-time for AI verification.</p>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8 space-y-8">

              {/* ── Scene Photo & Trauma Vision Card ── */}
              <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 shadow-sm
                ${traumaScan?.is_high_severity
                  ? 'border-red-400 bg-red-50'
                  : traumaScan?.severity === 'moderate'
                    ? 'border-orange-400 bg-orange-50'
                    : traumaScan?.severity === 'stable'
                      ? 'border-green-400 bg-green-50'
                      : 'border-dashed border-slate-300 bg-white'}`}>

                {/* badge */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-2xl text-slate-500">photo_camera</span>
                  <div>
                    <h2 className="font-headline font-bold text-lg text-primary">Scene Photo — AI Trauma Scan</h2>
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Photograph scene BEFORE entering vitals — overrides routing if Critical</p>
                  </div>
                  {traumaScan && (
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest
                      ${traumaScan.is_high_severity ? 'bg-red-600 text-white animate-pulse'
                        : traumaScan.severity === 'moderate' ? 'bg-orange-500 text-white'
                          : 'bg-green-500 text-white'}`}>
                      {traumaScan.severity}
                    </span>
                  )}
                </div>

                <div className="flex gap-6 items-start">
                  {/* Drop zone */}
                  <div
                    onClick={() => traumaFileRef.current?.click()}
                    className="flex-shrink-0 w-48 h-36 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-all overflow-hidden relative">
                    {scenePhotoPreview
                      ? <img src={scenePhotoPreview} alt="scene" className="w-full h-full object-cover" />
                      : <div className="text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                        <p className="text-[10px] mt-1 font-medium">Tap to capture</p>
                      </div>
                    }
                    {traumaScanLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <span className="material-symbols-outlined text-white text-3xl animate-spin">progress_activity</span>
                      </div>
                    )}
                  </div>
                  <input ref={traumaFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScenePhotoChange} />

                  {/* Results panel */}
                  {traumaScan
                    ? traumaScan.unavailable
                      ? <div className="flex-1 flex flex-col gap-2 justify-center">
                        <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-xl px-4 py-3">
                          <span className="material-symbols-outlined text-slate-500">warning</span>
                          <div>
                            <p className="text-sm font-bold text-slate-700">Trauma Vision Model Not Available</p>
                            <p className="text-xs text-slate-500">Install PyTorch in the ML Service venv to enable scene analysis. Routing will use vitals only.</p>
                          </div>
                        </div>
                        <button onClick={() => traumaFileRef.current?.click()} className="text-xs font-bold text-primary underline">Try again</button>
                      </div>
                      : <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          {['critical', 'moderate', 'stable'].map(k => (
                            <div key={k} className={`p-3 rounded-xl text-center border ${traumaScan.severity === k ? 'border-primary bg-primary/10' : 'border-outline-variant/15 bg-white'}`}>
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{k}</p>
                              <p className="text-xl font-headline font-bold text-primary">
                                {traumaScan.scores ? ((traumaScan.scores[k] || 0) * 100).toFixed(1) : '—'}%
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-bold text-primary">{(traumaScan.confidence * 100).toFixed(1)}%</span> confidence · Scene classified as <span className="font-bold capitalize">{traumaScan.severity}</span>
                        </div>
                        {traumaScan.is_high_severity && (
                          <div className="flex items-center gap-2 bg-red-100 border border-red-300 rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-red-600">emergency</span>
                            <p className="text-sm font-bold text-red-700">HIGH SEVERITY DETECTED — Routing restricted to Level 1 Trauma Centers only.</p>
                          </div>
                        )}
                        <button onClick={() => traumaFileRef.current?.click()} className="text-xs font-bold text-primary underline">
                          Re-scan with different photo
                        </button>
                      </div>
                    : <div className="flex-1 flex flex-col gap-2 justify-center text-slate-500">
                      <p className="text-sm font-medium">Upload an accident scene or injury photo to get an instant AI severity estimate.</p>
                      <p className="text-xs">Confidence scores will appear here. A <strong>Critical</strong> result will force Level 1 Trauma filtering before vitals are submitted.</p>
                    </div>
                  }
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-outline-variant/15 flex gap-6 items-end shadow-sm">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Patient Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="text-xl font-bold text-primary w-full bg-transparent border-b border-slate-300 focus:outline-none py-2 transition-colors hover:border-secondary focus:border-secondary" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Patient ID</label>
                  <input type="text" placeholder="UUID (Auto-generated if empty)" value={patientId} onChange={(e) => setPatientId(e.target.value)} className="text-xl font-bold text-primary w-full bg-transparent border-b border-slate-300 focus:outline-none py-2 transition-colors hover:border-secondary focus:border-secondary" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <VitalsCard label="BPM" value={heartRate} setValue={setHeartRate} icon="favorite" iconColor="text-error" />
                <BloodPressureCard sys={bpSystolic} dia={bpDiastolic} setSys={setBpSystolic} setDia={setBpDiastolic} />
                <VitalsCard label="% SpO2" value={spo2} setValue={setSpo2} icon="air" iconColor="text-blue-500" />
              </div>


              <div className="grid grid-cols-3 gap-6">
                <VitalsCard label="GCS" value={gcs} setValue={setGcs} icon="psychology" iconColor="text-purple-500" />
                <VitalsCard label="Temp °C" value={temp} setValue={setTemp} icon="thermostat" iconColor="text-orange-500" />
                <VitalsCard label="RR (Resp)" value={rr} setValue={setRr} icon="potted_plant" iconColor="text-teal-500" />
              </div>


              <div className="bg-white p-6 rounded-xl border border-outline-variant/15 flex gap-6 items-end">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Patient Age</label>
                  <input type="number" placeholder="Years" value={age} onChange={(e) => setAge(e.target.value)} className="text-3xl font-bold text-primary w-full bg-transparent border-b border-slate-300 focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="text-xl font-bold text-primary w-full bg-transparent border-b border-slate-300 focus:outline-none py-2"
                  >
                    <option value="0">Male</option>
                    <option value="1">Female</option>
                    <option value="2">Other</option>
                  </select>
                </div>
              </div>


              <div className="bg-surface-container-low p-8 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-primary tracking-tight">Quick Select Symptoms</h2>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Toggles 0/1</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {availableSymptoms.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      className={`py-4 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all text-center ${selectedSymptoms.includes(sym)
                        ? "bg-secondary-container/20 text-secondary border border-secondary/30"
                        : "bg-surface-container-lowest text-slate-600 border border-outline-variant/15 hover:bg-white"
                        }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <AICards ptData={ptData} sendTriageData={sendTriageData} routing={routingResults} />
          </div>
        </div>
      </main>
    </div>
  );
};

/* Reusable Components */
const VitalsCard = ({ label, value, setValue, icon, iconColor }) => (
  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between h-40 group hover:shadow-md transition-shadow">
    <div>
      <label className="text-label-sm uppercase tracking-widest font-bold text-slate-400 text-[10px]">{label}</label>
      <input
        type="number"
        placeholder="--"
        className="text-4xl font-extrabold text-primary mt-2 w-full bg-transparent border-b border-slate-300 focus:outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-900 uppercase">{label}</span>
      <span className={`material-symbols-outlined ${iconColor}`} style={{ fontVariationSettings: `'FILL' 1` }}>{icon}</span>
    </div>
  </div>
);

const BloodPressureCard = ({ sys, dia, setSys, setDia }) => (
  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between h-40 group hover:shadow-md transition-shadow">
    <div>
      <label className="text-label-sm uppercase tracking-widest font-bold text-slate-400 text-[10px]">SYS/DIA</label>
      <div className="flex gap-2 mt-2">
        <input type="number" placeholder="--" className="text-4xl font-extrabold text-primary w-1/2 bg-transparent border-b border-slate-300 focus:outline-none" value={sys} onChange={(e) => setSys(e.target.value)} />
        <span className="text-4xl font-extrabold text-primary">/</span>
        <input type="number" placeholder="--" className="text-4xl font-extrabold text-primary w-1/2 bg-transparent border-b border-slate-300 focus:outline-none" value={dia} onChange={(e) => setDia(e.target.value)} />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-900 uppercase">Blood Pressure</span>
      <span className="material-symbols-outlined text-secondary">monitor_heart</span>
    </div>
  </div>
);
const AICards = ({ ptData, sendTriageData, routing }) => {
  const isRouted = !!routing;
  return (
    <div className="col-span-12 lg:col-span-4 space-y-8">
      {!isRouted ? (
        <>
          <div className="bg-primary text-white p-8 rounded-xl flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/50 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,106,98,0.4)] cursor-pointer active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-3xl">mic</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Tap to Dictate</h3>
              <p className="text-sm text-on-primary-container font-medium opacity-80 mb-6">Patient narrative entry.</p>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-xl space-y-6">
            <div>
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-[0.1em] mb-4">Route Intelligence</h3>
              <div className="flex items-center gap-4 mb-4 opacity-50">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-outline-variant/15">
                  <span className="material-symbols-outlined text-slate-300">route</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-500">Awaiting Vitals...</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Run analysis for routing</div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => { sendTriageData(ptData); }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-headline text-sm font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              >
                Analyze & Route
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-4 font-medium italic">Protocol-V4 AI verification active.</p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border-2 border-primary/20 p-6 rounded-xl space-y-6 shadow-md relative overflow-hidden">
          {routing.override_applied && (
            <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1">
              Trauma Vision Override Active
            </div>
          )}

          <div className={routing.override_applied ? "mt-4" : ""}>
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-[0.1em] mb-4">Primary Destination</h3>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center border border-green-200 shrink-0">
                <span className="material-symbols-outlined text-green-600">local_hospital</span>
              </div>
              <div>
                <div className="text-base font-extrabold text-primary leading-tight">{routing.recommended.mapped_to}</div>
                <div className="text-[11px] text-slate-500 font-bold mt-1">
                  <span className="text-green-600">{routing.recommended.dist_km.toFixed(1)} km away</span>
                  {' • '}{routing.recommended.area}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">Level {routing.recommended.level || '?'}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase">{Math.round(routing.recommended.score || 0)} Match Score</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.1em] mb-3">AI Triage Rationale</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Calculated Severity:</span>
                <span className={`font-bold ${routing.vitals_severity === 'CRITICAL' ? 'text-red-600' : routing.vitals_severity === 'URGENT' ? 'text-orange-500' : 'text-green-600'}`}>{routing.vitals_severity}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Total Valid Facilities:</span>
                <span className="font-bold text-slate-800">{routing.original_count}</span>
              </div>
              {routing.override_applied && (
                <div className="flex justify-between text-xs font-medium bg-red-50 p-2 rounded">
                  <span className="text-red-700 font-bold">Override Trigger:</span>
                  <span className="font-bold text-red-700">Image &rarr; Level 1 Trauma</span>
                </div>
              )}
            </div>
          </div>

          {routing.alternatives.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.1em] mb-3">Alternative Routes</h3>
              <div className="space-y-3">
                {routing.alternatives.map((alt, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-xs font-bold text-slate-700 truncate mr-2">{alt.mapped_to}</span>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{alt.dist_km.toFixed(1)} km</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex gap-2">
            <button
              onClick={() => { sendTriageData(ptData); }}
              className="flex-1 py-3 rounded-lg bg-slate-100 text-slate-700 font-headline text-xs font-bold hover:bg-slate-200 transition-all"
            >
              Re-Analyze
            </button>
            <button
              className="flex-1 py-3 rounded-lg bg-green-600 text-white font-headline text-xs font-bold shadow hover:bg-green-700 active:scale-[0.98] transition-all"
            >
              Start Navigation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientIntakeDashboard;