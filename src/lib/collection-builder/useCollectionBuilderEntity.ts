import { useMemo } from "react";
import { buildCollectionEntity } from "./derive";
import type { CollectionEntity } from "./types";
import { useCollectionDeriveInput } from "./useCollectionDeriveInput";

export function useCollectionBuilderEntity(): CollectionEntity {
  const base = useCollectionDeriveInput();
  return useMemo(() => buildCollectionEntity({ ...base, candidateSalt: 0 }), [base]);
}
