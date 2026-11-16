import { sources } from "@/globals";

import { generateFeedLoad } from "./generateFeedLoad";
import { makeChoice } from "./makeChoice";
import { seededRandom } from "./seededRandom";

const generateIncomingLoads = (count: number): TNormalizedLoad[] => {
  const random: TRandom = seededRandom(Date.now());

  return Array.from({ length: count }, () => generateFeedLoad(random, makeChoice(random, sources)));
};

export { generateIncomingLoads };
