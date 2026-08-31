import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const guide = await readFile(resolve(process.cwd(), "../llms.md"), "utf8");

  return new Response(guide, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
