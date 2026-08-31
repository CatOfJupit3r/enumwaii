"use client";

import { useEffect, useState, type ReactNode } from "react";

type Scenario = "calls" | "policy" | "crossed";
type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "deno";

const installCommands: Readonly<Record<PackageManager, string>> = {
  npm: "npm install enumwaii",
  pnpm: "pnpm add enumwaii",
  yarn: "yarn add enumwaii",
  bun: "bun add enumwaii",
  deno: "deno add npm:enumwaii",
};
const packageManagerStorageKey = "enumwaii-package-manager";

function isPackageManager(value: string | null): value is PackageManager {
  return value !== null && Object.hasOwn(installCommands, value);
}

interface ScenarioDetails {
  readonly id: Scenario;
  readonly label: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly without: string;
  readonly with: string;
  readonly withoutStatus: string;
  readonly withStatus: string;
  readonly takeaway: string;
  readonly flow: readonly [string, string, string];
}

const scenarios: readonly ScenarioDetails[] = [
  {
    id: "calls",
    label: "Application code",
    eyebrow: "No authored magic strings",
    title: "Make every accepted role traceable.",
    without:
      "String unions stop typos, but still accept raw members wherever a Role is expected. Reviewers cannot tell whether ADMIN came from the declaration or memory.",
    with: "Owned members travel through ordinary functions like strings, but callers must use ROLE.ADMIN. Every accepted value points back to its source of truth.",
    withoutStatus: "Raw ADMIN accepted",
    withStatus: "Declaration required",
    takeaway:
      "Business logic stays familiar while the compiler enforces where members come from.",
    flow: ["declare once", "pass owned members", "trust the call"],
  },
  {
    id: "policy",
    label: "Permission policy",
    eyebrow: "Map enums to enums",
    title: "Keep both sides of a policy owned.",
    without:
      "A typed record checks spelling, but every key and permission is still an authored string. Equal literals from unrelated domains remain interchangeable.",
    with: "deriveTo ties every source role to members owned by the permission declaration. Scalar and array grants share the same checked lookup.",
    withoutStatus: "Strings on both sides",
    withStatus: "Both domains owned",
    takeaway:
      "The policy is exhaustive by role, constrained by permission, and queried with owned members.",
    flow: ["owned role", "checked relationship", "owned permissions"],
  },
  {
    id: "crossed",
    label: "Crossed domains",
    eyebrow: "Same text, different owner",
    title: "Stop one enum from impersonating another.",
    without:
      "Structural string unions forget where a value came from. AUDIT_ACTOR.ADMIN quietly reaches authorize() because its text happens to match.",
    with: "Each declaration owns its members. TypeScript rejects AUDIT_ACTOR.ADMIN even though both values print as ADMIN at runtime.",
    withoutStatus: "Same literal accepted",
    withStatus: "Owner mismatch caught",
    takeaway: "Provenance survives ordinary assignments and function calls.",
    flow: ["domain value", "owned declaration", "correct consumer"],
  },
];

function getScenario(id: Scenario): ScenarioDetails {
  const scenario = scenarios.find((item) => item.id === id);

  if (!scenario) {
    throw new Error(`Unknown landing-page scenario: ${id}`);
  }

  return scenario;
}

function CodeLine({ children }: { children?: ReactNode }) {
  return (
    <li>
      <code>{children ?? "\u00a0"}</code>
    </li>
  );
}

function TypeHint({
  children,
  id,
  kind,
  signature,
  detail,
}: {
  children: ReactNode;
  id: string;
  kind: "error" | "info";
  signature: string;
  detail: string;
}) {
  return (
    <span aria-describedby={id} className={`type-hint is-${kind}`} tabIndex={0}>
      {children}
      <span className="type-popup" id={id} role="tooltip">
        <code>{signature}</code>
        <span>{detail}</span>
      </span>
    </span>
  );
}

