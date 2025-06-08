# Shellish 🚀

A **declarative CLI builder** for creating beautiful command-line interfaces with ease.

Shellish makes it simple to build robust, user-friendly command-line tools with a clean, declarative API. Perfect for creating CLI tools, scripts, and utilities with minimal boilerplate.

## ✨ Features

- 🎯 **Declarative API** - Define your CLI structure clearly and intuitively
- 🔧 **TypeScript Support** - Full type safety and IntelliSense
- 🚀 **Bun Optimized** - Built for Bun but works with Node.js too
- 📋 **Automatic Help** - Auto-generated help text and usage information
- ✅ **Validation** - Built-in argument validation and error handling
- 🔄 **Async Callbacks** - Support for asynchronous argument handlers
- 🎨 **Flexible Arguments** - Support for flags, single values, and multiple values
- 📦 **Zero Dependencies** - Lightweight with no external dependencies


## 📦 Installation

```bash
# Using Bun (recommended)
bun add shellish

# Using npm
npm install shellish

# Using pnpm  
pnpm add shellish
```

## 🚀 Quick Start

```typescript
import { Shellish } from 'shellish';

// Create your CLI
const cli = new Shellish({
    name: 'my-tool',
    description: 'My awesome CLI tool',
    version: '1.0.0'
});

// Add arguments
cli.addArgument({
    longName: 'verbose',
    shortName: 'v', 
    description: 'Enable verbose output',
    callback: () => console.log('Verbose mode enabled!')
});

cli.addArgument({
    longName: 'file',
    shortName: 'f',
    description: 'Input file path',
    args: 1,
    required: true,
    callback: ([filePath]) => {
        console.log(`Processing file: ${filePath}`);
    }
});

// Run the CLI
cli.run();
```

## 🔨 Build

Once you've created your CLI, you can build it into a standalone executable using Bun's built-in compiler.

### Basic Build

```bash
# Build for current platform
bun build --compile index.ts --outfile my-tool
```

### Cross-Platform Builds

Build your CLI for different operating systems and architectures:

```bash
# macOS (Apple Silicon)
bun build --compile --target bun-darwin-arm64 index.ts --outfile my-tool-macos-arm64

# macOS (Intel)
bun build --compile --target bun-darwin-x64 index.ts --outfile my-tool-macos-x64

# Linux (x64)
bun build --compile --target bun-linux-x64 index.ts --outfile my-tool-linux-x64

# Linux (ARM64)
bun build --compile --target bun-linux-arm64 index.ts --outfile my-tool-linux-arm64

# Windows (x64)
bun build --compile --target bun-windows-x64 index.ts --outfile my-tool-windows-x64.exe
```

### Build Script

Add these build commands to your `package.json` for convenience:

```json
{
  "scripts": {
    "build": "bun build --compile index.ts --outfile my-tool",
    "build:all": "bun run build:macos && bun run build:linux && bun run build:windows",
    "build:macos": "bun build --compile --target bun-darwin-arm64 index.ts --outfile dist/my-tool-macos-arm64 && bun build --compile --target bun-darwin-x64 index.ts --outfile dist/my-tool-macos-x64",
    "build:linux": "bun build --compile --target bun-linux-x64 index.ts --outfile dist/my-tool-linux-x64 && bun build --compile --target bun-linux-arm64 index.ts --outfile dist/my-tool-linux-arm64",
    "build:windows": "bun build --compile --target bun-windows-x64 index.ts --outfile dist/my-tool-windows-x64.exe"
  }
}
```

Then run:

```bash
# Build for current platform
bun run build

# Build for all platforms
bun run build:all
```

> **Note:** After building, a new executable called `my-tool` (or your specified output name) will be created in your project directory. To access your CLI globally from anywhere in your terminal, add the executable to your system's PATH or move it to a directory that's already in your PATH (like `/usr/local/bin` on macOS/Linux).

## 📖 Detailed Example

