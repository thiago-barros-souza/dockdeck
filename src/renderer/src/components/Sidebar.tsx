import React, { useState } from 'react';
import {
  ContainerSummary,
  ConnectionProfile
} from '../../../shared/types';
import {
  Server,
  Search,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Language, translations } from '../i18n';

interface SidebarProps {
  containers: ContainerSummary[];
  selectedContainer: ContainerSummary | null;
  onSelectContainer: (container: ContainerSummary) => void;
  activeProfile?: ConnectionProfile;
  onOpenConnections: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  containers,
  selectedContainer,
  onSelectContainer,
  activeProfile,
  onOpenConnections,
  onRefresh,
  isLoading,
  language
}) => {
  const [filter, setFilter] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'running' | 'exited'>('all');
  const t = translations[language].sidebar;

  const filtered = containers.filter((c) => {
    const matchesText =
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.image.toLowerCase().includes(filter.toLowerCase()) ||
      c.shortId.toLowerCase().includes(filter.toLowerCase());

    if (!matchesText) return false;
    if (filterState === 'running') return c.state === 'running';
    if (filterState === 'exited') return c.state === 'exited';
    return true;
  });

  const getStatusColor = (state: ContainerSummary['state']) => {
    switch (state) {
      case 'running':
        return 'bg-emerald-600 text-white font-semibold border-emerald-500/40';
      case 'paused':
        return 'bg-amber-600 text-white font-semibold border-amber-500/40';
      case 'restarting':
        return 'bg-cyan-600 text-white font-semibold border-cyan-500/40';
      case 'exited':
      case 'dead':
        return 'bg-rose-600 text-white font-semibold border-rose-500/40';
      default:
        return 'bg-gray-600 text-white font-semibold border-gray-500/40';
    }
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-surface border-r border-border flex flex-col h-full select-none">
      {/* Header / Active Connection */}
      <div className="p-3 border-b border-border bg-surface flex items-center justify-between">
        <button
          onClick={onOpenConnections}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-surfaceHover transition-colors text-left max-w-[210px] truncate group"
          title={activeProfile?.name || t.local}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <Server className="w-4 h-4 text-accent flex-shrink-0" />
          <div className="truncate">
            <div className="text-xs font-semibold text-[var(--color-textMain)] truncate">
              {activeProfile?.name || t.local}
            </div>
            <div className="text-[10px] text-[var(--color-textMuted)] uppercase tracking-wider font-mono">
              {activeProfile?.type === 'ssh' ? `SSH: ${activeProfile.host}` : t.local}
            </div>
          </div>
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-1.5 text-[var(--color-textMuted)] hover:text-[var(--color-textMain)] hover:bg-surfaceHover rounded-md transition-colors ${
            isLoading ? 'animate-spin text-accent' : ''
          }`}
          title="Refresh (Ctrl+R)"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--color-textMuted)]" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t.filterPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-xs text-[var(--color-textMain)] placeholder-[var(--color-textMuted)] focus:outline-none focus:border-accent font-mono"
          />
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setFilterState('all')}
            className={`flex-1 py-1 text-[11px] rounded transition-colors ${
              filterState === 'all'
                ? 'bg-accent/15 text-accent font-medium'
                : 'text-[var(--color-textMuted)] hover:bg-surfaceHover'
            }`}
          >
            {t.all} ({containers.length})
          </button>
          <button
            onClick={() => setFilterState('running')}
            className={`flex-1 py-1 text-[11px] rounded transition-colors ${
              filterState === 'running'
                ? 'bg-emerald-500/15 text-emerald-500 font-medium'
                : 'text-[var(--color-textMuted)] hover:bg-surfaceHover'
            }`}
          >
            {t.running} ({containers.filter((c) => c.state === 'running').length})
          </button>
          <button
            onClick={() => setFilterState('exited')}
            className={`flex-1 py-1 text-[11px] rounded transition-colors ${
              filterState === 'exited'
                ? 'bg-rose-500/15 text-rose-500 font-medium'
                : 'text-[var(--color-textMuted)] hover:bg-surfaceHover'
            }`}
          >
            {t.exited} ({containers.filter((c) => c.state === 'exited').length})
          </button>
        </div>
      </div>

      {/* Container List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--color-textMuted)]">
            {t.empty}
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = selectedContainer?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => onSelectContainer(c)}
                className={`p-3 cursor-pointer transition-all flex items-start gap-2.5 text-left border-l-2 ${
                  isSelected
                    ? 'bg-surfaceHover border-accent shadow-sm'
                    : 'border-transparent hover:bg-surfaceHover/50'
                }`}
              >
                {/* Status Dot */}
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    c.state === 'running'
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                      : c.state === 'paused'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-accent font-bold' : 'text-[var(--color-textMain)]'
                      }`}
                    >
                      {c.name}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-textMuted)] flex-shrink-0">
                      {c.shortId}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--color-textMuted)] font-mono truncate mt-0.5">
                    {c.image}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase font-semibold text-white ${getStatusColor(
                        c.state
                      )}`}
                    >
                      {c.state}
                    </span>

                    {c.project && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-border text-[var(--color-textMain)] font-mono flex items-center gap-1 truncate">
                        <Layers className="w-2.5 h-2.5 text-accent" />
                        {c.project}
                      </span>
                    )}

                    {c.ports.length > 0 && (
                      <span className="text-[10px] text-[var(--color-textMuted)] font-mono truncate">
                        :{c.ports.find((p) => p.publicPort)?.publicPort || c.ports[0].privatePort}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && <ChevronRight className="w-4 h-4 text-accent self-center" />}
              </div>
            );
          })
        )}
      </div>

      {/* Footer shortcut helper */}
      <div className="p-2 border-t border-border bg-background/50 text-[10px] text-[var(--color-textMuted)] flex items-center justify-between font-mono">
        <span>↑ / ↓</span>
        <span>R, S, P</span>
      </div>
    </aside>
  );
};
