const fs = require('fs');
const path = require('path');

/**
 * 文件管理器
 * 负责文件树生成、文件读写和安全验证
 */
class FileManager {
  constructor() {
    // 需要忽略的目录和文件
    this.ignoredDirs = [
      'node_modules',
      '.git',
      '.vscode',
      'dist',
      'build',
      'coverage',
      '.next',
      '.nuxt',
      'out'
    ];

    this.ignoredFiles = [
      '.DS_Store',
      'Thumbs.db',
      '.env',
      '.env.local',
      '.env.production'
    ];

    // 语言映射表
    this.languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.json': 'json',
      '.md': 'markdown',
      '.css': 'css',
      '.scss': 'css',
      '.html': 'html',
      '.xml': 'xml',
      '.sql': 'sql',
      '.sh': 'shell',
      '.yml': 'yaml',
      '.yaml': 'yaml'
    };
  }

  /**
   * 生成文件树
   * @param {string} rootPath - 项目根路径
   * @param {string} relativePath - 相对路径（默认为空）
   * @returns {object} 文件树节点
   */
  generateFileTree(rootPath, relativePath = '') {
    try {
      const fullPath = this.validatePath(rootPath, relativePath);

      // 检查路径是否存在
      if (!fs.existsSync(fullPath)) {
        throw new Error(`路径不存在: ${fullPath}`);
      }

      const stats = fs.statSync(fullPath);

      // 如果是文件，返回文件节点
      if (stats.isFile()) {
        return this.createFileNode(fullPath, relativePath);
      }

      // 如果是目录，递归生成子节点
      const children = fs.readdirSync(fullPath)
        .filter(name => !this.shouldIgnore(name))
        .map(name => {
          const childPath = path.join(relativePath, name);
          try {
            return this.generateFileTree(rootPath, childPath);
          } catch (error) {
            // 忽略无法访问的文件/目录
            console.warn(`无法访问: ${childPath}`, error.message);
            return null;
          }
        })
        .filter(node => node !== null)
        .sort((a, b) => {
          // 目录排在前面，然后按名称排序
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

      return {
        name: path.basename(fullPath) || path.basename(rootPath),
        path: relativePath,
        type: 'directory',
        children
      };
    } catch (error) {
      console.error('生成文件树失败:', error);
      throw error;
    }
  }

  /**
   * 读取文件内容
   * @param {string} projectPath - 项目路径
   * @param {string} filePath - 文件相对路径
   * @returns {object} 文件数据
   */
  readFile(projectPath, filePath) {
    try {
      const fullPath = this.validatePath(projectPath, filePath);

      // 检查是否是文件
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        throw new Error('只能读取文件');
      }

      // 检查文件大小（限制 2MB）
      const MAX_SIZE = 2 * 1024 * 1024;
      if (stats.size > MAX_SIZE) {
        throw new Error('文件过大（超过 2MB），建议使用本地编辑器打开');
      }

      // 读取文件内容
      const content = fs.readFileSync(fullPath, 'utf-8');

      return {
        path: filePath,
        content,
        size: stats.size,
        encoding: 'utf-8',
        language: this.detectLanguage(filePath),
        modifiedAt: stats.mtime.toISOString()
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`文件不存在: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * 保存文件
   * @param {string} projectPath - 项目路径
   * @param {string} filePath - 文件相对路径
   * @param {string} content - 文件内容
   * @returns {object} 保存结果
   */
  saveFile(projectPath, filePath, content) {
    try {
      const fullPath = this.validatePath(projectPath, filePath);

      // 确保目录存在
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(fullPath, content, 'utf-8');

      const stats = fs.statSync(fullPath);

      return {
        path: filePath,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString()
      };
    } catch (error) {
      console.error('保存文件失败:', error);
      throw error;
    }
  }

  /**
   * 验证路径安全性
   * @param {string} projectPath - 项目根路径
   * @param {string} relativePath - 相对路径
   * @returns {string} 验证后的完整路径
   */
  validatePath(projectPath, relativePath) {
    // 构建完整路径
    const fullPath = path.join(projectPath, relativePath);

    // 规范化路径
    const normalizedPath = path.normalize(fullPath);
    const normalizedProjectPath = path.normalize(projectPath);

    // 确保路径在项目目录内（防止路径遍历攻击）
    if (!normalizedPath.startsWith(normalizedProjectPath)) {
      throw new Error('非法路径访问');
    }

    return normalizedPath;
  }

  /**
   * 检测文件语言类型
   * @param {string} filePath - 文件路径
   * @returns {string} 语言类型
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.languageMap[ext] || 'plaintext';
  }

  /**
   * 判断是否应该忽略
   * @param {string} name - 文件/目录名
   * @returns {boolean}
   */
  shouldIgnore(name) {
    // 忽略隐藏文件（.开头）
    if (name.startsWith('.') && !name.match(/^\.(js|ts|json|md)$/)) {
      return true;
    }

    // 忽略指定目录
    if (this.ignoredDirs.includes(name)) {
      return true;
    }

    // 忽略指定文件
    if (this.ignoredFiles.includes(name)) {
      return true;
    }

    return false;
  }

  /**
   * 创建文件节点
   * @param {string} fullPath - 完整路径
   * @param {string} relativePath - 相对路径
   * @returns {object} 文件节点
   */
  createFileNode(fullPath, relativePath) {
    const stats = fs.statSync(fullPath);
    return {
      name: path.basename(fullPath),
      path: relativePath,
      type: 'file',
      size: stats.size,
      extension: path.extname(fullPath),
      modifiedAt: stats.mtime.toISOString()
    };
  }
}

module.exports = new FileManager();
