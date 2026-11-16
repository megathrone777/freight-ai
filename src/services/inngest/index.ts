import { client } from "./client";
import { functions } from "./functions";
import { decisionEventSchema, offerEventSchema, workflowStepEventSchema } from "./schemas";

const inngest = {
  client,
  functions,
  schemas: {
    decisionEventSchema,
    offerEventSchema,
    workflowStepEventSchema,
  },
};

export { inngest };
