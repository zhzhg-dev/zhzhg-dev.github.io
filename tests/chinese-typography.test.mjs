import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { attributes, repository } from "./support/source-harness.mjs";

const css = readFileSync(resolve(repository, "src/components/bilingual.css"), "utf8");
const chineseFonts = [
  { file: "resource-han-rounded-studio.woff2", family: "Studio Rounded SC", weight: "500" },
  { file: "noto-sans-sc-studio.woff2", family: "Studio Sans SC", weight: "400 600" },
];
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, declarations]) => ({ selector: selector.trim(), declarations }));

test("both Chinese font subsets are actual compact WOFF2 assets copied exactly to the build", () => {
  for (const { file } of chineseFonts) {
    const asset = readFileSync(resolve(repository, "public/fonts/chinese", file));
    assert.equal(asset.toString("ascii", 0, 4), "wOF2", `${file} is a WOFF2 font, not a renamed file`);
    assert.equal(asset.readUInt32BE(8), asset.length, `${file} has a matching declared size`);
    assert.ok(asset.length > 1000 && asset.length < 300 * 1024, `${file} is a bounded subset, not a full multi-megabyte CJK font`);
    assert.deepEqual(readFileSync(resolve(repository, "dist/fonts/chinese", file)), asset);
  }
});

test("the self-hosted Chinese fonts retain their original open licenses and source attribution", () => {
  for (const license of ["ResourceHanRounded-OFL.txt", "NotoSansSC-OFL.txt"]) {
    const source = readFileSync(resolve(repository, "public/fonts/chinese", license));
    assert.match(source.toString("utf8"), /SIL OPEN FONT LICENSE/i);
    assert.deepEqual(readFileSync(resolve(repository, "dist/fonts/chinese", license)), source);
  }
  const attribution = readFileSync(resolve(repository, "public/fonts/chinese/README.md"), "utf8");
  assert.match(attribution, /Resource Han Rounded|ResourceHanRounded/i);
  assert.match(attribution, /Noto Sans SC|NotoSansSC/i);
  assert.match(attribution, /https:\/\/(?:github\.com|raw\.githubusercontent\.com)\//);
});

test("the CJK faces use explicit weights, swap rendering and CJK-only unicode ranges without a remote font request", () => {
  const faces = rules.filter(rule => rule.selector.endsWith("@font-face"));
  for (const { file, family, weight } of chineseFonts) {
    const face = faces.find(rule => rule.declarations.includes(`font-family: "${family}"`));
    assert.ok(face, `${family} has a declared local face`);
    assert.ok(face.declarations.includes(`/fonts/chinese/${file}`));
    assert.ok(face.declarations.includes(`font-weight: ${weight};`));
    assert.match(face.declarations, /font-display:\s*swap/);
    assert.match(face.declarations, /unicode-range:[^;]*U\+4E00-9FFF/);
    assert.doesNotMatch(face.declarations, /U\+(?:0000|0)-|https?:\/\//);
  }
  for (const route of ["", "projects/", "experience/", "contact/"]) {
    const html = readFileSync(resolve(repository, "dist", `${route}index.html`), "utf8");
    const preloads = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => attributes(tag)).filter(link => link.rel === "preload" && link.as === "font");
    assert.ok(preloads.length > 0, "English fonts keep their existing preload hints");
    assert.ok(preloads.every(link => !link.href.includes("/fonts/chinese/")), "an English entrance must not preload the optional Chinese faces");
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  }
});

test("Chinese display and body roles stay language-scoped with lighter weights and nonnegative CJK tracking", () => {
  const display = rules.find(rule => rule.selector.includes('[data-language="zh"] :is(h1, h2):not([translate="no"])'));
  assert.ok(display);
  assert.match(display.declarations, /font-family:\s*var\(--font-cn-display\)/);
  assert.match(display.declarations, /font-weight:\s*500\s*;/);
  assert.doesNotMatch(display.declarations, /letter-spacing:\s*-/);
  const smallerHeadings = rules.find(rule => rule.selector.includes('[data-language="zh"] :is(h3, h4)'));
  assert.ok(smallerHeadings);
  assert.match(smallerHeadings.declarations, /var\(--font-cn-body\)/);
  assert.match(smallerHeadings.declarations, /font-weight:\s*500\s*;/);
  assert.match(smallerHeadings.declarations, /letter-spacing:\s*0\s*;/);
  for (const rule of rules.filter(rule => !rule.selector.endsWith("@font-face") && /font-family:[^;]*(?:Studio Rounded SC|Studio Sans SC|--font-cn-)/.test(rule.declarations))) {
    assert.ok(rule.selector.includes('[data-language="zh"]'), `${rule.selector} must not change English typography`);
  }
  const grant = rules.find(rule => rule.selector === '.studio-site[data-language="zh"] .studio-intro h1');
  assert.ok(grant);
  assert.match(grant.declarations, /font-family:\s*var\(--font-display\)/);
  assert.match(grant.declarations, /font-weight:\s*750/);
});
