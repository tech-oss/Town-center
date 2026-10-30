// Makes the iPhone app's icon and launch screen from public/logo-dark-bg.jpg:
// the icon is the "M" mark alone, the launch screen the full logo.
import sharp from "sharp";

const SRC = "public/logo-dark-bg.jpg";
const BG = { r: 0x1c, g: 0x2e, b: 0x38 };
const ICON = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png";
const SPLASH = "ios/App/App/Assets.xcassets/Splash.imageset";

// The mark sits at about x 290–790, y 300–580 in the 1024px logo.
const mark = await sharp(SRC).extract({ left: 290, top: 300, width: 500, height: 280 }).toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: BG } })
  .composite([{ input: await sharp(mark).resize({ width: 880 }).toBuffer(), gravity: "center" }])
  .flatten({ background: BG })
  .png()
  .toFile(ICON);

const logo = await sharp(SRC).resize({ width: 1100 }).toBuffer();
for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  await sharp({ create: { width: 2732, height: 2732, channels: 3, background: BG } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`${SPLASH}/${name}`);
}
console.log("iOS icon and launch screen written.");
