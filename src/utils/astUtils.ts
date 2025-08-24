import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export interface PropInfo {
    name: string;
    type: string;
}

export class ASTUtils {
    static extractPropsFromJSX(jsxCode: string): PropInfo[] {
        const props: PropInfo[] = [];
        const propNames = new Set<string>();

        try {
            // Parse the JSX code
            const ast = parse(jsxCode, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            });

            traverse(ast, {
                JSXExpressionContainer(path: NodePath<t.JSXExpressionContainer>) {
                    if (t.isIdentifier(path.node.expression)) {
                        const propName = path.node.expression.name;
                        if (!propNames.has(propName)) {
                            propNames.add(propName);
                            props.push({
                                name: propName,
                                type: 'any' // Default type, could be enhanced with type inference
                            });
                        }
                    }
                },
                MemberExpression(path: NodePath<t.MemberExpression>) {
                    if (t.isIdentifier(path.node.object)) {
                        const propName = path.node.object.name;
                        if (!propNames.has(propName)) {
                            propNames.add(propName);
                            props.push({
                                name: propName,
                                type: 'any'
                            });
                        }
                    }
                }
            });
        } catch (error) {
            // Fallback to regex if AST parsing fails
            const regex = /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g;
            let match;
            while ((match = regex.exec(jsxCode)) !== null) {
                const propName = match[1];
                if (!propNames.has(propName)) {
                    propNames.add(propName);
                    props.push({
                        name: propName,
                        type: 'any'
                    });
                }
            }
        }

        return props;
    }

    static extractHookReturns(hookCode: string): string[] {
        const returns: string[] = [];
        const returnNames = new Set<string>();

        try {
            const ast = parse(hookCode, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            });

            traverse(ast, {
                VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
                    if (t.isArrayPattern(path.node.id)) {
                        // Handle useState destructuring: const [state, setState] = useState()
                        path.node.id.elements.forEach((element: t.ArrayPattern['elements'][0]) => {
                            if (t.isIdentifier(element)) {
                                const name = element.name;
                                if (!returnNames.has(name)) {
                                    returnNames.add(name);
                                    returns.push(name);
                                }
                            }
                        });
                    } else if (t.isIdentifier(path.node.id)) {
                        // Handle regular variables
                        const name = path.node.id.name;
                        if (!returnNames.has(name)) {
                            returnNames.add(name);
                            returns.push(name);
                        }
                    }
                }
            });
        } catch (error) {
            // Fallback to regex
            const stateRegex = /const\s+\[([^,\]]+)(?:,\s*([^,\]]+))?\]\s*=/g;
            let match;
            while ((match = stateRegex.exec(hookCode)) !== null) {
                if (match[1] && !returnNames.has(match[1])) {
                    returnNames.add(match[1]);
                    returns.push(match[1]);
                }
            }
        }

        return returns;
    }
}