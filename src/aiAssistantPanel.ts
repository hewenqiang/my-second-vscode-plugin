import * as vscode from 'vscode';
import * as path from 'path';
import { request } from 'undici';

export class AIAssistantPanel {
    public static currentPanel: AIAssistantPanel | undefined;
    public static readonly viewType = 'aiAssistantPanel';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _contextItems: { source: string; data: any }[] = [];

    public static createOrShow(extensionUri: vscode.Uri, initialText?: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // 如果已经有面板存在，显示它
        if (AIAssistantPanel.currentPanel) {
            AIAssistantPanel.currentPanel._panel.reveal(column);
            if (initialText) {
                AIAssistantPanel.currentPanel._panel.webview.postMessage({
                    command: 'setInitialText',
                    text: initialText
                });
            }
            return;
        }

        // 否则创建新面板
        const panel = vscode.window.createWebviewPanel(
            AIAssistantPanel.viewType,
            'AI助手',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ]
            }
        );

        AIAssistantPanel.currentPanel = new AIAssistantPanel(panel, extensionUri, initialText);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        AIAssistantPanel.currentPanel = new AIAssistantPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, initialText?: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // 设置初始HTML内容
        this._update();

        // 监听面板关闭事件
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // 处理来自webview的消息
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'askQuestion':
                        this._handleAskQuestion(message.question);
                        return;
                    case 'clearChat':
                        this._handleClearChat();
                        return;
                    case 'fetchContext':
                        this._handleFetchContext(message.source);
                        return;
                    case 'clearContext':
                        this._handleClearContext();
                        return;
                }
            },
            null,
            this._disposables
        );

        // 如果有初始文本，发送给webview
        if (initialText) {
            this._panel.webview.postMessage({
                command: 'setInitialText',
                text: initialText
            });
        }
    }

    public dispose() {
        AIAssistantPanel.currentPanel = undefined;

        // 清理资源
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }

        // 销毁面板
        this._panel.dispose();
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI助手</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: var(--vscode-font-weight);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header h1 {
            margin: 0;
            color: var(--vscode-textLink-foreground);
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
        }
        
        .user-message {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: 20px;
        }
        
        .ai-message {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        
        .input-container {
            display: flex;
            gap: 10px;
        }
        
        .question-input {
            flex: 1;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
        }
        
        .question-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .ask-button, .clear-button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
        }
        
        .ask-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .ask-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .clear-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .clear-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .loading {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        .context-container {
            margin-top: 14px;
            padding: 10px;
            border: 1px dashed var(--vscode-panel-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
        }

        .context-controls {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-bottom: 8px;
        }

        .context-select, .context-preview {
            width: 100%;
        }

        .context-select {
            padding: 6px;
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }

        .context-preview {
            max-height: 160px;
            overflow: auto;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            padding: 8px;
            background: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI助手</h1>
        <p>欢迎使用AI助手！你可以问我任何问题，我会尽力帮助你。</p>
    </div>
    
    <div class="chat-container">
        <div class="messages" id="messages">
            <div class="message ai-message">
                <strong>AI助手：</strong>你好！我是你的AI助手。有什么可以帮助你的吗？
            </div>
        </div>
        
        <div class="input-container">
            <input type="text" class="question-input" id="questionInput" placeholder="输入你的问题..." />
            <button class="ask-button" id="askButton">提问</button>
            <button class="clear-button" id="clearButton">清空</button>
        </div>

        <div class="context-container">
            <div class="context-controls">
                <select id="contextSource" class="context-select">
                    <option value="jsonplaceholder:posts/1">JSONPlaceholder - posts/1</option>
                    <option value="jsonplaceholder:users/1">JSONPlaceholder - users/1</option>
                    <option value="jsonplaceholder:todos/1">JSONPlaceholder - todos/1</option>
                    <option value="catfacts">Cat Facts - random fact</option>
                </select>
                <button class="ask-button" id="addContextBtn">添加上下文</button>
                <button class="clear-button" id="clearContextBtn">清空上下文</button>
            </div>
            <div id="contextInfo" class="loading">当前上下文：0 项</div>
            <div id="contextPreview" class="context-preview"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const questionInput = document.getElementById('questionInput');
        const askButton = document.getElementById('askButton');
        const clearButton = document.getElementById('clearButton');
        const addContextBtn = document.getElementById('addContextBtn');
        const clearContextBtn = document.getElementById('clearContextBtn');
        const contextSource = document.getElementById('contextSource');
        const contextInfo = document.getElementById('contextInfo');
        const contextPreview = document.getElementById('contextPreview');

        // 处理提问
        function askQuestion() {
            const question = questionInput.value.trim();
            if (!question) return;

            // 添加用户消息
            addMessage('user', question);
            questionInput.value = '';

            // 显示加载状态
            const loadingId = addMessage('ai', '正在思考中...', true);

            // 发送消息给扩展
            vscode.postMessage({
                command: 'askQuestion',
                question: question
            });
        }

        // 添加消息到聊天界面
        function addMessage(type, content, isLoading = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}-message\`;
            
            if (isLoading) {
                messageDiv.innerHTML = \`<strong>AI助手：</strong><span class="loading">\${content}</span>\`;
                messageDiv.id = 'loading-message';
            } else {
                const prefix = type === 'user' ? '你：' : 'AI助手：';
                messageDiv.innerHTML = \`<strong>\${prefix}</strong>\${content}\`;
            }
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            return messageDiv.id;
        }

        // 更新AI回复
        function updateAIResponse(response) {
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.innerHTML = \`<strong>AI助手：</strong>\${response}\`;
                loadingMessage.className = 'message ai-message';
                loadingMessage.id = '';
            }
        }

        // 清空聊天
        function clearChat() {
            messagesContainer.innerHTML = \`
                <div class="message ai-message">
                    <strong>AI助手：</strong>你好！我是你的AI助手。有什么可以帮助你的吗？
                </div>
            \`;
            vscode.postMessage({
                command: 'clearChat'
            });
        }

        // 事件监听
        askButton.addEventListener('click', askQuestion);
        clearButton.addEventListener('click', clearChat);
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                askQuestion();
            }
        });

        addContextBtn.addEventListener('click', () => {
            const value = contextSource.value;
            vscode.postMessage({ command: 'fetchContext', source: value });
        });

        clearContextBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'clearContext' });
        });

        // 监听来自扩展的消息
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'setInitialText':
                    questionInput.value = message.text;
                    break;
                case 'aiResponse':
                    updateAIResponse(message.response);
                    break;
                case 'contextUpdated':
                    contextInfo.textContent = '当前上下文：' + message.count + ' 项';
                    contextPreview.textContent = message.preview || '';
                    break;
            }
        });

        // 聚焦到输入框
        questionInput.focus();
    </script>
</body>
</html>`;
    }

    private async _fetchPublicContext(source: string): Promise<{ source: string; data: any }> {
        // 支持若干免费 API，便于测试
        // jsonplaceholder.typicode.com, catfact.ninja
        let url = '';
        let label = source;
        if (source.startsWith('jsonplaceholder:')) {
            const path = source.split(':')[1];
            url = `https://jsonplaceholder.typicode.com/${path}`;
            label = `JSONPlaceholder:${path}`;
        } else if (source === 'catfacts') {
            url = 'https://catfact.ninja/fact';
            label = 'CatFacts:fact';
        } else {
            throw new Error('未知的上下文来源');
        }

        const res = await request(url, { method: 'GET' });
        if (res.statusCode < 200 || res.statusCode >= 300) {
            const t = await res.body.text();
            throw new Error(`获取上下文失败：${res.statusCode} ${t}`);
        }
        const json: any = await res.body.json();
        return { source: label, data: json };
    }

    private async _handleAskQuestion(question: string) {
        // DeepSeek API 调用（示例：chat/completions 风格）。
        // 注意：用户要求将 API Key 硬编码在代码中。
        const apiKey = 'sk-fb71877c22634e1997ada496f229209a';

        // 你可以根据实际 DeepSeek 接口规范调整以下 endpoint 与 payload。
        const endpoint = 'https://api.deepseek.com/v1/chat/completions';

        try {
            const contextSummary = this._contextItems
                .map((item, idx) => `# Context ${idx + 1} (${item.source})\n${JSON.stringify(item.data, null, 2)}`)
                .join('\n\n');

            const payload = {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant in VS Code. Use provided context if relevant. If context conflicts with general knowledge, prefer context.' },
                    ...(contextSummary ? [{ role: 'system', content: `Additional context provided by user:\n\n${contextSummary}` }] : []),
                    { role: 'user', content: question }
                ],
                temperature: 0.7,
                stream: false
            };

            const response = await request(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (response.statusCode < 200 || response.statusCode >= 300) {
                const errorText = await response.body.text();
                throw new Error(`DeepSeek API 请求失败：${response.statusCode} ${errorText}`);
            }

            const data: any = await response.body.json();
            let answer = '';
            // 兼容 OpenAI 风格返回：choices[0].message.content
            if (data && Array.isArray(data.choices) && data.choices.length > 0) {
                const choice = data.choices[0];
                if (choice && choice.message && typeof choice.message.content === 'string') {
                    answer = choice.message.content;
                }
            }

            if (!answer) {
                answer = '未从 DeepSeek 返回有效回答，请检查接口与模型配置。';
            }

            this._panel.webview.postMessage({
                command: 'aiResponse',
                response: answer
            });
        } catch (err: any) {
            const message = err?.message ?? String(err);
            this._panel.webview.postMessage({
                command: 'aiResponse',
                response: `调用 DeepSeek 失败：${message}`
            });
        }
    }

    private _handleClearChat() {
        // 这里可以添加清空聊天的逻辑
        console.log('清空聊天记录');
    }

    private async _handleFetchContext(source: string) {
        try {
            const item = await this._fetchPublicContext(source);
            this._contextItems.push(item);
            const preview = this._buildContextPreview();
            this._panel.webview.postMessage({
                command: 'contextUpdated',
                count: this._contextItems.length,
                preview
            });
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            this._panel.webview.postMessage({
                command: 'contextUpdated',
                count: this._contextItems.length,
                preview: `获取上下文失败：${msg}`
            });
        }
    }

    private _handleClearContext() {
        this._contextItems = [];
        this._panel.webview.postMessage({
            command: 'contextUpdated',
            count: 0,
            preview: ''
        });
    }

    private _buildContextPreview(): string {
        // 拼接最近 2 条上下文用于预览
        const recent = this._contextItems.slice(-2);
        const parts = recent.map((item, idx) => `# ${item.source}\n${JSON.stringify(item.data, null, 2)}`);
        return parts.join('\n\n');
    }
}
