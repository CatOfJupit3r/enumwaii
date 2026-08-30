import { exports } from "cloudflare:workers";
import { expect, test } from "vitest";

import "../runtime/cloudflare";
import { EXPECTED_RUNTIME_REPORT, exerciseRuntimeContract } from "./contract";

test("runs the shared enumwaii routes inside workerd", async () => {
  const report = await exerciseRuntimeContract((path, init) =>
    exports.default.fetch(new Request(`https://orderline.test${path}`, init)),
  );

  expect(report).toEqual(EXPECTED_RUNTIME_REPORT);
});
