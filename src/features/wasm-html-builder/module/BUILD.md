# HTML Builder WASM - Build Instructions

## 🚀 Quick Start

### Prerequisites

1. **Rust** (latest stable version)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **wasm-pack** (WASM build tool)
   ```bash
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   ```

3. **Node.js** (for development)
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install node
   ```

## 🛠️ Build Commands

### Local Development

#### macOS / Linux
```bash
cd src/components/features/wasm-html-builder/module
chmod +x build.sh
./build.sh
```

#### Windows (Command Prompt)
```cmd
cd src\components\features\wasm-html-builder\module
build.bat
```

#### Windows (PowerShell)
```powershell
cd src\components\features\wasm-html-builder\module
.\build.ps1
```

### Docker Build (Cross-Platform)

```bash
# Build Docker image
docker build -t html-builder-wasm .

# Run with Docker Compose
docker-compose up wasm-builder

# Development mode with hot reload
docker-compose up wasm-dev
```

## 📦 Build Output

After successful build, you'll find these files in the `pkg/` directory:

- `html_builder_core.wasm` - The compiled WASM binary
- `html_builder_core.js` - JavaScript bindings
- `html_builder_core.d.ts` - TypeScript definitions
- `html_builder_core_bg.wasm.d.ts` - Background WASM types
- `package.json` - Package metadata

## 🔧 Integration

### In React/Next.js

```typescript
import init, { HTMLBuilderEngine } from './pkg/html_builder_core.js';

// Initialize WASM
await init();

// Create engine instance
const engine = new HTMLBuilderEngine();

// Use the engine
const element = engine.create_element('text', 100, 100);
```

### In HTML

```html
<script type="module">
  import init, { HTMLBuilderEngine } from './pkg/html_builder_core.js';
  
  async function run() {
    await init();
    const engine = new HTMLBuilderEngine();
    // Use engine...
  }
  
  run();
</script>
```

## 🌐 Cross-Platform Support

### Supported Platforms

- ✅ **Windows** (x64, ARM64)
- ✅ **macOS** (Intel x64, Apple Silicon M1/M2)
- ✅ **Linux** (x64, ARM64)

### Platform-Specific Notes

#### Windows
- Use `build.bat` for Command Prompt
- Use `build.ps1` for PowerShell
- Ensure Windows Defender doesn't block WASM files

#### macOS
- Works on both Intel and Apple Silicon
- May need to allow execution: `chmod +x build.sh`

#### Linux
- Tested on Ubuntu, Debian, CentOS
- May need additional packages: `build-essential`, `curl`

## 🚀 CI/CD Integration

### GitHub Actions

The project includes automated builds via GitHub Actions:

- **Triggers**: Push to `main`/`develop`, Pull Requests
- **Platforms**: Ubuntu, Windows, macOS
- **Artifacts**: Platform-specific WASM builds
- **Deployment**: Automatic GitHub Pages deployment

### Manual Release

```bash
# Create a new tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically create a release
```

## 🔍 Troubleshooting

### Common Issues

#### 1. wasm-pack not found
```bash
# Reinstall wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
source ~/.cargo/env
```

#### 2. Rust target not installed
```bash
rustup target add wasm32-unknown-unknown
```

#### 3. Build fails on Windows
```bash
# Install Visual Studio Build Tools
# Or use Windows Subsystem for Linux (WSL)
```

#### 4. Docker build fails
```bash
# Ensure Docker is running
docker --version

# Clean Docker cache
docker system prune -a
```

### Performance Optimization

#### Release Build
```bash
# Already optimized in build scripts
wasm-pack build --target web --out-dir pkg --release
```

#### Size Optimization
```bash
# Install wasm-opt for additional optimization
npm install -g binaryen
wasm-opt -Oz pkg/html_builder_core_bg.wasm -o pkg/html_builder_core_bg.wasm
```

## 📊 Build Statistics

Typical build output sizes:
- **WASM Binary**: ~50-100KB (gzipped: ~20-40KB)
- **JavaScript Bindings**: ~10-20KB
- **Total Package**: ~60-120KB

## 🔄 Development Workflow

1. **Make changes** to Rust code in `src/`
2. **Build** using appropriate script for your platform
3. **Test** in browser/React app
4. **Commit** changes to git
5. **Push** to trigger CI/CD pipeline

## 📚 Additional Resources

- [Rust WASM Book](https://rustwasm.github.io/docs/book/)
- [wasm-pack Documentation](https://rustwasm.github.io/wasm-pack/)
- [WebAssembly MDN](https://developer.mozilla.org/en-US/docs/WebAssembly)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple platforms
5. Submit a pull request

The CI/CD pipeline will automatically test your changes on Windows, macOS, and Linux.
