import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Layers } from 'lucide-react';

export default function TopicSyllabus({ roleData, syllabus, onSelectTopic }) {
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // The AI might occasionally just return a flat array of topics if it disobeys, 
  // or a categorized array as requested. Let's handle both gracefully.
  const isCategorized = syllabus.length > 0 && syllabus[0].category !== undefined;

  const renderCategorized = () => (
    <div className="space-y-12">
      {syllabus.map((section, secIdx) => (
        <div key={secIdx} className="w-full">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-2">
            <Layers className="text-indigo-400" size={24} />
            <h2 className="text-2xl font-bold text-white">{section.category}</h2>
          </div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {section.topics.map((topic, index) => (
              <motion.div 
                key={topic.id || index}
                variants={item}
                onClick={() => onSelectTopic(topic)}
                className="group bg-slate-900/60 border border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:bg-slate-800/80 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{topic.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {topic.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic {index + 1}</span>
                  <div className="flex items-center gap-1 text-emerald-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Start Learning <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );

  const renderFlat = () => (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {syllabus.map((topic, index) => (
        <motion.div 
          key={topic.id || index}
          variants={item}
          onClick={() => onSelectTopic(topic)}
          className="group bg-slate-900/60 border border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:bg-slate-800/80 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{topic.title}</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {topic.description}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Module {index + 1}</span>
            <div className="flex items-center gap-1 text-emerald-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Start Learning <ChevronRight size={16} />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-4">
          The Master Curriculum
        </h1>
        <p className="text-xl text-slate-400">
          Tailored for a <span className="text-white font-semibold">{roleData.experience}</span> targeting <span className="text-white font-semibold">{roleData.role}</span>
        </p>
      </div>

      {isCategorized ? renderCategorized() : renderFlat()}
    </div>
  );
}
