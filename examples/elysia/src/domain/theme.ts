import { em } from "enumwaii";

const themes = em(["LIGHT", "DARK", "SYSTEM"]);

export const THEME = themes.enum;
export type Theme = (typeof themes)["~type"];
export const themeSchema = themes;

const themeMetadata = themes.derive(
  [
    THEME.LIGHT,
    { label: "Light theme", cssClass: "theme-light", prefersDark: false },
  ],
  [
    THEME.DARK,
    { label: "Dark theme", cssClass: "theme-dark", prefersDark: true },
  ],
  [
    THEME.SYSTEM,
    { label: "System theme", cssClass: "theme-system", prefersDark: false },
  ],
);

export function describeTheme(theme: Theme) {
  return { theme, ...themeMetadata.get(theme) };
}

export function getCurrentTheme(): Theme {
  return THEME.DARK;
}
