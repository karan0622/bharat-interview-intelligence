import React, { useState, useEffect } from 'react';
import { Trophy, Medal, ArrowLeft, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Leaderboard({ onBack }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getRankBadge = (index) => {
    if (index === 0) return <Medal className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" size={32} />;
    if (index === 1) return <Medal className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" size={28} />;
    if (index === 2) return <Medal className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" size={24} />;
    return <span className="text-slate-500 font-bold text-lg w-8 text-center">{index + 1}</span>;
  };

  return (
    <div className="flex-1 flex flex-col p-6 items-center overflow-y-auto z-40 relative">
      <div className="w-full max-w-4xl mt-12 mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-3 flex items-center gap-4">
              <Trophy size={48} className="text-yellow-400" />
              Global Hall of Fame
            </h1>
            <p className="text-slate-400 text-lg">The absolute top scorers across all industries and companies.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 gap-4 p-6 bg-slate-950/50 border-b border-slate-800 text-sm font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-6">Candidate Profile</div>
              <div className="col-span-4 text-right pr-8">Readiness Score</div>
            </div>

            <div className="flex flex-col divide-y divide-slate-800/50">
              {leaders.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No interviews completed yet. Be the first!</div>
              ) : (
                leaders.map((leader, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={leader.user_id} 
                    className={`grid grid-cols-12 gap-4 p-6 items-center transition-colors hover:bg-slate-800/50 ${i === 0 ? 'bg-yellow-500/5' : ''}`}
                  >
                    <div className="col-span-2 flex justify-center">
                      {getRankBadge(i)}
                    </div>
                    
                    <div className="col-span-6 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        i === 0 ? 'bg-yellow-500 text-slate-900 ring-4 ring-yellow-500/20' : 'bg-slate-800 text-white'
                      }`}>
                        {leader.profile_icon || '👤'}
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${i === 0 ? 'text-yellow-400' : 'text-slate-200'}`}>
                          {leader.name}
                        </h3>
                        {i === 0 && <span className="text-xs text-yellow-500 uppercase tracking-wider font-bold">Current Champion</span>}
                      </div>
                    </div>

                    <div className="col-span-4 flex justify-end pr-8">
                      <div className="flex items-center gap-2">
                        <span className={`text-3xl font-black ${
                          i === 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500' 
                          : leader.score >= 80 ? 'text-emerald-400' 
                          : 'text-slate-300'
                        }`}>
                          {leader.score}%
                        </span>
                        {leader.score >= 90 && <Star className="text-yellow-400" size={20} fill="currentColor" />}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
