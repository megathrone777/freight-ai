import { embed } from "./embed";
import { embedBatch } from "./embedBatch";

const embeddings = {
  embed,
  embedBatch,
};

export type { TEmbeddingKind } from "./types";
export { embeddings };
