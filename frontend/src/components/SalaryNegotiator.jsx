import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Briefcase, DollarSign, Building, Sparkles, MessageCircle, Info, ThumbsUp, ShieldCheck, IndianRupee, Calculator, MapPin, Receipt, PieChart, Banknote } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { ALL_ROLES, ALL_COMPANIES } from '../utils/constants';

export default function SalaryNegotiator({ onBack }) {
  const [setupMode, setSetupMode] = useState(true);
  const [activeTab, setActiveTab] = useState("negotiator");

  // Negotiator State
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [currency, setCurrency] = useState("₹");
  const [tcBreakdown, setTcBreakdown] = useState({ base: "", signOn: "", annual: "", equity: "" });
  const [hrPersonality, setHrPersonality] = useState("Corporate & Fair");
  const [leverageCards, setLeverageCards] = useState([]);

  // Tax Calculator State
  const [taxCountry, setTaxCountry] = useState("India");
  const [taxCtc, setTaxCtc] = useState("");
  const [taxResult, setTaxResult] = useState(null);
  const [isCalculatingTax, setIsCalculatingTax] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [dealReached, setDealReached] = useState(false);
  const [reportCard, setReportCard] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const formatNumberInput = (value, currentCurrency) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const locale = currentCurrency === '₹' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale).format(digits);
  };

  const handleStart = () => {
    if (!role || !company || !tcBreakdown.base) return;
    setSetupMode(false);
    
    // Initial HR message
    setMessages([
      {
        role: "hr",
        content: `Hi! This is Alex, HR Director at ${company}. We're thrilled to offer you the ${role} position. We've put together a strong package for you, starting at ${currency}${tcBreakdown.base} base salary${tcBreakdown.equity ? ` with ${currency}${tcBreakdown.equity} in equity` : ''}. How does this sound?`
      }
    ]);
  };

  const calculateTax = async () => {
    if (!taxCtc) return;
    setIsCalculatingTax(true);
    setTaxResult(null);
    try {
      const res = await fetch("/api/salary/tax-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: taxCountry, ctc_amount: taxCtc, currency })
      });
      const data = await res.json();
      setTaxResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingTax(false);
    }
  };

  const fetchReportCard = async (finalHistory) => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch("/api/salary/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: finalHistory,
          role,
          company,
          initial_tc: tcBreakdown
        })
      });
      const data = await res.json();
      setReportCard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage;
    setInputMessage("");
    setLatestFeedback(null);
    
    const newMessages = [...messages, { role: "candidate", content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/salary/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: userText,
          history: messages,
          role,
          company,
          tc_breakdown: tcBreakdown,
          hr_personality: hrPersonality,
          leverage_cards: leverageCards
        })
      });

      const data = await res.json();
      
      setMessages([...newMessages, { role: "hr", content: data.reply }]);
      if (data.feedback) {
        setLatestFeedback(data.feedback);
      }
      if (data.is_offer_accepted) {
        setDealReached(true);
        fetchReportCard([...newMessages, { role: "hr", content: data.reply }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "hr", content: "I'm sorry, my connection to the HR system dropped. Can you repeat that?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden z-40 relative text-slate-200">
      <div className="max-w-6xl w-full mx-auto h-full flex flex-col pt-8">
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 self-start bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {setupMode ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl max-w-2xl w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <DollarSign size={200} />
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <h1 className="text-3xl md:text-5xl font-black text-white">
                    Salary <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Toolkit</span>
                  </h1>
                  <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                    <button 
                      onClick={() => setActiveTab("negotiator")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'negotiator' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <MessageCircle size={16} className="inline mr-2 -mt-0.5" /> Negotiator
                    </button>
                    <button 
                      onClick={() => setActiveTab("tax")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tax' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Calculator size={16} className="inline mr-2 -mt-0.5" /> Tax Calculator
                    </button>
                  </div>
                </div>

                {activeTab === 'negotiator' ? (
                  <>
                    <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                      Practice negotiating your job offer with a tough but fair AI HR Manager. Get real-time coaching on your tactics and maximize your compensation.
                    </p>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Briefcase size={16} /> Target Role
                    </label>
                    <SearchableSelect 
                      options={ALL_ROLES}
                      value={role}
                      onChange={setRole}
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Building size={16} /> Target Company
                    </label>
                    <SearchableSelect 
                      options={ALL_COMPANIES}
                      value={company}
                      onChange={setCompany}
                      placeholder="e.g. Stripe"
                    />
                  </div>
                  {role && company && (
                    <div className="bg-indigo-950/30 border border-indigo-900/50 p-4 rounded-xl flex items-start gap-3">
                      <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-sm font-bold text-indigo-300">Market Insight Panel</h4>
                        <p className="text-xs text-indigo-200/70 mt-1">
                          Based on recent data for {role} at {company}, candidates who negotiate typically increase their total compensation by 12-18%. 
                          The median base is roughly {currency}{currency === '₹' ? '30,00,000' : '145,000'}.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <IndianRupee size={16} /> Total Compensation Breakdown
                    </label>
                    <div className="flex gap-2 mb-3">
                      <select 
                        value={currency} 
                        onChange={e => setCurrency(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 focus:border-emerald-500 outline-none transition-colors text-slate-200 cursor-pointer"
                      >
                        <option value="₹">₹ (INR)</option>
                        <option value="$">$ (USD)</option>
                        <option value="€">€ (EUR)</option>
                        <option value="£">£ (GBP)</option>
                      </select>
                      <input 
                        type="text" 
                        value={tcBreakdown.base} onChange={e => setTcBreakdown({...tcBreakdown, base: formatNumberInput(e.target.value, currency)})}
                        placeholder="Base Salary (e.g. 15,00,000)"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 focus:border-emerald-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" value={tcBreakdown.signOn} onChange={e => setTcBreakdown({...tcBreakdown, signOn: formatNumberInput(e.target.value, currency)})}
                        placeholder="Sign-on Bonus" className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                      />
                      <input 
                        type="text" value={tcBreakdown.annual} onChange={e => setTcBreakdown({...tcBreakdown, annual: formatNumberInput(e.target.value, currency)})}
                        placeholder="Annual Bonus" className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                      />
                      <input 
                        type="text" value={tcBreakdown.equity} onChange={e => setTcBreakdown({...tcBreakdown, equity: formatNumberInput(e.target.value, currency)})}
                        placeholder="Equity / RSUs" className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        HR Personality
                      </label>
                      <select 
                        value={hrPersonality} onChange={e => setHrPersonality(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-colors cursor-pointer"
                      >
                        <option>Corporate & Fair</option>
                        <option>Aggressive Low-baller</option>
                        <option>Startup Founder (Equity-heavy)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        Leverage Cards
                      </label>
                      <div className="space-y-2 text-sm">
                        {[
                          "Competing Offer from FAANG",
                          "Recruiter reached out first",
                          "Currently employed & happy",
                          "Niche critical skills"
                        ].map(card => (
                          <label key={card} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                            <input 
                              type="checkbox" 
                              checked={leverageCards.includes(card)}
                              onChange={(e) => {
                                if (e.target.checked) setLeverageCards([...leverageCards, card]);
                                else setLeverageCards(leverageCards.filter(c => c !== card));
                              }}
                              className="accent-emerald-500 rounded"
                            />
                            {card}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleStart}
                    disabled={!role || !company || !tcBreakdown.base}
                    className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} /> Start Negotiation
                  </button>
                </div>
                </>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                      See exactly how much of your total package will hit your bank account. Calculate income tax, social security, and local deductions.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <MapPin size={16} /> Country
                        </label>
                        <select 
                          value={taxCountry} onChange={e => setTaxCountry(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 focus:border-emerald-500 outline-none transition-colors cursor-pointer"
                        >
                          <option>India</option>
                          <option>United States</option>
                          <option>United Kingdom</option>
                          <option>Canada</option>
                          <option>Germany</option>
                          <option>Australia</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Banknote size={16} /> Gross CTC
                        </label>
                        <div className="flex gap-2">
                          <select 
                            value={currency} onChange={e => setCurrency(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 focus:border-emerald-500 outline-none transition-colors cursor-pointer"
                          >
                            <option value="₹">₹</option>
                            <option value="$">$</option>
                            <option value="€">€</option>
                            <option value="£">£</option>
                          </select>
                          <input 
                            type="text" 
                            value={taxCtc} onChange={e => setTaxCtc(formatNumberInput(e.target.value, currency))}
                            placeholder="e.g. 25,00,000"
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 focus:border-emerald-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={calculateTax}
                      disabled={!taxCtc || isCalculatingTax}
                      className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCalculatingTax ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calculator size={20} />}
                      Calculate Take-Home Pay
                    </button>

                    {taxResult && !taxResult.error && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                          <div className="bg-emerald-950/30 p-8 flex flex-col md:flex-row items-center justify-between border-b border-slate-800/80 gap-6">
                            <div>
                              <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2"><PieChart size={16} /> Net In-Hand Salary</div>
                              <div className="text-4xl md:text-5xl font-black text-white mt-2">{taxResult.net_yearly} <span className="text-xl text-slate-500 font-bold">/ year</span></div>
                            </div>
                            <div className="md:text-right w-full md:w-auto bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly Pay</div>
                              <div className="text-3xl font-bold text-emerald-400">{taxResult.net_monthly}</div>
                            </div>
                          </div>
                          
                          <div className="p-8">
                            {/* Visual Progress Bar */}
                            <div className="mb-10">
                              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                                <span className="text-emerald-400">Take-Home ({taxResult.take_home_percentage || 70}%)</span>
                                <span className="text-rose-400">Taxes & Deductions ({taxResult.total_tax_percentage || 30}%)</span>
                              </div>
                              <div className="h-4 w-full bg-rose-500/20 rounded-full overflow-hidden flex">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${taxResult.take_home_percentage || 70}%` }}
                                  transition={{ duration: 1, delay: 0.2 }}
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative overflow-hidden"
                                >
                                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
                                </motion.div>
                              </div>
                            </div>

                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Receipt size={16} /> Tax Breakdown & Deductions</h4>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
                                <span className="text-slate-300 font-bold text-lg">Gross Total Package (CTC)</span>
                                <span className="text-white font-black text-lg">{taxResult.gross_yearly}</span>
                              </div>
                              {taxResult.deductions?.map((d, i) => (
                                <div key={i} className="flex justify-between items-center py-2 group">
                                  <div className="flex flex-col">
                                    <span className="text-rose-400 font-medium group-hover:text-rose-300 transition-colors">{d.name}</span>
                                    <span className="text-xs text-slate-500">{d.percentage}</span>
                                  </div>
                                  <span className="text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-lg">-{d.amount}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center p-5 bg-gradient-to-r from-slate-900 to-slate-900/50 rounded-xl mt-4 border border-slate-800 shadow-inner">
                                <span className="text-slate-400 font-bold">Effective Tax Rate</span>
                                <span className="text-white font-black text-xl">{taxResult.effective_tax_rate}</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-8 leading-relaxed flex items-start gap-2 bg-slate-900/30 p-4 rounded-lg">
                              <Info size={16} className="shrink-0 mt-0.5 text-slate-400" />
                              {taxResult.disclaimer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/50 font-bold">
                    A
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Alex</h3>
                    <p className="text-xs text-slate-400">HR Director @ {company}</p>
                  </div>
                </div>
                {dealReached && (
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck size={14} /> Deal Reached
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'hr' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${m.role === 'hr' ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-900/20'}`}>
                      <p className="leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 flex gap-1 items-center">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading || dealReached}
                    placeholder={dealReached ? "Negotiation concluded." : "Type your response..."}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-4 focus:border-emerald-500 outline-none disabled:opacity-50 text-slate-200"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading || dealReached}
                    className="absolute right-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Coach Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-xl flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="text-amber-400" size={24} />
                  <h2 className="text-xl font-bold text-white">Live Coach</h2>
                </div>

                {!reportCard && !isGeneratingReport && (
                  <>
                    {latestFeedback ? (
                      <motion.div 
                        key={messages.length} // forces re-animation on new feedback
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-950 border border-slate-700 p-4 rounded-xl text-slate-300 text-sm leading-relaxed relative"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl"></div>
                        {latestFeedback}
                      </motion.div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
                        <Info size={40} className="mb-4 opacity-20" />
                        <p className="text-sm">I'll provide real-time feedback on your negotiation tactics after your first message.</p>
                      </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-slate-800">
                      <h3 className="text-xs uppercase font-bold text-slate-400 mb-3">Quick Tips</h3>
                      <ul className="text-sm text-slate-400 space-y-2">
                        <li className="flex items-start gap-2"><ThumbsUp size={14} className="mt-0.5 text-emerald-500" /> Never accept the first offer immediately.</li>
                        <li className="flex items-start gap-2"><ThumbsUp size={14} className="mt-0.5 text-emerald-500" /> Use data (market rates) to justify asks.</li>
                        <li className="flex items-start gap-2"><ThumbsUp size={14} className="mt-0.5 text-emerald-500" /> Pivot to equity or sign-on bonuses if base is capped.</li>
                      </ul>
                    </div>
                  </>
                )}

                {isGeneratingReport && (
                  <div className="flex-1 flex flex-col items-center justify-center text-emerald-400 text-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold">Analyzing Negotiation...</p>
                    <p className="text-xs text-slate-400 mt-2">Generating your final report card</p>
                  </div>
                )}

                {reportCard && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                    <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 p-5 rounded-2xl mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Final Grade</h3>
                      <div className="text-5xl font-black text-white">{reportCard.grade || 'A'}</div>
                      <div className="mt-3 text-sm text-slate-300">
                        Value Gained: <span className="font-bold text-emerald-400">{reportCard.value_gained}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mb-4 text-sm text-slate-300 leading-relaxed">
                      {reportCard.feedback}
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Strengths</h3>
                      <div className="flex flex-col gap-2">
                        {reportCard.key_strengths?.map((s, i) => (
                          <div key={i} className="flex gap-2 items-start text-xs bg-emerald-500/10 text-emerald-300 p-2 rounded-lg border border-emerald-500/20">
                            <ShieldCheck size={14} className="shrink-0 mt-0.5" /> {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Missed Opportunities</h3>
                      <div className="flex flex-col gap-2">
                        {reportCard.areas_for_improvement?.map((s, i) => (
                          <div key={i} className="flex gap-2 items-start text-xs bg-rose-500/10 text-rose-300 p-2 rounded-lg border border-rose-500/20">
                            <Info size={14} className="shrink-0 mt-0.5" /> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
