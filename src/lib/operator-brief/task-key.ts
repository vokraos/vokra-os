import type { OperatorTaskSource } from "./types";

export function operatorTaskKey(source: OperatorTaskSource, id: string): string {
  return `${source}:${id}`;
}

export function parseOperatorTaskKey(key: string): { source: OperatorTaskSource; id: string } | null {
  const i = key.indexOf(":");
  if (i <= 0) return null;
  const source = key.slice(0, i) as OperatorTaskSource;
  const id = key.slice(i + 1);
  if (!id) return null;
  return { source, id };
}
