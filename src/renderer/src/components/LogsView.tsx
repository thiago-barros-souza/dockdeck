import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Search, ArrowDown, Trash2, Download } from 'lucide-react';
import { Language, Theme, translations } from '../i18n';

interface LogsViewProps {
  containerId: string;
  containerName: string;
  language: Language;
  theme: Theme;
}

export const LogsView: React.FC<LogsViewProps> = ({
  containerId,
  containerName,
  language,
  theme
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [tailCount, setTailCount] = useState(250);
  const logsBufferRef = useRef<string[]>([]);

  const t = translations[language].logs;

  useEffect(() => {
    if (!terminalRef.current) return;

    const isDark = theme === 'dark';

    // Initialize xterm
    const term = new Terminal({
      theme: isDark
        ? {
            background: '#0d1117',
            foreground: '#c9d1d9',
            cursor: '#58a6ff',
            selectionBackground: '#264f78',
            black: '#010409',
            red: '#ff7b72',
            green: '#3fb950',
            yellow: '#d29922',
            blue: '#58a6ff',
            magenta: '#bc8cff',
            cyan: '#39c5cf',
            white: '#d0d7de'
          }
        : {
            background: '#ffffff',
            foreground: '#1f2328',
            cursor: '#0969da',
            selectionBackground: '#b6d7fe',
            black: '#24292f',
            red: '#cf222e',
            green: '#1a7f37',
            yellow: '#9a6700',
            blue: '#0969da',
            magenta: '#8250df',
            cyan: '#1b7c83',
            white: '#ffffff'
          },
      fontFamily: 'monospace, Fira Code, JetBrains Mono',
      fontSize: 12,
      lineHeight: 1.25,
      scrollback: 5000,
      cursorBlink: false,
      convertEol: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    termInstance.current = term;
    fitAddonRef.current = fitAddon;
    logsBufferRef.current = [];

    // Handle window resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    // Start logs stream
    window.dockerApi.startLogs(containerId, tailCount, (chunk: string) => {
      logsBufferRef.current.push(chunk);
      if (termInstance.current) {
        termInstance.current.write(chunk);
        if (autoScroll) {
          termInstance.current.scrollToBottom();
        }
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.dockerApi.stopLogs(containerId);
      term.dispose();
      termInstance.current = null;
    };
  }, [containerId, tailCount, theme]);

  const handleClear = () => {
    if (termInstance.current) {
      termInstance.current.clear();
      logsBufferRef.current = [];
    }
  };

  const handleDownload = () => {
    const content = logsBufferRef.current.join('');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${containerName}-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Logs Controls */}
      <div className="h-10 bg-surface border-b border-border flex items-center justify-between px-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[var(--color-textMuted)]" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pl-7 pr-2 py-1 bg-background border border-border rounded text-[11px] text-[var(--color-textMain)] placeholder-[var(--color-textMuted)] focus:outline-none focus:border-accent w-48 font-mono"
            />
          </div>

          {/* Tail selector */}
          <div className="flex items-center gap-1 text-[var(--color-textMuted)] font-mono text-[11px]">
            <span>{t.tail}</span>
            <select
              value={tailCount}
              onChange={(e) => setTailCount(Number(e.target.value))}
              className="bg-background border border-border rounded px-1.5 py-0.5 text-[var(--color-textMain)] focus:outline-none"
            >
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll button */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 font-mono transition-colors ${
              autoScroll
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-[var(--color-textMuted)] hover:bg-surfaceHover border border-transparent'
            }`}
          >
            <ArrowDown className="w-3 h-3" />
            <span>{t.scroll}</span>
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownload}
            className="p-1.5 text-[var(--color-textMuted)] hover:text-[var(--color-textMain)] hover:bg-surfaceHover rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="p-1.5 text-[var(--color-textMuted)] hover:text-rose-500 hover:bg-surfaceHover rounded transition-colors"
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
