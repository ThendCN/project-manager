# 文件管理和编辑器功能技术方案

> **版本**: v1.0
> **创建时间**: 2025-11-29
> **状态**: 方案设计阶段

## 📑 目录

- [1. 需求分析](#1-需求分析)
- [2. 开源组件选型](#2-开源组件选型)
- [3. 架构设计](#3-架构设计)
- [4. API 设计](#4-api-设计)
- [5. 实现步骤](#5-实现步骤)
- [6. 工作量评估](#6-工作量评估)
- [7. 风险和注意事项](#7-风险和注意事项)

---

## 1. 需求分析

### 1.1 功能需求

#### 文件管理
- ✅ **基础浏览**: 查看项目文件树结构
- ✅ **文件预览**: 点击文件显示内容
- ✅ **路径导航**: 显示当前文件路径
- 🔮 **搜索功能**: 按文件名搜索（后续扩展）
- 🔮 **文件操作**: 创建/删除/重命名（后续扩展）

#### 代码编辑器
- ✅ **语法高亮**: 支持主流编程语言
- ✅ **智能提示**: 代码自动补全
- ✅ **多光标编辑**: 同时编辑多处
- ✅ **查找替换**: 快捷搜索和批量替换
- ✅ **代码折叠**: 折叠/展开代码块
- ✅ **主题切换**: 支持明暗主题
- ✅ **保存文件**: 实时保存到服务器

### 1.2 非功能需求

- **性能**: 编辑器加载时间 < 2秒
- **兼容性**: 支持 Chrome/Edge/Firefox 最新版本
- **安全性**: 防止路径遍历攻击
- **用户体验**: 类似 VS Code 的操作体验

---

## 2. 开源组件选型

### 2.1 代码编辑器对比

| 组件 | 许可证 | 包大小 | 功能完整度 | 推荐度 |
|------|--------|--------|-----------|--------|
| **Monaco Editor** | MIT | ~2MB | ⭐⭐⭐⭐⭐ | ✅ **强烈推荐** |
| CodeMirror 6 | MIT | ~200KB | ⭐⭐⭐⭐ | 轻量但需要自己组装功能 |
| Ace Editor | BSD | ~600KB | ⭐⭐⭐ | 老牌但功能较弱 |

#### Monaco Editor 核心优势

```typescript
// 开箱即用的强大功能
- 语法高亮: 支持 100+ 编程语言
- 智能提示: IntelliSense（类 VS Code）
- 多光标: 完整的多光标编辑
- 代码折叠: 自动识别代码块
- Diff 对比: 内置文件对比视图
- 命令面板: Ctrl+P 快速跳转
- 快捷键: 完全兼容 VS Code 快捷键
```

**官方资源**:
- GitHub: https://github.com/microsoft/monaco-editor
- 在线 Demo: https://microsoft.github.io/monaco-editor/
- React 集成: `@monaco-editor/react` (MIT)

### 2.2 文件管理器方案

**推荐方案**: **自定义组件** + **Ant Design Tree**

#### 为什么不用第三方文件管理器组件？

| 第三方组件 | 问题 |
|-----------|------|
| react-file-manager | 功能过于重量级，样式难定制 |
| chonky | 依赖较多，学习成本高 |
| react-files | 长期未维护，兼容性问题 |

#### 自定义方案优势

✅ **完全可控**: 样式和交互完全自定义
✅ **轻量级**: 仅引入 Ant Design Tree 组件
✅ **易维护**: 代码简单清晰，易于扩展
✅ **一致性**: 与现有 UI 风格保持统一

```typescript
// 核心依赖
import { Tree } from 'antd'; // 已有依赖，无需额外安装
```

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────┐
│           前端 (React + TypeScript)          │
├─────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────────┐  │
│  │ FileExplorer │    │  CodeEditor      │  │
│  │  组件        │◄──►│  (Monaco)        │  │
│  │ (Ant Tree)   │    │                  │  │
│  └──────────────┘    └──────────────────┘  │
│         ▲                      ▲            │
│         │                      │            │
│         ▼                      ▼            │
│  ┌──────────────────────────────────────┐  │
│  │       api.ts (API 调用封装)          │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                     │
              HTTP REST API
                     │
┌─────────────────────────────────────────────┐
│           后端 (Node.js + Express)          │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │   fileRoutes.js (新增)               │  │
│  │  - GET  /api/projects/:name/files    │  │
│  │  - GET  /api/files/read              │  │
│  │  - POST /api/files/save              │  │
│  └──────────────────────────────────────┘  │
│                    ▲                        │
│                    │                        │
│  ┌──────────────────────────────────────┐  │
│  │   fileManager.js (新增)              │  │
│  │  - 文件树生成                         │  │
│  │  - 文件读写                           │  │
│  │  - 路径安全验证                       │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                     │
              文件系统 (fs)
                     │
           ┌─────────────────┐
           │  项目文件系统    │
           └─────────────────┘
```

### 3.2 组件结构

#### 前端组件树

```
App.tsx
└── ProjectDetail (新增或改造现有组件)
    ├── FileExplorer.tsx (新增)
    │   └── Tree (Ant Design)
    │
    └── CodeEditor.tsx (新增)
        └── MonacoEditor (@monaco-editor/react)
```

#### 后端模块

```
backend/
├── fileRoutes.js      (新增) - Express 路由
├── fileManager.js     (新增) - 业务逻辑
└── server.js          (修改) - 注册路由
```

### 3.3 数据流

#### 文件树加载流程

```
1. 用户点击项目
   └─> FileExplorer 组件挂载

2. 发起 API 请求
   └─> GET /api/projects/:name/files
       └─> fileManager.generateFileTree()
           └─> 递归读取目录结构
               └─> 过滤 node_modules, .git 等
                   └─> 返回树形 JSON

3. 前端渲染文件树
   └─> Ant Design Tree 组件展示
```

#### 文件编辑流程

```
1. 用户点击文件节点
   └─> 触发 onSelect 事件

2. 读取文件内容
   └─> GET /api/files/read?path=xxx
       └─> fileManager.readFile()
           └─> 安全路径验证
               └─> fs.readFileSync()
                   └─> 返回文件内容

3. Monaco Editor 加载内容
   └─> 自动检测语言类型
       └─> 应用语法高亮

4. 用户编辑后保存
   └─> POST /api/files/save
       └─> fileManager.saveFile()
           └─> fs.writeFileSync()
               └─> 返回保存结果
```

---

## 4. API 设计

### 4.1 获取文件树

**请求**:
```http
GET /api/projects/:name/files
```

**查询参数**:
- `path` (可选): 子目录路径，默认为项目根目录

**响应**:
```json
{
  "success": true,
  "data": {
    "name": "project-manager",
    "path": "/Users/thend/Project/project-manager",
    "type": "directory",
    "children": [
      {
        "name": "backend",
        "path": "backend",
        "type": "directory",
        "children": [
          {
            "name": "server.js",
            "path": "backend/server.js",
            "type": "file",
            "size": 15234,
            "extension": ".js"
          }
        ]
      },
      {
        "name": "frontend",
        "path": "frontend",
        "type": "directory",
        "children": [...]
      }
    ]
  }
}
```

**类型定义**:
```typescript
interface FileNode {
  name: string;        // 文件/目录名
  path: string;        // 相对路径
  type: 'file' | 'directory';
  size?: number;       // 文件大小(字节)
  extension?: string;  // 文件扩展名
  children?: FileNode[]; // 子节点(仅目录)
}
```

### 4.2 读取文件内容

**请求**:
```http
GET /api/files/read
```

**查询参数**:
- `project` (必需): 项目名称
- `path` (必需): 文件相对路径

**响应**:
```json
{
  "success": true,
  "data": {
    "path": "backend/server.js",
    "content": "const express = require('express');\n...",
    "size": 15234,
    "encoding": "utf-8",
    "language": "javascript"  // 自动检测
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "File not found",
  "message": "文件不存在: backend/xxx.js"
}
```

### 4.3 保存文件

**请求**:
```http
POST /api/files/save
Content-Type: application/json

{
  "project": "project-manager",
  "path": "backend/server.js",
  "content": "const express = require('express');\n..."
}
```

**响应**:
```json
{
  "success": true,
  "message": "文件保存成功",
  "data": {
    "path": "backend/server.js",
    "size": 15678,
    "modifiedAt": "2025-11-29T12:34:56.789Z"
  }
}
```

### 4.4 安全策略

#### 路径遍历防护

```javascript
// fileManager.js
function validatePath(projectPath, relativePath) {
  const fullPath = path.join(projectPath, relativePath);
  const normalizedPath = path.normalize(fullPath);

  // 确保路径在项目目录内
  if (!normalizedPath.startsWith(projectPath)) {
    throw new Error('非法路径访问');
  }

  return normalizedPath;
}
```

#### 忽略敏感目录

```javascript
const IGNORED_DIRS = [
  'node_modules',
  '.git',
  '.vscode',
  'dist',
  'build',
  '.env',
  '.DS_Store'
];
```

---

## 5. 实现步骤

### 阶段一: 后端 API 开发 (2-3 小时)

#### 步骤 1: 创建 fileManager.js

```javascript
// backend/fileManager.js
const fs = require('fs');
const path = require('path');

class FileManager {
  constructor() {
    this.ignoredDirs = ['node_modules', '.git', 'dist'];
  }

  // 生成文件树
  generateFileTree(rootPath, relativePath = '') {
    const fullPath = this.validatePath(rootPath, relativePath);
    const stats = fs.statSync(fullPath);

    if (stats.isFile()) {
      return this.createFileNode(fullPath, relativePath);
    }

    const children = fs.readdirSync(fullPath)
      .filter(name => !this.shouldIgnore(name))
      .map(name => {
        const childPath = path.join(relativePath, name);
        return this.generateFileTree(rootPath, childPath);
      });

    return {
      name: path.basename(fullPath),
      path: relativePath,
      type: 'directory',
      children
    };
  }

  // 读取文件
  readFile(projectPath, filePath) {
    const fullPath = this.validatePath(projectPath, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const stats = fs.statSync(fullPath);

    return {
      path: filePath,
      content,
      size: stats.size,
      encoding: 'utf-8',
      language: this.detectLanguage(filePath)
    };
  }

  // 保存文件
  saveFile(projectPath, filePath, content) {
    const fullPath = this.validatePath(projectPath, filePath);
    fs.writeFileSync(fullPath, content, 'utf-8');
    const stats = fs.statSync(fullPath);

    return {
      path: filePath,
      size: stats.size,
      modifiedAt: new Date().toISOString()
    };
  }

  // 路径验证
  validatePath(projectPath, relativePath) {
    const fullPath = path.join(projectPath, relativePath);
    const normalizedPath = path.normalize(fullPath);

    if (!normalizedPath.startsWith(projectPath)) {
      throw new Error('非法路径访问');
    }

    return normalizedPath;
  }

  // 语言检测
  detectLanguage(filePath) {
    const ext = path.extname(filePath);
    const langMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascriptreact',
      '.tsx': 'typescriptreact',
      '.py': 'python',
      '.java': 'java',
      '.json': 'json',
      '.md': 'markdown',
      '.css': 'css',
      '.html': 'html'
    };
    return langMap[ext] || 'plaintext';
  }

  shouldIgnore(name) {
    return this.ignoredDirs.includes(name) || name.startsWith('.');
  }

  createFileNode(fullPath, relativePath) {
    const stats = fs.statSync(fullPath);
    return {
      name: path.basename(fullPath),
      path: relativePath,
      type: 'file',
      size: stats.size,
      extension: path.extname(fullPath)
    };
  }
}

module.exports = new FileManager();
```

#### 步骤 2: 创建 fileRoutes.js

```javascript
// backend/fileRoutes.js
const express = require('express');
const router = express.Router();
const fileManager = require('./fileManager');
const { getProjectPath } = require('./utils'); // 复用现有工具函数

// 获取文件树
router.get('/projects/:name/files', (req, res) => {
  try {
    const { name } = req.params;
    const { path: subPath = '' } = req.query;

    const projectPath = getProjectPath(name);
    if (!projectPath) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    const tree = fileManager.generateFileTree(projectPath, subPath);
    res.json({ success: true, data: tree });
  } catch (error) {
    console.error('获取文件树失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 读取文件
router.get('/files/read', (req, res) => {
  try {
    const { project, path } = req.query;

    if (!project || !path) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数'
      });
    }

    const projectPath = getProjectPath(project);
    if (!projectPath) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    const fileData = fileManager.readFile(projectPath, path);
    res.json({ success: true, data: fileData });
  } catch (error) {
    console.error('读取文件失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 保存文件
router.post('/files/save', (req, res) => {
  try {
    const { project, path, content } = req.body;

    if (!project || !path || content === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数'
      });
    }

    const projectPath = getProjectPath(project);
    if (!projectPath) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    const result = fileManager.saveFile(projectPath, path, content);
    res.json({
      success: true,
      message: '文件保存成功',
      data: result
    });
  } catch (error) {
    console.error('保存文件失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

#### 步骤 3: 注册路由

```javascript
// backend/server.js (修改)
const fileRoutes = require('./fileRoutes');

// 在现有路由注册后添加
app.use('/api', fileRoutes);
```

---

### 阶段二: 前端组件开发 (4-5 小时)

#### 步骤 1: 安装依赖

```bash
cd frontend
npm install @monaco-editor/react
```

#### 步骤 2: 创建 FileExplorer 组件

```typescript
// frontend/src/components/FileExplorer.tsx
import React, { useEffect, useState } from 'react';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { FileOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { getProjectFiles } from '../api';
import type { FileNode } from '../types';

interface FileExplorerProps {
  projectName: string;
  onFileSelect: (filePath: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projectName,
  onFileSelect
}) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFileTree();
  }, [projectName]);

  const loadFileTree = async () => {
    setLoading(true);
    try {
      const result = await getProjectFiles(projectName);
      if (result.success) {
        const nodes = convertToTreeData(result.data);
        setTreeData(nodes);
      }
    } catch (error) {
      console.error('加载文件树失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToTreeData = (node: FileNode): DataNode => {
    const isDirectory = node.type === 'directory';

    return {
      key: node.path,
      title: node.name,
      icon: isDirectory ? <FolderOutlined /> : <FileOutlined />,
      isLeaf: !isDirectory,
      children: node.children?.map(convertToTreeData)
    };
  };

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const filePath = selectedKeys[0] as string;
      onFileSelect(filePath);
    }
  };

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      borderRight: '1px solid #e8e8e8',
      padding: '12px'
    }}>
      <Tree
        showIcon
        showLine
        treeData={treeData}
        onSelect={handleSelect}
        loading={loading}
      />
    </div>
  );
};
```

#### 步骤 3: 创建 CodeEditor 组件

```typescript
// frontend/src/components/CodeEditor.tsx
import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { readFile, saveFile } from '../api';

interface CodeEditorProps {
  projectName: string;
  filePath: string | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  projectName,
  filePath
}) => {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (filePath) {
      loadFile(filePath);
    }
  }, [filePath]);

  const loadFile = async (path: string) => {
    setLoading(true);
    try {
      const result = await readFile(projectName, path);
      if (result.success) {
        setContent(result.data.content);
        setLanguage(result.data.language);
      }
    } catch (error) {
      message.error('加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!filePath) return;

    setSaving(true);
    try {
      const currentContent = editorRef.current?.getValue() || '';
      const result = await saveFile(projectName, filePath, currentContent);

      if (result.success) {
        message.success('保存成功');
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // 注册保存快捷键 Ctrl+S / Cmd+S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  if (!filePath) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#999'
      }}>
        请从左侧选择文件
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {filePath}
        </span>
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

      {/* 编辑器 */}
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          language={language}
          value={content}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on'
          }}
        />
      </div>
    </div>
  );
};
```

#### 步骤 4: 集成到主界面

```typescript
// frontend/src/App.tsx (修改)
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';

function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <Layout>
      {/* 左侧项目列表 */}
      <Sider width={250}>
        <ProjectList onSelect={setSelectedProject} />
      </Sider>

      {/* 中间文件树 */}
      {selectedProject && (
        <Sider width={300} theme="light">
          <FileExplorer
            projectName={selectedProject}
            onFileSelect={setSelectedFile}
          />
        </Sider>
      )}

      {/* 右侧编辑器 */}
      <Content>
        <CodeEditor
          projectName={selectedProject || ''}
          filePath={selectedFile}
        />
      </Content>
    </Layout>
  );
}
```

#### 步骤 5: API 封装

```typescript
// frontend/src/api.ts (新增)
export const getProjectFiles = async (projectName: string) => {
  const res = await fetch(`/api/projects/${projectName}/files`);
  return res.json();
};

export const readFile = async (project: string, path: string) => {
  const res = await fetch(`/api/files/read?project=${project}&path=${encodeURIComponent(path)}`);
  return res.json();
};

export const saveFile = async (project: string, path: string, content: string) => {
  const res = await fetch('/api/files/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, path, content })
  });
  return res.json();
};
```

---

## 6. 工作量评估

### 6.1 开发时间

| 任务 | 预估时间 | 难度 |
|------|---------|------|
| **后端开发** | | |
| - fileManager.js | 1.5h | ⭐⭐ |
| - fileRoutes.js | 1h | ⭐ |
| - 路由集成和测试 | 0.5h | ⭐ |
| **前端开发** | | |
| - FileExplorer 组件 | 2h | ⭐⭐ |
| - CodeEditor 组件 | 2h | ⭐⭐⭐ |
| - API 封装 | 0.5h | ⭐ |
| - 界面集成 | 1h | ⭐⭐ |
| **测试和调试** | | |
| - 功能测试 | 1.5h | ⭐⭐ |
| - 边界情况处理 | 1h | ⭐⭐ |
| **总计** | **≈ 11 小时** | |

### 6.2 技术难点

#### 难点 1: Monaco Editor 包体积优化

**问题**: Monaco Editor 完整包约 2MB，影响首次加载速度

**解决方案**:
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  plugins: [
    monacoEditorPlugin({
      // 仅加载需要的语言
      languages: ['javascript', 'typescript', 'json', 'markdown', 'css', 'html']
    })
  ]
});
```

#### 难点 2: 大文件编辑性能

**问题**: 超过 1MB 的文件可能导致编辑器卡顿

**解决方案**:
```typescript
// CodeEditor.tsx
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

if (fileData.size > MAX_FILE_SIZE) {
  return (
    <Alert
      type="warning"
      message="文件过大"
      description="建议使用本地编辑器打开此文件"
    />
  );
}
```

#### 难点 3: 文件树懒加载

**问题**: 大型项目文件数量多，一次性加载慢

**解决方案**:
```typescript
// 默认只展开第一层，点击目录时动态加载子节点
const loadData = (treeNode: DataNode) => {
  return new Promise<void>((resolve) => {
    if (treeNode.children) {
      resolve();
      return;
    }

    // 动态加载子节点
    fetchSubDirectory(treeNode.key).then((children) => {
      treeNode.children = children;
      setTreeData([...treeData]);
      resolve();
    });
  });
};
```

---

## 7. 风险和注意事项

### 7.1 安全风险

| 风险 | 影响 | 防护措施 |
|------|------|----------|
| **路径遍历攻击** | 高 | ✅ 路径白名单验证 |
| **恶意文件内容** | 中 | ✅ 文件大小限制 |
| **并发写入冲突** | 中 | 🔮 后续添加文件锁 |

### 7.2 性能风险

- **大文件加载**: 限制文件大小 ≤ 1MB
- **文件树过大**: 实施懒加载 + 忽略 node_modules
- **Monaco 加载慢**: 按需加载语言 + CDN 缓存

### 7.3 兼容性注意

- **浏览器支持**: Monaco Editor 需要 ES6+ 支持
- **快捷键冲突**: 注意与浏览器原生快捷键的冲突
- **主题适配**: 需要适配明暗主题切换

---

## 8. 分阶段实施建议

### 🚀 第一阶段 (MVP - 最小可用版本)

**目标**: 基本文件浏览和编辑功能

- [x] 后端 API 开发
- [x] 文件树组件
- [x] Monaco 编辑器集成
- [x] 保存文件功能

**时间**: 1-2 天

### 🎯 第二阶段 (增强版)

**目标**: 提升用户体验

- [ ] 文件树懒加载
- [ ] 多标签页编辑
- [ ] 搜索文件功能
- [ ] 快捷键优化

**时间**: 2-3 天

### 🌟 第三阶段 (完整版)

**目标**: 高级功能

- [ ] Git diff 对比
- [ ] 代码格式化
- [ ] 多文件查找替换
- [ ] 实时协作编辑

**时间**: 3-5 天

---

## 9. 参考资源

### 官方文档

- **Monaco Editor**: https://microsoft.github.io/monaco-editor/
- **React Monaco**: https://github.com/suren-atoyan/monaco-react
- **Ant Design Tree**: https://ant.design/components/tree-cn/

### 示例项目

- **StackBlitz**: https://stackblitz.com/ (在线 IDE 参考)
- **CodeSandbox**: https://codesandbox.io/ (编辑器 UI 参考)

### 学习资源

- Monaco Editor API: https://microsoft.github.io/monaco-editor/docs.html
- VS Code 快捷键: https://code.visualstudio.com/docs/getstarted/keybindings

---

## 10. 总结

### ✅ 推荐方案

| 组件 | 选择 | 理由 |
|------|------|------|
| 代码编辑器 | **Monaco Editor** | 功能完整，VS Code 同款 |
| 文件管理 | **自定义 + Ant Tree** | 轻量灵活，易于定制 |
| 实施策略 | **分阶段开发** | 先 MVP，逐步完善 |

### 📊 预期效果

- ✅ **VS Code 级别的编辑体验**
- ✅ **无需离开浏览器即可编辑代码**
- ✅ **与现有项目管理功能无缝集成**
- ✅ **响应速度 < 2秒**

### 🎯 下一步行动

1. **评审方案**: 确认技术选型和架构设计
2. **准备环境**: 安装依赖，配置开发环境
3. **开始开发**: 按阶段实施计划执行
4. **持续迭代**: 根据使用反馈优化功能

---

**文档维护者**: Claude Code
**联系方式**: 如有问题请在项目 Issue 中讨论
**最后更新**: 2025-11-29
