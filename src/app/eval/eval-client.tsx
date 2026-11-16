"use client";
import { useState } from "react";

import { colors } from "@/theme/variables";
import { Button, Spinner } from "@/ui";

import {
  cell,
  description,
  error,
  heading,
  runButton,
  stat,
  statLabel,
  stats,
  statValue,
  table,
  tableWrap,
  wrapperClass,
} from "./page.css";

const EvalClient = (): React.JSX.Element => {
  const [result, setResult] = useState<null | TEvalResult>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  const run = async (): Promise<void> => {
    setBusy(true);
    setFailure("");
    try {
      const response = await fetch("/api/eval", { method: "POST" });

      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.status}`);
      }
      setResult(await response.json());
    } catch (issue: unknown) {
      setFailure(issue instanceof Error ? issue.message : "Evaluation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={wrapperClass}>
      <h1 className={heading}>Freight AI evaluation</h1>

      <p className={description}>
        Run 15 seeded retrieval cases against active loads. Seed the database before evaluating.
      </p>

      <Button
        className={runButton}
        disabled={busy}
        onClick={() => void run()}
        size="large"
      >
        {busy ? (
          <>
            <Spinner
              color={colors.amber}
              template="small"
            />
            Running evaluation...
          </>
        ) : (
          "Run evaluation"
        )}
      </Button>

      {failure ? <div className={error}>{failure}</div> : null}

      <div className={stats}>
        <div className={stat}>
          <div className={statLabel}>Recall@5</div>
          <div className={statValue}>
            {result ? `${(result.recallAt5 * 100).toFixed(1)}%` : "—"}
          </div>
        </div>

        <div className={stat}>
          <div className={statLabel}>Avg latency</div>
          <div className={statValue}>{result ? `${Math.round(result.avgLatencyMs)} ms` : "—"}</div>
        </div>

        <div className={stat}>
          <div className={statLabel}>Pass rate</div>
          <div className={statValue}>{result ? `${(result.passRate * 100).toFixed(1)}%` : "—"}</div>
        </div>
      </div>

      {result ? (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={cell}>Result</th>
                <th className={cell}>Query</th>
                <th className={cell}>Expected load IDs</th>
                <th className={cell}>Top 5 load IDs</th>
                <th className={cell}>Recall@5</th>
                <th className={cell}>Latency</th>
              </tr>
            </thead>

            <tbody>
              {result.results.map((item) => (
                <tr key={item.query}>
                  <td className={cell}>{item.pass ? "PASS" : "FAIL"}</td>
                  <td className={cell}>{item.query}</td>
                  <td className={cell}>{item.expectedLoadIds.join(", ")}</td>
                  <td className={cell}>{item.foundLoadIds.join(", ")}</td>
                  <td className={cell}>{(item.recallAt5 * 100).toFixed(0)}%</td>
                  <td className={cell}>{item.latencyMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export { EvalClient };
