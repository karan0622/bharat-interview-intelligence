import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Briefcase, GraduationCap, ArrowRight, Loader2, Target, Building2 } from 'lucide-react';

const ROLE_OPTIONS = {
  'Engineering / Tech': [
    'Software Development Engineer (SDE)', 'Frontend Developer', 'Backend Engineer', 'Full Stack Developer',
    'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Cloud Architect', 'Cybersecurity Analyst',
    'Mobile App Developer (iOS/Android)', 'QA Automation Engineer', 'Blockchain Developer'
  ],
  'Banking / Finance': [
    'Bank PO (Probationary Officer)', 'Investment Banker', 'Financial Analyst', 'Risk Manager',
    'Wealth Manager', 'Actuary', 'Private Equity Analyst', 'Credit Analyst', 'Chartered Accountant (CA)'
  ],
  'Government / PSU': [
    'UPSC Civil Services (IAS/IPS)', 'SSC CGL', 'PSU Graduate Engineer Trainee (GET)', 'State PSC',
    'Defence Services (NDA/CDS)', 'Railway Recruitment Board (RRB)', 'RBI Grade B Officer'
  ],
  'Management Consulting': [
    'Management Consultant', 'Business Analyst', 'Strategy Associate', 'Operations Consultant',
    'Financial Advisory Consultant', 'Tech Strategy Consultant'
  ],
  'Sales & Marketing': [
    'Sales Executive / BDE', 'Key Account Manager', 'Digital Marketing Manager', 'SEO Specialist',
    'Product Marketing Manager', 'Brand Manager', 'Public Relations (PR) Manager', 'Growth Hacker'
  ],
  'Human Resources': [
    'HR Generalist', 'Talent Acquisition / Recruiter', 'Compensation & Benefits Specialist', 
    'HR Business Partner (HRBP)', 'Learning & Development Manager'
  ],
  'Design & Creative': [
    'UI/UX Designer', 'Product Designer', 'Graphic Designer', 'Art Director',
    'Video Editor / Motion Graphics', 'Content Writer / Copywriter', '3D Animator'
  ],
  'Healthcare & Medical': [
    'Medical Officer / Doctor', 'Registered Nurse', 'Hospital Administrator', 
    'Clinical Research Associate', 'Pharmacist', 'Medical Representative (MR)'
  ],
  'Education & Academia': [
    'Assistant Professor', 'K-12 Teacher', 'Instructional Designer', 'Educational Counselor',
    'Corporate Trainer', 'EdTech Subject Matter Expert (SME)'
  ],
  'Supply Chain & Operations': [
    'Supply Chain Manager', 'Logistics Coordinator', 'Procurement Specialist', 
    'Operations Manager', 'Quality Assurance Manager'
  ],
  'Legal & Compliance': [
    'Corporate Lawyer', 'Litigation Associate', 'Legal Advisor', 'Compliance Officer',
    'Intellectual Property (IP) Lawyer'
  ]
};

export default function TopicOnboarding({ onBack, onComplete }) {
  const [field, setField] = useState('Engineering / Tech');
  const [role, setRole] = useState(ROLE_OPTIONS['Engineering / Tech'][0]);
  const [experience, setExperience] = useState('Entry-level (0-2 years)');
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (e) => {
    const newField = e.target.value;
    setField(newField);
    setRole(ROLE_OPTIONS[newField][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/topics/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, experience_level: experience })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.topics) {
        throw new Error(data.detail || data.error || "Failed to generate syllabus");
      }
      
      onComplete({ role, experience }, data.topics);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to generate exhaustive syllabus. Please try again.");
      setLoading(false);
    }
  };

  const LOADING_FACTS = [
    "We are compiling exhaustive modules tailored exactly to your role...",
    "It can take up to 1-2 minutes to design the perfect curriculum. Hang tight!",
    "AI is analyzing FAANG interview trends from the past 6 months...",
    "Preparing interactive Mermaid.js diagrams and visual study guides...",
    "Did you know? Reviewing core algorithms increases interview pass rates by 40%.",
    "Structuring behavioral and technical practice questions..."
  ];

  const [factIndex, setFactIndex] = useState(0);

  React.useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setFactIndex(prev => (prev + 1) % LOADING_FACTS.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center z-10 relative">
            <div className="absolute inset-0 bg-indigo-500/10 animate-pulse blur-3xl rounded-full"></div>
            <Loader2 size={64} className="text-indigo-400 animate-spin mb-8" />
            <h2 className="text-2xl font-bold text-white mb-4">Designing Your Journey</h2>
            
            <motion.p 
              key={factIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-indigo-200 text-lg max-w-md h-20"
            >
              {LOADING_FACTS[factIndex]}
            </motion.p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <BookOpen className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2">Build Your Full Curriculum</h1>
              <p className="text-slate-400">Select your exact role, and our AI will build an exhaustive study plan.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-400" /> Industry / Field
                </label>
                <select 
                  value={field}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  {Object.keys(ROLE_OPTIONS).map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Target size={16} className="text-indigo-400" /> Exact Role
                </label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  {ROLE_OPTIONS[field].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <GraduationCap size={16} className="text-emerald-400" /> Experience Level
                </label>
                <select 
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option>Student / Intern</option>
                  <option>Entry-level (0-2 years)</option>
                  <option>Mid-level (3-5 years)</option>
                  <option>Senior (5+ years)</option>
                  <option>Lead / Manager</option>
                </select>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={onBack}
                  className="px-6 py-4 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2 transition-all"
                >
                  Build Curriculum <ArrowRight size={20} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </motion.div>
  );
}
