#!/bin/bash
set -e

echo "========================================"
echo "  MCAP Build Script"
echo "========================================"
echo

# Check .env file exists
if [ ! -f .env ]; then
    echo "[!] .env file not found, copying from .env.example..."
    cp .env.example .env
    echo "    Created .env with default values. Please review and edit if needed."
    echo
fi

# Step 1: Build frontend
echo "[1/3] Building frontend..."
cd webpanel
npx vite build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed!"
    cd ..
    exit 1
fi
cd ..
echo "Frontend build complete."
echo

# Step 2: Build backend
echo "[2/3] Building backend..."
npx nest build
if [ $? -ne 0 ]; then
    echo "ERROR: Backend build failed!"
    exit 1
fi
echo "Backend build complete."
echo

# Step 3: Copy frontend dist to backend dist/public
echo "[3/3] Copying frontend to backend..."
rm -rf dist/public
cp -r webpanel/dist dist/public
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to copy frontend files!"
    exit 1
fi
echo "Copy complete."
echo

echo "========================================"
echo "  Build successful!"
echo "========================================"
echo
echo "  Output:  dist/"
echo "  Start:   node --env-file=.env dist/main.js"
echo "  URL:     http://localhost:3000 (or configured APP_URL)"
echo
