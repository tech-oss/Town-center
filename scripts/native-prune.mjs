// Removes website-only media from the web build that goes inside the iPhone
// and Android apps (dist-ios), so the store download is smaller. The apps
// always open the /mobile app (main.jsx), which never shows these:
//
//   videos/hero.mp4     the desktop homepage header (the app plays the
//                       portrait hero-mobile.mp4, see HomeScreen.jsx)
//   images/instagram/   the Instagram reels strip on the desktop homepage
//
// The website build (npm run build) is untouched.
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const OUT = "dist-ios";
const WEBSITE_ONLY = ["videos/hero.mp4", "images/instagram"];

for (const rel of WEBSITE_ONLY) {
  const p = join(OUT, rel);
  if (!existsSync(p)) continue;
  rmSync(p, { recursive: true, force: true });
  console.log(`native build: left out ${rel} (website only)`);
}
