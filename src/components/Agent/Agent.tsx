"use client";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { useStickToBottom } from "@/hooks";
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

const Agent: React.FC = () => {
  const { setContainer, setContent } = useStickToBottom();
  const { error, messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const isBusy: boolean = status === "submitted" || status === "streaming";

  const sendQuery = (): void => {
    const text: string = query.trim();

    if (!text || isBusy) {
      return;
    }

    void sendMessage({ text });
    setQuery("");
  };

  const handleCollapseToggle = (): void => {
    setIsCollapsed((prevIsCollapsed: boolean): boolean => !prevIsCollapsed);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      sendQuery();
    }
  };

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
            {messages.map<React.ReactElement>((message) => (
              <div
                className={`${messageClass} ${
                  message.role === "user" ? userMessageClass : assistantMessageClass
                }`}
                key={message.id}
              >
                <p className={labelClass}>{message.role === "user" ? "You" : "Freight AI"}</p>

                {message && message.parts && !!message.parts.length && (
                  <div className={partsClass}>
                    {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
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
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="e.g. 12 t truck from Praha to Zlín tomorrow"
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
