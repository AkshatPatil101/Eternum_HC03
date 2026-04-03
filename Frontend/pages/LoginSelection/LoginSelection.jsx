import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSelection = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 selection:bg-secondary-fixed selection:text-on-secondary-fixed">
            <div className="max-w-6xl w-full flex flex-col items-center">
                {/* Brand Header */}
                <div className="mb-16 text-center z-10">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 premium-gradient rounded-xl flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
                        </div>
                        <span className="text-3xl font-extrabold tracking-tighter text-primary">SENTINEL AI</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-4">The Silent Sentinel</h1>
                    <p className="text-on-surface-variant max-w-lg mx-auto text-lg">Select your operational interface to begin. Clinical precision, engineered for life-saving clarity.</p>
                </div>

                {/* Role Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16 z-10">
                    {/* Control Room / Dispatch */}
                    <button onClick={() => navigate('/dashboard')} className="group relative flex flex-col text-left p-8 rounded-[2rem] bg-surface-container-lowest transition-all duration-300 hover:shadow-[0_40px_60px_-15px_rgba(26,43,72,0.08)] hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-secondary/20">
                        <div className="w-14 h-14 mb-8 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container transition-colors group-hover:bg-primary group-hover:text-on-primary">
                            <span className="material-symbols-outlined text-3xl">emergency</span>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">Control Room / Dispatch</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">High-fidelity interface for real-time fleet coordination and critical incident routing.</p>
                        <div className="mt-auto flex items-center text-secondary font-semibold text-sm group-hover:gap-2 transition-all">
                            Initialize Command <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
                        </div>
                    </button>

                    {/* Hospital Admin */}
                    <button onClick={() => navigate('/hospital-admin')} className="group relative flex flex-col text-left p-8 rounded-[2rem] bg-surface-container-lowest transition-all duration-300 hover:shadow-[0_40px_60px_-15px_rgba(26,43,72,0.08)] hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-secondary/20">
                        <div className="w-14 h-14 mb-8 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                            <span className="material-symbols-outlined text-3xl">clinical_notes</span>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">Hospital Admin</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Comprehensive oversight of bed availability, specialist queues, and patient intake metrics.</p>
                        <div className="mt-auto flex items-center text-primary/60 font-semibold text-sm group-hover:text-primary transition-all">
                            Access Analytics <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
                        </div>
                    </button>

                    {/* EMT Interface */}
                    <button onClick={() => navigate('/emt')} className="group relative flex flex-col text-left p-8 rounded-[2rem] bg-surface-container-lowest transition-all duration-300 hover:shadow-[0_40px_60px_-15px_rgba(26,43,72,0.08)] hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-secondary/20">
                        <div className="w-14 h-14 mb-8 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                            <span className="material-symbols-outlined text-3xl">medical_services</span>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">EMT Interface</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Optimized, lightweight access for field personnel and rapid diagnostic synchronization.</p>
                        <div className="mt-auto flex items-center text-primary/60 font-semibold text-sm group-hover:text-primary transition-all">
                            Go Active <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
                        </div>
                    </button>
                </div>

                {/* Hidden Logic: Form appears below after selection */}
                <div className="w-full max-w-md z-10">
                    <div className="glass-effect p-10 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(3,22,50,0.1)]">
                        <div className="text-center mb-8">
                            <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[0.65rem] font-bold tracking-widest uppercase mb-4">Command Identity Verification</span>
                            <h2 className="text-2xl font-bold text-primary">Security Gateway</h2>
                        </div>
                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
                            <div className="space-y-2 text-left">
                                <label className="text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Personnel Email</label>
                                <input className="w-full h-14 px-6 rounded-xl bg-surface-container-high border-none text-primary placeholder:-outline focus:ring-2 focus:ring-secondary/40 transition-all duration-300" placeholder="name@sentinel.ai" type="email" />
                            </div>
                            <div className="space-y-2 text-left">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Access Token</label>
                                    <span onClick={() => navigate('/coming-soon')} className="text-[0.7rem] text-secondary hover:underline cursor-pointer">Forgot?</span>
                                </div>
                                <input className="w-full h-14 px-6 rounded-xl bg-surface-container-high border-none text-primary placeholder:-outline focus:ring-2 focus:ring-secondary/40 transition-all duration-300" placeholder="••••••••" type="password" />
                            </div>
                            <button type="submit" className="w-full h-14 rounded-xl premium-gradient text-on-primary font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300">
                                Authorize Terminal Access
                            </button>
                        </form>
                        <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center">
                            <p className="text-on-surface-variant text-sm">Require emergency credential bypass? <span onClick={() => navigate('/coming-soon')} className="text-secondary font-semibold hover:underline cursor-pointer">Contact System Operator</span></p>
                        </div>
                    </div>
                </div>

                {/* Footer / Technical Meta */}
                <div className="mt-20 flex flex-col md:flex-row items-center gap-8 text-on-surface-variant text-[0.75rem] uppercase tracking-widest font-medium opacity-60 z-10">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim"></span>
                        System Status: Operational
                    </div>
                    <div className="hidden md:block w-px h-4 bg-outline-variant"></div>
                    <div>Build 24.0.8 // Sentinel Prime Network</div>
                    <div className="hidden md:block w-px h-4 bg-outline-variant"></div>
                    <div>Encrypted Connection AES-256</div>
                </div>
            </div>

            {/* Background Decorative Element */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary-container/10 blur-[120px]"></div>
                <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-container/5 blur-[120px]"></div>
            </div>
        </div>
    );
};

export default LoginSelection;
