import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export interface DetectedProp {
    name: string;
    type: 'primitive' | 'object' | 'function' | 'array' | 'unknown';
    inferredType: string;
    isRequired: boolean;
    defaultValue?: string;
    usage: PropUsage[];
}

export interface PropUsage {
    type: 'simple' | 'object-access' | 'function-call' | 'conditional' | 'array-method';
    expression: string;
    context: string;
}

export interface ComplexExpression {
    expression: string;
    variables: string[];
    type: 'object-access' | 'function-call' | 'conditional' | 'array-method';
    suggestedPropName: string;
}

export interface PropAnalysis {
    props: DetectedProp[];
    complexExpressions: ComplexExpression[];
    conditionalProps: string[];
    totalComplexity: number;
}

export class EnhancedCodeAnalysisService {
    /**
     * Enhanced prop extraction with complex pattern detection
     */
    static extractPropsFromJSX(jsxCode: string): PropAnalysis {
        const props: DetectedProp[] = [];
        const complexExpressions: ComplexExpression[] = [];
        const conditionalProps: string[] = [];
        const propMap = new Map<string, DetectedProp>();

        try {
            const ast = parse(jsxCode, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            });

            traverse(ast, {
                // Handle simple JSX expressions
                JSXExpressionContainer(path: NodePath<t.JSXExpressionContainer>) {
                    if (!t.isJSXEmptyExpression(path.node.expression)) {
                        EnhancedCodeAnalysisService.analyzeJSXExpression(path.node.expression, propMap, complexExpressions);
                    }
                },

                // Handle JSX attributes
                JSXAttribute(path: NodePath<t.JSXAttribute>) {
                    if (t.isJSXExpressionContainer(path.node.value) && 
                        !t.isJSXEmptyExpression(path.node.value.expression)) {
                        
                        // Get attribute name to infer prop type
                        const attributeName = t.isJSXIdentifier(path.node.name) ? path.node.name.name : '';
                        const isEventHandler = attributeName.startsWith('on') && attributeName.length > 2;
                        
                        EnhancedCodeAnalysisService.analyzeJSXAttributeExpression(
                            path.node.value.expression, 
                            propMap, 
                            complexExpressions,
                            isEventHandler
                        );
                    }
                },

                // Handle conditional expressions
                ConditionalExpression(path: NodePath<t.ConditionalExpression>) {
                    EnhancedCodeAnalysisService.analyzeConditionalExpression(path.node, propMap, conditionalProps);
                },

                // Handle logical expressions (&&, ||)
                LogicalExpression(path: NodePath<t.LogicalExpression>) {
                    EnhancedCodeAnalysisService.analyzeLogicalExpression(path.node, propMap, conditionalProps);
                }
            });

            // Convert map to array
            props.push(...Array.from(propMap.values()));

        } catch (error) {
            // Enhanced regex fallback
            this.fallbackPropExtraction(jsxCode, propMap);
            props.push(...Array.from(propMap.values()));
        }

