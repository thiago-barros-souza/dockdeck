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
  Server,
  Settings as SettingsIcon
} from 'lucide-react';
import { Language, translations } from '../i18n';

interface TopBarProps {
  selectedContainer: ContainerSummary | null;
  activeTab: 'metrics' | 'logs' | 'inspect' | 'terminal';
  onChangeTab: (tab: 'metrics' | 'logs' | 'inspect' | 'terminal') => void;
  onExecuteAction: (action: ContainerAction) => void;
  isActionLoading: boolean;
  onOpenShortcuts: () => void;
  onOpenConnections: () => void;
  onOpenSettings: () => void;
  language: Language;
}

export const TopBar: React.FC<TopBarProps> = ({
  selectedContainer,
  activeTab,
  onChangeTab,
  onExecuteAction,
  isActionLoading,
  onOpenShortcuts,
  onOpenConnections,
  onOpenSettings,
  language
}) => {
  const t = translations[language];

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Container info */}
      <div className="flex items-center gap-3 min-w-0">
        {selectedContainer ? (
          <>
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-sm text-[var(--color-textMain)] truncate">
                {selectedContainer.name}
              </span>
              <span className="text-xs font-mono text-[var(--color-textMuted)]">
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
                  title="Start"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{t.actions.start}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onExecuteAction('restart')}
                    disabled={isActionLoading}
                    className="px-2.5 py-1 text-xs bg-surfaceHover hover:bg-border text-[var(--color-textMain)] border border-border rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Restart (R)"
                  >
                    <RotateCw className="w-3 h-3 text-accent" />
                    <span>{t.actions.restart}</span>
                  </button>

                  <button
                    onClick={() => onExecuteAction('stop')}
                    disabled={isActionLoading}
                    className="px-2.5 py-1 text-xs bg-surfaceHover hover:bg-rose-950/40 text-rose-500 border border-rose-500/30 rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Stop (S)"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>{t.actions.stop}</span>
                  </button>

                  {selectedContainer.state === 'paused' ? (
                    <button
                      onClick={() => onExecuteAction('unpause')}
                      disabled={isActionLoading}
                      className="px-2.5 py-1 text-xs bg-surfaceHover hover:bg-border text-amber-500 border border-amber-500/30 rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Unpause"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t.actions.unpause}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onExecuteAction('pause')}
                      disabled={isActionLoading}
                      className="px-2 py-1 text-xs text-[var(--color-textMuted)] hover:text-amber-500 hover:bg-surfaceHover rounded transition-colors disabled:opacity-50"
                      title="Pause (P)"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => onExecuteAction('remove')}
                disabled={isActionLoading}
                className="px-2 py-1 text-xs text-[var(--color-textMuted)] hover:text-rose-500 hover:bg-surfaceHover rounded transition-colors disabled:opacity-50"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <span className="text-xs text-[var(--color-textMuted)]">
            {t.common.none}
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
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t.tabs.metrics}</span>
          </button>

          <button
            onClick={() => onChangeTab('logs')}
            className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'logs'
                ? 'bg-surface text-accent shadow-sm'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.tabs.logs}</span>
          </button>

          <button
            onClick={() => onChangeTab('terminal')}
            className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'terminal'
                ? 'bg-surface text-accent shadow-sm'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{t.tabs.terminal}</span>
          </button>

          <button
            onClick={() => onChangeTab('inspect')}
            className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'inspect'
                ? 'bg-surface text-accent shadow-sm'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t.tabs.inspect}</span>
          </button>
        </div>
      )}

      {/* Right: Servers, Settings & Help */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenConnections}
          className="p-1.5 text-[var(--color-textMuted)] hover:text-[var(--color-textMain)] hover:bg-surfaceHover rounded-md transition-colors"
          title={t.servers.title}
        >
          <Server className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 text-[var(--color-textMuted)] hover:text-accent hover:bg-surfaceHover rounded-md transition-colors"
          title={t.settings.title}
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-[var(--color-textMuted)] hover:text-accent hover:bg-surfaceHover rounded-md transition-colors"
          title={t.shortcuts.title}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
