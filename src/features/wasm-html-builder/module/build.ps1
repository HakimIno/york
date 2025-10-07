# HTML Builder WASM Build Script for Windows PowerShell

Write-Host "🦀 Building HTML Builder WASM Core..." -ForegroundColor Cyan

# Check if wasm-pack is installed
try {
    $null = Get-Command wasm-pack -ErrorAction Stop
} catch {
    Write-Host "❌ wasm-pack is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "Cargo.toml")) {
    Write-Host "❌ Cargo.toml not found. Please run this script from the module directory." -ForegroundColor Red
    exit 1
}

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "pkg") { Remove-Item -Recurse -Force "pkg" }
if (Test-Path "target") { Remove-Item -Recurse -Force "target" }

# Build the WASM package with optimizations
Write-Host "🔨 Building WASM package with optimizations..." -ForegroundColor Green
$buildResult = & wasm-pack build --target web --out-dir pkg --release

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ WASM build completed successfully!" -ForegroundColor Green
    Write-Host "📦 Package generated in pkg/ directory" -ForegroundColor Cyan
    
    # Show package contents
    Write-Host "📋 Package contents:" -ForegroundColor Cyan
    Get-ChildItem pkg | Format-Table Name, Length, LastWriteTime
    
    # Show package size
    Write-Host "📏 Package sizes:" -ForegroundColor Cyan
    Get-ChildItem pkg\*.wasm | ForEach-Object {
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Host "$($_.Name): $sizeKB KB" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "🚀 Ready to integrate with React!" -ForegroundColor Green
    Write-Host "   Import with: import init, { HTMLBuilderEngine } from './pkg/html_builder_core.js'" -ForegroundColor Yellow
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
