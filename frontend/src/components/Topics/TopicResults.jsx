import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export default function TopicResults({ topic, results, onBackToSyllabus }) {
  if (!results) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-slate-900/80 border border-slate-700 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-yellow-500/20">
            <Trophy className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Test Complete</h1>
          <p className="text-slate-400 text-lg">AI Evaluation for {topic.title}</p>
        </div>

        {/* SCORE CARD */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between mb-8">
          <div>
            <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-1">Overall Score</h3>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              {results.overall_score_percentage}%
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            {results.overall_score_percentage >= 80 ? (
              <span className="inline-flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full font-bold">
                <CheckCircle2 size={20} /> Excellent Mastery
              </span>
            ) : results.overall_score_percentage >= 60 ? (
              <span className="inline-flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-full font-bold">
                <Target size={20} /> Needs Practice
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-rose-400 bg-rose-400/10 px-4 py-2 rounded-full font-bold">
                <AlertTriangle size={20} /> Weak Area
              </span>
            )}
          </div>
        </div>

        {/* FEEDBACK BREAKDOWN */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2"><CheckCircle2 size={20}/> Core Strengths</h3>
            <ul className="space-y-3">
              {results.strengths?.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
            <h3 className="text-rose-400 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={20}/> Areas to Improve</h3>
            <ul className="space-y-3">
              {results.areas_to_improve?.map((a, i) => (
                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" /> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DETAILED QUESTION FEEDBACK */}
        <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Question Breakdown</h3>
        <div className="space-y-4 mb-8">
          {results.detailed_feedback?.map((item, idx) => (
            <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                {item.is_correct ? <CheckCircle2 className="text-emerald-400" size={20} /> : <XCircle className="text-rose-400" size={20} />}
                <span className="font-semibold text-slate-200">Question {idx + 1}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{item.feedback}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={onBackToSyllabus}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} /> Return to Syllabus
        </button>
      </div>
    </motion.div>
  );
}
