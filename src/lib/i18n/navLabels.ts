import type { NavId } from "../../types";

export function navMessageKey(id: NavId): string {
  return `nav.${id}`;
}
