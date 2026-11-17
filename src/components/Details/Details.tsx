"use client";
import { useCallback, useEffect, useState } from "react";

import { decideNegotiation, retryNegotiation, startNegotiation } from "@/app/_actions";
import { useStore } from "@/hooks";
import { Button, Spinner } from "@/ui";

import { negotiationSnapshotSchema } from "./Details.types";

import {
  actionsClass,
  errorClass,
  headingClass,
  loadingClass,
  messageClass,
  messagesClass,
  metaClass,
  noticeClass,
  routeClass,
  statusClass,
  wrapperClass,
} from "./Details.css";

import type { TNegotiationSnapshot } from "./Details.types";

const Details: React.FC = () => {
  const { activeLoad } = useStore("activeLoad");
  const [snapshotState, setSnapshotState] = useState<{
    loadId: string;
    snapshot: TNegotiationSnapshot;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorState, setErrorState] = useState<{ loadId: string; message: string } | null>(null);
  const [noticeState, setNoticeState] = useState<{ loadId: string; message: string } | null>(null);
  const loadId = activeLoad?.id ?? null;
  const snapshot = snapshotState?.loadId === loadId ? snapshotState.snapshot : null;
  const errorMessage = errorState?.loadId === loadId ? errorState.message : null;
  const notice = noticeState?.loadId === loadId ? noticeState.message : null;
  const counterOffer = snapshot?.messages.find((message) => message.kind === "CounterOffer");
  const negotiation = snapshot?.negotiation ?? null;
  const isExpired: boolean =
    negotiation?.status === "pending" && Date.parse(negotiation.expiresAt) <= Date.now();
  const shouldPoll: boolean = negotiation?.status === "pending" && !counterOffer && !isExpired;
  const isLoading: boolean = Boolean(loadId && !snapshot && !errorMessage);
  const canStartNegotiation: boolean =
    activeLoad?.status === "active" &&
    (!negotiation ||
      negotiation.status === "rejected" ||
      negotiation.status === "expired" ||
      isExpired);

  const refreshSnapshot = useCallback(
    async (inputLoadId: string, signal?: AbortSignal): Promise<void> => {
      try {
        const response = await fetch(`/api/loads/${encodeURIComponent(inputLoadId)}/negotiation`, {
          cache: "no-store",
          signal,
        });

        if (!response.ok) {
          throw new Error(`Could not load negotiation details (${response.status}).`);
        }

        const parsed = negotiationSnapshotSchema.safeParse(await response.json());

        if (!parsed.success) {
          throw new Error("The server returned invalid negotiation details.");
        }

        if (inputLoadId === loadId) {
          setSnapshotState({ loadId: inputLoadId, snapshot: parsed.data });
          setErrorState((currentError) =>
            currentError?.loadId === inputLoadId ? null : currentError
          );
        }
      } catch (failure) {
        if (
          inputLoadId === loadId &&
          !(failure instanceof DOMException && failure.name === "AbortError")
        ) {
          setErrorState({
            loadId: inputLoadId,
            message: failure instanceof Error ? failure.message : "Could not load negotiation.",
          });
        }
      }
    },
    [loadId]
  );

  useEffect(() => {
    if (!loadId) return;

    const controller = new AbortController();

    void refreshSnapshot(loadId, controller.signal);

    return (): void => {
      controller.abort();
    };
  }, [loadId, refreshSnapshot]);

  useEffect(() => {
    if (!loadId || !shouldPoll) return;

    const intervalId: number = window.setInterval((): void => {
      void refreshSnapshot(loadId);
    }, 2500);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, [loadId, refreshSnapshot, shouldPoll]);

  const runNegotiationAction = async (
    action: () => Promise<void>,
    successNotice: string
  ): Promise<void> => {
    if (!activeLoad) return;

    setIsBusy(true);
    setErrorState(null);
    setNoticeState(null);

    try {
      await action();
      setNoticeState({ loadId: activeLoad.id, message: successNotice });
      await refreshSnapshot(activeLoad.id);
    } catch (failure) {
      setErrorState({
        loadId: activeLoad.id,
        message: failure instanceof Error ? failure.message : "Negotiation action failed.",
      });
    } finally {
      setIsBusy(false);
    }
  };

  if (!activeLoad) return null;

  const handleStartNegotiation = async (): Promise<void> => {
    await runNegotiationAction(async (): Promise<void> => {
      await startNegotiation(activeLoad.id);
    }, "Negotiation started. Waiting for the agent's counteroffer.");
  };

  const handleRetryNegotiation = async (): Promise<void> => {
    if (!negotiation) return;

    await runNegotiationAction(async (): Promise<void> => {
      await retryNegotiation(negotiation.id);
    }, "Counteroffer requested.");
  };

  const handleDecision = async (decision: "accept" | "reject"): Promise<void> => {
    if (!negotiation) return;

    await runNegotiationAction(
      async (): Promise<void> => {
        await decideNegotiation({ decision, negotiationId: negotiation.id });
      },

      decision === "accept" ? "Counteroffer accepted." : "Counteroffer rejected."
    );
  };

  return (
    <div className={wrapperClass}>
      <h2 className={headingClass}>Load details</h2>

      <div className={routeClass}>
        {activeLoad.origin} → {activeLoad.destination}
      </div>

      <div className={metaClass}>
        {activeLoad.description}
        <br />
        {activeLoad.weightT} t <b>&middot;</b> €{Math.round(activeLoad.price).toLocaleString()}{" "}
        <b>&middot;</b>
        pickup {activeLoad.pickupAt.slice(0, 10)}
      </div>

      {negotiation ? (
        <>
          <div className={statusClass}>
            Negotiation {isExpired ? "expired" : negotiation.status}
          </div>

          <div className={metaClass}>
            Listed price €{negotiation.initialPrice.toLocaleString()} · current offer €
            {negotiation.currentPrice.toLocaleString()}
          </div>

          {snapshot?.messages.length ? (
            <div className={messagesClass}>
              {snapshot.messages.map((message) => (
                <div
                  className={messageClass}
                  key={message.id}
                >
                  <span>{message.kind}</span>
                  <span>€{message.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : isLoading ? (
        <div className={loadingClass}>
          <Spinner template="small" />
          <span className={metaClass}>Loading negotiation…</span>
        </div>
      ) : null}

      {negotiation?.status === "pending" && !isExpired && counterOffer ? (
        <div className={actionsClass}>
          <Button
            disabled={isBusy}
            onClick={() => void handleDecision("accept")}
          >
            Accept counteroffer
          </Button>

          <Button
            disabled={isBusy}
            onClick={() => void handleDecision("reject")}
            template="secondary"
          >
            Reject
          </Button>
        </div>
      ) : negotiation?.status === "pending" && !isExpired ? (
        <div className={loadingClass}>
          <Spinner template="small" />
          <span className={metaClass}>Waiting for the agent's counteroffer...</span>

          <Button
            disabled={isBusy}
            onClick={handleRetryNegotiation}
            size="small"
            template="secondary"
          >
            Retry
          </Button>
        </div>
      ) : canStartNegotiation ? (
        <Button
          disabled={isBusy || isLoading}
          onClick={handleStartNegotiation}
        >
          {negotiation ? "Start new negotiation" : "Start negotiation"}
        </Button>
      ) : isExpired ? (
        <div className={metaClass}>The negotiation expired before a counteroffer was received.</div>
      ) : null}

      {isBusy ? (
        <div className={loadingClass}>
          <Spinner template="small" />
          <span className={metaClass}>Updating negotiation...</span>
        </div>
      ) : null}

      {notice ? <div className={noticeClass}>{notice}</div> : null}
      {errorMessage && !isExpired ? <div className={errorClass}>{errorMessage}</div> : null}
    </div>
  );
};

export { Details };
