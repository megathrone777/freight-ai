"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { z } from "zod";

import { useStickToBottom, useStore } from "@/hooks";
import type { TPriceProposal } from "@/store";
import { Button, Input, Spinner } from "@/ui";

import {
  assistantMessageClass,
  collapseButtonClass,
  conversationHeaderClass,
  errorClass,
  historyClass,
  historyContentClass,
  inputRowClass,
  labelClass,
  messageClass,
  partsClass,
  statusClass,
  userMessageClass,
  wrapperClass,
} from "./Agent.css";

import type { TProps } from "./Agent.types";

const priceProposalPartSchema = z.object({
  input: z.object({ targetPrice: z.number() }),
  output: z.object({
    accepted: z.boolean(),
    allowedRange: z.object({ maximum: z.number(), minimum: z.number() }),
    loadId: z.string(),
    proposedPrice: z.number(),
  }),
  state: z.literal("output-available"),
  toolCallId: z.string(),
  toolName: z.string().optional(),
  type: z.string(),
});

const readPriceProposal = (part: unknown): null | TPriceProposal => {
  const parsed = priceProposalPartSchema.safeParse(part);

  if (
    !parsed.success ||
    (parsed.data.type !== "tool-proposePrice" &&
      !(parsed.data.type === "dynamic-tool" && parsed.data.toolName === "proposePrice"))
  ) {
    return null;
  }

  return {
    ...parsed.data.output,
    id: parsed.data.toolCallId,
    targetPrice: parsed.data.input.targetPrice,
  };
};

const Agent: React.FC<TProps> = ({ loads }) => {
  const { setContainer, setContent } = useStickToBottom();
  const { setActiveLoad, setPriceProposal } = useStore("setActiveLoad", "setPriceProposal");
  const { error, messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const processedProposalRef = useRef<null | string>(null);
  const isBusy: boolean = status === "submitted" || status === "streaming";

  const sendQuery = (): void => {
    const text: string = query.trim();

    if (!text || isBusy) {
      return;
    }

    void sendMessage({ text });
    setQuery("");
  };

  const handleInputChange = ({ currentTarget }: React.SyntheticEvent<HTMLInputElement>): void => {
    setQuery(currentTarget.value);
  };

  const handleCollapseToggle = (): void => {
    setIsCollapsed((prevIsCollapsed: boolean): boolean => !prevIsCollapsed);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      sendQuery();
    }
  };

  useEffect((): void => {
    for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
      const message = messages[messageIndex];

      if (!message) continue;

      for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
        const proposal = readPriceProposal(message.parts[partIndex]);

        if (!proposal || processedProposalRef.current === proposal.id) continue;

        processedProposalRef.current = proposal.id;
        setPriceProposal(proposal);

        const load = loads.find(({ id }) => id === proposal.loadId);

        if (load) setActiveLoad(load);

        return;
      }
    }
  }, [loads, messages, setActiveLoad, setPriceProposal]);

  return (
    <div className={wrapperClass}>
      {messages.length ? (
        <div className={conversationHeaderClass}>
          <p>Conversation</p>

          <Button
            className={collapseButtonClass}
            onClick={handleCollapseToggle}
            size="small"
            template="secondary"
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </Button>
        </div>
      ) : null}

      {messages.length > 0 && !isCollapsed ? (
        <div
          className={historyClass}
          ref={setContainer}
        >
          <div
            className={historyContentClass}
            ref={setContent}
          >
            {messages.map<React.ReactElement>(({ id, parts, role }) => (
              <div
                className={`
                  ${messageClass} 
                  ${role === "user" ? userMessageClass : assistantMessageClass}
                `}
                key={`message-${id}`}
              >
                <p className={labelClass}>{role === "user" ? "You" : "Freight AI"}</p>

                {parts && !!parts.length && (
                  <div className={partsClass}>
                    {parts.map<string>((part) => (part.type === "text" ? part.text : "")).join("")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isBusy ? (
        <div className={statusClass}>
          <Spinner template="small" />
          <span>Thinking...</span>
        </div>
      ) : null}

      {error ? <div className={errorClass}>{error.message}</div> : null}

      <div className={inputRowClass}>
        <Input
          autoComplete="off"
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="e.g. 12t truck from Praha to Zlín tomorrow"
          value={query}
        />

        <Button
          disabled={!query.trim() || isBusy}
          onClick={sendQuery}
          size="large"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export { Agent };
