// After the build: the app's HTML moves from dist/index.html to
// dist/_app.html, so no address is answered by the bare file — every page,
// the home page included, goes through api/page.js, which writes that page's
// own title, description and preview into it (see api/_lib/seo.js).
import { renameSync, existsSync } from "node:fs";

if (existsSync("dist/index.html")) renameSync("dist/index.html", "dist/_app.html");
