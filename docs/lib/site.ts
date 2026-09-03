/** Canonical public origin, including the GitHub Pages repository base path. */
export const siteUrl = "https://catofjupit3r.github.io/enumwaii";

/** Resolve a root-relative static asset under the current deployment base path. */
export function getSiteAssetPath(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}

/** Convert a site-relative path into its canonical public URL. */
export function getSiteUrl(pathname: string): string {
  return `${siteUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
