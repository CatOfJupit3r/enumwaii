import { renderRouter, screen } from "expo-router/testing-library";

import BoundaryScreen from "../src/app/boundary";

const routes = {
  index: () => null,
  report: () => null,
  boundary: BoundaryScreen,
};

describe("Expo Router deep-link boundary", () => {
  test("renders rejection and recovery for a malformed initial URL", async () => {
    await renderRouter(routes, {
      initialUrl: "/boundary?stage=ARCHIVED",
    });

    expect(screen.getByText('"ARCHIVED"')).toBeOnTheScreen();
    expect(screen.getByText("REJECTED")).toBeOnTheScreen();
    expect(screen.getByText("FALLBACK")).toBeOnTheScreen();
  });

  test("preserves repeated query values as invalid input", async () => {
    await renderRouter(routes, {
      initialUrl: "/boundary?stage=DISPATCHED&stage=ON_SITE",
    });

    expect(screen.getByText("REPEATED QUERY")).toBeOnTheScreen();
    expect(screen.getByText("REJECTED")).toBeOnTheScreen();
  });
});
