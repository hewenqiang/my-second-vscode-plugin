# VS Code插件开发详细教程

## 第一步：理解VS Code插件架构

### 1.1 插件的基本组成

VS Code插件主要由以下几个部分组成：

1. **package.json** - 插件的配置文件
2. **extension.ts** - 插件的入口文件
3. **WebView** - 自定义用户界面
4. **命令和快捷键** - 用户交互方式

### 1.2 package.json详解

```json
{
  "name": "my-ai-assistant",           // 插件名称
  "displayName": "My AI Assistant",    // 显示名称
  "description": "一个简单的AI助手插件", // 描述
  "version": "0.0.1",                  // 版本号
  "engines": {                         // VS Code版本要求
    "vscode": "^1.74.0"
  },
  "categories": ["Other"],             // 插件分类
  "activationEvents": [                // 激活事件
    "onCommand:my-ai-assistant.openPanel"
  ],
  "main": "./out/extension.js",        // 入口文件
  "contributes": {                     // 贡献点配置
    "commands": [...],                 // 命令定义
    "keybindings": [...],             // 快捷键定义
    "menus": {...}                    // 菜单定义
  }
}
```

## 第二步：创建插件入口文件

### 2.1 extension.ts结构

```typescript
import * as vscode from 'vscode';

// 激活函数 - 插件启动时调用
export function activate(context: vscode.ExtensionContext) {
    // 注册命令
    const command = vscode.commands.registerCommand('command-id', () => {
        // 命令执行逻辑
    });
    
    // 添加到上下文
    context.subscriptions.push(command);
}

// 停用函数 - 插件关闭时调用
export function deactivate() {
    // 清理资源
}
```

### 2.2 关键概念

- **ExtensionContext**: 插件的上下文，包含插件信息
- **commands.registerCommand**: 注册命令
- **subscriptions**: 订阅管理，用于清理资源

## 第三步：创建WebView界面

### 3.1 WebView基础

WebView是VS Code中创建自定义界面的方式：

```typescript
const panel = vscode.window.createWebviewPanel(
    'panel-id',           // 面板ID
    '面板标题',            // 面板标题
    vscode.ViewColumn.One, // 显示位置
    {
        enableScripts: true,  // 启用JavaScript
        localResourceRoots: [...] // 本地资源根目录
    }
);
```

### 3.2 通信机制

WebView与扩展之间的通信：

```typescript
// 扩展发送消息到WebView
panel.webview.postMessage({
    command: 'messageType',
    data: 'messageData'
});

// 扩展接收WebView消息
panel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
        case 'messageType':
            // 处理消息
            break;
    }
});
```

## 第四步：实现AI助手功能

### 4.1 面板管理

```typescript
export class AIAssistantPanel {
    public static currentPanel: AIAssistantPanel | undefined;
    
    // 创建或显示面板
    public static createOrShow(extensionUri: vscode.Uri) {
        if (AIAssistantPanel.currentPanel) {
            // 如果面板已存在，显示它
            AIAssistantPanel.currentPanel._panel.reveal();
        } else {
            // 创建新面板
            const panel = vscode.window.createWebviewPanel(...);
            AIAssistantPanel.currentPanel = new AIAssistantPanel(panel, extensionUri);
        }
    }
}
```

### 4.2 HTML界面

WebView使用HTML、CSS、JavaScript创建界面：

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* 使用VS Code CSS变量保持主题一致 */
        body {
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
    </style>
</head>
<body>
    <!-- 界面内容 -->
    <script>
        // 与扩展通信
        const vscode = acquireVsCodeApi();
        vscode.postMessage({command: 'askQuestion', question: 'Hello'});
    </script>
</body>
</html>
```

## 第五步：测试和调试

### 5.1 运行插件

1. 在VS Code中打开插件项目
2. 按 `F5` 或选择 "Run and Debug"
3. 这会打开一个新的VS Code窗口（Extension Development Host）
4. 在新窗口中测试插件功能

### 5.2 调试技巧

- 使用 `console.log()` 输出调试信息
- 在VS Code的"输出"面板查看日志
- 使用断点调试TypeScript代码

## 第六步：扩展功能

### 6.1 添加更多命令

```typescript
// 在package.json中添加命令
"commands": [
    {
        "command": "my-ai-assistant.newCommand",
        "title": "新命令",
        "category": "AI Assistant"
    }
]

// 在extension.ts中注册命令
const newCommand = vscode.commands.registerCommand('my-ai-assistant.newCommand', () => {
    // 命令逻辑
});
context.subscriptions.push(newCommand);
```

### 6.2 添加快捷键

```json
"keybindings": [
    {
        "command": "my-ai-assistant.openPanel",
        "key": "ctrl+shift+a",
        "mac": "cmd+shift+a",
        "when": "editorTextFocus"
    }
]
```

### 6.3 添加右键菜单

```json
"menus": {
    "editor/context": [
        {
            "command": "my-ai-assistant.askQuestion",
            "when": "editorHasSelection",
            "group": "ai-assistant"
        }
    ]
}
```

## 第七步：发布插件

### 7.1 准备发布

1. 更新版本号
2. 完善README文档
3. 测试所有功能

### 7.2 发布到Marketplace

1. 安装 `vsce` 工具：`npm install -g vsce`
2. 登录：`vsce login`
3. 发布：`vsce publish`

## 学习要点总结

1. **理解插件生命周期**：激活 → 运行 → 停用
2. **掌握VS Code API**：编辑器操作、文件系统、UI组件
3. **学会WebView开发**：HTML/CSS/JS + 通信机制
4. **熟悉TypeScript**：类型定义、模块化开发
5. **了解调试技巧**：断点、日志、测试

## 下一步学习方向

1. **集成真实AI API**：OpenAI、Claude、本地模型
2. **代码分析功能**：语法分析、错误检测
3. **文件操作**：创建、修改、重构代码
4. **设置和配置**：用户偏好、持久化存储
5. **性能优化**：异步处理、缓存机制

通过这个项目，你已经掌握了VS Code插件开发的基础知识。继续实践和探索，你会成为插件开发专家！🚀
