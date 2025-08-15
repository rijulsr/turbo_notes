#!/bin/bash

# Turbo Notes Build Status Checker
# This script helps you monitor your GitHub Actions builds

echo "🚀 Turbo Notes Build Status Checker"
echo "=================================="
echo

# Repository info
REPO="rijulsr/turbo_notes"
API_URL="https://api.github.com/repos/$REPO"

echo "📋 Repository: $REPO"
echo "🔗 Actions URL: https://github.com/$REPO/actions"
echo "🔗 Releases URL: https://github.com/$REPO/releases"
echo

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl is not installed. Please install curl to use this script."
    exit 1
fi

echo "🔍 Fetching latest workflow runs..."
echo

# Get latest workflow runs
RESPONSE=$(curl -s "$API_URL/actions/runs?per_page=5")

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch workflow runs. Check your internet connection."
    exit 1
fi

# Parse and display workflow runs (simplified)
echo "📊 Latest Workflow Runs:"
echo "========================"

# Extract basic info using grep and sed (works without jq)
echo "$RESPONSE" | grep -o '"status":"[^"]*"' | head -5 | sed 's/"status":"//;s/"//g' | nl -w2 -s". Status: "
echo

echo "🎯 What to look for:"
echo "  • completed + success = ✅ Build successful"
echo "  • in_progress = 🔄 Build running"  
echo "  • completed + failure = ❌ Build failed"
echo

echo "📱 How to download APK:"
echo "1. Visit: https://github.com/$REPO/actions"
echo "2. Click on the latest 'completed' run"
echo "3. Scroll to 'Artifacts' section"
echo "4. Download the APK file(s)"
echo

echo "🏷️ Or check releases:"
echo "Visit: https://github.com/$REPO/releases"
echo

echo "⏰ Builds typically take 5-10 minutes to complete."
echo "✨ Refresh this script or check GitHub directly for updates!"
