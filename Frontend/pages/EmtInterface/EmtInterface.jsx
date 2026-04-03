import React, { useState, useEffect } from "react";

const PatientIntakeDashboard = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const availableSymptoms = [
    "Pupils Unequal", "Chest Pain", "Sweating", "Collapse",
    "Road Accident", "Bleeding", "Breathlessness", "Wheezing",
    "Confusion", "Drug Intake", "Pregnancy", "Diabetes", "ECG Abnormal"
  ];

  // Vitals State
  const [heartRate, setHeartRate] = useState("");
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [spo2, setSpo2] = useState("");
  
  // Additional Data Points
  const [gcs, setGcs] = useState("");
  const [temp, setTemp] = useState("");
  const [rr, setRr] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("0"); // 0 for Male, 1 for Female (standardized)

  // Compiled Data Object
  const [ptData, setPtData] = useState({});

  useEffect(() => {
    // Map human-readable symptoms to snake_case keys
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
      "Diabetes": "diabetes",
      "ECG Abnormal": "ecg_abnormal"
    };

  

    const symptomMap = {};
    availableSymptoms.forEach(sym => {
      const key = symptomKeyMap[sym]; // Use exact snake_case key
      symptomMap[key] = selectedSymptoms.includes(sym) ? 1 : 0;
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
        const response = await fetch("http://localhost:8000/triage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(patientData)
        });

        const result = await response.json();
        console.log("Server response:", result);

        return result;
    } catch (error) {
        console.error("Error sending data:", error);
    }
}    

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body">
      {/* Top NavBar */}
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
          <img alt="EMT Lead" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArHIPuvr9vsqvahTLnLl6DiI9GBf462dU0FRb9xRbv0zxbKQJOvl_f9vJfB58H_h9SvD4ioBr8_81kQN9F61tplI5eXWRf4UdR3kq07nrf25g3kZ-Qrse2vRiH3O6tz_PxF9KVFXAszlGry-6-vlJoxhb99M5hWv6rgIj59o2lzkFn5iuzIQOfY3zYZOZYWgkx1IH60buxzEh5C0T7eebIrt6dGTQlZUTHlkBQfct7sfNlvY2ZDCqUcRGNWlziOGbGmqd2ChDnYXq1" className="w-8 h-8 rounded-full border border-outline-variant" />
        </div>
      </header>

      {/* Side NavBar */}
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

      {/* Main Content */}
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
              {/* Primary Vitals Row */}
              <div className="grid grid-cols-3 gap-6">
                <VitalsCard label="BPM" value={heartRate} setValue={setHeartRate} icon="favorite" iconColor="text-error" />
                <BloodPressureCard sys={bpSystolic} dia={bpDiastolic} setSys={setBpSystolic} setDia={setBpDiastolic} />
                <VitalsCard label="% SpO2" value={spo2} setValue={setSpo2} icon="air" iconColor="text-blue-500" />
              </div>

              {/* Secondary Metrics Row (The Missing Stuff) */}
              <div className="grid grid-cols-3 gap-6">
                <VitalsCard label="GCS" value={gcs} setValue={setGcs} icon="psychology" iconColor="text-purple-500" />
                <VitalsCard label="Temp °C" value={temp} setValue={setTemp} icon="thermostat" iconColor="text-orange-500" />
                <VitalsCard label="RR (Resp)" value={rr} setValue={setRr} icon="potted_plant" iconColor="text-teal-500" />
              </div>

              {/* Patient Profile Info */}
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

              {/* Symptoms */}
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
                      className={`py-4 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all text-center ${
                        selectedSymptoms.includes(sym)
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

            <AICards ptData={ptData} sendTriageData={sendTriageData}/>
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

const AICards = ({ ptData,sendTriageData }) => (
  <div className="col-span-12 lg:col-span-4 space-y-8">
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
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-outline-variant/15">
            <span className="material-symbols-outlined text-secondary">route</span>
          </div>
          <div>
            <div className="text-sm font-bold text-primary">St. Jude Trauma Center</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estimated Time: 8 Mins</div>
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-200">
        <button 
          onClick={() => {sendTriageData(ptData);}}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-headline text-sm font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
        >
          Analyze & Route
        </button>
        <p className="text-[10px] text-center text-slate-400 mt-4 font-medium italic">Protocol-V4 AI verification active.</p>
      </div>
    </div>
  </div>
);

export default PatientIntakeDashboard;