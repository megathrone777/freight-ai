"use client";

import { Fragment, useEffect, useRef, useState } from "react";
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
  const { activeLoad, priceProposal } = useStore("activeLoad", "priceProposal");
  const mapRef = useRef<MapRef>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
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
      properties: {
        accepted: priceProposal?.loadId === load.id && priceProposal.accepted,
        id: load.id,
      },
      type: "Feature",
    })),
    type: "FeatureCollection",
  };

  useEffect(() => {
    if (!isMapLoaded) return;

    const boundsLoads: TLoadRecord[] = activeLoad ? [activeLoad] : loads;

    if (!boundsLoads.length) return;

    const longitudes: number[] = boundsLoads.flatMap(({ destinationLon, originLon }) => [
      originLon,
      destinationLon,
    ]);
    const latitudes: number[] = boundsLoads.flatMap(({ destinationLat, originLat }) => [
      originLat,
      destinationLat,
    ]);
    const westSouth: [number, number] = [Math.min(...longitudes), Math.min(...latitudes)];
    const eastNorth: [number, number] = [Math.max(...longitudes), Math.max(...latitudes)];

    mapRef.current?.fitBounds([westSouth, eastNorth], {
      duration: 900,
      maxZoom: 10,
      padding: 88,
    });
  }, [activeLoad, isMapLoaded, loads]);

  return (
    <div className={wrapperClass}>
      <ReactMap
        attributionControl={false}
        initialViewState={{ latitude: 49.8, longitude: 15.4, zoom: 6.7 }}
        mapStyle="https://tiles.openfreemap.org/styles/fiord"
        onLoad={() => setIsMapLoaded(true)}
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
            paint={{
              "line-color": [
                "case",
                ["boolean", ["get", "accepted"], false],
                colors.green,
                colors.orange,
              ],
              "line-opacity": 0.9,
              "line-width": 3,
            }}
            type="line"
          />
        </Source>
      </ReactMap>
    </div>
  );
};

export { Map };
