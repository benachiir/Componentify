import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FileUtils {
    static async ensureDirectoryExists(dirPath: string): Promise<void> {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    static async fileExists(filePath: string): Promise<boolean> {
        return fs.existsSync(filePath);
    }

    static async writeFile(filePath: string, content: string): Promise<void> {
        await fs.promises.writeFile(filePath, content, 'utf8');
    }

    static getWorkspaceRoot(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }
        return workspaceFolders[0].uri.fsPath;
    }

    static async formatFile(filePath: string): Promise<void> {
        try {
            // Try to format with Prettier
            const { exec } = require('child_process');
            await new Promise<void>((resolve, reject) => {
                exec(`npx prettier --write "${filePath}"`, (error: any) => {
                    if (error) {
                        console.warn('Prettier formatting failed:', error.message);
                    }
                    resolve();
                });
            });

            // Try to lint with ESLint
            await new Promise<void>((resolve, reject) => {
                exec(`npx eslint --fix "${filePath}"`, (error: any) => {
                    if (error) {
                        console.warn('ESLint fixing failed:', error.message);
                    }
                    resolve();
                });
            });
        } catch (error) {
            console.warn('File formatting failed:', error);
        }
    }

    static toPascalCase(str: string): string {
        return str
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
                return word.toUpperCase();
            })
            .replace(/\s+/g, '')
            .replace(/[^a-zA-Z0-9]/g, '');
    }

    static toCamelCase(str: string): string {
        const pascalCase = this.toPascalCase(str);
        return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
    }
}