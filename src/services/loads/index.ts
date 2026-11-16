import { haversineKm } from "./feeds";
import { expireLoads, ingestLoads, recordTrace } from "./ingest";
import { simulateIncomingLoads } from "./simulateIncomingLoads";

const feeds = {
  haversineKm,
};

const ingest = {
  expireLoads,
  ingestLoads,
  recordTrace,
};

const loads = {
  feeds,
  ingest,
  simulateIncomingLoads,
};

export { loads };
