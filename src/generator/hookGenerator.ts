import * as vscode from 'vscode';
import * as path from 'path';
import { FileUtils } from '../utils/fileUtils';
import { ASTUtils } from '../utils/astUtils';

export class HookGenerator {
    async extractHook(editor: vscode.TextEditor, selection: vscode.Selection, selectedText: string): Promise<void> {
        try {
            // Get hook name from user
            const hookName = await vscode.window.showInputBox({
                prompt: 'Enter hook name (e.g., useCounter, useToggle)',
                validateInput: (value) => {
                    if (!value) return 'Hook name is required';
                    if (!/^use[A-Z][a-zA-Z0-9]*$/.test(value)) {
                        return 'Hook name must start with "use" followed by PascalCase (e.g., useCounter)';
                    }
                    return null;
                }
            });

            if (!hookName) return;

            const workspaceRoot = FileUtils.getWorkspaceRoot();
            const hooksDir = path.join(workspaceRoot, 'hooks');
            const isTypeScript = editor.document.fileName.endsWith('.tsx') || editor.document.fileName.endsWith('.ts');
            const fileExtension = isTypeScript ? '.ts' : '.js';
            const hookFilePath = path.join(hooksDir, `${hookName}${fileExtension}`);

            // Check if file already exists
            if (await FileUtils.fileExists(hookFilePath)) {
                const overwrite = await vscode.window.showWarningMessage(
                    `Hook ${hookName}${fileExtension} already exists. Overwrite?`,
                    'Yes', 'No'
                );
                if (overwrite !== 'Yes') return;
            }

            // Extract return values from hook
            const returnValues = ASTUtils.extractHookReturns(selectedText);
            
            // Generate hook content
            const hookContent = this.generateHookContent(hookName, selectedText, returnValues, isTypeScript);

            // Ensure hooks directory exists
            await FileUtils.ensureDirectoryExists(hooksDir);

            // Write hook file
            await FileUtils.writeFile(hookFilePath, hookContent);

            // Format the file
            await FileUtils.formatFile(hookFilePath);

            // Replace selection with hook usage
            const hookUsage = this.generateHookUsage(hookName, returnValues);
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, hookUsage);
            });

            // Show success message
            vscode.window.showInformationMessage(`Hook ${hookName} extracted successfully!`);

            // Open the new hook file
            const document = await vscode.workspace.openTextDocument(hookFilePath);
            await vscode.window.showTextDocument(document);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to extract hook: ${error}`);
        }
    }

    private generateHookContent(name: string, hookCode: string, returnValues: string[], isTypeScript: boolean): string {
        // Extract React imports from the hook code
        const reactImports = this.extractReactImports(hookCode);
        const imports = `import { ${reactImports.join(', ')} } from 'react';\n\n`;

        // Generate return object
        let returnObject = '';
        if (returnValues.length > 0) {
            returnObject = `\n\n  return {\n${returnValues.map(val => `    ${val},`).join('\n')}\n  };`;
        } else {
            // If no specific returns detected, return an empty object or common patterns
            returnObject = '\n\n  return {};';
        }

        const hookSignature = `export const ${name} = () => {`;

        return `${imports}${hookSignature}
${this.indentCode(hookCode, 2)}${returnObject}
};`;
    }

    private generateHookUsage(hookName: string, returnValues: string[]): string {
        if (returnValues.length === 0) {
            return `const {} = ${hookName}();`;
        }

        const destructuring = returnValues.join(', ');
        return `const { ${destructuring} } = ${hookName}();`;
    }

    private extractReactImports(code: string): string[] {
        const imports = new Set<string>();
        
        // Common React hooks
        const hookPatterns = [
            'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback',
            'useMemo', 'useRef', 'useImperativeHandle', 'useLayoutEffect', 'useDebugValue'
        ];

        hookPatterns.forEach(hook => {
            if (new RegExp(`\\b${hook}\\b`).test(code)) {
                imports.add(hook);
            }
        });

        return Array.from(imports);
    }

    private indentCode(code: string, spaces: number): string {
        const indent = ' '.repeat(spaces);
        return code.split('\n').map(line => line.trim() ? indent + line : line).join('\n');
    }
}