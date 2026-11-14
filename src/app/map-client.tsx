"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMap, { Layer, Marker, NavigationControl, Source } from "react-map-gl/maplibre";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { setWorkerUrl } from "maplibre-gl";
import { z } from "zod";

import { useLoadChanges } from "@/hooks/useLoadChanges";
import { SearchLoadsOutputSchema } from "@/lib/agent/schemas";
import type { LoadRecord } from "@/lib/loads/types";
import { Icon } from "@/theme/components";
import { colors } from "@/theme/variables";

import {
  decideNegotiationAction,
  retryNegotiationAction,
  simulateLoadsAction,
  startNegotiationAction,
} from "./actions";

import {
  brand,
  button,
  card,
  chip,
  error as errorClass,
  header,
  input,
  leftPanel,
  list,
  map as mapClass,
  markerClass,
  meta,
  negotiating,
  negotiationActions,
  rightPanel,
  route,
  search,
  shell,
  status,
  success,
  timeline,
  timelineItem,
  title,
  tools,
  top,
  warning,
} from "./page.css";

setWorkerUrl("/api/maplibre-worker");

const lineSourceId: string = "load-routes";
const ToolPartSchema = z
  .object({
    output: SearchLoadsOutputSchema.optional(),
    type: z.string(),
  })
  .passthrough();

type RouteFeatureCollection = {
  features: Array<{
    geometry: { coordinates: [number, number][]; type: "LineString" };
    properties: { id: string };
    type: "Feature";
  }>;
  type: "FeatureCollection";
};
type NegotiationSnapshot = {
  messages: Array<{ createdAt: string; id: string; kind: string; price: number; status: string }>;
  negotiation: {
    currentPrice: number;
    expiresAt: string;
    id: string;
    initialPrice: number;
    loadId: string;
    status: "accepted" | "expired" | "pending" | "rejected";
  } | null;
  traces: Array<{ createdAt: string; id: string; latencyMs: number; name: string }>;
};
type SearchLoad = z.infer<typeof SearchLoadsOutputSchema>["loads"][number];

