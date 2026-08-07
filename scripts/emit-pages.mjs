import { mkdir, readFile, writeFile } from "node:fs/promises";
import { URL } from "node:url";

const pages = [
  {
    path: "experience",
    title: "Experience | Grant Zhang",
    description:
      "Grant Zhang's technical experience, education, leadership, and growing engineering toolkit.",
  },
  {
    path: "projects",
    title: "Projects | Grant Zhang",
    description:
      "Selected AI, full-stack, Svelte, and mathematical modelling projects by Grant Zhang.",
  },
];

const homeHtml = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

for (const page of pages) {
  const pageUrl = `https://zhzhg-dev.github.io/${page.path}/`;
  const html = homeHtml
    .replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${page.description}" />`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${pageUrl}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${page.title}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${pageUrl}" />`,
    )
    .replace('data-page="home"', `data-page="${page.path}"`);

  const outputDirectory = new URL(`../dist/${page.path}/`, import.meta.url);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(new URL("index.html", outputDirectory), html, "utf8");
}
