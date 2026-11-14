import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { inngestFunctions } from "@/lib/inngest/functions";

const handlers = serve({ client: inngest, functions: inngestFunctions });

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
