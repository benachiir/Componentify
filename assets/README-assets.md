# Assets for README.md

This folder contains placeholder references for screenshots and GIFs that should be created for the README.md file.

## Required Assets

### Screenshots
- `demo.gif` - Main demo showing the extension in action
- `quick-start.png` - Quick start overview screenshot
- `context-menu.png` - Right-click context menu showing extraction options
- `auto-detect.png` - Auto-detection feature explanation
- `typescript-support.png` - TypeScript integration showcase
- `file-structure.png` - Generated file organization

### GIFs/Videos
- `component-extraction.gif` - Step-by-step component extraction process
- `hook-extraction.gif` - Step-by-step hook extraction process
- `component-flow.gif` - Complete component extraction workflow
- `hook-flow.gif` - Complete hook extraction workflow

## How to Create These Assets

1. **Install the extension** in VSCode
2. **Create a sample React project** with some JSX and hook code
3. **Record screen captures** using tools like:
   - [LICEcap](https://www.cockos.com/licecap/) (Free, cross-platform)
   - [Kap](https://getkap.co/) (Free, macOS)
   - [ScreenToGif](https://www.screentogif.com/) (Free, Windows)
   - [Peek](https://github.com/phw/peek) (Free, Linux)

4. **Take screenshots** of:
   - Context menu with extension options
   - Before/after code comparisons
   - File explorer showing generated structure
   - TypeScript interfaces being created

5. **Optimize file sizes**:
   - Keep GIFs under 10MB for GitHub
   - Use appropriate compression
   - Ensure text is readable

## Sample Code for Demos

### For Component Extraction Demo
```jsx
function App() {
  const user = { name: "John Doe", email: "john@example.com", avatar: "/avatar.jpg" };
  
  return (
    <div>
      <div className="user-card">
        <img src={user.avatar} alt={user.name} />
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    </div>
  );
}
```

### For Hook Extraction Demo
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setCount(c => c + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}
```

## Asset Guidelines

- **Consistent styling**: Use the same VSCode theme across all screenshots
- **Clear visibility**: Ensure code and UI elements are clearly visible
- **Appropriate timing**: GIFs should be 3-10 seconds long
- **Professional quality**: Clean, well-cropped images
- **Accessibility**: Include alt text descriptions in README