import React from 'react';
import { Keyboard, X } from 'lucide-react';
import GlassSurface from './GlassSurface';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ / Ctrl + K', description: 'Open Global Film & Series Search' },
    { key: '⌘ / Ctrl + L', description: 'Quick Review a Movie / Show' },
    { key: '?', description: 'Toggle Keyboard Shortcuts Modal' },
    { key: 'Esc', description: 'Close any active overlay or modal' }
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={28}
        backgroundOpacity={0.88}
        blur={32}
        borderOpacity={0.2}
        className="max-w-md shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(0,245,160,0.12)]"
      >
        <div className="w-full text-slate-100">
          <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00f5a0]/15 border border-[#00f5a0]/30 flex items-center justify-center text-[#00f5a0] shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-display font-bold text-sm text-slate-100 uppercase tracking-wide block text-left">
                  Hotkeys & Shortcuts
                </span>
                <span className="font-mono text-[10px] text-slate-400 uppercase text-left block">Cinephile navigation map</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-left font-sans">
            <div className="divide-y divide-white/8">
              {shortcuts.map((sc) => (
                <div key={sc.key} className="py-3 flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-sans font-medium">{sc.description}</span>
                  <kbd className="px-2.5 py-1 bg-black/60 border border-white/15 text-[#00f5a0] font-mono font-bold text-[11px] rounded-lg shadow">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button onClick={onClose} className="btn-primary w-full py-2.5 text-xs font-bold uppercase shadow-md cursor-pointer">
                Got It
              </button>
            </div>
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}
