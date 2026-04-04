import React from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { useHospitalsDynamic, useEquipmentAvailability } from '../../src/hooks/useSupabaseRealtime';
import supabase from '../../src/lib/supabase';

const HospitalAdmin = () => {
    const navigate = useNavigate();
    const dynamicHospitals = useHospitalsDynamic();
    const equipmentData = useEquipmentAvailability();
    const myHospital = dynamicHospitals.find(h => h.hospital_id === 'H01') || {};
    
    const myEquipment = equipmentData.find(e => e.hospital_id === 'H01' && e.equipment === 'ventilator');
    const ventilatorCount = myEquipment ? myEquipment.available : 0;

    const updateBedCount = async (type, increment) => {
        if (!myHospital || Object.keys(myHospital).length === 0) return;
        
        const currentCount = type === 'general' ? myHospital.general_beds_free : myHospital.icu_beds_free;
        const newCount = Math.max(0, currentCount + increment); // prevent negative beds
        
        const updatePayload = type === 'general' 
            ? { general_beds_free: newCount }
            : { icu_beds_free: newCount };
            
        await supabase
            .from('hospitals_dynamic')
            .update(updatePayload)
            .eq('hospital_id', 'H01');
    };

    const updateVentilatorCount = async (increment) => {
        if (!myEquipment) return;
        const newCount = Math.max(0, ventilatorCount + increment);
        await supabase
            .from('equipment_availability')
            .update({ available: newCount })
            .eq('hospital_id', 'H01')
            .eq('equipment', 'ventilator');
    };
=======

const HospitalAdmin = () => {
    const navigate = useNavigate();
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8

    return (
        <div className="bg-surface font-body text-on-surface">
            {/* TopNavBar */}
            <header className="bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-xl docked full-width top-0 sticky z-50 shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)]">
                <div className="flex justify-between items-center w-full px-8 py-4 max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-8">
                        <span className="text-xl font-bold tracking-tighter text-[#031632] dark:text-white font-headline cursor-pointer" onClick={() => navigate('/select')}>SENTINEL AI</span>
                        <nav className="hidden md:flex gap-6 items-center">
                            <span onClick={() => navigate('/coming-soon')} className="text-slate-500 dark:text-slate-400 font-medium font-manrope tracking-tight hover:text-[#1A2B48] transition-colors duration-300 cursor-pointer">Case Queue</span>
                            <span onClick={() => navigate('/dashboard')} className="text-[#031632] dark:text-white border-b-2 border-[#1A2B48] pb-1 font-manrope tracking-tight font-semibold cursor-pointer">Decision Intel</span>
                            <span onClick={() => navigate('/coming-soon')} className="text-slate-500 dark:text-slate-400 font-medium font-manrope tracking-tight hover:text-[#1A2B48] transition-colors duration-300 cursor-pointer">Patient Summary</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-2 mr-4">
                            <button onClick={() => navigate('/mass-casualty')} className="bg-surface-container-highest px-4 py-2 rounded-xl text-primary font-semibold text-sm transition-all active:scale-95 duration-300 ease-in-out hover:opacity-80">Mass Casualty Toggle</button>
                            <button onClick={() => navigate('/coming-soon')} className="bg-error text-on-error px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 duration-300 ease-in-out hover:opacity-80">Emergency Mode</button>
                        </div>
                        <div className="flex items-center gap-3">
                            <span onClick={() => navigate('/coming-soon')} className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full cursor-pointer transition-colors">notifications</span>
                            <span onClick={() => navigate('/coming-soon')} className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full cursor-pointer transition-colors">settings</span>
                            <div onClick={() => navigate('/coming-soon')} className="w-10 h-10 rounded-full bg-primary-container overflow-hidden cursor-pointer hover:opacity-80">
                                <img alt="Chief Medical Officer Role" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9T07mh6FiJlApNGsMqypdSkDlcTIR8-XIXgQRsk2c7-t2_Pf87AmybQd2wm2r7JM1IEkM5yQWBTyBXDx2s1ol0d17Lbhl0crl5oFxytZJJKqA0u7v3fEdEsWfuIyxhvprxXL8BBFn7S7GQw4EyFDkYAJkM7VXm7_SciAHteEqBoUBMb2HCFr1Uh0u6c20sWog4byrUalHNSZt82dHzvy5yPbHm6ljmRBEA_DcJHrrHSgvFpsYxqb6g97uaQTd2kE31rPUeDZTeDsjVq" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1920px] mx-auto px-8 py-10">
                {/* Dashboard Header */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-2">Central Operations</h1>
                        <p className="text-on-surface-variant font-medium">Facility ID: SENT-PRIME-01 • Sector: North Wing</p>
<<<<<<< HEAD
                        {myHospital && Object.keys(myHospital).length > 0 && (
                            <div className="mt-2 text-sm bg-green-100 text-green-800 px-3 py-1 inline-flex rounded-full border border-green-300 items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <b>Live DB Status:</b> Load {myHospital.load_level || 'N/A'}, Wait {myHospital.avg_wait_min}m, Gen Beds: {myHospital.general_beds_free}
                            </div>
                        )}
                        {(!myHospital || Object.keys(myHospital).length === 0) && (
                            <div className="mt-2 text-sm bg-amber-100 text-amber-800 px-3 py-1 inline-flex rounded-full border border-amber-300 items-center gap-2">
                                <b>Live DB Status:</b> Waiting for Supabase Database Broadcasts...
                            </div>
                        )}
=======
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
                    </div>
                    <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-3 min-w-[320px]">
                        <div className="flex justify-between items-center">
                            <span className="font-label text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant">Current Load Indicator</span>
                            <span className="font-headline font-bold text-secondary">84%</span>
                        </div>
                        <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-secondary w-[84%]"></div>
                        </div>
                        <p className="text-[0.7rem] text-on-surface-variant">System Capacity: High Stress State</p>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* ICU Bed Availability (Stepper Card) */}
                    <div className="md:col-span-4 bg-surface-container-lowest rounded-xl p-8 shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)] border-none">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-primary">bed</span>
                            <h2 className="font-headline font-bold text-xl">ICU Bed Availability</h2>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                                <div>
<<<<<<< HEAD
                                    <p className="font-label text-[0.7rem] uppercase tracking-wider text-on-surface-variant">General Beds (Free)</p>
                                    <p className="font-headline font-bold text-2xl">{myHospital.general_beds_free !== undefined ? myHospital.general_beds_free : '--'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => updateBedCount('general', -1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-highest text-primary hover:bg-secondary-fixed transition-all active:scale-90"><span className="material-symbols-outlined">remove</span></button>
                                    <button onClick={() => updateBedCount('general', 1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all active:scale-90"><span className="material-symbols-outlined">add</span></button>
=======
                                    <p className="font-label text-[0.7rem] uppercase tracking-wider text-on-surface-variant">Level 1 Trauma</p>
                                    <p className="font-headline font-bold text-2xl">08</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-highest text-primary hover:bg-secondary-fixed transition-all"><span className="material-symbols-outlined">remove</span></button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all"><span className="material-symbols-outlined">add</span></button>
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                                <div>
<<<<<<< HEAD
                                    <p className="font-label text-[0.7rem] uppercase tracking-wider text-on-surface-variant">ICU Beds (Free)</p>
                                    <p className="font-headline font-bold text-2xl">{myHospital.icu_beds_free !== undefined ? myHospital.icu_beds_free : '--'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => updateBedCount('icu', -1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-highest text-primary hover:bg-secondary-fixed transition-all active:scale-90"><span className="material-symbols-outlined">remove</span></button>
                                    <button onClick={() => updateBedCount('icu', 1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all active:scale-90"><span className="material-symbols-outlined">add</span></button>
=======
                                    <p className="font-label text-[0.7rem] uppercase tracking-wider text-on-surface-variant">Pediatric ICU</p>
                                    <p className="font-headline font-bold text-2xl">03</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-highest text-primary hover:bg-secondary-fixed transition-all"><span className="material-symbols-outlined">remove</span></button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all"><span className="material-symbols-outlined">add</span></button>
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
                                </div>
                            </div>
                        </div>
                        <button onClick={() => navigate('/coming-soon')} className="w-full mt-8 py-3 bg-primary text-on-primary rounded-xl font-bold font-headline transition-all hover:opacity-90 active:scale-95 cursor-pointer">Update Inventory</button>
                    </div>

                    {/* Ventilators (Toggle/Count Card) */}
                    <div className="md:col-span-3 bg-surface-container-lowest rounded-xl p-8 shadow-[0_40px_60px_-15px_rgba(26,43,72,0.05)]">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-primary">air</span>
                            <h2 className="font-headline font-bold text-xl">Ventilators</h2>
                        </div>
                        <div className="space-y-6">
<<<<<<< HEAD
                            <div className="flex justify-between items-center bg-surface-container-low p-2 rounded-xl">
                                <span className="font-medium text-on-surface px-2">Active Units</span>
                                <div className="flex items-center gap-4 bg-surface-container-lowest p-1 rounded-lg">
                                    <button onClick={() => updateVentilatorCount(-1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-surface-container-highest text-primary hover:bg-secondary-fixed transition-all active:scale-90"><span className="material-symbols-outlined text-sm">remove</span></button>
                                    <span className="font-headline font-bold text-2xl min-w-[2rem] text-center">{myEquipment ? ventilatorCount : '--'}</span>
                                    <button onClick={() => updateVentilatorCount(1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-on-primary hover:bg-primary-container transition-all active:scale-90"><span className="material-symbols-outlined text-sm">add</span></button>
                                </div>
=======
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-on-surface">Active Units</span>
                                <span className="font-headline font-bold text-2xl">24</span>
>>>>>>> 180928da5bb382757cf6a4112bd0952c4106e4d8
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-on-surface">Reservist Mode</span>
                                <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-secondary-container transition-colors duration-200 ease-in-out focus:outline-none">
                                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-outline-variant/15">
                                <p className="font-label text-[0.7rem] uppercase text-on-surface-variant mb-4">Functional Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-secondary rounded-full"></div>
                                    <div className="flex-1 h-1.5 bg-secondary rounded-full"></div>
                                    <div className="flex-1 h-1.5 bg-secondary rounded-full"></div>
                                    <div className="flex-1 h-1.5 bg-outline-variant rounded-full"></div>
                                </div>
                                <p className="mt-2 text-xs text-on-surface-variant">75% Service Readiness</p>
                            </div>
                        </div>
                    </div>

                    {/* Specialists On-Duty (Horizontal Cards) */}
                    <div className="md:col-span-5 bg-surface-container-low rounded-xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">medical_services</span>
                                <h2 className="font-headline font-bold text-xl">Specialists On-Duty</h2>
                            </div>
                            <span className="text-xs font-bold text-secondary-container bg-primary px-3 py-1 rounded-full">Live Roster</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {/* Cardiology Card */}
                            <div onClick={() => navigate('/coming-soon')} className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 transition-all hover:translate-x-1 cursor-pointer">
                                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-primary">Cardiology</h3>
                                    <p className="text-sm text-on-surface-variant">Dr. Aris Thorne <span className="mx-2 opacity-30">|</span> 42m remaining</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                            </div>

                            {/* Neurosurgery Card */}
                            <div onClick={() => navigate('/coming-soon')} className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 transition-all hover:translate-x-1 cursor-pointer">
                                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-primary">Neurosurgery</h3>
                                    <p className="text-sm text-on-surface-variant">Dr. Elena Vance <span className="mx-2 opacity-30">|</span> On-call (Remote)</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                            </div>

                            {/* Trauma Card */}
                            <div onClick={() => navigate('/coming-soon')} className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 transition-all hover:translate-x-1 cursor-pointer">
                                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-primary">Trauma</h3>
                                    <p className="text-sm text-on-surface-variant">Unit Delta-4 <span className="mx-2 opacity-30">|</span> Immediate Response</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                            </div>
                        </div>
                    </div>

                    {/* Lower Action Row: Quick Stats & Dispatch Integration */}
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-primary-container p-6 rounded-xl text-white flex flex-col justify-between aspect-video relative overflow-hidden group cursor-pointer" onClick={() => navigate('/coming-soon')}>
                            <div className="z-10">
                                <p className="font-label text-[0.65rem] opacity-70 uppercase tracking-widest">Active ER Wait</p>
                                <h4 className="text-3xl font-headline font-bold">12m</h4>
                            </div>
                            <div className="z-10 flex items-center gap-2 text-secondary-fixed">
                                <span className="material-symbols-outlined text-sm">trending_down</span>
                                <span className="text-xs font-semibold">4% from last hour</span>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110">
                                <span className="material-symbols-outlined text-8xl">schedule</span>
                            </div>
                        </div>

                        <div className="bg-secondary-container p-6 rounded-xl text-primary flex flex-col justify-between aspect-video relative overflow-hidden group cursor-pointer" onClick={() => navigate('/coming-soon')}>
                            <div className="z-10">
                                <p className="font-label text-[0.65rem] opacity-70 uppercase tracking-widest">Blood Supply</p>
                                <h4 className="text-3xl font-headline font-bold">O- Critical</h4>
                            </div>
                            <div className="z-10 flex items-center gap-2 text-error">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                <span className="text-xs font-semibold">Restock requested</span>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110">
                                <span className="material-symbols-outlined text-8xl">bloodtype</span>
                            </div>
                        </div>

                        <div className="bg-surface-container-highest p-6 rounded-xl text-primary flex flex-col justify-between aspect-video relative overflow-hidden group cursor-pointer" onClick={() => navigate('/coming-soon')}>
                            <div className="z-10">
                                <p className="font-label text-[0.65rem] opacity-70 uppercase tracking-widest">Ambulance Inbound</p>
                                <h4 className="text-3xl font-headline font-bold">04</h4>
                            </div>
                            <div className="z-10 flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined text-sm">info</span>
                                <span className="text-xs font-semibold">2 ETA &lt; 5 mins</span>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110">
                                <span className="material-symbols-outlined text-8xl">airport_shuttle</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Insight Panel */}
                    <div className="md:col-span-4 bg-gradient-to-br from-primary to-primary-container rounded-xl p-8 text-on-primary shadow-2xl relative">
                        <div className="absolute top-4 right-4 bg-secondary-fixed/20 text-secondary-fixed px-3 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-widest border border-secondary-fixed/30">
                            AI Diagnostic
                        </div>
                        <h3 className="font-headline font-bold text-xl mb-6">Patient Load Forecast</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-secondary-fixed mt-1">insights</span>
                                <div>
                                    <p className="text-sm leading-relaxed opacity-90">Expected +15% increase in respiratory cases within next 3 hours based on regional weather patterns.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-md">
                                <p className="text-[0.65rem] uppercase opacity-50 mb-2">Recommended Action</p>
                                <p className="text-sm font-semibold text-secondary-fixed">Authorize Prep-Bay 4 activation and alert respiratory therapists.</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/coming-soon')} className="w-full mt-8 py-3 bg-secondary-fixed text-on-secondary-fixed rounded-xl font-bold font-headline transition-all hover:brightness-110 cursor-pointer">Execute Recommendation</button>
                    </div>
                </div>

                {/* System Logs / Activity Feed */}
                <div className="mt-12">
                    <h2 className="font-headline font-bold text-2xl mb-6 text-primary">Operational Timeline</h2>
                    <div className="bg-surface-container-low rounded-2xl p-2">
                        <div className="flex flex-col">
                            <div onClick={() => navigate('/coming-soon')} className="flex items-center justify-between p-6 hover:bg-surface-container-lowest rounded-xl transition-colors cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <span className="text-xs font-label text-on-surface-variant w-16">14:22:10</span>
                                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                    <div>
                                        <p className="font-bold text-primary">Bed Assignment Confirmed</p>
                                        <p className="text-sm text-on-surface-variant">Patient #8293 assigned to ICU-04</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                            </div>

                            <div onClick={() => navigate('/coming-soon')} className="flex items-center justify-between p-6 hover:bg-surface-container-lowest rounded-xl transition-colors cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <span className="text-xs font-label text-on-surface-variant w-16">14:18:45</span>
                                    <div className="w-2 h-2 rounded-full bg-error"></div>
                                    <div>
                                        <p className="font-bold text-primary">Ventilator Fault Detected</p>
                                        <p className="text-sm text-on-surface-variant">Unit V-109 reporting low pressure. Maintenance alerted.</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                            </div>

                            <div onClick={() => navigate('/coming-soon')} className="flex items-center justify-between p-6 hover:bg-surface-container-lowest rounded-xl transition-colors cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <span className="text-xs font-label text-on-surface-variant w-16">14:05:33</span>
                                    <div className="w-2 h-2 rounded-full bg-primary-fixed-dim"></div>
                                    <div>
                                        <p className="font-bold text-primary">Staff Rotation Complete</p>
                                        <p className="text-sm text-on-surface-variant">Nursing shift Beta-3 has relieved Alpha-9</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* SideNavBar (Mobile Trigger/Hidden Web as per layout) */}
            <aside className="hidden md:flex h-screen w-20 fixed left-0 top-0 z-40 bg-[#f7f9fb] dark:bg-[#031632] flex-col items-center py-8 space-y-8 border-r border-outline-variant/15">
                <div onClick={() => navigate('/select')} className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-6 cursor-pointer hover:shadow-lg">
                    <span className="material-symbols-outlined">clinical_notes</span>
                </div>
                <nav className="flex flex-col gap-6">
                    <button onClick={() => navigate('/mass-casualty')} className="p-3 bg-[#1A2B48] text-white rounded-xl shadow-lg transition-all duration-300">
                        <span className="material-symbols-outlined">emergency</span>
                    </button>
                    <button onClick={() => navigate('/coming-soon')} className="p-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl transition-all duration-300">
                        <span className="material-symbols-outlined">monitor_heart</span>
                    </button>
                    <button onClick={() => navigate('/coming-soon')} className="p-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl transition-all duration-300">
                        <span className="material-symbols-outlined">medical_services</span>
                    </button>
                    <button onClick={() => navigate('/coming-soon')} className="p-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl transition-all duration-300">
                        <span className="material-symbols-outlined">history</span>
                    </button>
                </nav>
                <div className="mt-auto flex flex-col gap-6">
                    <button onClick={() => navigate('/coming-soon')} className="p-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl transition-all duration-300">
                        <span className="material-symbols-outlined">help</span>
                    </button>
                    <button onClick={() => navigate('/select')} className="p-3 text-[#1A2B48]/60 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl transition-all duration-300 text-error">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </aside>

            <footer className="md:ml-20 px-8 py-8 text-on-surface-variant text-sm border-t border-outline-variant/15 flex flex-col md:flex-row justify-between gap-4">
                <p>© 2024 SENTINEL AI Clinical Systems. All Rights Reserved.</p>
                <div className="flex gap-6">
                    <span onClick={() => navigate('/coming-soon')} className="hover:text-primary transition-colors cursor-pointer">Privacy Protocol</span>
                    <span onClick={() => navigate('/coming-soon')} className="hover:text-primary transition-colors cursor-pointer">Audit Trail</span>
                    <span onClick={() => navigate('/coming-soon')} className="hover:text-primary transition-colors cursor-pointer">Node Status</span>
                </div>
            </footer>
        </div>
    );
};

export default HospitalAdmin;
