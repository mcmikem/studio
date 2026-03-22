#!/bin/bash
# Build Omuto Central TWA (Trusted Web Activity) APK
# 
# Prerequisites:
#   1. Android SDK installed (ANDROID_HOME or ANDROID_SDK_ROOT set)
#   2. Java 17+ installed
#   3. Your Vercel URL (e.g. omuto-central-studio.vercel.app)
#
# Usage:
#   ./build-twa.sh https://your-site.vercel.app
#
# The APK will be output at: android/app/build/outputs/apk/debug/app-debug.apk

set -e

SITE_URL="$1"

if [ -z "$SITE_URL" ]; then
  echo "Usage: ./build-twa.sh <your-vercel-url>"
  echo ""
  echo "Example: ./build-twa.sh omuto-central-studio.vercel.app"
  echo ""
  echo "You can find your Vercel URL at: https://vercel.com/dashboard"
  exit 1
fi

# Strip https:// if user included it
SITE_URL=$(echo "$SITE_URL" | sed 's|https://||' | sed 's|http://||' | sed 's|/$||')

echo "Building TWA for: $SITE_URL"

# Update twa-manifest.json with the correct URL
cat > twa-manifest.json << EOF
{
  "packageName": "com.omuto.central",
  "host": "$SITE_URL",
  "name": "Omuto Central",
  "shortName": "Omuto",
  "iconUrl": "https://$SITE_URL/icon-512x512.png",
  "maskableIconUrl": "https://$SITE_URL/icon-512x512.png",
  "launchWebField": "standalone",
  "themeColor": "#991B1B",
  "backgroundColor": "#F9F7F0",
  "enableNotifications": true
}
EOF

echo "✓ Updated twa-manifest.json"

# Update strings.xml asset_statements
cat > android/app/src/main/res/values/strings.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Omuto</string>
    <string name="asset_statements">[
        {
            \"relation\": [\"delegate_permission/common.query_webapks\"],
            \"service\": {
                \"packageName\": \"com.google.androidbrowserhelper\",
                \"version\": {
                    \"major\": 2,
                    \"minor\": 0,
                    \"major\": 3858
                }
            }
        }
    ]</string>
</resources>
EOF

echo "✓ Updated strings.xml"

# Generate gradle wrapper if not exists
if [ ! -f "android/gradlew" ]; then
  echo "Generating Gradle wrapper..."
  cd android && gradle wrapper --gradle-version 8.5 && cd ..
  echo "✓ Generated Gradle wrapper"
fi

# Build debug APK
echo ""
echo "Building debug APK..."
cd android
./gradlew assembleDebug --no-daemon --warning-mode all
cd ..

APK="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  SIZE=$(du -h "$APK" | cut -f1)
  echo ""
  echo "=============================================="
  echo "✓ APK built successfully!"
  echo "   Location: $APK"
  echo "   Size: $SIZE"
  echo "=============================================="
  echo ""
  echo "To install on a connected device:"
  echo "  adb install $APK"
  echo ""
  echo "To get the APK off the machine:"
  echo "  adb pull $APK"
  echo ""
else
  echo "✗ APK build failed. Check errors above."
  exit 1
fi
