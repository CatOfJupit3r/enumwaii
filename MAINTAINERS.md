# Maintainer runbook

This runbook covers the repository controls that cannot be inferred from package source alone. Contributor-facing development instructions remain in [CONTRIBUTING.md](CONTRIBUTING.md), and vulnerability handling remains in [SECURITY.md](SECURITY.md).

## Pull request gates

Every pull request runs two parallel jobs from the **CI** workflow:

- **Core validation** installs only the root and publishable-package dependency graph, then checks formatting, dependency version policy, lint, runtime and type tests, package skills, builds, JSDoc coverage, package contents, and type resolution. It is the fast signal.
- **Extended validation** installs the full workspace and checks packages, examples, documentation, Node 18, Bun, Deno, and Cloudflare Workers.

Both jobs run on `pull_request` with a read-only repository token, no secrets, and no persisted credentials, including for pull requests from forks. In **Settings → Actions → General**, require approval for fork pull request workflows from outside collaborators so fork code runs only after a maintainer approves it.

Require these contexts in the default-branch ruleset:

- `Core validation`
- `Extended validation`

GitHub requires successful checks on the latest commit. Concurrency cancels older runs after a push.

## Local hooks

The root `prepare` lifecycle lets Husky configure the tracked `.husky/pre-commit` hook after installation. The hook runs only checks that provide quick, actionable feedback: Git whitespace validation, Prettier on staged files, and dependency-version policy validation when a manifest or workspace policy is staged.

Use `pnpm hooks:install` to restore the configuration and `pnpm hooks:check` to run the staged-file checks directly. Hooks are a convenience boundary, not a security boundary; CI repeats the policies from a clean checkout.

## Dependency maintenance

Renovate (configured in [`.github/renovate.json`](.github/renovate.json)) owns both routine and security dependency updates. Routine updates arrive weekly: compatible npm and GitHub Actions updates are grouped into one pull request, and major upgrades open separately and remain deliberate maintainer work because the workspace contains many framework examples with distinct compatibility contracts. Security updates open immediately with the `security` label, still respecting the 24-hour release quarantine. Renovate regenerates the root pnpm workspace lockfile with every update, so its pull requests pass the frozen-lockfile install in CI. Dependabot alerts stay enabled because Renovate reads them to create vulnerability pull requests; Dependabot security updates stay disabled in repository settings, and the repository has no `dependabot.yml`. `packageRules` hold `typescript` below 7 and `fumadocs-twoslash` below 4 until the toolchain supports TypeScript 7.

Renovate groups example dependency updates into a separate pull request, but treat it as a prompt rather than an automatic merge. Example applications are compatibility fixtures whose framework, runtime, adapter, and build-tool versions often form coordinated support sets, so independent updates can produce a valid lockfile for an unsupported stack. Refresh an example deliberately when reviewing that integration, follow its framework's migration guidance, retain exact pins, and run its dependency, type, test, and build checks before extended validation. Dependabot alerts and dependency review continue to inspect the shared lockfile.

Once the repository is public, GitHub's dependency review workflow activates for manifest and lockfile pull requests and rejects newly introduced vulnerabilities of moderate severity or higher. In repository settings, also enable the dependency graph, Dependabot alerts, secret scanning, and push protection.

The workspace quarantines newly published dependency versions for 24 hours. A reviewed urgent update can use the exact, version-scoped `minimumReleaseAgeExclude` escape hatch documented in [SECURITY.md](SECURITY.md).

## Preparing a release

Every consumer-visible package change needs a Changeset. Before dispatching a release, confirm that the pull request is merged, `main` is green, and the intended package versions and release notes are represented under `.changeset`.

The **Release** workflow is manual and runs only from `main`:

1. Dispatch it while unreleased Changesets exist. The workflow validates the publishable packages and creates or updates the version pull request.
2. Review and merge the version pull request. This updates package versions and changelogs but does not publish.
3. Dispatch **Release** again from the updated `main`. With no remaining Changesets, the action publishes the prepared package versions and creates the corresponding GitHub releases.

Both dispatches pass through the `npm-release` environment. Configure that environment with a required reviewer, restrict it to protected `main`, and leave **Prevent self-review** disabled if this is a single-maintainer repository.

## First npm publication and trusted publishing

The first publication uses a short-lived granular npm token with read/write access and bypass 2FA enabled, stored as the `NPM_TOKEN` secret on the `npm-release` environment. Grant the narrowest package access npm permits for first publication, set a short expiration, and require two-factor authentication on the npm account.

After `enumwaii` and `eslint-plugin-enumwaii` exist on npm, configure a trusted publisher for each package with these values:

- provider: GitHub Actions;
- repository: `CatOfJupit3r/enumwaii`;
- workflow filename: `release.yml`;
- environment: `npm-release`;
- allowed action: `npm publish`.

Verify one trusted release before deleting `NPM_TOKEN` and revoking the token on npm. Trusted publishing uses the workflow's existing `id-token: write` permission and pinned OIDC-capable npm client, and it automatically attaches npm provenance for a public repository and public package. Keep `publishConfig.access` set to `public` for first-time package publication.

## Public-repository checklist

Before announcing 1.0.0:

- make the repository public and confirm that all README, package metadata, issue, security, documentation, and source links resolve;
- enable private vulnerability reporting, Dependabot alerts, secret scanning, and push protection;
- apply the default-branch ruleset with pull requests, linear history, resolved review threads, CODEOWNERS, and the two required validation contexts;
- protect the `npm-release` and `github-pages` environments, with deployment-branch restrictions appropriate to each workflow;
- require approval for fork pull request workflows from outside collaborators;
- verify the GitHub Pages deployment and custom repository homepage metadata;
- inspect both package tarballs from `pnpm test:build:core` before the first release; and
- publish through the manual workflow, then verify exports, types, provenance, README rendering, and package ownership from a clean consumer project.
