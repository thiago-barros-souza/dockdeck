import { contextBridge, ipcRenderer } from 'electron';
import {
  ContainerAction,
  ConnectionProfile,
  ContainerMetrics,
  ContainerSummary,
  ContainerInspectData,
  SystemDockerInfo,
  ImageSummary,
  VolumeSummary
} from '../shared/types';

export const dockerApi = {
  getSystemInfo: (): Promise<SystemDockerInfo> => {
    return ipcRenderer.invoke('docker:get-system-info');
  },

  listContainers: (): Promise<ContainerSummary[]> => {
    return ipcRenderer.invoke('docker:list-containers');
  },

  inspectContainer: (id: string): Promise<ContainerInspectData> => {
    return ipcRenderer.invoke('docker:inspect-container', id);
  },

  executeAction: (
    id: string,
    action: ContainerAction
  ): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('docker:execute-action', id, action);
  },

  // Stats stream
  startStats: (
    id: string,
    callback: (metrics: ContainerMetrics) => void
  ): Promise<{ streaming: boolean }> => {
    const channel = `docker:stats:${id}`;
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, (_, metrics) => callback(metrics));
    return ipcRenderer.invoke('docker:start-stats', id);
  },

  stopStats: (id: string): Promise<{ streaming: boolean }> => {
    ipcRenderer.removeAllListeners(`docker:stats:${id}`);
    return ipcRenderer.invoke('docker:stop-stats', id);
  },

  // Logs stream
  startLogs: (
    id: string,
    tail: number,
    callback: (logChunk: string) => void
  ): Promise<{ streaming: boolean }> => {
    const channel = `docker:logs:${id}`;
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, (_, text) => callback(text));
    return ipcRenderer.invoke('docker:start-logs', id, tail);
  },

  stopLogs: (id: string): Promise<{ streaming: boolean }> => {
    ipcRenderer.removeAllListeners(`docker:logs:${id}`);
    return ipcRenderer.invoke('docker:stop-logs', id);
  },

  // Terminal Exec
  startExec: (
    containerId: string,
    onData: (data: string) => void,
    onExit: () => void
  ): Promise<{ sessionId: string }> => {
    return ipcRenderer
      .invoke('docker:start-exec', containerId)
      .then((res: { sessionId: string }) => {
        const dataChannel = `docker:exec-data:${res.sessionId}`;
        const exitChannel = `docker:exec-exit:${res.sessionId}`;

        ipcRenderer.removeAllListeners(dataChannel);
        ipcRenderer.removeAllListeners(exitChannel);

        ipcRenderer.on(dataChannel, (_, data) => onData(data));
        ipcRenderer.on(exitChannel, () => onExit());

        return res;
      });
  },

  sendExecInput: (sessionId: string, data: string): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('docker:send-exec-input', sessionId, data);
  },

  resizeExec: (
    sessionId: string,
    width: number,
    height: number
  ): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('docker:resize-exec', sessionId, width, height);
  },

  stopExec: (sessionId: string): Promise<{ success: boolean }> => {
    ipcRenderer.removeAllListeners(`docker:exec-data:${sessionId}`);
    ipcRenderer.removeAllListeners(`docker:exec-exit:${sessionId}`);
    return ipcRenderer.invoke('docker:stop-exec', sessionId);
  },

  // Images and Volumes
  listImages: (): Promise<ImageSummary[]> => {
    return ipcRenderer.invoke('docker:list-images');
  },

  removeImage: (id: string): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('docker:remove-image', id);
  },

  listVolumes: (): Promise<VolumeSummary[]> => {
    return ipcRenderer.invoke('docker:list-volumes');
  },

  removeVolume: (name: string): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('docker:remove-volume', name);
  },

  pruneSystem: (): Promise<{ spaceReclaimed: number }> => {
    return ipcRenderer.invoke('docker:prune-system');
  },

  // Connections
  getProfiles: (): Promise<{
    profiles: ConnectionProfile[];
    active?: ConnectionProfile;
  }> => {
    return ipcRenderer.invoke('docker:get-profiles');
  },

  switchConnection: (
    profileId: string
  ): Promise<{ success: boolean; active: ConnectionProfile }> => {
    return ipcRenderer.invoke('docker:switch-connection', profileId);
  },

  saveProfile: (
    profile: ConnectionProfile
  ): Promise<{ success: boolean; profiles: ConnectionProfile[] }> => {
    return ipcRenderer.invoke('docker:save-profile', profile);
  },

  deleteProfile: (
    profileId: string
  ): Promise<{ success: boolean; profiles: ConnectionProfile[] }> => {
    return ipcRenderer.invoke('docker:delete-profile', profileId);
  }
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('dockerApi', dockerApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore
  window.dockerApi = dockerApi;
}
