import { sources } from "@/globals";

import { generateFeedLoad } from "./generateFeedLoad";
import { makeChoice } from "./makeChoice";
import { normalizeLoad } from "./normalizeLoad";
import { seededRandom } from "./seededRandom";
import { toRaw } from "./toRaw";

const duplicatePhrases: string[] = [
  "Available freight: ",
  "Urgent carrier request: ",
  "Matching shipment: ",
];

const generateSeedLoads = (limit = 2000, seed = 19940217): TNormalizedLoad[] => {
  const random: TRandom = seededRandom(seed);
  const loads: TNormalizedLoad[] = [];
  const uniqueCount: number = Math.max(1, Math.round(limit * 0.92));

  for (let index: number = 0; index < uniqueCount; index += 1) {
    const source: TRawSource = makeChoice(random, sources);

    loads.push(
      generateFeedLoad(random, source, random() < 0.05, `seed-${`${index}`.padStart(4, "0")}`)
    );
  }

  for (let index: number = uniqueCount; index < limit; index += 1) {
    const original: TNormalizedLoad | undefined = loads[Math.floor(random() * uniqueCount)];

    if (!original) {
      throw new Error("Seed duplicate could not be generated.");
    }

    const duplicateSource: TRawSource =
      sources[(sources.indexOf(original.source as TRawSource) + 1) % sources.length] ?? sources[0]!;
    const variation: number = 0.97 + random() * 0.06;
    const base: TNormalizedLoad = {
      ...original,
      description: `${makeChoice(random, duplicatePhrases)}${original.description}`,
      id: `seed-duplicate-${`${index}`.padStart(4, "0")}`,
      price: +(original.price * variation).toFixed(2),
      source: duplicateSource,
    };

    loads.push(normalizeLoad(toRaw(base, duplicateSource), duplicateSource));
  }

  return loads;
};

export { generateSeedLoads };
