import React, { useEffect, useState } from 'react';
import { ContainerInspectData } from '../../../shared/types';
import { Copy, Check } from 'lucide-react';
import { Language, translations } from '../i18n';

interface InspectViewProps {
  containerId: string;
  language: Language;
}

export const InspectView: React.FC<InspectViewProps> = ({ containerId, language }) => {
  const [data, setData] = useState<ContainerInspectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'env' | 'mounts' | 'networks' | 'json'>('details');

  const t = translations[language].inspect;

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
      <div className="flex-1 flex items-center justify-center text-xs text-[var(--color-textMuted)] font-mono">
        ...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-rose-500 font-mono">
        Error
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
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            {t.general}
          </button>
          <button
            onClick={() => setActiveSubTab('env')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'env'
                ? 'bg-accent/15 text-accent'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            {t.variables} ({data.config.env?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('mounts')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'mounts'
                ? 'bg-accent/15 text-accent'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            {t.volumes} ({data.mounts?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('networks')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'networks'
                ? 'bg-accent/15 text-accent'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            {t.network}
          </button>
          <button
            onClick={() => setActiveSubTab('json')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeSubTab === 'json'
                ? 'bg-accent/15 text-accent'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-textMain)]'
            }`}
          >
            {t.json}
          </button>
        </div>

        <button
          onClick={handleCopyJson}
          className="flex items-center gap-1 px-2 py-1 text-[var(--color-textMuted)] hover:text-[var(--color-textMain)] hover:bg-surfaceHover rounded text-[11px] font-mono transition-colors"
          title={t.copy}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">{t.copied}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{t.copy}</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-[var(--color-textMain)]">
        {activeSubTab === 'details' && (
          <div className="space-y-4 max-w-4xl">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-2.5">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-[var(--color-textMuted)]">{t.fullId}</span>
                <span className="text-[var(--color-textMain)] select-all">{data.id}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-[var(--color-textMuted)]">{t.name}</span>
                <span className="text-[var(--color-textMain)]">{data.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-[var(--color-textMuted)]">{t.image}</span>
                <span className="text-[var(--color-textMain)]">{data.image}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-[var(--color-textMuted)]">{t.created}</span>
                <span className="text-[var(--color-textMain)]">
                  {new Date(data.created).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-[var(--color-textMuted)]">{t.command}</span>
                <span className="text-[var(--color-textMain)]">
                  {data.path} {data.args.join(' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-textMuted)]">{t.workDir}</span>
                <span className="text-[var(--color-textMain)]">
                  {data.config.workingDir || '/'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'env' && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-background text-[var(--color-textMuted)] border-b border-border text-[11px]">
                <tr>
                  <th className="p-2.5">Key</th>
                  <th className="p-2.5">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.config.env.map((envStr, i) => {
                  const [key, ...vals] = envStr.split('=');
                  const value = vals.join('=');
                  return (
                    <tr key={i} className="hover:bg-surfaceHover/50">
                      <td className="p-2.5 text-accent font-semibold">{key}</td>
                      <td className="p-2.5 text-[var(--color-textMain)] break-all select-all">
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
              <div className="text-[var(--color-textMuted)] p-4">{t.noVolumes}</div>
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
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {m.rw ? 'rw' : 'ro'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-[var(--color-textMuted)]">Host: </span>
                    <span className="text-[var(--color-textMain)] select-all">{m.source}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-[var(--color-textMuted)]">Container: </span>
                    <span className="text-[var(--color-textMain)] select-all">
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
                <span className="text-[var(--color-textMuted)]">{t.ip}</span>
                <span className="text-[var(--color-textMain)] font-bold select-all">
                  {data.networkSettings.ipAddress || 'Host Network'}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-[var(--color-textMuted)]">{t.gateway}</span>
                <span className="text-[var(--color-textMain)]">
                  {data.networkSettings.gateway || '--'}
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold text-[var(--color-textMain)] mb-2">
                {t.connectedNetworks}
              </h4>
              <div className="space-y-2">
                {Object.entries(data.networkSettings.networks).map(
                  ([netName, netConfig]: [string, any]) => (
                    <div
                      key={netName}
                      className="border border-border/60 rounded p-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="text-accent font-semibold">{netName}</span>
                      <span className="text-[var(--color-textMuted)] font-mono">
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
          <pre className="bg-background border border-border rounded-lg p-4 text-[11px] overflow-x-auto text-[var(--color-textMain)]">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
