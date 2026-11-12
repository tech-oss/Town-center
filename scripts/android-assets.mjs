import sharp from "sharp";
import { mkdirSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";

// The Android app's icon and splash screen, from the same artwork as the iPhone
// app (scripts/ios-assets.mjs makes those first). Android icons are adaptive —
// a background and a foreground the phone masks into its own shape — so the
// Maidenhead mark sits in the middle 60%, the part every mask keeps.
// Run: node scripts/ios-assets.mjs && node scripts/android-assets.mjs

const OUT = "resources/android";
const BG = { r: 0x1c, g: 0x2e, b: 0x38 };
const ICON = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png";
const SPLASH = "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png";
mkdirSync(OUT, { recursive: true });

copyFileSync(ICON, `${OUT}/icon-only.png`);
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: BG } }).png().toFile(`${OUT}/icon-background.png`);
const mark = await sharp(ICON).resize(620, 620).toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { ...BG, alpha: 1 } } })
  .composite([{ input: mark, gravity: "center" }]).png().toFile(`${OUT}/icon-foreground.png`);
copyFileSync(SPLASH, `${OUT}/splash.png`);
copyFileSync(SPLASH, `${OUT}/splash-dark.png`);

execSync(`npx capacitor-assets generate --android --assetPath ${OUT} --androidProject android`, { stdio: "inherit" });
console.log("Android icon and splash screen written.");
