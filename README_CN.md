<div align="center">

# URDF Studio

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.181-black?logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**下一代可视化机器人设计平台**

**在线体验：** https://urdf.d-robotics.cc/

[English](./README.md) | [中文](./README_CN.md)

</div>

---

## 📖 概览

**URDF Studio** 是一款先进的 Web 端可视化机器人设计环境，专为简化 URDF（Unified Robot Description Format）模型的创建、编辑与导出而生。通过将繁琐的 XML 代码编写抽象为直观的图形化交互，它赋予机器人工程师专注于设计创新与架构验证的能力。

该平台覆盖了机器人建模的全生命周期——从运动学骨架的构建，到高保真几何细节的打磨，再到精密硬件参数的配置。结合 **生成式 AI** 的强大能力，URDF Studio 显著加速了原型设计流程，并确保与 MuJoCo 等工业级仿真生态系统的无缝兼容。


## ✨ 核心能力

### 🦴 多维设计模式

| 模式 | 功能描述 |
|------|---------|
| **Skeleton (骨架)** | 快速构建运动学链条 (Links & Joints)，精准定义拓扑结构与自由度。 |
| **Detail (细节)** | 精细化编辑视觉外观与碰撞流形，支持基础几何体及高精度网格模型 (STL/OBJ/DAE) 导入。 |
| **Hardware (硬件)** | 深度配置机电参数，包括执行器选型、力矩约束及传动比设定。 |

### 🎨 沉浸式 3D 工作区

- **高保真渲染**: 基于 **Three.js** 与 **React Three Fiber** 构建，采用增强的 PBR 材质与光泽度渲染，提供逼真的视觉体验。
- **直观操控**: 采用工业标准的变换控件 (Gizmos)，实现对机器人部件的精确空间操控。
- **可视化分析**: 
  - 实时显示关节轴向与参考坐标系。
  - 支持逐连杆的 **质心 (CoM)** 与 **惯量张量 (Inertia Tensor)** 可视化（半透明实体盒指示）。
  - **高亮模式切换**: 支持在“连杆”与“碰撞体”高亮模式间切换，便于精确检查与编辑。
  - **碰撞体预览**: 优化的碰撞体渲染（支持双面显示），提升选中灵敏度与可视化效果。

### 🤖 AI 增强工程

集成 **OpenAI 兼容的 AI 模型** (如 DeepSeek)，URDF Studio 引入了自然语言交互接口，重塑机器人设计体验：
- *"生成一个四足移动平台"*
- *"在 base_link 上集成一套激光雷达阵列"*
- *"根据力矩需求为髋关节推荐最优执行器"*

### 🔍 AI 审阅 (AI Inspector)

**AI 审阅** 功能基于行业标准评估准则，提供全面的 URDF 模型自动化质量评估：

- **多维度检查**：评估六个关键维度：
  - **物理合理性**：质量、惯性有效性、对称一致性
  - **坐标系位置与朝向**：关节原点共线关系、坐标系朝向公约、腰部中心对齐
  - **装配逻辑合理性**：驱动器质量归属、传动与连杆归属
  - **运动学与仿真属性**：树状结构验证、关节限位合理性、碰撞体优化
  - **硬件参数配置**：电机力矩与速度限位、电枢/转子惯量
  - **命名规范**：唯一性与描述性命名标准

- **详细评分体系**：每个检查项采用 0-10 分制评分，报告包括：
  - 总体达成率
  - 分类别得分
  - 具体问题识别（错误/警告/建议）
  - 相关链接/关节引用，便于快速定位

- **交互功能**：
  - 选择性检查：可选择特定检查项进行评估
  - 单项重测：修复后重新评估特定问题
  - AI 对话：讨论检查结果并获得改进建议
  - PDF 导出：下载详细的检查报告

- **实时进度**：检查过程中可视化进度跟踪，显示逐项状态详情

### 📥 无缝互操作性

- **导入**: 轻松加载包含 URDF 定义及网格资产的 ZIP 归档项目。
- **导出**: 一键生成生产级机器人资源包：
  - `urdf/`: 标准 URDF + 扩展 URDF（富含硬件元数据）。
  - `meshes/`: 自动整合所有引用的 3D 资产。
  - `hardware/`: 自动生成 CSV 格式的物料清单 (BOM)。
  - `mujoco/`: 自动配置 XML 文件，支持即时 MuJoCo 仿真。

### ⚙️ 内置电机库

预置多款主流机器人电机参数，方便快速选型：
- **Unitree (宇树)**: Go1, A1, B1 系列。
- **RobStride**: RS 系列。
- 支持自定义电机库扩展。

## 🚀 本地部署

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装与运行

1. **克隆项目**
   ```bash
   git clone https://github.com/OpenLegged/URDF-Studio.git
   cd URDF-Studio
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 API Key（可选）**
   如需使用 AI 功能，请在根目录创建 `.env.local` 文件并添加：
   ```env
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_BASE_URL=https://your-proxy-url/v1
   OPENAI_MODEL=bce/deepseek-v3.2
   ```
   
   **配置说明:**
   - `OPENAI_API_KEY`: 你的 OpenAI API Key 或代理 Key
   - `OPENAI_BASE_URL`: (可选) 自定义 API 端点。如果不设置，默认为 `https://api.openai.com/v1`
   - `OPENAI_MODEL`: (可选) 指定使用的模型名称。如果不设置，默认为 `bce/deepseek-v3.2`

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 `http://localhost:5173` 开始使用。

## 📁 项目结构

```
URDF-Studio/
├── App.tsx                 # 主应用组件 / Main Application
├── components/             # UI 组件 / UI Components
│   ├── TreeEditor.tsx      # 树形结构编辑器 / Tree View
│   ├── Visualizer.tsx      # 3D 可视化器 / 3D Viewport
│   └── PropertyEditor.tsx  # 属性面板 / Properties Panel
├── services/               # 核心逻辑服务 / Core Services
│   ├── urdfGenerator.ts    # URDF 生成 / Generation
│   ├── urdfParser.ts       # URDF 解析 / Parsing
│   ├── mujocoGenerator.ts  # MuJoCo 生成 / MuJoCo Export
│   ├── geminiService.ts    # AI 服务 / AI Integration
│   └── motorLibrary.ts     # 电机库 / Motor Data
└── ...
```

## 📄 License

MIT License

## 特别致谢
地瓜机器人 https://developer.d-robotics.cc/
