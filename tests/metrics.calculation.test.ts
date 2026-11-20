import { describe, it, expect } from 'vitest';
import { DockerService } from '../src/main/services/docker.service';

describe('QA Suite - Docker Metrics Calculation', () => {
  const service = new DockerService();

  it('deve calcular porcentagem de CPU corretamente quando deltas são válidos', () => {
    const mockStats = {
      cpu_stats: {
        cpu_usage: { total_usage: 200000000, percpu_usage: [100000000, 100000000] },
        system_cpu_usage: 2000000000,
        online_cpus: 2
      },
      precpu_stats: {
        cpu_usage: { total_usage: 100000000 },
        system_cpu_usage: 1000000000
      },
      memory_stats: {
        usage: 524288000, // 500 MB
        limit: 1073741824, // 1 GB
        stats: { cache: 24288000 }
      },
      networks: {
        eth0: { rx_bytes: 10240, tx_bytes: 20480 }
      },
      pids_stats: { current: 15 }
    };

    const metrics = service.calculateMetrics('container-test-123', mockStats);

    // cpuDelta = 100000000, systemDelta = 1000000000, onlineCpus = 2 -> (1/10)*2*100 = 20%
    expect(metrics.cpuPercent).toBe(20);
    expect(metrics.pids).toBe(15);
    expect(metrics.networkRx).toBe(10240);
    expect(metrics.networkTx).toBe(20480);
    expect(metrics.memoryUsage).toBe(500000000);
    expect(metrics.memoryLimit).toBe(1073741824);
  });

  it('deve lidar com deltas zerados sem gerar NaN ou divisão por zero', () => {
    const mockStats = {
      cpu_stats: { cpu_usage: { total_usage: 1000 }, system_cpu_usage: 5000 },
      precpu_stats: { cpu_usage: { total_usage: 1000 }, system_cpu_usage: 5000 },
      memory_stats: { usage: 0, limit: 1000 }
    };

    const metrics = service.calculateMetrics('container-idle', mockStats);

    expect(metrics.cpuPercent).toBe(0);
    expect(Number.isNaN(metrics.cpuPercent)).toBe(false);
  });
});
