"use server";
import { loads } from "@/services";

const simulateLoads = async (): Promise<TLoadRecord[]> => {
  const result = await loads.simulateIncomingLoads();

  return result.loads.map((load) => ({
    ...load,
    createdAt: load.createdAt.toISOString(),
    expiresAt: load.expiresAt.toISOString(),
    pickupAt: load.pickupAt.toISOString(),
    updatedAt: load.updatedAt.toISOString(),
  }));
};

export { simulateLoads };
