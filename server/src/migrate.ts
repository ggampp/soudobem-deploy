import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Schema base (init.sql) — idempotente para volumes Forja/Docker sem initdb. */
async function ensureBaseSchema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      bio TEXT,
      city TEXT,
      role TEXT NOT NULL DEFAULT 'pessoa',
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

    CREATE TABLE IF NOT EXISTS method_pillars (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pillar_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      practices TEXT[] NOT NULL DEFAULT '{}',
      progress INT NOT NULL DEFAULT 0,
      UNIQUE (user_id, pillar_key)
    );

    CREATE TABLE IF NOT EXISTS relations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      score INT NOT NULL DEFAULT 70,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_interaction_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS relation_evaluations (
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

    CREATE TABLE IF NOT EXISTS goodcoin_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      amount INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mediations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      with_whom TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'acordo', 'resolvida')),
      notes TEXT,
      agreement TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mediation_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mediation_id UUID NOT NULL REFERENCES mediations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'system')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS community_posts (
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

    CREATE TABLE IF NOT EXISTS post_likes (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS companies (
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

    CREATE TABLE IF NOT EXISTS benefits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company_id UUID NOT NULL REFERENCES companies(id),
      type TEXT NOT NULL,
      value_label TEXT NOT NULL,
      cost INT NOT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS influencers (
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

    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      discount TEXT NOT NULL,
      hearts_required INT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      address TEXT,
      company_id UUID REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS causes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      raised INT NOT NULL DEFAULT 0,
      goal INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cause_contributions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cause_id TEXT NOT NULL REFERENCES causes(id),
      amount_gc INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS redeemed_benefits (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      benefit_id TEXT NOT NULL REFERENCES benefits(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, benefit_id)
    );

    CREATE TABLE IF NOT EXISTS company_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id UUID NOT NULL REFERENCES companies(id),
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, company_id)
    );

    CREATE TABLE IF NOT EXISTS favorite_companies (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, company_id)
    );

    CREATE TABLE IF NOT EXISTS following_influencers (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, influencer_id)
    );

    CREATE TABLE IF NOT EXISTS community_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      event_date TIMESTAMPTZ NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      attendees INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS event_rsvps (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, event_id)
    );

    CREATE TABLE IF NOT EXISTS library_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      kind TEXT NOT NULL,
      minutes INT NOT NULL,
      pillar TEXT,
      summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS library_completions (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_relations_user ON relations(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ledger_user ON goodcoin_ledger(user_id, created_at DESC);
  `)
}

/** Catálogo seed se empresas ainda vazias (volume sem docker-entrypoint seed). */
async function ensureCatalogSeed() {
  const c = await pool.query(`SELECT COUNT(*)::int AS n FROM companies`)
  if ((c.rows[0]?.n ?? 0) > 0) return

  const candidates = [
    join(__dirname, '../db/seed.sql'),
    join(process.cwd(), 'db/seed.sql'),
    join(process.cwd(), 'server/db/seed.sql'),
  ]
  const path = candidates.find((p) => existsSync(p))
  if (!path) {
    console.warn('seed.sql não encontrado — catálogo vazio')
    return
  }
  const sql = readFileSync(path, 'utf8')
  await pool.query(sql)
  console.log('Catalog seed OK from', path)
}

/** Migrações idempotentes (volume Docker/Forja existente). */
export async function runMigrations() {
  await ensureBaseSchema()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS score_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      score_before INT,
      score_after INT,
      dim_delta JSONB DEFAULT '{}'::jsonb,
      meta JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS score_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INT NOT NULL,
      dim_confianca INT NOT NULL,
      dim_empatia INT NOT NULL,
      dim_etica INT NOT NULL,
      dim_cooperacao INT NOT NULL,
      dim_responsabilidade INT NOT NULL,
      method_avg INT NOT NULL DEFAULT 0,
      relations_avg INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_score_events_user ON score_events(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_score_history_user ON score_history(user_id, created_at DESC);

    ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_certified BOOLEAN NOT NULL DEFAULT TRUE;

    ALTER TABLE partners ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE influencers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE benefits ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE benefits ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

    ALTER TABLE relations ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE relations ADD COLUMN IF NOT EXISTS phone TEXT;

    CREATE TABLE IF NOT EXISTS favorite_partners (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, partner_id)
    );

    CREATE TABLE IF NOT EXISTS company_cert_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado')),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- —— Multi-tenant ——
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      region TEXT NOT NULL,
      city TEXT,
      state TEXT,
      description TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tenant_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tenant_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_memberships_user ON tenant_memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON tenant_memberships(tenant_id);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS intent TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL;

    ALTER TABLE companies ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    ALTER TABLE influencers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    ALTER TABLE mediations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    ALTER TABLE mediations ADD COLUMN IF NOT EXISTS mediator_id UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE mediations ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

    -- Expand roles (remove check antigo se existir)
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    UPDATE users SET role = 'pessoa' WHERE role IN ('user', 'User') OR role IS NULL OR role = '';
    UPDATE users SET role = 'executivo' WHERE role = 'Executivo';
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'pessoa';
  `)

  await ensureCatalogSeed()

  // Seed de territórios (tenants) se vazio
  const t = await pool.query(`SELECT COUNT(*)::int AS n FROM tenants`)
  if ((t.rows[0]?.n ?? 0) === 0) {
    await pool.query(`
      INSERT INTO tenants (name, slug, region, city, state, description) VALUES
      ('Sou do Bem Norte', 'norte', 'Norte', 'Manaus', 'AM', 'Território Norte — expansão e comunidade regional.'),
      ('Sou do Bem Nordeste', 'nordeste', 'Nordeste', 'Recife', 'PE', 'Território Nordeste — relações e empresas do bem.'),
      ('Sou do Bem Centro-Oeste', 'centro-oeste', 'Centro-Oeste', 'Brasília', 'DF', 'Território Centro-Oeste.'),
      ('Sou do Bem Sudeste', 'sudeste', 'Sudeste', 'São Paulo', 'SP', 'Território Sudeste — maior densidade de empresas certificadas.'),
      ('Sou do Bem Sul', 'sul', 'Sul', 'Curitiba', 'PR', 'Território Sul — mediação e cooperação regional.');
    `)
    console.log('Tenants seed OK')
  }

  // Vincular empresas seed ao Sudeste se sem tenant
  await pool.query(`
    UPDATE companies c
    SET tenant_id = t.id
    FROM tenants t
    WHERE c.tenant_id IS NULL AND t.slug = 'sudeste'
  `)

  console.log('Migrations OK')
}
