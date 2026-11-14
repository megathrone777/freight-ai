CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint

CREATE TYPE load_status AS ENUM ('active', 'negotiating', 'expired');
--> statement-breakpoint
CREATE TYPE negotiation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
--> statement-breakpoint

CREATE TABLE loads (
  id text PRIMARY KEY,
  source text NOT NULL,
  origin text NOT NULL,
  origin_lat double precision NOT NULL,
  origin_lon double precision NOT NULL,
  destination text NOT NULL,
  destination_lat double precision NOT NULL,
  destination_lon double precision NOT NULL,
  weight_t double precision NOT NULL,
  price double precision NOT NULL,
  pickup_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status load_status NOT NULL DEFAULT 'active',
  description text NOT NULL,
  embedding vector(1024) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX loads_embedding_hnsw_idx ON loads USING hnsw (embedding vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX loads_status_idx ON loads (status);
--> statement-breakpoint
CREATE INDEX loads_expires_at_idx ON loads (expires_at);
--> statement-breakpoint
CREATE INDEX loads_updated_at_idx ON loads (updated_at);
--> statement-breakpoint
CREATE INDEX loads_route_date_idx ON loads (origin, destination, pickup_at);
--> statement-breakpoint

CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER loads_set_updated_at BEFORE UPDATE ON loads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint

CREATE TABLE negotiations (
  id text PRIMARY KEY,
  load_id text NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  status negotiation_status NOT NULL DEFAULT 'pending',
  initial_price double precision NOT NULL,
  current_price double precision NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX negotiations_load_id_idx ON negotiations (load_id);
--> statement-breakpoint
CREATE TRIGGER negotiations_set_updated_at BEFORE UPDATE ON negotiations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint

CREATE TABLE negotiation_messages (
  id text PRIMARY KEY,
  negotiation_id text NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  kind text NOT NULL,
  price double precision NOT NULL,
  status text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX negotiation_messages_negotiation_id_idx ON negotiation_messages (negotiation_id, created_at);
--> statement-breakpoint

CREATE TABLE traces (
  id text PRIMARY KEY,
  name text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX traces_created_at_idx ON traces (created_at);
--> statement-breakpoint

CREATE TABLE domain_events (
  id text PRIMARY KEY,
  name text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX domain_events_created_at_idx ON domain_events (created_at);
--> statement-breakpoint

ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE negotiation_messages ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE traces ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
