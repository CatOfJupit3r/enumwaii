"use server";

import { inspectStatusBoundary, type BoundaryReport } from "../lib/boundary";

export async function inspectStatusAction(
  input: unknown,
): Promise<BoundaryReport> {
  return inspectStatusBoundary(input);
}
