import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, CreditCard } from 'lucide-react';
import axios from 'axios';
import TopicOnboarding from './TopicOnboarding';
import TopicSyllabus from './TopicSyllabus';
import TopicLearning from './TopicLearning';
import TopicTest from './TopicTest';
import TopicResults from './TopicResults';

export default function TopicsContainer({ user, onBack }) {
  // State machine: onboarding -> syllabus -> learning -> test -> results
  const [currentStep, setCurrentStep] = useState('onboarding');
  
  // Data State
  const [roleData, setRoleData] = useState({ role: '', experience: '' });
  const [syllabus, setSyllabus] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [studyMaterial, setStudyMaterial] = useState('');
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [testAnswers, setTestAnswers] = useState([]);
  const [testResults, setTestResults] = useState(null);

  const handleCheckout = async () => {
    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.post(`${apiUrl}/api/create-checkout-session`, formData);
      window.location.href = res.data.url;
    } catch (err) {
      alert("Checkout failed: " + err.message);
    }
  };

  // Transition Handlers
  const handleOnboardingComplete = (data, generatedSyllabus) => {
    setRoleData(data);
    setSyllabus(generatedSyllabus);
    setCurrentStep('syllabus');
  };

  const handleTopicSelect = async (topic) => {
    setSelectedTopic(topic);
    setCurrentStep('learning'); // The learning component will fetch the material
  };

  const handleStartTest = (questions) => {
    setPracticeQuestions(questions);
    setCurrentStep('test');
  };

  const handleTestComplete = (results) => {
    setTestResults(results);
    setCurrentStep('results');
  };

  const handleBackToSyllabus = () => {
    setCurrentStep('syllabus');
    setSelectedTopic(null);
    setStudyMaterial('');
    setPracticeQuestions([]);
    setTestAnswers([]);
    setTestResults(null);
  };

  if (!user?.has_prepare_access) {
    return (
      <div className="min-h-screen text-slate-200 font-sans p-6 md:p-12 relative z-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg glass-panel p-8 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Unlock Preparation</h2>
          <p className="text-slate-400 mb-8">
            Get lifetime access to AI-generated customized syllabuses, in-depth study materials, and targeted practice tests.
          </p>
          <button 
            onClick={handleCheckout}
            className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
          >
            <CreditCard size={24} /> Pay ₹50 for Lifetime Access
          </button>
          <button onClick={onBack} className="mt-6 text-slate-400 hover:text-white transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 font-sans p-6 md:p-12 relative z-10 flex flex-col items-center">
      
      {currentStep !== 'onboarding' && (
        <div className="w-full max-w-5xl mb-6">
          <button 
            onClick={currentStep === 'syllabus' ? onBack : handleBackToSyllabus}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <ArrowLeft size={20} /> {currentStep === 'syllabus' ? 'Back to Home' : 'Back to Syllabus'}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentStep === 'onboarding' && (
          <TopicOnboarding 
            key="onboarding" 
            onBack={onBack} 
            onComplete={handleOnboardingComplete} 
          />
        )}
        
        {currentStep === 'syllabus' && (
          <TopicSyllabus 
            key="syllabus" 
            roleData={roleData} 
            syllabus={syllabus} 
            onSelectTopic={handleTopicSelect} 
          />
        )}

        {currentStep === 'learning' && (
          <TopicLearning 
            key="learning" 
            topic={selectedTopic} 
            roleData={roleData}
            onStartTest={handleStartTest}
          />
        )}

        {currentStep === 'test' && (
          <TopicTest 
            key="test" 
            topic={selectedTopic} 
            questions={practiceQuestions}
            onComplete={handleTestComplete}
          />
        )}

        {currentStep === 'results' && (
          <TopicResults 
            key="results" 
            topic={selectedTopic} 
            results={testResults}
            onBackToSyllabus={handleBackToSyllabus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
