import type { ReactNode } from "react";
import { clipDepthText } from "../../lib/cognitive-depth/compression";

type Props = { max: number; children: ReactNode };

export function DepthCopy({ max, children }: Props) {
  if (typeof children === "string") {
    return <>{clipDepthText(children, max)}</>;
  }
  return <>{children}</>;
}
