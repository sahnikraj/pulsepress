CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE account_memberships (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'analyst')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, user_id)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash BYTEA NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE websites (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  vapid_public_key TEXT NOT NULL,
  vapid_private_key_encrypted TEXT NOT NULL,
  default_icon TEXT,
  default_ttl INTEGER NOT NULL DEFAULT 600,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX websites_account_id_idx ON websites(account_id);

CREATE TABLE subscribers (
  id UUID PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  browser TEXT NOT NULL,
  device_type TEXT NOT NULL,
  country TEXT,
  city TEXT,
  timezone TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'unsubscribed')),
  presence_class TEXT NOT NULL DEFAULT 'cold' CHECK (presence_class IN ('active', 'warm', 'cold')),
  subscription_date TIMESTAMPTZ NOT NULL,
  last_site_visit TIMESTAMPTZ,
  last_click TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (website_id, endpoint)
);
CREATE INDEX subscribers_website_id_idx ON subscribers(website_id);
CREATE INDEX subscribers_status_idx ON subscribers(status);
CREATE INDEX subscribers_last_site_visit_idx ON subscribers(last_site_visit);

CREATE TABLE segments (
  id UUID PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rules_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX segments_website_id_idx ON segments(website_id);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT NOT NULL,
  image TEXT,
  icon TEXT,
  ttl INTEGER NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  segment_id UUID REFERENCES segments(id),
  topic_id UUID,
  status TEXT NOT NULL CHECK (
    status IN ('draft','scheduled','queued','sending','sent','completed','failed','cancel_requested','canceled')
  ),
  scheduled_at TIMESTAMPTZ,
  queued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  targeted_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX campaigns_website_id_idx ON campaigns(website_id);
CREATE INDEX campaigns_status_idx ON campaigns(status);

CREATE TABLE campaign_snapshots (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  targeted_count INTEGER NOT NULL,
  rules_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX campaign_snapshots_campaign_id_idx ON campaign_snapshots(campaign_id);

CREATE TABLE campaign_events (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent','delivered','failed','shown','click')),
  event_timestamp TIMESTAMPTZ NOT NULL,
  error_code TEXT,
  provider_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dedupe_bucket BIGINT GENERATED ALWAYS AS (floor(extract(epoch FROM event_timestamp) / 10)) STORED
);
CREATE INDEX campaign_events_campaign_id_idx ON campaign_events(campaign_id);
CREATE INDEX campaign_events_event_type_idx ON campaign_events(event_type);
CREATE INDEX campaign_events_event_timestamp_idx ON campaign_events(event_timestamp);
CREATE UNIQUE INDEX campaign_events_dedupe_key ON campaign_events(campaign_id, subscriber_id, event_type, dedupe_bucket);

CREATE TABLE segment_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  estimated_count INTEGER NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX segment_estimates_segment_id_idx ON segment_estimates(segment_id, calculated_at DESC);

CREATE TABLE automations (
  id UUID PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('rss')),
  config_json JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  event_filters TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('active','disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX analytics_cache_lookup_idx ON analytics_cache(website_id, metric_key, calculated_at DESC);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID,
  account_id UUID,
  actor_user_id UUID,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE campaign_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','running','retried','completed','dead')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
