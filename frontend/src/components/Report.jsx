import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCcw, Award, TrendingUp, CheckCircle, Target, AlertTriangle, Code2, Mic, Download, MailCheck, Share2 } from 'lucide-react';

export default function Report({ sessionId }) {
  const [report, setReport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/report`);
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReport();
  }, [sessionId]);

  if (!report) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4 text-indigo-400">
          <Loader2 className="animate-spin" size={48} />
          <p className="text-slate-300 animate-pulse text-lg tracking-wide">AI is synthesizing your final report...</p>
        </div>
      </div>
    );
  }

  const getReadinessColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const handleDownloadAndEmail = async () => {
    setIsExporting(true);
    try {
      // 1. Ask backend to generate PDF and send email
      const res = await fetch(`/api/session/${sessionId}/send-report`, {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send email");
      }
      
      alert(data.message + "\\n\\nYour browser will now open the Save as PDF dialog so you can also save the web version locally.");
      
      // 2. Trigger native high-quality PDF print dialog for the web version
      setTimeout(() => {
        window.print();
      }, 500);

    } catch (err) {
      console.error("Export Error:", err);
      alert(`Export Failed: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] text-white p-6 pb-32 font-sans">
      <div ref={reportRef} className="max-w-5xl mx-auto mt-8 space-y-8 bg-slate-950/50 p-8 rounded-3xl">
        
        <div className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 tracking-tight">
              Interview Evaluation Report
            </h1>
            <p className="text-slate-400 mt-2 text-lg font-medium">
              {report.role} • {report.field}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                const url = `${window.location.origin}/?public=${sessionId}`;
                navigator.clipboard.writeText(url);
                alert("Public Profile URL copied to clipboard! Share it on LinkedIn or with recruiters.");
              }}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold transition-all shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]"
            >
              <Share2 size={18} /> Share Profile
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold transition-all shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]"
            >
              <RefreshCcw size={18} /> New Session
            </button>
          </div>
        </div>

        {/* Certificate of Readiness */}
        {report.overall_readiness_score >= 70 && (
          <div className="relative overflow-hidden border-[4px] border-yellow-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-12 rounded-3xl shadow-[0_0_50px_-10px_rgba(234,179,8,0.2)] flex flex-col items-center text-center">
            {/* Background seal watermark */}
            <Award className="absolute -right-20 -bottom-20 text-yellow-500/5" size={400} />
            
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
              <Award className="text-yellow-400" size={40} />
            </div>
            
            <h2 className="text-xl text-yellow-500 uppercase tracking-[0.3em] font-black mb-2">Certificate of Readiness</h2>
            <h1 className="text-4xl md:text-5xl font-serif italic text-white mb-6">
              {report.user_name || 'Candidate'}
            </h1>
            
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-8">
              Has successfully completed the rigorous AI Interview Evaluation for the role of <span className="text-yellow-400 font-bold">{report.role}</span>. They have demonstrated strong competence, securing an overall readiness score of:
            </p>
            
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-8">
              {report.overall_readiness_score}%
            </div>
            
            <div className="w-full flex justify-between items-end border-t border-slate-800/50 pt-8 mt-4 relative z-10">
              <div className="text-left">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Evaluated By</p>
                <p className="text-slate-300 font-serif italic">Bharat Interview AI</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Date</p>
                <p className="text-slate-300 font-serif italic">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Level Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-xl">
            <h2 className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-sm">Overall Readiness</h2>
            <div className={`text-7xl font-extrabold ${getReadinessColor(report.overall_readiness_score)} drop-shadow-2xl`}>
              {report.overall_readiness_score}
              <span className="text-2xl text-slate-600">/100</span>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-3xl shadow-lg">
              <h3 className="flex items-center gap-2 text-emerald-400 font-bold mb-4 tracking-wide">
                <CheckCircle size={20} /> Key Strengths
              </h3>
              <ul className="space-y-3">
                {report.strengths?.map((str, i) => (
                  <li key={i} className="text-emerald-50/80 text-sm leading-relaxed flex items-start gap-3">
                    <span className="text-emerald-500 mt-1">●</span> {str}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-950/20 border border-rose-900/30 p-6 rounded-3xl shadow-lg">
              <h3 className="flex items-center gap-2 text-rose-400 font-bold mb-4 tracking-wide">
                <Target size={20} /> Areas to Improve
              </h3>
              <ul className="space-y-3">
                {report.areas_to_improve?.map((area, i) => (
                  <li key={i} className="text-rose-50/80 text-sm leading-relaxed flex items-start gap-3">
                    <span className="text-rose-500 mt-1">●</span> {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Confidence & Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-950/20 border border-indigo-900/30 p-6 rounded-3xl shadow-lg">
             <h3 className="flex items-center gap-2 text-indigo-400 font-bold mb-3 tracking-wide">
                <AlertTriangle size={20} /> Delivery & Confidence Note
              </h3>
              <p className="text-indigo-50/80 text-sm leading-relaxed">
                {report.confidence_pattern_note}
              </p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-6 rounded-3xl shadow-lg">
             <h3 className="flex items-center gap-2 text-slate-200 font-bold mb-3 tracking-wide">
                <TrendingUp size={20} className="text-blue-400" /> Actionable Next Steps
              </h3>
              <ul className="space-y-2">
                {report.next_steps?.map((step, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-3">
                    <span className="text-blue-500 font-bold">→</span> {step}
                  </li>
                ))}
              </ul>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-8 pt-8">
          <h2 className="text-2xl font-extrabold border-b border-slate-800 pb-4 text-slate-100">Per-Question Breakdown</h2>
          
          {report.details?.map((detail, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/40 backdrop-blur border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-sm uppercase tracking-widest text-indigo-400 font-bold">Question {idx + 1}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    detail.question_type === 'coding' 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {detail.question_type === 'coding' ? <span className="flex gap-1 items-center"><Code2 size={12}/> Coding</span> : <span className="flex gap-1 items-center"><Mic size={12}/> {detail.question_type}</span>}
                  </span>
                </div>
                <p className="text-xl font-medium text-slate-200 whitespace-pre-wrap">{detail.question}</p>
              </div>
              
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-bold">
                  {detail.question_type === 'coding' ? 'Your Code Submission' : 'Your Spoken Transcript'}
                </p>
                {detail.question_type === 'coding' ? (
                  <pre className="text-emerald-300/90 text-sm leading-relaxed overflow-x-auto p-4 bg-slate-900 rounded-xl font-mono">
                    {detail.transcript}
                  </pre>
                ) : (
                  <p className="text-slate-300 italic text-sm leading-relaxed">"{detail.transcript}"</p>
                )}
                
                <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {detail.question_type !== 'coding' && (
                    <>
                      <span>Pace: <span className="text-slate-200">{detail.stats.pace_wpm} WPM</span></span>
                      <span>Fillers: <span className="text-slate-200">{detail.stats.fillers}</span></span>
                    </>
                  )}
                  <span>Alignment: <span className="text-indigo-300">{detail.scores.confidence_alignment}</span></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-emerald-950/10 border border-emerald-900/20 p-6 rounded-2xl">
                  <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <Award size={18} /> AI Evaluation
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {detail.feedback}
                  </p>
                  
                  {detail.missed_points && detail.missed_points.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-emerald-900/30">
                      <p className="text-xs text-emerald-500 font-bold mb-3 uppercase tracking-wider">Missed Points / Edge Cases:</p>
                      <ul className="space-y-2">
                        {detail.missed_points.map((pt, i) => (
                          <li key={i} className="text-sm text-slate-300 flex gap-2">
                            <span className="text-emerald-500/50">▹</span> {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                   <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
                     <span className="text-slate-400 text-sm font-medium">Content Score</span>
                     <span className="font-extrabold text-2xl text-slate-200">{detail.scores.content}<span className="text-sm text-slate-500">/10</span></span>
                   </div>
                   <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
                     <span className="text-slate-400 text-sm font-medium">Comms Score</span>
                     <span className="font-extrabold text-2xl text-slate-200">{detail.scores.communication}<span className="text-sm text-slate-500">/10</span></span>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Sticky Action Bar */}
      <div className="print:hidden fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-center gap-4 z-50">
        <button 
          onClick={handleDownloadAndEmail}
          disabled={isExporting}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-2xl text-white font-bold transition-all shadow-xl shadow-emerald-900/20"
        >
          {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />} 
          {isExporting ? "Generating PDF..." : "Download & Email Report"}
        </button>
      </div>

    </div>
  );
}
