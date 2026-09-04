import type { MetadataRoute } from "next";

import { ARTICLES, publicStatuses } from "../lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  return ARTICLES.flatMap((article) => {
    const publicStatus = publicStatuses.safeParse(article.status);
    if (!publicStatus.success) return [];

    return [
      {
        url: "https://byline.example/articles/" + article.id.toLowerCase(),
        lastModified: "2026-09-04",
      },
    ];
  });
}