function WithoutCode({ scenario }: { scenario: Scenario }) {
  if (scenario === "calls") {
    return (
      <ol className="comparison-code">
        <CodeLine>
          <span className="syntax-keyword">type</span> Role ={" "}
          <span className="syntax-string">&quot;ADMIN&quot;</span> |{" "}
          <span className="syntax-string">&quot;USER&quot;</span>;
        </CodeLine>
        <CodeLine>
          <span className="syntax-keyword">function</span> canDelete(role: Role)
          {" { … }"}
        </CodeLine>
        <CodeLine />
        <CodeLine>
          canDelete(
          <TypeHint
            detail="The union checks spelling, but cannot require this value to come from a shared declaration."
            id="calls-without-hint"
            kind="info"
            signature={'Argument of type "ADMIN" is accepted as Role'}
          >
            <span className="syntax-string">&quot;ADMIN&quot;</span>
          </TypeHint>
          ); <span className="code-comment">// compiles</span>
        </CodeLine>
      </ol>
    );
  }

  if (scenario === "policy") {
    return (
      <ol className="comparison-code">
        <CodeLine>
          <span className="syntax-keyword">type</span> Role ={" "}
          <span className="syntax-string">&quot;ADMIN&quot;</span> |{" "}
          <span className="syntax-string">&quot;USER&quot;</span>;
        </CodeLine>
        <CodeLine>
          <span className="syntax-keyword">type</span> Permission ={" "}
          <span className="syntax-string">&quot;READ&quot;</span> |{" "}
          <span className="syntax-string">&quot;WRITE&quot;</span>;
        </CodeLine>
        <CodeLine>
          <span className="syntax-keyword">const</span> grants: Record&lt;Role,
          readonly Permission[]&gt; = {"{"}
        </CodeLine>
        <CodeLine>
          {"  "}ADMIN:{" "}
          <TypeHint
            detail="These literals satisfy the structural Permission union, but carry no declaration ownership."
            id="policy-without-hint"
            kind="info"
            signature={'readonly ["READ", "WRITE"] — accepted as Permission[]'}
          >
            [<span className="syntax-string">&quot;READ&quot;</span>,{" "}
            <span className="syntax-string">&quot;WRITE&quot;</span>]
          </TypeHint>
          ,
        </CodeLine>
        <CodeLine>
          {"  "}USER: [<span className="syntax-string">&quot;READ&quot;</span>],
        </CodeLine>
        <CodeLine>{"}"};</CodeLine>
        <CodeLine>grants[role];</CodeLine>
      </ol>
    );
  }

  return (
    <ol className="comparison-code">
      <CodeLine>
        <span className="syntax-keyword">type</span> Role ={" "}
        <span className="syntax-string">&quot;ADMIN&quot;</span> |{" "}
        <span className="syntax-string">&quot;USER&quot;</span>;
      </CodeLine>
      <CodeLine>
        <span className="syntax-keyword">const</span> AUDIT_ACTOR = {"{"} ADMIN:{" "}
        <span className="syntax-string">&quot;ADMIN&quot;</span> {"}"} as const;
      </CodeLine>
      <CodeLine />
      <CodeLine>
        authorize(
        <TypeHint
          detail="The value narrowed to the shared string literal, so its original domain is invisible."
          id="crossed-without-hint"
          kind="info"
          signature={'(property) ADMIN: "ADMIN" — accepted as Role'}
        >
          AUDIT_ACTOR.ADMIN
        </TypeHint>
        );
      </CodeLine>
      <CodeLine>
        <span className="code-comment">// compiles — wrong domain</span>
      </CodeLine>
    </ol>
  );
}

