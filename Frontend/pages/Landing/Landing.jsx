import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronRight, Activity, ShieldCheck, Zap, Database, Brain, Network, 
    Users, AlertTriangle, Hospital, Stethoscope, Route, Map as MapIcon, 
    ArrowRight, Star, Check, Menu, X, Clock, Cross,
    HeartPulse, Lock, Quote, Building2, Landmark, PlayCircle, Phone,
    UserCheck, Shield
} from 'lucide-react';

const IMAGES = [
    "https://science.thewire.in/wp-content/uploads/2020/07/Doctors-PTI.jpg", // Direct image from the Wire article provided
    "https://content.jdmagicbox.com/comp/solapur/n9/9999px217.x217.161020133114.v4n9/catalogue/hrudayam-superspeciality-hospital-and-research-center-hshrc--solapur-city-solapur-hospitals-0gcl3ik6b6.jpg",
    "https://www.nicepng.com/png/full/33-336282_best-doctors-india-indian-doctor-and-nurse.png",
    "https://c7.alamy.com/comp/2K73C83/bedside-consultation-at-modern-hospital-senior-woman-lying-on-hospital-bed-in-ward-while-consultation-with-friendly-indian-doctor-and-caring-nurse-2K73C83.jpg"
];

const FALLBACK_QUOTES = [
    "In the golden hour, every second is a heartbeat saved through precision routing.",
    "Indian doctors and nurses form the undeniable backbone of global health systems.",
    "Technology empowering humanity in our most critical moments of emergency care.",
    "Empowering healthcare heroes with the technology to save every precious life."
];

const PARTNER_HOSPITALS = [
    { name: "AIIMS", location: "New Delhi", icon: Cross, desc: "India's premier public medical research university and hospital." },
    { name: "Apollo Hospitals", location: "Chennai / Pan-India", icon: Activity, desc: "Asia's foremost integrated healthcare services provider." },
    { name: "Fortis Healthcare", location: "Gurugram", icon: ShieldCheck, desc: "Leading tertiary care hospital network with state-of-the-art trauma centers." },
    { name: "Max Healthcare", location: "Delhi NCR", icon: HeartPulse, desc: "Multispeciality hospital chain focused on critical care and cardiology." },
    { name: "Manipal Hospitals", location: "Bengaluru", icon: Building2, desc: "Pioneers in clinical excellence and personalized patient care." },
    { name: "Medanta - The Medicity", location: "Gurugram", icon: Landmark, desc: "World-class institute for heart, liver, and neuro-emergency response." }
];

const TESTIMONIAL_PROFILES = [
    { name: "Dr. Ananya Rao", role: "Chief of Emergency Medicine, Apollo Hospitals" },
    { name: "Dr. Vikram Singh", role: "Head of Trauma, AIIMS Delhi" },
    { name: "Dr. Priya Desai", role: "Director of Critical Care, Fortis Healthcare" }
];

const fetchWithRetry = async (url, options, retries = 5) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delays[i]));
        }
    }
};

