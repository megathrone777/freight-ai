import { create } from "zustand";

import { actions } from "./actions";
import { initialState } from "./initialState";

import type { TStore } from "./types";

const store = create<TStore>((...params) => ({
  ...initialState,
  ...actions(...params),
}));

export { store };
