import React, { useState } from 'react';
import { ConnectionProfile } from '../../../shared/types';
import {
  X,
  Server,
  Plus,
  Trash2,
  Check,
  Key,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Language, translations } from '../i18n';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: ConnectionProfile[];
  activeProfile?: ConnectionProfile;
  onSwitchConnection: (profileId: string) => Promise<void>;
  onSaveProfile: (profile: ConnectionProfile) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  language: Language;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onSwitchConnection,
  onSaveProfile,
  onDeleteProfile,
  language
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = translations[language].servers;

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
      setErrorMsg(language === 'pt' ? 'Informe um nome.' : 'Provide a name.');
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
      setErrorMsg(err.message || 'Error');
    }
  };

  const handleSwitch = async (id: string) => {
    setSwitchingId(id);
    setErrorMsg(null);
    try {
      await onSwitchConnection(id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error');
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
            <h2 className="text-sm font-bold text-[var(--color-textMain)]">
              {t.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-textMuted)] hover:text-[var(--color-textMain)] p-1 rounded-md hover:bg-surfaceHover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 py-2.5 text-xs text-rose-500 font-mono">
            {errorMsg}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isEditing ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-textMuted)]">
                  {t.saved}
                </span>
                <button
                  onClick={handleStartNew}
                  className="px-2.5 py-1 text-xs bg-accent hover:bg-accent/80 text-white rounded font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.new}</span>
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
                          : 'bg-background border-border hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isActive ? 'bg-emerald-400' : 'bg-gray-400'
                          }`}
                        />
                        <div>
                          <div className="text-xs font-bold text-[var(--color-textMain)]">
                            {p.name}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--color-textMuted)]">
                            {p.type === 'local'
                              ? '/var/run/docker.sock'
                              : `SSH: ${p.username}@${p.host}:${p.port || 22}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="text-[11px] font-mono text-emerald-500 flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                            <Check className="w-3 h-3" /> {t.connected}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitch(p.id)}
                            disabled={isSwitching}
                            className="px-3 py-1 text-xs bg-surfaceHover hover:bg-border text-[var(--color-textMain)] border border-border rounded font-medium flex items-center gap-1 transition-colors"
                          >
                            <span>{isSwitching ? t.connecting : t.connect}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {p.id !== 'local-default' && (
                          <button
                            onClick={() => onDeleteProfile(p.id)}
                            className="p-1.5 text-[var(--color-textMuted)] hover:text-rose-500 rounded hover:bg-surfaceHover transition-colors"
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
            /* Form */
            <form onSubmit={handleSave} className="space-y-3 font-mono text-xs text-[var(--color-textMain)]">
              <div>
                <label className="block text-[var(--color-textMuted)] mb-1">
                  {t.name}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Server"
                  required
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-[var(--color-textMain)] focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[var(--color-textMuted)] mb-1">{t.host}</label>
                  <input
                    type="text"
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    placeholder="192.168.1.100"
                    required
                    className="w-full px-3 py-1.5 bg-background border border-border rounded text-[var(--color-textMain)] focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[var(--color-textMuted)] mb-1">{t.port}</label>
                  <input
                    type="number"
                    value={formPort}
                    onChange={(e) => setFormPort(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded text-[var(--color-textMain)] focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--color-textMuted)] mb-1">{t.user}</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="root"
                  required
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-[var(--color-textMain)] focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[var(--color-textMuted)] mb-1">
                  {t.auth}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormAuthType('password')}
                    className={`flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 transition-colors ${
                      formAuthType === 'password'
                        ? 'bg-accent/15 border-accent text-accent font-semibold'
                        : 'border-border text-[var(--color-textMuted)] hover:bg-surfaceHover'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t.password}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAuthType('privateKey')}
                    className={`flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 transition-colors ${
                      formAuthType === 'privateKey'
                        ? 'bg-accent/15 border-accent text-accent font-semibold'
                        : 'border-border text-[var(--color-textMuted)] hover:bg-surfaceHover'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{t.key}</span>
                  </button>
                </div>
              </div>

              {formAuthType === 'password' ? (
                <div>
                  <label className="block text-[var(--color-textMuted)] mb-1">{t.password}</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 bg-background border border-border rounded text-[var(--color-textMain)] focus:outline-none focus:border-accent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[var(--color-textMuted)] mb-1">
                    {t.key}
                  </label>
                  <textarea
                    rows={4}
                    value={formPrivateKey}
                    onChange={(e) => setFormPrivateKey(e.target.value)}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                    className="w-full px-3 py-1.5 bg-background border border-border rounded text-[var(--color-textMain)] focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded text-[var(--color-textMuted)] hover:text-[var(--color-textMain)] hover:bg-surfaceHover transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-accent hover:bg-accent/80 text-white rounded font-semibold transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
