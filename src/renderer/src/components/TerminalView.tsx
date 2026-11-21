import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { RotateCw, Trash2, Terminal as TerminalIcon } from 'lucide-react';
import { Language, Theme, translations } from '../i18n';

interface TerminalViewProps {
  containerId: string;
  containerName: string;
  isRunning: boolean;
  language: Language;
  theme: Theme;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  containerId,
  containerName,
  isRunning,
  language,
  theme
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const t = translations[language].terminal;

  const startSession = () => {
    if (!isRunning || !terminalRef.current) return;

    setStatus('connecting');

    if (termInstance.current) {
      termInstance.current.dispose();
      termInstance.current = null;
    }

    const isDark = theme === 'dark';

    const term = new Terminal({
      theme: isDark
        ? {
            background: '#0d1117',
            foreground: '#c9d1d9',
            cursor: '#58a6ff',
            cursorBlink: true,
            selectionBackground: '#264f78'
          }
        : {
            background: '#ffffff',
            foreground: '#1f2328',
            cursor: '#0969da',
            cursorBlink: true,
            selectionBackground: '#b6d7fe'
          },
      fontFamily: 'monospace, Fira Code, JetBrains Mono',
      fontSize: 12,
      lineHeight: 1.25,
      cursorStyle: 'block'
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    termInstance.current = term;

    term.writeln(`\x1b[38;5;39m⚡ ${containerName}...\x1b[0m\r\n`);

    window.dockerApi
      .startExec(
        containerId,
        (data: string) => {
          term.write(data);
        },
        () => {
          term.writeln('\r\n\x1b[38;5;208m[Exit]\x1b[0m\r\n');
          setStatus('disconnected');
        }
      )
      .then(({ sessionId }) => {
        sessionIdRef.current = sessionId;
        setStatus('connected');

        term.onData((input) => {
          if (sessionIdRef.current) {
            window.dockerApi.sendExecInput(sessionIdRef.current, input);
          }
        });

        window.dockerApi.resizeExec(sessionId, term.cols, term.rows);
      })
      .catch((err: any) => {
        term.writeln(`\r\n\x1b[38;5;196mError: ${err.message}\x1b[0m\r\n`);
        setStatus('disconnected');
      });
  };

  useEffect(() => {
    startSession();

    const handleResize = () => {
      if (termInstance.current && sessionIdRef.current) {
        window.dockerApi.resizeExec(
          sessionIdRef.current,
          termInstance.current.cols,
          termInstance.current.rows
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sessionIdRef.current) {
        window.dockerApi.stopExec(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      if (termInstance.current) {
        termInstance.current.dispose();
        termInstance.current = null;
      }
    };
  }, [containerId, isRunning, theme]);

  if (!isRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--color-textMuted)]">
        <TerminalIcon className="w-12 h-12 text-[var(--color-textMuted)] mb-3" />
        <h3 className="text-sm font-semibold text-[var(--color-textMain)]">{t.stopped}</h3>
        <p className="text-xs text-[var(--color-textMuted)] mt-1">
          {t.stoppedDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Top Controls */}
      <div className="h-10 bg-surface border-b border-border flex items-center justify-between px-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-400'
                : status === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-400'
            }`}
          />
          <span className="font-mono text-[var(--color-textMuted)] text-[11px]">
            {status === 'connected'
              ? t.connected
              : status === 'connecting'
              ? t.connecting
              : t.disconnected}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startSession}
            className="px-2.5 py-1 text-[11px] bg-surfaceHover hover:bg-border text-[var(--color-textMain)] border border-border rounded font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCw className="w-3 h-3 text-accent" />
            <span>{t.reconnect}</span>
          </button>

          <button
            onClick={() => termInstance.current?.clear()}
            className="p-1.5 text-[var(--color-textMuted)] hover:text-[var(--color-textMain)] hover:bg-surfaceHover rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 p-2 bg-background overflow-hidden">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
};
