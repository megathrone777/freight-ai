import { Inngest } from "inngest";

const client = new Inngest({
  eventKey: process.env.INNGEST_EVENT_KEY,
  id: "freight-ai",
  isDev: process.env.NODE_ENV !== "production",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

export { client };
