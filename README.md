# Book Trash - AI Learning Assistant

📚 一个基于 AI 的智能学习助手，帮助用户上传文档、提问并获得智能回答，提升学习体验。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

## ✨ 特性

- 🤖 **AI 对话**: 与 AI 就您的学习材料进行互动对话
- 📄 **文档上传**: 支持多种文件格式（PDF、DOC、DOCX、TXT）
- 🧠 **智能测验**: 基于学习材料自动生成测验
- 🌍 **国际化**: 支持中文和英文界面
- 💾 **会话管理**: 保存和管理学习会话
- 🎨 **现代化 UI**: 基于 Element Plus 的美观界面

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **Element Plus** - Vue 3 组件库
- **Vue Router** - 官方路由管理器
- **Pinia** - Vue 状态管理
- **Vue I18n** - 国际化支持
- **Axios** - HTTP 客户端

### 后端
- **NestJS** - 渐进式 Node.js 框架
- **TypeScript** - 类型安全的 JavaScript
- **TypeORM** - 对象关系映射
- **SQLite** - 轻量级数据库
- **LangChain** - AI 应用开发框架
- **OpenAI API** - 大语言模型接口

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 pnpm >= 7.0.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/book-trash.git
cd book-trash

# 方式一：使用根目录脚本安装所有依赖
npm run install:all

# 方式二：分别安装依赖
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 启动开发服务器

#### 方式一：同时启动前后端（推荐）

```bash
# 在项目根目录执行
npm run dev
```

#### 方式二：分别启动

**启动后端服务**
```bash
cd backend
npm run start:dev
```

后端服务将在 `http://localhost:3000` 启动。

**启动前端服务**
```bash
cd frontend
npm run dev
```

前端服务将在 `http://localhost:8081` 启动。

### 构建生产版本

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
npm run build
```

## 📁 项目结构

```
book-trash/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/       # Vue 组件
│   │   ├── views/           # 页面视图
│   │   ├── router/          # 路由配置
│   │   ├── store/           # 状态管理
│   │   ├── services/        # API 服务
│   │   ├── i18n/           # 国际化配置
│   │   └── main.ts         # 应用入口
│   ├── index.html          # HTML 模板
│   ├── vite.config.ts      # Vite 配置
│   └── package.json        # 前端依赖
├── backend/                 # 后端应用
│   ├── src/
│   │   ├── agents/         # AI 代理
│   │   ├── config/         # 配置文件
│   │   ├── database/       # 数据库配置
│   │   ├── graph/          # 图形处理
│   │   ├── learn/          # 学习模块
│   │   ├── llms/           # 大语言模型
│   │   ├── prompts/        # 提示词
│   │   ├── server/         # 服务器配置
│   │   ├── tools/          # 工具类
│   │   └── utils/          # 工具函数
│   ├── database.sqlite     # SQLite 数据库
│   └── package.json        # 后端依赖
└── README.md               # 项目说明
```

## ⚙️ 配置

### 后端配置

在 `backend` 目录下创建 `.env` 文件（参考 `.env.example`）：

```env
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# 数据库配置
DATABASE_PATH=./database.sqlite

# 服务器配置
PORT=3000
```

### 前端配置

前端配置文件位于 `frontend/vite.config.ts`，默认配置已经适用于大多数情况。

## 🌍 国际化

项目支持中文和英文两种语言：

- **默认语言**：中文
- **支持语言**：中文 (zh)、英文 (en)
- **语言切换**：点击右上角的语言切换按钮
- **持久化**：语言设置会自动保存到本地存储
- **扩展性**：可轻松添加新语言支持

### 添加新语言

1. 在 `frontend/src/i18n/locales/` 目录下创建新的语言文件
2. 在 `frontend/src/i18n/index.ts` 中导入并注册新语言
3. 在 `LanguageSwitcher.vue` 组件中添加新语言选项

## 📝 API 文档

### 学习相关 API

| 方法 | 端点 | 描述 | 参数 |
|------|------|------|------|
| POST | `/api/learn` | 处理学习请求 | `{ content: string, sessionId?: string }` |
| POST | `/api/ask` | 提问接口 | `{ question: string, sessionId: string }` |
| POST | `/api/quiz-answer` | 提交测验答案 | `{ answer: string, questionId: string }` |
| GET | `/api/session/:id` | 获取会话信息 | 路径参数: `id` |

### 响应格式

所有 API 响应都遵循统一格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误处理

错误响应格式：

```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

### 开发流程

1. **Fork 本仓库**
2. **创建特性分支**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **进行开发**
   - 遵循现有代码风格
   - 添加必要的测试
   - 更新相关文档
4. **提交更改**
   ```bash
   git commit -m 'feat: Add some AmazingFeature'
   ```
5. **推送分支**
   ```bash
   git push origin feature/AmazingFeature
   ```
6. **创建 Pull Request**

### 提交信息规范

请使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

### 代码规范

- 使用 TypeScript 进行开发
- 遵循 ESLint 和 Prettier 配置
- 为新功能添加适当的测试
- 保持代码注释的完整性

## 🚀 部署

### Docker 部署（推荐）

```bash
# 构建镜像
docker build -t book-trash .

# 运行容器
docker run -p 3000:3000 -p 8081:8081 book-trash
```

### 传统部署

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
npm run build

# 启动生产服务
npm run start:prod
```

## ❓ 常见问题

### Q: 如何配置 OpenAI API？
A: 在 `backend/.env` 文件中设置 `OPENAI_API_KEY`，如果使用代理服务，还需要设置 `OPENAI_BASE_URL`。

### Q: 支持哪些文件格式？
A: 目前支持 PDF、DOC、DOCX、TXT 格式的文档上传。

### Q: 如何添加新的语言支持？
A: 参考国际化章节，在 `frontend/src/i18n/locales/` 目录下添加新的语言文件。

### Q: 数据存储在哪里？
A: 项目使用 SQLite 数据库，数据文件位于 `backend/database.sqlite`。

## 🔄 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🌍 支持中英文国际化
- 🤖 集成 AI 对话功能
- 📄 支持文档上传和解析
- 🧠 智能测验生成

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看项目中的许可证声明。

## 🙏 致谢

感谢以下开源项目和社区的支持：

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [NestJS](https://nestjs.com/) - 渐进式 Node.js 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [LangChain](https://langchain.com/) - AI 应用开发框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
- [OpenAI](https://openai.com/) - 提供强大的 AI 能力

## 📞 联系方式

如果您有任何问题或建议，请通过以下方式联系我们：

- 🐛 提交 Issue: [GitHub Issues](https://github.com/your-username/book-trash/issues)
- 💬 讨论交流: [GitHub Discussions](https://github.com/your-username/book-trash/discussions)
- 📧 邮箱联系: your-email@example.com

## 🤝 社区

加入我们的社区，与其他开发者交流：

- 📱 微信群：扫描二维码加入
- 💬 QQ 群：123456789
- 🐦 Twitter: [@BookTrashAI](https://twitter.com/BookTrashAI)

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！