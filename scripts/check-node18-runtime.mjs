import { createRequire } from "node:module";

import enumwaiiPlugin from "../packages/eslint-plugin-enumwaii/dist/index.mjs";
import { em } from "../packages/enumwaii/dist/index.mjs";

const require = createRequire(import.meta.url);
const commonJsCore = require("../packages/enumwaii/dist/index.cjs");
const commonJsPlugin = require("../packages/eslint-plugin-enumwaii/dist/index.cjs");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const states = em(["READY", "RUNNING"]);
const commonJsStates = commonJsCore.em(["READY", "RUNNING"]);

assert(states.parse("READY") === states.enum.READY, "ESM core parse failed.");
assert(
  commonJsStates.parse("RUNNING") === commonJsStates.enum.RUNNING,
  "CommonJS core parse failed.",
);
assert(
  enumwaiiPlugin.meta?.name === "eslint-plugin-enumwaii",
  "ESM ESLint plugin metadata failed.",
);
assert(
  commonJsPlugin.default.meta?.version === enumwaiiPlugin.meta?.version,
  "CommonJS ESLint plugin metadata failed.",
);

console.log(`Node ${process.version} loaded every published module format.`);
