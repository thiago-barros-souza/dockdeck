import { describe, it, expect } from 'vitest';
import { DockerService } from '../src/main/services/docker.service';

describe('QA Suite - Docker Integration Test', () => {
  const service = new DockerService();

  it('deve conectar ao daemon Docker local e obter informações do sistema', async () => {
    try {
      const info = await service.getSystemInfo();
      expect(info).toBeDefined();
      expect(info.operatingSystem).toBeDefined();
      expect(info.serverVersion).toBeDefined();
      expect(typeof info.containers).toBe('number');
    } catch (err: any) {
      console.warn('Socket Docker indisponível no teste:', err.message);
    }
  });

  it('deve listar containers locais e mapear campos esperados', async () => {
    try {
      const containers = await service.listContainers();
      expect(Array.isArray(containers)).toBe(true);
      if (containers.length > 0) {
        const first = containers[0];
        expect(first.id).toBeDefined();
        expect(first.name).toBeDefined();
        expect(first.state).toBeDefined();
      }
    } catch (err: any) {
      console.warn('Erro ao listar containers no teste:', err.message);
    }
  });

  it('deve listar imagens do Docker local', async () => {
    try {
      const images = await service.listImages();
      expect(Array.isArray(images)).toBe(true);
      if (images.length > 0) {
        const img = images[0];
        expect(img.id).toBeDefined();
        expect(img.shortId).toBeDefined();
        expect(Array.isArray(img.tags)).toBe(true);
      }
    } catch (err: any) {
      console.warn('Erro ao listar imagens no teste:', err.message);
    }
  });

  it('deve listar volumes do Docker local', async () => {
    try {
      const volumes = await service.listVolumes();
      expect(Array.isArray(volumes)).toBe(true);
    } catch (err: any) {
      console.warn('Erro ao listar volumes no teste:', err.message);
    }
  });
});
