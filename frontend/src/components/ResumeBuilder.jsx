import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Building2, Wand2, ArrowLeft, Loader2, Copy, CheckCircle, UploadCloud, ChevronRight, ChevronLeft, Briefcase, Download } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Netflix", 
  "Microsoft", "Stripe", "Uber", "Airbnb", "Spotify", 
  "Salesforce", "McKinsey", "Goldman Sachs", "JP Morgan"
];

const ROLES = [
  "Software Engineer", "Senior Software Engineer", "Product Manager",
  "Data Scientist", "Frontend Developer", "Backend Engineer",
  "UX Designer", "Machine Learning Engineer", "Engineering Manager",
  "Marketing Manager", "Business Analyst", "Sales Executive"
];

export default function ResumeBuilder({ onBack }) {
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResumeText(data.text);
      } else {
        alert(data.detail || "Failed to parse PDF.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to parser.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRewrite = async () => {
    if (!resumeText.trim() || !targetCompany.trim() || !targetRole.trim()) return;
    
    setStep(3);
    setIsGenerating(true);
    setResult(null);

    const formData = new FormData();
    formData.append("resume_text", resumeText);
    formData.append("target_company", `${targetRole} at ${targetCompany}`);

    try {
      const res = await fetch("/api/resume/rewrite", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to rewrite resume.");
      setStep(2); // Go back on error
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/resume/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: result.tailored_summary,
          bullets: result.rewritten_bullet_points.map(pt => pt.rewritten),
          target: `${targetRole} at ${targetCompany}`
        })
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${targetCompany}_Optimized_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  // Stepper UI Component
  const Stepper = () => (
    <div className="flex items-center justify-center mb-12">
      {[1, 2, 3].map((num, idx) => (
        <React.Fragment key={num}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
            step === num 
              ? "bg-emerald-500 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-110" 
              : step > num
                ? "bg-emerald-900 text-emerald-400 border border-emerald-500/50"
                : "bg-slate-900 text-slate-500 border border-slate-800"
          }`}>
            {step > num ? <CheckCircle size={18} /> : num}
          </div>
          {idx < 2 && (
            <div className={`w-16 md:w-32 h-1 mx-2 rounded-full transition-all duration-500 ${
              step > num + 1 ? "bg-emerald-500" : step > num ? "bg-emerald-900" : "bg-slate-800"
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-6 items-center overflow-y-auto z-40 relative text-slate-200">
      <div className="w-full max-w-4xl mt-12 mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-3 flex items-center justify-center gap-4">
            <Wand2 size={40} className="text-emerald-400" />
            Resume Optimization Studio
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Get an ATS match score and AI-enhanced power bullets tailored to your dream company.</p>
        </div>

        <Stepper />

        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-8 rounded-3xl shadow-xl min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Upload */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="flex flex-col flex-1 gap-6"
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-200">1. Source Material</h2>
                  <p className="text-slate-400">Upload your PDF or paste your current resume text.</p>
                </div>
                
                <div 
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/50 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  {isUploading ? (
                    <Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={48} />
                  ) : (
                    <UploadCloud className="text-slate-500 group-hover:text-emerald-500 mx-auto mb-4 transition-colors" size={48} />
                  )}
                  <p className="text-lg font-bold text-slate-300">{isUploading ? "Parsing your PDF..." : "Click to Upload PDF Resume"}</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                  <div className="relative flex justify-center"><span className="bg-slate-900/50 px-4 text-sm text-slate-500">OR PASTE RAW TEXT</span></div>
                </div>

                <textarea 
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full flex-1 min-h-[200px] bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 focus:border-emerald-500 outline-none resize-none text-sm leading-relaxed"
                ></textarea>

                <div className="flex justify-end mt-auto pt-4">
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!resumeText.trim() && !isUploading}
                    className="py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    Next: Targeting <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Configure */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="flex flex-col flex-1 gap-8"
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-200">2. Define Target</h2>
                  <p className="text-slate-400">Tell us where you are applying so we can tailor the resume to their culture.</p>
                </div>
                
                <div className="flex-1 max-w-xl mx-auto w-full flex flex-col justify-center gap-8">
                  <div className="flex flex-col gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Briefcase size={18} /> Target Role
                      </label>
                      <SearchableSelect 
                        options={ROLES}
                        value={targetRole}
                        onChange={setTargetRole}
                        placeholder="Select or type role..."
                        icon={Briefcase}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Building2 size={18} /> Target Company
                      </label>
                      <SearchableSelect 
                        options={COMPANIES}
                        value={targetCompany}
                        onChange={setTargetCompany}
                        placeholder="Select or type company..."
                        icon={Building2}
                      />
                    </div>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-2xl p-6">
                    <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-4">
                      <Wand2 size={20}/> AI Pro Engine Features
                    </h3>
                    <ul className="text-slate-300 space-y-3">
                      <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500"/> Calculates deterministic ATS Match Score</li>
                      <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500"/> Replaces weak verbs with high-impact power verbs</li>
                      <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500"/> Injects missing metrics and impact frameworks</li>
                      <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500"/> Tailors tone specifically to the target company</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between mt-auto pt-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all flex items-center gap-2"
                  >
                    <ChevronLeft size={20} /> Back
                  </button>
                  <button 
                    onClick={handleRewrite}
                    disabled={!targetCompany.trim() || !targetRole.trim()}
                    className="py-3 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    Analyze & Rewrite <Wand2 size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Results */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col flex-1"
              >
                {isGenerating && (
                  <div className="flex-1 flex flex-col items-center justify-center text-emerald-500 h-[400px]">
                    <Loader2 className="animate-spin mb-6" size={64} />
                    <p className="animate-pulse font-bold text-xl mb-2">Optimizing your resume...</p>
                    <p className="text-slate-400 text-sm">Running ATS match algorithms and injecting power verbs.</p>
                  </div>
                )}

                {result && !result.error && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <h2 className="text-2xl font-bold text-slate-200">3. ATS Results</h2>
                      <div className="flex gap-4">
                        <button 
                          onClick={handleExportPDF}
                          disabled={isExporting}
                          className="text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                        >
                          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          Export PDF
                        </button>
                        <button onClick={() => setStep(2)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 px-2">
                          <ArrowLeft size={16}/> Re-target
                        </button>
                      </div>
                    </div>

                    {/* Score Box */}
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-950 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                      
                      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <motion.path 
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${result.ats_score}, 100` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={result.ats_score > 75 ? "text-emerald-500" : result.ats_score > 50 ? "text-yellow-500" : "text-rose-500"}
                            strokeWidth="3" strokeDasharray={`${result.ats_score}, 100`} stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          />
                        </svg>
                        <div className="absolute text-4xl font-black text-white">{result.ats_score}</div>
                      </div>
                      
                      <div className="flex-1 text-center md:text-left z-10">
                        <h3 className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-2">ATS Match Score</h3>
                        <p className="text-slate-300 text-lg leading-relaxed">{result.ats_analysis}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-emerald-500 mb-3">Tailored Professional Summary</h3>
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-slate-200 leading-relaxed text-lg shadow-inner">
                        {result.tailored_summary}
                      </div>
                    </div>

                    {/* Bullets */}
                    <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-emerald-500 mb-4">Power Bullet Points</h3>
                      <div className="grid grid-cols-1 gap-6">
                        {result.rewritten_bullet_points?.map((pt, idx) => (
                          <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group shadow-md hover:border-emerald-900/50 transition-colors">
                            <div className="p-6 bg-gradient-to-br from-emerald-950/20 to-slate-950">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Optimized for {targetCompany}</p>
                                <button 
                                  onClick={() => copyToClipboard(pt.rewritten, idx)}
                                  className="text-slate-400 hover:text-emerald-400 transition-colors p-2 bg-slate-900 rounded-lg"
                                  title="Copy to clipboard"
                                >
                                  {copiedIndex === idx ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                </button>
                              </div>
                              <p className="text-lg text-white font-medium mb-4 leading-relaxed">{pt.rewritten}</p>
                              
                              <div className="border-t border-slate-800/50 pt-4 mt-2">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Original</p>
                                <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-slate-400 line-through decoration-rose-500/50 mb-3">
                                  {pt.original}
                                </div>
                                <p className="text-sm text-slate-300 flex items-start gap-2 bg-emerald-900/10 p-3 rounded-lg border border-emerald-900/20">
                                  <span className="text-emerald-500 font-bold shrink-0">Why:</span> {pt.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {result && result.error && (
                  <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-center flex flex-col items-center mt-12">
                    <p className="mb-4 font-bold text-lg">{result.error}</p>
                    <button onClick={() => setStep(2)} className="py-2 px-6 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Try Again</button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
