import { Hono } from "hono";

import { describeDrinkSize, DRINK_SIZE_VALUES } from "../domain/order-status";

import { drinkSizeUrlSchema, drinkSizeUrlToDomain } from "./url-values";

const menuDrinks = [
  { name: "Oat latte", note: "espresso, oat milk, a little cinnamon" },
  { name: "Flat white", note: "short and silky" },
  { name: "Iced matcha", note: "ceremonial matcha with light ice" },
] as const;

/** Portable menu data uses the same enumwaii-derived prices as the order board. */
export function createMenuRoutes(): Hono {
  const menu = new Hono();

  menu.get("/menu", (c) =>
    c.json({
      drinks: menuDrinks,
      sizes: DRINK_SIZE_VALUES.map((size) => ({
        size,
        ...describeDrinkSize(size),
      })),
    }),
  );

  menu.get("/menu/pricing/:size", (c) => {
    const result = drinkSizeUrlSchema.safeParse(c.req.param("size"));
    if (!result.success) {
      return c.json({ error: "Unknown drink size", field: "size" }, 400);
    }

    const size = drinkSizeUrlToDomain.get(result.value);
    return c.json({ size, ...describeDrinkSize(size) });
  });

  return menu;
}
