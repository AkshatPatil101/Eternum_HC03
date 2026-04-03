import React from 'react';
import { useNavigate } from 'react-router-dom';

const MassCasualtyMode = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-surface text-on-surface selection:bg-secondary-container">
            {/* SideNavBar Shell */}
            <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-[#f7f9fb] dark:bg-[#031632] flex flex-col p-6 space-y-8 tonal-shift-surface-container-low transition-all duration-300">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined text-secondary-fixed">shield</span>
                    </div>
                    <div>
                        <h2 className="font-headline font-bold text-sm tracking-tight text-primary">Sentinel Prime</h2>
                        <p className="font-label uppercase tracking-[0.05em] text-[10px] text-error font-bold">Active Duty</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-4 px-4 py-3 bg-[#1A2B48] text-white rounded-xl shadow-lg font-label uppercase tracking-[0.05em] text-[0.75rem] transition-all duration-300">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>clinical_notes</span>
                        <span>Command</span>
                    </button>
                    <button onClick={() => navigate('/coming-soon')} className="w-full flex items-center gap-4 px-4 py-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl font-label uppercase tracking-[0.05em] text-[0.75rem] transition-all duration-300">
                        <span className="material-symbols-outlined">emergency</span>
                        <span>Dispatch</span>
                    </button>
                    <button onClick={() => navigate('/coming-soon')} className="w-full flex items-center gap-4 px-4 py-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl font-label uppercase tracking-[0.05em] text-[0.75rem] transition-all duration-300">
                        <span className="material-symbols-outlined">monitor_heart</span>
                        <span>Vitals</span>
                    </button>
                    <button onClick={() => navigate('/coming-soon')} className="w-full flex items-center gap-4 px-4 py-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl font-label uppercase tracking-[0.05em] text-[0.75rem] transition-all duration-300">
                        <span className="material-symbols-outlined">medical_services</span>
                        <span>Triage</span>
                    </button>
                    <button onClick={() => navigate('/coming-soon')} className="w-full flex items-center gap-4 px-4 py-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl font-label uppercase tracking-[0.05em] text-[0.75rem] transition-all duration-300">
                        <span className="material-symbols-outlined">history</span>
                        <span>Archive</span>
                    </button>
                </nav>
                <div className="pt-6 border-t border-outline-variant/10 space-y-2">
                    <button onClick={() => navigate('/coming-soon')} className="w-full py-4 bg-primary text-white font-headline font-bold text-xs rounded-xl shadow-md hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                        <span>Analyze &amp; Route</span>
                        <span className="material-symbols-outlined text-[16px]">bolt</span>
                    </button>
                    <button onClick={() => navigate('/coming-soon')} className="w-full flex items-center gap-4 px-4 py-3 text-[#1A2B48]/60 dark:text-slate-400 font-label uppercase tracking-[0.05em] text-[0.75rem]">
                        <span className="material-symbols-outlined">help</span>
                        <span>Support</span>
                    </button>
                    <button onClick={() => navigate('/select')} className="w-full flex items-center gap-4 px-4 py-3 text-[#1A2B48]/60 dark:text-slate-400 font-label uppercase tracking-[0.05em] text-[0.75rem]">
                        <span className="material-symbols-outlined">logout</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-64 min-h-screen flex flex-col">
                {/* TopNavBar Shell */}
                <header className="sticky top-0 z-50 bg-slate-50/70 backdrop-blur-xl shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)] px-8 py-4 flex justify-between items-center w-full">
                    <div className="flex items-center gap-8">
                        <h1 className="text-xl font-bold tracking-tighter text-[#031632] cursor-pointer" onClick={() => navigate('/select')}>SENTINEL AI</h1>
                        <div className="hidden lg:flex items-center gap-6">
                            <span onClick={() => navigate('/coming-soon')} className="text-slate-500 font-medium font-manrope tracking-tight hover:text-[#1A2B48] transition-colors duration-300 cursor-pointer">Case Queue</span>
                            <span onClick={() => navigate('/coming-soon')} className="text-slate-500 font-medium font-manrope tracking-tight hover:text-[#1A2B48] transition-colors duration-300 cursor-pointer">Decision Intel</span>
                            <span onClick={() => navigate('/coming-soon')} className="text-[#031632] border-b-2 border-[#1A2B48] pb-1 font-semibold font-manrope tracking-tight cursor-pointer">Patient Summary</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-error/10 text-error rounded-full border border-error/20">
                            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                            <span className="text-[10px] font-bold tracking-widest uppercase">CRITICAL LOAD</span>
                        </div>
                        {/* Toggle Actions */}
                        <button onClick={() => navigate('/coming-soon')} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold font-headline transition-transform active:scale-95">Emergency Mode</button>
                        <div onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-3 py-1.5 bg-primary-container text-secondary-fixed rounded-lg border border-secondary-fixed/30 cursor-pointer hover:bg-primary transition-colors">
                            <span className="text-xs font-bold font-headline uppercase tracking-tighter">Mass Casualty</span>
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>toggle_on</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                            <span onClick={() => navigate('/coming-soon')} className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-primary transition-colors">notifications</span>
                            <span onClick={() => navigate('/coming-soon')} className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-primary transition-colors">settings</span>
                            <div onClick={() => navigate('/coming-soon')} className="w-8 h-8 rounded-full overflow-hidden ml-2 bg-slate-200 cursor-pointer hover:opacity-80 transition-opacity">
                                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4fw-HRbmZm9q3JXT7ysvugd8HfnnsflT6zZKcpfDXAOMFVgMT0EexOijZPCO-BcLzuqPZ-ZbkB8rG9H9paNuGW3bgmYPfgZZyb1J0FjmMwjLjPP296SxaCq5TadnqRNvW-j4krLdUHJ_HxA5RG9to8zmVvuRritQ0SuGnYHPiujCQuQZf1i81QbfwlZb1PPmQVWbRy4vPGZu3jTE0LS93vjJ4qPrFXFq2ERmhNrjB0pvj2Ed1E66mLWVvm89I3hfzb5qUUaVRr3Rh" alt="medical director" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Control Room Dashboard Content */}
                <div className="p-8 space-y-8 flex-1">
                    {/* Bento Grid Top Row */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Main Map Visualizer (Bento Large) */}
                        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden relative group border border-outline-variant/10 h-[600px]">
                            <div className="absolute inset-0 bg-slate-200 grayscale opacity-50">
                                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAz5oVjBQ1ANI0BPvkR57AV_ThUXSeaGhwgSpTZkzFpMwbcDotvV-q9AoVVYe9fN65QVBv14Te6QfZtDcJHrrHSgvFpsYxqb6g97uaQTd2kE31rPUeDZTeDsjVq_52Y3jg76jvimRiRDJZb4qhJNlqXc5vlMXNra2ulahke6fE1p1AvLUFpJqM_74QTIbntFuRdbEi1H08-Rfy7ly1f4o70cKw-B4LfIQm5Kg9-O5idFJpJud7rHBgwB_y05FJezZCLF7SA_zdnLPun" alt="map" />
                            </div>
                            {/* SVG Overlay for Distribution Paths */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <path className="opacity-80" d="M 200,300 Q 400,350 600,200" fill="transparent" stroke="#62fae3" strokeDasharray="5,5" strokeWidth="2"></path>
                                <path className="opacity-80" d="M 200,300 Q 300,500 500,550" fill="transparent" stroke="#62fae3" strokeDasharray="5,5" strokeWidth="2"></path>
                                <path className="opacity-100" d="M 700,450 Q 550,400 400,500" fill="transparent" stroke="#ba1a1a" strokeDasharray="8,4" strokeWidth="3"></path>
                            </svg>
                            {/* Interactive Markers */}
                            <div onClick={() => navigate('/coming-soon')} className="absolute top-1/3 left-1/4 group/marker cursor-pointer">
                                <div className="relative">
                                    <span className="absolute inset-0 animate-ping rounded-full bg-error opacity-40"></span>
                                    <div className="relative w-4 h-4 bg-error rounded-full border-2 border-white"></div>
                                    <div className="absolute top-6 -left-12 w-32 bg-primary p-2 rounded-lg text-white text-[10px] opacity-0 group-hover/marker:opacity-100 transition-opacity z-10">
                                        <p className="font-bold">MCI SITE ALPHA</p>
                                        <p className="text-secondary-fixed">8 PATIENTS</p>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/coming-soon')} className="absolute bottom-1/4 right-1/3 group/marker cursor-pointer">
                                <div className="relative">
                                    <div className="relative w-3 h-3 bg-secondary rounded-full border-2 border-white"></div>
                                    <div className="absolute -top-12 -left-12 w-32 bg-primary p-2 rounded-lg text-white text-[10px] opacity-0 group-hover/marker:opacity-100 transition-opacity z-10">
                                        <p className="font-bold">TRIAGE VAN 4</p>
                                        <p className="text-secondary-fixed">EN ROUTE</p>
                                    </div>
                                </div>
                            </div>
                            {/* Map Controls */}
                            <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
                                <div className="glass-panel p-4 rounded-xl border border-white/40 shadow-xl max-w-xs pointer-events-auto">
                                    <h3 className="font-headline font-extrabold text-primary text-lg leading-tight mb-2">Mass Casualty Distribution</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Victims</span>
                                            <span className="text-2xl font-black text-primary">24</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-error w-3/4"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-6 right-6">
                                <div className="flex flex-col gap-2 bg-primary p-2 rounded-xl border border-white/10 shadow-2xl pointer-events-auto">
                                    <button onClick={() => navigate('/coming-soon')} className="p-2 text-white/60 hover:text-white transition-colors"><span className="material-symbols-outlined">add</span></button>
                                    <button onClick={() => navigate('/coming-soon')} className="p-2 text-white/60 hover:text-white transition-colors"><span className="material-symbols-outlined">remove</span></button>
                                    <button onClick={() => navigate('/coming-soon')} className="p-2 text-secondary-fixed"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span></button>
                                </div>
                            </div>
                        </div>

                        {/* Hospital Capacity Dashboard */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-primary-container text-white p-6 rounded-xl shadow-lg flex-1 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <span className="material-symbols-outlined text-[120px]">local_hospital</span>
                                </div>
                                <h3 className="font-headline text-on-primary-container text-xs font-bold uppercase tracking-widest mb-6">Regional Capacity</h3>
                                <div className="space-y-6 relative z-10">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-headline font-semibold text-sm">North Memorial Trauma</span>
                                            <span className="text-error font-black">98%</span>
                                        </div>
                                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-error w-[98%]"></div>
                                        </div>
                                        <p className="text-[10px] text-on-primary-container">Critical Load - Diverting non-MCI</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-headline font-semibold text-sm">St. Jude General</span>
                                            <span className="text-secondary-fixed font-black">42%</span>
                                        </div>
                                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-secondary-fixed w-[42%]"></div>
                                        </div>
                                        <p className="text-[10px] text-on-primary-container">Accepting Level 2-3</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-headline font-semibold text-sm">City Central ER</span>
                                            <span className="text-orange-400 font-black">76%</span>
                                        </div>
                                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-400 w-[76%]"></div>
                                        </div>
                                        <p className="text-[10px] text-on-primary-container">ICU Limited</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/coming-soon')} className="mt-8 w-full py-3 bg-secondary-fixed text-primary font-bold font-headline rounded-lg text-sm transition-transform active:scale-95 shadow-[0_10px_20px_-10px_rgba(98,250,227,0.4)] relative z-10">
                                    Open Full Logistics Hub
                                </button>
                            </div>

                            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => navigate('/coming-soon')}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-secondary/10 rounded-lg">
                                        <span className="material-symbols-outlined text-secondary">psychology</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Logistics Recommendation</p>
                                        <p className="font-headline text-primary font-bold text-sm">Optimizing Route Distribution</p>
                                    </div>
                                </div>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    "Sentinel AI predicts St. Jude surplus. Reroute upcoming victims 04-09 to secondary hubs to maintain North Memorial readiness."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Active Patients Feed */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Active Critical Cases</h2>
                                <p className="text-on-surface-variant text-sm">Real-time telemetry and triage routing.</p>
                            </div>
                            <button onClick={() => navigate('/coming-soon')} className="flex items-center gap-2 text-xs font-bold text-primary hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors">
                                View All (18) <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                            {/* Patient Card 1 */}
                            <div onClick={() => navigate('/coming-soon')} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-xl transition-all duration-300 group cursor-pointer">
                                <div className="flex justify-between mb-4">
                                    <span className="px-2 py-1 bg-error-container text-on-error-container text-[10px] font-black rounded-md tracking-tighter">RED - IMMEDIATE</span>
                                    <span className="text-[10px] font-medium text-slate-400">ID: #4092-A</span>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwqJdql8Tk_V0qHLD8JZmxW3GFvrXlSmM4MFVsPOBvnxQ9SGebj6p6_yDOfFQ1F9_smD7qsxaQytJFD5beWUfAzNYgVj0XurlpGIffXaDyuFZYWRXQebsHmZkI_BUmAb7ow6a7v8esHQ9xpNvvCKHEf_WPugbI8GiQrYP0Z3Tnrxjga80k42Ldd24rqyyt_2EEAgcSsRrM4tENc7ccVIrhIsd_DLm_Bo0tnIsVyAk6OB8pecouXzdd30dTTNhQ006mGXFmT2L-7LZV" alt="injuried person" />
                                    </div>
                                    <div>
                                        <h4 className="font-headline font-bold text-primary">Unidentified Female</h4>
                                        <p className="text-[10px] font-label text-slate-500 uppercase">Est. Age: 25-30 | Severe Trauma</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-surface rounded-lg">
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Heart Rate</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-primary">142</span>
                                            <span className="text-[10px] text-error font-bold">bpm</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-surface rounded-lg">
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">SPO2</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-primary">88</span>
                                            <span className="text-[10px] text-error font-bold">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>ambulance</span>
                                        <span className="text-[10px] font-bold text-primary">ETA: 4 MINS</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">DEST: NORTH MEMORIAL</span>
                                </div>
                            </div>

                            {/* Patient Card 2 */}
                            <div onClick={() => navigate('/coming-soon')} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-xl transition-all duration-300 cursor-pointer">
                                <div className="flex justify-between mb-4">
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-black rounded-md tracking-tighter">YELLOW - DELAYED</span>
                                    <span className="text-[10px] font-medium text-slate-400">ID: #4093-B</span>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRUmpVf3j88d4k3Hk1gRpKB76dqkbW23S1_2khc-l86H2o1xijtvWGv4sDChUulgbeqGJixA3Mj45xXjIQJBfp-lWOHYlnJkbmkV0JTbtBRoOWQP22-U730nlk6kKklM0im2e-wC6wnBQYxeG9Z94kIA2bfkr8elVoSEERhFBbJqyMwc3hif25xpa6qHCIra1ocQ-HIO0q_17t5WQAMlUBizxnriO8xeiMsQs4LqIoeo_sxEgjtedMIJ3Lak7G5R7VsTvMHnaUPy1l" alt="patient 2" />
                                    </div>
                                    <div>
                                        <h4 className="font-headline font-bold text-primary">Marcus H. (Identified)</h4>
                                        <p className="text-[10px] font-label text-slate-500 uppercase">Age: 44 | Fractures / Blood Loss</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-surface rounded-lg">
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Heart Rate</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-primary">118</span>
                                            <span className="text-[10px] text-slate-500 font-bold">bpm</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-surface rounded-lg">
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">BP</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-primary">105/70</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-slate-400">ambulance</span>
                                        <span className="text-[10px] font-bold text-primary">ETA: 12 MINS</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">DEST: CITY CENTRAL</span>
                                </div>
                            </div>

                            {/* Patient Card 3 */}
                            <div onClick={() => navigate('/coming-soon')} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-xl transition-all duration-300 cursor-pointer">
                                <div className="flex justify-between mb-4">
                                    <span className="px-2 py-1 bg-error-container text-on-error-container text-[10px] font-black rounded-md tracking-tighter">RED - IMMEDIATE</span>
                                    <span className="text-[10px] font-medium text-slate-400">ID: #4094-C</span>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 text-slate-300">
                                        <span className="material-symbols-outlined text-3xl">person</span>
                                    </div>
                                    <div>
                                        <h4 className="font-headline font-bold text-primary">Unknown Pediatric</h4>
                                        <p className="text-[10px] font-label text-slate-500 uppercase">Est. Age: 8-10 | Respiratory Distress</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-surface rounded-lg">
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Heart Rate</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-primary">165</span>
                                            <span className="text-[10px] text-error font-bold">bpm</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-surface rounded-lg">
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">SPO2</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-primary">82</span>
                                            <span className="text-[10px] text-error font-bold">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>helicopter</span>
                                        <span className="text-[10px] font-bold text-primary">ETA: 7 MINS (AIR)</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">DEST: ST. JUDE</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            {/* Urgent Notification Floating Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-4 rounded-2xl shadow-2xl border border-white/50 flex items-center gap-8 max-w-2xl w-[90%]">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-error animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active System Alert</p>
                        <p className="text-sm font-bold text-primary font-headline">North Memorial at Max Capacity - Rerouting Hub Active</p>
                    </div>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <button onClick={() => navigate('/coming-soon')} className="bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 whitespace-nowrap">
                    Confirm Redirect
                </button>
            </div>
        </div>
    );
};

export default MassCasualtyMode;