function WithCode({ scenario }: { scenario: Scenario }) {
  if (scenario === "calls") {
    return (
      <ol className="comparison-code">
        <CodeLine>
          <span className="syntax-keyword">const</span> roles ={" "}
          <span className="syntax-function">em</span>([
          <span className="syntax-string">&quot;ADMIN&quot;</span>,{" "}
          <span className="syntax-string">&quot;USER&quot;</span>]);
        </CodeLine>
        <CodeLine>
          <span className="syntax-keyword">const</span> ROLE = roles.
          <span className="syntax-property">enum</span>;
        </CodeLine>
        <CodeLine>
          <span className="syntax-keyword">type</span> Role = typeof roles[
          <span className="syntax-string">&quot;~type&quot;</span>];
        </CodeLine>
        <CodeLine>
          <span className="syntax-keyword">function</span> canDelete(role: Role)
          {" { … }"}
        </CodeLine>
        <CodeLine />
        <CodeLine>
          canDelete(
          <TypeHint
            detail="A raw look-alike cannot satisfy the declaration-owned Role type."
            id="calls-with-hint"
            kind="error"
            signature={
              'Argument of type "ADMIN" is not assignable to Role. ts(2345)'
            }
          >
            <span className="syntax-string">&quot;ADMIN&quot;</span>
          </TypeHint>
          );
        </CodeLine>
        <CodeLine>
          canDelete(ROLE.ADMIN); <span className="code-ok">// ✓</span>
        </CodeLine>
      </ol>
    );
  }

  if (scenario === "policy") {
    return (
      <ol className="comparison-code">
        <CodeLine>
          <span className="code-comment">
            // ROLE and PERMISSION are extracted members
          </span>
        </CodeLine>
        <CodeLine>
          <span className="syntax-keyword">const</span> grants ={" "}
          <TypeHint
            detail="deriveTo checks every source role and constrains every scalar or array output to the permission declaration."
            id="policy-with-hint"
            kind="info"
            signature="Enumwaii.deriveTo: exhaustive relationship between declarations"
          >
            roles.<span className="syntax-function">deriveTo</span>
          </TypeHint>
          (permissions,
        </CodeLine>
        <CodeLine>
          {"  "}[ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE]],
        </CodeLine>
        <CodeLine>{"  "}[ROLE.USER, PERMISSION.READ],</CodeLine>
        <CodeLine>);</CodeLine>
        <CodeLine>
          grants.<span className="syntax-function">get</span>(ROLE.USER);{" "}
          <span className="code-ok">// READ</span>
        </CodeLine>
      </ol>
    );
  }

  return (
    <ol className="comparison-code">
      <CodeLine>
        <span className="syntax-keyword">const</span> roles ={" "}
        <span className="syntax-function">em</span>([
        <span className="syntax-string">&quot;ADMIN&quot;</span>,{" "}
        <span className="syntax-string">&quot;USER&quot;</span>]);
      </CodeLine>
      <CodeLine>
        <span className="syntax-keyword">const</span> actors ={" "}
        <span className="syntax-function">em</span>([
        <span className="syntax-string">&quot;ADMIN&quot;</span>,{" "}
        <span className="syntax-string">&quot;SYSTEM&quot;</span>]);
      </CodeLine>
      <CodeLine>
        <span className="syntax-keyword">const</span> ROLE = roles.
        <span className="syntax-property">enum</span>;
      </CodeLine>
      <CodeLine>
        <span className="syntax-keyword">const</span> AUDIT_ACTOR = actors.
        <span className="syntax-property">enum</span>;
      </CodeLine>
      <CodeLine />
      <CodeLine>
        authorize(
        <TypeHint
          detail="Both print as ADMIN, but their declaration identities are different."
          id="crossed-with-hint"
          kind="error"
          signature="Argument of type AuditActor is not assignable to Role. ts(2345)"
        >
          AUDIT_ACTOR.ADMIN
        </TypeHint>
        );
      </CodeLine>
      <CodeLine>
        authorize(ROLE.ADMIN); <span className="code-ok">// ✓</span>
      </CodeLine>
    </ol>
  );
}

function copySourceFor(scenario: Scenario): string {
  if (scenario === "calls") {
    return `const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
type Role = typeof roles["~type"];

function canDelete(role: Role): boolean {
  return role === ROLE.ADMIN;
}

canDelete("ADMIN"); // TypeScript error
canDelete(ROLE.ADMIN);`;
  }

  if (scenario === "policy") {
    return `const roles = em(["ADMIN", "USER"]);
const permissions = em(["READ", "WRITE"]);
const ROLE = roles.enum;
const PERMISSION = permissions.enum;
const grants = roles.deriveTo(
  permissions,
  [ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE]],
  [ROLE.USER, PERMISSION.READ],
);

grants.get(ROLE.USER);`;
  }

  return `const roles = em(["ADMIN", "USER"]);
const actors = em(["ADMIN", "SYSTEM"]);
const ROLE = roles.enum;
const AUDIT_ACTOR = actors.enum;

authorize(AUDIT_ACTOR.ADMIN); // TypeScript error
authorize(ROLE.ADMIN);`;
}

