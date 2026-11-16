import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const Agent: React.FC = () => {
  const { error, messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });
  const isBusy: boolean = status === "submitted" || status === "streaming";

  return (
    <div>
      <form
        className={top}
        onSubmit={searchSubmit}
      >
        <div className={search}>
          <span className={brand}>FREIGHT AI</span>

          <input
            className={input}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. 12 t truck from Praha to Zlín tomorrow"
            value={query}
          />

          {busy || isBusy ? <span className={status}>WORKING</span> : null}
        </div>

        {toolCalls.length > 0 ? (
          <div className={tools}>
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

        {assistantResponse ? <div className={meta}>{assistantResponse}</div> : null}
        {displayError ? <div className={errorClass}>{displayError}</div> : null}
      </form>
    </div>
  );
};

export { Agent };
