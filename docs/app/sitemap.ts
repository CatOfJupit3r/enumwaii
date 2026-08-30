import type { MetadataRoute } from "next";

import { source } from "@/lib/source";

const siteUrl = "https://catofjupit3r.github.io/enumwaii";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/` },
    ...source.getPages().map((page) => ({
      url: `${siteUrl}${page.url}/`,
    })),
  ];
}
