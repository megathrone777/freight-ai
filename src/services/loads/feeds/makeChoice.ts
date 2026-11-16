const makeChoice = <T>(random: TRandom, items: readonly T[]): T => {
  const result: T | undefined = items[Math.floor(random() * items.length)];

  if (result === undefined) {
    throw new Error("Cannot choose from an empty collection.");
  }

  return result;
};

export { makeChoice };
