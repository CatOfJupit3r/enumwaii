import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const skill = await readFile(
    resolve(process.cwd(), "../packages/enumwaii/skills/enumwaii/SKILL.md"),
    "utf8",
  );

  return new Response(skill, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
