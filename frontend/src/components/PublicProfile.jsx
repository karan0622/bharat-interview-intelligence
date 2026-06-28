import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Award, Briefcase, Star, Share2 } from 'lucide-react';

export default function PublicProfile() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Extract session ID from URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('public');

  useEffect(() => {
    if (!sessionId) {
      setError(true);
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/report`);
        if (!res.ok) throw new Error('Report not found');
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Public URL copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-emerald-400" size={48} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-rose-500">Profile Not Found</h1>
          <p className="text-slate-400">This interview session doesn't exist or is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] text-white p-6 md:p-12 font-sans flex flex-col items-center">
      
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-slate-900">
            BI
          </div>
          <h1 className="text-xl font-bold text-slate-200 tracking-wider uppercase">Bharat Interview</h1>
        </div>
        <button 
          onClick={copyUrl}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors"
        >
          <Share2 size={16} /> Share Link
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Certificate Section */}
        <div className="relative overflow-hidden border-[2px] border-emerald-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-12 rounded-3xl shadow-[0_0_50px_-10px_rgba(16,185,129,0.2)] flex flex-col items-center text-center mb-12">
          
          <Award className="absolute -left-20 -bottom-20 text-emerald-500/5" size={400} />
          
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <Award className="text-emerald-400" size={40} />
          </div>
          
          <h2 className="text-xl text-emerald-500 uppercase tracking-[0.3em] font-black mb-2">Verified AI Evaluation</h2>
          <h1 className="text-5xl md:text-6xl font-serif italic text-white mb-6">
            {report.user_name || 'Candidate'}
          </h1>
          
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-8">
            Has successfully completed a rigorous AI-proctored technical interview evaluation for the role of <span className="text-emerald-400 font-bold">{report.role}</span>.
          </p>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="text-left">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Overall Score</p>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                {report.overall_readiness_score}%
              </div>
            </div>
          </div>
          
          <div className="w-full flex justify-between items-end border-t border-slate-800/50 pt-8 mt-4 relative z-10">
            <div className="text-left">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Company Type</p>
              <p className="text-slate-300 font-serif italic">{report.field}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Verification Date</p>
              <p className="text-slate-300 font-serif italic">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Strengths Showcase */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-xl">
          <h3 className="flex items-center gap-3 text-2xl font-bold text-slate-200 mb-6 border-b border-slate-800 pb-4">
            <Star className="text-yellow-400" /> Candidate Highlights
          </h3>
          <div className="space-y-4">
            {report.strengths.map((str, i) => (
              <div key={i} className="flex gap-4 items-start p-4 bg-slate-950 rounded-2xl border border-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-slate-300 leading-relaxed pt-1">{str}</p>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
