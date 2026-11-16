const Details: React.FC = () => {
  if (selected) {
    return (
      <aside className={rightPanel}>
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
                      onClick={() => void _retryCounterOffer()}
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
                    onClick={() => void _decideNegotiation("accept")}
                    type="button"
                  >
                    Accept
                  </button>
                  <button
                    className={button}
                    disabled={busy || !hasCounterOffer}
                    onClick={() => void _decideNegotiation("reject")}
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
            onClick={() => void _startNegotiation()}
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
    );
  }

  return null;
};

export { Details };
