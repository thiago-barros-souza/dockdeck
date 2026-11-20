import Docker from 'dockerode';
import { Readable } from 'stream';
import {
  ContainerSummary,
  ContainerMetrics,
  ContainerAction,
  ContainerInspectData,
  SystemDockerInfo
} from '../../shared/types';

export class DockerService {
  private docker: Docker;
  private activeStatsStreams: Map<string, Readable> = new Map();
  private activeLogsStreams: Map<string, Readable> = new Map();

  constructor(socketPath: string = '/var/run/docker.sock') {
    this.docker = new Docker({ socketPath });
  }

  setSocketPath(socketPath: string): void {
    this.stopAllStreams();
    this.docker = new Docker({ socketPath });
  }

  async getSystemInfo(): Promise<SystemDockerInfo> {
    const info = await this.docker.info();
    return {
      containers: info.Containers,
      containersRunning: info.ContainersRunning,
      containersPaused: info.ContainersPaused,
      containersStopped: info.ContainersStopped,
      images: info.Images,
      serverVersion: info.ServerVersion,
      operatingSystem: info.OperatingSystem,
      ncpu: info.NCPU,
      memTotal: info.MemTotal
    };
  }

  async listContainers(): Promise<ContainerSummary[]> {
    const containers = await this.docker.listContainers({ all: true });

    return containers.map((c) => {
      const primaryName = (c.Names[0] || '').replace(/^\//, '');
      const project = c.Labels?.['com.docker.compose.project'];
      const service = c.Labels?.['com.docker.compose.service'];

      return {
        id: c.Id,
        shortId: c.Id.substring(0, 12),
        names: c.Names.map((n) => n.replace(/^\//, '')),
        name: primaryName || c.Id.substring(0, 12),
        image: c.Image,
        imageId: c.ImageID,
        command: c.Command,
        created: c.Created,
        state: c.State as any,
        status: c.Status,
        ports: (c.Ports || []).map((p) => ({
          ip: p.IP,
          privatePort: p.PrivatePort,
          publicPort: p.PublicPort,
          type: p.Type
        })),
        labels: c.Labels || {},
        project,
        service
      };
    });
  }

  async inspectContainer(id: string): Promise<ContainerInspectData> {
    const container = this.docker.getContainer(id);
    const data = await container.inspect();

    return {
      id: data.Id,
      name: (data.Name || '').replace(/^\//, ''),
      created: data.Created,
      path: data.Path,
      args: data.Args || [],
      state: {
        status: data.State.Status,
        running: data.State.Running,
        paused: data.State.Paused,
        restarting: data.State.Restarting,
        exitCode: data.State.ExitCode,
        startedAt: data.State.StartedAt,
        finishedAt: data.State.FinishedAt
      },
      image: data.Config.Image,
      networkSettings: {
        ipAddress: data.NetworkSettings.IPAddress,
        gateway: data.NetworkSettings.Gateway,
        ports: data.NetworkSettings.Ports || {},
        networks: data.NetworkSettings.Networks || {}
      },
      mounts: (data.Mounts || []).map((m: any) => ({
        type: m.Type,
        source: m.Source,
        destination: m.Destination,
        mode: m.Mode,
        rw: m.RW
      })),
      config: {
        env: data.Config.Env || [],
        cmd: data.Config.Cmd || [],
        workingDir: data.Config.WorkingDir,
        labels: data.Config.Labels || {}
      }
    };
  }

  async executeAction(id: string, action: ContainerAction): Promise<void> {
    const container = this.docker.getContainer(id);
    switch (action) {
      case 'start':
        await container.start();
        break;
      case 'stop':
        await container.stop();
        break;
      case 'restart':
        await container.restart();
        break;
      case 'pause':
        await container.pause();
        break;
      case 'unpause':
        await container.unpause();
        break;
      case 'kill':
        await container.kill();
        break;
      case 'remove':
        await container.remove({ force: true });
        break;
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  startStatsStream(id: string, onMetrics: (metrics: ContainerMetrics) => void): void {
    this.stopStatsStream(id);

    const container = this.docker.getContainer(id);
    container.stats({ stream: true }, (err, stream) => {
      if (err || !stream) return;

      const readable = stream as Readable;
      this.activeStatsStreams.set(id, readable);

      let buffer = '';

      readable.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf-8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const raw = JSON.parse(line);
            const metrics = this.calculateMetrics(id, raw);
            onMetrics(metrics);
          } catch {
            // Partial JSON line, continue
          }
        }
      });

      readable.on('end', () => {
        this.activeStatsStreams.delete(id);
      });

      readable.on('error', () => {
        this.activeStatsStreams.delete(id);
      });
    });
  }

  stopStatsStream(id: string): void {
    const stream = this.activeStatsStreams.get(id);
    if (stream) {
      stream.destroy();
      this.activeStatsStreams.delete(id);
    }
  }

  startLogsStream(
    id: string,
    tail: number = 200,
    onLog: (text: string) => void
  ): void {
    this.stopLogsStream(id);

    const container = this.docker.getContainer(id);
    container.logs(
      {
        follow: true,
        stdout: true,
        stderr: true,
        tail,
        timestamps: true
      },
      (err, stream) => {
        if (err || !stream) return;

        const readable = stream as Readable;
        this.activeLogsStreams.set(id, readable);

        readable.on('data', (chunk: Buffer) => {
          // Docker multiplexed log stream has an 8-byte header per frame
          // [0: stream_type (1=stdout, 2=stderr), 1-3: zero, 4-7: payload size]
          let text = '';
          if (chunk.length >= 8 && (chunk[0] === 1 || chunk[0] === 2)) {
            text = chunk.subarray(8).toString('utf-8');
          } else {
            text = chunk.toString('utf-8');
          }
          onLog(text);
        });

        readable.on('end', () => {
          this.activeLogsStreams.delete(id);
        });

        readable.on('error', () => {
          this.activeLogsStreams.delete(id);
        });
      }
    );
  }

  stopLogsStream(id: string): void {
    const stream = this.activeLogsStreams.get(id);
    if (stream) {
      stream.destroy();
      this.activeLogsStreams.delete(id);
    }
  }

  stopAllStreams(): void {
    for (const [id, stream] of this.activeStatsStreams.entries()) {
      stream.destroy();
    }
    this.activeStatsStreams.clear();

    for (const [id, stream] of this.activeLogsStreams.entries()) {
      stream.destroy();
    }
    this.activeLogsStreams.clear();
  }

  calculateMetrics(containerId: string, stats: any): ContainerMetrics {
    // CPU calculation
    let cpuPercent = 0.0;
    const cpuDelta =
      (stats.cpu_stats?.cpu_usage?.total_usage || 0) -
      (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta =
      (stats.cpu_stats?.system_cpu_usage || 0) -
      (stats.precpu_stats?.system_cpu_usage || 0);
    const onlineCpus =
      stats.cpu_stats?.online_cpus ||
      stats.cpu_stats?.cpu_usage?.percpu_usage?.length ||
      1;

    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPercent = (cpuDelta / systemDelta) * onlineCpus * 100.0;
    }

    // Memory calculation
    const memUsage = stats.memory_stats?.usage || 0;
    const cache =
      stats.memory_stats?.stats?.cache ||
      stats.memory_stats?.stats?.inactive_file ||
      0;
    const actualMem = Math.max(0, memUsage - cache);
    const memLimit = stats.memory_stats?.limit || 1;
    const memoryPercent = (actualMem / memLimit) * 100.0;

    // Network calculation
    let networkRx = 0;
    let networkTx = 0;
    if (stats.networks) {
      for (const iface of Object.values<any>(stats.networks)) {
        networkRx += iface.rx_bytes || 0;
        networkTx += iface.tx_bytes || 0;
      }
    }

    // Block I/O calculation
    let blockRead = 0;
    let blockWrite = 0;
    if (stats.blkio_stats?.io_service_bytes_recursive) {
      for (const entry of stats.blkio_stats.io_service_bytes_recursive) {
        if (entry.op === 'read' || entry.op === 'Read') blockRead += entry.value;
        if (entry.op === 'write' || entry.op === 'Write') blockWrite += entry.value;
      }
    }

    return {
      containerId,
      timestamp: Date.now(),
      cpuPercent: parseFloat(cpuPercent.toFixed(2)),
      memoryUsage: actualMem,
      memoryLimit: memLimit,
      memoryPercent: parseFloat(memoryPercent.toFixed(2)),
      networkRx,
      networkTx,
      blockRead,
      blockWrite,
      pids: stats.pids_stats?.current || 0
    };
  }
}
