import { detectExportType, EnhancedDetectionEngine, DetectionResult } from '../detect';

describe('detectExportType (legacy)', () => {
    it('should detect components with JSX', () => {
        const componentCode = `
            function MyComponent() {
                return <div>Hello World</div>;
            }
        `;
        expect(detectExportType(componentCode)).toBe('component');
    });

    it('should detect hooks with React hooks', () => {
        const hookCode = `
            function useCounter() {
                const [count, setCount] = useState(0);
                return { count, setCount };
            }
        `;
        expect(detectExportType(hookCode)).toBe('hook');
    });

    it('should return unknown for unclear code', () => {
        const unknownCode = `
            function helper() {
                return 'some value';
            }
        `;
        expect(detectExportType(unknownCode)).toBe('unknown');
    });
});

describe('EnhancedDetectionEngine', () => {
    describe('analyzeCode', () => {
        it('should detect simple components with high confidence', () => {
            const componentCode = `
                function MyComponent({ title, onClick }) {
                    return (
                        <div className="container">
                            <h1>{title}</h1>
                            <button onClick={onClick}>Click me</button>
                        </div>
                    );
                }
            `;

            const result = EnhancedDetectionEngine.analyzeCode(componentCode);

            expect(result.type).toBe('component');
            expect(result.confidence).toBeGreaterThan(0.3);
            expect(result.patterns.some(p => p.type === 'jsx')).toBe(true);
            expect(result.patterns.some(p => p.type === 'event-handler')).toBe(true);
            expect(result.mixedContent).toBe(false);
        });

        it('should detect hooks with confidence scoring', () => {
            const hookCode = `
                function useCounter(initialValue = 0) {
                    const [count, setCount] = useState(initialValue);
                    
                    useEffect(() => {
                        console.log('Count changed:', count);
                    }, [count]);

                    const increment = useCallback(() => {
                        setCount(prev => prev + 1);
                    }, []);

                    return { count, increment };
                }
            `;

            const result = EnhancedDetectionEngine.analyzeCode(hookCode);

            expect(result.type).toBe('hook');
            expect(result.confidence).toBeGreaterThan(0.6);
            expect(result.patterns.some(p => p.type === 'hook')).toBe(true);
            expect(result.patterns.some(p => p.type === 'effect')).toBe(true);
            expect(result.patterns.some(p => p.type === 'state')).toBe(true);
            expect(result.mixedContent).toBe(false);
        });

        it('should detect mixed content (component with hooks)', () => {
            const mixedCode = `
                function MyComponent() {
                    const [isVisible, setIsVisible] = useState(false);
                    
                    useEffect(() => {
                        setIsVisible(true);
                    }, []);

                    return (
                        <div>
                            {isVisible && <p>Now you see me!</p>}
                            <button onClick={() => setIsVisible(!isVisible)}>
                                Toggle
                            </button>
                        </div>
                    );
                }
            `;

            const result = EnhancedDetectionEngine.analyzeCode(mixedCode);

            expect(result.type).toBe('hook'); // Hooks have higher confidence in this case
            expect(result.mixedContent).toBe(true);
            expect(result.patterns.some(p => p.type === 'jsx')).toBe(true);
            expect(result.patterns.some(p => p.type === 'hook')).toBe(true);
            expect(result.suggestions.some(s => s.includes('both JSX and hooks'))).toBe(true);
        });

        it('should calculate complexity correctly', () => {
            const simpleCode = '<div>Hello</div>';
            const complexCode = `
                function ComplexComponent({ items, onSelect, filter }) {
                    const [selectedId, setSelectedId] = useState(null);
                    const [isLoading, setIsLoading] = useState(false);

                    useEffect(() => {
                        setIsLoading(true);
                        // Some async operation
                        setIsLoading(false);
                    }, [items]);

                    const filteredItems = useMemo(() => {
                        return items.filter(item => 
                            filter ? item.category === filter : true
                        );
                    }, [items, filter]);

                    return (
                        <div className="complex-component">
                            {isLoading ? (
                                <div>Loading...</div>
                            ) : (
                                <div>
                                    {filteredItems.map(item => (
                                        <div 
                                            key={item.id}
                                            className={selectedId === item.id ? 'selected' : ''}
                                            onClick={() => {
                                                setSelectedId(item.id);
                                                onSelect(item);
                                            }}
                                        >
                                            {item.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }
            `;

            const simpleResult = EnhancedDetectionEngine.analyzeCode(simpleCode);
            const complexResult = EnhancedDetectionEngine.analyzeCode(complexCode);

            expect(complexResult.complexity).toBeGreaterThan(simpleResult.complexity);
            expect(complexResult.complexity).toBeGreaterThan(10);
            expect(complexResult.suggestions.some(s => s.includes('High complexity'))).toBe(true);
        });

        it('should detect conditional rendering patterns', () => {
            const conditionalCode = `
                function ConditionalComponent({ user, isLoggedIn, showDetails }) {
                    return (
                        <div>
                            {isLoggedIn && <p>Welcome back!</p>}
                            {user ? <span>{user.name}</span> : <span>Guest</span>}
                            {showDetails && user && (
                                <div>
                                    <p>{user.email}</p>
                                    <p>{user.role}</p>
                                </div>
                            )}
                        </div>
                    );
                }
            `;

            const result = EnhancedDetectionEngine.analyzeCode(conditionalCode);

            expect(result.patterns.some(p => p.type === 'conditional')).toBe(true);
            expect(result.complexity).toBeGreaterThan(3);
        });

        it('should detect array methods and loops', () => {
            const loopCode = `
                function ListComponent({ items, users, products }) {
                    return (
                        <div>
                            {items.map(item => <Item key={item.id} data={item} />)}
                            {users.filter(u => u.active).map(user => (
                                <UserCard key={user.id} user={user} />
                            ))}
                            <p>Total products: {products.reduce((sum, p) => sum + p.quantity, 0)}</p>
                        </div>
                    );
                }
            `;

            const result = EnhancedDetectionEngine.analyzeCode(loopCode);

            expect(result.patterns.some(p => p.type === 'loop')).toBe(true);
            expect(result.complexity).toBeGreaterThan(8);
        });

        it('should handle unknown code gracefully', () => {
            const unknownCode = `
                function utilityFunction(a, b) {
                    return a + b;
                }
                
                const config = {
                    apiUrl: 'https://api.example.com',
                    timeout: 5000
                };
            `;

            const result = EnhancedDetectionEngine.analyzeCode(unknownCode);

            expect(result.type).toBe('unknown');
            expect(result.confidence).toBe(0);
            expect(result.patterns).toHaveLength(0);
            expect(result.suggestions.some(s => s.includes('Unable to determine'))).toBe(true);
        });
    });

    describe('quickDetect', () => {
        it('should provide backward compatibility', () => {
            const componentCode = '<div>Hello</div>';
            const hookCode = 'const [state, setState] = useState();';

            expect(EnhancedDetectionEngine.quickDetect(componentCode)).toBe('component');
            expect(EnhancedDetectionEngine.quickDetect(hookCode)).toBe('hook');
        });
    });

    describe('isExtractionWorthy', () => {
        it('should return true for worthy extractions', () => {
            const worthyCode = `
                function MyComponent() {
                    return <div>Hello World</div>;
                }
            `;

            expect(EnhancedDetectionEngine.isExtractionWorthy(worthyCode)).toBe(true);
        });

        it('should return false for unworthy extractions', () => {
            const unworthyCode = 'const x = 5;';

            expect(EnhancedDetectionEngine.isExtractionWorthy(unworthyCode)).toBe(false);
        });
    });

    describe('getExtractionRecommendations', () => {
        it('should recommend component extraction with suggested name', () => {
            const componentCode = `
                function SomeComponent() {
                    return (
                        <button onClick={handleClick}>
                            Click me
                        </button>
                    );
                }
            `;

            const recommendation = EnhancedDetectionEngine.getExtractionRecommendations(componentCode);

            expect(recommendation.shouldExtract).toBe(true);
            expect(recommendation.type).toBe('component');
            expect(recommendation.suggestedName).toContain('Button');
        });

        it('should recommend hook extraction with suggested name', () => {
            const hookCode = `
                function useCounter() {
                    const [count, setCount] = useState(0);
                    return { count, setCount };
                }
            `;

            const recommendation = EnhancedDetectionEngine.getExtractionRecommendations(hookCode);

            expect(recommendation.shouldExtract).toBe(true);
            expect(recommendation.type).toBe('hook');
            expect(recommendation.suggestedName).toBe('useCount');
        });

        it('should not recommend extraction for low confidence code', () => {
            const lowConfidenceCode = 'const helper = () => "test";';

            const recommendation = EnhancedDetectionEngine.getExtractionRecommendations(lowConfidenceCode);

            expect(recommendation.shouldExtract).toBe(false);
            expect(recommendation.reason).toContain('Low confidence');
        });
    });

    describe('name suggestions', () => {
        it('should suggest component names based on JSX elements', () => {
            const formCode = `
                function MyForm() {
                    return (
                        <form onSubmit={handleSubmit}>
                            <input type="text" />
                            <button type="submit">Submit</button>
                        </form>
                    );
                }
            `;

            const recommendation = EnhancedDetectionEngine.getExtractionRecommendations(formCode);
            expect(recommendation.suggestedName).toBe('CustomForm');
        });

        it('should suggest hook names based on state variables', () => {
            const hookCode = `
                const [isVisible, setIsVisible] = useState(false);
                return { isVisible, setIsVisible };
            `;

            const recommendation = EnhancedDetectionEngine.getExtractionRecommendations(hookCode);
            expect(recommendation.suggestedName).toBe('useIsVisible');
        });

        it('should suggest hook names based on return values', () => {
            const hookCode = `
                function useCustomHook() {
                    const data = fetchData();
                    return { data, loading, error };
                }
            `;

            const recommendation = EnhancedDetectionEngine.getExtractionRecommendations(hookCode);
            expect(recommendation.suggestedName).toBe('useData');
        });
    });
});