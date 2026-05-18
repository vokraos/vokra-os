import { useCollectionBuilderEntity } from "./useCollectionBuilderEntity";
import { useCollectionPipelineForEntity } from "./useCollectionPipelineForEntity";
import type { CollectionPipelineBundle } from "./pipeline-types";

/** Primary collection (salt 0) execution pipeline — delegates to shared entity pipeline builder. */
export function useCollectionExecutionPipeline(): CollectionPipelineBundle {
  const entity = useCollectionBuilderEntity();
  return useCollectionPipelineForEntity(entity);
}
