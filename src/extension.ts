import * as vscode from 'vscode';
import { detectExportType } from './detect';
import { ComponentGenerator } from './generator/componentGenerator';
import { HookGenerator } from './generator/hookGenerator';

export function activate(context: vscode.ExtensionContext) {
    const componentGenerator = new ComponentGenerator();
    const hookGenerator = new HookGenerator();

    // Extract React Component
    const extractComponent = vscode.commands.registerCommand('reactExtractor.extractComponent', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select code to extract');
            return;
        }

        const selectedText = editor.document.getText(selection);
        await componentGenerator.extractComponent(editor, selection, selectedText);
    });

    // Extract React Hook
    const extractHook = vscode.commands.registerCommand('reactExtractor.extractHook', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select code to extract');
            return;
        }

        const selectedText = editor.document.getText(selection);
        await hookGenerator.extractHook(editor, selection, selectedText);
    });

    // Auto Detect Extract
    const extractAuto = vscode.commands.registerCommand('reactExtractor.extractAuto', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select code to extract');
            return;
        }

        const selectedText = editor.document.getText(selection);
        const exportType = detectExportType(selectedText);

        switch (exportType) {
            case 'component':
                await componentGenerator.extractComponent(editor, selection, selectedText);
                break;
            case 'hook':
                await hookGenerator.extractHook(editor, selection, selectedText);
                break;
            case 'unknown':
                vscode.window.showErrorMessage('Unable to detect if selection contains JSX component or hook logic. Please use specific extract commands.');
                break;
        }
    });

    context.subscriptions.push(extractComponent, extractHook, extractAuto);
}

export function deactivate() {}