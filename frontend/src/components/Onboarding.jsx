import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Building2, BookOpen, ChevronRight, UploadCloud, X, ShieldAlert, CheckCircle2, ChevronLeft, Camera } from 'lucide-react';
import { ROLE_OPTIONS, SPECIFIC_COMPANIES, ALL_ROLES, ALL_COMPANIES } from '../utils/constants';
import SearchableSelect from './SearchableSelect';

export default function Onboarding({ userId, onStart }) {
  const [step, setStep] = useState(1);
  const [companyTargetType, setCompanyTargetType] = useState('type'); // 'type' | 'particular'
  const [formData, setFormData] = useState({
    field: 'Engineering / Tech',
    role: 'Software Development Engineer (SDE)',
    experience_level: '0-2 years (Fresher/Junior)',
    company_type: 'Product Company (Startups / MNCs)',
    specific_company: 'Google',
    interview_language: 'English'
  });
  
  const [isGauntlet, setIsGauntlet] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFieldChange = (e) => {
    const newField = e.target.value;
    setFormData({
      ...formData,
      field: newField,
      role: ROLE_OPTIONS[newField][0],
      specific_company: SPECIFIC_COMPANIES[newField][0]
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentGiven) {
      alert("Please provide consent for camera and audio to start the proctored interview.");
      return;
    }
    
    setLoading(true);
    const submitData = new FormData();
    submitData.append("role", formData.role);
    submitData.append("field", formData.field);
    submitData.append("experience_level", formData.experience_level);
    submitData.append("interview_language", formData.interview_language);
    submitData.append("is_gauntlet", isGauntlet);
    
    const finalCompanyType = companyTargetType === 'particular'  
      ? `Specific Company: ${formData.specific_company}` 
      : formData.company_type;
    submitData.append("company_type", finalCompanyType);

    if (userId) {
      submitData.append("user_id", userId);
    }
    if (resumeFile) {
      submitData.append("resume", resumeFile);
    }

    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        body: submitData
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Failed to start session");
      }
      
      if (data.session_id) {
        onStart(data.session_id);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to start session. Ensure backend is running.');
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 w-full z-10 relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg text-slate-100 relative overflow-hidden"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 drop-shadow-sm">
            Interview Setup
          </h1>
          <div className="flex items-center justify-center gap-3 text-slate-400 text-sm font-medium">
             <span className={step === 1 ? 'text-indigo-400' : ''}>1. Profile</span>
             <ChevronRight size={14} className="opacity-50" />
             <span className={step === 2 ? 'text-indigo-400' : ''}>2. Context</span>
             <ChevronRight size={14} className="opacity-50" />
             <span className={step === 3 ? 'text-indigo-400' : ''}>3. Rules</span>
          </div>
        </div>
        
        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }} className="space-y-6">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* FIELD */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-400" /> Industry Field
                  </label>
                  <select 
                    value={formData.field}
                    onChange={handleFieldChange}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  >
                    {Object.keys(ROLE_OPTIONS).map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>

                {/* TARGET ROLE */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2">
                    <User size={16} className="text-blue-400" /> Target Role
                  </label>
                  <SearchableSelect 
                    options={ROLE_OPTIONS[formData.field] || ALL_ROLES}
                    value={formData.role}
                    onChange={(val) => setFormData({...formData, role: val})}
                    placeholder="e.g. Software Development Engineer"
                  />
                </div>

                {/* EXPERIENCE */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Briefcase size={16} className="text-emerald-400" /> Experience Level
                  </label>
                  <select 
                    value={formData.experience_level}
                    onChange={e => setFormData({...formData, experience_level: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  >
                    <option>0-2 years (Fresher/Junior)</option>
                    <option>3-5 years (Mid-Level)</option>
                    <option>5+ years (Senior)</option>
                  </select>
                </div>

                {/* TARGET COMPANY CONFIGURATION */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Building2 size={16} className="text-purple-400" /> Target Employer
                  </label>
                  
                  {/* Radio Toggle */}
                  <div className="flex gap-4 p-1 bg-slate-950/50 rounded-xl border border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => setCompanyTargetType('type')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${companyTargetType === 'type' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      General Type
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompanyTargetType('particular')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${companyTargetType === 'particular' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Particular Company
                    </button>
                  </div>

                  {/* Dropdowns */}
                  <div className="relative">
                    <AnimatePresence mode="popLayout">
                      {companyTargetType === 'type' ? (
                        <motion.select 
                          key="type"
                          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
                          value={formData.company_type}
                          onChange={e => setFormData({...formData, company_type: e.target.value})}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:border-slate-600 appearance-none cursor-pointer"
                        >
                          <option>Product Company (Startups / MNCs)</option>
                          <option>Service Company (TCS, Infosys, Wipro)</option>
                          <option>Government / PSU (SBI, UPSC, SSC)</option>
                          <option>Consulting Firm (Big 4, MBB)</option>
                        </motion.select>
                      ) : (
                        <motion.div
                          key="particular"
                          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
                        >
                          <SearchableSelect 
                            options={SPECIFIC_COMPANIES[formData.field] || ALL_COMPANIES}
                            value={formData.specific_company}
                            onChange={(val) => setFormData({...formData, specific_company: val})}
                            placeholder="e.g. Google"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Next Step <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <button type="button" onClick={() => setStep(1)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold text-slate-200">Interview Context</h2>
                </div>

                {/* INTERVIEW LANGUAGE */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <span className="text-amber-400 text-lg font-serif italic">A/अ</span> Interview Language
                  </label>
                  <select 
                    value={formData.interview_language}
                    onChange={e => setFormData({...formData, interview_language: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3.5 text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Hinglish">Hinglish (Hindi + English)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                  </select>
                </div>

                {/* RESUME UPLOAD */}
                <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-2"><UploadCloud size={16} className="text-rose-400" /> Upload Resume (PDF)</span>
                    <span className="text-xs text-slate-500 font-normal">Optional</span>
                  </label>
                  <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  {!resumeFile ? (
                     <div 
                       onClick={() => fileInputRef.current.click()}
                       className="w-full border-2 border-dashed border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800/30 transition-all text-slate-400 hover:text-indigo-400"
                     >
                       <UploadCloud size={24} className="mb-2" />
                       <span className="text-sm font-medium">Click to upload CV (PDF)</span>
                       <span className="text-xs text-slate-500 mt-1">AI will personalize questions based on projects</span>
                     </div>
                  ) : (
                     <div className="w-full bg-slate-800/50 border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between">
                       <div className="flex items-center gap-3 overflow-hidden">
                         <div className="bg-rose-500/20 text-rose-400 p-2 rounded-lg"><BookOpen size={16}/></div>
                         <span className="text-sm font-medium text-slate-200 truncate">{resumeFile.name}</span>
                       </div>
                       <button type="button" onClick={() => setResumeFile(null)} className="p-1 hover:bg-slate-700 rounded-md text-slate-400 transition-colors">
                         <X size={16} />
                       </button>
                     </div>
                  )}
                </div>

                {/* GAUNTLET MODE TOGGLE */}
                <div className="bg-gradient-to-r from-red-950/50 to-orange-950/50 border border-red-900/50 rounded-xl p-4 mt-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="text-rose-400 font-bold flex items-center gap-2 mb-1">
                         🔥 Intensive Multi-Round Mode
                       </h3>
                       <p className="text-xs text-slate-400">Enable a grueling 3-round interview specifically tailored to your department.</p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={isGauntlet} onChange={(e) => setIsGauntlet(e.target.checked)} />
                       <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                     </label>
                   </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setStep(3)}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Next Step <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <button type="button" onClick={() => setStep(2)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold text-slate-200">Interview Rules</h2>
                </div>

                {/* PROCTORING RULES & CONSENT */}
                <div className="bg-slate-950/60 border border-emerald-900/50 rounded-xl p-4 mt-6">
                   <h3 className="text-emerald-400 font-semibold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                     <ShieldAlert size={16} /> Proctored AI Interview Rules
                   </h3>
                   <ul className="text-xs text-slate-400 space-y-2 mb-4 list-disc pl-4">
                     <li>You must grant <b>Microphone & Camera</b> permissions.</li>
                     <li><b>Eye Tracking is active.</b> Do not look off-screen frequently.</li>
                     <li><b>Object Detection is active.</b> Cell phones, tablets, or secondary devices will trigger a warning.</li>
                     <li>Ensure you are in a quiet room with no other people.</li>
                   </ul>
                   <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-900/80 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                     <input 
                        type="checkbox" 
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900" 
                     />
                     <span className="text-sm font-medium text-slate-300 leading-tight">
                       I agree to the rules and consent to browser-based video/audio processing. (No video is saved).
                     </span>
                   </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !consentGiven}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-6 rounded-xl shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Initializing Proctored Session...' : 'Start Interview Now'} 
                  {!loading && <Camera size={20} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
