import { useMemo } from "react";
import { buildCollectionExecutionPipeline } from "./buildCollectionExecutionPipeline";
import type { CollectionEntity } from "./types";
import type { CollectionPipelineBundle } from "./pipeline-types";
import { useCollectionPipelineInputWithoutEntity } from "./useCollectionPipelineInputWithoutEntity";

export function useCollectionPipelineForEntity(entity: CollectionEntity): CollectionPipelineBundle {
  const input = useCollectionPipelineInputWithoutEntity();

  return useMemo(
    () => buildCollectionExecutionPipeline({ ...input, entity }),
    [entity, input],
  );
}
