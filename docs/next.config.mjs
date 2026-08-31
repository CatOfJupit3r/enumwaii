import { readdir } from "node:fs/promises";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { createMDX } from "fumadocs-mdx/next";

const basePath = process.env.PAGES_BASE_PATH ?? "";
const docsDirectory = dirname(fileURLToPath(import.meta.url));
const isDevelopment = process.env.NODE_ENV === "development";

async function collectDocumentationFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await collectDocumentationFiles(path)));
    else if ([".md", ".mdx"].includes(extname(entry.name))) files.push(path);
  }

  return files;
}

function documentationSlug(path) {
  const segments = relative(docsDirectory, path).split(sep);
  const filename = segments.at(-1);
  segments[segments.length - 1] = filename.slice(0, -extname(filename).length);
  if (segments.at(-1) === "index") segments.pop();
  return segments;
}

function encodeDocumentationSlug(slug) {
  return Buffer.from(JSON.stringify(slug), "utf8").toString("base64url");
}

async function markdownRewrites() {
  const rootEntries = await readdir(docsDirectory, { withFileTypes: true });
  const rootFiles = rootEntries
    .filter(
      (entry) =>
        entry.isFile() && [".md", ".mdx"].includes(extname(entry.name)),
    )
    .map((entry) => join(docsDirectory, entry.name));
  const apiFiles = await collectDocumentationFiles(join(docsDirectory, "api"));

  return [...rootFiles, ...apiFiles].map((path) => {
    const slug = documentationSlug(path);
    return {
      source: slug.length === 0 ? "/docs.md" : `/docs/${slug.join("/")}.md`,
      destination: `/llms.mdx/pages/${encodeDocumentationSlug(slug)}`,
    };
  });
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  agentRules: false,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  serverExternalPackages: ["typescript", "twoslash"],
  trailingSlash: true,
  ...(isDevelopment
    ? {
        async rewrites() {
          return markdownRewrites();
        },
      }
    : { output: "export" }),
};

export default createMDX()(nextConfig);
