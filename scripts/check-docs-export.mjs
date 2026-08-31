import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

const outputDirectory = resolve(process.cwd(), process.argv[2] ?? "out");
const localOrigin = "https://enumwaii.local";
const canonicalOrigin = "https://catofjupit3r.github.io";
const canonicalBasePath = "/enumwaii";

function requireFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing static documentation artifact: ${path}`);
  }
}

async function collectHtmlFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectHtmlFiles(path)));
    else if (entry.name.endsWith(".html")) files.push(path);
  }

  return files;
}

function routeForFile(path, basePath) {
  const pathFromOutput = relative(outputDirectory, path).split(sep).join("/");
  const route = pathFromOutput.endsWith("/index.html")
    ? pathFromOutput.slice(0, -"index.html".length)
    : pathFromOutput === "index.html"
      ? ""
      : pathFromOutput;

  return `${basePath}/${route}`.replace(/\/{2,}/g, "/");
}

function localCandidates(pathname, basePath) {
  if (
    basePath &&
    pathname !== basePath &&
    !pathname.startsWith(`${basePath}/`)
  ) {
    return [];
  }

  const withoutBase = basePath ? pathname.slice(basePath.length) : pathname;
  const localPath = decodeURIComponent(withoutBase).replace(/^\/+/, "");
  if (!localPath) return [join(outputDirectory, "index.html")];
  if (localPath.endsWith("/")) {
    return [join(outputDirectory, localPath, "index.html")];
  }
  if (extname(localPath)) return [join(outputDirectory, localPath)];

  return [
    join(outputDirectory, localPath),
    join(outputDirectory, localPath, "index.html"),
    join(outputDirectory, `${localPath}.html`),
  ];
}

requireFile(outputDirectory);
for (const required of [
  "index.html",
  ".nojekyll",
  "api/search",
  "docs/index.html",
  "docs.md",
  "docs/getting-started/index.html",
  "docs/getting-started.md",
  "docs/adapters.md",
  "docs/agents/index.html",
  "docs/eslint-plugin/index.html",
  "docs/api/index.html",
  "docs/api/enumwaii/index.html",
  "docs/api/enumwaii.md",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "llms.md",
  "skills/enumwaii/SKILL.md",
]) {
  requireFile(join(outputDirectory, required));
}

const indexHtml = await readFile(join(outputDirectory, "index.html"), "utf8");
if (
  !indexHtml.includes('rel="describedby"') ||
  !indexHtml.includes("/enumwaii/llms.txt")
) {
  throw new Error("The documentation does not advertise its llms.txt index.");
}
const assetReference = indexHtml.match(
  /(?:href|src)="(?<path>[^"\s]*\/_next\/[^"\s]+)"/u,
)?.groups?.path;
if (!assetReference)
  throw new Error("Could not detect the Next.js asset path.");

const assetPath = new URL(assetReference, `${localOrigin}/`).pathname;
const nextSegment = assetPath.indexOf("/_next/");
const basePath = nextSegment > 0 ? assetPath.slice(0, nextSegment) : "";
const configuredBasePath = process.env.PAGES_BASE_PATH ?? "";
if (basePath !== configuredBasePath) {
  throw new Error(
    `Exported base path ${JSON.stringify(basePath)} does not match PAGES_BASE_PATH ${JSON.stringify(configuredBasePath)}.`,
  );
}

const missing = new Map();
const htmlFiles = await collectHtmlFiles(outputDirectory);
for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");
  const route = routeForFile(htmlFile, basePath);
  const references = html.matchAll(/(?:href|src)="(?<value>[^"\s]+)"/gu);

  for (const match of references) {
    const value = match.groups?.value.replaceAll("&amp;", "&");
    if (!value || value.startsWith("#") || value.startsWith("data:")) continue;

    const url = new URL(value, `${localOrigin}${route}`);
    const candidates =
      url.origin === localOrigin
        ? localCandidates(url.pathname, basePath)
        : url.origin === canonicalOrigin
          ? localCandidates(url.pathname, canonicalBasePath)
          : [];
    if (candidates.length === 0) continue;
    if (candidates.some((candidate) => existsSync(candidate))) continue;

    const key = `${route} -> ${url.pathname}`;
    missing.set(key, candidates);
  }
}

if (missing.size > 0) {
  const details = [...missing.entries()]
    .slice(0, 20)
    .map(
      ([reference, candidates]) =>
        `${reference}\n  tried: ${candidates.join(", ")}`,
    )
    .join("\n");
  throw new Error(`Broken static documentation links:\n${details}`);
}

const searchIndex = await readFile(join(outputDirectory, "api/search"), "utf8");
if (
  !searchIndex.includes('"enabled":true') ||
  !searchIndex.includes("/docs/getting-started") ||
  !searchIndex.includes("/docs/api/enumwaii")
) {
  throw new Error("The static search index is missing required documentation.");
}

const eslintGuide = await readFile(
  join(outputDirectory, "docs/eslint-plugin/index.html"),
  "utf8",
);
for (const requiredRule of [
  "enforce-enum-casing",
  "no-direct-enumwaii-reference",
  "no-enumwaii-case-misuse",
  "no-raw-enum-comparison",
  "no-raw-enum-member",
  "no-union-property-in",
]) {
  if (!eslintGuide.includes(requiredRule)) {
    throw new Error(`The ESLint guide is missing ${requiredRule}.`);
  }
}
if (!eslintGuide.includes("Flagged") || !eslintGuide.includes("Accepted")) {
  throw new Error("The ESLint guide is missing its rule examples.");
}
if (
  !eslintGuide.includes("twoslash-tag-error-line") ||
  !eslintGuide.includes("invalidInternalMember") ||
  !eslintGuide.includes("structuralUnionNarrowing")
) {
  throw new Error("The ESLint guide is missing inline rule diagnostics.");
}

const adaptersGuide = await readFile(
  join(outputDirectory, "docs/adapters/index.html"),
  "utf8",
);
if (
  adaptersGuide.includes('href="#zod"') ||
  adaptersGuide.includes('href="#valibot"')
) {
  throw new Error(
    "The adapters guide exposes an anchor for content inside an inactive tab.",
  );
}

const coreGuide = await readFile(
  join(outputDirectory, "docs/core-api/index.html"),
  "utf8",
);
if (!coreGuide.includes("twoslash lsp")) {
  throw new Error("The core guide is missing interactive TypeScript metadata.");
}
if (
  !coreGuide.includes('rel="alternate"') ||
  !coreGuide.includes('type="text/markdown"') ||
  !coreGuide.includes("/enumwaii/docs/core-api.md")
) {
  throw new Error("The core guide does not advertise its Markdown alternate.");
}

for (const removedResource of ["llms-full.txt"]) {
  if (existsSync(join(outputDirectory, removedResource))) {
    throw new Error(`Removed agent resource was exported: ${removedResource}`);
  }
}

const llmsIndex = await readFile(join(outputDirectory, "llms.txt"), "utf8");
const llmsHeadings = [
  ...llmsIndex.matchAll(/^(?<level>#{1,6})\s+(?<text>.+)$/gmu),
];
const llmsSections = llmsIndex.split(/^##\s+/mu).slice(1);
if (
  !llmsIndex.startsWith("# enumwaii\n\n> ") ||
  llmsHeadings[0]?.groups?.level !== "#" ||
  llmsHeadings.slice(1).some((heading) => heading.groups?.level !== "##") ||
  llmsSections.length === 0 ||
  llmsSections.some((section) =>
    section
      .split("\n")
      .slice(1)
      .filter(Boolean)
      .some(
        (line) => !/^- \[[^\]]+\]\(https:\/\/[^)]+\)(?:: .+)?$/u.test(line),
      ),
  ) ||
  !llmsIndex.includes("/enumwaii/llms.md") ||
  !llmsIndex.includes("/enumwaii/docs/getting-started.md") ||
  llmsIndex.includes("```") ||
  llmsIndex.includes("<Callout") ||
  llmsIndex.includes("<Tabs")
) {
  throw new Error(
    "llms.txt does not follow the authored Markdown index format.",
  );
}

const llmsGuide = await readFile(join(outputDirectory, "llms.md"), "utf8");
if (
  !llmsGuide.includes("# enumwaii") ||
  !llmsGuide.includes("## The ownership model") ||
  !llmsGuide.includes("## Standard Schema and adapters") ||
  !llmsGuide.includes("## Agent workflow") ||
  !llmsGuide.includes("/enumwaii/skills/enumwaii/SKILL.md") ||
  !llmsGuide.includes("/enumwaii/docs/getting-started.md") ||
  llmsGuide.includes("<Callout") ||
  llmsGuide.includes("<Tabs")
) {
  throw new Error("llms.md is missing its authored library guidance.");
}

const skill = await readFile(
  join(outputDirectory, "skills/enumwaii/SKILL.md"),
  "utf8",
);
if (!skill.includes("name: enumwaii") || !skill.includes("## Declare once")) {
  throw new Error("The exported enumwaii skill is incomplete.");
}

console.log(
  `Verified ${htmlFiles.length} static documentation pages at base path ${JSON.stringify(basePath)}.`,
);
