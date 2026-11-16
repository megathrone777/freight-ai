import { randomUUID } from "node:crypto";

import { makeBaseLoad } from "./makeBaseLoad";
import { normalizeLoad } from "./normalizeLoad";
import { toRaw } from "./toRaw";

const generateFeedLoad = (
  random: TRandom,
  source: TRawSource,
  expired = false,
  id: string = randomUUID()
): TNormalizedLoad => {
  const base: TNormalizedLoad = makeBaseLoad(random, source, id, expired);

  return normalizeLoad(toRaw(base, source), source);
};

export { generateFeedLoad };
