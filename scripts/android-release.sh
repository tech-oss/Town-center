#!/bin/sh
# Builds the Android app for Google Play: npm run release:android -- <build number>
#
# The build number must go up with every upload (Play refuses a number it has
# seen). Produces a signed .aab — the file uploaded in Play Console → Testing.
# Needs Java 21 and the Android SDK (brew openjdk@21, android-commandlinetools)
# and the upload key in ~/maidenhead-android-signing (see android/app/build.gradle).
set -e
BUILD="$1"
if [ -z "$BUILD" ]; then echo "Usage: npm run release:android -- <build number>"; exit 1; fi
VERSION_NAME="${VERSION_NAME:-1.0}"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"

if [ ! -f "$HOME/maidenhead-android-signing/key.properties" ] && [ -z "$MH_ANDROID_KEY_PROPERTIES" ]; then
  echo "The Google Play upload key isn't on this Mac (~/maidenhead-android-signing)."; exit 1
fi

# Firebase's config for this app (Firebase console → Project settings → Your
# apps → Android, package com.themaidenheadapp.app). Without it the app crashes
# when someone turns notifications on.
if [ ! -s android/app/google-services.json ]; then
  echo "android/app/google-services.json is missing (download it from the Firebase console)."; exit 1
fi

# The same web build the iPhone app uses.
npm run build:native-web
npx cap sync android

cd android
./gradlew --quiet bundleRelease -PversionCode="$BUILD" -PversionName="$VERSION_NAME"
cd ..

OUT="android/release"
mkdir -p "$OUT"
cp android/app/build/outputs/bundle/release/app-release.aab "$OUT/maidenhead-$BUILD.aab"
echo ""
echo "Built Android build $BUILD ($VERSION_NAME): $OUT/maidenhead-$BUILD.aab"
echo "Upload it in Google Play Console → Testing → Internal testing → Create new release."
