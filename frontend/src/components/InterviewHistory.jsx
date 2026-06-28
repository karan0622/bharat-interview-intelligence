import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Target, TrendingUp, Calendar, ChevronRight, Loader2 } from 'lucide-react';

export default function InterviewHistory({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/user/${user.id}/history`);
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-950">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p>Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-3xl">
            {user.profile_icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Your Interviews</h1>
            <p className="text-slate-400">Welcome back, {user.username}. Here is your past performance.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center">
            <History size={48} className="text-slate-600 mb-4" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">No Interviews Yet</h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              You haven't completed any mock interviews yet. Head back home to start your first session!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((session, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={session.session_id} 
                className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group"
              >
                <div className="flex-1 flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-200">{session.role}</h3>
                    <p className="text-sm font-medium text-slate-400 mb-2">{session.field}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-md w-fit border border-slate-800/50">
                      <Calendar size={14} /> {session.date}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Overall Score</p>
                    <div className="flex items-center justify-end gap-2 text-emerald-400">
                      <TrendingUp size={18} />
                      <span className="text-2xl font-black">{Math.round(session.overall_score || 0)}%</span>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
