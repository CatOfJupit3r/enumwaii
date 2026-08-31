import type { MetadataRoute } from "next";

import { source } from "@/lib/source";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: getSiteUrl("/") },
    { url: getSiteUrl("/llms.txt") },
    { url: getSiteUrl("/llms.md") },
    { url: getSiteUrl("/skills/enumwaii/SKILL.md") },
    ...source.getPages().map((page) => ({
      url: getSiteUrl(`${page.url}/`),
    })),
  ];
}
