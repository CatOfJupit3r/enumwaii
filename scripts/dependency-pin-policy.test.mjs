import assert from "node:assert/strict";
import test from "node:test";

import { dependencyVersionViolations } from "./dependency-pin-policy.mjs";

function violations(manifest) {
  return dependencyVersionViolations(manifest, "package.json");
}

void test("private packages keep exact dependencies", () => {
  assert.deepEqual(
    violations({
      private: true,
      dependencies: {
        external: "1.2.3",
        internal: "workspace:*",
        local: "file:../../packages/local",
      },
      devDependencies: { tooling: "2.0.0" },
      optionalDependencies: { optional: "3.0.0" },
    }),
    [],
  );

  assert.equal(
    violations({ private: true, dependencies: { external: "^1.2.3" } })[0]
      ?.expected,
    "an exact SemVer version, workspace:*, or a local file: dependency",
  );
});

void test("published dependencies reject local file links", () => {
  assert.equal(
    violations({ dependencies: { local: "file:../local" } })[0]?.name,
    "local",
  );
});

void test("published runtime dependencies use compatible ranges", () => {
  assert.deepEqual(
    violations({
      dependencies: { external: "^1.2.3", internal: "workspace:^" },
      optionalDependencies: { optional: "^3.0.0-beta.1" },
    }),
    [],
  );

  assert.deepEqual(
    violations({
      dependencies: { exact: "1.2.3", internal: "workspace:*" },
    }).map(({ name }) => name),
    ["exact", "internal"],
  );
});

void test("published development dependencies remain exact", () => {
  assert.deepEqual(
    violations({
      devDependencies: { external: "1.2.3", internal: "workspace:*" },
    }),
    [],
  );

  assert.equal(
    violations({ devDependencies: { tooling: "^1.2.3" } })[0]?.name,
    "tooling",
  );
});

void test("peer dependencies describe consumer compatibility", () => {
  assert.deepEqual(
    violations({
      peerDependencies: {
        eslint: "^8.57.0 || ^9.0.0 || ^10.0.0",
        typescript: ">=5.5.0 <7",
        internal: "workspace:^",
      },
    }),
    [],
  );

  assert.deepEqual(
    violations({
      peerDependencies: { exact: "1.2.3", internal: "workspace:*" },
    }).map(({ name }) => name),
    ["exact", "internal"],
  );
});

void test("non-string dependency specifiers are rejected", () => {
  assert.equal(
    violations({ private: true, dependencies: { invalid: 1 } })[0]?.name,
    "invalid",
  );
});
