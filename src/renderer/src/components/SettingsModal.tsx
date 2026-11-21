import React from 'react';
import { X, Settings as SettingsIcon, Moon, Sun, Globe } from 'lucide-react';
import { Language, Theme, translations } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: Theme;
  onSelectLanguage: (lang: Language) => void;
  onSelectTheme: (theme: Theme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  onSelectLanguage,
  onSelectTheme
}) => {
  if (!isOpen) return null;

  const t = translations[language].settings;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-accent" />
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

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Theme Option */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-textMuted)] mb-2">
              {t.theme}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectTheme('dark')}
                className={`py-2 px-3 border rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-accent/15 border-accent text-accent shadow-sm'
                    : 'border-border text-[var(--color-textMuted)] hover:bg-surfaceHover'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>{t.dark}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTheme('light')}
                className={`py-2 px-3 border rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-accent/15 border-accent text-accent shadow-sm'
                    : 'border-border text-[var(--color-textMuted)] hover:bg-surfaceHover'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>{t.light}</span>
              </button>
            </div>
          </div>

          {/* Language Option */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-textMuted)] mb-2">
              {t.language}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectLanguage('pt')}
                className={`py-2 px-3 border rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  language === 'pt'
                    ? 'bg-accent/15 border-accent text-accent shadow-sm'
                    : 'border-border text-[var(--color-textMuted)] hover:bg-surfaceHover'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>{t.pt}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectLanguage('en')}
                className={`py-2 px-3 border rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-accent/15 border-accent text-accent shadow-sm'
                    : 'border-border text-[var(--color-textMuted)] hover:bg-surfaceHover'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>{t.en}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-background/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-accent text-white rounded-md text-xs font-semibold hover:bg-accent/90 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
