export const hrefWithParams = (
  basePath: string,
  current: URLSearchParams,
  updates: Readonly<Record<string, string | null | undefined>>
): string => {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      continue;
    }

    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }

  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
};
