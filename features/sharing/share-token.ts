import type { SharingLink } from "@/domain";

export const shareTokenFor = (link: SharingLink) => link.url.split("/").at(-1) ?? link.id;
