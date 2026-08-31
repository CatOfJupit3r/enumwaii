import type { ReactNode } from "react";

interface DiagramNodeProps {
  readonly children: ReactNode;
  readonly detail: string;
  readonly tone?: "accent" | "default" | "generated";
}

function DiagramNode({ children, detail, tone = "default" }: DiagramNodeProps) {
  const toneClass =
    tone === "accent"
      ? "border-lime-500/60 bg-lime-500/10"
      : tone === "generated"
        ? "border-sky-500/50 bg-sky-500/10"
        : "border-fd-border bg-fd-card";

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${toneClass}`}>
      <strong className="block text-sm text-fd-foreground">{children}</strong>
      <span className="mt-1 block text-xs leading-relaxed text-fd-muted-foreground">
        {detail}
      </span>
    </div>
  );
}

function DiagramArrow() {
  return (
    <div
      aria-hidden="true"
      className="grid min-h-6 place-items-center text-lg text-fd-muted-foreground md:min-h-0 md:px-1"
    >
      <span className="md:hidden">↓</span>
      <span className="hidden md:inline">→</span>
    </div>
  );
}

interface DiagramLaneProps {
  readonly input: ReactNode;
  readonly output: ReactNode;
  readonly transform: ReactNode;
}

function DiagramLane({ input, output, transform }: DiagramLaneProps) {
  return (
    <div className="grid items-stretch md:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1fr)]">
      {input}
      <DiagramArrow />
      {transform}
      <DiagramArrow />
      {output}
    </div>
  );
}

/** Show how each documentation source reaches its public representation. */
export function DocumentationContentDiagram() {
  return (
    <figure
      aria-labelledby="documentation-content-caption"
      className="not-prose my-8 space-y-3 rounded-xl border border-fd-border bg-fd-muted/30 p-4"
    >
      <div className="hidden grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1fr)] text-xs font-medium uppercase tracking-wider text-fd-muted-foreground md:grid">
        <span>Authority</span>
        <span />
        <span>Transformation</span>
        <span />
        <span>Published surface</span>
      </div>

      <DiagramLane
        input={
          <DiagramNode detail="Curated guides, navigation metadata, and MDX components">
            docs/*.md and docs/*.mdx
          </DiagramNode>
        }
        transform={
          <DiagramNode detail="Fumadocs MDX, Shiki, Twoslash, and the shared page renderer">
            Compile authored guides
          </DiagramNode>
        }
        output={
          <DiagramNode
            detail="Human pages, static search records, and one .md alternate per page"
            tone="accent"
          >
            Guides
          </DiagramNode>
        }
      />

      <DiagramLane
        input={
          <DiagramNode detail="JSDoc attached to the package's public TypeScript exports">
            packages/enumwaii/src
          </DiagramNode>
        }
        transform={
          <DiagramNode detail="TypeDoc writes ignored Markdown; Fumadocs compiles it with the same shell">
            Generate API Markdown
          </DiagramNode>
        }
        output={
          <DiagramNode
            detail="Browsable signatures, source links, tables of contents, and Markdown alternates"
            tone="generated"
          >
            API reference
          </DiagramNode>
        }
      />

      <DiagramLane
        input={
          <DiagramNode detail="Curated discovery, library guidance, and the packaged agent skill">
            llms.txt, llms.md, SKILL.md
          </DiagramNode>
        }
        transform={
          <DiagramNode detail="Static Next.js route handlers read the authoritative files verbatim">
            Emit agent resources
          </DiagramNode>
        }
        output={
          <DiagramNode
            detail="Stable machine-readable URLs advertised by metadata, sitemap, and documentation"
            tone="accent"
          >
            Agent endpoints
          </DiagramNode>
        }
      />

      <figcaption
        className="pt-1 text-xs leading-relaxed text-fd-muted-foreground"
        id="documentation-content-caption"
      >
        Three authorities feed one static documentation artifact while retaining
        clear ownership of the text developers edit.
      </figcaption>
    </figure>
  );
}

interface BuildStepProps {
  readonly children: ReactNode;
  readonly detail: string;
  readonly number: number;
}

function BuildStep({ children, detail, number }: BuildStepProps) {
  return (
    <li className="group relative flex gap-3 pb-6 last:pb-0">
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-3 top-7 w-px bg-fd-border group-last:hidden"
      />
      <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-lime-500 text-xs font-bold text-black">
        {number}
      </span>
      <div className="pt-0.5">
        <strong className="block text-sm text-fd-foreground">{children}</strong>
        <span className="mt-1 block text-xs leading-relaxed text-fd-muted-foreground">
          {detail}
        </span>
      </div>
    </li>
  );
}

/** Show the ordered production build and GitHub Pages deployment pipeline. */
export function DocumentationBuildDiagram() {
  return (
    <figure
      aria-labelledby="documentation-build-caption"
      className="not-prose my-8 grid gap-6 rounded-xl border border-fd-border bg-fd-muted/30 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.65fr)]"
    >
      <ol className="m-0 list-none p-0">
        <BuildStep
          detail="tsdown emits fresh package JavaScript and declarations for TypeDoc and Twoslash."
          number={1}
        >
          Build enumwaii
        </BuildStep>
        <BuildStep
          detail="TypeDoc regenerates docs/api/enumwaii from the public exports and their JSDoc."
          number={2}
        >
          Generate the API reference
        </BuildStep>
        <BuildStep
          detail="Next.js and Fumadocs compile pages, syntax metadata, search, routes, and static assets."
          number={3}
        >
          Create the static site
        </BuildStep>
        <BuildStep
          detail="Processed page text is materialized at the public .md paths."
          number={4}
        >
          Materialize Markdown alternates
        </BuildStep>
        <BuildStep
          detail="The export checker verifies artifacts, links, base paths, search, rich examples, and agent resources."
          number={5}
        >
          Verify the complete export
        </BuildStep>
      </ol>

      <div className="flex flex-col justify-center gap-2 rounded-lg border border-fd-border bg-fd-card p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-fd-muted-foreground">
          GitHub Pages
        </span>
        <strong className="text-sm text-fd-foreground">
          One immutable artifact
        </strong>
        <span className="text-xs leading-relaxed text-fd-muted-foreground">
          The workflow builds with <code>/enumwaii</code> as the base path,
          uploads <code>docs/out</code>, and deploys that exact directory.
        </span>
      </div>

      <figcaption
        className="text-xs leading-relaxed text-fd-muted-foreground lg:col-span-2"
        id="documentation-build-caption"
      >
        Generation precedes compilation, and verification runs against the
        deployable files rather than an intermediate development server.
      </figcaption>
    </figure>
  );
}
