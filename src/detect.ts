export type ExportType = 'component' | 'hook' | 'unknown';

export function detectExportType(code: string): ExportType {
    // Check for JSX patterns
    const hasJSX = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/s.test(code) || 
                   /<\w+[^>]*\/>/.test(code) ||
                   /<[A-Z]\w*/.test(code);
    
    // Check for React hooks
    const hasHooks = /\buse(State|Effect|Memo|Callback|Reducer|Ref|Context|ImperativeHandle|LayoutEffect|DebugValue)\b/.test(code);
    
    // Priority: JSX takes precedence over hooks
    if (hasJSX) {
        return 'component';
    }
    
    if (hasHooks) {
        return 'hook';
    }
    
    return 'unknown';
}

export interface DetectionResult {
    type: ExportType;
    confidence: number;
    complexity: number;
    patterns: DetectedPattern[];
    mixedContent: boolean;
    suggestions: string[];
}

export interface DetectedPattern {
    type: 'jsx' | 'hook' | 'state' | 'effect' | 'event-handler' | 'conditional' | 'loop';
    pattern: string;
    confidence: number;
    location: { start: number; end: number };
}

export class EnhancedDetectionEngine {
    private static readonly JSX_PATTERNS = [
        // JSX elements with closing tags
        /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/gs,
        // Self-closing JSX elements
        /<\w+[^>]*\/>/g,
        // JSX components (capitalized)
        /<[A-Z]\w*[^>]*>/g,
        // JSX fragments
        /<>[\s\S]*?<\/>/g,
        /<React\.Fragment[\s\S]*?<\/React\.Fragment>/g
    ];

