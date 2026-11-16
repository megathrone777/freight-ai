const embeddingText = (load: TNormalizedLoad): string =>
  `${load.origin} to ${load.destination}. ${load.weightT} tonnes. ${load.description}`;

export { embeddingText };
