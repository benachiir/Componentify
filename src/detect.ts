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