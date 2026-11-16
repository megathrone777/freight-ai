const seededRandom = (seed: number): TRandom => {
  let state: number = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 4294967296;
  };
};

export { seededRandom };
