import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { RotateCw, Trash2, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalViewProps {
  containerId: string;
  containerName: string;
  isRunning: boolean;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  containerId,
  containerName,
  isRunning
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const startSession = () => {
    if (!isRunning || !terminalRef.current) return;

    setStatus('connecting');

    // Dispose old term if any
    if (termInstance.current) {
      termInstance.current.dispose();
      termInstance.current = null;
    }

    const term = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorBlink: true,
        selectionBackground: '#264f78'
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

    term.writeln(`\x1b[38;5;39m⚡ Conectando ao shell do container ${containerName}...\x1b[0m\r\n`);

    window.dockerApi
      .startExec(
        containerId,
        (data: string) => {
          term.write(data);
        },
        () => {
          term.writeln('\r\n\x1b[38;5;208m[Sessão do shell encerrada]\x1b[0m\r\n');
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

        // Resize
        window.dockerApi.resizeExec(sessionId, term.cols, term.rows);
      })
      .catch((err: any) => {
        term.writeln(`\r\n\x1b[38;5;196mErro ao iniciar shell: ${err.message}\x1b[0m\r\n`);
        setStatus('disconnected');
      });
  };

  useEffect(() => {
    startSession();

    const handleResize = () => {
      if (termInstance.current && sessionIdRef.current) {
        // Fit and resize
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
  }, [containerId, isRunning]);

  if (!isRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <TerminalIcon className="w-12 h-12 text-gray-600 mb-3" />
        <h3 className="text-sm font-semibold text-gray-300">Container Parado</h3>
        <p className="text-xs text-gray-500 mt-1">
          Inicie o container para abrir um shell interativo (bash/sh).
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
          <span className="font-mono text-gray-400 text-[11px]">
            {status === 'connected'
              ? 'Shell Ativo (bash / sh)'
              : status === 'connecting'
              ? 'Conectando...'
              : 'Desconectado'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startSession}
            className="px-2.5 py-1 text-[11px] bg-surfaceHover hover:bg-border text-gray-200 border border-border rounded font-medium flex items-center gap-1 transition-colors"
            title="Reconectar Shell"
          >
            <RotateCw className="w-3 h-3 text-accent" />
            <span>Reconectar</span>
          </button>

          <button
            onClick={() => termInstance.current?.clear()}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-surfaceHover rounded transition-colors"
            title="Limpar Terminal"
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