    private static readonly HOOK_PATTERNS = [
        // Built-in React hooks
        /\buse(State|Effect|Memo|Callback|Reducer|Ref|Context|ImperativeHandle|LayoutEffect|DebugValue)\b/g,
        // Custom hooks (functions starting with 'use')
        /\buse[A-Z]\w*\s*\(/g,
        // Hook destructuring patterns
        /const\s*\[[\w\s,]+\]\s*=\s*use\w+/g,
        // Hook object destructuring
        /const\s*\{[\w\s,]+\}\s*=\s*use\w+/g
    ];

    private static readonly COMPLEXITY_PATTERNS = [
        // Conditional rendering
        { pattern: /\{[^}]*\?\s*[^:}]+\s*:\s*[^}]+\}/g, weight: 2, type: 'conditional' as const },
        // Logical operators in JSX
        { pattern: /\{[^}]*&&[^}]*\}/g, weight: 2, type: 'conditional' as const },
        // Array methods (map, filter, etc.)
        { pattern: /\.(map|filter|reduce|find|some|every)\s*\(/g, weight: 3, type: 'loop' as const },
        // Event handlers
        { pattern: /on[A-Z]\w*\s*=\s*\{[^}]+\}/g, weight: 1, type: 'event-handler' as const },
        // State updates
        { pattern: /set[A-Z]\w*\s*\(/g, weight: 2, type: 'state' as const },
        // useEffect patterns
        { pattern: /useEffect\s*\(\s*\(\s*\)\s*=>/g, weight: 3, type: 'effect' as const }
    ];

    /**
     * Enhanced detection with confidence scoring and complexity analysis
     */
    static analyzeCode(code: string): DetectionResult {
        const patterns: DetectedPattern[] = [];
        let jsxConfidence = 0;
        let hookConfidence = 0;
        let complexity = 0;

        // Detect JSX patterns
        this.JSX_PATTERNS.forEach(regex => {
            const matches = Array.from(code.matchAll(regex));
            matches.forEach(match => {
                const confidence = this.calculatePatternConfidence('jsx', match[0]);
                jsxConfidence += confidence;
                patterns.push({
                    type: 'jsx',
                    pattern: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
                    confidence,
                    location: { start: match.index || 0, end: (match.index || 0) + match[0].length }
                });
            });
        });

        // Detect hook patterns
        this.HOOK_PATTERNS.forEach(regex => {
            const matches = Array.from(code.matchAll(regex));
            matches.forEach(match => {
                const confidence = this.calculatePatternConfidence('hook', match[0]);
                hookConfidence += confidence;
                patterns.push({
                    type: 'hook',
                    pattern: match[0],
                    confidence,
                    location: { start: match.index || 0, end: (match.index || 0) + match[0].length }
                });
            });
        });

        // Calculate complexity
        this.COMPLEXITY_PATTERNS.forEach(({ pattern, weight, type }) => {
            const matches = Array.from(code.matchAll(pattern));
            matches.forEach(match => {
                complexity += weight;
                patterns.push({
                    type,
                    pattern: match[0].substring(0, 30) + (match[0].length > 30 ? '...' : ''),
                    confidence: 0.8, // Complexity patterns have high confidence
                    location: { start: match.index || 0, end: (match.index || 0) + match[0].length }
                });
            });
        });

        // Determine type and overall confidence
        const mixedContent = jsxConfidence > 0 && hookConfidence > 0;
        let type: ExportType;
        let confidence: number;

        if (jsxConfidence > hookConfidence) {
            type = 'component';
            confidence = Math.min(jsxConfidence / 5, 1); // Normalize to 0-1, more generous
        } else if (hookConfidence > 0) {
            type = 'hook';
            confidence = Math.min(hookConfidence / 3, 1); // Hooks need less evidence
        } else {
            type = 'unknown';
            confidence = 0;
        }

        // Generate suggestions
        const suggestions = this.generateSuggestions(type, mixedContent, complexity, patterns);

        return {
            type,
            confidence,
            complexity,
            patterns,
            mixedContent,
            suggestions
        };
    }

    /**
     * Calculate confidence for a specific pattern match
     */
    private static calculatePatternConfidence(patternType: 'jsx' | 'hook', match: string): number {
        if (patternType === 'jsx') {
            // Higher confidence for more complex JSX
            if (match.includes('className') || match.includes('onClick')) return 3;
            if (match.includes('<div') || match.includes('<span')) return 2;
            if (match.match(/<[A-Z]/)) return 4; // Component usage
            return 1;
        } else if (patternType === 'hook') {
            // Higher confidence for common hooks
            if (match.includes('useState') || match.includes('useEffect')) return 3;
            if (match.includes('useMemo') || match.includes('useCallback')) return 2;
            if (match.match(/use[A-Z]/)) return 2; // Custom hooks
            return 1;
        }
        return 1;
    }

    /**
     * Generate suggestions based on analysis
     */
    private static generateSuggestions(
        type: ExportType,
        mixedContent: boolean,
        complexity: number,
        patterns: DetectedPattern[]
    ): string[] {
        const suggestions: string[] = [];

        if (mixedContent) {
            suggestions.push('This code contains both JSX and hooks. Consider extracting hooks into a separate custom hook.');
        }

        if (complexity > 10) {
            suggestions.push('High complexity detected. Consider breaking this into smaller components or hooks.');
        }

        if (type === 'component') {
            const hasEventHandlers = patterns.some(p => p.type === 'event-handler');
            const hasState = patterns.some(p => p.type === 'state');
            
            if (hasEventHandlers && hasState) {
                suggestions.push('Consider extracting event handlers into separate functions or custom hooks.');
            }
            
            if (patterns.filter(p => p.type === 'jsx').length > 5) {
                suggestions.push('Large component detected. Consider breaking into smaller sub-components.');
            }
        }

        if (type === 'hook') {
            const hasEffects = patterns.some(p => p.type === 'effect');
            const hasState = patterns.some(p => p.type === 'state');
            
            if (hasEffects && hasState) {
                suggestions.push('Complex hook with state and effects. Ensure proper dependency arrays.');
            }
        }

        if (type === 'unknown') {
            suggestions.push('Unable to determine if this is a component or hook. Add JSX or React hooks to clarify.');
        }

        return suggestions;
    }

    /**
     * Quick detection for backward compatibility
     */
    static quickDetect(code: string): ExportType {
        const result = this.analyzeCode(code);
        return result.type;
    }

    /**
     * Check if code is suitable for extraction
     */
    static isExtractionWorthy(code: string): boolean {
        const result = this.analyzeCode(code);
        return result.confidence > 0.2 && result.patterns.length > 0;
    }

    /**
     * Get extraction recommendations
     */
    static getExtractionRecommendations(code: string): {
        shouldExtract: boolean;
        reason: string;
        suggestedName?: string;
        type: ExportType;
    } {
        const result = this.analyzeCode(code);
        
        if (result.confidence < 0.2) {
            return {
                shouldExtract: false,
                reason: 'Low confidence in code pattern detection',
                type: result.type
            };
        }

        if (result.patterns.length === 0) {
            return {
                shouldExtract: false,
                reason: 'No extractable patterns found',
                type: result.type
            };
        }

        // Generate suggested name based on patterns
        let suggestedName: string | undefined;
        if (result.type === 'component') {
            suggestedName = this.suggestComponentName(code, result.patterns);
        } else if (result.type === 'hook') {
            suggestedName = this.suggestHookName(code, result.patterns);
        }

        return {
            shouldExtract: true,
            reason: `${result.type} with ${result.confidence.toFixed(2)} confidence`,
            suggestedName,
            type: result.type
        };
    }

    /**
     * Suggest component name based on patterns
     */
    private static suggestComponentName(code: string, patterns: DetectedPattern[]): string {
        // Look for meaningful JSX elements
        const jsxPatterns = patterns.filter(p => p.type === 'jsx');
        
        for (const pattern of jsxPatterns) {
            const match = pattern.pattern.match(/<([A-Z]\w*)/);
            if (match) {
                return match[1] + 'Wrapper';
            }
        }

        // Look for common element types (prioritize form elements)
        if (code.includes('<form')) return 'CustomForm';
        if (code.includes('<input')) return 'CustomInput';
        if (code.includes('<button')) return 'CustomButton';
        if (code.includes('<div')) return 'CustomDiv';

        return 'ExtractedComponent';
    }

    /**
     * Suggest hook name based on patterns
     */
    private static suggestHookName(code: string, patterns: DetectedPattern[]): string {
        // Look for state variables
        const stateMatch = code.match(/const\s*\[(\w+),/);
        if (stateMatch) {
            return `use${this.capitalize(stateMatch[1])}`;
        }

        // Look for return values
        const returnMatch = code.match(/return\s*\{?\s*(\w+)/);
        if (returnMatch) {
            return `use${this.capitalize(returnMatch[1])}`;
        }

        // Look for function names
        const functionMatch = code.match(/function\s+(\w+)/);
        if (functionMatch) {
            return `use${this.capitalize(functionMatch[1])}`;
        }

        return 'useExtractedHook';
    }

    /**
     * Capitalize first letter
     */
    private static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}