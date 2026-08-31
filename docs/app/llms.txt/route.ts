import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const index = await readFile(resolve(process.cwd(), "../llms.txt"), "utf8");

  return new Response(index, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
