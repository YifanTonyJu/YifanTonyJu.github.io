#!/bin/bash

# Manual script to update version numbers for cache busting
# Usage: bash update-version.sh

COMMIT_COUNT=$(git rev-list --count HEAD)

echo "📝 Updating version to: $COMMIT_COUNT"

# Update CSS version
sed -i '' "s/styles\.css?v=[0-9]*/styles.css?v=$COMMIT_COUNT/g" index.html
echo "✅ CSS version updated"

# Update JS version
sed -i '' "s/yj-assistant\.js?v=[0-9]*/yj-assistant.js?v=$COMMIT_COUNT/g" index.html
echo "✅ JS version updated"

echo ""
echo "Changes made:"
git diff index.html
