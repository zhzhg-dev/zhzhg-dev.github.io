import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(repository, "../studio-home-preview-20261031");
let html = await readFile(resolve(repository, "dist/index.html"), "utf8");
const scriptTag = html.match(/<script\b[^>]*src="([^\"]+\.js)"[^>]*><\/script>/)?.[0];
const scriptPath = scriptTag?.match(/src="([^\"]+)"/)?.[1];
const styleTag = html.match(/<link\b[^>]*rel="stylesheet"[^>]*>/)?.[0];
const stylePath = styleTag?.match(/href="([^\"]+)"/)?.[1];
if (!scriptTag || !scriptPath || !styleTag || !stylePath) throw new Error("Build the website before packaging its preview.");
let javascript = await readFile(resolve(repository, `dist/${scriptPath.replace(/^\//, "")}`), "utf8");
let stylesheet = await readFile(resolve(repository, `dist/${stylePath.replace(/^\//, "")}`), "utf8");

// The approved studio design is now the default website. The standalone file
// embeds its Home assets; outgoing page links continue to the published site.
for (const [path, type] of [
  ["grant-daylight-studio-v1.png", "image/png"],
  ...[480, 768, 1200, 1448].map(width => [`grant-daylight-studio-${width}.webp`, "image/webp"]),
]) {
  const data = await readFile(resolve(repository, `public/studio/${path}`));
  javascript = javascript.replaceAll(`/studio/${path}`, `data:${type};base64,${data.toString("base64")}`);
}
for (const path of ["/#education-title", "/#studio-about", "/experience/", "/projects/", "/projects/#folio", "/projects/#learn-to-race", "/contact/"]) {
  for (const quote of ['"', "'", "`"]) javascript = javascript.replaceAll(`${quote}${path}${quote}`, `${quote}https://zhzhg-dev.github.io${path}${quote}`);
}
for (const quote of ['"', "'", "`"]) javascript = javascript.replaceAll(`${quote}/${quote}`, `${quote}https://zhzhg-dev.github.io/${quote}`);
javascript = javascript.replace(/\/\/# sourceMappingURL=.*$/gm, "");

for (const font of ["Onest-latin-variable.woff2", "bricolage/BricolageGrotesque-latin-variable.woff2", "Onest-variable.ttf", "bricolage/BricolageGrotesque-variable.ttf"]) {
  const data = await readFile(resolve(repository, `public/fonts/${font}`));
  stylesheet = stylesheet.replaceAll(`/fonts/${font}`, `data:font/${font.endsWith("woff2") ? "woff2" : "ttf"};base64,${data.toString("base64")}`);
}
const licenses = await Promise.all(["OFL.txt", "bricolage/OFL.txt"].map(path => readFile(resolve(repository, `public/fonts/${path}`), "utf8")));
const favicon = await readFile(resolve(repository, "public/favicon.svg"));
html = html.replaceAll("/favicon.svg", `data:image/svg+xml;base64,${favicon.toString("base64")}`);
html = html.replace(/<link\b[^>]*rel="preload"[^>]*>/g, "");
html = html.replace(styleTag, () => `<style>${stylesheet.replace(/<\/style/gi, "<\\/style")}</style>`);
html = html.replace(scriptTag, () => `<script type="module">${javascript.replace(/<\/script/gi, "<\\/script")}</script>`);
html = html.replace("</head>", `<!-- Self-contained local design preview. Illustration: AI-generated for this project.\nEmbedded font licenses:\n${licenses.join("\n\n").replaceAll("-->", "—>")}\n-->\n</head>`);
if (/(?:src|href)="\/(?:assets|fonts)\//.test(html)) throw new Error("An external build dependency remains in the standalone preview.");
if (/\/studio\/grant-daylight-studio-[\w-]+\.(?:png|webp)/.test(javascript)) throw new Error("A studio image is missing from the standalone preview.");
if (javascript.includes("github.iohttps://")) throw new Error("An outgoing link was prefixed twice.");
await mkdir(output, { recursive: true });
const destination = resolve(output, "Grant-Zhang-Studio-Preview.html");
await writeFile(destination, html, "utf8");
console.log(JSON.stringify({ preview: destination, bytes: Buffer.byteLength(html), selfContained: true }));
