import { query } from './db.js'
import type { AppRole } from './roles.js'
import { normalizeRole } from './roles.js'

export async function listTenants() {
  const r = await query(
    `SELECT id, name, slug, region, city, state, description, active
     FROM tenants WHERE active = TRUE ORDER BY region`,
  )
  return r.rows.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    region: t.region,
    city: t.city,
    state: t.state,
    description: t.description,
  }))
}

export async function getUserMemberships(userId: string) {
  const r = await query(
    `SELECT m.id, m.role, m.status, m.tenant_id,
            t.name AS tenant_name, t.slug, t.region, t.city, t.state
     FROM tenant_memberships m
     JOIN tenants t ON t.id = m.tenant_id
     WHERE m.user_id = $1
     ORDER BY m.created_at`,
    [userId],
  )
  return r.rows.map((m) => ({
    id: m.id,
    role: m.role,
    status: m.status,
    tenantId: m.tenant_id,
    tenant: {
      id: m.tenant_id,
      name: m.tenant_name,
      slug: m.slug,
      region: m.region,
      city: m.city,
      state: m.state,
    },
  }))
}

export async function ensureMembership(
  userId: string,
  tenantId: string,
  role: AppRole,
  status: 'active' | 'pending' = 'active',
) {
  await query(
    `INSERT INTO tenant_memberships (tenant_id, user_id, role, status)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status`,
    [tenantId, userId, role, status],
  )
  await query(`UPDATE users SET primary_tenant_id = $2, updated_at = NOW() WHERE id = $1`, [
    userId,
    tenantId,
  ])
}

export async function setUserRole(
  userId: string,
  role: AppRole,
  opts?: { tenantId?: string; intent?: string },
) {
  const r = normalizeRole(role)
  await query(
    `UPDATE users SET role = $2, intent = COALESCE($3, intent), updated_at = NOW() WHERE id = $1`,
    [userId, r, opts?.intent ?? null],
  )
  if (opts?.tenantId) {
    await ensureMembership(userId, opts.tenantId, r)
  }
}

export async function getExecutiveDashboard(tenantId: string) {
  const [
    tenant,
    people,
    companies,
    mediations,
    openMed,
    posts,
    members,
    teamLike,
  ] = await Promise.all([
    query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]),
    query(
      `SELECT COUNT(DISTINCT user_id)::int AS n FROM tenant_memberships WHERE tenant_id = $1 AND status = 'active'`,
      [tenantId],
    ),
    query(
      `SELECT COUNT(*)::int AS n, COALESCE(AVG(score),0)::float AS avg_score
       FROM companies WHERE tenant_id = $1`,
      [tenantId],
    ),
    query(
      `SELECT COUNT(*)::int AS n FROM mediations WHERE tenant_id = $1`,
      [tenantId],
    ),
    query(
      `SELECT COUNT(*)::int AS n FROM mediations WHERE tenant_id = $1 AND status = 'aberta'`,
      [tenantId],
    ),
    query(
      `SELECT COUNT(*)::int AS n FROM community_posts WHERE tenant_id = $1`,
      [tenantId],
    ),
    query(
      `SELECT m.role, COUNT(*)::int AS n,
              COALESCE(AVG(u.score),0)::float AS avg_score
       FROM tenant_memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.tenant_id = $1 AND m.status = 'active'
       GROUP BY m.role
       ORDER BY n DESC`,
      [tenantId],
    ),
    query(
      `SELECT u.name, u.role, u.score, u.email
       FROM tenant_memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.tenant_id = $1 AND m.status = 'active'
       ORDER BY u.score DESC
       LIMIT 20`,
      [tenantId],
    ),
  ])

  const companyRows = await query(
    `SELECT id, name, score, seal, category, is_certified
     FROM companies WHERE tenant_id = $1 ORDER BY score DESC LIMIT 15`,
    [tenantId],
  )

  const recentMediations = await query(
    `SELECT md.id, md.title, md.status, md.with_whom, md.created_at,
            u.name AS requester_name, med.name AS mediator_name
     FROM mediations md
     JOIN users u ON u.id = md.user_id
     LEFT JOIN users med ON med.id = md.mediator_id
     WHERE md.tenant_id = $1
     ORDER BY md.created_at DESC
     LIMIT 10`,
    [tenantId],
  )

  const orgScore = Math.round(Number(companies.rows[0]?.avg_score || 0))
  const peopleN = people.rows[0]?.n || 0
  const companiesN = companies.rows[0]?.n || 0
  const medN = mediations.rows[0]?.n || 0
  const openN = openMed.rows[0]?.n || 0
  const agreementRate =
    medN === 0
      ? 0
      : Math.round(
          ((
            await query(
              `SELECT COUNT(*)::int AS n FROM mediations
               WHERE tenant_id = $1 AND status IN ('acordo','resolvida')`,
              [tenantId],
            )
          ).rows[0].n /
            medN) *
            100,
        )

  return {
    tenant: tenant.rows[0]
      ? {
          id: tenant.rows[0].id,
          name: tenant.rows[0].name,
          region: tenant.rows[0].region,
          city: tenant.rows[0].city,
          state: tenant.rows[0].state,
          slug: tenant.rows[0].slug,
        }
      : null,
    kpis: {
      orgScore,
      people: peopleN,
      companies: companiesN,
      mediations: medN,
      openMediations: openN,
      posts: posts.rows[0]?.n || 0,
      agreementRate,
    },
    byRole: members.rows.map((r) => ({
      role: r.role,
      people: r.n,
      score: Math.round(Number(r.avg_score)),
      risk: Number(r.avg_score) >= 80 ? 'baixo' : Number(r.avg_score) >= 65 ? 'médio' : 'alto',
    })),
    topPeople: teamLike.rows.map((u) => ({
      name: u.name,
      role: u.role,
      score: u.score,
      email: u.email,
    })),
    companies: companyRows.rows,
    recentMediations: recentMediations.rows.map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      withWhom: m.with_whom,
      requesterName: m.requester_name,
      mediatorName: m.mediator_name,
      createdAt: m.created_at,
    })),
  }
}

