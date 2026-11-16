const Sidebar: React.FC = () => {
  return (
    <section className={leftPanel}>
      <div className={header}>
        <h1 className={title}>Available freight</h1>
        <span className={meta}>{visibleItems.length} loads</span>
      </div>

      <div className={list}>
        {visibleItems.map<React.ReactElement>((item) => (
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
  );
};

export { Sidebar };
