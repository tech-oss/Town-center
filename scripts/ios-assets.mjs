// Makes the iPhone app's icon and launch screen from public/logo-dark-bg.jpg:
// the icon is the "M" mark alone, the launch screen the full logo.
import sharp from "sharp";

const SRC = "public/logo-dark-bg.jpg";
const BG = { r: 0x1c, g: 0x2e, b: 0x38 };
const ICON = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png";
const SPLASH = "ios/App/App/Assets.xcassets/Splash.imageset";

// The mark sits at about x 290–790, y 300–580 in the 1024px logo. It's
// trimmed to its exact edges, so the space above and below it is equal.
const cut = await sharp(SRC).extract({ left: 290, top: 300, width: 500, height: 280 }).toBuffer();
const mark = await sharp(cut).trim({ background: BG, threshold: 30 }).toBuffer();
// Centred on the M itself (its two upright strokes), not its outer edges:
// the tail sweeping out to the right made an edge-centred M sit to the left.
// The uprights span 0.6%–88.3% of the trimmed mark's width.
const MARK_WIDTH = 794;
const sized = await sharp(mark).resize({ width: MARK_WIDTH }).toBuffer();
const { height: markHeight } = await sharp(sized).metadata();
const M_CENTRE = (0.006 + 0.883) / 2;
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: BG } })
  .composite([{ input: sized, left: Math.round(512 - M_CENTRE * MARK_WIDTH), top: Math.round((1024 - markHeight) / 2) }])
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
