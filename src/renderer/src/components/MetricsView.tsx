import React, { useState } from 'react';
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
  const [timeRange, setTimeRange] = useState<'30s' | '1m' | '5m' | '15m' | '1h' | '24h'>('30s');

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

  const getTimeWindowMs = (range: string) => {
    switch (range) {
      case '30s':
        return 30 * 1000;
      case '1m':
        return 60 * 1000;
      case '5m':
        return 5 * 60 * 1000;
      case '15m':
        return 15 * 60 * 1000;
      case '1h':
        return 60 * 60 * 1000;
      case '24h':
        return 24 * 60 * 60 * 1000;
      default:
        return 30 * 1000;
    }
  };

  const windowMs = getTimeWindowMs(timeRange);
  const now = Date.now();
  let filteredHistory = metricsHistory.filter((m) => now - m.timestamp <= windowMs);

  // Se o container acabou de conectar ou o histórico é recente, garante que não fique vazio
  if (filteredHistory.length === 0 && metricsHistory.length > 0) {
    filteredHistory = metricsHistory.slice(-30);
  }

  // Downsample suave se houver muitos pontos para manter a renderização fluida
  const maxDisplayPoints = 120;
  let sampledHistory = filteredHistory;
  if (filteredHistory.length > maxDisplayPoints) {
    const step = Math.ceil(filteredHistory.length / maxDisplayPoints);
    sampledHistory = filteredHistory.filter((_, idx) => idx % step === 0 || idx === filteredHistory.length - 1);
  }

  const chartData = sampledHistory.map((m) => {
    const date = new Date(m.timestamp);
    const isLongRange = timeRange === '1h' || timeRange === '24h';
    return {
      time: date.toLocaleTimeString([], {
        hour: isLongRange ? '2-digit' : undefined,
        minute: '2-digit',
        second: '2-digit'
      }),
      cpu: m.cpuPercent,
      memPercent: m.memoryPercent,
      memMB: parseFloat((m.memoryUsage / (1024 * 1024)).toFixed(1)),
      netRxMB: parseFloat((m.networkRx / (1024 * 1024)).toFixed(2)),
      netTxMB: parseFloat((m.networkTx / (1024 * 1024)).toFixed(2))
    };
  });

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '30s':
        return 'Últimos 30s';
      case '1m':
        return 'Último 1m';
      case '5m':
        return 'Últimos 5m';
      case '15m':
        return 'Últimos 15m';
      case '1h':
        return 'Última 1h';
      case '24h':
        return 'Últimas 24h';
    }
  };

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
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 font-mono">Período:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-background border border-border text-accent text-[11px] font-mono rounded px-2 py-0.5 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="30s">Últimos 30s</option>
                <option value="1m">Último 1m</option>
                <option value="5m">Últimos 5m</option>
                <option value="15m">Últimos 15m</option>
                <option value="1h">Última 1h</option>
                <option value="24h">Últimas 24h</option>
              </select>
            </div>
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
            <span className="text-[10px] text-emerald-400 font-mono">
              {getTimeRangeLabel()}
            </span>
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
