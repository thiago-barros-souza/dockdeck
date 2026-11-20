import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import {
  Search,
  ArrowDown,
  Trash2,
  Download,
  Filter
} from 'lucide-react';

interface LogsViewProps {
  containerId: string;
  containerName: string;
}

export const LogsView: React.FC<LogsViewProps> = ({
  containerId,
  containerName
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [tailCount, setTailCount] = useState(250);
  const logsBufferRef = useRef<string[]>([]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      theme: {
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
  }, [containerId, tailCount]);

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
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-500" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Buscar nos logs..."
              className="pl-7 pr-2 py-1 bg-background border border-border rounded text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent w-48 font-mono"
            />
          </div>

          {/* Tail selector */}
          <div className="flex items-center gap-1 text-gray-400 font-mono text-[11px]">
            <span>Tail:</span>
            <select
              value={tailCount}
              onChange={(e) => setTailCount(Number(e.target.value))}
              className="bg-background border border-border rounded px-1.5 py-0.5 text-gray-200 focus:outline-none"
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
                : 'text-gray-400 hover:bg-surfaceHover border border-transparent'
            }`}
            title="Rolar automaticamente para o final"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Auto-scroll</span>
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-surfaceHover rounded transition-colors"
            title="Baixar logs em arquivo .txt"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-surfaceHover rounded transition-colors"
            title="Limpar tela de logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 p-2 bg-[#0d1117] overflow-hidden">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
};
