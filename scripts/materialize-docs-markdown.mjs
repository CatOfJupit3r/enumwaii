import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

const outputDirectory = resolve(process.cwd(), process.argv[2] ?? "out");
const rawPagesDirectory = join(outputDirectory, "llms.mdx", "pages");

async function collectFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else files.push(path);
  }

  return files;
}

function documentationSlug(markdown, sourcePath) {
  const canonical = markdown.match(/^Canonical URL: (?<url>https?:\/\/\S+)$/mu)
    ?.groups?.url;
  if (!canonical) return undefined;

  const pathname = new URL(canonical).pathname;
  const docsIndex = pathname.indexOf("/docs/");
  if (docsIndex === -1) {
    throw new Error(
      `Raw documentation page has an invalid canonical URL: ${sourcePath}`,
    );
  }

  const slug = pathname.slice(docsIndex + "/docs/".length).replace(/\/$/u, "");
  const segments = slug.length === 0 ? [] : slug.split("/");
  if (
    segments.some(
      (segment) =>
        segment === "." || segment === ".." || segment.includes("\\"),
    )
  ) {
    throw new Error(`Unsafe documentation slug in ${sourcePath}`);
  }

  return segments;
}

const files = await collectFiles(rawPagesDirectory);
let written = 0;

for (const sourcePath of files) {
  const markdown = await readFile(sourcePath, "utf8");
  const slug = documentationSlug(markdown, sourcePath);
  if (!slug) continue;

  const targetPath =
    slug.length === 0
      ? join(outputDirectory, "docs.md")
      : join(
          outputDirectory,
          "docs",
          ...slug.slice(0, -1),
          `${slug.at(-1)}.md`,
        );
  const resolvedTarget = resolve(targetPath);
  const relativeTarget = relative(outputDirectory, resolvedTarget);
  if (
    relativeTarget.startsWith("..") ||
    relativeTarget.split(sep).includes("..")
  ) {
    throw new Error(
      `Refusing to write outside the docs export: ${resolvedTarget}`,
    );
  }

  await mkdir(dirname(resolvedTarget), { recursive: true });
  await writeFile(resolvedTarget, `${markdown.trimEnd()}\n`, "utf8");
  written++;
}

if (written === 0) {
  throw new Error(`No raw documentation pages found in ${rawPagesDirectory}`);
}

console.log(`Materialized ${written} Markdown documentation routes.`);
