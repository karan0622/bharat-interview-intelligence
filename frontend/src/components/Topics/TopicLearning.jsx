import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

// Initialize Mermaid globally
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

const MermaidChart = ({ code }) => {
  const [svg, setSvg] = useState('');
  
  useEffect(() => {
    // Generate a unique ID to avoid collisions
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    let isMounted = true;

    mermaid.render(id, code)
      .then((result) => {
        if (isMounted) setSvg(result.svg);
      })
      .catch((err) => console.error("Mermaid Render Error:", err));

    return () => { isMounted = false; };
  }, [code]);

  return (
    <div 
      className="mermaid-wrapper my-8 p-6 bg-slate-950/80 rounded-2xl flex justify-center border border-indigo-500/20 shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)] overflow-x-auto" 
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};

export default function TopicLearning({ topic, roleData, onStartTest }) {
  const [material, setMaterial] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingTest, setGeneratingTest] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const res = await fetch('/api/topics/material', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic_title: topic.title, role: roleData.role })
        });
        const data = await res.json();
        setMaterial(data.material_markdown);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [topic, roleData]);

  const handleStartPractice = async () => {
    setGeneratingTest(true);
    try {
      const res = await fetch('/api/topics/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_title: topic.title, role: roleData.role })
      });
      const data = await res.json();
      onStartTest(data.questions);
    } catch (err) {
      console.error(err);
      alert("Failed to generate test.");
      setGeneratingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-200">AI is compiling your lesson...</h2>
        <p className="text-slate-400">Generating material for {topic.title}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-slate-900/80 border border-slate-700 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{topic.title}</h1>
          <p className="text-indigo-400 font-medium">Study Guide, Core Concepts & Architecture</p>
        </div>

        <div className="prose prose-invert prose-indigo max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                if (!inline && match && match[1] === 'mermaid') {
                  return <MermaidChart code={String(children).replace(/\n$/, '')} />;
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {material}
          </ReactMarkdown>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleStartPractice}
            disabled={generatingTest}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {generatingTest ? (
              <><Loader2 className="animate-spin" size={20} /> Generating Questions...</>
            ) : (
              <><PlayCircle size={24} /> Start Practice Test</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
