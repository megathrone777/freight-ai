### PREPARATION:

- First you need to have [Node.js](https://nodejs.org/en/download/) and [npm](https://nodejs.org/en/download/) installed.

- Then you need to install the software packaging system "yarn" using the command:

```bash
npm install --global yarn
```

- Then you need to download the javascript dependency libraries using the command:

```bash
yarn
```

### DEVELOPMENT INSTRUCTIONS:

- You can reach the development state using the command:

```bash
yarn dev
```

For local negotiations, start the Inngest Dev Server in a second terminal:

```bash
yarn dev:inngest
```

Keep both processes running. Open [http://localhost:8288](http://localhost:8288) and verify that the `freight-ai` app and its negotiation function are registered.

Open [https://localhost:3000](https://localhost:3000) with your browser to see the result.

- Achieving the deployment state can be done with commands:

```bash
yarn build
# and
yarn start
```

Open [https://localhost:3000](https://localhost:3000) with your browser to see the result.

The page auto-updates as you edit the file.

## Freight AI demo

The App Router UI renders load routes with `react-map-gl/maplibre`; OpenFreeMap styles and tiles are served through the same-origin `/api/tiles` proxy. Server routes and actions use Drizzle over Postgres.js; migrations and the seeded ingestion pipeline use `POSTGRES_URL_NON_POOLING`, while the app uses the transaction-pool URL in `POSTGRES_URL`. Three mock feeds normalize through zod, use Voyage embeddings and pgvector for hybrid search, and emit persisted domain events. The Gemini agent runs on the Vercel AI SDK, and Inngest handles durable negotiation steps and scheduled load expiry. Tool calls and emitted events are stored in the `traces` table.

Live load changes use three-second polling behind `useLoadChanges`, so the transport can later be replaced with SSE or WebSockets. Polling is intentionally simpler than maintaining a push connection for this demo; mock feeds, seeded expected IDs, and the 15-minute negotiation flow are demo scaffolding rather than carrier production integrations.

Set the server-only variables listed in `.env.example`. Apply migrations with `yarn db:migrate`, seed demo loads with `npm run seed` (optionally `-- --reset` or `-- --limit N`), and open `/eval` to run retrieval checks.

Please run ```yarn build``` before every commit