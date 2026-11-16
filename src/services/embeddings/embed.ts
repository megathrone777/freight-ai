import { embedBatch } from "./embedBatch";

import type { TEmbeddingKind } from "./types";

const embed = async (text: string, kind: TEmbeddingKind): Promise<number[]> => {
  const [result] = await embedBatch([text], kind);

  if (!result) {
    throw new Error("Embedding provider returned no vector.");
  }

  return result;
};

export { embed };
