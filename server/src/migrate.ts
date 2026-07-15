import { pool } from './db.js'

/** Migrações idempotentes (volume Docker existente). */
export async function runMigrations() {
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
