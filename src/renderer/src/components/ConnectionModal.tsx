import React, { useState } from 'react';
import { ConnectionProfile } from '../../../shared/types';
import {
  X,
  Server,
  Plus,
  Trash2,
  Check,
  Shield,
  Key,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: ConnectionProfile[];
  activeProfile?: ConnectionProfile;
  onSwitchConnection: (profileId: string) => Promise<void>;
  onSaveProfile: (profile: ConnectionProfile) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onSwitchConnection,
  onSaveProfile,
  onDeleteProfile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'local' | 'ssh'>('ssh');
  const [formHost, setFormHost] = useState('');
  const [formPort, setFormPort] = useState(22);
  const [formUsername, setFormUsername] = useState('root');
  const [formAuthType, setFormAuthType] = useState<'password' | 'privateKey'>('password');
  const [formPassword, setFormPassword] = useState('');
  const [formPrivateKey, setFormPrivateKey] = useState('');

  if (!isOpen) return null;

  const handleStartNew = () => {
    setFormName('');
    setFormType('ssh');
    setFormHost('');
    setFormPort(22);
    setFormUsername('root');
    setFormAuthType('password');
    setFormPassword('');
    setFormPrivateKey('');
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      setErrorMsg('Informe um nome para a conexão.');
      return;
    }

    const newProfile: ConnectionProfile = {
      id: `profile-${Date.now()}`,
      name: formName,
      type: formType,
      host: formHost,
      port: formPort,
      username: formUsername,
      authType: formAuthType,
      password: formPassword,
      privateKey: formPrivateKey
    };

    try {
      await onSaveProfile(newProfile);
      setIsEditing(false);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar perfil.');
    }
  };

  const handleSwitch = async (id: string) => {
    setSwitchingId(id);
    setErrorMsg(null);
    try {
      await onSwitchConnection(id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao conectar no host selecionado.');
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold text-gray-100">
              Servidores
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-surfaceHover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 py-2.5 text-xs text-rose-400 font-mono">
            {errorMsg}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isEditing ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">
                  Salvos
                </span>
                <button
                  onClick={handleStartNew}
                  className="px-2.5 py-1 text-xs bg-accent hover:bg-accent/80 text-background rounded font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo</span>
                </button>
              </div>

              <div className="space-y-2">
                {profiles.map((p) => {
                  const isActive = activeProfile?.id === p.id;
                  const isSwitching = switchingId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-accent/10 border-accent'
                          : 'bg-background border-border hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isActive ? 'bg-emerald-400' : 'bg-gray-600'
                          }`}
                        />
                        <div>
                          <div className="text-xs font-bold text-gray-100">
                            {p.name}
                          </div>
                          <div className="text-[11px] font-mono text-gray-400">
                            {p.type === 'local'
                              ? 'Socket local: /var/run/docker.sock'
                              : `SSH: ${p.username}@${p.host}:${p.port || 22}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                            <Check className="w-3 h-3" /> Conectado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitch(p.id)}
                            disabled={isSwitching}
                            className="px-3 py-1 text-xs bg-surfaceHover hover:bg-border text-gray-200 border border-border rounded font-medium flex items-center gap-1 transition-colors"
                          >
                            <span>{isSwitching ? 'Conectando...' : 'Conectar'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {p.id !== 'local-default' && (
                          <button
                            onClick={() => onDeleteProfile(p.id)}
                            className="p-1.5 text-gray-500 hover:text-rose-400 rounded hover:bg-surfaceHover transition-colors"
                            title="Excluir Conexão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Form to add server */
            <form onSubmit={handleSave} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Servidor Produção"
                  required
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-gray-200 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-gray-400 mb-1">Host</label>
                  <input
                    type="text"
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    placeholder="192.168.1.100 ou servidor.com"
                    required
                    className="w-full px-3 py-1.5 bg-background border border-border rounded text-gray-200 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Porta</label>
                  <input
                    type="number"
                    value={formPort}
                    onChange={(e) => setFormPort(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded text-gray-200 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Usuário</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="root ou ubuntu"
                  required
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-gray-200 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Autenticação
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormAuthType('password')}
                    className={`flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 transition-colors ${
                      formAuthType === 'password'
                        ? 'bg-accent/15 border-accent text-accent font-semibold'
                        : 'border-border text-gray-400 hover:bg-surfaceHover'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Senha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAuthType('privateKey')}
                    className={`flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 transition-colors ${
                      formAuthType === 'privateKey'
                        ? 'bg-accent/15 border-accent text-accent font-semibold'
                        : 'border-border text-gray-400 hover:bg-surfaceHover'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Chave</span>
                  </button>
                </div>
              </div>

              {formAuthType === 'password' ? (
                <div>
                  <label className="block text-gray-400 mb-1">Senha</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded text-gray-200 focus:outline-none focus:border-accent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-400 mb-1">
                    Chave
                  </label>
                  <textarea
                    rows={4}
                    value={formPrivateKey}
                    onChange={(e) => setFormPrivateKey(e.target.value)}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                    className="w-full px-3 py-1.5 bg-background border border-border rounded text-gray-200 focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-surfaceHover transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-accent hover:bg-accent/80 text-background rounded font-semibold transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
