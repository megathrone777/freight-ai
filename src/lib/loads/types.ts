type LoadRecord = {
  createdAt: string;
  description: string;
  destination: string;
  destinationLat: number;
  destinationLon: number;
  expiresAt: string;
  id: string;
  origin: string;
  originLat: number;
  originLon: number;
  pickupAt: string;
  price: number;
  source: string;
  status: "active" | "expired" | "negotiating";
  updatedAt: string;
  weightT: number;
};

export type { LoadRecord };
