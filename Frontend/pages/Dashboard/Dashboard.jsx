import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapUI3D from '../../src/components/Map3D';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    
    socket.onmessage = (event) => {
      const incomingData = JSON.parse(event.data);
      setCases((prev) => {
        if (prev.find(c => c.timestamp === incomingData.timestamp)) return prev;
        const newCases = [incomingData, ...prev];
        if (!selectedCase) setSelectedCase(incomingData);
        return newCases;
      });
    };

    return () => socket.close();
  }, [selectedCase]);

  // ETA Calculation Helper: (Distance / 20km/h) * 60 minutes = Distance * 3
  const calculateETA = (distanceStr) => {
    const distance = parseFloat(distanceStr);
    if (isNaN(distance)) return 0;
    return Math.round(distance * 3); 
  };

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-secondary-fixed overflow-hidden h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)] docked full-width top-0 sticky z-50 flex justify-between items-center w-full px-8 py-4 max-w-[1920px] mx-auto text-on-surface">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-[#031632] dark:text-white font-headline">SENTINEL AI</span>
          <div className="hidden md:flex gap-6 items-center text-on-surface">
            <span className="border-b-2 border-[#1A2B48] pb-1 font-manrope tracking-tight font-semibold text-sm cursor-pointer">Case Queue</span>
            <span onClick={() => navigate('/coming-soon')} className="text-slate-500 font-medium font-manrope tracking-tight hover:text-[#1A2B48] transition-colors duration-300 text-sm cursor-pointer">Decision Intel</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-error-container text-on-error-container rounded-full text-[0.7rem] font-bold tracking-widest uppercase">
            <span className={`w-2 h-2 rounded-full bg-error ${isConnected ? 'animate-pulse' : 'grayscale'}`}></span>
            {isConnected ? 'Emergency Mode' : 'Offline'}
          </div>
        </div>
      </nav>

      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 z-0 grayscale-[0.2]">
          <MapUI3D />
        </div>

        <div className="absolute inset-0 z-10 p-6 flex gap-6 pointer-events-none">
          
          {/* Left Panel: Case Queue */}
          <section className="w-80 glass-panel rounded-xl shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)] flex flex-col pointer-events-auto border border-white/20 h-full overflow-hidden">
            <div className="p-5 flex justify-between items-baseline border-b border-outline-variant/10 shrink-0 bg-white/40">
              <h2 className="font-headline font-bold text-primary tracking-tight">Case Queue</h2>
              <span className="text-[0.65rem] font-bold text-secondary uppercase tracking-[0.1em] animate-pulse">
                {cases.length} Live
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cases.length === 0 && (
                <div className="text-center py-10 text-outline text-xs italic">Waiting for dispatch data...</div>
              )}
              
              {cases.map((item) => (
                <div 
                  key={item.timestamp}
                  onClick={() => setSelectedCase(item)}
                  className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer group ${
                    selectedCase?.timestamp === item.timestamp 
                    ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]' 
                    : 'bg-surface-container-lowest border-transparent hover:border-secondary-fixed/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${
                      item.severity === 'CRITICAL' ? 'bg-error-container text-error' : 'bg-secondary-fixed text-primary'
                    }`}>
                      {item.severity}
                    </span>
                    <span className={`text-[0.6rem] font-medium ${selectedCase?.timestamp === item.timestamp ? 'text-white/70' : 'text-outline'}`}>
                      #{item.result.hospitals.patient_id.split('_').pop()}
                    </span>
                  </div>
                  <h3 className={`font-headline text-sm font-bold mb-1 ${selectedCase?.timestamp === item.timestamp ? 'text-white' : 'text-primary'}`}>
                    {item.hospital_name}
                  </h3>
                  <p className={`text-xs mb-3 ${selectedCase?.timestamp === item.timestamp ? 'text-white/80' : 'text-on-surface-variant'}`}>
                    Distance: {item.distance_km} km
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[1rem]">monitor_heart</span>
                      <span className="text-[0.65rem] font-bold">{item.result.triage_summary.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex-1"></div>

          {/* Right Panel: Decision Intelligence */}
          <section className="w-96 glass-panel rounded-xl shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)] flex flex-col pointer-events-auto border border-white/20 h-full overflow-hidden">
            {selectedCase ? (
              <>
                <div className="p-5 border-b border-outline-variant/10 bg-white/40">
                  <h2 className="font-headline font-bold text-primary tracking-tight">Decision Intel</h2>
                  <p className="text-[0.65rem] text-outline uppercase tracking-wider font-bold">Patient: {selectedCase.result.hospitals.patient_id}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* Triage Score */}
                  <div className="bg-error/5 p-4 rounded-xl border border-error/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[0.6rem] font-black text-error uppercase tracking-widest">Triage Priority</span>
                      <span className="text-[0.65rem] font-bold text-error bg-error-container px-2 py-0.5 rounded-full">{selectedCase.result.triage_summary.tier}</span>
                    </div>
                    <div className="text-3xl font-headline font-black text-error">{selectedCase.result.triage_summary.score}</div>
                  </div>

                  {/* Resource Needs */}
                  <div className="space-y-3">
                    <h4 className="text-[0.65rem] font-bold text-outline uppercase">Required Equipment</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCase.equipments.map(eq => (
                        <span key={eq} className="px-3 py-1.5 bg-primary/5 text-primary text-[0.65rem] font-bold rounded-lg border border-primary/10 uppercase">
                          {eq.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Hospital Card (Updated ETA & Removed Button) */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-primary to-[#031632] text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-[0.6rem] font-bold text-secondary-fixed uppercase tracking-[0.2em]">Primary Destination</span>
                      <h3 className="text-xl font-headline font-extrabold mb-4">{selectedCase.hospital_name}</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                          <p className="text-[0.6rem] text-white/50 uppercase font-bold tracking-wider mb-1">Distance</p>
                          <p className="text-lg font-headline font-bold">{selectedCase.distance_km} KM</p>
                        </div>
                        <div className="bg-secondary-fixed/10 p-3 rounded-lg border border-secondary-fixed/20">
                          <p className="text-[0.6rem] text-secondary-fixed/70 uppercase font-bold tracking-wider mb-1">ETA</p>
                          <p className="text-lg font-headline font-bold text-secondary-fixed">
                            {calculateETA(selectedCase.distance_km)} MIN
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Subtle Background Icon */}
                    <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-white/5 rotate-12">local_hospital</span>
                  </div>

                  {/* AI Explainability */}
                  <div className="bg-secondary-container/20 p-5 rounded-xl border border-secondary-fixed/30">
                    <h4 className="text-[0.65rem] font-bold text-on-secondary-container uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">psychology</span> Deployment Logic
                    </h4>
                    <ul className="space-y-3">
                      {selectedCase.result.care_plan.hospital_tags_needed.map((tag, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1"></span>
                          <p className="text-xs text-on-secondary-container font-medium">
                            Facility matched for <span className="font-bold">#{tag}</span> capability.
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                <span className="material-symbols-outlined text-5xl text-outline/20">clinical_notes</span>
                <p className="text-sm text-outline font-medium">Select a live case to view AI decision metrics</p>
              </div>
            )}
          </section>
        </div>

        {/* Floating SideNav */}
        <aside className="fixed left-0 top-1/2 -translate-y-1/2 ml-4 z-40 bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-2 border border-white/30 flex flex-col gap-4 pointer-events-auto">
          <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg"><span className="material-symbols-outlined">clinical_notes</span></button>
          <button className="w-12 h-12 flex items-center justify-center rounded-xl text-primary/60 hover:bg-slate-200/50"><span className="material-symbols-outlined">emergency</span></button>
          <button className="w-12 h-12 flex items-center justify-center rounded-xl text-primary/60 hover:bg-slate-200/50"><span className="material-symbols-outlined">history</span></button>
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;