import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmtInterface = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-surface font-body text-on-surface bg-[#F2F4F6] min-h-screen">
            {/* Mobile Header / Top Bar */}
            <header className="bg-primary text-white sticky top-0 z-40 shadow-md">
                <div className="px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div onClick={() => navigate('/select')} className="w-8 h-8 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-200 transition-colors">
                            <span className="material-symbols-outlined text-sm">emergency</span>
                        </div>
                        <div>
                            <h1 className="font-headline font-bold text-sm tracking-tight leading-none mb-1">Unit Delta-4</h1>
                            <p className="font-label text-[10px] text-secondary-fixed uppercase font-bold">Active Deployment</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
                            <span className="text-[10px] font-mono font-bold tracking-widest text-[#B6C7EB]">14ms</span>
                        </div>
                        <span onClick={() => navigate('/coming-soon')} className="material-symbols-outlined text-[#B6C7EB] cursor-pointer hover:text-white transition-colors">menu</span>
                    </div>
                </div>
            </header>

            {/* Main EMT Content Area */}
            <main className="pb-24"> {/* Padding bottom for fixed footer */}
                
                {/* Active Mission Header */}
                <div onClick={() => navigate('/coming-soon')} className="bg-[#1A2B48] text-white p-4 pb-8 rounded-b-[2rem] shadow-lg relative cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-error px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[10px]">warning</span>
                            Priority 1 Response
                        </div>
                        <span className="text-[10px] text-primary-fixed-dim font-mono">#CAS-8821</span>
                    </div>
                    <h2 className="font-headline text-2xl font-extrabold mb-1">MVA - Multi-Vehicle</h2>
                    <p className="text-sm text-primary-fixed-dim flex items-center gap-1 mb-4">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        I-95 Northbound, Mile 42
                    </p>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] uppercase text-primary-fixed tracking-widest mb-1 opacity-70">Estimated Access Time</p>
                            <p className="font-headline text-3xl font-black text-secondary-fixed tracking-tighter">4.2<span className="text-sm font-bold text-primary-fixed ml-1">MIN</span></p>
                        </div>
                        <button className="bg-surface-container-lowest text-primary p-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>navigation</span>
                        </button>
                    </div>
                </div>

                <div className="px-4 -mt-4 relative z-10 space-y-4">
                    
                    {/* Patient Intel Preview */}
                    <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-headline font-bold text-primary text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary-container bg-primary p-1 rounded-lg text-[14px]">person_alert</span>
                                Patient Intel
                            </h3>
                            <span onClick={() => navigate('/coming-soon')} className="text-[10px] font-bold text-secondary uppercase cursor-pointer hover:underline">View Full Profile</span>
                        </div>
                        <div className="bg-surface-container-low rounded-xl p-3 flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRUmpVf3j88d4k3Hk1gRpKB76dqkbW23S1_2khc-l86H2o1xijtvWGv4sDChUulgbeqGJixA3Mj45xXjIQJBfp-lWOHYlnJkbmkV0JTbtBRoOWQP22-U730nlk6kKklM0im2e-wC6wnBQYxeG9Z94kIA2bfkr8elVoSEERhFBbJqyMwc3hif25xpa6qHCIra1ocQ-HIO0q_17t5WQAMlUBizxnriO8xeiMsQs4LqIoeo_sxEgjtedMIJ3Lak7G5R7VsTvMHnaUPy1l" alt="patient profile" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="font-bold text-primary text-sm leading-tight">Marcus H.</p>
                                <p className="text-[11px] text-on-surface-variant mb-1">44y • M • No known allergies</p>
                                <div className="flex gap-2">
                                    <span className="bg-error-container text-on-error-container px-1.5 py-0.5 rounded text-[9px] font-bold">TYPE O-</span>
                                    <span className="bg-primary/5 text-primary/70 px-1.5 py-0.5 rounded text-[9px] font-bold">HTN HISTORY</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vitals Sync Module */}
                    <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-headline font-bold text-primary text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-white bg-error p-1 rounded-lg text-[14px]">monitor_heart</span>
                                Telemetry Sync
                            </h3>
                            <div className="flex items-center gap-1 bg-secondary-container/30 px-2 py-0.5 rounded-full text-primary text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 bg-secondary-fixed rounded-full"></span> Live
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div onClick={() => navigate('/coming-soon')} className="bg-[#191c1e] text-white p-3 rounded-xl relative overflow-hidden group cursor-pointer border border-[#2d3133] hover:border-error transition-colors">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-4xl text-error">favorite</span>
                                </div>
                                <p className="text-[10px] text-[#8293b5] uppercase tracking-widest font-medium mb-1">HR</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-headline font-black text-white">118</span>
                                    <span className="text-[10px] text-error font-bold">bpm</span>
                                </div>
                            </div>
                            <div onClick={() => navigate('/coming-soon')} className="bg-[#191c1e] text-white p-3 rounded-xl relative overflow-hidden group cursor-pointer border border-[#2d3133] hover:border-secondary transition-colors">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-4xl text-secondary">air</span>
                                </div>
                                <p className="text-[10px] text-[#8293b5] uppercase tracking-widest font-medium mb-1">BP</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-headline font-black text-white leading-none">105<span className="text-xl text-[#8293b5]">/</span>70</span>
                                </div>
                            </div>
                            <div onClick={() => navigate('/coming-soon')} className="bg-[#191c1e] text-white p-3 rounded-xl relative overflow-hidden group cursor-pointer border border-[#2d3133] hover:border-secondary-fixed transition-colors">
                                <p className="text-[10px] text-[#8293b5] uppercase tracking-widest font-medium mb-1">SPO2</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-headline font-black text-white">96</span>
                                    <span className="text-[10px] text-secondary-fixed font-bold">%</span>
                                </div>
                            </div>
                            <div onClick={() => navigate('/coming-soon')} className="bg-[#191c1e] text-white p-3 rounded-xl relative overflow-hidden group cursor-pointer border border-[#2d3133] hover:border-orange-400 transition-colors">
                                <p className="text-[10px] text-[#8293b5] uppercase tracking-widest font-medium mb-1">TEMP</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-headline font-black text-white">97.8</span>
                                    <span className="text-[10px] text-orange-400 font-bold">°F</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => navigate('/coming-soon')} className="w-full py-2.5 bg-surface-container-high rounded-lg text-xs font-bold text-primary flex items-center justify-center gap-2 hover:bg-surface-container transition-colors active:scale-95">
                            <span className="material-symbols-outlined text-[16px]">sync</span>
                            Force Sync Device
                        </button>
                    </div>

                    {/* AI Routing Recommendation */}
                    <div className="bg-gradient-to-r from-primary to-[#1A2B48] rounded-2xl p-4 shadow-lg text-white">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary-fixed text-lg">alt_route</span>
                                <h3 className="font-headline font-bold text-sm tracking-wide">Destination Locked</h3>
                            </div>
                            <span className="bg-secondary-fixed text-primary px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Optimal</span>
                        </div>
                        
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5 mb-4 border-l-4 border-l-secondary-fixed">
                            <p className="text-lg font-headline font-extrabold mb-1">City Central ER</p>
                            <p className="text-xs text-[#B6C7EB] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">schedule</span> 12 mins via I-95
                            </p>
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => navigate('/coming-soon')} className="flex-1 py-3 bg-secondary-fixed text-primary font-bold text-sm rounded-xl font-headline shadow-md active:scale-95 transition-transform flex justify-center items-center gap-1">
                                <span className="material-symbols-outlined text-[18px]">turn_directions</span> Start Nav
                            </button>
                            <button onClick={() => navigate('/coming-soon')} className="flex-none w-12 bg-white/10 text-white font-bold rounded-xl active:scale-95 transition-transform flex justify-center items-center">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                        </div>
                    </div>

                </div>
            </main>

            {/* Sticky Action Footer */}
            <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant/10 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] px-4 py-3 z-50 rounded-t-2xl">
                <div className="flex justify-between items-center max-w-sm mx-auto gap-2">
                    <button onClick={() => navigate('/coming-soon')} className="flex flex-col items-center justify-center p-2 text-primary hover:bg-surface-container-low rounded-xl transition-colors min-w-[70px]">
                        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>camera_alt</span>
                        <span className="text-[10px] font-medium leading-none">Capture</span>
                    </button>
                    
                    {/* Primary Emergency Action Button */}
                    <button onClick={() => navigate('/coming-soon')} className="w-16 h-16 rounded-full bg-error text-white shadow-[0_5px_15px_rgba(186,26,26,0.3)] flex items-center justify-center -mt-8 border-4 border-[#F2F4F6] active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-3xl">mic</span>
                    </button>
                    
                    <button onClick={() => navigate('/coming-soon')} className="flex flex-col items-center justify-center p-2 text-primary hover:bg-surface-container-low rounded-xl transition-colors min-w-[70px]">
                        <span className="material-symbols-outlined mb-1">clinical_notes</span>
                        <span className="text-[10px] font-medium leading-none">Notes</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default EmtInterface;
