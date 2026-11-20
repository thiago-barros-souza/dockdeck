import React, { useEffect, useState } from 'react';
import { ContainerInspectData } from '../../../shared/types';
import {
  Copy,
  Check,
  FileCode,
  HardDrive,
  Network,
  Settings,
  Layers
} from 'lucide-react';

interface InspectViewProps {
  containerId: string;
}

export const InspectView: React.FC<InspectViewProps> = ({ containerId }) => {
  const [data, setData] = useState<ContainerInspectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'env' | 'mounts' | 'networks' | 'json'>('details');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    window.dockerApi
      .inspectContainer(containerId)
      .then((inspect) => {
        if (isMounted) {
          setData(inspect);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [containerId]);

  const handleCopyJson = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-gray-500 font-mono">
        Carregando detalhes do container...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-rose-400 font-mono">
        Falha ao inspecionar o container.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Sub Tabs */}
      <div className="h-10 bg-surface border-b border-border flex items-center justify-between px-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('details')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'details'
                ? 'bg-accent/15 text-accent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveSubTab('env')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'env'
                ? 'bg-accent/15 text-accent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Variáveis de Ambiente ({data.config.env?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('mounts')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'mounts'
                ? 'bg-accent/15 text-accent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Volumes ({data.mounts?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('networks')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'networks'
                ? 'bg-accent/15 text-accent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Rede
          </button>
          <button
            onClick={() => setActiveSubTab('json')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'json'
                ? 'bg-accent/15 text-accent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            JSON Raw
          </button>
        </div>

        <button
          onClick={handleCopyJson}
          className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-200 hover:bg-surfaceHover rounded text-[11px] font-mono transition-colors"
          title="Copiar JSON completo"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar JSON</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-gray-300">
        {activeSubTab === 'details' && (
          <div className="space-y-4 max-w-4xl">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-2.5">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-gray-500">ID Completo:</span>
                <span className="text-gray-200 select-all">{data.id}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-gray-500">Nome:</span>
                <span className="text-gray-200">{data.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-gray-500">Imagem:</span>
                <span className="text-gray-200">{data.image}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-gray-500">Criado em:</span>
                <span className="text-gray-200">
                  {new Date(data.created).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-gray-500">Comando:</span>
                <span className="text-gray-200">
                  {data.path} {data.args.join(' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Diretório de Trabalho:</span>
                <span className="text-gray-200">
                  {data.config.workingDir || '/'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'env' && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-background text-gray-500 border-b border-border text-[11px]">
                <tr>
                  <th className="p-2.5">Chave</th>
                  <th className="p-2.5">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.config.env.map((envStr, i) => {
                  const [key, ...vals] = envStr.split('=');
                  const value = vals.join('=');
                  return (
                    <tr key={i} className="hover:bg-surfaceHover/50">
                      <td className="p-2.5 text-accent font-semibold">{key}</td>
                      <td className="p-2.5 text-gray-300 break-all select-all">
                        {value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'mounts' && (
          <div className="space-y-3">
            {data.mounts.length === 0 ? (
              <div className="text-gray-500 p-4">Nenhum volume montado.</div>
            ) : (
              data.mounts.map((m, i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-lg p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-accent uppercase font-bold">
                      {m.type}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        m.rw
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {m.rw ? 'Read/Write (rw)' : 'Read-Only (ro)'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Origem (Host): </span>
                    <span className="text-gray-200 select-all">{m.source}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Destino (Container): </span>
                    <span className="text-gray-200 select-all">
                      {m.destination}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === 'networks' && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-gray-500">Endereço IP:</span>
                <span className="text-gray-200 font-bold select-all">
                  {data.networkSettings.ipAddress || 'Host Network'}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-gray-500">Gateway:</span>
                <span className="text-gray-200">
                  {data.networkSettings.gateway || '--'}
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-300 mb-2">
                Redes Conectadas
              </h4>
              <div className="space-y-2">
                {Object.entries(data.networkSettings.networks).map(
                  ([netName, netConfig]: [string, any]) => (
                    <div
                      key={netName}
                      className="border border-border/60 rounded p-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="text-accent font-semibold">{netName}</span>
                      <span className="text-gray-400 font-mono">
                        IP: {netConfig.IPAddress || '--'} | Gateway:{' '}
                        {netConfig.Gateway || '--'}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'json' && (
          <pre className="bg-[#0d1117] border border-border rounded-lg p-4 text-[11px] overflow-x-auto text-gray-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
