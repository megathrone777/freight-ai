export interface TRouteFeatureCollection {
  features: Array<{
    geometry: { coordinates: [number, number][]; type: "LineString" };
    properties: { accepted: boolean; id: string };
    type: "Feature";
  }>;
  type: "FeatureCollection";
}

export interface TProps {
  loads: TLoadRecord[];
}
