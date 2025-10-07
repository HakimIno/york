#!/bin/bash

# Build script for pivot table WASM module

echo "Building pivot table WASM module..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM module
echo "Compiling Rust to WASM..."
wasm-pack build --target web --out-dir pkg --dev

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ WASM build successful!"
    echo "Generated files in pkg/:"
    ls -la pkg/
else
    echo "❌ WASM build failed!"
    exit 1
fi

echo "Build complete!"
