import { EnhancedCodeAnalysisService, PropAnalysis, DetectedProp } from '../enhancedCodeAnalysisService';

describe('EnhancedCodeAnalysisService', () => {
    describe('extractPropsFromJSX', () => {
        it('should detect simple props from JSX variables', () => {
            const jsxCode = `
                <div>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
            `;

            const result = EnhancedCodeAnalysisService.extractPropsFromJSX(jsxCode);

            expect(result.props).toHaveLength(2);
            expect(result.props.find(p => p.name === 'title')).toBeDefined();
            expect(result.props.find(p => p.name === 'description')).toBeDefined();
            
            const titleProp = result.props.find(p => p.name === 'title')!;
            expect(titleProp.type).toBe('primitive');
            expect(titleProp.usage[0].type).toBe('simple');
        });

        it('should handle object property access', () => {
            const jsxCode = `
                <div>
                    <h1>{user.name}</h1>
                    <p>{user.profile.email}</p>
                    <img src={user.avatar} alt={user.name} />
                </div>
            `;

            const result = EnhancedCodeAnalysisService.extractPropsFromJSX(jsxCode);

            expect(result.props).toHaveLength(1);
            const userProp = result.props.find(p => p.name === 'user')!;
            expect(userProp).toBeDefined();
            expect(userProp.type).toBe('object');
            expect(userProp.usage).toHaveLength(3); // user.name, user.profile.email, user.avatar
            expect(userProp.usage.every(u => u.type === 'object-access')).toBe(true);

            expect(result.complexExpressions).toHaveLength(3);
            expect(result.complexExpressions[0].type).toBe('object-access');
            expect(result.complexExpressions[0].variables).toContain('user');
        });

        it('should detect function props', () => {
            const jsxCode = `
                <div>
                    <button onClick={handleClick}>Click me</button>
                    <input onChange={handleChange} />
                    <form onSubmit={handleSubmit()}>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            `;

            const result = EnhancedCodeAnalysisService.extractPropsFromJSX(jsxCode);


            const functionProps = result.props.filter(p => p.type === 'function');
            expect(functionProps).toHaveLength(3);
            
            const handleClickProp = result.props.find(p => p.name === 'handleClick')!;
            expect(handleClickProp.type).toBe('function');
            expect(handleClickProp.inferredType).toBe('() => void');
        });

        it('should handle conditional expressions', () => {
            const jsxCode = `
                <div>
                    {isVisible && <p>{message}</p>}
                    {user ? <span>{user.name}</span> : <span>Guest</span>}
                    {count > 0 ? <Badge count={count} /> : null}
                </div>
            `;

            const result = EnhancedCodeAnalysisService.extractPropsFromJSX(jsxCode);

            expect(result.conditionalProps).toContain('isVisible');
            expect(result.conditionalProps).toContain('user');
            
            const isVisibleProp = result.props.find(p => p.name === 'isVisible')!;
            expect(isVisibleProp.inferredType).toBe('boolean');
            expect(isVisibleProp.usage.some(u => u.type === 'conditional')).toBe(true);
        });

        it('should handle array methods and complex expressions', () => {
            const jsxCode = `
                <div>
                    {items.map(item => <Item key={item.id} data={item} />)}
                    {users.filter(u => u.active).length}
                    {products.find(p => p.featured)?.name}
                </div>
            `;

            const result = EnhancedCodeAnalysisService.extractPropsFromJSX(jsxCode);
            console.log('Array methods test - all props:', result.props.map(p => ({ name: p.name, type: p.type })));

            const itemsProp = result.props.find(p => p.name === 'items');
            const usersProp = result.props.find(p => p.name === 'users');
            const productsProp = result.props.find(p => p.name === 'products');

            expect(itemsProp).toBeDefined();
            expect(usersProp).toBeDefined();
            expect(productsProp).toBeDefined();

            // All should be detected as objects since they have method calls
            expect(itemsProp?.type).toBe('object');
            expect(usersProp?.type).toBe('object');
            expect(productsProp?.type).toBe('object');
        });

        it('should handle inline functions with variable references', () => {
            const jsxCode = `
                <div>
                    <button onClick={() => handleClick(id)}>Click</button>
                    <input onChange={(e) => setValue(e.target.value)} />
                    {items.map((item, index) => (
                        <div key={item.id} onClick={() => onSelect(item, index)}>
                            {formatItem(item)}
                        </div>
                    ))}
                </div>
            `;

            const result = EnhancedCodeAnalysisService.extractPropsFromJSX(jsxCode);

            // Should detect referenced variables in inline functions
            expect(result.props.some(p => p.name === 'handleClick')).toBe(true);
            expect(result.props.some(p => p.name === 'setValue')).toBe(true);
            expect(result.props.some(p => p.name === 'onSelect')).toBe(true);
            expect(result.props.some(p => p.name === 'formatItem')).toBe(true);
            expect(result.props.some(p => p.name === 'id')).toBe(true);
            expect(result.props.some(p => p.name === 'items')).toBe(true);
        });

        it('should calculate complexity correctly', () => {
            const simpleJSX = '<div>{title}</div>';
            const complexJSX = `
                <div>
                    {user.profile.name}
                    {isActive && <Badge type={badgeType} />}
                    {items.map(item => <Item key={item.id} onClick={() => handleClick(item)} />)}
                </div>
            `;

            const simpleResult = EnhancedCodeAnalysisService.extractPropsFromJSX(simpleJSX);
            const complexResult = EnhancedCodeAnalysisService.extractPropsFromJSX(complexJSX);

            expect(simpleResult.totalComplexity).toBeLessThan(complexResult.totalComplexity);
            expect(complexResult.totalComplexity).toBeGreaterThan(10); // Should be reasonably complex
        });

        it('should handle edge cases and malformed JSX gracefully', () => {
            const malformedJSX = `
                <div>
                    {unclosedBrace
                    {user.}
                    {.property}
                    {}
                </div>
            `;

            // Should not throw and should use regex fallback
            expect(() => {
                const result = EnhancedCodeAnalysisService.extractPropsFromJSX(malformedJSX);
                expect(result.props).toBeDefined();
                expect(Array.isArray(result.props)).toBe(true);
            }).not.toThrow();
        });

        it('should detect prop requirements correctly', () => {
            const jsxCode = `
                <div>
                    <h1>{title}</h1>
                    {subtitle && <h2>{subtitle}</h2>}
                    <p>{description || 'No description'}</p>
                </div>
            `;

            const result = EnhancedCodeAnalysisService.extractPropsFromJSX(jsxCode);

            const titleProp = result.props.find(p => p.name === 'title')!;
            const subtitleProp = result.props.find(p => p.name === 'subtitle')!;
            const descriptionProp = result.props.find(p => p.name === 'description')!;

            expect(titleProp.isRequired).toBe(true); // Used directly
            expect(subtitleProp.isRequired).toBe(true); // Used in conditional, still required
            expect(descriptionProp.isRequired).toBe(true); // Used with fallback, still required
        });
    });
});