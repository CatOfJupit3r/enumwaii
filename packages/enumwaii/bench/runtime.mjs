import { performance } from "node:perf_hooks";

import { em } from "../dist/index.mjs";

const SAMPLE_COUNT = 9;
const SAMPLE_DURATION_MS = 120;

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function measure(name, operation) {
  for (let index = 0; index < 20_000; index += 1) operation();

  const samples = [];
  for (let sample = 0; sample < SAMPLE_COUNT; sample += 1) {
    let operations = 0;
    const startedAt = performance.now();
    let elapsed;
    do {
      for (let index = 0; index < 1_000; index += 1) operation();
      operations += 1_000;
      elapsed = performance.now() - startedAt;
    } while (elapsed < SAMPLE_DURATION_MS);
    samples.push((operations * 1_000) / elapsed);
  }

  console.log(`${name}: ${Math.round(median(samples)).toLocaleString()} ops/s`);
}

function values(count) {
  return Array.from({ length: count }, (_, index) => `VALUE_${index}`);
}

function measureRetainedHeap() {
  if (typeof global.gc !== "function") {
    console.log("retained heap: unavailable (run with --expose-gc)");
    return;
  }

  const declarations = Array.from({ length: 50_000 }, (_, index) => [
    `A_${index}`,
    `B_${index}`,
    `C_${index}`,
  ]);
  global.gc();
  const before = process.memoryUsage().heapUsed;
  const retained = declarations.map((declaration) => em(declaration));
  global.gc();
  const after = process.memoryUsage().heapUsed;
  console.log(
    `retained heap (3 members): ${Math.round((after - before) / retained.length).toLocaleString()} bytes/enum`,
  );
  if (retained.length === 0) throw new Error("unreachable");
}

for (const count of [3, 10, 50]) {
  const declaration = values(count);
  measure(`construct ${count}`, () => em(declaration));
}

const small = em(values(3));
const ten = em(values(10));
const medium = em(values(20));
const large = em(values(50));
measure("is hit (3)", () => small.is("VALUE_2"));
measure("is miss (3)", () => small.is("missing"));
measure("is hit (10)", () => ten.is("VALUE_9"));
measure("is miss (10)", () => ten.is("missing"));
measure("is hit (20)", () => medium.is("VALUE_19"));
measure("is miss (20)", () => medium.is("missing"));
measure("is hit (50)", () => large.is("VALUE_49"));
measure("is miss (50)", () => large.is("missing"));
measure("parse hit (3)", () => small.parse("VALUE_2"));
measureRetainedHeap();
