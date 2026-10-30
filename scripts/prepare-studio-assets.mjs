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
const original = resolve(repository, "public/studio/grant-daylight-studio-v1.png");
const outputs = [];

for (const width of [480, 768, 1200, 1448]) {
  const path = resolve(repository, `public/studio/grant-daylight-studio-${width}.webp`);
  await sharp(original).resize({ width, withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 100, effort: 5 }).toFile(path);
  outputs.push({ path, bytes: (await stat(path)).size });
}

// A code-composed social card, reusing the approved illustration and local fonts.
const displayFont = resolve(repository, "public/fonts/bricolage/BricolageGrotesque-variable.ttf");
const bodyFont = resolve(repository, "public/fonts/Onest-variable.ttf");
async function textLayer(text, font, fontfile, color, left, top) {
  const input = await sharp({ text: {
    text: `<span foreground="${color}">${text}</span>`, font, fontfile, rgba: true, dpi: 72,
  } }).png().toBuffer();
  return { input, left, top };
}
const art = await sharp(original).resize({ width: 800 }).png().toBuffer();
const badge = Buffer.from('<svg width="254" height="46" xmlns="http://www.w3.org/2000/svg"><rect width="254" height="46" fill="#294d76"/></svg>');
const shareCard = resolve(repository, "public/og-studio.png");
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#f5efe5" } })
  .composite([
    { input: art, left: 400, top: 20 },
    await textLayer("Grant", "Bricolage Grotesque Bold 104", displayFont, "#2c2a25", 76, 177),
    await textLayer("Zhang.", "Bricolage Grotesque Bold 104", displayFont, "#2c2a25", 76, 281),
    { input: badge, left: 83, top: 398 },
    await textLayer("AI product builder", "Onest SemiBold 23", bodyFont, "#ffffff", 98, 410),
    await textLayer("A mathematical mind.", "Onest 21", bodyFont, "#6d6355", 82, 478),
    await textLayer("A builder’s curiosity.", "Onest 21", bodyFont, "#6d6355", 82, 510),
    await textLayer("GRANT ZHANG / AUCKLAND, NZ", "Onest Medium 13", bodyFont, "#6d6355", 80, 62),
  ])
  .flatten({ background: "#f5efe5" }).png({ compressionLevel: 9 }).toFile(shareCard);
outputs.push({ path: shareCard, bytes: (await stat(shareCard)).size });
console.log(JSON.stringify(outputs, null, 2));
