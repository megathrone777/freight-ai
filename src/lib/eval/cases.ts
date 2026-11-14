import type { SearchLoadsInputSchema } from "@/lib/agent/schemas";

import type { z } from "zod";

type EvalCase = {
  expectedLoadIds: string[];
  input: z.infer<typeof SearchLoadsInputSchema>;
  query: string;
};

const evalCases: EvalCase[] = [
  {
    expectedLoadIds: ["seed-0000"],
    input: { destination: "Brno", maxWeightT: 5.3, origin: "Příbram", query: "5.3 tonne building materials, refrigerated trailer required" },
    query: "5.3 tonnes from Příbram to Brno, building materials with a refrigerated trailer",
  },
  {
    expectedLoadIds: ["seed-0001"],
    input: { destination: "Praha", maxWeightT: 19.9, origin: "Tábor", query: "19.9 tonne machinery transport" },
    query: "Need a 19.9 tonne machinery load from Tábor to Praha",
  },
  {
    expectedLoadIds: ["seed-0002"],
    input: { destination: "Teplice", maxWeightT: 8.7, origin: "Hradec Králové", query: "8.7 tonnes food full truckload" },
    query: "8.7 tonne food shipment Hradec Králové to Teplice",
  },
  {
    expectedLoadIds: ["seed-0003"],
    input: { destination: "Ostrava", maxWeightT: 14.8, origin: "Chomutov", query: "steel coils 14.8 tonnes" },
    query: "Find steel coils from Chomutov to Ostrava for a 14.8 tonne truck",
  },
  {
    expectedLoadIds: ["seed-0004"],
    input: { destination: "Zlín", maxWeightT: 10.6, origin: "Kladno", query: "pallets ADR certified vehicle" },
    query: "Pallets from Kladno to Zlín, 10.6 tonnes, ADR vehicle",
  },
  {
    expectedLoadIds: ["seed-0005", "seed-0010"],
    input: { destination: "Praha", maxWeightT: 22.2, origin: "Brno", query: "machinery refrigerated trailer building materials" },
    query: "Brno to Praha, machinery with refrigeration or building materials; capacity 22.2 tonnes",
  },
  {
    expectedLoadIds: ["seed-0006"],
    input: { destination: "Rokycany", maxWeightT: 22, origin: "Ústí nad Labem", query: "food tail lift" },
    query: "22 tonne food load from Ústí nad Labem to Rokycany, tail lift",
  },
  {
    expectedLoadIds: ["seed-0007"],
    input: { destination: "Děčín", maxWeightT: 12.9, origin: "Olomouc", query: "pallets tail lift" },
    query: "Olomouc to Děčín pallets, 12.9 tonnes, need a tail lift",
  },
  {
    expectedLoadIds: ["seed-0008"],
    input: { destination: "Brno", maxWeightT: 12.8, origin: "Jihlava", query: "building materials tail lift" },
    query: "Jihlava to Brno building materials, 12.8 tonne capacity and tail lift",
  },
  {
    expectedLoadIds: ["seed-0009"],
    input: { destination: "Plzeň", maxWeightT: 1.3, origin: "Praha", query: "building materials" },
    query: "Small 1.3 tonne building materials shipment from Praha to Plzeň",
  },
  {
    expectedLoadIds: ["seed-0011"],
    input: { destination: "Ústí nad Labem", maxWeightT: 19.3, origin: "Brno", query: "food transport" },
    query: "Brno to Ústí nad Labem, food cargo for up to 19.3 tonnes",
  },
  {
    expectedLoadIds: ["seed-0012"],
    input: { destination: "Plzeň", maxWeightT: 1.7, origin: "Most", query: "machinery tail lift" },
    query: "Most to Plzeň machinery, 1.7 tonnes and tail lift required",
  },
  {
    expectedLoadIds: ["seed-0013"],
    input: { destination: "Zlín", maxWeightT: 11.5, origin: "Brno", query: "steel coils transport" },
    query: "Steel coils from Brno to Zlín; truck capacity 11.5 tonnes",
  },
  {
    expectedLoadIds: ["seed-0014"],
    input: { destination: "Kutná Hora", maxWeightT: 5, origin: "Ústí nad Labem", query: "machinery shipment" },
    query: "5 tonne machinery shipment from Ústí nad Labem to Kutná Hora",
  },
  {
    expectedLoadIds: ["seed-0000"],
    input: { destination: "Brno", maxWeightT: 6, origin: "Příbram", query: "refrigerated building materials" },
    query: "Příbram to Brno refrigerated building materials, truck capacity six tonnes",
  },
];

export { evalCases };
export type { EvalCase };
