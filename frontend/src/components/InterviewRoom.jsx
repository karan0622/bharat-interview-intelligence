import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Send, Loader2, RotateCcw, Code2, Play, AlertTriangle, EyeOff, FastForward, Smartphone } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { FaceLandmarker, ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { ReactSketchCanvas } from 'react-sketch-canvas';

export default function InterviewRoom({ sessionId, onComplete }) {
  const [questionData, setQuestionData] = useState(null);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("// Write your solution here...\n");
  const [codeLanguage, setCodeLanguage] = useState("python");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Avatar / TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuestionText, setShowQuestionText] = useState(false);
  
  // Proctoring State
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [warningType, setWarningType] = useState(null); // 'face', 'eyes', 'gadget', 'multiple'
  const [showWarningOverlay, setShowWarningOverlay] = useState(false);
  
  // Round Transition State
  const [currentRoundNumber, setCurrentRoundNumber] = useState(0);
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const [roundTransitionName, setRoundTransitionName] = useState("");

  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Proctoring Refs
  const videoRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const synth = window.speechSynthesis;
  
  // Canvas Ref
  const canvasRef = useRef(null);

  useEffect(() => {
    initProctoring();
    fetchNextQuestion();
    
    // SpeechRecognition init is delayed until we fetch language
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      synth.cancel();
    };
  }, [sessionId]);

  const initProctoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 2
      });

      objectDetectorRef.current = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        scoreThreshold: 0.5
      });
      
      setIsProctoringActive(true);
      predictWebcam();
    } catch (err) {
      console.error("Camera access denied or MediaPipe failed", err);
      alert("Please allow camera access for the proctored interview.");
    }
  };

  const predictWebcam = async () => {
    if (!videoRef.current || !faceLandmarkerRef.current || !objectDetectorRef.current) return;
    
    let startTimeMs = performance.now();
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      
      // 1. Detect Objects (Gadgets)
      const objResults = objectDetectorRef.current.detectForVideo(videoRef.current, startTimeMs);
      let gadgetDetected = false;
      if (objResults.detections) {
        for (const detection of objResults.detections) {
          const cat = detection.categories[0].categoryName;
          if (cat === "cell phone" || cat === "laptop" || cat === "tablet") {
            gadgetDetected = true;
            break;
          }
        }
      }

      // 2. Detect Faces and Eyes
      const faceResults = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      let newWarning = null;
      
      if (gadgetDetected) {
        newWarning = 'gadget';
      } else if (!faceResults.faceLandmarks || faceResults.faceLandmarks.length === 0) {
        newWarning = 'face';
      } else if (faceResults.faceLandmarks.length > 1) {
        newWarning = 'multiple';
      } else if (faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
        // Eye tracking via blendshapes
        const shapes = faceResults.faceBlendshapes[0].categories;
        let lookingAway = false;
        for (const shape of shapes) {
          if ((shape.categoryName.includes('eyeLookOut') || shape.categoryName.includes('eyeLookIn') || shape.categoryName.includes('eyeLookUp')) && shape.score > 0.65) {
            lookingAway = true;
            break;
          }
        }
        if (lookingAway) newWarning = 'eyes';
      }

      if (newWarning) {
        setWarningType(newWarning);
        setShowWarningOverlay(true);
      } else {
        setShowWarningOverlay(false);
      }
    }
    
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const getLanguageTag = (lang) => {
    switch(lang) {
      case 'Hindi': return 'hi-IN';
      case 'Tamil': return 'ta-IN';
      case 'Telugu': return 'te-IN';
      case 'Hinglish': return 'hi-IN'; // Best approximation
      default: return 'en-IN';
    }
  };

  const initSpeechRecognition = (langTag) => {
    if ('webkitSpeechRecognition' in window && !recognitionRef.current) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = langTag; 
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        if (event.error !== 'no-speech') setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  };

  const speakQuestion = (text, langStr) => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langTag = getLanguageTag(langStr);
    utterance.lang = langTag;

    const voices = synth.getVoices();
    // Prioritize high-quality native/premium voices for a more fluent tone
    let voice = null;
    
    // Specially target macOS/iOS high quality voices if it's English
    if (langTag.startsWith('en')) {
      voice = voices.find(v => v.name.includes('Siri') || v.name === 'Samantha' || v.name === 'Alex' || v.name.includes('Google US English'));
    }
    
    // Fallbacks to generic premium or Google voices
    if (!voice) voice = voices.find(v => v.lang.replace('_', '-') === langTag && (v.name.includes('Google') || v.name.includes('Premium')));
    if (!voice) voice = voices.find(v => v.lang.replace('_', '-') === langTag);
    if (!voice) voice = voices.find(v => v.lang.includes(langTag.split('-')[0]));
    if (!voice) voice = voices.find(v => v.lang.includes('IN') || v.lang.includes('in')); 
    
    if (voice) utterance.voice = voice;
    
    // Optimize speech rate and pitch to sound less robotic and more fluent
    utterance.rate = 1.08; 
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setShowQuestionText(false);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setShowQuestionText(true); // Reveal text to candidate after spoken
    };
    
    synth.speak(utterance);
  };

  const handleComplete = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    onComplete();
  };

  const fetchNextQuestion = async () => {
    try {
      setQuestionData(null); 
      setTranscript("");
      setCodeSnippet("// Write your solution here...\n");
      setShowQuestionText(false);
      setIsSpeaking(false); // Reset in case TTS got stuck
      
      const res = await fetch(`/api/session/${sessionId}/question`);
      const data = await res.json();
      
      const isCoding = data.question_type === 'coding';
      if (!data.question_id) {
        handleComplete();
      } else {
        const handleNewQuestion = () => {
          setQuestionData(data);
          initSpeechRecognition(getLanguageTag(data.interview_language));
          
          if (!isCoding && data.question_type !== 'system_design') {
            setTimeout(() => speakQuestion(data.question_text, data.interview_language), 1000); 
          } else {
            setShowQuestionText(true); // Always show text immediately for coding/system design
          }
        };

        if (data.round_number && data.round_number !== currentRoundNumber) {
          setCurrentRoundNumber(data.round_number);
          setRoundTransitionName(data.round_name);
          setShowRoundTransition(true);
          
          setTimeout(() => {
            setShowRoundTransition(false);
            handleNewQuestion();
          }, 3500); // Show transition for 3.5 seconds
        } else {
          handleNewQuestion();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript("");
      startTimeRef.current = Date.now();
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const calculateSpeechStats = () => {
    const text = transcript.trim().toLowerCase();
    let pace = 0;
    if (startTimeRef.current && text.length > 0) {
      const durationMin = (Date.now() - startTimeRef.current) / 60000;
      const wordCount = text.split(/\s+/).length;
      pace = durationMin > 0 ? (wordCount / durationMin) : 0;
    }
    
    const fillers = ['um', 'uh', 'actually', 'basically', 'like'];
    let fillerCount = 0;
    text.split(/\s+/).forEach(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (fillers.includes(cleanWord)) {
        fillerCount++;
      }
    });

    return { pace: Math.round(pace), fillerCount };
  };

  const skipQuestion = async () => {
    setIsSubmitting(true);
    synth.cancel();
    setIsSpeaking(false); // Ensure buttons unlock if speech is cancelled
    
    const formData = new FormData();
    formData.append("question_id", questionData.question_id);
    
    try {
      const res = await fetch(`/api/session/${sessionId}/skip`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.has_more_questions) {
        fetchNextQuestion();
      } else {
        handleComplete();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to skip question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAnswer = async () => {
    const isCoding = questionData.question_type === 'coding';
    const isSystemDesign = questionData.question_type === 'system_design';
    
    if (!isCoding && !isSystemDesign && !transcript.trim()) return;
    if (isCoding && !codeSnippet.trim()) return;

    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("question_id", questionData.question_id);
    
    if (isCoding) {
      formData.append("code_snippet", codeSnippet);
    } else if (isSystemDesign) {
      if (canvasRef.current) {
        try {
          const base64Image = await canvasRef.current.exportImage("png");
          formData.append("code_snippet", base64Image); // Repurpose code_snippet column for base64 image
        } catch (e) {
          console.error("Canvas export failed", e);
        }
      }
    } else {
      const { pace, fillerCount } = calculateSpeechStats();
      formData.append("transcript", transcript);
      formData.append("pace", pace);
      formData.append("filler_count", fillerCount);
    }

    try {
      const res = await fetch(`/api/session/${sessionId}/answer`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.has_more_questions) {
        fetchNextQuestion();
      } else {
        handleComplete();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!questionData && !showRoundTransition) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-white relative">
        <video ref={videoRef} autoPlay playsInline className="opacity-0 absolute w-0 h-0"></video>
        <div className="flex flex-col items-center gap-4 text-indigo-400">
          <Loader2 className="animate-spin" size={48} />
          <p className="text-slate-300 animate-pulse text-lg tracking-wide">AI is analyzing context and preparing...</p>
        </div>
      </div>
    );
  }

  // If questionData is null but showRoundTransition is true, we must still render the wrapper to show the transition overlay!
  const isCoding = questionData ? questionData.question_type === 'coding' : false;

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* Round Transition Overlay */}
      {showRoundTransition && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold text-slate-400 tracking-widest uppercase mb-4">Starting Round {currentRoundNumber}</h2>
            <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-500 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
              {roundTransitionName}
            </h1>
            <motion.div 
              className="mt-12 h-1 bg-slate-800 rounded-full w-64 mx-auto overflow-hidden"
            >
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.5, ease: "linear" }}
                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Hidden Proctoring Video */}
      <video ref={videoRef} autoPlay playsInline className="absolute bottom-4 right-4 w-32 rounded-lg opacity-20 border border-slate-700 pointer-events-none z-50"></video>

      {/* Proctoring Warning Overlay */}
      {showWarningOverlay && (
        <div className="absolute inset-0 z-50 bg-red-950/90 backdrop-blur flex flex-col items-center justify-center p-6 text-center">
          {warningType === 'gadget' && <Smartphone size={64} className="text-red-500 mb-4 animate-bounce" />}
          {warningType === 'multiple' && <AlertTriangle size={64} className="text-red-500 mb-4 animate-bounce" />}
          {(warningType === 'face' || warningType === 'eyes') && <EyeOff size={64} className="text-red-500 mb-4 animate-bounce" />}
          
          <h1 className="text-4xl font-black text-red-500 uppercase tracking-widest mb-2">Warning</h1>
          <p className="text-xl text-red-200 max-w-lg font-medium">
            {warningType === 'gadget' && "Smart gadget detected in frame. Please put your devices away immediately."}
            {warningType === 'multiple' && "Multiple people detected in the frame. You must be alone."}
            {warningType === 'face' && "Face not detected. Please stay in the camera frame."}
            {warningType === 'eyes' && "Suspicious eye movement detected. Please look directly at the screen."}
          </p>
        </div>
      )}
      
      {/* Header Bar */}
      <div className="h-14 glass-panel border-b-0 flex items-center justify-between px-6 shrink-0 relative z-40">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isProctoringActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="font-semibold text-slate-200">
            {isProctoringActive ? 'Proctored Live Session' : 'Initializing Proctoring...'}
          </span>
        </div>
        {questionData && (
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium text-slate-400">
               Question {questionData.question_number} of {questionData.total_questions}
             </span>
             <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
               {questionData.question_type}
             </span>
          </div>
        )}
      </div>

      {questionData && (questionData.question_type === 'system_design' ? (
        /* ================= SYSTEM DESIGN ENVIRONMENT ================= */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-40">
          {/* Left Panel: Problem Statement & AI Avatar */}
          <div className="w-full md:w-1/3 border-r border-slate-700/50 glass-panel flex flex-col">
            <div className="h-32 bg-slate-950/30 border-b border-slate-800/50 flex items-center justify-center relative overflow-hidden shrink-0">
               <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isSpeaking ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-slate-800'} z-10`}>
                 <img src="/avatar.png" alt="AI Interviewer" className="w-full h-full object-cover" />
               </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <h2 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2">
                <Square size={24} className="text-emerald-400" /> Architecture Task
              </h2>
              {showQuestionText ? (
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {questionData.question_text}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                   <AlertTriangle className="mb-2 opacity-50" />
                   <p className="text-sm font-medium">Listen carefully to the AI interviewer.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Canvas Editor */}
          <div className="w-full md:w-2/3 flex flex-col bg-slate-950">
            <div className="h-10 bg-slate-900 flex items-center px-4 border-b border-slate-800 justify-between shrink-0">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                 Architecture Whiteboard
               </div>
               <div className="flex items-center gap-2">
                 <button 
                    onClick={() => canvasRef.current?.clearCanvas()}
                    disabled={isSubmitting || isSpeaking}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> Clear
                  </button>
                 <button 
                    onClick={submitAnswer}
                  disabled={isSubmitting || isSpeaking}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 
                  {isSubmitting ? 'Evaluating Diagram...' : 'Submit Diagram'}
                </button>
              </div>
            </div>
            <div className="flex-1 relative bg-white">
              {isSubmitting && (
                <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur flex flex-col items-center justify-center">
                   <Loader2 className="animate-spin text-emerald-400 mb-4" size={40} />
                   <p className="text-emerald-300 font-medium tracking-wide">AI analyzing your architecture...</p>
                </div>
              )}
              <ReactSketchCanvas
                ref={canvasRef}
                strokeWidth={3}
                strokeColor="black"
                canvasColor="white"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      ) : isCoding ? (
        /* ================= CODING ENVIRONMENT ================= */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-40">
          
          {/* Left Panel: AI Video & Live Transcript */}
          <div className="w-full md:w-1/3 border-r border-slate-700/50 glass-panel flex flex-col relative">
            
            {/* AI Video Feed Simulation */}
            <div className="h-32 bg-slate-950/30 border-b border-slate-800/50 flex items-center justify-center relative overflow-hidden shrink-0">
               <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isSpeaking ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-indigo-900/50'} z-10`}>
                 <img src="/avatar.png" alt="AI Interviewer" className="w-full h-full object-cover" />
               </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <h2 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2">
                <Code2 size={24} className="text-indigo-400" /> Problem Statement
              </h2>
              {showQuestionText ? (
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {questionData.question_text}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                   <AlertTriangle className="mb-2 opacity-50" />
                   <p className="text-sm font-medium">Listen carefully to the AI interviewer.</p>
                   <p className="text-xs">Text will appear when speaking finishes.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Code Editor */}
          <div className="w-full md:w-2/3 flex flex-col bg-[#1e1e1e]">
            <div className="h-10 bg-[#2d2d2d] flex items-center px-4 border-b border-slate-800 justify-between shrink-0">
               <div className="flex items-center gap-2">
                 <select 
                   value={codeLanguage} 
                   onChange={(e) => setCodeLanguage(e.target.value)}
                   className="bg-[#1e1e1e] border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500"
                 >
                   <option value="python">Python</option>
                   <option value="javascript">JavaScript</option>
                   <option value="java">Java</option>
                   <option value="cpp">C++</option>
                 </select>
               </div>
               <div className="flex items-center gap-2">
                 <button 
                    onClick={skipQuestion}
                    disabled={isSubmitting || isSpeaking}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <FastForward size={14} /> Skip
                  </button>
                 <button 
                    onClick={submitAnswer}
                  disabled={isSubmitting || isSpeaking}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} 
                  {isSubmitting ? 'Evaluating...' : 'Submit Code'}
                </button>
            </div>
          </div>
            <div className="flex-1 relative">
              {isSubmitting && (
                <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur flex flex-col items-center justify-center">
                   <Loader2 className="animate-spin text-emerald-400 mb-4" size={40} />
                   <p className="text-emerald-300 font-medium tracking-wide">AI compiling and reviewing your code...</p>
                </div>
              )}
              <Editor
                height="100%"
                language={codeLanguage}
                theme="vs-dark"
                value={codeSnippet}
                onChange={(val) => setCodeSnippet(val || "")}
                options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', padding: { top: 16 } }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ================= AUDIO ENVIRONMENT ================= */
        <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto relative z-40">
          
          {/* AI Avatar Large */}
          <div className="w-full max-w-3xl flex flex-col items-center mt-6">
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
               {/* Pulsing rings for speech */}
               {isSpeaking && (
                 <>
                   <div className="absolute w-full h-full border-[3px] border-indigo-500 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                   <div className="absolute w-[80%] h-[80%] border-[2px] border-blue-400 rounded-full animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                 </>
               )}
               
               {/* Realistic Avatar Image */}
               <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500/50 shadow-[0_0_40px_-5px_rgba(99,102,241,0.5)] z-10 transition-transform duration-500 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                  <img src="/avatar.png" alt="AI Interviewer" className="w-full h-full object-cover" />
               </div>
            </div>

            {/* Question Text Area */}
            <div className="w-full min-h-[120px] bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-8 shadow-2xl relative mb-12 flex items-center justify-center text-center">
              {showQuestionText ? (
                <p className="text-2xl md:text-3xl font-medium text-slate-100 leading-relaxed">
                  "{questionData.question_text}"
                </p>
              ) : (
                 <p className="text-lg font-medium text-slate-500 uppercase tracking-widest flex items-center gap-3">
                   <AlertTriangle size={20} /> Listen to the question carefully...
                 </p>
              )}
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-8 w-full"
            >
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isSubmitting || isSpeaking}
                  className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all border-[4px] ${
                    isRecording 
                      ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30' 
                      : 'bg-indigo-500/20 border-indigo-500 text-indigo-400 hover:bg-indigo-500/30'
                  } disabled:opacity-30`}
                >
                  {isRecording ? <Square fill="currentColor" size={32} /> : <Mic size={40} />}
                </button>
                <div className="h-6">
                   {isRecording && (
                     <div className="flex gap-1 items-end h-full">
                       {[...Array(5)].map((_, i) => (
                         <motion.div 
                           key={i}
                           animate={{ height: ['20%', '100%', '20%'] }}
                           transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                           className="w-1 bg-red-400 rounded-t"
                         />
                       ))}
                     </div>
                   )}
                </div>
              </div>

              {(transcript || isRecording) && (
                <div className="w-full glass-panel rounded-2xl p-6 border border-slate-700/50 min-h-[120px]">
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">Live Transcript</p>
                  <p className="text-slate-200 text-lg leading-relaxed">
                    {transcript}
                    {isRecording && <span className="animate-pulse inline-block ml-1 w-2 h-4 bg-slate-400"></span>}
                  </p>
                </div>
              )}

              {!isRecording && transcript.trim() && !isSubmitting && (
                <div className="flex gap-4 w-full justify-center">
                  <button 
                    onClick={() => setTranscript("")}
                    className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-2"
                  >
                    <RotateCcw size={18} /> Retry
                  </button>
                  <button 
                    onClick={skipQuestion}
                    className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-2"
                  >
                    <FastForward size={18} /> Skip
                  </button>
                  <button 
                    onClick={submitAnswer}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold transition-all shadow-lg flex items-center gap-2"
                  >
                    <Send size={18} /> Submit Answer
                  </button>
                </div>
              )}

              {/* Show Skip if no transcript yet either */}
              {!isRecording && !transcript.trim() && !isSubmitting && (
                 <div className="flex gap-4 w-full justify-center opacity-50 hover:opacity-100 transition-opacity">
                   <button 
                    onClick={skipQuestion}
                    className="px-6 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    <FastForward size={14} /> Skip Question
                  </button>
                 </div>
              )}

              {isSubmitting && (
                <div className="flex flex-col items-center gap-3 text-indigo-400">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="font-medium tracking-wide">AI is evaluating your answer...</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}
