import { z } from "zod";

type EmbeddingKind = "load" | "query";

const retryDelayMs = (response: Response, retryIndex: number): number => {
  const retryAfter: null | string = response.headers.get("retry-after");

  if (retryAfter) {
    const seconds: number = +retryAfter;

    if (Number.isFinite(seconds) && seconds >= 0) {
      return seconds * 1000;
    }
    const retryAt: number = Date.parse(retryAfter);

    if (Number.isFinite(retryAt)) {
      return Math.max(0, retryAt - Date.now());
    }
  }

  return Math.min(1000 * 2 ** retryIndex, 30000);
};

const embedBatch = async (texts: string[], kind: EmbeddingKind): Promise<number[][]> => {
  const provider: string = process.env.EMBEDDING_PROVIDER ?? "voyage";

  if (provider !== "voyage") {
    throw new Error(`Unsupported embedding provider: ${provider}`);
  }
  const apiKey: string | undefined = process.env.VOYAGE_API_KEY;

  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is required to create embeddings.");
  }
  const all: number[][] = [];

  for (let start: number = 0; start < texts.length; start += 100) {
    const batch: string[] = texts.slice(start, start + 100);
    let response: Response | undefined;
    let attempts: number = 0;

    for (let retryIndex: number = 0; retryIndex <= 5; retryIndex += 1) {
      attempts = retryIndex + 1;
      const currentResponse: Response = await fetch("https://api.voyageai.com/v1/embeddings", {
        body: JSON.stringify({
          input: batch,
          input_type: kind === "query" ? "query" : "document",
          model: "voyage-4-lite",
          output_dimension: 1024,
        }),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        method: "POST",
      });

      response = currentResponse;
      if (currentResponse.ok || (currentResponse.status < 500 && currentResponse.status !== 429) || retryIndex === 5) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs(currentResponse, retryIndex)));
    }

    if (!response) {
      throw new Error("Voyage embedding request was not attempted.");
    }
    if (!response.ok) {
      const details: string = (await response.text()).replaceAll(apiKey, "[redacted]").slice(0, 500);

      throw new Error(
        `Voyage embedding request failed with status ${response.status} after ${attempts} attempts${details ? `: ${details}` : ""}.`
      );
    }
    const result: unknown = await response.json();
    const parsed: { data: Array<{ embedding: number[]; index: number }> } = z.object({
      data: z.array(z.object({ embedding: z.array(z.number()).length(1024), index: z.number().int() })),
    }).parse(result);

    all.push(...parsed.data.sort((left, right) => left.index - right.index).map(({ embedding }) => embedding));
  }
  if (all.length !== texts.length) {
    throw new Error("Embedding response count did not match the input count.");
  }

  return all;
};

const embed = async (text: string, kind: EmbeddingKind): Promise<number[]> => {
  const [result] = await embedBatch([text], kind);

  if (!result) {
    throw new Error("Embedding provider returned no vector.");
  }

  return result;
};

export { embed, embedBatch };
export type { EmbeddingKind };
