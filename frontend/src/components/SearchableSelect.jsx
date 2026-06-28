import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onChange(searchTerm.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          {Icon && <Icon size={16} className="text-slate-400 flex-shrink-0" />}
          <span className={`truncate ${value ? 'text-slate-200' : 'text-slate-500'}`}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-800">
              <form onSubmit={handleCustomSubmit} className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-slate-400" />
                <input 
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type custom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-slate-200"
                />
              </form>
            </div>

            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSelect(option)}
                    className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <span>{option}</span>
                    {value === option && <Check size={16} className="text-indigo-400" />}
                  </div>
                ))
              ) : (
                <div 
                  onClick={() => handleSelect(searchTerm)}
                  className="px-4 py-3 text-sm text-indigo-400 hover:bg-indigo-500/10 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <span>Use "{searchTerm}"</span>
                  <Check size={16} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
