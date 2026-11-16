import type { TSearchLoadsInput } from "@/services/agent/tools/searchLoads";

declare global {
  interface TEvalCase {
    expectedLoadIds: string[];
    input: TSearchLoadsInput;
    query: string;
  }

  interface TEvalResult {
    avgLatencyMs: number;
    passRate: number;
    recallAt5: number;
    results: Array<{
      expectedLoadIds: string[];
      foundLoadIds: string[];
      latencyMs: number;
      pass: boolean;
      query: string;
      recallAt5: number;
    }>;
  }
}

export {};
