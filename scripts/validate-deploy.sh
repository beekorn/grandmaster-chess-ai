#!/bin/bash
# Pre-deploy validation script - catches common Vercel deployment issues
set -e

echo "🔍 Validating deployment readiness..."

# 1. Check for duplicate file extensions (.js/.ts, .jsx/.tsx)
echo "1️⃣  Checking for duplicate file extensions..."
DUPES=$(find src -type f \( -name "*.js" -o -name "*.jsx" \) 2>/dev/null)
if [ -n "$DUPES" ]; then
  echo "❌ FOUND duplicate .js/.jsx files alongside .ts/.tsx:"
  echo "$DUPES"
  echo "   → Delete .js/.jsx files, keep only .ts/.tsx"
  exit 1
fi
echo "✅ No duplicate extensions"

# 2. Verify index.html script type
echo "2️⃣  Checking index.html script tags..."
if grep -q 'type="text/babel"' index.html; then
  echo "❌ index.html uses type=\"text/babel\" — Vite can't bundle this"
  echo "   → Change to type=\"module\""
  exit 1
fi
if ! grep -q 'type="module"' index.html; then
  echo "❌ index.html missing type=\"module\" on main script"
  exit 1
fi
echo "✅ Script types correct"

# 3. Run TypeScript check
echo "3️⃣  Running TypeScript compilation check..."
if ! npx tsc --noEmit 2>&1; then
  echo "❌ TypeScript errors found"
  exit 1
fi
echo "✅ TypeScript clean"

# 4. Run Vite build locally
echo "4️⃣  Testing local build..."
if ! npm run build 2>&1; then
  echo "❌ Local build failed"
  exit 1
fi
echo "✅ Build successful"

# 5. Verify build output has expected files
echo "5️⃣  Checking build output..."
if [ ! -f "dist/index.html" ]; then
  echo "❌ dist/index.html missing"
  exit 1
fi
if [ ! -d "dist/assets" ]; then
  echo "❌ dist/assets/ missing"
  exit 1
fi
echo "✅ Build output valid"

echo ""
echo "🎉 All checks passed! Safe to deploy to Vercel."
