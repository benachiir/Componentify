# Test Examples for React Extractor

This directory contains sample React code for testing and demonstrating the React Extractor extension functionality.

## 📁 Files

### `sample-component.tsx`
Complete React component with various patterns for testing:
- JSX component extraction
- Hook logic extraction  
- Mixed content scenarios
- Complex prop patterns

### `test-file.tsx`
Simple test file with clear examples for:
- Basic component extraction
- Hook extraction
- Auto-detection testing

## 🧪 How to Use

1. **Open Extension Development Host** (Press F5)
2. **Open any test file** in the new window
3. **Select code patterns** as indicated in comments
4. **Test extraction commands**:
   - Right-click → "Extract React (Auto Detect)"
   - Or use Command Palette → "Extract React"

## 🎯 Test Scenarios

### Component Extraction
```tsx
// Select this JSX block:
<div className="user-card">
  <h3>{user.name}</h3>
  <p>{user.email}</p>
</div>
```

### Hook Extraction  
```tsx
// Select this hook logic:
const [count, setCount] = useState(0);
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  console.log('Effect running');
}, [count]);
```

### Auto Detection
- Select any React code and let the extension decide!
- Test with mixed JSX + hooks to see intelligent handling

## 📝 Expected Results

After extraction, you should see:
- ✅ New files created in `/components` or `/hooks`
- ✅ Original code replaced with component/hook usage
- ✅ Import statements added automatically
- ✅ Files formatted with Prettier/ESLint (if available)

## 🐛 Troubleshooting

If extraction doesn't work:
1. Ensure file has `.tsx/.jsx/.ts/.js` extension
2. Make sure text is selected before right-clicking
3. Check you're in Extension Development Host window
4. Try Command Palette if context menu doesn't show options