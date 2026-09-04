import { inspectCmsWebhook } from "../../../../lib/cms-webhook";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Send a JSON object with an optional status field.",
        },
      },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "The request body must be a JSON object.",
        },
      },
      { status: 400 },
    );
  }

  return Response.json(inspectCmsWebhook(Reflect.get(body, "status")));
}