export function InstallCommand() {
  const [manager, setManager] = useState<PackageManager>("npm");
  const [copied, setCopied] = useState(false);
  const command = installCommands[manager];

  useEffect(() => {
    const stored =
      window.sessionStorage.getItem(packageManagerStorageKey) ??
      window.localStorage.getItem(packageManagerStorageKey);

    if (isPackageManager(stored)) setManager(stored);
  }, []);

  async function copyInstall(): Promise<void> {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  }

  return (
    <div className="install-switcher">
      <div aria-label="Package manager" className="install-tabs" role="group">
        {(Object.keys(installCommands) as PackageManager[]).map((item) => (
          <button
            aria-pressed={manager === item}
            key={item}
            onClick={() => {
              setManager(item);
              setCopied(false);
              window.sessionStorage.setItem(packageManagerStorageKey, item);
              window.localStorage.setItem(packageManagerStorageKey, item);
            }}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="install-command" id="install-command">
        <code>{command}</code>
        <button
          aria-label={`Copy ${manager} install command`}
          onClick={copyInstall}
          type="button"
        >
          {copied ? "Copied" : "Copy command"}
        </button>
      </div>
    </div>
  );
}

export function LandingPlayground() {
  const [scenarioId, setScenarioId] = useState<Scenario>("calls");
  const [copied, setCopied] = useState(false);
  const scenario = getScenario(scenarioId);

  async function copySnippet(): Promise<void> {
    await navigator.clipboard.writeText(copySourceFor(scenarioId));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  }

  return (
    <section aria-labelledby="playground-title" className="ownership-lab">
      <header className="lab-heading">
        <div>
          <h2 id="playground-title">Make enum mistakes loud.</h2>
        </div>
        <p>
          Explore mistakes from ordinary application code: authored literals,
          role-to-permission policies, and same-text values crossing domains.
        </p>
      </header>

      <div aria-label="Failure mode" className="scenario-tabs" role="tablist">
        {scenarios.map((item) => (
          <button
            aria-controls="scenario-panel"
            aria-selected={scenarioId === item.id}
            id={`scenario-${item.id}`}
            key={item.id}
            onClick={() => setScenarioId(item.id)}
            role="tab"
            type="button"
          >
            <span>{item.label}</span>
            <small>{item.eyebrow}</small>
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`scenario-${scenarioId}`}
        className="scenario-panel"
        id="scenario-panel"
        role="tabpanel"
      >
        <div className="scenario-intro">
          <div>
            <h3>{scenario.title}</h3>
          </div>
          <button onClick={copySnippet} type="button">
            {copied ? "Copied" : "Copy the enumwaii version"}
          </button>
        </div>

        <div className="comparison-grid">
          <article className="comparison-pane is-without">
            <header>
              <div>
                <span aria-hidden="true">×</span>
                <strong>Without enumwaii</strong>
              </div>
              <small>{scenario.withoutStatus}</small>
            </header>
            <WithoutCode scenario={scenarioId} />
            <p>{scenario.without}</p>
          </article>

          <article className="comparison-pane is-with">
            <header>
              <div>
                <span aria-hidden="true">✓</span>
                <strong>With enumwaii</strong>
              </div>
              <small>{scenario.withStatus}</small>
            </header>
            <WithCode scenario={scenarioId} />
            <p>{scenario.with}</p>
          </article>
        </div>

        <footer className="scenario-proof">
          <strong>{scenario.takeaway}</strong>
          <span className="proof-flow" aria-label="Scenario flow">
            {scenario.flow[0]} <i aria-hidden="true">→</i> {scenario.flow[1]}{" "}
            <i aria-hidden="true">→</i> {scenario.flow[2]}
          </span>
        </footer>
      </div>
    </section>
  );
}
