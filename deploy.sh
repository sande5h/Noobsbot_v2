#!/bin/bash
set -e

echo "Building..."
npm run build

echo "Copying static assets into standalone..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "Bundling DB schema + setup scripts..."
cp -r db .next/standalone/db
cp -r scripts .next/standalone/scripts

echo "Creating deploy.zip..."
cd .next/standalone
zip -r ../../deploy.zip . --exclude "*.DS_Store"
cd ../..

echo ""
echo "Done. Upload deploy.zip to DirectAdmin."
echo "  - Startup file: server.js"
echo "  - No npm install needed (node_modules are bundled)"
