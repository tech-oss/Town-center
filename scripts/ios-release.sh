#!/bin/sh
# Builds the iPhone app and uploads it to App Store Connect ("The Maidenhead
# App"), signed by the Apple account signed in to Xcode. Each upload needs a
# new build number: pass one, e.g.  npm run release:ios -- 2
set -e
BUILD="$1"
[ -n "$BUILD" ] || { echo "Give a new build number, e.g. npm run release:ios -- 2"; exit 1; }

npm run build:ios
cd ios/App
sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9]*;/CURRENT_PROJECT_VERSION = $BUILD;/" App.xcodeproj/project.pbxproj
rm -rf build/Maidenhead.xcarchive build/upload

# Archived unsigned (the team has no registered test iPhones, so there's no
# development profile), then given a local signature that carries the push
# entitlement; Xcode signs it for the App Store during the upload.
xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/Maidenhead.xcarchive CODE_SIGNING_ALLOWED=NO archive -quiet
APP=build/Maidenhead.xcarchive/Products/Applications/App.app
for f in "$APP"/Frameworks/*; do codesign -f -s - "$f"; done
codesign -f -s - --entitlements App/App.entitlements "$APP"

xcodebuild -exportArchive -archivePath build/Maidenhead.xcarchive -exportPath build/upload \
  -exportOptionsPlist release/UploadOptions.plist -allowProvisioningUpdates
echo "Uploaded build $BUILD. It shows in App Store Connect → TestFlight after processing."