const MapClient = (): React.JSX.Element => {
  const [items, setItems] = useState<LoadRecord[]>([]);
  const [selected, setSelected] = useState<LoadRecord | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [negotiationSnapshot, setNegotiationSnapshot] = useState<NegotiationSnapshot | null>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agent" }), []);
  const { error: agentError, messages, sendMessage, status: agentStatus } = useChat({ transport });
  const agentBusy: boolean = agentStatus === "submitted" || agentStatus === "streaming";
  const currentTurnMessages = useMemo(() => {
    let lastUserMessageIndex: number = -1;

    for (let index: number = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "user") {
        lastUserMessageIndex = index;
        break;
      }
    }

    return messages.slice(lastUserMessageIndex + 1);
  }, [messages]);
  const searchResult = useMemo(() => {
    let found: boolean = false;
    const loads: SearchLoad[] = [];

    for (const message of currentTurnMessages) {
      for (const part of message.parts) {
        const parsed = ToolPartSchema.safeParse(part);

        if (parsed.success && parsed.data.type === "tool-search_loads" && parsed.data.output) {
          found = true;
          loads.push(...parsed.data.output.loads);
        }
      }
    }

    return { found, loads };
  }, [currentTurnMessages]);
  const searchMatches = searchResult.loads;
  const toolCalls = useMemo(
    () => [
      ...new Set(
        currentTurnMessages.flatMap((message) =>
          message.parts.flatMap((part) => {
            const parsed = ToolPartSchema.safeParse(part);

            return parsed.success && parsed.data.type.startsWith("tool-")
              ? [parsed.data.type.slice(5)]
              : [];
          })
        )
      ),
    ],
    [currentTurnMessages]
  );
  const assistantResponse = useMemo(
    () =>
      currentTurnMessages
        .flatMap((message) =>
          message.parts.flatMap((part) => (part.type === "text" ? [part.text] : []))
        )
        .join("")
        .trim(),
    [currentTurnMessages]
  );
  const searchReasons = useMemo(
    () => new Map(searchMatches.map(({ id, reason }) => [id, reason])),
    [searchMatches]
  );
  const visibleItems = useMemo(() => {
    const currentItems: Map<string, LoadRecord> = new Map(items.map((item) => [item.id, item]));
    const source: LoadRecord[] = searchResult.found ? searchMatches : items;

    return source
      .map((item) => currentItems.get(item.id) ?? item)
      .filter((item) => item.status !== "expired");
  }, [items, searchMatches, searchResult.found]);
  const displayError: string = agentError?.message ?? errorMessage;
  const selectedNegotiation =
    negotiationSnapshot && negotiationSnapshot.negotiation?.loadId === selected?.id
      ? negotiationSnapshot.negotiation
      : null;
  const hasCounterOffer: boolean =
    selectedNegotiation !== null &&
    (negotiationSnapshot?.messages.some((message) => message.kind === "CounterOffer") ?? false);

  const applyChanges = useCallback((changes: LoadRecord[]): void => {
    setItems((current) => {
      const combined: Map<string, LoadRecord> = new Map(current.map((item) => [item.id, item]));

      for (const item of changes) {
        combined.set(item.id, item);
      }

      return [...combined.values()];
    });
  }, []);

  useLoadChanges(applyChanges);

  useEffect(() => {
    let active: boolean = true;

    void fetch("/api/loads")
      .then(async (response): Promise<void> => {
        if (!response.ok) {
          throw new Error(`Could not load freight: ${response.status}`);
        }
        const result: LoadRecord[] = await response.json();

        if (active) {
          setItems(result);
        }
      })
      .catch((failure: unknown) =>
        setErrorMessage(failure instanceof Error ? failure.message : "Could not load freight.")
      );

    return (): void => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      return;
    }
    let active: boolean = true;
    const refresh = async (): Promise<void> => {
      const response = await fetch(`/api/loads/${encodeURIComponent(selected.id)}/negotiation`);

      if (!response.ok) {
        throw new Error(`Could not load negotiation timeline: ${response.status}`);
      }
      const result: NegotiationSnapshot = await response.json();

      if (active) {
        setNegotiationSnapshot(result);
      }
    };

    void refresh().catch((failure: unknown) =>
      setErrorMessage(failure instanceof Error ? failure.message : "Could not load negotiation.")
    );
    const timer: number = window.setInterval(() => {
      void refresh().catch((failure: unknown) =>
        setErrorMessage(failure instanceof Error ? failure.message : "Could not load negotiation.")
      );
    }, 3000);

    return (): void => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selected?.id]);

  const geoJson: RouteFeatureCollection = useMemo<RouteFeatureCollection>(
    (): RouteFeatureCollection => ({
      features: visibleItems.map((item) => ({
        geometry: {
          coordinates: [
            [item.originLon, item.originLat],
            [item.destinationLon, item.destinationLat],
          ],
          type: "LineString" as const,
        },
        properties: { id: item.id },
        type: "Feature" as const,
      })),
      type: "FeatureCollection" as const,
    }),
    [visibleItems]
  );

  const simulate = async (): Promise<void> => {
    setBusy(true);
    setErrorMessage("");
    try {
      const changed: LoadRecord[] = await simulateLoadsAction();

      applyChanges(changed);
    } catch (failure: unknown) {
      setErrorMessage(failure instanceof Error ? failure.message : "Simulation failed.");
    } finally {
      setBusy(false);
    }
  };

  const searchSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }
    setErrorMessage("");
    void sendMessage({ text: query }).catch((failure: unknown) => {
      setErrorMessage(failure instanceof Error ? failure.message : "The freight agent failed.");
    });
    setQuery("");
  };
  const startNegotiation = async (): Promise<void> => {
    if (!selected) {
      return;
    }
    setBusy(true);
    setErrorMessage("");
    try {
      await startNegotiationAction(selected.id);
      const response = await fetch(`/api/loads/${encodeURIComponent(selected.id)}/negotiation`);

      if (!response.ok) {
        throw new Error(`Could not load negotiation timeline: ${response.status}`);
      }
      setNegotiationSnapshot(await response.json());
    } catch (failure: unknown) {
      setErrorMessage(failure instanceof Error ? failure.message : "Could not start negotiation.");
    } finally {
      setBusy(false);
    }
  };
  const decideNegotiation = async (decision: "accept" | "reject"): Promise<void> => {
    if (!selectedNegotiation) {
      return;
    }
    setBusy(true);
    setErrorMessage("");
    try {
      await decideNegotiationAction({ decision, negotiationId: selectedNegotiation.id });
      const response = await fetch(
        `/api/loads/${encodeURIComponent(selectedNegotiation.loadId)}/negotiation`
      );

      if (!response.ok) {
        throw new Error(`Could not refresh negotiation timeline: ${response.status}`);
      }
      setNegotiationSnapshot(await response.json());
    } catch (failure: unknown) {
      setErrorMessage(
        failure instanceof Error ? failure.message : "Could not submit negotiation decision."
      );
    } finally {
      setBusy(false);
    }
  };
  const retryCounterOffer = async (): Promise<void> => {
    if (!selectedNegotiation) {
      return;
    }
    setBusy(true);
    setErrorMessage("");
    try {
      await retryNegotiationAction(selectedNegotiation.id);
    } catch (failure: unknown) {
      setErrorMessage(failure instanceof Error ? failure.message : "Could not retry the counteroffer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={shell}>
      <div className={mapClass}>
        <ReactMap
          attributionControl={false}
          initialViewState={{ latitude: 49.8, longitude: 15.4, zoom: 6.7 }}
          mapStyle="https://tiles.openfreemap.org/styles/fiord?v=2"
          style={{ height: "100%", width: "100%" }}
        >
          <NavigationControl position="bottom-right" />
          {visibleItems.map((item) => (
            <Marker
              anchor="center"
              className={markerClass}
              key={item.id}
              latitude={item.originLat}
              longitude={item.originLon}
            >
              <Icon
                aria-label={`Freight pickup at ${item.origin}`}
                className={markerClass}
                id="freight"
                role="img"
              />
            </Marker>
          ))}
          <Source
            data={geoJson}
            id={lineSourceId}
            type="geojson"
          >
            <Layer
              id="load-routes-line"
              paint={{ "line-color": colors.violet, "line-opacity": 0.78, "line-width": 2.5 }}
              type="line"
            />
          </Source>
        </ReactMap>
      </div>
      <form
        className={top}
        onSubmit={searchSubmit}
      >
        <div className={search}>
          <span
            aria-hidden="true"
            className={brand}
          >
            FREIGHT AI
          </span>
          <input
            aria-label="Describe your truck and route"
            className={input}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. 12 t truck from Praha to Zlín tomorrow"
            value={query}
          />
          {busy || agentBusy ? <span className={status}>WORKING</span> : null}
        </div>
        {toolCalls.length > 0 ? (
          <div
            aria-label="Agent tool calls"
            className={tools}
          >
            {toolCalls.map((toolName) => (
              <span
                className={chip}
                key={toolName}
              >
                {toolName}
              </span>
            ))}
          </div>
        ) : null}
        {assistantResponse ? (
          <div
            aria-live="polite"
            className={meta}
          >
            {assistantResponse}
          </div>
        ) : null}
        {displayError ? <div className={errorClass}>{displayError}</div> : null}
      </form>
      <section
        aria-label="Available loads"
        className={leftPanel}
      >
        <div className={header}>
          <h1 className={title}>Available freight</h1>
          <span className={meta}>{visibleItems.length} loads</span>
        </div>
        <div className={list}>
          {visibleItems.map((item) => (
            <button
              className={card}
              key={item.id}
              onClick={() => setSelected(item)}
              type="button"
            >
              <span className={route}>
                {item.origin} <span aria-hidden="true">→</span> {item.destination}
              </span>
              <div className={meta}>
                {item.weightT} t · €{Math.round(item.price).toLocaleString()} · {item.source}
              </div>
              {searchReasons.has(item.id) ? (
                <div className={meta}>{searchReasons.get(item.id)}</div>
              ) : null}
              <div className={item.status === "negotiating" ? negotiating : status}>
                {item.status}
              </div>
            </button>
          ))}
          {visibleItems.length === 0 ? (
            <div
              className={meta}
              style={{ padding: 16 }}
            >
              {searchResult.found
                ? "No active loads matched. Try a different route or pickup date."
                : "No active loads. Seed the database to begin."}
            </div>
          ) : null}
        </div>
        <div style={{ padding: 16 }}>
          <button
            className={button}
            disabled={busy}
            onClick={() => void simulate()}
            type="button"
          >
            {busy ? "Simulating…" : "Simulate incoming loads"}
          </button>
        </div>
      </section>
      {selected ? (
        <aside
          aria-label="Load details"
          className={rightPanel}
        >
          <div className={status}>NEW MATCH</div>
          <h2 className={title}>
            {selected.origin} → {selected.destination}
          </h2>
          <div className={meta}>{selected.description}</div>
          <div className={tools}>
            {toolCalls.slice(-3).map((toolName) => (
              <span
                className={chip}
                key={toolName}
              >
                {toolName}
              </span>
            ))}
          </div>
          <div className={meta}>
            {selected.weightT} t · €{Math.round(selected.price).toLocaleString()} · pickup{" "}
            {new Date(selected.pickupAt).toLocaleDateString()}
          </div>
          {selectedNegotiation ? (
            <section
              aria-label="Negotiation timeline"
              className={timeline}
            >
              <div className={selectedNegotiation.status === "accepted" ? success : warning}>
                {selectedNegotiation.status}
              </div>
              {negotiationSnapshot?.messages.map((message) => (
                <div
                  className={timelineItem}
                  key={message.id}
                >
                  <strong className={title}>
                    {message.kind} · €{message.price.toLocaleString()}
                  </strong>
                  <span className={meta}>
                    {new Date(message.createdAt).toLocaleString()} · {message.status}
                  </span>
                </div>
              ))}
              {negotiationSnapshot?.traces.length ? (
                <div className={timeline}>
                  <div className={meta}>Agent activity</div>
                  {negotiationSnapshot.traces.map((trace) => (
                    <div
                      className={timelineItem}
                      key={trace.id}
                    >
                      <strong className={title}>{trace.name}</strong>
                      <span className={meta}>
                        {trace.latencyMs} ms · {new Date(trace.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {selectedNegotiation.status === "pending" ? (
                <>
                  {!hasCounterOffer ? (
                    <>
                      <div
                        aria-live="polite"
                        className={meta}
                      >
                        Waiting for the agent's counteroffer...
                      </div>
                      <button
                        className={button}
                        disabled={busy}
                        onClick={() => void retryCounterOffer()}
                        type="button"
                      >
                        Retry counteroffer
                      </button>
                    </>
                  ) : null}
                  <div className={negotiationActions}>
                    <button
                      className={button}
                      disabled={busy || !hasCounterOffer}
                      onClick={() => void decideNegotiation("accept")}
                      type="button"
                    >
                      Accept
                    </button>
                    <button
                      className={button}
                      disabled={busy || !hasCounterOffer}
                      onClick={() => void decideNegotiation("reject")}
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                </>
              ) : null}
            </section>
          ) : (
            <button
              className={button}
              disabled={busy || selected.status !== "active"}
              onClick={() => void startNegotiation()}
              type="button"
            >
              {busy ? "Starting…" : "Start negotiation"}
            </button>
          )}
          <button
            className={button}
            onClick={() => setSelected(null)}
            type="button"
          >
            Close
          </button>
        </aside>
      ) : null}
    </main>
  );
};

export { MapClient };
