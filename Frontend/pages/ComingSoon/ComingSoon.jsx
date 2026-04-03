import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <div className="max-w-md w-full flex flex-col items-center text-center">
        <div className="mb-8">
          <div className="w-16 h-16 premium-gradient rounded-xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <span className="material-symbols-outlined text-on-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-4">Coming Soon</h1>
          <p className="text-on-surface-variant text-lg">
            This module is currently under development. Sentinel AI engineers are working on deploying this functionality.
          </p>
        </div>
        
        <button 
          onClick={() => navigate(-1)}
          className="group relative flex flex-col items-center justify-center text-center p-6 rounded-[2rem] bg-surface-container-lowest transition-all duration-300 hover:shadow-[0_40px_60px_-15px_rgba(26,43,72,0.08)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-secondary/20 w-full"
        >
          <div className="flex items-center text-secondary font-semibold text-sm group-hover:gap-2 transition-all">
            <span className="material-symbols-outlined mr-2 text-base">arrow_back</span> Return to Previous Interface
          </div>
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
