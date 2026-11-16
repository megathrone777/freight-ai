import { cities } from "@/globals";

const canonicalCityName = (name: string | undefined): string | undefined => {
  if (!name) {
    return undefined;
  }
  const normalized: string = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    cities.find(
      ({ name: cityName }) =>
        cityName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase() === normalized
    )?.name ?? name
  );
};

export { canonicalCityName };
