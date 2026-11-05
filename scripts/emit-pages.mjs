import { mkdir, readFile, writeFile } from "node:fs/promises";
import { URL } from "node:url";

const pages = [
  {
    path: "experience",
    title: "经历与背景｜Grant",
    description:
      "Grant 的教学经历、教育背景、社区实践与技术工具。",
  },
  {
    path: "projects",
    title: "项目｜Grant",
    description:
      "探索 Folio、ExplainLab、L2R 与新西兰电力预测：从 AI 产品到仿真研究，看看我的思考、实现与验证。",
  },
  {
    path: "contact",
    title: "联系我｜Grant",
    description:
      "通过 LinkedIn 和 GitHub 联系 Grant。聊聊 AI 产品、游戏 AI、教学，或一个值得一起尝试的想法。",
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
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${page.description}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${page.title}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${page.description}" />`,
    )
    .replace('data-page="home"', `data-page="${page.path}"`);

  const outputDirectory = new URL(`../dist/${page.path}/`, import.meta.url);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(new URL("index.html", outputDirectory), html, "utf8");
}
