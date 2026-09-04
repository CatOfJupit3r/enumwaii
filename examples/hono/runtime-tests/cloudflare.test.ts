import { exports } from "cloudflare:workers";
import { expect, test } from "vitest";

import "../runtime/cloudflare";
import { EXPECTED_RUNTIME_REPORT, exerciseRuntimeContract } from "./contract";

test("runs the database-free menu and pricing catalog inside workerd", async () => {
  const report = await exerciseRuntimeContract((path, init) =>
    exports.default.fetch(new Request(`https://counter.test${path}`, init)),
  );

  expect(report).toEqual(EXPECTED_RUNTIME_REPORT);
});
