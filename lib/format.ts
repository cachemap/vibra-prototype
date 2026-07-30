const displayDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});

// Asset-library date format from features/libraries.
export const formatAssetDate = (value: string): string =>
  displayDateFormatter.format(new Date(value));

// Project-list date format from features/projects-list.
export const formatProjectDate = (value: string): string =>
  displayDateFormatter.format(new Date(value));

export const formatSeconds = (seconds: number): string =>
  `${seconds.toFixed(seconds % 1 === 0 ? 0 : 2)}s`;
