import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-surface text-on-surface overflow-hidden">
            <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 grid-bg pointer-events-none"></div>
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-secondary-fixed/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-primary-fixed-dim/20 blur-[150px] rounded-full pointer-events-none"></div>
                <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline">SENTINEL AI</span>
                    </div>
                    <div className="hidden md:flex gap-6 items-center">
                        <span className="text-label-md text-primary/60 font-medium tracking-[0.05em] uppercase text-[0.75rem]">System Status: Operational</span>
                        <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#006b5f]"></div>
                    </div>
                </header>
                <main className="relative z-10 max-w-5xl px-6 text-center flex flex-col items-center">
                    <div className="mb-12 relative">
                        <div className="absolute -inset-8 bg-secondary-fixed/5 rounded-full blur-3xl"></div>
                        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                            <div className="absolute inset-0 border border-outline-variant/20 rounded-full animate-spin-slow"></div>
                            <div className="absolute inset-8 border border-outline-variant/10 rounded-full"></div>
                            <img className="w-full h-full object-contain relative z-20" data-alt="abstract clinical 3D sculpture of a glowing medical pulse line flowing through a translucent crystalline structure with soft blue and teal lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfWho6LLHRvj3414YBh45bC3PDgSmkj7YEWGYjuNlgTqht1_A4P1wIATg_DgwdeTdp_gA5o8LyaqJR7g7bdKtqKgV34Bj6krDsuFO65MtlbosaI3eVDWCOgOV41cpSNskqekutOLsFy8-RaHJppiXpPQ2x5lpRPWjktKtTZRlcQZU1jd5viIFXiL-_QSzDi2S1uBaYgVDdTQ0m2rgmH6nh9Mi9afQJtaU_e15-ykdMMQF0wA810iOj7sDI8mCqvz-R0R9ol3sR-Nnk" alt="Crystal Logo" />
                        </div>
                    </div>
                    <div className="space-y-6 max-w-2xl">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary leading-[1.1]">
                            Optimizing the <span className="text-primary-container">Golden Hour</span>
                        </h1>
                        <p className="text-lg md:text-xl text-on-surface-variant font-light leading-relaxed max-w-xl mx-auto">
                            Clinical-grade AI designed for seamless emergency routing and hospital coordination when every second defines a life.
                        </p>
                    </div>
                    <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center">
                        <button onClick={() => navigate('/select')} className="hero-gradient px-10 py-5 rounded-xl text-on-primary font-semibold text-lg shadow-[0_40px_60px_-15px_rgba(3,22,50,0.2)] hover:scale-105 transition-all duration-300 flex items-center gap-2">
                            Enter System
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </button>
                        <button onClick={() => navigate('/coming-soon')} className="px-8 py-5 rounded-xl text-primary font-semibold text-lg hover:bg-surface-container-low transition-colors duration-300">
                            Learn More
                        </button>
                    </div>
                </main>
                <footer className="absolute bottom-0 left-0 w-full p-8 flex flex-col md:flex-row justify-between items-end md:items-center gap-4 z-10">
                    <div className="flex gap-12">
                        <div className="flex flex-col">
                            <span className="text-[0.65rem] uppercase tracking-widest text-primary/40 font-bold mb-1">Latency</span>
                            <span className="text-sm font-mono text-primary/80">14ms Global</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.65rem] uppercase tracking-widest text-primary/40 font-bold mb-1">Precision</span>
                            <span className="text-sm font-mono text-primary/80">99.98% Acc.</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.65rem] uppercase tracking-widest text-primary/40 font-bold mb-1">Deployment</span>
                            <span className="text-sm font-mono text-primary/80">V4.2.1-SENTINEL</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-primary/40">
                        <span className="text-xs">Secure Clinical Environment</span>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    </div>
                </footer>
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[20%] left-[10%] w-[1px] h-[40%] bg-gradient-to-b from-transparent via-primary-container/20 to-transparent"></div>
                    <div className="absolute bottom-[10%] right-[15%] w-[1px] h-[30%] bg-gradient-to-b from-transparent via-secondary/20 to-transparent"></div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
