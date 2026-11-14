import { Inngest } from "inngest";

const inngest = new Inngest({
  eventKey: process.env.INNGEST_EVENT_KEY,
  id: "freight-ai",
  isDev: process.env.NODE_ENV !== "production",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

export { inngest };
