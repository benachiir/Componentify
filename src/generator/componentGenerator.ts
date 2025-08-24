import * as vscode from 'vscode';
import * as path from 'path';
import { FileUtils } from '../utils/fileUtils';
import { ASTUtils } from '../utils/astUtils';

export class ComponentGenerator {
    async extractComponent(editor: vscode.TextEditor, selection: vscode.Selection, selectedText: string): Promise<void> {
        try {
            // Get component name from user
            const componentName = await vscode.window.showInputBox({
                prompt: 'Enter component name (PascalCase)',
                validateInput: (value) => {
                    if (!value) return 'Component name is required';
                    if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
                        return 'Component name must be in PascalCase (e.g., MyComponent)';
                    }
                    return null;
                }
            });

            if (!componentName) return;

            const workspaceRoot = FileUtils.getWorkspaceRoot();
            const componentsDir = path.join(workspaceRoot, 'components');
            const isTypeScript = editor.document.fileName.endsWith('.tsx') || editor.document.fileName.endsWith('.ts');
            const fileExtension = isTypeScript ? '.tsx' : '.jsx';
            const componentFilePath = path.join(componentsDir, `${componentName}${fileExtension}`);

            // Check if file already exists
            if (await FileUtils.fileExists(componentFilePath)) {
                const overwrite = await vscode.window.showWarningMessage(
                    `Component ${componentName}${fileExtension} already exists. Overwrite?`,
                    'Yes', 'No'
                );
                if (overwrite !== 'Yes') return;
            }

            // Extract props from JSX
            const props = ASTUtils.extractPropsFromJSX(selectedText);
            
            // Generate component content
            const componentContent = this.generateComponentContent(componentName, selectedText, props, isTypeScript);

            // Ensure components directory exists
            await FileUtils.ensureDirectoryExists(componentsDir);

            // Write component file
            await FileUtils.writeFile(componentFilePath, componentContent);

            // Format the file
            await FileUtils.formatFile(componentFilePath);

            // Replace selection with component usage
            const componentUsage = this.generateComponentUsage(componentName, props);
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, componentUsage);
            });

            // Show success message
            vscode.window.showInformationMessage(`Component ${componentName} extracted successfully!`);

            // Open the new component file
            const document = await vscode.workspace.openTextDocument(componentFilePath);
            await vscode.window.showTextDocument(document);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to extract component: ${error}`);
        }
    }

    private generateComponentContent(name: string, jsxContent: string, props: any[], isTypeScript: boolean): string {
        const imports = isTypeScript ? 
            `import React from 'react';\n\n` :
            `import React from 'react';\nimport PropTypes from 'prop-types';\n\n`;

        let propsInterface = '';
        let propsDestructuring = '';
        let propTypes = '';

        if (props.length > 0) {
            if (isTypeScript) {
                propsInterface = `type Props = {\n${props.map(p => `  ${p.name}: ${p.type};`).join('\n')}\n};\n\n`;
                propsDestructuring = `{ ${props.map(p => p.name).join(', ')} }`;
            } else {
                propsDestructuring = `{ ${props.map(p => p.name).join(', ')} }`;
                propTypes = `\n${name}.propTypes = {\n${props.map(p => `  ${p.name}: PropTypes.any.isRequired,`).join('\n')}\n};\n`;
            }
        }

        const componentSignature = isTypeScript ? 
            `export const ${name}: React.FC${props.length > 0 ? '<Props>' : ''} = (${propsDestructuring ? `${propsDestructuring}` : ''}) => {` :
            `export const ${name} = (${propsDestructuring ? `${propsDestructuring}` : ''}) => {`;

        return `${imports}${propsInterface}${componentSignature}
  return (
${this.indentCode(jsxContent, 4)}
  );
};${propTypes}`;
    }

    private generateComponentUsage(componentName: string, props: any[]): string {
        if (props.length === 0) {
            return `<${componentName} />`;
        }

        const propsString = props.map(p => `${p.name}={${p.name}}`).join(' ');
        return `<${componentName} ${propsString} />`;
    }

    private indentCode(code: string, spaces: number): string {
        const indent = ' '.repeat(spaces);
        return code.split('\n').map(line => line.trim() ? indent + line : line).join('\n');
    }
}