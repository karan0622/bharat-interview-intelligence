import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, BrainCircuit, Mic, LineChart, Target } from 'lucide-react';

export default function Home({ onStartInterview }) {
  const [typedText, setTypedText] = useState("");
  const fullText = "Interview Intelligence";
  
  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 120); // 120ms per character

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-transparent">
      
      {/* --- BACKGROUNDS --- */}
      {/* 0. AI Cinematic Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/landing-bg.png")' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/80 to-transparent" />
      
      {/* 1. Subtle Animated Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-grid-pattern animate-grid-pan"
        style={{
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 10%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 10%, transparent 100%)',
        }}
      ></div>

      {/* --- FLOATING UI BADGES --- */}
      <div className="absolute inset-0 z-10 pointer-events-none max-w-7xl mx-auto hidden lg:block">
        <motion.div 
          animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[25%] left-[10%] glass-panel rounded-2xl p-4 shadow-2xl flex items-center gap-4"
        >
          <div className="bg-indigo-500/20 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/30"><BrainCircuit size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Powered by</p>
            <p className="text-sm text-slate-200 font-bold">Generative AI</p>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[30%] left-[15%] glass-panel rounded-2xl p-4 shadow-2xl flex items-center gap-4"
        >
          <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/30"><LineChart size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Real-time</p>
            <p className="text-sm text-slate-200 font-bold">Analytics</p>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[35%] right-[12%] glass-panel rounded-2xl p-4 shadow-2xl flex items-center gap-4"
        >
          <div className="bg-rose-500/20 p-2.5 rounded-xl text-rose-400 border border-rose-500/30"><Target size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Custom tailored</p>
            <p className="text-sm text-slate-200 font-bold">Role Specific</p>
          </div>
        </motion.div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center z-20 max-w-4xl w-full"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-bold tracking-widest uppercase shadow-lg backdrop-blur-md"
        >
          <Sparkles size={16} /> Next-Generation Platform
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold text-white mb-8 tracking-tight leading-[1.1] min-h-[160px] md:min-h-[200px]">
          Bharat <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 drop-shadow-sm">
            {typedText}
          </span>
          <span className="animate-ping inline-block w-1.5 h-12 md:h-20 ml-2 bg-emerald-400 align-middle rounded-full opacity-75"></span>
        </h1>
        
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
        >
          Experience hyper-realistic, proctored mock interviews tailored exclusively to your resume and target industry.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <button 
            onClick={onStartInterview}
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 font-bold text-white transition-all duration-300 glass-panel hover:bg-slate-800 rounded-2xl border-slate-700/50 hover:border-indigo-500/50 shadow-2xl overflow-hidden w-full sm:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-emerald-600/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            
            <div className="bg-gradient-to-br from-indigo-500 to-emerald-500 p-2.5 rounded-full shadow-lg group-hover:scale-110 transition-transform">
              <Play size={18} className="fill-white translate-x-0.5" />
            </div>
            <span className="text-lg relative z-10 tracking-wide">Start Your Journey</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
