import { notFound } from "next/navigation";

import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

interface MarkdownPageRouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-static";

function encodeDocumentationSlug(slug: string[] | undefined): string {
  return Buffer.from(JSON.stringify(slug ?? []), "utf8").toString("base64url");
}

function decodeDocumentationSlug(id: string): string[] | undefined | null {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(id, "base64url").toString("utf8"),
    );
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === "string")
    ) {
      return null;
    }

    return value.length === 0 ? undefined : value;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: MarkdownPageRouteContext,
): Promise<Response> {
  const { id } = await params;
  const slug = decodeDocumentationSlug(id);
  if (slug === null) notFound();

  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export function generateStaticParams(): Array<{ id: string }> {
  return source.generateParams().map(({ slug }) => ({
    id: encodeDocumentationSlug(slug),
  }));
}
