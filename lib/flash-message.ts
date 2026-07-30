"use client";

const flashMessageKey = "vibra.projects.feedback";

export const hrefWithFlashMessage = (href: string, message: string): string => {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  params.set("feedback", message);

  return `${path}?${params.toString()}`;
};

export const readAndClearFlashMessage = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(flashMessageKey);
  window.sessionStorage.removeItem(flashMessageKey);
  return value;
};

export const writeFlashMessage = (message: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(flashMessageKey, message);
};
