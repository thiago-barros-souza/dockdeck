import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { ConnectionProfile } from '../../shared/types';
import { DockerService } from './docker.service';
import { SshService } from './ssh.service';

export class ConnectionManager {
  private profiles: ConnectionProfile[] = [];
  private activeProfileId: string = 'local-default';
  private dockerService: DockerService;
  private sshService: SshService;
  private configFilePath: string;

  constructor(dockerService: DockerService, sshService: SshService) {
    this.dockerService = dockerService;
    this.sshService = sshService;
    
    // User data directory for dockdeck
    const userDataPath = app ? app.getPath('userData') : '/tmp';
    this.configFilePath = path.join(userDataPath, 'dockdeck-profiles.json');
    this.loadProfiles();
  }

  private loadProfiles(): void {
    const defaultLocal: ConnectionProfile = {
      id: 'local-default',
      name: 'Docker Local',
      type: 'local',
      socketPath: '/var/run/docker.sock'
    };

    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf-8');
        this.profiles = JSON.parse(raw);
        if (!this.profiles.some((p) => p.id === 'local-default')) {
          this.profiles.unshift(defaultLocal);
        }
      } else {
        this.profiles = [defaultLocal];
        this.saveProfiles();
      }
    } catch {
      this.profiles = [defaultLocal];
    }
  }

  private saveProfiles(): void {
    try {
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.profiles, null, 2), 'utf-8');
    } catch (err) {
      console.error('Falha ao salvar perfis:', err);
    }
  }

  getProfiles(): ConnectionProfile[] {
    return this.profiles;
  }

  getActiveProfile(): ConnectionProfile | undefined {
    return this.profiles.find((p) => p.id === this.activeProfileId);
  }

  async switchConnection(profileId: string): Promise<ConnectionProfile> {
    const profile = this.profiles.find((p) => p.id === profileId);
    if (!profile) {
      throw new Error(`Perfil de conexão com ID "${profileId}" não encontrado.`);
    }

    const previousProfileId = this.activeProfileId;

    try {
      if (profile.type === 'local') {
        await this.sshService.disconnect();
        this.dockerService.setSocketPath(profile.socketPath || '/var/run/docker.sock');
        await this.dockerService.getSystemInfo();
      } else {
        const tunnelSocketPath = await this.sshService.connectAndTunnel(profile);
        this.dockerService.setSocketPath(tunnelSocketPath);
        await this.dockerService.getSystemInfo();
      }

      this.activeProfileId = profile.id;
      return profile;
    } catch (err: any) {
      // Revert to local if remote failed
      if (previousProfileId === 'local-default') {
        await this.sshService.disconnect();
        this.dockerService.setSocketPath('/var/run/docker.sock');
        this.activeProfileId = 'local-default';
      }
      throw new Error(`Falha ao conectar no Docker de "${profile.name}": ${err.message}`);
    }
  }

  async saveProfile(profile: ConnectionProfile): Promise<ConnectionProfile[]> {
    const index = this.profiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      this.profiles[index] = profile;
    } else {
      this.profiles.push(profile);
    }
    this.saveProfiles();
    return this.profiles;
  }

  async deleteProfile(profileId: string): Promise<ConnectionProfile[]> {
    if (profileId === 'local-default') {
      throw new Error('Não é possível excluir a conexão local padrão.');
    }
    if (this.activeProfileId === profileId) {
      await this.switchConnection('local-default');
    }
    this.profiles = this.profiles.filter((p) => p.id !== profileId);
    this.saveProfiles();
    return this.profiles;
  }
}