```typescript
import { Shellish } from 'shellish';

const cli = new Shellish({
    name: 'file-processor',
    description: 'A powerful file processing tool',
    version: '2.1.0',
    author: 'Your Name',
    helpText: `
Examples:
  file-processor --input data.json --output result.json --verbose
  file-processor -i *.txt -o processed/ --format csv
`
});

// Simple flag
cli.addArgument({
    longName: 'verbose',
    shortName: 'v',
    description: 'Enable verbose logging',
    callback: () => {
        console.log('🔍 Verbose mode activated');
    }
});

// Required argument with validation
cli.addArgument({
    longName: 'input',
    shortName: 'i', 
    description: 'Input file or pattern',
    args: 1,
    required: true,
    callback: ([inputPath], context) => {
        if (!inputPath.endsWith('.json')) {
            throw new Error('Input must be a JSON file');
        }
        console.log(`📁 Processing: ${inputPath}`);
    }
});

// Optional argument with default
cli.addArgument({
    longName: 'output',
    shortName: 'o',
    description: 'Output directory', 
    args: 1,
    defaultValue: './output',
    callback: ([outputPath]) => {
        console.log(`📤 Output directory: ${outputPath}`);
    }
});

// Multiple arguments
cli.addArgument({
    longName: 'exclude',
    description: 'Patterns to exclude',
    args: -1, // unlimited arguments
    callback: (patterns) => {
        console.log(`🚫 Excluding: ${patterns.join(', ')}`);
    }
});

// Argument with choices validation
cli.addArgument({
    longName: 'format',
    description: 'Output format (json, csv, xml)',
    args: 1,
    defaultValue: 'json',
    callback: ([format]) => {
        const validFormats = ['json', 'csv', 'xml'];
        if (!validFormats.includes(format)) {
            throw new Error(`Invalid format. Choose: ${validFormats.join(', ')}`);
        }
        console.log(`📄 Format: ${format}`);
    }
});

// Run the CLI
cli.run();
```

## 🔧 API Reference

### `new Shellish(options)`

Create a new Shellish CLI instance.

**Options:**
- `name` (string, required) - Name of your CLI tool
- `description` (string, required) - Description of your tool  
- `version` (string, optional) - Version string
- `author` (string, optional) - Author information
- `helpText` (string, optional) - Custom help text to display

### `cli.addArgument(options)`

Add a command-line argument.

**Options:**
- `longName` (string, required) - Long form name (e.g., `--verbose`)
- `shortName` (string, optional) - Short form name (e.g., `-v`)
- `description` (string, required) - Help text description
- `args` (number, optional) - Number of values this argument takes
  - `0` (default) - Flag argument, no values
  - `1` - Single value argument  
  - `2+` - Multiple value argument
  - `-1` - Unlimited values
- `required` (boolean, optional) - Whether argument is required
- `defaultValue` (any, optional) - Default value if not provided
- `callback` (function, required) - Function called when argument is parsed
  - Receives `(values: string[], context: ParsedContext)`

### `cli.run(args?)`

Parse and execute CLI with given arguments (defaults to `process.argv`).

### `cli.parse(args)`

Parse arguments and return result without executing callbacks.

## 🛡️ Error Handling

Shellish provides comprehensive error handling:

```typescript
// Validation errors
cli.addArgument({
    longName: 'port',
    args: 1,
    callback: ([port]) => {
        const portNum = parseInt(port);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            throw new Error('Port must be between 1 and 65535');
        }
    }
});

// Handle parsing errors
const result = await cli.parse(process.argv.slice(2));
if (!result.success) {
    console.error(`❌ ${result.error}`);
    process.exit(1);
}
```

## 🧪 Testing

```bash
# Run tests
bun test

# Run specific test file  
bun test tests/shellish.test.ts

# Watch mode
bun test --watch
```

## 📄 License

MIT © [Yash Kandalkar]

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

---

**Built with ❤️ using Bun and TypeScript**
