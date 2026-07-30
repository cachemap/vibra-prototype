// Current asset-library date format from app/libraries/page.tsx.
export const formatAssetDate = (value: string): string =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));

// Current project-list date format from app/projects/page.tsx.
export const formatProjectDate = (value: string): string =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));

export const formatSeconds = (seconds: number): string =>
  `${seconds.toFixed(seconds % 1 === 0 ? 0 : 2)}s`;
