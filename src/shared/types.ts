export interface ConnectionProfile {
  id: string;
  name: string;
  type: 'local' | 'ssh';
  socketPath?: string;
  host?: string;
  port?: number;
  username?: string;
  authType?: 'password' | 'privateKey';
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export interface ContainerPort {
  ip?: string;
  privatePort: number;
  publicPort?: number;
  type: string;
}

export interface ContainerSummary {
  id: string;
  shortId: string;
  names: string[];
  name: string;
  image: string;
  imageId: string;
  command: string;
  created: number;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead' | 'created';
  status: string;
  ports: ContainerPort[];
  labels: Record<string, string>;
  project?: string; // Docker Compose project name if available
  service?: string; // Docker Compose service name if available
}

export interface ContainerMetrics {
  containerId: string;
  timestamp: number;
  cpuPercent: number;
  memoryUsage: number; // in bytes
  memoryLimit: number; // in bytes
  memoryPercent: number;
  networkRx: number; // cumulative bytes
  networkTx: number; // cumulative bytes
  blockRead: number;
  blockWrite: number;
  pids: number;
}

export type ContainerAction = 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'kill' | 'remove';

export interface ContainerInspectData {
  id: string;
  name: string;
  created: string;
  path: string;
  args: string[];
  state: {
    status: string;
    running: boolean;
    paused: boolean;
    restarting: boolean;
    exitCode: number;
    startedAt: string;
    finishedAt: string;
  };
  image: string;
  networkSettings: {
    ipAddress: string;
    gateway: string;
    ports: Record<string, any>;
    networks: Record<string, any>;
  };
  mounts: Array<{
    type: string;
    source: string;
    destination: string;
    mode: string;
    rw: boolean;
  }>;
  config: {
    env: string[];
    cmd: string[];
    workingDir: string;
    labels: Record<string, string>;
  };
}

export interface SystemDockerInfo {
  containers: number;
  containersRunning: number;
  containersPaused: number;
  containersStopped: number;
  images: number;
  serverVersion: string;
  operatingSystem: string;
  ncpu: number;
  memTotal: number;
}

export interface ImageSummary {
  id: string;
  shortId: string;
  tags: string[];
  size: number;
  created: number;
  containers: number;
}

export interface VolumeSummary {
  name: string;
  driver: string;
  scope: string;
  mountpoint: string;
  createdAt?: string;
  size?: number;
}
