export interface TStoreState {
  activeLoad: null | TLoadRecord;
  priceProposal: null | TPriceProposal;
}

export interface TPriceProposal {
  accepted: boolean;
  allowedRange: { maximum: number; minimum: number };
  id: string;
  loadId: string;
  proposedPrice: number;
  targetPrice: number;
}

export interface TStoreActions {
  setActiveLoad: (activeLoad: null | TLoadRecord) => void;
  setPriceProposal: (priceProposal: TPriceProposal) => void;
}

export type TStore = TStoreState & TStoreActions;
