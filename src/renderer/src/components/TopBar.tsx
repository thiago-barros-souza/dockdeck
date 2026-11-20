import React from 'react';
import {
  ContainerSummary,
  ContainerAction
} from '../../../shared/types';
import {
  Play,
  Square,
  RotateCw,
  Pause,
  Trash2,
  Terminal,
  Activity,
  FileText,
  Search,
  HelpCircle,
  Server
} from 'lucide-react';

interface TopBarProps {
  selectedContainer: ContainerSummary | null;
  activeTab: 'metrics' | 'logs' | 'inspect';
  onChangeTab: (tab: 'metrics' | 'logs' | 'inspect') => void;
  onExecuteAction: (action: ContainerAction) => void;
  isActionLoading: boolean;
  onOpenShortcuts: () => void;
  onOpenConnections: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  selectedContainer,
  activeTab,
  onChangeTab,
  onExecuteAction,
  isActionLoading,
  onOpenShortcuts,
  onOpenConnections
}) => {
  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Container info */}
      <div className="flex items-center gap-3 min-w-0">
        {selectedContainer ? (
          <>
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-sm text-gray-100 truncate">
                {selectedContainer.name}
              </span>
              <span className="text-xs font-mono text-gray-500">
                ({selectedContainer.shortId})
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 border-l border-border pl-3">
              {selectedContainer.state !== 'running' ? (
                <button
                  onClick={() => onExecuteAction('start')}
                  disabled={isActionLoading}
                  className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Iniciar Container"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onExecuteAction('restart')}
                    disabled={isActionLoading}
                    className="px-2.5 py-1 text-xs bg-surfaceHover hover:bg-border text-gray-200 border border-border rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Reiniciar Container (R)"
                  >
                    <RotateCw className="w-3 h-3 text-accent" />
                    <span>Restart</span>
                  </button>

                  <button
                    onClick={() => onExecuteAction('stop')}
                    disabled={isActionLoading}
                    className="px-2.5 py-1 text-xs bg-surfaceHover hover:bg-rose-950/40 text-rose-400 border border-rose-500/30 rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Parar Container (S)"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>

                  {selectedContainer.state === 'paused' ? (
                    <button
                      onClick={() => onExecuteAction('unpause')}
                      disabled={isActionLoading}
                      className="px-2.5 py-1 text-xs bg-surfaceHover hover:bg-border text-amber-400 border border-amber-500/30 rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Despausar"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Unpause</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onExecuteAction('pause')}
                      disabled={isActionLoading}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-amber-400 hover:bg-surfaceHover rounded transition-colors disabled:opacity-50"
                      title="Pausar (P)"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => onExecuteAction('remove')}
                disabled={isActionLoading}
                className="px-2 py-1 text-xs text-gray-400 hover:text-rose-400 hover:bg-surfaceHover rounded transition-colors disabled:opacity-50"
                title="Remover container"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <span className="text-xs text-gray-500">
            Nenhum container selecionado
          </span>
        )}
      </div>

      {/* Center: Tabs switcher */}
      {selectedContainer && (
        <div className="flex bg-background border border-border p-0.5 rounded-lg">
          <button
            onClick={() => onChangeTab('metrics')}
            className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'metrics'
                ? 'bg-surface text-accent shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Métricas</span>
          </button>

          <button
            onClick={() => onChangeTab('logs')}
            className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'logs'
                ? 'bg-surface text-accent shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Logs</span>
          </button>

          <button
            onClick={() => onChangeTab('inspect')}
            className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'inspect'
                ? 'bg-surface text-accent shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Inspecionar</span>
          </button>
        </div>
      )}

      {/* Right: Help & Shortcuts */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenConnections}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-surfaceHover rounded-md transition-colors"
          title="Gerenciar Conexões e Servidores"
        >
          <Server className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-gray-400 hover:text-accent hover:bg-surfaceHover rounded-md transition-colors"
          title="Atalhos de Teclado (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
