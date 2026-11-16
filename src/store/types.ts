export interface TStoreState {
  activeLoad: null | TLoadRecord;
}

export interface TStoreActions {
  setActiveLoad: (activeLoad: null | TLoadRecord) => void;
}

export type TStore = TStoreState & TStoreActions;
