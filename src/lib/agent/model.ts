import { createGoogleGenerativeAI } from "@ai-sdk/google";

const getGeminiModel = (): ReturnType<ReturnType<typeof createGoogleGenerativeAI>> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required for the freight agent.");
  }
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

  return google(process.env.GEMINI_MODEL ?? "gemini-2.5-flash");
};

export { getGeminiModel };
