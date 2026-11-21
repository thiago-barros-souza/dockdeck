import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { Language, translations } from '../i18n';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  if (!isOpen) return null;

  const t = translations[language].shortcuts;

  const shortcuts = [
    { key: '↑ / ↓', desc: t.navigate },
    { key: '1', desc: t.metrics },
    { key: '2', desc: t.logs },
    { key: '3', desc: t.terminal },
    { key: '4', desc: t.inspect },
    { key: 'R', desc: t.restart },
    { key: 'S', desc: t.stop },
    { key: 'P', desc: t.pause },
    { key: 'Ctrl + R', desc: t.reload },
    { key: '?', desc: t.help },
    { key: 'Esc', desc: t.close }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold text-[var(--color-textMain)]">
              {t.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-textMuted)] hover:text-[var(--color-textMain)] p-1 rounded-md hover:bg-surfaceHover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0"
            >
              <span className="text-[var(--color-textMuted)]">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-background border border-border rounded text-[11px] font-mono text-accent font-semibold shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
