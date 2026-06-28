import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Code2 } from 'lucide-react';
import Editor from '@monaco-editor/react';

export default function TopicTest({ topic, questions, onComplete }) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState(questions.map(() => ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQ = questions[currentQIndex];
  const isCoding = currentQ.question_text.toLowerCase().includes('write code') || currentQ.question_text.toLowerCase().includes('implement');

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) setCurrentQIndex(currentQIndex - 1);
  };

  const updateAnswer = (val) => {
    const newAnswers = [...answers];
    newAnswers[currentQIndex] = val;
    setAnswers(newAnswers);
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    
    // Prepare payload
    const qAndA = questions.map((q, idx) => ({
      question: q.question_text,
      answer: answers[idx]
    }));

    try {
      const res = await fetch('/api/topics/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_title: topic.title, q_and_a: qAndA })
      });
      const data = await res.json();
      onComplete(data);
    } catch (err) {
      console.error(err);
      alert("Failed to grade test.");
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-slate-900/80 border border-slate-700 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Practice Test: {topic.title}</h2>
          <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm font-semibold">
            Question {currentQIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 mb-6 shadow-inner">
          <h3 className="text-lg text-slate-200 font-medium leading-relaxed">
            {currentQ.question_text}
          </h3>
          <p className="text-xs text-amber-500 mt-2 font-mono uppercase tracking-wider">Difficulty: {currentQ.difficulty}</p>
        </div>

        <div className="mb-8">
          <label className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-3">
            <Code2 size={16} className="text-emerald-400" /> Your Answer
          </label>
          
          {isCoding ? (
            <div className="h-64 rounded-xl overflow-hidden border border-slate-700">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={answers[currentQIndex]}
                onChange={updateAnswer}
                options={{ minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>
          ) : (
            <textarea
              value={answers[currentQIndex]}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder="Type your explanation here..."
              className="w-full h-48 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-mono text-sm"
            ></textarea>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <button 
            onClick={handlePrev}
            disabled={currentQIndex === 0 || isSubmitting}
            className="px-6 py-3 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
          >
            Previous
          </button>
          
          <button 
            onClick={handleNext}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin" size={20} /> Grading...</>
            ) : (
              <>{currentQIndex === questions.length - 1 ? 'Submit Test' : 'Next Question'} <Send size={18} /></>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
