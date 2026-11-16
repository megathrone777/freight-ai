import { evalCases } from "@/globals";
import { executeSearchLoads } from "@/services/agent/tools/searchLoads";

const runFreightEval = async (): Promise<TEvalResult> => {
  const results: TEvalResult["results"] = [];

  for (const testCase of evalCases) {
    const startedAt: number = Date.now();
    const output = await executeSearchLoads(testCase.input);
    const latencyMs: number = Date.now() - startedAt;
    const foundLoadIds: string[] = output.loads.slice(0, 5).map(({ id }) => id);
    const foundExpected: number = testCase.expectedLoadIds.filter((id) =>
      foundLoadIds.includes(id)
    ).length;

    results.push({
      expectedLoadIds: testCase.expectedLoadIds,
      foundLoadIds,
      latencyMs,
      pass: foundExpected === testCase.expectedLoadIds.length,
      query: testCase.query,
      recallAt5: foundExpected / testCase.expectedLoadIds.length,
    });
  }
  const passCount: number = results.filter(({ pass }) => pass).length;

  return {
    avgLatencyMs: results.reduce((sum, { latencyMs }) => sum + latencyMs, 0) / results.length,
    passRate: passCount / results.length,
    recallAt5: results.reduce((sum, result) => sum + result.recallAt5, 0) / results.length,
    results,
  };
};

export { runFreightEval };
