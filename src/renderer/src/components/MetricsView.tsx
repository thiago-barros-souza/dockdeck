import React from 'react';
import { ContainerMetrics } from '../../../shared/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Cpu, HardDrive, Network, Database } from 'lucide-react';

interface MetricsViewProps {
  metricsHistory: ContainerMetrics[];
  latestMetrics: ContainerMetrics | null;
  isRunning: boolean;
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  metricsHistory,
  latestMetrics,
  isRunning
}) => {
  if (!isRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <ActivityIcon className="w-12 h-12 text-gray-600 mb-3" />
        <h3 className="text-sm font-semibold text-gray-300">Container Parado</h3>
        <p className="text-xs text-gray-500 mt-1">
          Inicie o container para acompanhar métricas de CPU, memória e rede em tempo real.
        </p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const chartData = metricsHistory.map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit'
    }),
    cpu: m.cpuPercent,
    memPercent: m.memoryPercent,
    memMB: parseFloat((m.memoryUsage / (1024 * 1024)).toFixed(1)),
    netRxMB: parseFloat((m.networkRx / (1024 * 1024)).toFixed(2)),
    netTxMB: parseFloat((m.networkTx / (1024 * 1024)).toFixed(2))
  }));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Top Quick Cards */}
      <div className="grid grid-cols-4 gap-3">
        {/* CPU */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Uso de CPU</span>
            <Cpu className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold font-mono text-gray-100 mt-1">
            {latestMetrics ? `${latestMetrics.cpuPercent.toFixed(1)}%` : '--'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            PIDs: {latestMetrics?.pids ?? '--'}
          </div>
        </div>

        {/* Memória */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Uso de Memória</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-gray-100 mt-1">
            {latestMetrics
              ? formatBytes(latestMetrics.memoryUsage)
              : '--'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Limite: {latestMetrics ? formatBytes(latestMetrics.memoryLimit) : '--'} (
            {latestMetrics ? `${latestMetrics.memoryPercent.toFixed(1)}%` : '--'})
          </div>
        </div>

        {/* Rede */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Tráfego de Rede</span>
            <Network className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold font-mono text-gray-100 mt-1 truncate">
            ↓ {latestMetrics ? formatBytes(latestMetrics.networkRx) : '--'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 truncate">
            ↑ {latestMetrics ? formatBytes(latestMetrics.networkTx) : '--'}
          </div>
        </div>

        {/* Disco (Block I/O) */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">I/O de Disco</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold font-mono text-gray-100 mt-1 truncate">
            R: {latestMetrics ? formatBytes(latestMetrics.blockRead) : '--'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 truncate">
            W: {latestMetrics ? formatBytes(latestMetrics.blockWrite) : '--'}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-4">
        {/* CPU Chart */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center justify-between">
            <span>Histórico de CPU (%)</span>
            <span className="text-[10px] text-accent font-mono">Últimos 30s</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="time"
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 'auto']}
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  name="CPU %"
                  stroke="#58a6ff"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center justify-between">
            <span>Histórico de Memória (MB)</span>
            <span className="text-[10px] text-emerald-400 font-mono">Últimos 30s</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="time"
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 'auto']}
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  unit="MB"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="memMB"
                  name="Memória MB"
                  stroke="#3fb950"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);
