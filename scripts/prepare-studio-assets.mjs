import { createRequire } from "node:module";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Optional local tooling path; sharp is not a website/runtime dependency.
const require = createRequire(process.env.PORTFOLIO_ASSET_NODE_MODULES
  ? resolve(process.env.PORTFOLIO_ASSET_NODE_MODULES, "portfolio-assets.cjs")
  : import.meta.url);
const sharp = require("sharp");
const repository = fileURLToPath(new URL("../", import.meta.url));
const original = resolve(repository, "public/studio/grant-cozy-studio-v2.png");
const outputs = [];

// The share card has its own release cycle; do not re-encode the site hero
// just to change the lettering on the cover.
for (const width of process.argv.includes("--cover-only") ? [] : [480, 768, 1200, 1448]) {
  const path = resolve(repository, `public/studio/grant-cozy-studio-v2-${width}.webp`);
  await sharp(original).resize({ width, withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 100, effort: 5 }).toFile(path);
  outputs.push({ path, bytes: (await stat(path)).size });
}

// A code-composed social card, reusing the cozy illustration and local fonts.
const displayFont = resolve(repository, "public/fonts/bricolage/BricolageGrotesque-variable.ttf");
const bodyFont = resolve(repository, "public/fonts/Onest-variable.ttf");
async function textLayer(text, font, fontfile, color, left, top) {
  const input = await sharp({ text: {
    text: `<span foreground="${color}">${text}</span>`, font, fontfile, rgba: true, dpi: 72,
  } }).png().toBuffer();
  return { input, left, top };
}
// Use the same forest-green paper strip as the homepage. Measure the full
// title in the local font before cutting the strip so it never clips.
const field = await textLayer("Game AI Product Management", "Onest SemiBold 27", bodyFont, "#fffdf6", 18, 13);
const fieldSize = await sharp(field.input).metadata();
const stripWidth = fieldSize.width + 36, stripHeight = fieldSize.height + 26;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const strip = await sharp(Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${stripWidth}" height="${stripHeight}"><rect width="100%" height="100%" rx="3" fill="#536c4d"/></svg>`
)).composite([field]).png().toBuffer();
const paperLabel = await sharp(strip).rotate(-2, { background: transparent }).png().toBuffer();
const art = await sharp(original).resize({ width: 736 }).png().toBuffer();
const shareCard = resolve(repository, "public/og-grant-game-ai.png");
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#f7f0e5" } })
  .composite([
    { input: art, left: 457, top: 41 },
    await textLayer("Hi, make yourself at home.", "Onest 23", bodyFont, "#626753", 70, 168),
    await textLayer("Grant.", "Bricolage Grotesque Bold 132", displayFont, "#30372e", 64, 218),
    { input: paperLabel, left: 68, top: 337 },
    await textLayer("Auckland, New Zealand", "Onest Medium 18", bodyFont, "#626753", 73, 443),
  ])
  .flatten({ background: "#f7f0e5" }).png({ compressionLevel: 9 }).toFile(shareCard);
outputs.push({ path: shareCard, bytes: (await stat(shareCard)).size });
console.log(JSON.stringify(outputs, null, 2));
