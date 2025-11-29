import React, { useEffect, useRef, useState } from 'react';
import { Button, message, Spin, Alert, Segmented, Select } from 'antd';
import { SaveOutlined, ReloadOutlined, EyeOutlined, EditOutlined, ColumnWidthOutlined, BgColorsOutlined } from '@ant-design/icons';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { defaultHighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { readFile, saveFile } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark as syntaxOneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 导入多个主题
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { duotoneLight, duotoneDark } from '@uiw/codemirror-theme-duotone';
import { nord } from '@uiw/codemirror-theme-nord';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { solarizedLight, solarizedDark } from '@uiw/codemirror-theme-solarized';
import { materialDark, materialLight } from '@uiw/codemirror-theme-material';

interface CodeEditorProps {
  projectName: string;
  filePath: string | null;
}

type PreviewMode = 'edit' | 'preview' | 'split';

// 主题配置
const themes: { label: string; value: string; theme: Extension; category: 'light' | 'dark' }[] = [
  { label: 'GitHub Light', value: 'github-light', theme: githubLight, category: 'light' },
  { label: 'GitHub Dark', value: 'github-dark', theme: githubDark, category: 'dark' },
  { label: 'VS Code Light', value: 'vscode-light', theme: vscodeLight, category: 'light' },
  { label: 'VS Code Dark', value: 'vscode-dark', theme: vscodeDark, category: 'dark' },
  { label: 'One Dark', value: 'one-dark', theme: oneDark, category: 'dark' },
  { label: 'Dracula', value: 'dracula', theme: dracula, category: 'dark' },
  { label: 'Nord', value: 'nord', theme: nord, category: 'dark' },
  { label: 'Tokyo Night', value: 'tokyo-night', theme: tokyoNight, category: 'dark' },
  { label: 'Solarized Light', value: 'solarized-light', theme: solarizedLight, category: 'light' },
  { label: 'Solarized Dark', value: 'solarized-dark', theme: solarizedDark, category: 'dark' },
  { label: 'Material Light', value: 'material-light', theme: materialLight, category: 'light' },
  { label: 'Material Dark', value: 'material-dark', theme: materialDark, category: 'dark' },
  { label: 'Duotone Light', value: 'duotone-light', theme: duotoneLight, category: 'light' },
  { label: 'Duotone Dark', value: 'duotone-dark', theme: duotoneDark, category: 'dark' },
];

// 语言扩展映射
const languageExtensions: Record<string, any> = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  html: html(),
  css: css(),
  json: json(),
  markdown: markdown(),
  python: python(),
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  projectName,
  filePath
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileData, setFileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('edit');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('github-light'); // 默认主题
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // 判断是否是 Markdown 文件
  const isMarkdown = filePath?.endsWith('.md') || false;

  // 获取当前主题配置
  const currentTheme = themes.find(t => t.value === selectedTheme) || themes[0];
  const editorBgColor = currentTheme.category === 'dark' ? '#282c34' : '#ffffff';

  useEffect(() => {
    if (filePath) {
      loadFile();
      setPreviewMode('edit'); // 重置预览模式
    } else {
      // 清空编辑器
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      setFileData(null);
      setError(null);
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [filePath, projectName]);

  // 监听主题变化，重新初始化编辑器
  useEffect(() => {
    if (fileData && viewRef.current) {
      console.log('主题切换，重新初始化编辑器');
      initializeEditor(fileData);
    }
  }, [selectedTheme]);

  const loadFile = async () => {
    if (!filePath) return;

    setLoading(true);
    setError(null);

    try {
      const result = await readFile(projectName, filePath);
      if (result.success && result.data) {
        setFileData(result.data);
        setMarkdownContent(result.data.content);
        initializeEditor(result.data);
      }
    } catch (error: any) {
      console.error('加载文件失败:', error);
      setError(error.message || '加载文件失败');
      message.error('加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  const initializeEditor = (data: any) => {
    if (!editorRef.current) {
      console.warn('编辑器容器未准备好，延迟初始化');
      // 延迟初始化，确保 DOM 已渲染
      setTimeout(() => initializeEditor(data), 50);
      return;
    }

    // 销毁旧编辑器
    if (viewRef.current) {
      try {
        viewRef.current.destroy();
      } catch (e) {
        console.warn('销毁编辑器时出错:', e);
      }
      viewRef.current = null;
    }

    // 清空容器
    editorRef.current.innerHTML = '';

    // 获取语言扩展
    const langExtension = languageExtensions[data.language] || [];

    // 创建编辑器状态
    const state = EditorState.create({
      doc: data.content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle),
        langExtension,
        currentTheme.theme, // 使用选中的主题
        EditorView.lineWrapping,
        keymap.of([
          ...defaultKeymap,
          indentWithTab,
          // 自定义保存快捷键
          {
            key: 'Mod-s',
            run: () => {
              handleSave();
              return true;
            }
          }
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // 实时更新 Markdown 预览
            const content = update.state.doc.toString();
            setMarkdownContent(content);
          }
        })
      ]
    });

    // 创建编辑器视图
    try {
      const view = new EditorView({
        state,
        parent: editorRef.current,
        // 确保编辑器撑满容器
        root: document
      });

      viewRef.current = view;
      console.log('编辑器初始化成功', data.language, data.size, '主题:', selectedTheme);

      // 强制编辑器计算高度
      requestAnimationFrame(() => {
        if (viewRef.current) {
          viewRef.current.requestMeasure();
        }
      });
    } catch (e) {
      console.error('初始化编辑器失败:', e);
      setError('编辑器初始化失败');
    }
  };

  const handleSave = async () => {
    if (!filePath || !viewRef.current) return;

    setSaving(true);
    try {
      const content = viewRef.current.state.doc.toString();
      const result = await saveFile(projectName, filePath, content);

      if (result.success) {
        message.success('保存成功');
        // 更新文件数据
        setFileData({
          ...fileData,
          size: result.data.size,
          modifiedAt: result.data.modifiedAt
        });
      }
    } catch (error: any) {
      console.error('保存文件失败:', error);
      message.error('保存文件失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReload = () => {
    loadFile();
  };

  // 未选择文件
  if (!filePath) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#999',
        fontSize: '14px'
      }}>
        请从左侧选择文件进行编辑
      </div>
    );
  }

  // 加载中
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <Spin tip="加载文件中..." size="large" spinning={true}>
          <div style={{ minHeight: '200px' }} />
        </Spin>
      </div>
    );
  }

  // 加载错误
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          type="error"
          message="加载失败"
          description={error}
          showIcon
          action={
            <Button size="small" onClick={handleReload}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  // 文件过大警告
  if (fileData && fileData.size > 2 * 1024 * 1024) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          type="warning"
          message="文件过大"
          description={`文件大小 ${(fileData.size / 1024 / 1024).toFixed(2)} MB，建议使用本地编辑器打开`}
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: editorBgColor
    }}>
      {/* 工具栏 */}
      <div style={{
        padding: '8px 16px',
        borderBottom: currentTheme.category === 'dark' ? '1px solid #21252b' : '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: currentTheme.category === 'dark' ? '#21252b' : '#f5f5f5'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: currentTheme.category === 'dark' ? '#abb2bf' : '#333' }}>
            {filePath}
          </span>
          {fileData && (
            <span style={{ fontSize: '12px', color: currentTheme.category === 'dark' ? '#5c6370' : '#666' }}>
              {fileData.language} · {(fileData.size / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* 主题选择器 */}
          <Select
            value={selectedTheme}
            onChange={setSelectedTheme}
            size="small"
            style={{ width: 180 }}
            suffixIcon={<BgColorsOutlined />}
            popupMatchSelectWidth={220}
            optionRender={(option) => {
              const theme = themes.find(t => t.value === option.value);
              const isDark = theme?.category === 'dark';
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '4px 0'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: isDark
                      ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                    border: isDark ? '1px solid #404040' : '1px solid #d0d0d0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f1f1f'
                    }}>
                      {option.label}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#8c8c8c',
                      marginTop: '2px'
                    }}>
                      {isDark ? '暗色主题' : '亮色主题'}
                    </div>
                  </div>
                </div>
              );
            }}
          >
            {themes.map(theme => (
              <Select.Option key={theme.value} value={theme.value}>
                {theme.label}
              </Select.Option>
            ))}
          </Select>

          {/* Markdown 预览模式切换 */}
          {isMarkdown && (
            <Segmented
              value={previewMode}
              onChange={(value) => setPreviewMode(value as PreviewMode)}
              options={[
                {
                  label: '编辑',
                  value: 'edit',
                  icon: <EditOutlined />
                },
                {
                  label: '预览',
                  value: 'preview',
                  icon: <EyeOutlined />
                },
                {
                  label: '分屏',
                  value: 'split',
                  icon: <ColumnWidthOutlined />
                }
              ]}
              size="small"
            />
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReload}
            size="small"
          >
            重新加载
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            size="small"
          >
            保存 (Ctrl+S)
          </Button>
        </div>
      </div>

      {/* 编辑器和预览区域 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 编辑器容器 - 始终渲染，通过 display 控制显示 */}
        <div
          ref={editorRef}
          style={{
            flex: previewMode === 'split' ? 1 : (previewMode === 'edit' ? '100%' : 0),
            display: previewMode === 'preview' ? 'none' : 'block',
            overflow: 'auto',
            minHeight: 0,
            position: 'relative',
            borderRight: previewMode === 'split'
              ? (currentTheme.category === 'dark' ? '1px solid #21252b' : '1px solid #e5e7eb')
              : 'none'
          }}
        />

        {/* Markdown 预览容器 */}
        {isMarkdown && (previewMode === 'preview' || previewMode === 'split') && (
          <div style={{
            flex: previewMode === 'split' ? 1 : '100%',
            overflow: 'auto',
            padding: '20px',
            backgroundColor: '#fff',
            color: '#333'
          }}>
            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={syntaxOneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props} style={{
                        backgroundColor: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                        fontFamily: 'monospace'
                      }}>
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 style={{
                      fontSize: '2em',
                      fontWeight: '600',
                      marginTop: '24px',
                      marginBottom: '16px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 style={{
                      fontSize: '1.5em',
                      fontWeight: '600',
                      marginTop: '24px',
                      marginBottom: '16px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 style={{
                      fontSize: '1.25em',
                      fontWeight: '600',
                      marginTop: '20px',
                      marginBottom: '12px'
                    }}>{children}</h3>
                  ),
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.2s'
                    }} onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}>{children}</a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote style={{
                      borderLeft: '4px solid #e5e7eb',
                      paddingLeft: '16px',
                      marginLeft: 0,
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>{children}</blockquote>
                  ),
                  table: ({ children }) => (
                    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                      <table style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        border: '1px solid #e5e7eb'
                      }}>{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th style={{
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}>{children}</th>
                  ),
                  td: ({ children }) => (
                    <td style={{
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb'
                    }}>{children}</td>
                  ),
                  ul: ({ children }) => (
                    <ul style={{
                      paddingLeft: '24px',
                      margin: '12px 0'
                    }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{
                      paddingLeft: '24px',
                      margin: '12px 0'
                    }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{
                      margin: '4px 0'
                    }}>{children}</li>
                  ),
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt} style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      margin: '16px 0'
                    }} />
                  ),
                  p: ({ children }) => (
                    <p style={{
                      margin: '12px 0'
                    }}>{children}</p>
                  )
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
