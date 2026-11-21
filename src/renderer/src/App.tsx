import React, { useEffect, useState, useCallback } from 'react';
import {
  ContainerSummary,
  ContainerMetrics,
  ContainerAction,
  ConnectionProfile
} from '../../shared/types';
import {
  Language,
  Theme,
  UserSettings,
  defaultSettings,
  translations
} from './i18n';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MetricsView } from './components/MetricsView';
import { LogsView } from './components/LogsView';
import { InspectView } from './components/InspectView';
import { TerminalView } from './components/TerminalView';
import { ConnectionModal } from './components/ConnectionModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [containers, setContainers] = useState<ContainerSummary[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<ContainerSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'inspect' | 'terminal'>('metrics');
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Settings: Theme & Language
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('dockdeck_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Apply theme class to <html>
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dockdeck_settings', JSON.stringify(settings));
  }, [settings]);

  const handleSelectLanguage = (language: Language) => {
    setSettings((prev) => ({ ...prev, language }));
  };

  const handleSelectTheme = (theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  // Metrics history (retains up to 1 week with intelligent compression)
  const [metricsHistory, setMetricsHistory] = useState<ContainerMetrics[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<ContainerMetrics | null>(null);

  // Connection management
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ConnectionProfile | undefined>();
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load containers
  const loadContainers = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await window.dockerApi.listContainers();
      setContainers(list);

      // Keep selection or pick first
      setSelectedContainer((prev) => {
        if (!prev && list.length > 0) return list[0];
        const updated = list.find((c) => c.id === prev?.id);
        return updated || list[0] || null;
      });
    } catch (err) {
      console.error('Falha ao listar containers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load profiles
  const loadProfiles = useCallback(async () => {
    try {
      const res = await window.dockerApi.getProfiles();
      setProfiles(res.profiles);
      setActiveProfile(res.active);
    } catch (err) {
      console.error('Falha ao carregar perfis:', err);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    loadContainers();

    const interval = setInterval(() => {
      loadContainers();
    }, 6000);

    return () => clearInterval(interval);
  }, [loadProfiles, loadContainers]);

  // Subscribe to live stats for selected container
  useEffect(() => {
    if (!selectedContainer || selectedContainer.state !== 'running') {
      setLatestMetrics(null);
      setMetricsHistory([]);
      return;
    }

    setLatestMetrics(null);
    setMetricsHistory([]);

    window.dockerApi.startStats(selectedContainer.id, (metrics) => {
      setLatestMetrics(metrics);
      setMetricsHistory((prev) => {
        const next = [...prev, metrics];
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // Limite de 7 dias (Semana)

        // Retenção inteligente quando o histórico cresce
        if (next.length > 30000) {
          return next
            .filter((p) => now - p.timestamp <= maxAge)
            .filter((p, idx) => {
              const age = now - p.timestamp;
              if (age < 3600 * 1000) return true;
              if (age < 24 * 3600 * 1000) return idx % 5 === 0;
              return idx % 30 === 0;
            });
        }
        return next;
      });
    });

    return () => {
      window.dockerApi.stopStats(selectedContainer.id);
    };
  }, [selectedContainer?.id, selectedContainer?.state]);

  // Execute container action
  const handleExecuteAction = async (action: ContainerAction) => {
    if (!selectedContainer) return;
    setIsActionLoading(true);
    try {
      await window.dockerApi.executeAction(selectedContainer.id, action);
      await loadContainers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Switch connection
  const handleSwitchConnection = async (profileId: string) => {
    setLatestMetrics(null);
    setMetricsHistory([]);
    setSelectedContainer(null);
    setContainers([]);

    const res = await window.dockerApi.switchConnection(profileId);
    setActiveProfile(res.active);

    const profilesRes = await window.dockerApi.getProfiles();
    setProfiles(profilesRes.profiles);

    await loadContainers();
  };

  const handleSaveProfile = async (profile: ConnectionProfile) => {
    const res = await window.dockerApi.saveProfile(profile);
    setProfiles(res.profiles);
  };

  const handleDeleteProfile = async (profileId: string) => {
    const res = await window.dockerApi.deleteProfile(profileId);
    setProfiles(res.profiles);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.classList.contains('xterm-helper-textarea')
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setIsConnectionsOpen(false);
        setIsShortcutsOpen(false);
        setIsSettingsOpen(false);
        return;
      }

      if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === '1') setActiveTab('metrics');
      if (e.key === '2') setActiveTab('logs');
      if (e.key === '3') setActiveTab('terminal');
      if (e.key === '4') setActiveTab('inspect');

      if (e.ctrlKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        loadContainers();
        return;
      }

      // Container actions
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey) {
        handleExecuteAction('restart');
      }
      if (e.key.toLowerCase() === 's') {
        handleExecuteAction('stop');
      }
      if (e.key.toLowerCase() === 'p') {
        if (selectedContainer?.state === 'paused') {
          handleExecuteAction('unpause');
        } else {
          handleExecuteAction('pause');
        }
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (containers.length === 0) return;
        const currentIndex = containers.findIndex(
          (c) => c.id === selectedContainer?.id
        );
        const nextIndex = (currentIndex + 1) % containers.length;
        setSelectedContainer(containers[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (containers.length === 0) return;
        const currentIndex = containers.findIndex(
          (c) => c.id === selectedContainer?.id
        );
        const prevIndex =
          currentIndex <= 0 ? containers.length - 1 : currentIndex - 1;
        setSelectedContainer(containers[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [containers, selectedContainer, loadContainers]);

  const tCommon = translations[settings.language].common;

  return (
    <div className="flex h-screen w-screen bg-background text-[var(--color-textMain)] overflow-hidden font-sans">
      {/* Sidebar with containers list */}
      <Sidebar
        containers={containers}
        selectedContainer={selectedContainer}
        onSelectContainer={setSelectedContainer}
        activeProfile={activeProfile}
        onOpenConnections={() => setIsConnectionsOpen(true)}
        onRefresh={loadContainers}
        isLoading={isLoading}
        language={settings.language}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar
          selectedContainer={selectedContainer}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onExecuteAction={handleExecuteAction}
          isActionLoading={isActionLoading}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenConnections={() => setIsConnectionsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          language={settings.language}
        />

        {selectedContainer ? (
          <main className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'metrics' && (
              <MetricsView
                metricsHistory={metricsHistory}
                latestMetrics={latestMetrics}
                isRunning={selectedContainer.state === 'running'}
                language={settings.language}
                theme={settings.theme}
              />
            )}
            {activeTab === 'logs' && (
              <LogsView
                containerId={selectedContainer.id}
                containerName={selectedContainer.name}
                language={settings.language}
                theme={settings.theme}
              />
            )}
            {activeTab === 'terminal' && (
              <TerminalView
                containerId={selectedContainer.id}
                containerName={selectedContainer.name}
                isRunning={selectedContainer.state === 'running'}
                language={settings.language}
                theme={settings.theme}
              />
            )}
            {activeTab === 'inspect' && (
              <InspectView
                containerId={selectedContainer.id}
                language={settings.language}
              />
            )}
          </main>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--color-textMuted)] text-xs">
            {tCommon.none}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConnectionModal
        isOpen={isConnectionsOpen}
        onClose={() => setIsConnectionsOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        onSwitchConnection={handleSwitchConnection}
        onSaveProfile={handleSaveProfile}
        onDeleteProfile={handleDeleteProfile}
        language={settings.language}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        language={settings.language}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={settings.language}
        theme={settings.theme}
        onSelectLanguage={handleSelectLanguage}
        onSelectTheme={handleSelectTheme}
      />
    </div>
  );
};

export default App;
