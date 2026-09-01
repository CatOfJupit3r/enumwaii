import Link from "next/link";

import {
  InstallCommand,
  LandingPlayground,
} from "@/components/landing-playground";
import { brandAssetPath, brandAssets, type BrandAssetName } from "@/lib/brands";

const guarantees = [
  {
    label: "Own it",
    promise: "Reject accidental raw strings.",
    detail: "Only declaration-owned members satisfy your application types.",
  },
  {
    label: "Parse it",
    promise: "Handle every boundary.",
    detail: "parse, safeParse, and Standard Schema validate external input.",
  },
  {
    label: "Enforce it",
    promise: "Prevent future mistakes.",
    detail: "Optional ESLint rules make suspicious patterns visible in review.",
  },
] as const;

const exampleRoot =
  "https://github.com/CatOfJupit3r/enumwaii/tree/main/examples";

interface EcosystemItem {
  readonly href: string;
  readonly icons?: readonly BrandAssetName[];
  readonly label: string;
}

interface EcosystemGroup {
  readonly category: string;
  readonly items: readonly EcosystemItem[];
}

const ecosystem: readonly EcosystemGroup[] = [
  {
    category: "Hosts & runtimes",
    items: [
      {
        label: "Node.js®",
        href: `${exampleRoot}/hono`,
        icons: ["nodejs"],
      },
      {
        label: "Bun",
        href: `${exampleRoot}/hono`,
        icons: ["bun"],
      },
      {
        label: "Deno",
        href: `${exampleRoot}/hono`,
        icons: ["deno"],
      },
      {
        label: "Cloudflare Workers®",
        href: `${exampleRoot}/hono`,
      },
    ],
  },
  {
    category: "Web & mobile apps",
    items: [
      {
        label: "Next.js",
        href: `${exampleRoot}/nextjs`,
        icons: ["nextjs"],
      },
      {
        label: "TanStack Start",
        href: `${exampleRoot}/tanstack-start-solid`,
        icons: ["tanstackStart"],
      },
      {
        label: "Solid",
        href: `${exampleRoot}/tanstack-start-solid`,
        icons: ["solid"],
      },
      {
        label: "Vue",
        href: `${exampleRoot}/vue`,
        icons: ["vue"],
      },
    ],
  },
  {
    category: "Servers & workflows",
    items: [
      {
        label: "Hono",
        href: `${exampleRoot}/hono`,
        icons: ["hono"],
      },
      {
        label: "Elysia",
        href: `${exampleRoot}/elysia`,
        icons: ["elysia"],
      },
      {
        label: "NestJS",
        href: `${exampleRoot}/nestjs`,
        icons: ["nestjs"],
      },
      {
        label: "oRPC",
        href: `${exampleRoot}/orpc`,
        icons: ["orpc"],
      },
      {
        label: "Effect",
        href: `${exampleRoot}/effect`,
        icons: ["effect"],
      },
    ],
  },
  {
    category: "Persistence",
    items: [
      {
        label: "Drizzle ORM",
        href: `${exampleRoot}/hono`,
      },
      {
        label: "PGlite",
        href: `${exampleRoot}/hono`,
        icons: ["pglite"],
      },
      {
        label: "Mongoose",
        href: `${exampleRoot}/nestjs`,
        icons: ["mongoose"],
      },
    ],
  },
];

