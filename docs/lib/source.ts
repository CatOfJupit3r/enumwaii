import { loader } from "fumadocs-core/source";
import { defineDocs } from "fumadocs-mdx/macro";

const docs = defineDocs({
  dir: ".",
  docs: {
    files: ["*.md", "*.mdx", "api/**/*.md", "api/**/*.mdx"],
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    files: ["meta.json", "api/**/meta.json"],
  },
});

/** Compiled documentation source used by pages, navigation, and search. */
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
