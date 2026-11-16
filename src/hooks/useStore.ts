import { useStore as useZustandStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { store, type TStore } from "@/store";

const useStore = <K extends keyof TStore>(...storeKeys: K[]): Pick<TStore, K> =>
  useZustandStore(
    store,
    useShallow(
      (state) => Object.fromEntries(storeKeys.map((key) => [key, state[key]])) as Pick<TStore, K>
    )
  );

export { useStore };