export default function HomePage() {
  return (
    <main className="home-shell">
      <nav aria-label="Primary" className="home-nav">
        <Link className="enumwaii-wordmark" href="/">
          <span aria-hidden="true">em</span>
          <strong>enumwaii</strong>
        </Link>
        <div className="home-nav-links">
          <Link href="/docs">Docs</Link>
          <Link href="/docs/api">API</Link>
          <Link href="/docs/examples">Examples</Link>
          <a href="https://github.com/CatOfJupit3r/enumwaii">GitHub</a>
        </div>
      </nav>

      <section className="home-stage">
        <div className="home-hero">
          <div>
            <h1>String enums that know where they belong.</h1>
          </div>
          <div className="home-hero-intro">
            <p>
              Enumwaii keeps familiar string values while TypeScript tracks the
              declaration that owns them. Parse boundaries, get useful errors,
              and enforce the relationship in CI.
            </p>
            <div>
              <Link className="primary-action" href="/docs/getting-started">
                Get started
              </Link>
              <Link className="text-action" href="/docs/api">
                Read the API
              </Link>
            </div>
          </div>
        </div>

        <LandingPlayground />
      </section>

      <section className="home-proof">
        <div aria-label="Enumwaii guarantees" className="guarantee-list">
          {guarantees.map((guarantee) => (
            <article key={guarantee.label}>
              <h2>{guarantee.label}</h2>
              <strong>{guarantee.promise}</strong>
              <p>{guarantee.detail}</p>
            </article>
          ))}
        </div>

        <div aria-labelledby="ecosystem-title" className="ecosystem-list">
          <div className="ecosystem-heading">
            <div>
              <h2 id="ecosystem-title">Tested across the stack.</h2>
            </div>
            <Link href="/docs/examples">Explore examples</Link>
          </div>
          <dl>
            {ecosystem.map((group) => (
              <div key={group.category}>
                <dt>{group.category}</dt>
                <dd>
                  {group.items.map((item) => (
                    <span className="ecosystem-item" key={item.label}>
                      {item.icons?.length ? (
                        <span className="ecosystem-icons">
                          {item.icons.map((name) => {
                            const icon = brandAssets[name];

                            return (
                              <a
                                aria-label={`Visit the official ${icon.label} website`}
                                className="ecosystem-logo-link"
                                href={icon.href}
                                key={name}
                                title={icon.label}
                              >
                                {/* Official, unmodified artwork. See /docs/brand-assets
                                    for provenance, licenses, and trademark decisions. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="" src={brandAssetPath(name)} />
                              </a>
                            );
                          })}
                        </span>
                      ) : null}
                      <a
                        aria-label={`Open the ${item.label} example on GitHub`}
                        className="ecosystem-example-link"
                        href={item.href}
                      >
                        <strong>{item.label}</strong>
                        <i aria-hidden="true">↗</i>
                      </a>
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="brand-note">
            Third-party marks identify tested integrations and do not imply
            endorsement. Cloudflare Workers remains text-only under its
            published trademark rules. Vercel, the Vercel design, Next.js and
            related marks, designs and logos are trademarks or registered
            trademarks of Vercel, Inc. or its affiliates in the US and other
            countries. Node.js is a trademark of the OpenJS Foundation.
            Cloudflare and Cloudflare Workers are trademarks and/or registered
            trademarks of Cloudflare, Inc.{" "}
            <Link href="/docs/brand-assets">Review the asset audit</Link>.
          </p>
        </div>
      </section>

      <section className="home-standard-schema">
        <div className="standard-schema-copy">
          <h2>Works wherever schemas work.</h2>
          <p>
            Every enumwaii declaration implements{" "}
            <a href="https://standardschema.dev/">Standard Schema v1</a>, the
            shared TypeScript contract for validators and the tools that consume
            them. Compatible libraries accept the declaration directly—no
            wrapper and no adapter dependency.
          </p>
          <div>
            <Link href="/docs/adapters">Schemas and adapters</Link>
            <a href="https://standardschema.dev/">
              What is Standard Schema? <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div
          aria-label="Standard Schema example"
          className="standard-schema-code"
        >
          <div>
            <strong>roles.ts</strong>
            <span>Standard Schema v1</span>
          </div>
          <pre>
            <code>
              <span className="syntax-keyword">const</span> roles ={" "}
              <span className="syntax-function">em</span>([
              <span className="syntax-string">&quot;ADMIN&quot;</span>,{" "}
              <span className="syntax-string">&quot;USER&quot;</span>]);{"\n\n"}
              <span className="syntax-keyword">const</span> role = roles.
              <span className="syntax-function">parse</span>(input);{"\n"}
              <span className="syntax-keyword">const</span> result = roles.
              <span className="syntax-function">safeParse</span>(input);{"\n\n"}
              <span className="syntax-keyword">await</span> roles[
              <span className="syntax-string">&quot;~standard&quot;</span>].
              <span className="syntax-function">validate</span>(input);{"\n"}
              <span className="code-comment">
                // Standard Schema v1 — built in
              </span>
            </code>
          </pre>
        </div>
      </section>

      <section className="home-install-section">
        <div>
          <h2>Add enumwaii with the tools you already use.</h2>
          <p>
            The same package runs across Node.js, Bun, Deno, browsers, and
            Cloudflare Workers.
          </p>
        </div>
        <InstallCommand />
      </section>

      <footer className="home-footer">
        <span>MIT licensed</span>
        <div>
          <a href="https://www.npmjs.com/package/enumwaii">npm</a>
          <Link href="/docs/agents">Agents</Link>
          <a href="https://github.com/CatOfJupit3r/enumwaii/blob/main/CONTRIBUTING.md">
            Contributing
          </a>
          <a href="https://github.com/CatOfJupit3r/enumwaii/blob/main/SECURITY.md">
            Security
          </a>
        </div>
      </footer>
    </main>
  );
}
