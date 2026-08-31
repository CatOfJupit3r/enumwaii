interface MarkdownFile {
  readonly path?: string;
}

interface MarkdownNode {
  children?: MarkdownNode[];
  lang?: string | null;
  meta?: string | null;
  type: string;
}

const TYPESCRIPT_LANGUAGES = new Set(["ts", "tsx"]);

/**
 * Enable Twoslash for every curated TypeScript example.
 *
 * Generated TypeDoc pages are excluded: their signature blocks are reference
 * output, not authored examples, and processing all of them would add build
 * cost without improving the guide experience. An individual curated block can
 * opt out with `no-twoslash` when it intentionally is not TypeScript source.
 */
export default function remarkAutoTwoslash() {
  return function transform(tree: MarkdownNode, file: MarkdownFile): void {
    const path = (file.path ?? "").replaceAll("\\", "/");
    if (/(?:^|\/)api\//u.test(path)) return;

    visit(tree, (node) => {
      if (node.type !== "code" || !TYPESCRIPT_LANGUAGES.has(node.lang ?? "")) {
        return;
      }

      const meta = node.meta ?? "";
      if (/(?:^|\s)(?:twoslash|no-twoslash|notwoslash)(?:\s|$)/u.test(meta)) {
        return;
      }

      node.meta = `${meta} twoslash`.trim();
    });
  };
}

function visit(
  node: MarkdownNode,
  visitor: (node: MarkdownNode) => void,
): void {
  visitor(node);
  node.children?.forEach((child) => visit(child, visitor));
}
