"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const aiAssistantPanel_1 = require("./aiAssistantPanel");
// 当插件被激活时调用
function activate(context) {
    console.log('AI Assistant插件已激活！');
    // 注册命令：打开AI助手面板
    const openPanelCommand = vscode.commands.registerCommand('my-ai-assistant.openPanel', () => {
        aiAssistantPanel_1.AIAssistantPanel.createOrShow(context.extensionUri);
    });
    // 注册命令：对选中文本提问
    const askQuestionCommand = vscode.commands.registerCommand('my-ai-assistant.askQuestion', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            if (selectedText) {
                // 如果有选中文本，打开面板并自动填入问题
                aiAssistantPanel_1.AIAssistantPanel.createOrShow(context.extensionUri, selectedText);
            }
            else {
                // 如果没有选中文本，显示提示
                vscode.window.showInformationMessage('请先选中一些文本，然后使用AI助手功能');
            }
        }
    });
    // 将命令添加到上下文
    context.subscriptions.push(openPanelCommand, askQuestionCommand);
    // 如果已经有面板存在，重新创建它
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(aiAssistantPanel_1.AIAssistantPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                aiAssistantPanel_1.AIAssistantPanel.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}
exports.activate = activate;
// 当插件被停用时调用
function deactivate() {
    console.log('AI Assistant插件已停用');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map