export type Language = 'pt' | 'en';
export type Theme = 'dark' | 'light';

export interface UserSettings {
  language: Language;
  theme: Theme;
}

export const defaultSettings: UserSettings = {
  language: 'pt',
  theme: 'dark'
};

export const translations = {
  pt: {
    tabs: {
      metrics: 'Métricas',
      logs: 'Logs',
      terminal: 'Terminal',
      inspect: 'Inspecionar'
    },
    actions: {
      start: 'Start',
      stop: 'Stop',
      restart: 'Restart',
      pause: 'Pausar',
      unpause: 'Despausar',
      remove: 'Remover'
    },
    metrics: {
      cpu: 'CPU',
      memory: 'Memória',
      network: 'Rede',
      disk: 'Disco',
      pids: 'PIDs',
      limit: 'Limite',
      download: '↓ Download',
      upload: '↑ Upload',
      read: 'Leitura',
      write: 'Escrita',
      stopped: 'Parado',
      stoppedDesc: 'Inicie o container para acompanhar métricas em tempo real.'
    },
    periods: {
      '30s': '30s',
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '24h': '24h',
      '3d': '3 dias',
      '7d': 'Semana'
    },
    sidebar: {
      all: 'Todos',
      running: 'Ativos',
      exited: 'Parados',
      filterPlaceholder: 'Filtrar...',
      local: 'Local',
      empty: 'Nenhum container encontrado.'
    },
    inspect: {
      general: 'Geral',
      variables: 'Variáveis',
      volumes: 'Volumes',
      network: 'Rede',
      json: 'JSON',
      copy: 'Copiar',
      copied: 'Copiado',
      fullId: 'ID Completo:',
      name: 'Nome:',
      image: 'Imagem:',
      created: 'Criado em:',
      command: 'Comando:',
      workDir: 'Diretório de Trabalho:',
      ip: 'Endereço IP:',
      gateway: 'Gateway:',
      connectedNetworks: 'Redes',
      noVolumes: 'Nenhum volume montado.'
    },
    logs: {
      searchPlaceholder: 'Buscar...',
      tail: 'Tail:',
      scroll: 'Rolar'
    },
    terminal: {
      connected: 'Conectado',
      connecting: 'Conectando...',
      disconnected: 'Desconectado',
      reconnect: 'Reconectar',
      stopped: 'Parado',
      stoppedDesc: 'Inicie o container para abrir o terminal.'
    },
    servers: {
      title: 'Servidores',
      saved: 'Salvos',
      new: 'Novo',
      connect: 'Conectar',
      connecting: 'Conectando...',
      connected: 'Conectado',
      name: 'Nome',
      host: 'Host',
      port: 'Porta',
      user: 'Usuário',
      auth: 'Autenticação',
      password: 'Senha',
      key: 'Chave',
      save: 'Salvar',
      cancel: 'Cancelar'
    },
    shortcuts: {
      title: 'Atalhos',
      navigate: 'Navegar',
      metrics: 'Métricas',
      logs: 'Logs',
      terminal: 'Terminal',
      inspect: 'Inspecionar',
      restart: 'Reiniciar',
      stop: 'Parar',
      pause: 'Pausar',
      reload: 'Recarregar',
      help: 'Ajuda',
      close: 'Fechar'
    },
    settings: {
      title: 'Configurações',
      theme: 'Tema',
      dark: 'Escuro',
      light: 'Claro',
      language: 'Idioma',
      pt: 'Português',
      en: 'English',
      close: 'Fechar'
    },
    common: {
      none: 'Nenhum'
    }
  },
  en: {
    tabs: {
      metrics: 'Metrics',
      logs: 'Logs',
      terminal: 'Terminal',
      inspect: 'Inspect'
    },
    actions: {
      start: 'Start',
      stop: 'Stop',
      restart: 'Restart',
      pause: 'Pause',
      unpause: 'Unpause',
      remove: 'Remove'
    },
    metrics: {
      cpu: 'CPU',
      memory: 'Memory',
      network: 'Network',
      disk: 'Disk',
      pids: 'PIDs',
      limit: 'Limit',
      download: '↓ Download',
      upload: '↑ Upload',
      read: 'Read',
      write: 'Write',
      stopped: 'Stopped',
      stoppedDesc: 'Start container to monitor real-time metrics.'
    },
    periods: {
      '30s': '30s',
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '24h': '24h',
      '3d': '3 days',
      '7d': 'Week'
    },
    sidebar: {
      all: 'All',
      running: 'Running',
      exited: 'Stopped',
      filterPlaceholder: 'Filter...',
      local: 'Local',
      empty: 'No containers found.'
    },
    inspect: {
      general: 'General',
      variables: 'Variables',
      volumes: 'Volumes',
      network: 'Network',
      json: 'JSON',
      copy: 'Copy',
      copied: 'Copied',
      fullId: 'Full ID:',
      name: 'Name:',
      image: 'Image:',
      created: 'Created at:',
      command: 'Command:',
      workDir: 'Working Dir:',
      ip: 'IP Address:',
      gateway: 'Gateway:',
      connectedNetworks: 'Networks',
      noVolumes: 'No volumes mounted.'
    },
    logs: {
      searchPlaceholder: 'Search...',
      tail: 'Tail:',
      scroll: 'Scroll'
    },
    terminal: {
      connected: 'Connected',
      connecting: 'Connecting...',
      disconnected: 'Disconnected',
      reconnect: 'Reconnect',
      stopped: 'Stopped',
      stoppedDesc: 'Start container to open shell terminal.'
    },
    servers: {
      title: 'Servers',
      saved: 'Saved',
      new: 'New',
      connect: 'Connect',
      connecting: 'Connecting...',
      connected: 'Connected',
      name: 'Name',
      host: 'Host',
      port: 'Port',
      user: 'User',
      auth: 'Auth',
      password: 'Password',
      key: 'Key',
      save: 'Save',
      cancel: 'Cancel'
    },
    shortcuts: {
      title: 'Shortcuts',
      navigate: 'Navigate',
      metrics: 'Metrics',
      logs: 'Logs',
      terminal: 'Terminal',
      inspect: 'Inspect',
      restart: 'Restart',
      stop: 'Stop',
      pause: 'Pause',
      reload: 'Reload',
      help: 'Help',
      close: 'Close'
    },
    settings: {
      title: 'Settings',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      language: 'Language',
      pt: 'Português',
      en: 'English',
      close: 'Close'
    },
    common: {
      none: 'None'
    }
  }
};
