import React from 'react';
import { useNavigate } from 'react-router-dom';
import MapUI3D from '../../src/components/Map3D';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-secondary-fixed overflow-hidden h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)] docked full-width top-0 sticky z-50 flex justify-between items-center w-full px-8 py-4 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-[#031632] dark:text-white font-headline">SENTINEL AI</span>
          <div className="hidden md:flex gap-6 items-center">
            <span onClick={() => navigate('/coming-soon')} className="text-[#031632] dark:text-white border-b-2 border-[#1A2B48] pb-1 font-manrope tracking-tight font-semibold text-sm cursor-pointer">Case Queue</span>
            <span onClick={() => navigate('/coming-soon')} className="text-slate-500 dark:text-slate-400 font-medium font-manrope tracking-tight hover:text-[#1A2B48] transition-colors duration-300 text-sm cursor-pointer">Decision Intel</span>
            <span onClick={() => navigate('/coming-soon')} className="text-slate-500 dark:text-slate-400 font-medium font-manrope tracking-tight hover:text-[#1A2B48] transition-colors duration-300 text-sm cursor-pointer">Patient Summary</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Emergency Mode Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-error-container text-on-error-container rounded-full text-[0.7rem] font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            Emergency Mode
          </div>
          {/* Toggle Container */}
          <div onClick={() => navigate('/mass-casualty')} className="cursor-pointer flex items-center gap-3 bg-surface-container-high px-3 py-2 rounded-full transition-transform hover:scale-105">
            <span className="text-[0.65rem] font-bold font-headline uppercase tracking-wider text-on-surface-variant">Mass Casualty</span>
            <button className="w-10 h-5 bg-outline-variant/30 rounded-full relative transition-all duration-300">
              <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></span>
            </button>
          </div>
          <div className="h-6 w-[1px] bg-outline-variant/20 mx-2"></div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/coming-soon')} className="text-primary hover:scale-95 duration-300 ease-in-out">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
            </button>
            <button onClick={() => navigate('/coming-soon')} className="text-primary hover:scale-95 duration-300 ease-in-out">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
            </button>
            <div onClick={() => navigate('/coming-soon')} className="w-8 h-8 rounded-full overflow-hidden bg-primary-container cursor-pointer hover:opacity-80 transition-opacity">
              <img alt="Chief Medical Officer Role" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUV02pEnQP-7N9gYUrB088No_98TJ545bktDrcblQT9poIFUenYp69m9VZ8DcOPraw2TD_SMRyBn_yk1t5JUJHpWmuKaFztVjo9muZmURNBYPdDOAeyWL-2gv_tfkzlQuXiogZLNYYYBIl8DGi9yUqlJxu-PU8DJaKwoYbHL1pjGbjyEZtxErHRijNKte1d2zr5DSKpPFVwcgO6Zp-Ds65QLIhvXIRIMZf24u66PedNreq0wvcczvD71UJgrUFrGCrVGVVZDYc5W_X" />
            </div>
          </div>
        </div>
      </nav>

      <main className="relative flex-1 overflow-hidden">
        {/* Background Map Layer */}
        {/* Background Map Layer */}
        <div className="absolute inset-0 z-0 grayscale-[0.2]">
          <MapUI3D />
        </div>

        {/* Layout Overlay Panels */}
        <div className="absolute inset-0 z-10 p-6 flex gap-6 pointer-events-none">

          {/* Left Panel: Case Queue */}
          <section className="w-80 glass-panel rounded-xl shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)] flex flex-col pointer-events-auto border border-white/20 h-full overflow-hidden">
            <div className="p-5 flex justify-between items-baseline border-b border-outline-variant/10 shrink-0">
              <h2 className="font-headline font-bold text-primary tracking-tight">Case Queue</h2>
              <span className="text-[0.65rem] font-bold text-secondary uppercase tracking-[0.1em]">3 Active</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Case Item 1 */}
              <div onClick={() => navigate('/coming-soon')} className="p-4 bg-surface-container-lowest rounded-lg border border-transparent hover:border-secondary-fixed/50 transition-all duration-300 cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[0.65rem] font-bold text-error bg-error-container px-2 py-0.5 rounded-full">CRITICAL</span>
                  <span className="text-[0.6rem] font-medium text-outline">#CASE-4402</span>
                </div>
                <h3 className="font-headline text-sm font-bold text-primary mb-1">MVA - Multi Vehicle</h3>
                <p className="text-xs text-on-surface-variant mb-3">2 Patients • Unstable</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[1rem] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
                    <span className="text-[0.65rem] font-bold">142</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[1rem] text-primary">compress</span>
                    <span className="text-[0.65rem] font-bold">90/60</span>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[0.65rem] font-bold text-secondary">PENDING</span>
                  </div>
                </div>
              </div>

              {/* Case Item 2 */}
              <div onClick={() => navigate('/coming-soon')} className="p-4 bg-surface-container-low/50 rounded-lg opacity-80 hover:opacity-100 transition-all cursor-pointer border border-transparent">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[0.65rem] font-bold text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded-full">MODERATE</span>
                  <span className="text-[0.6rem] font-medium text-outline">#CASE-4398</span>
                </div>
                <h3 className="font-headline text-sm font-bold text-primary mb-1">Cardiac Distress</h3>
                <p className="text-xs text-on-surface-variant mb-3">1 Patient • Stabilized</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[1rem] text-on-tertiary-container">monitor_heart</span>
                    <span className="text-[0.65rem] font-bold">88</span>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[0.65rem] font-bold text-on-primary-fixed-variant">ASSIGNED</span>
                  </div>
                </div>
              </div>

              {/* Case Item 3 */}
              <div onClick={() => navigate('/coming-soon')} className="p-4 bg-surface-container-low/50 rounded-lg opacity-80 hover:opacity-100 transition-all cursor-pointer border border-transparent">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[0.65rem] font-bold text-on-secondary-container bg-secondary-fixed px-2 py-0.5 rounded-full">STABLE</span>
                  <span className="text-[0.6rem] font-medium text-outline">#CASE-4395</span>
                </div>
                <h3 className="font-headline text-sm font-bold text-primary mb-1">Respiratory Obstruction</h3>
                <p className="text-xs text-on-surface-variant mb-3">1 Patient • Recovering</p>
                <div className="flex items-center gap-3">
                  <div className="ml-auto">
                    <span className="text-[0.65rem] font-bold text-on-primary-fixed-variant">ASSIGNED</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-outline-variant/10 shrink-0">
              <button onClick={() => navigate('/coming-soon')} className="w-full py-3 bg-primary text-on-primary rounded-xl font-headline font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95">
                <span className="material-symbols-outlined text-sm">clinical_notes</span>
                VIEW ALL ARCHIVE
              </button>
            </div>
          </section>

          <div className="flex-1"></div>

          {/* Right Panel: Decision Intelligence */}
          <section className="w-96 glass-panel rounded-xl shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)] flex flex-col pointer-events-auto border border-white/20 h-full overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b border-outline-variant/10 shrink-0">
              <div>
                <h2 className="font-headline font-bold text-primary tracking-tight">Decision Intel</h2>
                <p className="text-[0.65rem] text-outline">Optimizing Route for #CASE-4402</p>
              </div>
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Case Summary Compact */}
              <div className="space-y-2">
                <div className="flex justify-between text-[0.65rem] font-bold text-outline uppercase tracking-[0.05em]">
                  <span>Resource Needs</span>
                  <span className="text-secondary">AI Predicted</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-primary/5 p-3 rounded-lg flex flex-col gap-1">
                    <span className="text-[0.6rem] text-primary/60 font-bold uppercase">ICU Bed</span>
                    <span className="text-lg font-headline font-bold text-primary">Required</span>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg flex flex-col gap-1">
                    <span className="text-[0.6rem] text-primary/60 font-bold uppercase">Ventilator</span>
                    <span className="text-lg font-headline font-bold text-primary">Priority</span>
                  </div>
                </div>
              </div>
              {/* Recommended Hospital */}
              <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[0.65rem] font-bold text-secondary-fixed tracking-wider uppercase">Recommended Facility</span>
                    <h3 className="text-lg font-headline font-extrabold tracking-tight">St. Jude Medical Center</h3>
                  </div>
                  <div className="bg-secondary-fixed text-primary px-2 py-1 rounded text-[0.7rem] font-black">98% FIT</div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      2.4 miles away
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      ETA: 6 minutes
                    </div>
                  </div>
                  <button onClick={() => navigate('/coming-soon')} className="px-4 py-2 bg-secondary-fixed text-primary rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-md">ROUTE UNIT</button>
                </div>
              </div>
              {/* AI Explainability */}
              <div className="bg-secondary-container/20 p-5 rounded-xl border border-secondary-fixed/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-secondary text-lg">medical_services</span>
                  <h4 className="text-xs font-bold text-on-secondary-container uppercase tracking-widest">Why this hospital?</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1 min-w-[6px]"></span>
                    <p className="text-xs text-on-secondary-container leading-relaxed font-medium">Real-time telemetry confirms <span className="font-bold">2 ICU ventilators available</span> immediately.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1 min-w-[6px]"></span>
                    <p className="text-xs text-on-secondary-container leading-relaxed font-medium">Closest facility with an <span className="font-bold">on-call neurosurgeon</span> specialized in trauma.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1 min-w-[6px]"></span>
                    <p className="text-xs text-on-secondary-container leading-relaxed font-medium">Traffic avoidance routing saves <span className="font-bold">140 seconds</span> over secondary options.</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Floating SideNav */}
        <aside className="fixed left-0 top-1/2 -translate-y-1/2 ml-4 z-40 bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-2 border border-white/30 flex flex-col gap-4 pointer-events-auto">
          <button onClick={() => navigate('/select')} className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary text-white transition-all hover:scale-110 shadow-lg">
            <span className="material-symbols-outlined">clinical_notes</span>
          </button>
          <button onClick={() => navigate('/mass-casualty')} className="w-12 h-12 flex items-center justify-center rounded-xl text-primary/60 hover:bg-slate-200/50 transition-all">
            <span className="material-symbols-outlined">emergency</span>
          </button>
          <button onClick={() => navigate('/coming-soon')} className="w-12 h-12 flex items-center justify-center rounded-xl text-primary/60 hover:bg-slate-200/50 transition-all">
            <span className="material-symbols-outlined">monitor_heart</span>
          </button>
          <button onClick={() => navigate('/coming-soon')} className="w-12 h-12 flex items-center justify-center rounded-xl text-primary/60 hover:bg-slate-200/50 transition-all">
            <span className="material-symbols-outlined">medical_services</span>
          </button>
          <button onClick={() => navigate('/coming-soon')} className="w-12 h-12 flex items-center justify-center rounded-xl text-primary/60 hover:bg-slate-200/50 transition-all">
            <span className="material-symbols-outlined">history</span>
          </button>
        </aside>

        {/* System Status Bar */}
        {/* <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-none">
          <div className="px-6 py-3 glass-panel rounded-full border border-white/20 shadow-xl pointer-events-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed shadow-[0_0_8px_#62fae3]"></span>
              <span className="text-[0.7rem] font-bold tracking-widest text-primary uppercase">System Healthy</span>
            </div>
            <div className="w-[1px] h-4 bg-outline-variant/30"></div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/coming-soon')}>
              <span className="text-[0.7rem] font-bold tracking-widest text-primary/60 uppercase hover:text-primary transition-colors">Cloud Sync</span>
              <span className="text-[0.7rem] font-bold text-primary">0.4ms Latency</span>
            </div>
          </div>
        </div> */}
      </main>
    </div>
  );
};

export default Dashboard;
