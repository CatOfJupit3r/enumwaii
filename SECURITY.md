# Security policy

## Supported versions

Only the latest published version of each package receives security fixes. Unreleased code on `main`, old prereleases, and superseded versions are not supported security branches.

## Report a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's [private vulnerability reporting form](https://github.com/CatOfJupit3r/enumwaii/security/advisories/new) instead.

Include, when possible:

- the affected package and version;
- the impact and realistic attack scenario;
- minimal reproduction steps or a proof of concept;
- affected runtimes or configurations; and
- any mitigation you have already tested.

The maintainer will acknowledge the report, investigate it, and coordinate a fix and disclosure when the report is valid. Please avoid public disclosure until a patched release is available or a disclosure timeline has been agreed.

This policy covers the published `enumwaii` and `eslint-plugin-enumwaii` packages and this repository's release automation. Vulnerabilities in a third-party dependency should also be reported to that dependency's maintainer.

## Supply-chain controls

The published `enumwaii` package has one runtime dependency, and the ESLint plugin has one. Framework examples and the documentation site are private workspace projects; their larger dependency graphs are never installed by the automatic core CI or the release workflow.

Repository policy is enforced as follows:

- `dependencies`, `devDependencies`, and `optionalDependencies` must be exact SemVer versions or `workspace:*`. `pnpm test:pins` checks every workspace manifest. Peer dependency ranges remain ranges because they describe the consumer versions supported by a published package.
- The lockfile is committed and frozen in CI. Transitive Git and tarball dependencies are blocked.
- Dependency lifecycle scripts fail closed. Only the exact reviewed versions listed under `allowBuilds` in `pnpm-workspace.yaml` may run install scripts.
- New package versions are quarantined for 24 hours.
- GitHub Actions use exact release tags. Dependabot groups their updates into a small monthly review PR.
- Release is manually dispatched, runs only the publishable packages, and is gated by the `npm-release` environment.

### Urgent dependency updates

The 24-hour quarantine is not a release blocker. For a reviewed emergency update, add only the required package version to `minimumReleaseAgeExclude`:

```yaml
minimumReleaseAgeExclude:
  - "package-name@1.2.3"
```

Then pin that same version in the appropriate manifest, update the lockfile, and run `pnpm check`. The exception is version-specific, so leaving it in place does not exempt later releases.

## Maintainer repository setup

The workflow files define the boundaries, while these GitHub settings enforce the human approval points:

1. Create an `extended-validation` environment with a maintainer as a required reviewer and no secrets. Require both `Core validation` and `enumwaii/extended-validation` in the branch ruleset. The base-branch-owned extended workflow installs and executes the pull request's examples, docs, Bun, Deno, and Workers only after a maintainer approves the protected job. Its isolated report job writes the final status directly to the pull request head because `pull_request_target` native checks belong to the default-branch commit. Until approval, GitHub displays the missing required context as expected and blocks merging without spending a runner on a placeholder job.
2. Create an `npm-release` environment with required reviewers and restrict its deployment branches to protected `main`. Keep `NPM_TOKEN` as an environment secret until npm trusted publishing is configured, then remove the long-lived token.
3. Restrict the `github-pages` environment to protected `main`, and require code-owner review for workflow, lockfile, and package-manifest changes.

The extended validation job and its dependencies receive no secrets and only a read-only repository token, including for pull requests from forks.
