#!/usr/bin/env node

/**
 * Cross-platform build script for HTML Builder WASM
 * Automatically detects platform and runs appropriate build command
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getPlatform() {
  const platform = os.platform();
  const arch = os.arch();
  
  if (platform === 'win32') {
    return 'windows';
  } else if (platform === 'darwin') {
    return arch === 'arm64' ? 'macos-arm' : 'macos-intel';
  } else if (platform === 'linux') {
    return 'linux';
  }
  
  return 'unknown';
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'cyan');
  
  const platform = getPlatform();
  const checks = [];
  
  // Check Rust
  try {
    execSync('rustc --version', { stdio: 'pipe' });
    log('✅ Rust is installed', 'green');
  } catch (error) {
    log('❌ Rust is not installed', 'red');
    checks.push('rust');
  }
  
  // Check wasm-pack
  try {
    execSync('wasm-pack --version', { stdio: 'pipe' });
    log('✅ wasm-pack is installed', 'green');
  } catch (error) {
    log('❌ wasm-pack is not installed', 'red');
    checks.push('wasm-pack');
  }
  
  // Check wasm32 target
  try {
    execSync('rustup target list --installed | grep wasm32-unknown-unknown', { stdio: 'pipe' });
    log('✅ wasm32-unknown-unknown target is installed', 'green');
  } catch (error) {
    log('❌ wasm32-unknown-unknown target is not installed', 'red');
    checks.push('wasm32-target');
  }
  
  if (checks.length > 0) {
    log('\n📋 Missing prerequisites:', 'yellow');
    checks.forEach(check => {
      switch (check) {
        case 'rust':
          log('  - Install Rust: curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh', 'yellow');
          break;
        case 'wasm-pack':
          log('  - Install wasm-pack: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh', 'yellow');
          break;
        case 'wasm32-target':
          log('  - Add wasm32 target: rustup target add wasm32-unknown-unknown', 'yellow');
          break;
      }
    });
    return false;
  }
  
  return true;
}

function runBuild() {
  const platform = getPlatform();
  log(`🦀 Building for platform: ${platform}`, 'cyan');
  
  let buildCommand;
  let buildArgs = [];
  
  switch (platform) {
    case 'windows':
      if (fs.existsSync('build.bat')) {
        buildCommand = 'build.bat';
      } else if (fs.existsSync('build.ps1')) {
        buildCommand = 'powershell';
        buildArgs = ['-ExecutionPolicy', 'Bypass', '-File', 'build.ps1'];
      } else {
        log('❌ No Windows build script found', 'red');
        return false;
      }
      break;
      
    case 'macos-arm':
    case 'macos-intel':
    case 'linux':
      if (fs.existsSync('build.sh')) {
        // Make script executable
        try {
          fs.chmodSync('build.sh', '755');
        } catch (error) {
          log('⚠️  Could not make build.sh executable, trying anyway...', 'yellow');
        }
        buildCommand = './build.sh';
      } else {
        log('❌ No Unix build script found', 'red');
        return false;
      }
      break;
      
    default:
      log('❌ Unsupported platform', 'red');
      return false;
  }
  
  try {
    log(`🔨 Running: ${buildCommand} ${buildArgs.join(' ')}`, 'blue');
    execSync(`${buildCommand} ${buildArgs.join(' ')}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    return true;
  } catch (error) {
    log('❌ Build failed', 'red');
    return false;
  }
}

function validateBuild() {
  log('🔍 Validating build output...', 'cyan');
  
  const requiredFiles = [
    'pkg/html_builder_core_bg.wasm',  // wasm-pack creates _bg.wasm file
    'pkg/html_builder_core.js',
    'pkg/html_builder_core.d.ts',
    'pkg/package.json'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    log('❌ Missing required files:', 'red');
    missingFiles.forEach(file => log(`  - ${file}`, 'red'));
    return false;
  }
  
  // Check file sizes
  const wasmFile = 'pkg/html_builder_core_bg.wasm';
  if (fs.existsSync(wasmFile)) {
    const stats = fs.statSync(wasmFile);
    const sizeKB = Math.round(stats.size / 1024);
    log(`📏 WASM file size: ${sizeKB} KB`, 'green');
    
    if (sizeKB > 1000) {
      log('⚠️  WASM file is quite large, consider optimization', 'yellow');
    }
  }
  
  log('✅ Build validation passed', 'green');
  return true;
}

function showUsage() {
  log('📚 Usage:', 'cyan');
  log('  node build.js [options]', 'white');
  log('', 'white');
  log('Options:', 'cyan');
  log('  --check-only    Only check prerequisites, don\'t build', 'white');
  log('  --help          Show this help message', 'white');
  log('', 'white');
  log('Examples:', 'cyan');
  log('  node build.js              # Build for current platform', 'white');
  log('  node build.js --check-only # Check prerequisites only', 'white');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showUsage();
    return;
  }
  
  log('🚀 HTML Builder WASM - Cross-Platform Build Script', 'bright');
  log('================================================', 'bright');
  
  if (!checkPrerequisites()) {
    if (args.includes('--check-only')) {
      log('\n❌ Prerequisites check failed', 'red');
      process.exit(1);
    }
    
    log('\n❌ Cannot proceed without prerequisites', 'red');
    process.exit(1);
  }
  
  if (args.includes('--check-only')) {
    log('\n✅ All prerequisites satisfied', 'green');
    return;
  }
  
  log('\n🔨 Starting build process...', 'cyan');
  
  if (!runBuild()) {
    log('\n❌ Build failed', 'red');
    process.exit(1);
  }
  
  if (!validateBuild()) {
    log('\n❌ Build validation failed', 'red');
    process.exit(1);
  }
  
  log('\n🎉 Build completed successfully!', 'green');
  log('📦 WASM package is ready in pkg/ directory', 'cyan');
  log('🚀 Ready to integrate with your React/Next.js app!', 'green');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  getPlatform,
  checkPrerequisites,
  runBuild,
  validateBuild
};
