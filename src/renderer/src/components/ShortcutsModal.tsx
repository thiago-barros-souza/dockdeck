import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '↑ / ↓', desc: 'Navegar na lista de containers' },
    { key: '1', desc: 'Abrir aba de Métricas' },
    { key: '2', desc: 'Abrir aba de Logs' },
    { key: '3', desc: 'Abrir aba de Inspecionar' },
    { key: 'R', desc: 'Reiniciar container selecionado' },
    { key: 'S', desc: 'Parar container selecionado' },
    { key: 'P', desc: 'Pausar / Despausar container' },
    { key: 'Ctrl + R', desc: 'Recarregar lista de containers' },
    { key: '?', desc: 'Abrir este menu de ajuda' },
    { key: 'Esc', desc: 'Fechar modais' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold text-gray-100">
              Atalhos de Teclado (Estilo Lazydocker)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-surfaceHover transition-colors"
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
              <span className="text-gray-400">{s.desc}</span>
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
