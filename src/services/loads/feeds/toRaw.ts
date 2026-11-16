const toRaw = (load: TNormalizedLoad, source: TRawSource): unknown => {
  const date: string = load.pickupAt.toISOString();

  if (source === "TransBoard") {
    return {
      destination: {
        latitude: load.destinationLat,
        longitude: load.destinationLon,
        title: load.destination,
      },
      expires: load.expiresAt.toISOString(),
      id: load.id,
      origin: { latitude: load.originLat, longitude: load.originLon, title: load.origin },
      pickup: date.slice(0, 10),
      price: `${load.price.toLocaleString("en-US", { maximumFractionDigits: 2 }).replace(",", " ")} EUR`,
      requirements: load.description,
      weight_t: load.weightT,
    };
  }

  if (source === "CargoHub") {
    return {
      cargoDetails: load.description,
      delivery: { city: load.destination, lat: load.destinationLat, lng: load.destinationLon },
      key: load.id,
      loadWeightKg: Math.round(load.weightT * 1000),
      offerEur: load.price,
      pickupPoint: { city: load.origin, lat: load.originLat, lng: load.originLon },
      publishedUntil: load.expiresAt.getTime(),
      startDate: `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`,
    };
  }

  return {
    cargo: load.description,
    destinationCity: load.destination,
    destinationPoint: [load.destinationLon, load.destinationLat],
    expiresAt: load.expiresAt.getTime(),
    loadId: load.id,
    pickupCity: load.origin,
    pickupDate: date.slice(0, 10),
    pickupPoint: [load.originLon, load.originLat],
    rate: load.price,
    tonnes: load.weightT,
  };
};

export { toRaw };
