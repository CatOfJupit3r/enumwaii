import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";

import { getMDXComponents } from "@/components/mdx";
import { getSiteUrl } from "@/lib/site";
import { source } from "@/lib/source";

interface DocumentationPageProps {
  params: Promise<{ slug?: string[] }>;
}

function encodeGitHubPath(path: string): string {
  return path
    .replaceAll("\\", "/")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

function markdownPath(pageUrl: string): string {
  const normalizedUrl = pageUrl.endsWith("/") ? pageUrl.slice(0, -1) : pageUrl;
  return `${normalizedUrl}.md`;
}

export default async function DocumentationPage({
  params,
}: DocumentationPageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const Content = page.data.body;
  const tableOfContents =
    slug?.[0] === "api"
      ? page.data.toc.filter((item) => item.depth <= 3)
      : page.data.toc;
  const markdownUrl = markdownPath(page.url);
  const githubUrl = page.data.info.path.startsWith("api/enumwaii/")
    ? undefined
    : `https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/${encodeGitHubPath(page.data.info.path)}`;

  return (
    <DocsPage full={page.data.full} toc={tableOfContents}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? (
        <DocsDescription>{page.data.description}</DocsDescription>
      ) : null}
      <div className="not-prose mb-8 flex items-center gap-2 border-b border-fd-border pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover githubUrl={githubUrl} markdownUrl={markdownUrl} />
      </div>
      <DocsBody>
        <Content
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: DocumentationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      types: {
        "text/markdown": getSiteUrl(markdownPath(page.url)),
      },
    },
  };
}
