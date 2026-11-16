"use client";
import { useEffect, useMemo, useState } from "react";
import ReactMap, { Marker } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";

import { Icon } from "@/ui";

import { markerClass } from "./Map.css";

import type { TRouteFeatureCollection } from "./Map.types";

setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());

const Map: React.FC = () => {
  const [items, setItems] = useState<TLoadRecord[]>([]);

  const visibleItems = useMemo(() => {
    const currentItems: Map<string, TLoadRecord> = new Map(items.map((item) => [item.id, item]));
    const source: TLoadRecord[] = searchResult.found ? searchMatches : items;

    return source
      .map((item) => currentItems.get(item.id) ?? item)
      .filter((item) => item.status !== "expired");
  }, [items, searchMatches, searchResult.found]);

  const geoJson: TRouteFeatureCollection = useMemo<TRouteFeatureCollection>(
    (): TRouteFeatureCollection => ({
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

  // useEffect(() => {
  //   let active: boolean = true;

  //   void fetch("/api/loads").then(async (response): Promise<void> => {
  //     if (!response.ok) {
  //       throw new Error(`Could not load freight: ${response.status}`);
  //     }

  //     const result: TLoadRecord[] = await response.json();

  //     if (active) {
  //       setItems(result);
  //     }
  //   });
  // .catch((failure: unknown) =>
  //   setErrorMessage(failure instanceof Error ? failure.message : "Could not load freight.")
  // );
  //   return (): void => {
  //     active = false;
  //   };
  // }, []);

  return (
    <ReactMap
      attributionControl={false}
      initialViewState={{ latitude: 49.8, longitude: 15.4, zoom: 6.7 }}
      mapStyle="https://tiles.openfreemap.org/styles/fiord"
    >
      {visibleItems.map((item) => (
        <Marker
          anchor="center"
          className={markerClass}
          key={item.id}
          latitude={item.originLat}
          longitude={item.originLon}
        >
          <Icon
            className={markerClass}
            id="freight"
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
  );
};

export { Map };
