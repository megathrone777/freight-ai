const haversineKm = (from: TCity, to: TCity): number => {
  const radians: (degrees: number) => number = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference: number = radians(to.lat - from.lat);
  const longitudeDifference: number = radians(to.lon - from.lon);
  const value: number =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export { haversineKm };
