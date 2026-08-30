import Link from "next/link";

const guarantees = [
  {
    eyebrow: "Authored values",
    title: "Reject accidental raw strings",
    body: "Required brands keep an unvalidated string out of positions that promise an owned member.",
  },
  {
    eyebrow: "Runtime boundaries",
    title: "Parse where data enters",
    body: "parse, safeParse, and Standard Schema handle JSON, forms, URLs, databases, and agent output.",
  },
  {
    eyebrow: "Team conventions",
    title: "Make misuse visible",
    body: "Optional ESLint rules enforce member extraction, casing, comparisons, and narrow escape hatches.",
  },
] as const;

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
          <a href="https://github.com/CatOfJupit3r/enumwaii">GitHub</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">A closed vocabulary with an owner.</p>
          <h1>String enums that are hard to misuse.</h1>
          <p className="hero-lede">
            Enumwaii keeps strings pleasant at runtime while making raw values,
            crossed declarations, and unsafe deserialization difficult to slip
            through TypeScript code unnoticed.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/docs/getting-started">
              Get started
            </Link>
            <Link className="secondary-action" href="/docs/api">
              Browse the API
            </Link>
          </div>
          <div aria-label="Install enumwaii" className="install-command">
            <span aria-hidden="true">$</span>
            <code>pnpm add enumwaii</code>
          </div>
        </div>

        <div aria-label="Enumwaii quick example" className="hero-code">
          <div className="code-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <pre>
            <code>{`import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
type Role = (typeof roles)["~type"];

function authorize(role: Role) {
  return role === ROLE.ADMIN;
}

authorize(ROLE.ADMIN); // ✓
authorize("ADMIN");    // TypeScript error

const role = roles.parse(input);`}</code>
          </pre>
        </div>
      </section>

      <section aria-labelledby="guarantees-title" className="guarantees">
        <div className="section-heading">
          <p>One small declaration</p>
          <h2 id="guarantees-title">Useful from source code to the wire.</h2>
        </div>
        <div className="guarantee-grid">
          {guarantees.map((guarantee) => (
            <article key={guarantee.title}>
              <p>{guarantee.eyebrow}</p>
              <h3>{guarantee.title}</h3>
              <span>{guarantee.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-callout">
        <div>
          <p className="surface-kicker">Fits the ecosystem</p>
          <h2>Native strings. Standard Schema. Optional adapters.</h2>
          <p>
            Use enumwaii directly with Standard Schema consumers, or opt into
            Zod and Valibot adapters. Runnable examples cover React, Vue, Solid,
            Hono, Elysia, oRPC, Effect, NestJS, SQL, and MongoDB.
          </p>
        </div>
        <Link href="/docs/examples">Explore integrations</Link>
      </section>

      <footer className="home-footer">
        <span>MIT licensed</span>
        <div>
          <a href="https://www.npmjs.com/package/enumwaii">npm</a>
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
