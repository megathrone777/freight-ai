"use client";

import { Fragment, useEffect, useRef } from "react";
import ReactMap, { Layer, Marker, Source } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";

import { useStore } from "@/hooks/useStore";
import { colors } from "@/theme/variables";
import { Icon } from "@/ui";

import { addressMarkerClass, markerClass, wrapperClass } from "./Map.css";

import type { MapRef } from "react-map-gl/maplibre";
import type { TProps, TRouteFeatureCollection } from "./Map.types";

setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());

const Map: React.FC<TProps> = ({ loads }) => {
  const { activeLoad } = useStore("activeLoad");
  const mapRef = useRef<MapRef>(null);
  const visibleLoads: TLoadRecord[] = activeLoad ? [activeLoad] : loads;
  const routes: TRouteFeatureCollection = {
    features: visibleLoads.map((load) => ({
      geometry: {
        coordinates: [
          [load.originLon, load.originLat],
          [load.destinationLon, load.destinationLat],
        ],
        type: "LineString",
      },
      properties: { id: load.id },
      type: "Feature",
    })),
    type: "FeatureCollection",
  };

  useEffect(() => {
    if (!activeLoad) {
      return;
    }

    const westSouth: [number, number] = [
      Math.min(activeLoad.originLon, activeLoad.destinationLon),
      Math.min(activeLoad.originLat, activeLoad.destinationLat),
    ];
    const eastNorth: [number, number] = [
      Math.max(activeLoad.originLon, activeLoad.destinationLon),
      Math.max(activeLoad.originLat, activeLoad.destinationLat),
    ];

    mapRef.current?.fitBounds([westSouth, eastNorth], {
      duration: 900,
      maxZoom: 10,
      padding: 88,
    });
  }, [activeLoad]);

  return (
    <div className={wrapperClass}>
      <ReactMap
        attributionControl={false}
        initialViewState={{ latitude: 49.8, longitude: 15.4, zoom: 6.7 }}
        mapStyle="https://tiles.openfreemap.org/styles/fiord"
        ref={mapRef}
        style={{ height: "100%", width: "100%" }}
      >
        {visibleLoads.map((load) => (
          <Fragment key={load.id}>
            <Marker
              anchor="center"
              latitude={load.originLat}
              longitude={load.originLon}
            >
              <Icon
                className={markerClass}
                id="freight"
              />
            </Marker>
            <Marker
              anchor="bottom"
              latitude={load.destinationLat}
              longitude={load.destinationLon}
            >
              <Icon
                className={addressMarkerClass}
                id="address"
              />
            </Marker>
          </Fragment>
        ))}

        <Source
          data={routes}
          id="load-routes"
          type="geojson"
        >
          <Layer
            id="load-routes-line"
            paint={{ "line-color": colors.orange, "line-opacity": 0.9, "line-width": 3 }}
            type="line"
          />
        </Source>
      </ReactMap>
    </div>
  );
};

export { Map };
