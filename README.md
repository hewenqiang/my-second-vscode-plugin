# My AI Assistant - VS Code插件

一个简单的AI助手插件，类似于Cline，为VS Code提供智能代码助手功能。

## 功能特性

- 🤖 智能AI助手面板
- 💬 交互式聊天界面
- ⌨️ 快捷键支持 (Ctrl+Shift+A / Cmd+Shift+A)
- 📝 选中文本快速提问
- 🎨 与VS Code主题完美集成

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 编译TypeScript

```bash
npm run compile
```

### 3. 在VS Code中运行

1. 按 `F5` 或选择 "Run and Debug" -> "Run Extension"
2. 这会打开一个新的VS Code窗口（Extension Development Host）
3. 在新窗口中测试插件功能

## 使用方法

### 方法1：使用命令面板
1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)
2. 输入 "AI Assistant: 打开AI助手"
3. 回车打开AI助手面板

### 方法2：使用快捷键
- 按 `Ctrl+Shift+A` (Windows/Linux) 或 `Cmd+Shift+A` (Mac)

### 方法3：选中文本后右键
1. 选中一些文本
2. 右键选择 "提问" 选项
3. 会自动打开AI助手面板并填入选中的文本

## 开发说明

### 项目结构

```
my-second-extension/
├── src/
│   ├── extension.ts          # 主扩展文件
│   └── aiAssistantPanel.ts   # AI助手面板类
├── package.json              # 插件配置
├── tsconfig.json            # TypeScript配置
└── README.md                # 说明文档
```

### 核心文件说明

1. **package.json**: 定义插件的元数据、命令、快捷键等
2. **extension.ts**: 插件的入口文件，注册命令和事件
3. **aiAssistantPanel.ts**: 实现AI助手面板的WebView界面

### 扩展功能

目前这是一个基础版本，你可以根据需要添加：

- 真实的AI API集成（如OpenAI、Claude等）
- 代码生成和补全功能
- 文件操作和代码重构
- 更丰富的UI组件
- 设置和配置选项

## 学习要点

通过这个项目，你可以学习到：

1. **VS Code插件基础架构**
   - package.json配置
   - 命令注册
   - 快捷键绑定

2. **WebView技术**
   - 创建自定义面板
   - 与扩展通信
   - 样式和交互

3. **TypeScript开发**
   - 类型定义
   - 模块化开发

4. **VS Code API使用**
   - 编辑器操作
   - 文本选择
   - 消息通信

## 下一步

1. 运行插件并测试功能
2. 尝试修改代码，添加新功能
3. 集成真实的AI API
4. 发布到VS Code Marketplace

祝你学习愉快！🚀
