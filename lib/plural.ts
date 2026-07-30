export const pluralSuffix = (count: number): string => (count === 1 ? "" : "s");

export const countLabel = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;
