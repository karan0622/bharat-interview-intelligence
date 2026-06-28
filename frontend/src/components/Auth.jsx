import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, UserPlus, LogIn, X, Mail, Phone, KeyRound, Sparkles, BrainCircuit } from 'lucide-react';

const AVATARS = [
  "👩‍💻", "👨‍💻", "🦸‍♀️", "🦸‍♂️", "🥷", "🧙‍♀️", "🧙‍♂️", "👩‍🚀", "👨‍🚀", "🕵️‍♀️", "🕵️‍♂️"
];

export default function Auth({ onLogin, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [authStep, setAuthStep] = useState('details'); // 'details' | 'otp'
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (isLogin) {
      handleFinalSubmit();
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_no: contactNo })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
      } else {
        setAuthStep('otp');
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp !== "123456") {
      setError("Invalid OTP. For testing, use 123456.");
      return;
    }
    handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    const payload = isLogin 
      ? { email, password } 
      : { name, email, contact_no: contactNo, password, profile_icon: selectedAvatar };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
      } else {
        onLogin(data);
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full max-w-6xl max-h-[90vh] glass-panel rounded-none sm:rounded-3xl shadow-[0_0_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col md:flex-row"
      >
        <button 
          onClick={onBack}
          className="absolute top-4 right-4 z-20 bg-slate-800/50 hover:bg-slate-700/80 text-slate-400 hover:text-white p-2 rounded-full transition-colors backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        {/* Left Visual Panel */}
        <div className="hidden md:flex md:w-1/2 relative bg-slate-950 overflow-hidden items-end p-12">
          {/* AI Generated Abstract Background */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-screen transition-opacity duration-1000"
            style={{ backgroundImage: 'url("/auth-bg.png")' }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/80 to-transparent" />

          {/* Content */}
          <div className="relative z-10 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-md">
                <Sparkles size={16} /> Welcome to the future
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                Master your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
                  interview skills
                </span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                Experience hyper-realistic, AI-driven mock interviews tailored to your exact role, company, and resume. Get hired faster.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-slate-900/90 backdrop-blur-xl relative z-10 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6 text-white">
                <BrainCircuit size={28} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                {isLogin ? "Welcome back" : (authStep === 'otp' ? "Verify identity" : "Create an account")}
              </h2>
              <p className="text-slate-400 text-sm">
                {isLogin ? "Enter your details to access your dashboard" : (authStep === 'otp' ? `We sent a code to ${contactNo}` : "Start your journey with Bharat Interview")}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {authStep === 'details' && (
                <motion.form 
                  key="details"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSendOTP} 
                  className="space-y-5"
                >
                  {!isLogin && (
                    <>
                      <div className="space-y-3 mb-6">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Avatar</label>
                        <div className="grid grid-cols-6 gap-2">
                          {AVATARS.map(avatar => (
                            <button
                              key={avatar} type="button" onClick={() => setSelectedAvatar(avatar)}
                              className={`text-2xl p-2 rounded-xl transition-all duration-300 ${selectedAvatar === avatar ? 'bg-indigo-500/20 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] scale-110' : 'bg-slate-950/50 border-transparent hover:bg-slate-800 hover:scale-105'} border`}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Full Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-500"><User size={18} /></div>
                          <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl pl-11 pr-4 py-3 focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600" placeholder="e.g. Karan Singh" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-500"><Mail size={18} /></div>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl pl-11 pr-4 py-3 focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600" placeholder="you@example.com" />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">Mobile Number</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-500"><Phone size={18} /></div>
                        <input type="tel" required value={contactNo} onChange={e => setContactNo(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl pl-11 pr-4 py-3 focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600" placeholder="+91 9876543210" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-500"><Lock size={18} /></div>
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl pl-11 pr-4 py-3 focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600" placeholder="••••••••" />
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3.5 rounded-xl flex items-center gap-2 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> {error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={loading} className={`w-full py-3.5 mt-6 rounded-xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-2 overflow-hidden relative group ${isLogin ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/25' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25'} disabled:opacity-70 disabled:cursor-not-allowed`}>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          {isLogin ? "Sign In" : "Send Verification Code"}
                          <ArrowRight size={18} />
                        </>
                      )}
                    </span>
                  </button>
                </motion.form>
              )}

              {authStep === 'otp' && !isLogin && (
                <motion.form 
                  key="otp"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleVerifyOTP} 
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <label className="text-sm font-medium text-slate-300">Enter 6-digit OTP</label>
                    <div className="relative max-w-[240px] mx-auto group">
                      <input type="text" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-slate-950/50 border-2 border-slate-700/50 text-slate-100 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-700" placeholder="------" />
                    </div>
                    <p className="text-xs text-slate-500 mt-3 bg-slate-800/50 inline-block px-3 py-1 rounded-full">For testing, use: <b className="text-emerald-400">123456</b></p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3.5 rounded-xl flex items-center justify-center gap-2 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> {error}
                    </motion.div>
                  )}

                  <div className="space-y-3 pt-4">
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25 disabled:opacity-70 group overflow-hidden relative">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                      <span className="relative z-10 flex items-center gap-2">
                        {loading ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verifying...</>
                        ) : "Verify & Create Account"}
                      </span>
                    </button>
                    <button type="button" onClick={() => setAuthStep('details')} className="w-full py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
                      Go back to details
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {authStep === 'details' && (
              <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                <p className="text-slate-400 text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button 
                    onClick={() => { setIsLogin(!isLogin); setError(""); }}
                    className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold hover:from-indigo-300 hover:to-purple-300 transition-all focus:outline-none"
                  >
                    {isLogin ? "Create one now" : "Sign in instead"}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
