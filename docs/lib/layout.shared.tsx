import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/** Shared navigation options for every documentation route. */
export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: "https://github.com/CatOfJupit3r/enumwaii",
    links: [
      {
        text: "Examples",
        url: "https://github.com/CatOfJupit3r/enumwaii/tree/main/examples",
        external: true,
      },
      {
        text: "npm",
        url: "https://www.npmjs.com/package/enumwaii",
        external: true,
      },
    ],
    nav: {
      title: (
        <span className="enumwaii-wordmark">
          <span aria-hidden="true">em</span>
          <strong>enumwaii</strong>
        </span>
      ),
      url: "/",
    },
  };
}
