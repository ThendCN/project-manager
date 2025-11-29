const express = require('express');
const path = require('path');
const router = express.Router();
const fileManager = require('./fileManager');
const db = require('./database');

// 项目根目录
const PROJECT_ROOT = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.resolve(__dirname, '../..');

/**
 * 获取项目的完整路径
 * @param {string} projectName - 项目名称
 * @returns {string|null} 项目完整路径
 */
function getProjectPath(projectName) {
  const project = db.getProjectByName(projectName);

  if (!project) {
    return null;
  }

  // 如果是绝对路径直接使用，否则相对于项目根目录
  return path.isAbsolute(project.path)
    ? project.path
    : path.join(PROJECT_ROOT, project.path);
}

/**
 * 获取项目文件树
 * GET /api/projects/:name/files
 */
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

/**
 * 读取文件内容
 * GET /api/files/read?project=xxx&path=xxx
 */
router.get('/files/read', (req, res) => {
  try {
    const { project, path: filePath } = req.query;

    if (!project || !filePath) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: project 和 path'
      });
    }

    const projectPath = getProjectPath(project);
    if (!projectPath) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    const fileData = fileManager.readFile(projectPath, filePath);
    res.json({ success: true, data: fileData });
  } catch (error) {
    console.error('读取文件失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 保存文件
 * POST /api/files/save
 * Body: { project, path, content }
 */
router.post('/files/save', (req, res) => {
  try {
    const { project, path: filePath, content } = req.body;

    if (!project || !filePath || content === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: project、path 和 content'
      });
    }

    const projectPath = getProjectPath(project);
    if (!projectPath) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    const result = fileManager.saveFile(projectPath, filePath, content);
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
