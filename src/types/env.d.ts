declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GEMINI_API_KEY: string;
      GEMINI_MODEL: string;
      INNGEST_EVENT_KEY: string;
      INNGEST_SIGNING_KEY: string;
      POSTGRES_URL: string;
      POSTGRES_URL_NON_POOLING: string;
      PUBLIC_URL: string;
      SIMULATE_SECRET: string;
      VOYAGE_API_KEY: string;
    }
  }
}

export {};
