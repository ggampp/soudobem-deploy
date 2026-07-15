-- Sou do Bem — schema PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  city TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'executivo', 'admin')),
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  score INT NOT NULL DEFAULT 70,
  seal TEXT NOT NULL DEFAULT 'Confiável',
  streak_days INT NOT NULL DEFAULT 0,
  goodcoins INT NOT NULL DEFAULT 500,
  hearts INT NOT NULL DEFAULT 0,
  dim_confianca INT NOT NULL DEFAULT 70,
  dim_empatia INT NOT NULL DEFAULT 70,
  dim_etica INT NOT NULL DEFAULT 70,
  dim_cooperacao INT NOT NULL DEFAULT 70,
  dim_responsabilidade INT NOT NULL DEFAULT 70,
  challenge JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  achievements TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE method_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pillar_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  practices TEXT[] NOT NULL DEFAULT '{}',
  progress INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, pillar_key)
);

CREATE TABLE relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  score INT NOT NULL DEFAULT 70,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ
);

CREATE TABLE relation_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relation_id UUID NOT NULL REFERENCES relations(id) ON DELETE CASCADE,
  confianca INT NOT NULL,
  empatia INT NOT NULL,
  etica INT NOT NULL,
  cooperacao INT NOT NULL,
  responsabilidade INT NOT NULL,
  average INT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE goodcoin_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mediations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  with_whom TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'acordo', 'resolvida')),
  notes TEXT,
  agreement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mediation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mediation_id UUID NOT NULL REFERENCES mediations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  likes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE post_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  category TEXT NOT NULL,
  seal TEXT NOT NULL,
  score INT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE benefits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  type TEXT NOT NULL,
  value_label TEXT NOT NULL,
  cost INT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE influencers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  niche TEXT NOT NULL,
  bio TEXT NOT NULL,
  score INT NOT NULL,
  reach TEXT NOT NULL,
  engagement TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  rising BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  discount TEXT NOT NULL,
  hearts_required INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  address TEXT,
  company_id UUID REFERENCES companies(id)
);

CREATE TABLE causes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  raised INT NOT NULL DEFAULT 0,
  goal INT NOT NULL
);

CREATE TABLE cause_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cause_id TEXT NOT NULL REFERENCES causes(id),
  amount_gc INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE redeemed_benefits (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  benefit_id TEXT NOT NULL REFERENCES benefits(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, benefit_id)
);

CREATE TABLE company_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, company_id)
);

CREATE TABLE favorite_companies (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE following_influencers (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, influencer_id)
);

CREATE TABLE community_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  attendees INT NOT NULL DEFAULT 0
);

CREATE TABLE event_rsvps (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE library_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  minutes INT NOT NULL,
  pillar TEXT,
  summary TEXT NOT NULL
);

CREATE TABLE library_completions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX idx_relations_user ON relations(user_id);
CREATE INDEX idx_chat_user ON chat_messages(user_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_ledger_user ON goodcoin_ledger(user_id, created_at DESC);
