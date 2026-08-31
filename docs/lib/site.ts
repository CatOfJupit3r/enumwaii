/** Canonical public origin, including the GitHub Pages repository base path. */
export const siteUrl = "https://catofjupit3r.github.io/enumwaii";

/** Convert a site-relative path into its canonical public URL. */
export function getSiteUrl(pathname: string): string {
  return `${siteUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
