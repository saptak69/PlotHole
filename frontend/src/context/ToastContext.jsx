import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Floating Avant-Garde Frosted Toast Container */}
      <div className="fixed top-6 right-6 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isInfo = t.type === 'info';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 text-xs font-mono font-bold rounded-2xl border transition-all transform animate-in slide-in-from-top-3 duration-300 backdrop-blur-2xl shadow-2xl ${
                isSuccess
                  ? 'bg-[#04100c]/90 text-[#00f5a0] border-[#00f5a0]/40 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(0,245,160,0.2)]'
                  : isError
                  ? 'bg-[#140608]/90 text-[#ff3b5c] border-[#ff3b5c]/40 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(255,59,92,0.2)]'
                  : 'bg-[#040a14]/90 text-[#00d4ff] border-[#00d4ff]/40 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(0,212,255,0.2)]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && <Sparkles className="w-4 h-4 text-[#00f5a0] shrink-0 animate-pulse" />}
                {isError && <AlertCircle className="w-4 h-4 text-[#ff3b5c] shrink-0" />}
                {isInfo && <Info className="w-4 h-4 text-[#00d4ff] shrink-0" />}
                <span className="text-slate-100 font-sans text-xs font-semibold leading-snug truncate">
                  {t.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
