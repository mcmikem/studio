#!/bin/bash
# Build Omuto Central TWA (Trusted Web Activity) APK
#
# PREREQUISITES (install these first):
#   1. Java 17+  — brew install openjdk@17 (macOS) or sdk install java 17.0.9-tem (Linux)
#   2. Android SDK — https://developer.android.com/studio (download command line tools)
#   3. Set environment:
#        export ANDROID_HOME=~/Android/Sdk        # Linux/macOS
#        export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
#   4. Accept licenses: yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
#
# USAGE:
#   ./build-twa.sh central.omuto.org
#
# The APK will be output at: android/app/build/outputs/apk/debug/app-debug.apk

set -e

check_prereqs() {
  if ! command -v java &> /dev/null; then
    echo "✗ Java not found. Install Java 17+ first: brew install openjdk@17"
    exit 1
  fi
  if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "✗ Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT."
    echo "  Example: export ANDROID_HOME=~/Android/Sdk"
    exit 1
  fi
  echo "✓ Java: $(java -version 2>&1 | head -1)"
  echo "✓ Android SDK: ${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
}

check_prereqs

SITE_URL="$1"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

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
cat > "$SCRIPT_DIR/twa-manifest.json" << EOF
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

# Update strings.xml asset_statements (TWA Digital Asset Links)
cat > "$SCRIPT_DIR/android/app/src/main/res/values/strings.xml" << 'EOFSTRINGS'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Omuto</string>
    <string name="asset_statements">[{\"relation\":[\"delegate_permission/common.query_webapks\"],\"service\":{\"packageName\":\"com.google.androidbrowserhelper\",\"version\":{\"major\":2,\"minor\":4,\"max\":3858}}}]</string>
</resources>
EOFSTRINGS

echo "✓ Updated strings.xml"

# Generate gradle wrapper if not exists
if [ ! -f "$SCRIPT_DIR/android/gradlew" ]; then
  echo "Generating Gradle wrapper..."
  cd "$SCRIPT_DIR/android" && "$SDK_DIR/gradle-8.5/bin/gradle" wrapper --gradle-version 8.5
  echo "✓ Generated Gradle wrapper"
fi

# Build debug APK
echo ""
echo "Building debug APK..."
cd "$SCRIPT_DIR/android"
./gradlew assembleDebug --no-daemon --warning-mode all

APK="$SCRIPT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
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
