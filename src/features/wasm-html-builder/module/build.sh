#!/bin/bash

# HTML Builder WASM Build Script

set -e

echo "🦀 Building HTML Builder WASM Core..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed. Please install it first:"
    echo "curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Cargo.toml not found. Please run this script from the module directory."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf pkg/
rm -rf target/

# Build the WASM package with optimizations
echo "🔨 Building WASM package with optimizations..."
wasm-pack build --target web --out-dir pkg --release

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ WASM build completed successfully!"
    echo "📦 Package generated in pkg/ directory"
    
    # Show package contents
    echo "📋 Package contents:"
    ls -la pkg/
    
    # Show package size
    echo "📏 Package sizes:"
    du -h pkg/*.wasm
    
    echo ""
    echo "🚀 Ready to integrate with React!"
    echo "   Import with: import init, { HTMLBuilderEngine } from './pkg/html_builder_core.js'"
else
    echo "❌ Build failed!"
    exit 1
fi
