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

type TimeRangeOption =
  | '30s'
  | '1m'
  | '5m'
  | '15m'
  | '1h'
  | '24h'
  | '3d'
  | '7d';

export const MetricsView: React.FC<MetricsViewProps> = ({
  metricsHistory,
  latestMetrics,
  isRunning
}) => {
  const [cpuTimeRange, setCpuTimeRange] = useState<TimeRangeOption>('30s');
  const [memTimeRange, setMemTimeRange] = useState<TimeRangeOption>('30s');
  const [netTimeRange, setNetTimeRange] = useState<TimeRangeOption>('30s');
  const [diskTimeRange, setDiskTimeRange] = useState<TimeRangeOption>('30s');

  if (!isRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <ActivityIcon className="w-12 h-12 text-gray-600 mb-3" />
        <h3 className="text-sm font-semibold text-gray-300">Parado</h3>
        <p className="text-xs text-gray-500 mt-1">
          Inicie o container para acompanhar métricas em tempo real.
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

  const getTimeWindowMs = (range: TimeRangeOption) => {
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
      case '3d':
        return 3 * 24 * 60 * 60 * 1000;
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      default:
        return 30 * 1000;
    }
  };

  const prepareChartData = (range: TimeRangeOption) => {
    const windowMs = getTimeWindowMs(range);
    const now = Date.now();
    let filtered = metricsHistory.filter((m) => now - m.timestamp <= windowMs);

    if (filtered.length === 0 && metricsHistory.length > 0) {
      filtered = metricsHistory.slice(-30);
    }

    const maxDisplayPoints = 120;
    let sampled = filtered;
    if (filtered.length > maxDisplayPoints) {
      const step = Math.ceil(filtered.length / maxDisplayPoints);
      sampled = filtered.filter(
        (_, idx) => idx % step === 0 || idx === filtered.length - 1
      );
    }

    const isMultiDay = range === '3d' || range === '7d';
    const isOneDay = range === '24h';

    return sampled.map((m, idx) => {
      const date = new Date(m.timestamp);

      // Calcular taxas (KB/s) de rede e disco em relação à amostra anterior
      const prev = idx > 0 ? sampled[idx - 1] : m;
      const deltaSec = Math.max(0.5, (m.timestamp - prev.timestamp) / 1000);

      const netRxRateKB =
        idx === 0
          ? 0
          : Math.max(0, (m.networkRx - prev.networkRx) / 1024 / deltaSec);
      const netTxRateKB =
        idx === 0
          ? 0
          : Math.max(0, (m.networkTx - prev.networkTx) / 1024 / deltaSec);

      const diskReadRateKB =
        idx === 0
          ? 0
          : Math.max(0, (m.blockRead - prev.blockRead) / 1024 / deltaSec);
      const diskWriteRateKB =
        idx === 0
          ? 0
          : Math.max(0, (m.blockWrite - prev.blockWrite) / 1024 / deltaSec);

      let timeLabel = '';
      if (isMultiDay) {
        // Ex: 20/11 21:40
        timeLabel = `${date.getDate().toString().padStart(2, '0')}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')} ${date
          .getHours()
          .toString()
          .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (isOneDay) {
        // Ex: 21:40
        timeLabel = date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } else {
        // Ex: 21:40:15
        timeLabel = date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      }

      return {
        time: timeLabel,
        fullTime: `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString(
          'pt-BR',
          { hour12: false }
        )}`,
        cpu: m.cpuPercent,
        memPercent: m.memoryPercent,
        memMB: parseFloat((m.memoryUsage / (1024 * 1024)).toFixed(1)),
        netRxKB: parseFloat(netRxRateKB.toFixed(1)),
        netTxKB: parseFloat(netTxRateKB.toFixed(1)),
        diskReadKB: parseFloat(diskReadRateKB.toFixed(1)),
        diskWriteKB: parseFloat(diskWriteRateKB.toFixed(1))
      };
    });
  };

  const cpuChartData = prepareChartData(cpuTimeRange);
  const memChartData = prepareChartData(memTimeRange);
  const netChartData = prepareChartData(netTimeRange);
  const diskChartData = prepareChartData(diskTimeRange);

  const renderPeriodSelect = (
    value: TimeRangeOption,
    onChange: (val: TimeRangeOption) => void
  ) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TimeRangeOption)}
      className="bg-background border border-border text-accent text-[11px] font-mono rounded px-2 py-0.5 focus:outline-none focus:border-accent cursor-pointer"
    >
      <option value="30s">30s</option>
      <option value="1m">1m</option>
      <option value="5m">5m</option>
      <option value="15m">15m</option>
      <option value="1h">1h</option>
      <option value="24h">24h</option>
      <option value="3d">3 dias</option>
      <option value="7d">Semana</option>
    </select>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Top Quick Cards */}
      <div className="grid grid-cols-4 gap-3">
        {/* CPU */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">CPU</span>
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
            <span className="text-xs font-medium">Memória</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-gray-100 mt-1">
            {latestMetrics ? formatBytes(latestMetrics.memoryUsage) : '--'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Limite: {latestMetrics ? formatBytes(latestMetrics.memoryLimit) : '--'} (
            {latestMetrics ? `${latestMetrics.memoryPercent.toFixed(1)}%` : '--'})
          </div>
        </div>

        {/* Rede */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Rede</span>
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
            <span className="text-xs font-medium">Disco</span>
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

      {/* Gráficos em Grade 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 1. CPU Chart */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center justify-between">
            <span>CPU (%)</span>
            {renderPeriodSelect(cpuTimeRange, setCpuTimeRange)}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="time"
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  domain={[0, 'auto']}
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullTime || ''
                  }
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

        {/* 2. Memory Chart */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center justify-between">
            <span>Memória (MB)</span>
            {renderPeriodSelect(memTimeRange, setMemTimeRange)}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="time"
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  domain={[0, 'auto']}
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  unit="MB"
                />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullTime || ''
                  }
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="memMB"
                  name="Memória (MB)"
                  stroke="#3fb950"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Rede Chart (Download & Upload) */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center justify-between">
            <span>Rede (KB/s)</span>
            {renderPeriodSelect(netTimeRange, setNetTimeRange)}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="time"
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  domain={[0, 'auto']}
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  unit="KB/s"
                />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullTime || ''
                  }
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="netRxKB"
                  name="↓ Download (KB/s)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="netTxKB"
                  name="↑ Upload (KB/s)"
                  stroke="#c084fc"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Disco Chart (Leitura & Escrita) */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center justify-between">
            <span>Disco (KB/s)</span>
            {renderPeriodSelect(diskTimeRange, setDiskTimeRange)}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diskChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="time"
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  domain={[0, 'auto']}
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  unit="KB/s"
                />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullTime || ''
                  }
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="diskReadKB"
                  name="Leitura (KB/s)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="diskWriteKB"
                  name="Escrita (KB/s)"
                  stroke="#f97316"
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
