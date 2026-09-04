import { describe, expect, it } from "vitest";

import { POST } from "../app/api/webhooks/cms/route";

function jsonRequest(body: string): Request {
  return new Request("https://example.test/api/webhooks/cms", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/webhooks/cms", () => {
  it("parses a valid JSON status at the route CMS webhook", async () => {
    const response = await POST(jsonRequest('{"status":"in-review"}'));
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      defaultOnly: { accepted: true, source: "REQUEST", status: "in-review" },
      recovery: { accepted: true, source: "REQUEST", status: "in-review" },
    });
  });

  it("distinguishes a missing property from malformed and wrong-type values", async () => {
    const missing = await POST(jsonRequest("{}"));
    const malformed = await POST(jsonRequest('{"status":"PAUSED"}'));
    const wrongType = await POST(jsonRequest('{"status":42}'));

    await expect(missing.json()).resolves.toMatchObject({
      defaultOnly: { source: "DEFAULT" },
      recovery: { source: "DEFAULT" },
    });
    await expect(malformed.json()).resolves.toMatchObject({
      defaultOnly: { source: "REJECTED" },
      recovery: { source: "FALLBACK" },
    });
    await expect(wrongType.json()).resolves.toMatchObject({
      input: { kind: "WRONG_TYPE" },
      defaultOnly: { source: "REJECTED" },
      recovery: { source: "FALLBACK" },
    });
  });

  it("returns a structured 400 for malformed JSON and invalid envelopes", async () => {
    const malformedJson = await POST(jsonRequest("{"));
    const scalarBody = await POST(jsonRequest("42"));

    expect(malformedJson.status).toBe(400);
    await expect(malformedJson.json()).resolves.toMatchObject({
      error: { code: "INVALID_JSON" },
    });
    expect(scalarBody.status).toBe(400);
    await expect(scalarBody.json()).resolves.toMatchObject({
      error: { code: "INVALID_BODY" },
    });
  });
});
