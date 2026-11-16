import { haversineKm } from "./feeds";
import { expireLoads, ingestLoads, recordTrace } from "./ingest";

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
};

export { loads };
