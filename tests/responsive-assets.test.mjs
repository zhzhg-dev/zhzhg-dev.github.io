import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { attributes, elements, loadSource, renderAt, repository } from "./support/source-harness.mjs";

const { default: App } = loadSource(resolve(repository, "src/App.tsx"));
const widths = [480, 768, 1200, 1448];
const fonts = ["fonts/Onest-latin-variable.woff2", "fonts/bricolage/BricolageGrotesque-latin-variable.woff2"];

function file(directory, path) { return readFileSync(resolve(repository, directory, path)); }

function webpDimensions(asset) {
  assert.equal(asset.toString("ascii", 0, 4), "RIFF");
  assert.equal(asset.toString("ascii", 8, 12), "WEBP");
  assert.equal(asset.readUInt32LE(4) + 8, asset.length);
  for (let offset = 12; offset + 8 <= asset.length;) {
    const type = asset.toString("ascii", offset, offset + 4);
    const length = asset.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (type === "VP8X") return [1 + asset.readUIntLE(start + 4, 3), 1 + asset.readUIntLE(start + 7, 3)];
    if (type === "VP8L") {
      assert.equal(asset[start], 0x2f);
      const bits = asset.readUInt32LE(start + 1);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    if (type === "VP8 ") {
      assert.deepEqual([...asset.subarray(start + 3, start + 6)], [0x9d, 0x01, 0x2a]);
      return [asset.readUInt16LE(start + 6) & 0x3fff, asset.readUInt16LE(start + 8) & 0x3fff];
    }
    offset = start + length + (length % 2);
  }
  assert.fail("WebP has no valid dimension-bearing image chunk");
}

test("only About serves a responsive, high-priority WebP hero with one meaningful PNG fallback", () => {
  const html = renderAt(App, { page: "home" });
  const pictures = elements(html, "picture");
  assert.equal(pictures.length, 1);
  const source = attributes(pictures[0].markup.match(/<source\b[^>]*>/)?.[0] ?? "");
  assert.equal(source.type, "image/webp");
  assert.deepEqual(source.srcset.split(",").map(candidate => candidate.trim()), widths.map(width => `/studio/grant-daylight-studio-${width}.webp ${width}w`));
  assert.ok(source.sizes, "responsive candidates need a layout-aware sizes hint");
  assert.match(source.sizes, /max-width:\s*760px/);
  assert.match(source.sizes, /vw/);
  const image = attributes(pictures[0].markup.match(/<img\b[^>]*>/)?.[0] ?? "");
  assert.equal(image.src, "/studio/grant-daylight-studio-v1.png");
  assert.equal(image.width, "1448");
  assert.equal(image.height, "1086");
  assert.equal(image.fetchpriority, "high");
  assert.notEqual(image.loading, "lazy");
  assert.match(image.alt, /studio|workspace/i);
  for (const page of ["projects", "experience", "contact"]) {
    assert.doesNotMatch(renderAt(App, { page }), /grant-daylight-studio|studio-scene__art/);
  }
});

test("all four responsive WebPs are real smaller images with the correct intrinsic dimensions in source and output", () => {
  const original = file("public", "studio/grant-daylight-studio-v1.png");
  for (const width of widths) {
    const path = `studio/grant-daylight-studio-${width}.webp`;
    const source = file("public", path);
    assert.deepEqual(webpDimensions(source), [width, width * 3 / 4]);
    const type = source.toString("ascii", 12, 16);
    const alpha = type === "VP8X" ? Boolean(source[20] & 0x10)
      : type === "VP8L" && Boolean(source.readUInt32LE(21) & 0x10000000);
    assert.ok(alpha, "responsive artwork retains transparency rather than introducing an opaque image rectangle");
    assert.ok(source.length < original.length, `${width}px variant is smaller than the PNG fallback`);
    assert.deepEqual(file("dist", path), source, "production output contains the exact verified image");
  }
});

test("self-hosted WOFF2 fonts are real, smaller, licensed and used before the original TTF fallbacks", () => {
  const css = file("src", "styles.css").toString();
  const fallbackFonts = ["fonts/Onest-variable.ttf", "fonts/bricolage/BricolageGrotesque-variable.ttf"];
  for (const [index, path] of fonts.entries()) {
    const source = file("public", path);
    assert.equal(source.toString("ascii", 0, 4), "wOF2");
    assert.equal(source.readUInt32BE(8), source.length);
    assert.ok(source.length < file("public", fallbackFonts[index]).length);
    assert.deepEqual(file("dist", path), source);
    const woff = css.indexOf(path), ttf = css.indexOf(fallbackFonts[index]);
    assert.ok(woff >= 0 && ttf > woff);
  }
  assert.match(css, /format\(['"]woff2['"]\)/);
  assert.match(css, /font-display:\s*swap/);
  for (const license of ["fonts/OFL.txt", "fonts/bricolage/OFL.txt"]) {
    assert.match(file("public", license).toString(), /SIL OPEN FONT LICENSE/i);
    assert.deepEqual(file("dist", license), file("public", license));
  }
  for (const route of ["", "projects/", "experience/", "contact/"]) {
    const html = file("dist", `${route}index.html`).toString();
    const preloads = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => ({ ...attributes(tag), markup: tag })).filter(link => link.rel === "preload" && link.as === "font");
    assert.equal(preloads.length, 2);
    assert.deepEqual(preloads.map(link => link.href), fonts.map(path => `/${path}`));
    for (const preload of preloads) {
      assert.equal(preload.type, "font/woff2");
      assert.match(preload.markup, /\bcrossorigin(?:\s|=|\/?\s*>)/i);
    }
  }
});

test("all public page previews share the actual 1200×630 studio artwork and descriptive metadata", () => {
  const image = file("public", "og-studio.png");
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
  assert.deepEqual(file("dist", "og-studio.png"), image);
  for (const route of ["", "projects/", "experience/", "contact/"]) {
    const html = file("dist", `${route}index.html`).toString();
    const metadata = [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attributes(tag));
    const value = key => metadata.find(meta => meta.property === key || meta.name === key)?.content;
    for (const key of ["og:image", "twitter:image"]) assert.equal(value(key), "https://zhzhg-dev.github.io/og-studio.png");
    assert.equal(value("og:image:width"), "1200");
    assert.equal(value("og:image:height"), "630");
    for (const key of ["og:image:alt", "twitter:image:alt"]) {
      assert.match(value(key), /Grant Zhang/);
      assert.match(value(key), /studio|workspace/i);
    }
  }
});
