# Multi-stage Dockerfile for cross-platform WASM builds
FROM rust:1.75-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
ENV PATH="/root/.cargo/bin:${PATH}"

# Add wasm32 target
RUN rustup target add wasm32-unknown-unknown

# Set working directory
WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src

# Build the WASM package
RUN wasm-pack build --target web --out-dir pkg --release

# Production stage
FROM nginx:alpine

# Copy built WASM files
COPY --from=builder /app/pkg /usr/share/nginx/html/pkg

# Copy any additional static files if needed
COPY --from=builder /app/README.md /usr/share/nginx/html/

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
