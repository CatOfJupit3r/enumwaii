import { brandAssetPath, brandAssets, type BrandAssetName } from "@/lib/brands";
import type { ReactNode } from "react";

interface BrandIconsProps {
  readonly brands: readonly BrandAssetName[];
}

/** Render audited third-party marks with links to their official websites. */
export function BrandIcons({ brands }: BrandIconsProps) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {brands.map((name) => {
        const brand = brandAssets[name];
        const needsLightSurface = "needsLightSurface" in brand;

        return (
          <a
            aria-label={`Visit the official ${brand.label} website`}
            className={`grid size-7 place-items-center rounded-md p-0.5 transition hover:-translate-y-0.5 hover:bg-fd-accent ${needsLightSurface ? "dark:bg-zinc-400 dark:p-1 dark:hover:bg-zinc-300" : ""}`}
            href={brand.href}
            key={name}
            title={brand.label}
          >
            {/* Official, unmodified artwork. See /docs/brand-assets. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="size-5 object-contain"
              src={brandAssetPath(name)}
            />
          </a>
        );
      })}
    </span>
  );
}

interface ExampleCardProps {
  readonly brands: readonly BrandAssetName[];
  readonly children?: ReactNode;
  readonly description: ReactNode;
  readonly title: ReactNode;
}

/** Present a runnable example with its audited technology marks. */
export function ExampleCard({
  brands,
  children,
  description,
  title,
}: ExampleCardProps) {
  return (
    <article
      className="rounded-xl border bg-fd-card p-4 text-fd-card-foreground transition-colors @max-lg:col-span-full"
      data-card
    >
      <div className="not-prose mb-2 flex min-h-7 items-start justify-between gap-4">
        <h3 className="my-0 text-sm font-medium">{title}</h3>
        <BrandIcons brands={brands} />
      </div>
      <p className="my-0! text-sm text-fd-muted-foreground">{description}</p>
      <div className="prose-no-margin text-sm text-fd-muted-foreground empty:hidden">
        {children}
      </div>
    </article>
  );
}