        return {
            props,
            complexExpressions,
            conditionalProps,
            totalComplexity: this.calculateComplexity(props, complexExpressions)
        };
    }

    /**
     * Analyze JSX attribute expressions with context awareness
     */
    private static analyzeJSXAttributeExpression(
        expression: t.Expression,
        propMap: Map<string, DetectedProp>,
        complexExpressions: ComplexExpression[],
        isEventHandler: boolean = false
    ): void {
        if (t.isIdentifier(expression)) {
            // Simple variable: {title} or event handler {handleClick}
            const type = isEventHandler ? 'function' : 'primitive';
            const inferredType = isEventHandler ? '() => void' : 'any';
            
            EnhancedCodeAnalysisService.addProp(propMap, expression.name, type, inferredType, [{
                type: isEventHandler ? 'function-call' : 'simple',
                expression: expression.name,
                context: 'jsx-attribute'
            }]);

        } else {
            // For other expressions, use the general analysis
            EnhancedCodeAnalysisService.analyzeJSXExpression(expression, propMap, complexExpressions);
        }
    }

    /**
     * Analyze JSX expressions for prop detection
     */
    private static analyzeJSXExpression(
        expression: t.Expression,
        propMap: Map<string, DetectedProp>,
        complexExpressions: ComplexExpression[]
    ): void {
        if (t.isIdentifier(expression)) {
            // Simple variable: {title}
            EnhancedCodeAnalysisService.addProp(propMap, expression.name, 'primitive', 'any', [{
                type: 'simple',
                expression: expression.name,
                context: 'jsx-expression'
            }]);

        } else if (t.isMemberExpression(expression)) {
            // Object property access: {user.name}
            const rootObject = EnhancedCodeAnalysisService.getRootIdentifier(expression);
            if (rootObject) {
                const expressionStr = EnhancedCodeAnalysisService.expressionToString(expression);
                EnhancedCodeAnalysisService.addProp(propMap, rootObject, 'object', 'any', [{
                    type: 'object-access',
                    expression: expressionStr,
                    context: 'jsx-expression'
                }]);

                // Only add to complex expressions if not already present
                if (!complexExpressions.some(ce => ce.expression === expressionStr)) {
                    complexExpressions.push({
                        expression: expressionStr,
                        variables: [rootObject],
                        type: 'object-access',
                        suggestedPropName: rootObject
                    });
                }
            }

        } else if (t.isCallExpression(expression)) {
            // Function calls: {handleClick()}
            if (t.isIdentifier(expression.callee)) {
                EnhancedCodeAnalysisService.addProp(propMap, expression.callee.name, 'function', '() => void', [{
                    type: 'function-call',
                    expression: EnhancedCodeAnalysisService.expressionToString(expression),
                    context: 'jsx-expression'
                }]);
            } else if (t.isMemberExpression(expression.callee)) {
                // Handle method calls like items.map()
                const rootObject = EnhancedCodeAnalysisService.getRootIdentifier(expression.callee);
                if (rootObject) {
                    EnhancedCodeAnalysisService.addProp(propMap, rootObject, 'object', 'any', [{
                        type: 'array-method',
                        expression: EnhancedCodeAnalysisService.expressionToString(expression),
                        context: 'jsx-expression'
                    }]);
                }
            }

        } else if (t.isArrowFunctionExpression(expression) || t.isFunctionExpression(expression)) {
            // Inline functions: {() => handleClick()}
            const referencedVars = EnhancedCodeAnalysisService.extractVariablesFromFunction(expression);
            referencedVars.forEach(varName => {
                // Skip common parameter names and built-in identifiers
                if (!['e', 'event', 'item', 'index', 'key', 'value'].includes(varName)) {
                    EnhancedCodeAnalysisService.addProp(propMap, varName, 'function', 'any', [{
                        type: 'function-call',
                        expression: varName,
                        context: 'inline-function'
                    }]);
                }
            });
        }
    }

    /**
     * Analyze conditional expressions for prop detection
     */
    private static analyzeConditionalExpression(
        node: t.ConditionalExpression,
        propMap: Map<string, DetectedProp>,
        conditionalProps: string[]
    ): void {
        // Analyze test condition
        if (t.isIdentifier(node.test)) {
            this.addProp(propMap, node.test.name, 'primitive', 'boolean', [{
                type: 'conditional',
                expression: node.test.name,
                context: 'conditional-test'
            }]);
            conditionalProps.push(node.test.name);
        }

        // Analyze consequent and alternate
        [node.consequent, node.alternate].forEach(branch => {
            if (t.isIdentifier(branch)) {
                this.addProp(propMap, branch.name, 'unknown', 'any', [{
                    type: 'conditional',
                    expression: branch.name,
                    context: 'conditional-branch'
                }]);
            }
        });
    }

    /**
     * Analyze logical expressions (&&, ||)
     */
    private static analyzeLogicalExpression(
        node: t.LogicalExpression,
        propMap: Map<string, DetectedProp>,
        conditionalProps: string[]
    ): void {
        if (t.isIdentifier(node.left)) {
            this.addProp(propMap, node.left.name, 'primitive', 'boolean', [{
                type: 'conditional',
                expression: node.left.name,
                context: 'logical-expression'
            }]);
            conditionalProps.push(node.left.name);
        }

        if (t.isIdentifier(node.right)) {
            this.addProp(propMap, node.right.name, 'unknown', 'any', [{
                type: 'conditional',
                expression: node.right.name,
                context: 'logical-expression'
            }]);
        }
    }

    /**
     * Add or update prop in the map
     */
    private static addProp(
        propMap: Map<string, DetectedProp>,
        name: string,
        type: DetectedProp['type'],
        inferredType: string,
        usage: PropUsage[]
    ): void {
        if (propMap.has(name)) {
            const existing = propMap.get(name)!;
            // Only add usage if it's not a duplicate
            usage.forEach(newUsage => {
                const isDuplicate = existing.usage.some(existingUsage => 
                    existingUsage.expression === newUsage.expression && 
                    existingUsage.type === newUsage.type
                );
                if (!isDuplicate) {
                    existing.usage.push(newUsage);
                }
            });
            // Upgrade type if we have better information
            if (existing.type === 'unknown' && type !== 'unknown') {
                existing.type = type;
                existing.inferredType = inferredType;
            }
        } else {
            propMap.set(name, {
                name,
                type,
                inferredType,
                isRequired: true, // Default to required, can be refined later
                usage
            });
        }
    }

    /**
     * Get root identifier from member expression
     */
    private static getRootIdentifier(node: t.MemberExpression): string | null {
        if (t.isIdentifier(node.object)) {
            return node.object.name;
        } else if (t.isMemberExpression(node.object)) {
            return this.getRootIdentifier(node.object);
        }
        return null;
    }

    /**
     * Convert expression to string representation
     */
    private static expressionToString(node: t.Expression): string {
        if (t.isIdentifier(node)) {
            return node.name;
        } else if (t.isMemberExpression(node)) {
            const object = this.expressionToString(node.object);
            const property = t.isIdentifier(node.property) ? node.property.name : '[computed]';
            return `${object}.${property}`;
        } else if (t.isCallExpression(node)) {
            const callee = t.isIdentifier(node.callee) ? node.callee.name : '[complex]';
            return `${callee}()`;
        }
        return '[complex-expression]';
    }

    /**
     * Extract variables referenced in function expressions
     */
    private static extractVariablesFromFunction(node: t.ArrowFunctionExpression | t.FunctionExpression): string[] {
        const variables: string[] = [];
        
        // Simple traversal to find identifiers - we'll enhance this later
        traverse(node as any, {
            Identifier(path: NodePath<t.Identifier>) {
                // Only collect identifiers that are referenced (not declared)
                if (path.isReferencedIdentifier()) {
                    variables.push(path.node.name);
                }
            }
        });

        return [...new Set(variables)]; // Remove duplicates
    }

    /**
     * Enhanced regex fallback for prop extraction
     */
    private static fallbackPropExtraction(jsxCode: string, propMap: Map<string, DetectedProp>): void {
        // Simple variables: {variable}
        const simpleVarRegex = /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g;
        let match;
        while ((match = simpleVarRegex.exec(jsxCode)) !== null) {
            this.addProp(propMap, match[1], 'unknown', 'any', [{
                type: 'simple',
                expression: match[1],
                context: 'regex-fallback'
            }]);
        }

        // Object property access: {obj.prop}
        const objectAccessRegex = /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\.[a-zA-Z_$][a-zA-Z0-9_$.]*\}/g;
        while ((match = objectAccessRegex.exec(jsxCode)) !== null) {
            this.addProp(propMap, match[1], 'object', 'any', [{
                type: 'object-access',
                expression: match[0].slice(1, -1), // Remove { }
                context: 'regex-fallback'
            }]);
        }

        // Function calls: {func()}
        const functionCallRegex = /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)\}/g;
        while ((match = functionCallRegex.exec(jsxCode)) !== null) {
            this.addProp(propMap, match[1], 'function', '() => void', [{
                type: 'function-call',
                expression: match[1] + '()',
                context: 'regex-fallback'
            }]);
        }
    }

    /**
     * Calculate complexity score for the analysis
     */
    private static calculateComplexity(props: DetectedProp[], complexExpressions: ComplexExpression[]): number {
        let complexity = props.length; // Base complexity
        
        // Add complexity for different usage types
        props.forEach(prop => {
            prop.usage.forEach(usage => {
                switch (usage.type) {
                    case 'simple': complexity += 1; break;
                    case 'object-access': complexity += 2; break;
                    case 'function-call': complexity += 2; break;
                    case 'conditional': complexity += 3; break;
                    case 'array-method': complexity += 3; break;
                }
            });
        });

        // Add complexity for complex expressions
        complexity += complexExpressions.length * 2;

        return complexity;
    }
}