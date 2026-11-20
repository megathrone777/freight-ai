import type { StateCreator } from "zustand";
import type { TPriceProposal, TStore, TStoreActions } from "./types";

const actions: StateCreator<TStore, [], [], TStoreActions> = (set) => ({
  setActiveLoad: (activeLoad) =>
    set({
      activeLoad,
    }),
  setPriceProposal: (priceProposal: TPriceProposal) =>
    set({
      priceProposal,
    }),
});

export { actions };
