import { getSiteAssetPath } from "@/lib/site";

interface ProjectMarkProps {
  readonly size?: number;
}

/** Render the color-mode-neutral enumwaii project mark. */
export function ProjectMark({ size = 32 }: ProjectMarkProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      height={size}
      src={getSiteAssetPath("/icon.png")}
      width={size}
    />
  );
}
