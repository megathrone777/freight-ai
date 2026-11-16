export interface TRouteFeatureCollection {
  features: Array<{
    geometry: { coordinates: [number, number][]; type: "LineString" };
    properties: { id: string };
    type: "Feature";
  }>;
  type: "FeatureCollection";
}
