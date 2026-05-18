import { useEffect, useState } from "react";
import { lsGet, lsSet } from "../storage";

export function useLocalStorageState(key: string, initialValue: string) {
  const [value, setValue] = useState(() => lsGet(key) ?? initialValue);

  useEffect(() => {
    lsSet(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

