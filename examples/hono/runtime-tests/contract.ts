export interface RuntimeContractReport {
  readonly catalog: readonly string[];
  readonly defaultSelection: {
    readonly statusCode: number;
    readonly status: string;
    readonly defaulted: boolean;
  };
  readonly invalidSelection: {
    readonly statusCode: number;
    readonly error: string;
  };
  readonly validInspection: {
    readonly statusCode: number;
    readonly status: string;
    readonly terminal: boolean;
  };
  readonly invalidInspection: {
    readonly statusCode: number;
    readonly error: string;
  };
}

export const EXPECTED_RUNTIME_REPORT: RuntimeContractReport = {
  catalog: ["PENDING", "PAID", "SHIPPED", "CANCELLED"],
  defaultSelection: {
    statusCode: 200,
    status: "PENDING",
    defaulted: true,
  },
  invalidSelection: {
    statusCode: 400,
    error: "Invalid order status",
  },
  validInspection: {
    statusCode: 200,
    status: "PAID",
    terminal: false,
  },
  invalidInspection: {
    statusCode: 400,
    error: "Invalid order status",
  },
};

export type RuntimeRequest = (
  path: string,
  init?: RequestInit,
) => Promise<Response>;

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function exerciseRuntimeContract(
  request: RuntimeRequest,
): Promise<RuntimeContractReport> {
  const catalogResponse = await request("/api/statuses");
  const catalog = await readJson<{
    readonly statuses: readonly { readonly status: string }[];
  }>(catalogResponse);

  const defaultResponse = await request("/api/status");
  const defaultSelection = await readJson<{
    readonly status: string;
    readonly defaulted: boolean;
  }>(defaultResponse);

  const invalidResponse = await request("/api/status?status=REFUNDED");
  const invalidSelection = await readJson<{ readonly error: string }>(
    invalidResponse,
  );

  const validInspectionResponse = await request("/api/status/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify("PAID"),
  });
  const validInspection = await readJson<{
    readonly status: string;
    readonly terminal: boolean;
  }>(validInspectionResponse);

  const invalidInspectionResponse = await request("/api/status/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify("REFUNDED"),
  });
  const invalidInspection = await readJson<{ readonly error: string }>(
    invalidInspectionResponse,
  );

  return {
    catalog: catalog.statuses.map(({ status }) => status),
    defaultSelection: {
      statusCode: defaultResponse.status,
      status: defaultSelection.status,
      defaulted: defaultSelection.defaulted,
    },
    invalidSelection: {
      statusCode: invalidResponse.status,
      error: invalidSelection.error,
    },
    validInspection: {
      statusCode: validInspectionResponse.status,
      status: validInspection.status,
      terminal: validInspection.terminal,
    },
    invalidInspection: {
      statusCode: invalidInspectionResponse.status,
      error: invalidInspection.error,
    },
  };
}
