import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, ExternalLink, Info } from 'lucide-react';

interface AppConfig {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_BASE_URL: string;
  PROJECT_ROOT: string;
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<AppConfig>({
    ANTHROPIC_API_KEY: '',
    ANTHROPIC_BASE_URL: 'https://api.husanai.com',
    PROJECT_ROOT: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:9999/api/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:9999/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '配置保存成功！' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || '保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存配置失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof AppConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <RefreshCw className="animate-spin" size={24} color="#3b82f6" />
          <span>加载配置中...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SettingsIcon size={24} color="#3b82f6" />
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>应用配置</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            关闭
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Info Banner */}
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px'
          }}>
            <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                🎯 Claude Code 项目管理系统
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                本系统专为使用 <strong>Claude Code</strong> 开发多个本地项目的开发者设计，帮助你高效管理项目状态、依赖和进程。
              </p>
              <p style={{ margin: 0 }}>
                配置 API Key 后，可以使用 AI 辅助功能（可选）。
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ANTHROPIC_API_KEY */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Anthropic API Key (可选)
              </label>
              <input
                type="password"
                value={config.ANTHROPIC_API_KEY}
                onChange={(e) => handleChange('ANTHROPIC_API_KEY', e.target.value)}
                placeholder="sk-ant-api03-..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                用于启用 AI 辅助功能（可选）。如果没有 API Key，可以到
                <a
                  href="https://api.husanai.com/register?aff=c34V"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    margin: '0 4px',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  虎三小破站 <ExternalLink size={12} />
                </a>
                申请。
              </div>
            </div>

            {/* ANTHROPIC_BASE_URL */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                API 基础地址
              </label>
              <input
                type="text"
                value={config.ANTHROPIC_BASE_URL}
                onChange={(e) => handleChange('ANTHROPIC_BASE_URL', e.target.value)}
                placeholder="https://api.husanai.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                Anthropic API 的基础 URL，默认使用虎三小破站的代理地址
              </div>
            </div>

            {/* PROJECT_ROOT */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                项目根目录
              </label>
              <input
                type="text"
                value={config.PROJECT_ROOT}
                onChange={(e) => handleChange('PROJECT_ROOT', e.target.value)}
                placeholder="/Users/username/Projects"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                Claude Code 项目的根目录路径，留空则使用默认路径（当前目录的上两级）
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              marginTop: '24px',
              padding: '12px 16px',
              borderRadius: '6px',
              background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '14px',
              border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`
            }}>
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: saving ? '#9ca3af' : '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  保存配置
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
