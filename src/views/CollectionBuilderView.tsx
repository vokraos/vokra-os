import type { NavId } from "../types";
import { CollectionWorkshop } from "./CollectionWorkshop";

type Props = { onNavigate: (id: NavId) => void };

export function CollectionBuilderView({ onNavigate }: Props) {
  return <CollectionWorkshop onNavigate={onNavigate} />;
}
