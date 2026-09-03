import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { ProjectMark } from "@/components/project-mark";

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
          <ProjectMark />
          <strong>enumwaii</strong>
        </span>
      ),
      url: "/",
    },
  };
}
