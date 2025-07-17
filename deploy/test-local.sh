#!/bin/bash

# Local Docker Test Script for Bybit Analyzer
# This script tests the Docker build and runs the app locally

set -e

echo "🧪 Testing Docker build locally..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t bybit-analyzer:test .

# Test the build
echo "✅ Docker build successful!"

# Optional: Run locally with docker-compose
echo ""
echo "🚀 To run locally with docker-compose:"
echo "   docker-compose up --build"
echo ""
echo "🌐 App will be available at: http://localhost:3000"
echo "🔍 Health check: http://localhost:3000/api/health"
echo ""
echo "🛑 To stop: docker-compose down" 