export async function getMediatorQueue(tenantId: string | null, mediatorId: string) {
  const open = tenantId
    ? await query(
        `SELECT md.*, u.name AS requester_name
         FROM mediations md
         JOIN users u ON u.id = md.user_id
         WHERE md.status = 'aberta' AND md.mediator_id IS NULL
           AND (md.tenant_id = $1 OR md.tenant_id IS NULL)
         ORDER BY md.created_at ASC
         LIMIT 30`,
        [tenantId],
      )
    : await query(
        `SELECT md.*, u.name AS requester_name
         FROM mediations md
         JOIN users u ON u.id = md.user_id
         WHERE md.status = 'aberta' AND md.mediator_id IS NULL
         ORDER BY md.created_at ASC
         LIMIT 30`,
      )

  const mine = await query(
    `SELECT md.*, u.name AS requester_name
     FROM mediations md
     JOIN users u ON u.id = md.user_id
     WHERE md.mediator_id = $1
     ORDER BY md.created_at DESC
     LIMIT 30`,
    [mediatorId],
  )

  return {
    open: open.rows.map(mapMed),
    mine: mine.rows.map(mapMed),
  }
}

function mapMed(m: Record<string, unknown>) {
  return {
    id: m.id,
    title: m.title,
    withWhom: m.with_whom,
    status: m.status,
    notes: m.notes,
    requesterName: m.requester_name,
    tenantId: m.tenant_id,
    mediatorId: m.mediator_id,
    createdAt: m.created_at,
  }
}

export async function getCompanyPanel(userId: string) {
  const owned = await query(
    `SELECT * FROM companies WHERE created_by = $1 ORDER BY name`,
    [userId],
  )
  const linked = await query(
    `SELECT c.* FROM companies c
     JOIN users u ON u.company_id = c.id
     WHERE u.id = $1`,
    [userId],
  )
  const map = new Map<string, Record<string, unknown>>()
  for (const c of [...owned.rows, ...linked.rows]) map.set(c.id, c)
  const companies = [...map.values()]

  const benefits =
    companies.length === 0
      ? []
      : (
          await query(
            `SELECT * FROM benefits WHERE company_id = ANY($1::uuid[]) ORDER BY cost`,
            [companies.map((c) => c.id)],
          )
        ).rows

  const reviews =
    companies.length === 0
      ? []
      : (
          await query(
            `SELECT r.*, u.name AS author_name, c.name AS company_name
             FROM company_reviews r
             JOIN users u ON u.id = r.user_id
             JOIN companies c ON c.id = r.company_id
             WHERE r.company_id = ANY($1::uuid[])
             ORDER BY r.created_at DESC LIMIT 20`,
            [companies.map((c) => c.id)],
          )
        ).rows

  const certs =
    companies.length === 0
      ? []
      : (
          await query(
            `SELECT * FROM company_cert_requests
             WHERE company_id = ANY($1::uuid[])
             ORDER BY created_at DESC LIMIT 20`,
            [companies.map((c) => c.id)],
          )
        ).rows

  return {
    companies: companies.map((c) => ({
      id: c.id,
      name: c.name,
      score: c.score,
      seal: c.seal,
      category: c.category,
      isCertified: c.is_certified,
      tenantId: c.tenant_id,
      city: c.city,
      state: c.state,
    })),
    benefits: benefits.map((b) => ({
      id: b.id,
      title: b.title,
      cost: b.cost,
      type: b.type,
      companyId: b.company_id,
      active: b.active,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      authorName: r.author_name,
      companyName: r.company_name,
      createdAt: r.created_at,
    })),
    certRequests: certs.map((c) => ({
      id: c.id,
      companyId: c.company_id,
      status: c.status,
      notes: c.notes,
      createdAt: c.created_at,
    })),
  }
}

export async function getInfluencerPanel(userId: string) {
  const mine = await query(
    `SELECT * FROM influencers WHERE created_by = $1 OR id = (SELECT influencer_id FROM users WHERE id = $1)`,
    [userId],
  )
  const posts = await query(
    `SELECT * FROM community_posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
    [userId],
  )
  return {
    profiles: mine.rows.map((i) => ({
      id: i.id,
      name: i.name,
      handle: i.handle,
      niche: i.niche,
      bio: i.bio,
      score: i.score,
      reach: i.reach,
      engagement: i.engagement,
      verified: i.verified,
      rising: i.rising,
    })),
    posts: posts.rows.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      body: p.body,
      likes: p.likes,
      createdAt: p.created_at,
      tags: p.tags,
    })),
  }
}
