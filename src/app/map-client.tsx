// "use client";
// import { useCallback, useEffect, useMemo, useState } from "react";

// import { z } from "zod";

// import {
//   decideNegotiation,
//   retryNegotiation,
//   simulateLoads,
//   startNegotiation,
// } from "@/app/_actions";
// import { useLoadChanges } from "@/hooks/useLoadChanges";
// import { Icon } from "@/theme/components";
// import { colors } from "@/theme/variables";

// import {
//   brand,
//   button,
//   card,
//   chip,
//   error as errorClass,
//   header,
//   input,
//   leftPanel,
//   list,
//   map as mapClass,
//   markerClass,
//   meta,
//   negotiating,
//   negotiationActions,
//   rightPanel,
//   route,
//   search,
//   shell,
//   status,
//   success,
//   timeline,
//   timelineItem,
//   title,
//   tools,
//   top,
//   warning,
// } from "./page.css";

// const lineSourceId: string = "load-routes";

// const searchLoadsOutputSchema = z.object({
//   loads: z.array(
//     z.object({
//       createdAt: z.iso.datetime(),
//       description: z.string(),
//       destination: z.string(),
//       destinationLat: z.number(),
//       destinationLon: z.number(),
//       expiresAt: z.iso.datetime(),
//       id: z.string(),
//       origin: z.string(),
//       originLat: z.number(),
//       originLon: z.number(),
//       pickupAt: z.iso.datetime(),
//       price: z.number(),
//       reason: z.string(),
//       similarity: z.number(),
//       source: z.string(),
//       status: z.enum(["active", "negotiating", "expired"]),
//       updatedAt: z.iso.datetime(),
//       weightT: z.number(),
//     })
//   ),
// });

// const toolPartSchema = z.looseObject({
//   output: searchLoadsOutputSchema.optional(),
//   type: z.string(),
// });

// type TNegotiationSnapshot = {
//   messages: Array<{ createdAt: string; id: string; kind: string; price: number; status: string }>;
//   negotiation: {
//     currentPrice: number;
//     expiresAt: string;
//     id: string;
//     initialPrice: number;
//     loadId: string;
//     status: "accepted" | "expired" | "pending" | "rejected";
//   } | null;
//   traces: Array<{ createdAt: string; id: string; latencyMs: number; name: string }>;
// };

// type TSearchLoad = z.infer<typeof searchLoadsOutputSchema>["loads"][number];

// const MapClient: React.FC = () => {
//   const [items, setItems] = useState<TLoadRecord[]>([]);
//   const [selected, setSelected] = useState<null | TLoadRecord>(null);
//   const [query, setQuery] = useState("");
//   const [busy, setBusy] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [negotiationSnapshot, setNegotiationSnapshot] = useState<null | TNegotiationSnapshot>(null);

//   const currentTurnMessages = useMemo(() => {
//     let lastUserMessageIndex: number = -1;

//     for (let index: number = messages.length - 1; index >= 0; index -= 1) {
//       if (messages[index]?.role === "user") {
//         lastUserMessageIndex = index;
//         break;
//       }
//     }

//     return messages.slice(lastUserMessageIndex + 1);
//   }, [messages]);

//   const searchResult = useMemo(() => {
//     let found: boolean = false;
//     const loads: TSearchLoad[] = [];

//     for (const message of currentTurnMessages) {
//       for (const part of message.parts) {
//         const parsed = toolPartSchema.safeParse(part);

//         if (parsed.success && parsed.data.type === "tool-search_loads" && parsed.data.output) {
//           found = true;
//           loads.push(...parsed.data.output.loads);
//         }
//       }
//     }

//     return { found, loads };
//   }, [currentTurnMessages]);

//   const searchMatches = searchResult.loads;

//   const toolCalls = useMemo(
//     () => [
//       ...new Set(
//         currentTurnMessages.flatMap((message) =>
//           message.parts.flatMap((part) => {
//             const parsed = toolPartSchema.safeParse(part);

//             return parsed.success && parsed.data.type.startsWith("tool-")
//               ? [parsed.data.type.slice(5)]
//               : [];
//           })
//         )
//       ),
//     ],
//     [currentTurnMessages]
//   );

//   const assistantResponse = useMemo(
//     () =>
//       currentTurnMessages
//         .flatMap((message) =>
//           message.parts.flatMap((part) => (part.type === "text" ? [part.text] : []))
//         )
//         .join("")
//         .trim(),
//     [currentTurnMessages]
//   );

//   const searchReasons = useMemo(
//     () => new Map(searchMatches.map(({ id, reason }) => [id, reason])),
//     [searchMatches]
//   );

//   const displayError: string = agentError?.message ?? errorMessage;

//   const selectedNegotiation =
//     negotiationSnapshot && negotiationSnapshot.negotiation?.loadId === selected?.id
//       ? negotiationSnapshot.negotiation
//       : null;

