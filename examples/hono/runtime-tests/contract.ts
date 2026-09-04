export interface RuntimeContractReport {
  readonly drinks: readonly string[];
  readonly sizes: readonly { readonly size: string; readonly cents: number }[];
  readonly tallPrice: {
    readonly statusCode: number;
    readonly size: string;
    readonly cents: number;
  };
  readonly invalidPrice: {
    readonly statusCode: number;
    readonly error: string;
  };
}

export const EXPECTED_RUNTIME_REPORT: RuntimeContractReport = {
  drinks: ["Oat latte", "Flat white", "Iced matcha"],
  sizes: [
    { size: "SHORT", cents: 320 },
    { size: "TALL", cents: 420 },
    { size: "GRANDE", cents: 520 },
  ],
  tallPrice: { statusCode: 200, size: "TALL", cents: 420 },
  invalidPrice: { statusCode: 400, error: "Unknown drink size" },
};

export type RuntimeRequest = (
  path: string,
  init?: RequestInit,
) => Promise<Response>;

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

/** Runs unchanged against full Counter and database-free workerd. */
export async function exerciseRuntimeContract(
  request: RuntimeRequest,
): Promise<RuntimeContractReport> {
  const menuResponse = await request("/api/menu");
  const menu = await readJson<{
    readonly drinks: readonly { readonly name: string }[];
    readonly sizes: readonly {
      readonly size: string;
      readonly cents: number;
    }[];
  }>(menuResponse);
  const tallResponse = await request("/api/menu/pricing/tall");
  const tallPrice = await readJson<{
    readonly size: string;
    readonly cents: number;
  }>(tallResponse);
  const invalidResponse = await request("/api/menu/pricing/jumbo");
  const invalidPrice = await readJson<{ readonly error: string }>(
    invalidResponse,
  );

  return {
    drinks: menu.drinks.map(({ name }) => name),
    sizes: menu.sizes.map(({ size, cents }) => ({ size, cents })),
    tallPrice: {
      statusCode: tallResponse.status,
      size: tallPrice.size,
      cents: tallPrice.cents,
    },
    invalidPrice: {
      statusCode: invalidResponse.status,
      error: invalidPrice.error,
    },
  };
}
