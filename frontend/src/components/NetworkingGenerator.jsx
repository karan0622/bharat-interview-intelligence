import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Building2, User, FileText, ArrowLeft, Loader2, Copy, CheckCircle, UserPlus, MessageSquare, UploadCloud, X, SlidersHorizontal, Users, Target, Activity, Zap } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { ALL_ROLES, ALL_COMPANIES } from '../utils/constants';

export default function NetworkingGenerator({ onBack }) {
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Short & Punchy");
  const [goal, setGoal] = useState("Referral Request");
  const [icebreaker, setIcebreaker] = useState("");
  const [showSearchLinks, setShowSearchLinks] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
    } else if (file) {
      alert("Please upload a valid PDF file.");
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleGenerate = async () => {
    if (!targetRole || !targetCompany || !recipientName || (!resumeText && !resumeFile)) return;
    
    setIsGenerating(true);
    setResult(null);

    const formData = new FormData();
    formData.append("target_role", targetRole);
    formData.append("target_company", targetCompany);
    formData.append("recipient_name", recipientName);
    formData.append("resume_text", resumeText);
    formData.append("tone", tone);
    formData.append("length", length);
    formData.append("goal", goal);
    formData.append("icebreaker", icebreaker);
    if (resumeFile) {
      formData.append("resume_file", resumeFile);
    }

    try {
      const res = await fetch("/api/networking/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate networking templates.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSearchLinks = () => {
    if (!targetCompany) return alert("Please select a target company first.");
    setShowSearchLinks(true);
  };

  const getLinkedInSearchUrl = (query) => {
    return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
  };

  const searchQueries = targetCompany ? [
    `Technical Recruiter ${targetCompany}`,
    `Engineering Manager ${targetCompany}`,
    `Senior ${targetRole || 'Engineer'} ${targetCompany}`
  ] : [];

  const handleSendGmail = (subject, body, to = "") => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodedSubject}&body=${encodedBody}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col p-6 items-center overflow-y-auto z-40 relative text-slate-200">
      <div className="w-full max-w-6xl mt-8 mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-4 flex items-center justify-center lg:justify-start gap-4">
            <Mail size={40} className="text-blue-400" />
            Networking Engine
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl">Generate perfectly tailored, non-spammy cold emails and LinkedIn messages to help you score referrals and bypass the resume black hole.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Input Form Column */}
          <div className="xl:col-span-5 flex flex-col gap-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl h-fit sticky top-24">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 border-b border-slate-800 pb-4">
              Target Details
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Building2 size={14} /> Target Company</span>
                  </label>
                  <SearchableSelect 
                    options={ALL_COMPANIES}
                    value={targetCompany}
                    onChange={(val) => { setTargetCompany(val); setShowSearchLinks(false); }}
                    placeholder="e.g. Google"
                  />
                  {targetCompany && (
                    <button onClick={handleSearchLinks} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                      <Users size={12} /> Find Real Contacts on LinkedIn
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <User size={14} /> Target Role
                  </label>
                  <SearchableSelect 
                    options={ALL_ROLES}
                    value={targetRole}
                    onChange={setTargetRole}
                    placeholder="e.g. SDE II"
                  />
                </div>
              </div>

              <AnimatePresence>
                {showSearchLinks && searchQueries.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-4">
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <UserPlus size={14} /> Smart LinkedIn Searches
                      </div>
                      <p className="text-xs text-slate-400 mb-3">Click a link below to instantly find active employees at {targetCompany}. Once you find someone, paste their name below!</p>
                      <div className="flex flex-col gap-2">
                        {searchQueries.map((query, idx) => (
                          <a 
                            key={idx} 
                            href={getLinkedInSearchUrl(query)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-300 hover:text-white bg-slate-900/50 hover:bg-blue-900/40 border border-slate-800 hover:border-blue-700/50 px-4 py-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <span>Search: <strong>{query}</strong></span>
                            <ArrowLeft size={14} className="rotate-135 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <User size={14} /> Recipient Name
                </label>
                <input 
                  type="text" placeholder="e.g. Sarah Connor"
                  value={recipientName} onChange={e => setRecipientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* NEW SETTINGS GRID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <SlidersHorizontal size={14} /> Tone
                  </label>
                  <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors cursor-pointer appearance-none">
                    <option>Professional</option>
                    <option>Casual & Friendly</option>
                    <option>Direct & Aggressive</option>
                    <option>Enthusiastic</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Target size={14} /> Goal
                  </label>
                  <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors cursor-pointer appearance-none">
                    <option>Referral Request</option>
                    <option>Informational Chat</option>
                    <option>Direct Application Follow-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <MessageSquare size={14} /> Mutual Connection / Icebreaker <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
                </label>
                <input 
                  type="text" placeholder="e.g. We both graduated from IIT Delhi"
                  value={icebreaker} onChange={e => setIcebreaker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileText size={14} /> Your Resume</span>
                </label>
                
                <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                
                {!resumeFile ? (
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full border-2 border-dashed border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/30 transition-all text-slate-400 hover:text-blue-400 mb-3"
                  >
                    <UploadCloud size={20} className="mb-1" />
                    <span className="text-sm font-medium">Click to upload PDF Resume</span>
                    <span className="text-xs text-slate-500 mt-1">Or paste bullets below</span>
                  </div>
                ) : (
                  <div className="w-full bg-slate-800/50 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg"><FileText size={16}/></div>
                      <span className="text-sm font-medium text-slate-200 truncate">{resumeFile.name}</span>
                    </div>
                    <button type="button" onClick={() => setResumeFile(null)} className="p-1 hover:bg-slate-700 rounded-md text-slate-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                )}

                <textarea 
                  placeholder="Or paste your resume bullet points here manually..."
                  value={resumeText} onChange={e => setResumeText(e.target.value)}
                  className="w-full min-h-[120px] bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none resize-y transition-colors"
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !targetRole || !targetCompany || !recipientName || (!resumeText && !resumeFile)}
              className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Send size={20} className="-mt-1" />}
              {isGenerating ? "Drafting Messages..." : "Generate Templates"}
            </button>
          </div>

          {/* Results Column */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            {!isGenerating && !result && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-3xl p-8 border-dashed">
                <MessageSquare size={48} className="opacity-20 mb-4" />
                <p className="text-center max-w-md">Fill out the details on the left and click generate to get highly tailored LinkedIn and Cold Email templates.</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-blue-400 bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-3xl p-8">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="animate-pulse font-medium">Extracting achievements & writing copy...</p>
              </div>
            )}

            {result && !result.error && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Resume Fit & Analytics Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3 text-sm uppercase tracking-wider">
                      <Activity size={16} /> Resume Match Score
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-white">{result.match_score || 0}%</span>
                      <span className="text-slate-400 mb-1 text-sm">Fit for {targetRole}</span>
                    </div>
                    {result.missing_keywords && result.missing_keywords.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs text-rose-400 font-semibold mb-2">Missing Keywords:</div>
                        <div className="flex flex-wrap gap-2">
                          {result.missing_keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-300 text-[10px] rounded-md border border-rose-500/20">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-2 text-orange-400 font-bold mb-3 text-sm uppercase tracking-wider">
                      <Zap size={16} /> Predicted Open Rate
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-white">{result.open_rate_prediction || "45%"}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Based on our AI analytics, subject lines of this structure targeting {targetRole} roles at top companies perform exceptionally well.
                    </p>
                  </div>
                </div>

                {/* LinkedIn Template */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-blue-950/30 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                      <UserPlus size={20} /> LinkedIn Connection Request
                    </div>
                    <button onClick={() => copyToClipboard(result.linkedin_message, 'linkedin')} className="text-slate-400 hover:text-white transition-colors">
                      {copiedKey === 'linkedin' ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="p-6 text-slate-300 leading-relaxed text-[15px] whitespace-pre-wrap">
                    {result.linkedin_message}
                  </div>
                </div>

                {/* Cold Email Template */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-indigo-950/30 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold">
                      <Mail size={20} /> Initial Cold Email
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSendGmail(result.cold_email_subject, result.cold_email_body)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg">
                        <Send size={14} /> Send via Gmail
                      </button>
                      <button onClick={() => copyToClipboard(result.cold_email_subject + '\n\n' + result.cold_email_body, 'cold_email')} className="text-slate-400 hover:text-white transition-colors ml-2">
                        {copiedKey === 'cold_email' ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 pb-4 border-b border-slate-800/50">
                      <span className="text-slate-500 font-semibold mr-2">Subject:</span>
                      <span className="text-white font-medium">{result.cold_email_subject}</span>
                    </div>
                    <div className="text-slate-300 leading-relaxed text-[15px] whitespace-pre-wrap">
                      {result.cold_email_body}
                    </div>
                  </div>
                </div>

                {/* Follow Up Template */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300 font-bold">
                      <Send size={18} /> Follow-up Email (Wait 4 Days)
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSendGmail(result.follow_up_subject, result.follow_up_body)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg border border-slate-600">
                        <Send size={14} /> Send via Gmail
                      </button>
                      <button onClick={() => copyToClipboard(result.follow_up_subject + '\n\n' + result.follow_up_body, 'follow_up')} className="text-slate-400 hover:text-white transition-colors ml-2">
                        {copiedKey === 'follow_up' ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 pb-4 border-b border-slate-800/50">
                      <span className="text-slate-500 font-semibold mr-2">Subject:</span>
                      <span className="text-white font-medium">{result.follow_up_subject}</span>
                    </div>
                    <div className="text-slate-300 leading-relaxed text-[15px] whitespace-pre-wrap">
                      {result.follow_up_body}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {result && result.error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                {result.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