const App = () => {
    const [isEntering, setIsEntering] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [quotes, setQuotes] = useState(FALLBACK_QUOTES);
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % IMAGES.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const getQuotes = async () => {
            const apiKey = "";
            if (!apiKey) return;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ parts: [{ text: "Generate exactly 4 highly inspiring, professional one-sentence quotes about the heroism of Indian doctors and the impact of rapid ambulance routing. Output only a JSON array of strings. Max 15 words each." }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: { type: "ARRAY", items: { type: "STRING" } }
                }
            };

            try {
                const result = await fetchWithRetry(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const fetchedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (fetchedText) {
                    const fetchedQuotes = JSON.parse(fetchedText);
                    if (Array.isArray(fetchedQuotes) && fetchedQuotes.length >= 4) {
                        setQuotes(fetchedQuotes.map(q => String(q)).slice(0, 4));
                    }
                }
            } catch (error) {
                console.error("Gemini fetch failed, using fallbacks.");
            }
        };
        getQuotes();
    }, []);

    const handleEnter = () => navigate('/select');

    return (
        <div className="bg-[#f8fcfe] text-slate-700 min-h-screen overflow-x-hidden relative scroll-smooth font-sans selection:bg-teal-100 selection:text-teal-900">
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                * { font-family: 'Plus Jakarta Sans', sans-serif; }
                h1, h2, h3, h4 { font-family: 'Outfit', sans-serif; }
                .hero-image-clip {
                    border-radius: 40px 40px 240px 40px;
                }
                .grid-bg {
                    background-image: radial-gradient(#d1eef4 1px, transparent 1px);
                    background-size: 30px 30px;
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
            `}</style>

            {/* Sticky Navbar */}
            <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <div className="bg-teal-600 p-2 rounded-xl text-white shadow-sm transition-transform group-hover:rotate-12">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-[#0a2540] uppercase">SENTINEL</span>
                        </div>
                        <div className="hidden lg:flex items-center gap-3 pl-6 border-l border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status: Operational</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></div>
                        </div>
                    </div>
                    
                    <nav className="hidden lg:flex gap-8 items-center text-sm font-bold text-[#4f6b8a]">
                        <a href="#problem" className="hover:text-teal-600 transition-colors">Problem</a>
                        <a href="#what-we-offer" className="hover:text-teal-600 transition-colors">What We Offer</a>
                        <a href="#partner-networks" className="hover:text-teal-600 transition-colors">Partners</a>
                    </nav>

                    <div className="hidden lg:flex items-center gap-4">
                        <button onClick={handleEnter} className="text-sm font-bold text-[#4f6b8a] hover:text-[#0a2540] transition-colors">Sign In</button>
                        <button onClick={handleEnter} className="bg-[#0e7490] text-white px-8 py-3 rounded-full font-black text-sm hover:bg-[#0891b2] transition-all shadow-lg">
                            Book Demo
                        </button>
                    </div>

                    <button className="lg:hidden p-2 text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white pt-24 px-6 lg:hidden flex flex-col">
                    <nav className="flex flex-col gap-6 text-2xl font-black text-[#0a2540]">
                        <a href="#problem" onClick={() => setMobileMenuOpen(false)}>Problem</a>
                        <a href="#what-we-offer" onClick={() => setMobileMenuOpen(false)}>What We Offer</a>
                        <a href="#partner-networks" onClick={() => setMobileMenuOpen(false)}>Partners</a>
                        <hr className="border-slate-100" />
                        <button onClick={handleEnter} className="bg-[#0e7490] ...">
    {isEntering ? "Connecting..." : "Enter System"} <ChevronRight className="w-6 h-6"/>
</button>
                        </nav>
                </div>
            )}

            {/* REFINED HERO SECTION */}
            <section className="pt-36 pb-24 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center min-h-[90vh] relative">
                <div className="space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-[11px] font-black uppercase tracking-widest text-[#0e7490]">
                        <ShieldCheck className="w-4 h-4" /> Trusted Emergency Infrastructure
                    </div>
                    <h1 className="text-7xl md:text-8xl font-black text-[#0a2540] leading-[0.95] tracking-tighter">
                        Optimizing the <br /> 
                        <span className="text-teal-600">Golden Hour</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
                        Clinical-grade AI designed for seamless emergency routing and hospital coordination when every second defines a life.
                    </p>
                    <div className="flex flex-wrap gap-5 pt-4">
                        <button onClick={handleEnter} className="bg-[#0e7490] text-white px-12 py-5 rounded-full font-black text-xl hover:bg-[#0891b2] transition-all shadow-2xl flex items-center gap-3">
                            {isEntering ? "Connecting..." : "Enter System"} <ChevronRight className="w-6 h-6"/>
                        </button>
                        <button onClick={handleEnter} className="flex items-center gap-4 text-[#0a2540] font-black text-lg hover:text-teal-600 transition-all group">
                            <PlayCircle className="w-14 h-14 text-teal-600 group-hover:scale-110 transition-transform" />
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Hero Right Visuals */}
                <div className="relative h-full flex items-center justify-center lg:justify-end">
                    <div className="relative w-full max-w-[500px] aspect-[4/5] bg-white hero-image-clip overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border-[14px] border-white group z-20">
                        {IMAGES.map((img, idx) => (
                            <div 
                                key={idx} 
                                className={`absolute inset-0 transition-all duration-1500 ease-in-out ${currentSlide === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                                <div className="absolute bottom-12 left-0 w-full px-10">
                                    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
                                        <p className="text-white text-lg md:text-xl font-bold italic leading-relaxed drop-shadow-lg">
                                            "{quotes[idx % quotes.length] || FALLBACK_QUOTES[0]}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Success Badges */}
                    <div className="absolute top-1/2 right-[-60px] translate-y-[-50%] bg-white rounded-3xl p-6 shadow-2xl z-30 flex flex-col items-center animate-float border border-teal-50 hidden md:flex">
                        <div className="relative w-20 h-20 mb-3">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="213" strokeDashoffset="20" className="text-teal-600" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-black text-[#0a2540]">99%</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-black text-[#0a2540] uppercase tracking-tighter">Accuracy</p>
                    </div>
                </div>
            </section>

            {/* Statistics Bar */}
            <section className="bg-white py-20 border-y border-slate-100 relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {[
                        { val: "99.98%", label: "Precision Acc.", icon: Shield },
                        { val: "14ms", label: "Global Latency", icon: Zap },
                        { val: "20+", label: "Regional Nodes", icon: Network },
                        { val: "108", label: "Unified Protocol", icon: Phone }
                    ].map((stat, i) => (
                        <div key={i} className="space-y-2 group">
                            <stat.icon className="w-6 h-6 text-teal-500 mx-auto mb-4 group-hover:scale-125 transition-transform" />
                            <h2 className="text-5xl font-black text-[#0a2540] tracking-tighter">{stat.val}</h2>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* What We Offer */}
            <section id="what-we-offer" className="py-32 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24 space-y-4">
                        <span className="text-teal-600 font-black uppercase tracking-[0.3em] text-[10px]">Infrastructure</span>
                        <h2 className="text-5xl md:text-6xl font-black text-[#0a2540] tracking-tighter">What We Provide</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Brain, title: "Triage Engine", desc: "AI-driven severity prediction from EMT-reported data.", color: "bg-blue-600" },
                            { icon: Route, title: "Optimization", desc: "Real-time matching of regional hospital resources.", color: "bg-teal-600" },
                            { icon: MapIcon, title: "Tactical Grid", desc: "Live dashboard for state emergency control rooms.", color: "bg-amber-600" },
                            { icon: ShieldCheck, title: "Explainability", desc: "Clinical rationale provided for every routing decision.", color: "bg-indigo-600" }
                        ].map((service, i) => (
                            <div key={i} className="group p-10 rounded-[3rem] bg-[#f8fcfe] border border-transparent hover:border-teal-100 hover:bg-white hover:shadow-2xl transition-all cursor-pointer">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 text-white shadow-xl transition-transform group-hover:rotate-6 ${service.color}`}>
                                    <service.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-[#0a2540] mb-4">{service.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-bold mb-6">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partner Networks */}
            <section id="partner-networks" className="py-32 px-6 bg-[#0a2540] relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20 space-y-4">
                        <span className="text-teal-400 font-bold uppercase tracking-[0.4em] text-[10px]">Collaborations</span>
                        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Leading Partners.</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {PARTNER_HOSPITALS.map((hospital, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-xl p-10 rounded-[4rem] border border-white/10 hover:bg-white/10 transition-all">
                                <div className="bg-teal-600 p-5 rounded-[2rem] text-white mb-8 w-fit shadow-2xl">
                                    <hospital.icon className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-2">{hospital.name}</h3>
                                <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">{hospital.location}</p>
                                <p className="text-slate-400 leading-relaxed font-medium">{hospital.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white text-slate-500 pt-32 pb-16 px-6 relative border-t border-slate-100">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <Activity className="w-10 h-10 text-teal-600" />
                            <span className="text-3xl font-black text-[#0a2540] uppercase tracking-tighter">SENTINEL</span>
                        </div>
                        <p className="text-lg font-medium leading-relaxed italic">"When every second defines a life."</p>
                        
                        <div className="flex gap-8 items-center border-t border-slate-100 pt-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency</span>
                                <span className="text-sm font-bold text-[#0a2540]">14ms Global</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precision</span>
                                <span className="text-sm font-bold text-[#0a2540]">99.98% Acc.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-black text-[#0a2540] mb-8 text-xs uppercase tracking-[0.3em]">Infrastructure</h4>
                        <ul className="space-y-5 text-sm font-bold">
                            <li><a href="#" className="hover:text-teal-600 transition-colors">Triage Prediction</a></li>
                            <li><a href="#" className="hover:text-teal-600 transition-colors">Grid Unification</a></li>
                            <li><a href="#" className="hover:text-teal-600 transition-colors">API Gateway</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-[#0a2540] mb-8 text-xs uppercase tracking-[0.3em]">Resources</h4>
                        <ul className="space-y-5 text-sm font-bold">
                            <li><a href="#" className="hover:text-teal-600 transition-colors">Clinical Ethics</a></li>
                            <li><a href="#" className="hover:text-teal-600 transition-colors">Case Studies</a></li>
                            <li><a href="#" className="hover:text-teal-600 transition-colors">Technical Docs</a></li>
                        </ul>
                    </div>

                    <div className="bg-[#f8fcfe] p-10 rounded-[3.5rem] border border-teal-50 text-center shadow-inner">
                        <h4 className="font-black text-[#0a2540] mb-4 text-xl tracking-tighter">Deployment</h4>
                        <p className="text-xs font-bold mb-8 text-teal-600 leading-relaxed uppercase tracking-widest">V4.2.1-SENTINEL</p>
                        <button onClick={handleEnter} className="w-full bg-[#0a2540] text-white py-4 rounded-full font-black text-sm shadow-2xl hover:bg-teal-700 transition-all">
                            Appointment
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] font-black tracking-widest text-slate-400 border-t border-slate-100 pt-12">
                    <p>© 2026 SENTINEL MEDICAL AI SYSTEMS. ALL RIGHTS RESERVED.</p>
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-teal-600" />
                            <span className="text-[#0a2540]">SECURE CLINICAL ENVIRONMENT</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                            <span className="text-emerald-500 uppercase tracking-widest">Grid Operational</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;