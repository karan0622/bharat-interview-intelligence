import React, { useState, Suspense, lazy } from 'react';
import { User, LogOut, Trophy, FileText, History, BookOpen, Loader2, DollarSign, Mail } from 'lucide-react';

// Lazy load heavy components to drastically improve initial load speed & smoothness
const Onboarding = lazy(() => import('./components/Onboarding'));
const InterviewRoom = lazy(() => import('./components/InterviewRoom'));
const Report = lazy(() => import('./components/Report'));
const Home = lazy(() => import('./components/Home'));
const Auth = lazy(() => import('./components/Auth'));
const InterviewHistory = lazy(() => import('./components/InterviewHistory'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const ResumeBuilder = lazy(() => import('./components/ResumeBuilder'));
const PublicProfile = lazy(() => import('./components/PublicProfile'));
const TopicsContainer = lazy(() => import('./components/Topics/TopicsContainer'));
const SalaryNegotiator = lazy(() => import('./components/SalaryNegotiator'));
const NetworkingGenerator = lazy(() => import('./components/NetworkingGenerator'));

// A reusable elegant loading fallback
const PageLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
    <p className="text-slate-400 font-medium animate-pulse">Loading experience...</p>
  </div>
);

function App() {
  // Check for public profile route first
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has('public')) {
    return <PublicProfile />;
  }

  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // home, auth, onboarding, interview, report, history
  const [sessionId, setSessionId] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [authRedirectTarget, setAuthRedirectTarget] = useState(null);

  const handleStartInterview = () => {
    if (!user) {
      setAuthRedirectTarget('onboarding');
      setCurrentView('auth');
    } else {
      setCurrentView('onboarding');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
    setShowProfileMenu(false);
  };

  const handleNav = (view) => {
    if (!user && view !== 'home') {
      setCurrentView('auth');
    } else {
      setCurrentView(view);
    }
    setShowProfileMenu(false);
  };

  return (
    <div className="relative min-h-screen bg-transparent text-slate-200 font-sans overflow-hidden flex flex-col">
      
      {/* Custom Global Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
        {/* The background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{ backgroundImage: "url('/bg-office.jpg')" }}
        ></div>
        {/* Dark frosted overlay to keep text readable but let the image shine through */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
        
        {/* Color gradients for extra modern feel */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-grow">
      {/* GLOBAL HEADER - Hidden during the actual active interview/report */}
      {(currentView === 'home' || currentView === 'history' || currentView === 'onboarding') && (
        <header className="h-20 glass-panel border-b-0 border-slate-800/50 flex items-center justify-between px-8 sticky top-0 z-40 transition-all duration-300">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              B
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">Bharat <span className="font-medium text-slate-400">AI</span></span>
          </div>

          <div className="flex items-center gap-8">
            {user && (
              <>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                  <button 
                    onClick={() => setCurrentView('topics')}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <BookOpen size={16} /> Prepare
                  </button>
                  <button 
                    onClick={() => setCurrentView('resume')}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <FileText size={16} /> Resume Builder
                  </button>
                  <button 
                    onClick={() => setCurrentView('negotiator')}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <DollarSign size={16} /> Salary
                  </button>
                  <button 
                    onClick={() => setCurrentView('networking')}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Mail size={16} /> Networking
                  </button>
                </nav>

                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 p-1.5 pl-4 rounded-full glass-panel hover:bg-slate-800/50 transition-all duration-300 border border-slate-700/50 group"
                  >
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white">{user.username}</span>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 flex items-center justify-center text-lg border border-indigo-500/30 group-hover:border-emerald-500/50 transition-colors">
                      {user.profile_icon}
                    </div>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl shadow-2xl shadow-black py-2 z-50 animate-in slide-in-from-top-2 duration-200 border border-slate-700/50">
                      <button 
                        onClick={() => handleNav('leaderboard')}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-slate-300 hover:bg-slate-800 hover:text-yellow-400 transition-colors"
                      >
                        <Trophy size={16} /> Global Ranking
                      </button>
                      <button 
                        onClick={() => handleNav('history')}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                      >
                        <History size={16} /> Your Interviews
                      </button>
                      <div className="h-px bg-slate-800 my-1"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </header>
      )}

      {/* MAIN CONTENT ROUTING */}
      <Suspense fallback={<PageLoader />}>
        {currentView === 'home' && <Home onStartInterview={handleStartInterview} />}
        {currentView === 'topics' && <TopicsContainer user={user} onBack={() => setCurrentView('home')} />}
        
        {currentView === 'leaderboard' && <Leaderboard onBack={() => setCurrentView('home')} />}
        {currentView === 'resume' && <ResumeBuilder onBack={() => setCurrentView('home')} />}
        {currentView === 'negotiator' && <SalaryNegotiator onBack={() => setCurrentView('home')} />}
        {currentView === 'networking' && <NetworkingGenerator onBack={() => setCurrentView('home')} />}
        
        {currentView === 'auth' && (
          <Auth 
            onLogin={(userData) => { 
              setUser(userData); 
              if (authRedirectTarget) {
                setCurrentView(authRedirectTarget);
                setAuthRedirectTarget(null);
              } else {
                setCurrentView('home'); 
              }
            }} 
            onBack={() => setCurrentView('home')} 
          />
        )}
        
        {currentView === 'history' && user && (
          <InterviewHistory user={user} />
        )}

        {currentView === 'onboarding' && (
          <Onboarding 
            userId={user?.id}
            onStart={(id) => {
              setSessionId(id);
              setCurrentView('interview');
            }} 
          />
        )}
        
        {currentView === 'interview' && sessionId && (
          <InterviewRoom 
            sessionId={sessionId} 
            onComplete={() => setCurrentView('report')} 
          />
        )}
        
        {currentView === 'report' && sessionId && (
          <Report 
            sessionId={sessionId} 
            onHome={() => setCurrentView('home')}
          />
        )}
      </Suspense>
      </div>
    </div>
  );
}

export default App;
