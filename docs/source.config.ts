import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { defineConfig } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";

import remarkAutoTwoslash from "./remark-auto-twoslash";

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkAutoTwoslash],
    rehypeCodeOptions: {
      langs: ["bash", "js", "jsx", "json", "jsonc", "ts", "tsx"],
      themes: {
        dark: "github-dark",
        light: "github-light",
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          twoslashOptions: {
            customTags: ["annotate", "error", "warn"],
          },
          rendererRich: {
            hast: {
              hoverPopup: {
                tagName: "PopupContent",
                properties: {
                  align: "start",
                  class: "nd-copy-ignore",
                },
              },
            },
          },
        }),
      ],
    },
  },
});
