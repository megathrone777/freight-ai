import { serve } from "inngest/next";

import { inngest } from "@/services";

const { client, functions } = inngest;

const handlers = serve({ client, functions });

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
