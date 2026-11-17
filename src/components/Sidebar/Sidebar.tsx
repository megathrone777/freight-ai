"use client";

import { useStore } from "@/hooks";
import { Button } from "@/ui";

import {
  cardClass,
  headerClass,
  listClass,
  metaClass,
  routeClass,
  selectedCardClass,
  statusClass,
  titleClass,
  wrapperClass,
} from "./Sidebar.css";

import type { TProps } from "./Sidebar.types";

const Sidebar: React.FC<TProps> = ({ loads }) => {
  const { activeLoad, setActiveLoad } = useStore("activeLoad", "setActiveLoad");

  const handleLoadClick = (load: TLoadRecord): void => {
    setActiveLoad(activeLoad?.id === load.id ? null : load);
  };

  return (
    <div className={wrapperClass}>
      <div className={headerClass}>
        <div className={titleClass}>Available freight</div>
        <div className={metaClass}>{loads.length} loads</div>
      </div>

      <div className={listClass}>
        {loads.map<React.ReactElement>((load) => {
          const { id } = load;

          return (
            <Button
              className={activeLoad?.id === id ? `${cardClass} ${selectedCardClass}` : cardClass}
              key={`load-${id}`}
              onClick={() => handleLoadClick(load)}
              template="tertiary"
            >
              <span className={routeClass}>
                <span>{load.origin}</span>
                <span>→</span>
                <span>{load.destination}</span>
              </span>

              <span className={metaClass}>
                {load.weightT} t <b>&middot;</b> €{Math.round(load.price).toLocaleString()}{" "}
                <b>&middot;</b> {load.source}
              </span>
              <span className={metaClass}>Pickup {load.pickupAt.slice(0, 10)}</span>
              <span className={statusClass}>{load.status}</span>
            </Button>
          );
        })}

        {loads.length === 0 ? <div className={metaClass}>No active loads found.</div> : null}
      </div>
    </div>
  );
};

export { Sidebar };
