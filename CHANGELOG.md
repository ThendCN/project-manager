# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-28

### Added

#### 项目详情页 (Project Detail Page)
- ✨ 全新的项目详情页组件，提供完整的项目管理视图
- 📊 左侧栏显示项目状态、技术栈、快捷操作
- 🎯 右侧 Tab 切换：概览、任务、日志、AI 编程、项目分析
- 🖱️ 点击项目卡片即可打开详情页，提升用户体验

#### 项目分析功能增强
- 🔍 **智能启动命令检测**
  - 自动检测 Node.js 项目的 npm scripts (dev/start/serve)
  - 支持 Python (Django/Flask/FastAPI) 启动命令
  - 支持 Go、Rust、Makefile 项目
- 🔌 **自动端口检测**
  - 从 package.json scripts 中提取端口
  - 从环境文件 (.env*) 中读取端口配置
  - 智能匹配框架默认端口
- 📋 **配置文件发现**
  - 检测环境文件 (.env, .env.local, .env.development 等)
  - 识别配置文件 (vite.config, webpack.config, tsconfig.json 等)
  - 提取 package.json 中的可用脚本列表
- ⚡ **一键应用配置**
  - 在分析对话框中直接应用检测到的启动命令
  - 一键应用检测到的端口配置
  - 自动更新 projects.json 和数据库
- 📊 **分析结果展示**
  - 在项目详情页的"项目分析" Tab 中查看快速预览
  - 完整的分析报告对话框，包含基础信息、项目配置、依赖、架构说明
  - 支持重新分析和查看历史分析结果

#### 新增 API 接口
- `POST /api/projects/:name/apply-analysis` - 应用分析结果到项目配置
- 支持字段：port、start_command、framework

### Changed

#### 组件重构
- ♻️ **ProjectCard 重构** (520 行 → 291 行)
  - 精简为纯展示组件，移除内部弹窗管理
  - 保留快捷操作：启动/停止、打开目录、打开 VSCode
  - 点击卡片打开详情页，符合单一职责原则
  - 减少 44% 代码量，提升可维护性
- 🎨 **TodoManager 样式统一**
  - 从 Tailwind CSS 类名迁移到 inline styles
  - 解决样式不一致问题，确保渲染正常
  - 保持统一的设计语言
- 📱 **App.tsx 路由升级**
  - 支持项目详情页模态显示
  - 事件监听机制处理跨组件交互
  - 统一管理 TodoManager、LogViewer、AiDialog 弹窗

### Fixed

- 🐛 修复 TodoManager 组件样式渲染问题
- 🔧 修复外部项目在详情页中的显示逻辑
- 🛠️ 修复依赖列表解析兼容性问题 (支持新旧格式)

### Improved

#### 用户体验优化
- 🎯 **层次分明的信息架构**
  - 列表视图：快速浏览所有项目
  - 详情页：查看完整项目信息
  - 功能弹窗：专注于特定任务
- ⚡ **快捷操作优化**
  - 卡片上保留高频操作（启动/停止）
  - 详情页提供完整操作集
  - 实时状态更新和反馈
- 🔄 **智能轮询机制**
  - 分析状态自动检测
  - 运行状态实时更新
  - 超时保护防止无限等待

#### 代码质量提升
- ✅ 符合 KISS、YAGNI、DRY、SOLID 原则
- ✅ 文件大小控制在 200 行以内（除 ProjectDetailPage）
- ✅ 消除代码坏味道：僵化性、冗余性、晦涩性
- ✅ 统一样式系统，避免 Tailwind 依赖问题

### Technical Details

#### 后端增强
- 扩展 `ProjectAnalyzer` 类
  - `detectStartCommand()` - 智能检测启动命令
  - `detectPortFromEnv()` - 从环境文件提取端口
  - `detectEnvironmentFiles()` - 发现环境配置文件
  - `detectConfigFiles()` - 发现项目配置文件
- 新增分析字段到数据库
  - start_command, port, scripts, environment_files, config_files

#### 前端架构
- 新增组件
  - `ProjectDetailPage.tsx` (785 行) - 项目详情页主组件
  - `AnalysisDialog.tsx` (增强) - 完整的分析报告对话框
- 组件通信
  - 使用 CustomEvent 处理跨组件交互
  - 统一的状态管理和 API 调用

### Documentation

- 📝 更新项目文档
- 📖 添加项目分析功能使用说明
- 🎓 完善 API 文档

---

## [1.0.0] - 2025-11-27

### Added
- 🎉 初始版本发布
- 项目基础功能：列表展示、状态监控、进程管理
- AI 编程助手集成
- 任务管理系统 (Todo CRUD)
- 项目分析基础功能

[1.1.0]: https://github.com/yourusername/project-manager/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourusername/project-manager/releases/tag/v1.0.0
