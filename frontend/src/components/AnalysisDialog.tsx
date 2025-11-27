import { X, CheckCircle, FileCode, Package, Code2, BookOpen, Layout, Sparkles, Calendar, Play, Settings, FileText, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  projectName: string;
  analysis: any;
  onClose: () => void;
  onApplied?: () => void;
}

export default function AnalysisDialog({ projectName, analysis, onClose, onApplied }: Props) {
  const [applying, setApplying] = useState(false);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());
  const [applyMessage, setApplyMessage] = useState('');

  if (!analysis || !analysis.analyzed) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const handleApplyField = async (field: string) => {
    setApplying(true);
    setApplyMessage('');

    try {
      const response = await fetch(`/api/projects/${projectName}/apply-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: [field] })
      });

      const data = await response.json();

      if (data.success) {
        setAppliedFields(prev => new Set([...prev, field]));
        setApplyMessage(`✅ ${field} 已应用到配置`);
        if (onApplied) onApplied();
      } else {
        setApplyMessage(`❌ 应用失败: ${data.error}`);
      }
    } catch (error) {
      setApplyMessage(`❌ 应用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setApplying(false);
      setTimeout(() => setApplyMessage(''), 3000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
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
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
              项目分析详情
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* 状态 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            padding: '12px 16px',
            background: analysis.analysis_status === 'completed' ? '#dcfce7' : '#fef2f2',
            borderRadius: '8px',
            border: `1px solid ${analysis.analysis_status === 'completed' ? '#86efac' : '#fca5a5'}`
          }}>
            <CheckCircle
              size={20}
              color={analysis.analysis_status === 'completed' ? '#16a34a' : '#dc2626'}
            />
            <span style={{
              fontSize: '14px',
              color: analysis.analysis_status === 'completed' ? '#166534' : '#991b1b',
              fontWeight: '500'
            }}>
              {analysis.analysis_status === 'completed' ? '分析完成' : '分析失败'}
            </span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '13px',
              color: analysis.analysis_status === 'completed' ? '#16a34a' : '#dc2626'
            }}>
              {formatDate(analysis.analyzed_at)}
            </span>
          </div>

          {/* 基础信息 */}
          <Section title="基础信息" icon={<FileCode size={20} />}>
            <InfoGrid>
              {analysis.framework && (
                <InfoItem label="框架" value={analysis.framework} />
              )}
              {analysis.languages && (() => {
                try {
                  const langs = JSON.parse(analysis.languages);
                  return <InfoItem label="编程语言" value={langs.join(', ')} />;
                } catch {
                  return null;
                }
              })()}
              {analysis.file_count > 0 && (
                <InfoItem label="文件数" value={analysis.file_count.toString()} />
              )}
              {analysis.loc > 0 && (
                <InfoItem label="代码行数" value={analysis.loc.toLocaleString()} />
              )}
            </InfoGrid>
          </Section>

          {/* 项目配置 - 新增 */}
          <Section title="项目配置" icon={<Settings size={20} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysis.start_command && (
                <ConfigItem
                  label="启动命令"
                  value={analysis.start_command}
                  field="start_command"
                  applied={appliedFields.has('start_command')}
                  onApply={() => handleApplyField('start_command')}
                  applying={applying}
                />
              )}
              {analysis.port && (
                <ConfigItem
                  label="端口"
                  value={analysis.port.toString()}
                  field="port"
                  applied={appliedFields.has('port')}
                  onApply={() => handleApplyField('port')}
                  applying={applying}
                />
              )}
              {analysis.scripts && (() => {
                try {
                  const scripts = JSON.parse(analysis.scripts);
                  const scriptList = Object.entries(scripts).slice(0, 5);
                  if (scriptList.length > 0) {
                    return (
                      <div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>可用脚本</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {scriptList.map(([name, cmd]) => (
                            <div
                              key={name}
                              style={{
                                padding: '6px 12px',
                                background: '#f3f4f6',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontFamily: 'monospace'
                              }}
                            >
                              <span style={{ color: '#3b82f6', fontWeight: '600' }}>{name}</span>
                              <span style={{ color: '#6b7280' }}>: </span>
                              <span style={{ color: '#374151' }}>{cmd as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch {
                  return null;
                }
              })()}
              {analysis.environment_files && (() => {
                try {
                  const files = JSON.parse(analysis.environment_files);
                  if (files.length > 0) {
                    return (
                      <div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>环境文件</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {files.map((file: string) => (
                            <span
                              key={file}
                              style={{
                                padding: '4px 8px',
                                background: '#dbeafe',
                                color: '#1e40af',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontFamily: 'monospace'
                              }}
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch {
                  return null;
                }
              })()}
              {analysis.config_files && (() => {
                try {
                  const files = JSON.parse(analysis.config_files);
                  if (files.length > 0) {
                    return (
                      <div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>配置文件</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {files.map((file: string) => (
                            <span
                              key={file}
                              style={{
                                padding: '4px 8px',
                                background: '#f3f4f6',
                                color: '#374151',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontFamily: 'monospace'
                              }}
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch {
                  return null;
                }
              })()}
            </div>
          </Section>

          {/* 应用消息提示 */}
          {applyMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: applyMessage.startsWith('✅') ? '#dcfce7' : '#fef2f2',
              color: applyMessage.startsWith('✅') ? '#166534' : '#991b1b',
              fontSize: '14px',
              marginBottom: '16px',
              border: `1px solid ${applyMessage.startsWith('✅') ? '#86efac' : '#fca5a5'}`
            }}>
              {applyMessage}
            </div>
          )}

          {/* 依赖 */}
          {analysis.dependencies && (() => {
            try {
              const deps = JSON.parse(analysis.dependencies);
              return (
                <Section title="主要依赖" icon={<Package size={20} />}>
                  <DependenciesList dependencies={deps} />
                </Section>
              );
            } catch {
              return null;
            }
          })()}

          {/* README 摘要 */}
          {analysis.readme_summary && (
            <Section title="项目说明" icon={<BookOpen size={20} />}>
              <p style={{
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {analysis.readme_summary}
              </p>
            </Section>
          )}

          {/* 架构说明 */}
          {analysis.architecture_notes && (
            <Section title="架构说明" icon={<Layout size={20} />}>
              <p style={{
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {analysis.architecture_notes}
              </p>
            </Section>
          )}

          {/* 主要功能 */}
          {analysis.main_features && (
            <Section title="主要功能" icon={<Sparkles size={20} />}>
              <p style={{
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {analysis.main_features}
              </p>
            </Section>
          )}

          {/* 错误信息 */}
          {analysis.analysis_error && (
            <Section title="错误信息" icon={<X size={20} />}>
              <div style={{
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #fca5a5',
                fontSize: '13px',
                color: '#991b1b',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}>
                {analysis.analysis_error}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 32px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          position: 'sticky',
          bottom: 0,
          background: 'white'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              background: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <span style={{ color: '#3b82f6' }}>{icon}</span>
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    }}>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>
        {value}
      </div>
    </div>
  );
}

function DependenciesList({ dependencies }: { dependencies: any }) {
  // 处理新格式的依赖 {production: [], development: []}
  let depList: string[] = [];

  if (typeof dependencies === 'string') {
    try {
      const parsed = JSON.parse(dependencies);
      if (parsed.production && Array.isArray(parsed.production)) {
        depList = parsed.production;
      } else if (Array.isArray(parsed)) {
        depList = parsed;
      }
    } catch {
      // 忽略解析错误
    }
  } else if (dependencies?.production && Array.isArray(dependencies.production)) {
    depList = dependencies.production;
  } else if (Array.isArray(dependencies)) {
    depList = dependencies;
  }

  if (depList.length === 0) {
    return (
      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
        无依赖信息
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {depList.slice(0, 20).map((dep, index) => (
        <span
          key={index}
          style={{
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: '16px',
            fontSize: '13px',
            color: '#374151',
            fontFamily: 'monospace'
          }}
        >
          {dep}
        </span>
      ))}
      {depList.length > 20 && (
        <span style={{ fontSize: '13px', color: '#6b7280', alignSelf: 'center' }}>
          +{depList.length - 20} 更多...
        </span>
      )}
    </div>
  );
}

function ConfigItem({ label, value, field, applied, onApply, applying }: {
  label: string;
  value: string;
  field: string;
  applied: boolean;
  onApply: () => void;
  applying: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      background: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#111827',
          fontWeight: '500',
          fontFamily: 'monospace',
          background: 'white',
          padding: '6px 10px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          display: 'inline-block'
        }}>
          {value}
        </div>
      </div>
      <button
        onClick={onApply}
        disabled={applying || applied}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '6px',
          background: applied ? '#dcfce7' : '#3b82f6',
          color: applied ? '#166534' : 'white',
          fontSize: '13px',
          fontWeight: '500',
          cursor: applying || applied ? 'not-allowed' : 'pointer',
          opacity: applying ? 0.6 : 1,
          transition: 'all 0.2s'
        }}
      >
        {applied ? (
          <>
            <Check size={14} />
            已应用
          </>
        ) : (
          <>
            <Play size={14} />
            应用到配置
          </>
        )}
      </button>
    </div>
  );
}
