import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
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
      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3 text-xs font-mono font-bold border-3 border-brand-border shadow-[4px_4px_0_#f2e9d8] transition-all transform animate-in slide-in-from-top-2 duration-200 ${
              t.type === 'success'
                ? 'bg-[#1b1810] text-[#f4c430] border-[#f4c430]'
                : t.type === 'error'
                ? 'bg-[#1b1810] text-[#ff4757] border-[#ff4757]'
                : 'bg-[#1b1810] text-[#3aa6e0] border-[#3aa6e0]'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#f4c430] shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#ff4757] shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#3aa6e0] shrink-0" />}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-brand-text-muted hover:text-brand-text transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
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
