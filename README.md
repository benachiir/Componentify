# React Extractor

> 🚀 **Supercharge your React development** - Extract selected code into reusable components and custom hooks with zero configuration.

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://marketplace.visualstudio.com/items?itemName=react-extractor)
[![Downloads](https://img.shields.io/badge/downloads-0-green.svg)](https://marketplace.visualstudio.com/items?itemName=react-extractor)
[![Rating](https://img.shields.io/badge/rating-★★★★★-yellow.svg)](https://marketplace.visualstudio.com/items?itemName=react-extractor)

React Extractor is a powerful VSCode extension that intelligently transforms selected code into reusable React components or custom hooks. Say goodbye to manual refactoring and hello to clean, maintainable code architecture.

![React Extractor Demo](./assets/demo.gif)

## ✨ Features

### 🎯 Smart Auto-Detection
- **Intelligent Analysis**: Automatically determines whether to extract as a component or hook
- **JSX Recognition**: Detects React elements, components, and JSX patterns
- **Hook Detection**: Identifies React hook usage patterns (`useState`, `useEffect`, etc.)
- **Context Awareness**: Understands your code structure and makes smart decisions

### 🔧 Three Powerful Commands
| Command | Description | Use Case |
|---------|-------------|----------|
| **Extract React Component** | Converts JSX into reusable components | When you have repetitive UI patterns |
| **Extract React Hook** | Transforms hook logic into custom hooks | When you have reusable stateful logic |
| **Extract React (Auto Detect)** | Smart extraction based on code analysis | When you want the extension to decide |

### 📁 Organized File Management
- 📂 Components → `/components` directory
- 🪝 Hooks → `/hooks` directory  
- 🛡️ Collision protection with user confirmation
- 📝 Auto-creates directories if they don't exist
- 🎯 Smart file naming with proper extensions

### 🎨 Advanced Code Generation
- **TypeScript First**: Full TypeScript support with proper type generation
- **Props Intelligence**: Automatically detects and creates Props interfaces
- **Hook Returns**: Smart detection of return values from custom hooks
- **Naming Conventions**: Enforces PascalCase for components, camelCase for hooks
- **Code Formatting**: Integrates with Prettier and ESLint for consistent styling

## 📦 Installation

### From VSCode Marketplace
1. Open VSCode
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "React Extractor"
4. Click **Install**

### From VSIX Package
1. Download the `.vsix` file from releases
2. Open VSCode
3. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
4. Type "Extensions: Install from VSIX"
5. Select the downloaded file

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/your-username/react-extractor.git
cd react-extractor

# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension (optional)
npm install -g vsce
vsce package
```

## 🚀 Quick Start

![Quick Start](./assets/quick-start.png)

1. **Open a React project** in VSCode
2. **Select some JSX or hook code**
3. **Right-click** → Choose extraction method
4. **Enter a name** when prompted
5. **Done!** Your code is now extracted and organized

## 📖 Usage Guide

### 🎨 Extract React Component

Perfect for turning repetitive JSX into reusable components.

![Component Extraction](./assets/component-extraction.gif)

**Step-by-step:**
1. Select JSX code in your editor
2. Right-click → "Extract React Component" (or `Ctrl+Shift+P` → "Extract React Component")
3. Enter component name in PascalCase (e.g., `UserCard`, `ProductList`)
4. ✨ Magic happens!

**Before:**
```jsx
function UserProfile() {
  return (
    <div>
      <div className="user-card">
        <img src={user.avatar} alt={user.name} />
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <span className="badge">{user.role}</span>
      </div>
    </div>
  );
}
```

**After extraction:**
```jsx
// components/UserCard.tsx
import React from 'react';

type Props = {
  user: any;
};

export const UserCard: React.FC<Props> = ({ user }) => {
  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <span className="badge">{user.role}</span>
    </div>
  );
};

// Original file
function UserProfile() {
  return (
    <div>
      <UserCard user={user} />
    </div>
  );
}
```

### 🪝 Extract React Hook

Transform stateful logic into reusable custom hooks.

![Hook Extraction](./assets/hook-extraction.gif)

**Step-by-step:**
1. Select hook logic (`useState`, `useEffect`, etc.)
2. Right-click → "Extract React Hook"
3. Enter hook name starting with "use" (e.g., `useCounter`, `useToggle`)
4. 🎉 Reusable hook created!

**Before:**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setCount(count => count + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setCount(0);
    setIsRunning(false);
  };

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={toggle}>{isRunning ? 'Pause' : 'Start'}</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

**After extraction:**
```jsx
// hooks/useCounter.ts
import { useState, useEffect } from 'react';

export const useCounter = () => {
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setCount(count => count + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setCount(0);
    setIsRunning(false);
  };

  return {
    count,
    isRunning,
    toggle,
    reset,
  };
};

// Original file
function Counter() {
  const { count, isRunning, toggle, reset } = useCounter();

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={toggle}>{isRunning ? 'Pause' : 'Start'}</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 🤖 Auto Detect (Recommended)

Let the extension decide what's best for your code.

![Auto Detection](./assets/auto-detect.png)

**How it works:**
- **JSX detected** → Extracts as Component
- **Hooks detected** → Extracts as Hook  
- **Both/Neither** → Shows helpful error message

**Usage:**
1. Select any React code
2. Right-click → "Extract React (Auto Detect)"
3. The extension analyzes and chooses the best extraction method
4. Follow the prompts for naming

## 🎯 Advanced Features

### TypeScript Support
- Automatic type generation for Props interfaces
- Smart type inference from JSX variables
- Full TypeScript compatibility

### Code Quality Integration
- **Prettier**: Automatic code formatting
- **ESLint**: Linting and auto-fixing
- **Consistent Style**: Follows React best practices

### Smart Prop Detection
The extension analyzes your JSX and automatically creates proper Props interfaces:

```jsx
// This JSX:
<div className={styles.card} onClick={handleClick}>
  <h2>{title}</h2>
  <p>{description}</p>
  {isActive && <Badge type={badgeType} />}
</div>

// Generates this Props interface:
type Props = {
  styles: any;
  handleClick: any;
  title: any;
  description: any;
  isActive: any;
  badgeType: any;
};
```

## 🎮 Keyboard Shortcuts

| Action | Shortcut | Alternative |
|--------|----------|-------------|
| Extract React (Auto) | `Ctrl+Shift+E` | Right-click menu |
| Extract Component | `Ctrl+Shift+C` | Command Palette |
| Extract Hook | `Ctrl+Shift+H` | Command Palette |

## 📋 Requirements

- **VSCode**: 1.74.0 or higher
- **File Types**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Optional**: Prettier & ESLint for code formatting

## ⚙️ Configuration

The extension works out of the box with zero configuration. However, you can customize the behavior:

### Workspace Settings
```json
{
  "reactExtractor.autoFormat": true,
  "reactExtractor.componentDirectory": "components",
  "reactExtractor.hookDirectory": "hooks",
  "reactExtractor.useTypeScript": "auto"
}
```

### Project Structure
The extension automatically creates this structure:
```
your-project/
├── components/
│   ├── UserCard.tsx
│   ├── ProductList.tsx
│   └── ...
├── hooks/
│   ├── useCounter.ts
│   ├── useToggle.ts
│   └── ...
└── src/
    └── your-existing-files
```

## 🔧 Development & Contributing

### Setup Development Environment
```bash
# Clone the repository
git clone https://github.com/your-username/react-extractor.git
cd react-extractor

# Install dependencies
npm install

# Start development
npm run watch
```

### Testing the Extension
1. Press `F5` to launch Extension Development Host
2. Open a React project in the new window
3. Test extraction features with sample code

### Building for Production
```bash
# Compile TypeScript
npm run compile

# Package extension
npm install -g vsce
vsce package

# Publish to marketplace
vsce publish
```

## 🐛 Troubleshooting

### Common Issues

**Q: Extension not appearing in context menu**
- Ensure you're in a `.js`, `.jsx`, `.ts`, or `.tsx` file
- Make sure you have text selected
- Try reloading VSCode window

**Q: Generated files not formatted properly**
- Install Prettier and ESLint in your project
- Check that your project has proper configuration files

**Q: Props not detected correctly**
- The extension uses AST parsing with regex fallback
- Complex expressions might need manual adjustment
- Report issues for improvement

**Q: Hook extraction not working**
- Ensure selected code contains React hooks (`useState`, `useEffect`, etc.)
- Hook names must start with "use" followed by PascalCase

### Getting Help
- 📖 [Documentation](https://github.com/your-username/react-extractor/wiki)
- 🐛 [Report Issues](https://github.com/your-username/react-extractor/issues)
- 💬 [Discussions](https://github.com/your-username/react-extractor/discussions)

## 📊 Examples & Screenshots

### Context Menu Integration
![Context Menu](./assets/context-menu.png)

### Component Extraction Flow
![Component Flow](./assets/component-flow.gif)

### Hook Extraction Flow  
![Hook Flow](./assets/hook-flow.gif)

### TypeScript Support
![TypeScript](./assets/typescript-support.png)

### File Organization
![File Structure](./assets/file-structure.png)

## 🚀 Roadmap

- [ ] **Enhanced Type Detection**: Better TypeScript type inference
- [ ] **Custom Templates**: User-defined component/hook templates
- [ ] **Batch Extraction**: Extract multiple components at once
- [ ] **Import Management**: Smart import organization
- [ ] **Refactoring Tools**: Additional React refactoring utilities
- [ ] **Testing Integration**: Generate test files alongside components

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- VSCode team for the excellent extension API
- Babel team for AST parsing capabilities
- Community contributors and feedback

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/your-username/react-extractor?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/react-extractor?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/react-extractor)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/react-extractor)

---

**Made with ❤️ for the React community**

*Happy coding! 🚀*