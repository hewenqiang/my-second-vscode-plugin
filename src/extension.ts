import * as vscode from 'vscode';
import { AIAssistantPanel } from './aiAssistantPanel';

// 当插件被激活时调用
export function activate(context: vscode.ExtensionContext) {
    console.log('AI Assistant插件已激活！');

    // 注册命令：打开AI助手面板
    const openPanelCommand = vscode.commands.registerCommand('my-ai-assistant.openPanel', () => {
        AIAssistantPanel.createOrShow(context.extensionUri);
    });

    // 注册命令：对选中文本提问
    const askQuestionCommand = vscode.commands.registerCommand('my-ai-assistant.askQuestion', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (selectedText) {
                // 如果有选中文本，打开面板并自动填入问题
                AIAssistantPanel.createOrShow(context.extensionUri, selectedText);
            } else {
                // 如果没有选中文本，显示提示
                vscode.window.showInformationMessage('请先选中一些文本，然后使用AI助手功能');
            }
        }
    });

    // 将命令添加到上下文
    context.subscriptions.push(openPanelCommand, askQuestionCommand);

    // 如果已经有面板存在，重新创建它
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(AIAssistantPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                AIAssistantPanel.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}

// 当插件被停用时调用
export function deactivate() {
    console.log('AI Assistant插件已停用');
}
