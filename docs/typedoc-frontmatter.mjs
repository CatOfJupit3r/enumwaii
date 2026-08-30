// @ts-check

import path from "node:path";

import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/**
 * Convert TypeDoc's file-relative Markdown links into Fumadocs routes. A
 * Markdown file named `Thing.md` becomes the `/Thing/` route, so leaving the
 * original `.md` target would be broken after static export.
 *
 * @param {string} filename
 * @param {string} href
 */
function toDocumentationRoute(filename, href) {
  const hashIndex = href.indexOf("#");
  const markdownPath = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const target = path.resolve(path.dirname(filename), markdownPath);
  let targetRoute = path
    .relative(process.cwd(), target)
    .split(path.sep)
    .join("/")
    .replace(/\.md$/u, "")
    .replace(/(?:^|\/)index$/u, "");

  if (targetRoute) targetRoute = `${targetRoute}/`;
  return `/docs/${targetRoute}${hash}`;
}

/**
 * Add the page data Fumadocs needs without copying source documentation into a
 * second, hand-maintained API layer.
 *
 * @param {import("typedoc-plugin-markdown").MarkdownApplication} app
 */
export function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    const reflection = page.model;
    const signature = reflection?.signatures?.[0];
    const comment = reflection?.comment ?? signature?.comment;
    const description = comment?.summary
      .map((part) => part.text)
      .join("")
      .replace(/\s+/g, " ")
      .trim();

    page.frontmatter = {
      ...page.frontmatter,
      title: reflection?.name ?? "API reference",
      description: description || "API reference generated from source JSDoc.",
    };
  });

  app.renderer.on(MarkdownPageEvent.END, (page) => {
    page.contents = page.contents.replace(
      /\]\((?<href>(?!https?:|mailto:|#)[^)\s]+\.md(?:#[^)\s]+)?)\)/gu,
      (match, _href, _offset, _input, groups) =>
        `](${toDocumentationRoute(page.filename, groups.href)})`,
    );
  });
}
