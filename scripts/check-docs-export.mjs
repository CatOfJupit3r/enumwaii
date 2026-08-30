import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

const outputDirectory = resolve(process.cwd(), process.argv[2] ?? "out");

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
  "docs/getting-started/index.html",
  "docs/api/index.html",
  "docs/api/enumwaii/index.html",
  "docs/api/eslint-plugin-enumwaii/index.html",
  "robots.txt",
  "sitemap.xml",
]) {
  requireFile(join(outputDirectory, required));
}

const indexHtml = await readFile(join(outputDirectory, "index.html"), "utf8");
const assetReference = indexHtml.match(
  /(?:href|src)="(?<path>[^"\s]*\/_next\/[^"\s]+)"/u,
)?.groups?.path;
if (!assetReference)
  throw new Error("Could not detect the Next.js asset path.");

const assetPath = new URL(assetReference, "https://enumwaii.local/").pathname;
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

    const url = new URL(value, `https://enumwaii.local${route}`);
    if (url.origin !== "https://enumwaii.local") continue;

    const candidates = localCandidates(url.pathname, basePath);
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

console.log(
  `Verified ${htmlFiles.length} static documentation pages at base path ${JSON.stringify(basePath)}.`,
);
