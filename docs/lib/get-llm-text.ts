import { source } from "@/lib/source";
import { getSiteUrl } from "@/lib/site";

/** Render one documentation page as self-identifying Markdown for agents. */
export async function getLLMText(
  page: (typeof source)["$inferPage"],
): Promise<string> {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

Canonical URL: ${getSiteUrl(`${page.url}/`)}

${processed}`;
}
