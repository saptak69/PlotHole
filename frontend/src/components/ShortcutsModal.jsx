import React from 'react';
import { Keyboard, X } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ / Ctrl + K', description: 'Open Global Film & TV Search' },
    { key: '⌘ / Ctrl + L', description: 'Quick Log a Movie / Show' },
    { key: 'Shift + A', description: 'Open AI Director Assistant' },
    { key: '?', description: 'Toggle Keyboard Shortcuts Modal' },
    { key: 'Esc', description: 'Close any active overlay or modal' }
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="win95-notepad w-full max-w-md border-3 border-brand-border bg-brand-bg text-brand-text shadow-[8px_8px_0_#3aa6e0]">
        <div className="win95-titlebar bg-comic-blue/20 px-4 py-3 border-b-3 border-brand-border flex justify-between items-center">
          <div className="flex items-center gap-2 font-bangers text-xl tracking-wider text-comic-blue">
            <Keyboard className="w-5 h-5 text-comic-blue" />
            <span>HOTKEYS & SHORTCUTS</span>
          </div>
          <button onClick={onClose} className="win95-btn">X</button>
        </div>

        <div className="p-6 space-y-4 text-left font-mono">
          <div className="divide-y divide-brand-border/40">
            {shortcuts.map((sc) => (
              <div key={sc.key} className="py-3 flex justify-between items-center text-xs">
                <span className="text-brand-text-muted font-sans font-semibold">{sc.description}</span>
                <kbd className="px-2.5 py-1 bg-brand-card border-2 border-brand-border text-comic-yellow font-mono font-extrabold rounded shadow-[2px_2px_0_#f2e9d8]">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button onClick={onClose} className="btn-primary w-full py-2.5 text-xs font-bold uppercase">
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