//   const hasCounterOffer: boolean =
//     selectedNegotiation !== null &&
//     (negotiationSnapshot?.messages.some((message) => message.kind === "CounterOffer") ?? false);

//   const applyChanges = useCallback((changes: TLoadRecord[]): void => {
//     setItems((current) => {
//       const combined: Map<string, TLoadRecord> = new Map(current.map((item) => [item.id, item]));

//       for (const item of changes) {
//         combined.set(item.id, item);
//       }

//       return [...combined.values()];
//     });
//   }, []);

//   useLoadChanges(applyChanges);

//   useEffect(() => {
//     let active: boolean = true;

//     void fetch("/api/loads")
//       .then(async (response): Promise<void> => {
//         if (!response.ok) {
//           throw new Error(`Could not load freight: ${response.status}`);
//         }
//         const result: TLoadRecord[] = await response.json();

//         if (active) {
//           setItems(result);
//         }
//       })
//       .catch((failure: unknown) =>
//         setErrorMessage(failure instanceof Error ? failure.message : "Could not load freight.")
//       );

//     return (): void => {
//       active = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (!selected) {
//       return;
//     }
//     let active: boolean = true;
//     const refresh = async (): Promise<void> => {
//       const response = await fetch(`/api/loads/${encodeURIComponent(selected.id)}/negotiation`);

//       if (!response.ok) {
//         throw new Error(`Could not load negotiation timeline: ${response.status}`);
//       }
//       const result: TNegotiationSnapshot = await response.json();

//       if (active) {
//         setNegotiationSnapshot(result);
//       }
//     };

//     void refresh().catch((failure: unknown) =>
//       setErrorMessage(failure instanceof Error ? failure.message : "Could not load negotiation.")
//     );
//     const timer: number = window.setInterval(() => {
//       void refresh().catch((failure: unknown) =>
//         setErrorMessage(failure instanceof Error ? failure.message : "Could not load negotiation.")
//       );
//     }, 3000);

//     return (): void => {
//       active = false;
//       window.clearInterval(timer);
//     };
//   }, [selected?.id]);

//   const simulate = async (): Promise<void> => {
//     setBusy(true);
//     setErrorMessage("");

//     try {
//       const changed: TLoadRecord[] = await simulateLoads();

//       applyChanges(changed);
//     } catch (failure: unknown) {
//       setErrorMessage(failure instanceof Error ? failure.message : "Simulation failed.");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const searchSubmit = (event: React.SubmitEvent<HTMLFormElement>): void => {
//     event.preventDefault();
//     if (!query.trim()) return;

//     setErrorMessage("");

//     void sendMessage({ text: query }).catch((failure: unknown) => {
//       setErrorMessage(failure instanceof Error ? failure.message : "The freight agent failed.");
//     });

//     setQuery("");
//   };

//   const _startNegotiation = async (): Promise<void> => {
//     if (!selected) {
//       return;
//     }
//     setBusy(true);
//     setErrorMessage("");

//     try {
//       await startNegotiation(selected.id);
//       const response = await fetch(`/api/loads/${encodeURIComponent(selected.id)}/negotiation`);

//       if (!response.ok) {
//         throw new Error(`Could not load negotiation timeline: ${response.status}`);
//       }
//       setNegotiationSnapshot(await response.json());
//     } catch (failure: unknown) {
//       setErrorMessage(failure instanceof Error ? failure.message : "Could not start negotiation.");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const _decideNegotiation = async (decision: "accept" | "reject"): Promise<void> => {
//     if (!selectedNegotiation) {
//       return;
//     }
//     setBusy(true);
//     setErrorMessage("");

//     try {
//       await decideNegotiation({ decision, negotiationId: selectedNegotiation.id });
//       const response = await fetch(
//         `/api/loads/${encodeURIComponent(selectedNegotiation.loadId)}/negotiation`
//       );

//       if (!response.ok) {
//         throw new Error(`Could not refresh negotiation timeline: ${response.status}`);
//       }
//       setNegotiationSnapshot(await response.json());
//     } catch (failure: unknown) {
//       setErrorMessage(
//         failure instanceof Error ? failure.message : "Could not submit negotiation decision."
//       );
//     } finally {
//       setBusy(false);
//     }
//   };

//   const _retryCounterOffer = async (): Promise<void> => {
//     if (!selectedNegotiation) return;
//     setBusy(true);
//     setErrorMessage("");

//     try {
//       await retryNegotiation(selectedNegotiation.id);
//     } catch (failure: unknown) {
//       setErrorMessage(
//         failure instanceof Error ? failure.message : "Could not retry the counteroffer."
//       );
//     } finally {
//       setBusy(false);
//     }
//   };

//   return <main className={shell}></main>;
// };

// export { MapClient };
