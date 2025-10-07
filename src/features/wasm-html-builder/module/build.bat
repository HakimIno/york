@echo off
REM HTML Builder WASM Build Script for Windows

echo 🦀 Building HTML Builder WASM Core...

REM Check if wasm-pack is installed
where wasm-pack >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ wasm-pack is not installed. Please install it first:
    echo curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf ^| sh
    exit /b 1
)

REM Check if we're in the right directory
if not exist "Cargo.toml" (
    echo ❌ Cargo.toml not found. Please run this script from the module directory.
    exit /b 1
)

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist "pkg" rmdir /s /q pkg
if exist "target" rmdir /s /q target

REM Build the WASM package with optimizations
echo 🔨 Building WASM package with optimizations...
wasm-pack build --target web --out-dir pkg --release

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ WASM build completed successfully!
    echo 📦 Package generated in pkg/ directory
    
    REM Show package contents
    echo 📋 Package contents:
    dir pkg
    
    REM Show package size
    echo 📏 Package sizes:
    for %%f in (pkg\*.wasm) do echo %%~zf bytes - %%~nxf
    
    echo.
    echo 🚀 Ready to integrate with React!
    echo    Import with: import init, { HTMLBuilderEngine } from './pkg/html_builder_core.js'
) else (
    echo ❌ Build failed!
    exit /b 1
)
