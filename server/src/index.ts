import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { env } from './env.js'
import { pool, query } from './db.js'
import { authRequired, getAuth, requirePermission, requireRoles, signToken } from './auth.js'
import { APP_ROLES, ROLE_META, normalizeRole, type AppRole } from './roles.js'
import {
  getCompanyPanel,
  getExecutiveDashboard,
  getInfluencerPanel,
  getMediatorQueue,
  listTenants,
  setUserRole,
} from './tenantService.js'
import { buildSystemPrompt, chatWithTools } from './openrouter.js'
import { executeUserTool, getUserContext, LLM_TOOLS } from './userContext.js'
import { runMigrations } from './migrate.js'
import {
  addLedger,
  addNotification,
  boostDimension,
  clamp,
  defaultChallenge,
  defaultSettings,
  ensureUserExtras,
  getFullProfile,
  recalculateScore,
} from './userService.js'
import crypto from 'node:crypto'

const app = express()
app.use(
  cors({
    origin: (origin, cb) => {
      // permite front docker :8080 e vite :5173
      const allowed = [
        env.CORS_ORIGIN,
        'http://localhost:8080',
        'http://localhost:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173',
      ]
      if (!origin || allowed.includes(origin)) cb(null, true)
      else cb(null, true)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

function initialsFrom(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2)
}

function companySeal(score: number): 'Ouro' | 'Prata' | 'Bronze' {
  if (score >= 85) return 'Ouro'
  if (score >= 70) return 'Prata'
  return 'Bronze'
}

/** Liveness — não depende do DB (Forja/compose healthcheck). */
app.get('/health', async (_req, res) => {
  const key = env.OPENROUTER_API_KEY
  let db = false
  let dbError: string | undefined
  try {
    await query('SELECT 1')
    db = true
  } catch (e) {
    dbError = String(e)
  }
  res.status(200).json({
    ok: true,
    db,
    dbError: db ? undefined : dbError,
    openrouter: Boolean(key),
    openrouterKeyPrefix: key ? `${key.slice(0, 8)}…` : null,
    model: env.OPENROUTER_MODEL,
    databaseUrlHost: (() => {
      try {
        return new URL(env.DATABASE_URL.replace(/^postgresql:/, 'http:')).hostname
      } catch {
        return null
      }
    })(),
  })
})

// —— Auth ——
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1).optional(),
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const body = authSchema.parse(req.body)
    const email = body.email.toLowerCase().trim()
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email])
    if (existing.rowCount) {
      res.status(409).json({ error: 'E-mail já cadastrado' })
      return
    }
    const name =
      body.name ||
      (email === 'ggampp@gmail.com' ? 'Guilherme Pimentel' : email.split('@')[0] || 'Membro do Bem')
    const passwordHash = await bcrypt.hash(body.password, 10)
    const onboarded = email === 'ggampp@gmail.com'
    const ins = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, role, onboarded, challenge, settings, achievements)
       VALUES ($1,$2,$3,'pessoa',$4,$5::jsonb,$6::jsonb,$7)
       RETURNING id`,
      [
        email,
        passwordHash,
        name,
        onboarded,
        JSON.stringify(defaultChallenge),
        JSON.stringify(defaultSettings),
        [
          'Coração de Ouro — 30 dias consecutivos no método',
          'Mediador do Bem — 5 mediações concluídas com sucesso',
          'Voz Empática — Top 10% em escuta ativa este mês',
        ],
      ],
    )
    const userId = ins.rows[0].id
    await ensureUserExtras(pool, userId, name)
    await recalculateScore(userId, { kind: 'signup', label: 'Cadastro inicial' })
    const token = signToken({ userId, email })
    const profile = await getFullProfile(userId)
    res.status(201).json({ token, user: profile })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const body = authSchema.parse(req.body)
    const email = body.email.toLowerCase().trim()
    let user = await query(`SELECT * FROM users WHERE email = $1`, [email])
    if (!user.rowCount) {
      // auto-register demo convenience
      const name =
        email === 'ggampp@gmail.com' ? 'Guilherme Pimentel' : email.split('@')[0] || 'Membro do Bem'
      const passwordHash = await bcrypt.hash(body.password, 10)
      const ins = await query<{ id: string }>(
        `INSERT INTO users (email, password_hash, name, role, onboarded, challenge, settings, achievements)
         VALUES ($1,$2,$3,'pessoa',$4,$5::jsonb,$6::jsonb,$7) RETURNING id`,
        [
          email,
          passwordHash,
          name,
          email === 'ggampp@gmail.com',
          JSON.stringify(defaultChallenge),
          JSON.stringify(defaultSettings),
          [
            'Coração de Ouro — 30 dias consecutivos no método',
            'Mediador do Bem — 5 mediações concluídas com sucesso',
            'Voz Empática — Top 10% em escuta ativa este mês',
          ],
        ],
      )
      await ensureUserExtras(pool, ins.rows[0].id, name)
      await recalculateScore(ins.rows[0].id, { kind: 'signup', label: 'Cadastro inicial' })
      user = await query(`SELECT * FROM users WHERE id = $1`, [ins.rows[0].id])
    } else {
      const ok = await bcrypt.compare(body.password, user.rows[0].password_hash)
      if (!ok) {
        res.status(401).json({ error: 'Senha inválida' })
        return
      }
      await ensureUserExtras(pool, user.rows[0].id, user.rows[0].name)
    }
    const u = user.rows[0]
    const token = signToken({ userId: u.id, email: u.email })
    const profile = await getFullProfile(u.id)
    res.json({ token, user: profile })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
  }
})

app.get('/api/me', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const profile = await getFullProfile(userId)
  if (!profile) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }
  res.json({ user: profile })
})

// —— Profile / settings / onboarding ——
app.patch('/api/me', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const { name, bio, city, onboarded, settings } = req.body as {
    name?: string
    bio?: string
    city?: string
    onboarded?: boolean
    settings?: Record<string, unknown>
  }
  if (settings) {
    await query(
      `UPDATE users SET settings = COALESCE(settings,'{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [userId, JSON.stringify(settings)],
    )
  }
  await query(
    `UPDATE users SET
      name = COALESCE($2, name),
      bio = COALESCE($3, bio),
      city = COALESCE($4, city),
      onboarded = COALESCE($5, onboarded),
      updated_at = NOW()
     WHERE id = $1`,
    [userId, name ?? null, bio ?? null, city ?? null, onboarded ?? null],
  )
  res.json({ user: await getFullProfile(userId) })
})

// —— Method ——
app.patch('/api/method/:pillarKey', authRequired, requirePermission('method.edit'), async (req, res) => {
  const { userId } = getAuth(req)
  const progress = clamp(Number(req.body.progress ?? 0))
  await query(
    `UPDATE method_pillars SET progress = $3 WHERE user_id = $1 AND pillar_key = $2`,
    [userId, req.params.pillarKey, progress],
  )
  await recalculateScore(userId, {
    kind: 'method',
    label: `Método atualizado: ${req.params.pillarKey} → ${progress}%`,
  })
  res.json({ user: await getFullProfile(userId) })
})

// —— Relations ——
app.post('/api/relations', authRequired, requirePermission('relations.manage'), async (req, res) => {
  const { userId } = getAuth(req)
  const { name, category, notes, email, phone } = req.body as {
    name: string
    category: string
    notes?: string
    email?: string
    phone?: string
  }
  if (!name?.trim()) {
    res.status(400).json({ error: 'Nome obrigatório' })
    return
  }
  await query(
    `INSERT INTO relations (user_id, name, category, notes, email, phone, last_interaction_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
    [
      userId,
      name.trim(),
      category || 'Amizade',
      notes || null,
      email?.trim() || null,
      phone?.trim() || null,
    ],
  )
  await query(`UPDATE users SET hearts = hearts + 1 WHERE id = $1`, [userId])
  await boostDimension(userId, 'confianca', 1)
  await recalculateScore(userId, {
    kind: 'relation_create',
    label: `Nova relação: ${name.trim()}`,
  })
  await addNotification(userId, 'relation', 'Nova relação', `${name} entrou no seu círculo do bem.`, '/app/relacoes')
  res.status(201).json({ user: await getFullProfile(userId) })
})

app.patch('/api/relations/:id', authRequired, requirePermission('relations.manage'), async (req, res) => {
  const { userId } = getAuth(req)
  const { name, category, notes, email, phone } = req.body as {
    name?: string
    category?: string
    notes?: string
    email?: string
    phone?: string
  }
  const r = await query(`UPDATE relations SET
      name = COALESCE($3, name),
      category = COALESCE($4, category),
      notes = COALESCE($5, notes),
      email = COALESCE($6, email),
      phone = COALESCE($7, phone),
      last_interaction_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id`, [
    req.params.id,
    userId,
    name ?? null,
    category ?? null,
    notes ?? null,
    email ?? null,
    phone ?? null,
  ])
  if (!r.rowCount) {
    res.status(404).json({ error: 'Relação não encontrada' })
    return
  }
  res.json({ user: await getFullProfile(userId) })
})

app.delete('/api/relations/:id', authRequired, requirePermission('relations.manage'), async (req, res) => {
  const { userId } = getAuth(req)
  await query(`DELETE FROM relations WHERE id = $1 AND user_id = $2`, [req.params.id, userId])
  await recalculateScore(userId, { kind: 'relation_delete', label: 'Relação removida' })
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/relations/:id/evaluate', authRequired, requirePermission('relations.manage'), async (req, res) => {
  const { userId } = getAuth(req)
  const d = req.body.dimensions as Record<string, number>
  const note = req.body.note as string | undefined
  if (!d) {
    res.status(400).json({ error: 'dimensions obrigatório' })
    return
  }
  const average = Math.round(
    (d.confianca + d.empatia + d.etica + d.cooperacao + d.responsabilidade) / 5,
  )
  const rel = await query(`SELECT id FROM relations WHERE id = $1 AND user_id = $2`, [
    req.params.id,
    userId,
  ])
  if (!rel.rowCount) {
    res.status(404).json({ error: 'Relação não encontrada' })
    return
  }
  await query(
    `INSERT INTO relation_evaluations
     (relation_id, confianca, empatia, etica, cooperacao, responsabilidade, average, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      req.params.id,
      d.confianca,
      d.empatia,
      d.etica,
      d.cooperacao,
      d.responsabilidade,
      average,
      note || null,
    ],
  )
  await query(
    `UPDATE relations SET score = $2, notes = COALESCE($3, notes), last_interaction_at = NOW() WHERE id = $1`,
    [req.params.id, average, note || null],
  )
  // blend dimensions lightly
  await query(
    `UPDATE users SET
      dim_confianca = LEAST(100, ROUND(dim_confianca * 0.88 + $2 * 0.12)),
      dim_empatia = LEAST(100, ROUND(dim_empatia * 0.88 + $3 * 0.12)),
      dim_etica = LEAST(100, ROUND(dim_etica * 0.88 + $4 * 0.12)),
      dim_cooperacao = LEAST(100, ROUND(dim_cooperacao * 0.88 + $5 * 0.12)),
      dim_responsabilidade = LEAST(100, ROUND(dim_responsabilidade * 0.88 + $6 * 0.12)),
      hearts = hearts + 1,
      updated_at = NOW()
     WHERE id = $1`,
    [userId, d.confianca, d.empatia, d.etica, d.cooperacao, d.responsabilidade],
  )
  await addLedger(userId, 'Avaliação de relação', 15)
  await recalculateScore(userId, {
    kind: 'relation_eval',
    label: `Avaliação de relação (média ${average})`,
    meta: { average, dimensions: d },
  })
  await addNotification(
    userId,
    'relation',
    'Avaliação registrada',
    `+15 GC · média ${average}/100`,
    '/app/relacoes',
  )
  res.json({ user: await getFullProfile(userId) })
})

// —— Challenge ——
app.post('/api/challenge/accept', authRequired, requirePermission('challenge.use'), async (req, res) => {
  const { userId } = getAuth(req)
  const u = await query(`SELECT challenge FROM users WHERE id = $1`, [userId])
  const challenge = { ...defaultChallenge, ...(u.rows[0]?.challenge || {}), accepted: true }
  await query(`UPDATE users SET challenge = $2::jsonb WHERE id = $1`, [
    userId,
    JSON.stringify(challenge),
  ])
  await addNotification(userId, 'challenge', 'Desafio aceito', challenge.title, '/app')
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/challenge/progress', authRequired, requirePermission('challenge.use'), async (req, res) => {
  const { userId } = getAuth(req)
  const u = await query(`SELECT challenge FROM users WHERE id = $1`, [userId])
  const ch = { ...defaultChallenge, ...(u.rows[0]?.challenge || {}) }
  if (!ch.accepted || ch.completed) {
    res.json({ user: await getFullProfile(userId) })
    return
  }
  ch.progress = Math.min(ch.target, (ch.progress || 0) + 1)
  ch.completed = ch.progress >= ch.target
  await query(`UPDATE users SET challenge = $2::jsonb WHERE id = $1`, [userId, JSON.stringify(ch)])
  if (ch.dimension) await boostDimension(userId, ch.dimension, 1)
  if (ch.pillarId) {
    await query(
      `UPDATE method_pillars SET progress = LEAST(100, progress + 5) WHERE user_id = $1 AND pillar_key = $2`,
      [userId, ch.pillarId],
    )
  }
  if (ch.completed) {
    await addLedger(userId, `Desafio: ${ch.title}`, ch.rewardGc)
    await query(`UPDATE users SET streak_days = streak_days + 1, hearts = hearts + 1 WHERE id = $1`, [
      userId,
    ])
    await addNotification(
      userId,
      'challenge',
      'Desafio concluído!',
      `+${ch.rewardGc} GoodCoins`,
      '/app/beneficios',
    )
  }
  await recalculateScore(userId, {
    kind: 'challenge',
    label: ch.completed ? 'Desafio concluído' : 'Progresso no desafio',
  })
  res.json({ user: await getFullProfile(userId) })
})

// —— Catalog ——
app.get('/api/catalog/companies', async (_req, res) => {
  const r = await query(`SELECT * FROM companies ORDER BY score DESC`)
  res.json({
    companies: r.rows.map((c) => ({
      id: c.id,
      name: c.name,
      initials: c.initials,
      category: c.category,
      seal: c.seal,
      score: c.score,
      city: c.city,
      state: c.state,
      description: c.description,
      website: c.website,
      phone: c.phone,
      isCertified: c.is_certified ?? true,
      createdBy: c.created_by,
    })),
  })
})

app.get('/api/catalog/benefits', async (_req, res) => {
  const r = await query(
    `SELECT * FROM benefits WHERE COALESCE(active, TRUE) = TRUE ORDER BY cost`,
  )
  res.json({
    benefits: r.rows.map((b) => ({
      id: b.id,
      title: b.title,
      companyId: b.company_id,
      type: b.type,
      valueLabel: b.value_label,
      cost: b.cost,
      featured: b.featured,
    })),
  })
})

app.get('/api/catalog/influencers', async (_req, res) => {
  const r = await query(`SELECT * FROM influencers ORDER BY score DESC`)
  res.json({
    influencers: r.rows.map((i) => ({
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
  })
})

app.get('/api/catalog/partners', async (_req, res) => {
  const r = await query(`SELECT * FROM partners ORDER BY hearts_required`)
  res.json({
    partners: r.rows.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      discount: p.discount,
      heartsRequired: p.hearts_required,
      active: p.active,
      address: p.address,
      companyId: p.company_id,
    })),
  })
})

app.get('/api/catalog/causes', async (_req, res) => {
  const r = await query(`SELECT * FROM causes`)
  res.json({
    causes: r.rows.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      raised: c.raised,
      goal: c.goal,
    })),
  })
})

app.get('/api/catalog/community', async (_req, res) => {
  const [posts, events, library] = await Promise.all([
    query(`SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 50`),
    query(`SELECT * FROM community_events ORDER BY event_date ASC`),
    query(`SELECT * FROM library_items`),
  ])
  res.json({
    posts: posts.rows.map((p) => ({
      id: p.id,
      type: p.type,
      author: p.author_name,
      title: p.title,
      body: p.body,
      tags: p.tags,
      likes: p.likes,
      createdAt: p.created_at,
    })),
    events: events.rows.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.event_date,
      location: e.location,
      description: e.description,
      attendees: e.attendees,
    })),
    library: library.rows.map((l) => ({
      id: l.id,
      title: l.title,
      kind: l.kind,
      minutes: l.minutes,
      pillar: l.pillar,
      summary: l.summary,
    })),
  })
})

// —— Marketplace / fundo / community actions ——
app.post('/api/benefits/:id/redeem', authRequired, requirePermission('benefits.redeem'), async (req, res) => {
  const { userId } = getAuth(req)
  const b = await query(`SELECT * FROM benefits WHERE id = $1`, [req.params.id])
  if (!b.rowCount) {
    res.status(404).json({ error: 'Benefício não encontrado' })
    return
  }
  const benefit = b.rows[0]
  const u = await query(`SELECT goodcoins FROM users WHERE id = $1`, [userId])
  if (u.rows[0].goodcoins < benefit.cost) {
    res.status(400).json({ error: 'Saldo insuficiente' })
    return
  }
  const already = await query(
    `SELECT 1 FROM redeemed_benefits WHERE user_id = $1 AND benefit_id = $2`,
    [userId, benefit.id],
  )
  if (already.rowCount) {
    res.status(400).json({ error: 'Já resgatado' })
    return
  }
  await query(`INSERT INTO redeemed_benefits (user_id, benefit_id) VALUES ($1,$2)`, [
    userId,
    benefit.id,
  ])
  await addLedger(userId, `Resgate: ${benefit.title}`, -benefit.cost)
  await addNotification(userId, 'marketplace', 'Resgate confirmado', benefit.title, '/app/beneficios')
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/causes/:id/support', authRequired, requirePermission('fundo.support'), async (req, res) => {
  const { userId } = getAuth(req)
  const amount = Number(req.body.amount || 50)
  const c = await query(`SELECT * FROM causes WHERE id = $1`, [req.params.id])
  if (!c.rowCount) {
    res.status(404).json({ error: 'Causa não encontrada' })
    return
  }
  const u = await query(`SELECT goodcoins FROM users WHERE id = $1`, [userId])
  if (u.rows[0].goodcoins < amount) {
    res.status(400).json({ error: 'Saldo insuficiente' })
    return
  }
  await query(
    `INSERT INTO cause_contributions (user_id, cause_id, amount_gc) VALUES ($1,$2,$3)`,
    [userId, req.params.id, amount],
  )
  await addLedger(userId, `Apoio: ${c.rows[0].title}`, -amount)
  await query(`UPDATE users SET hearts = hearts + 1 WHERE id = $1`, [userId])
  await boostDimension(userId, 'cooperacao', 1)
  await recalculateScore(userId, {
    kind: 'fundo',
    label: `Apoio à causa ${c.rows[0].title}`,
  })
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/community/posts', authRequired, requirePermission('community.post'), async (req, res) => {
  const { userId } = getAuth(req)
  const { type, title, body, tags } = req.body as {
    type: string
    title: string
    body: string
    tags?: string[]
  }
  const u = await query(
    `SELECT name, primary_tenant_id FROM users WHERE id = $1`,
    [userId],
  )
  await query(
    `INSERT INTO community_posts (user_id, author_name, type, title, body, tags, tenant_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      userId,
      u.rows[0].name,
      type || 'historia',
      title,
      body,
      tags || [],
      u.rows[0].primary_tenant_id || null,
    ],
  )
  await addLedger(userId, 'Publicação na comunidade', 10)
  await query(`UPDATE users SET hearts = hearts + 1 WHERE id = $1`, [userId])
  res.status(201).json({ user: await getFullProfile(userId) })
})

app.post('/api/community/posts/:id/like', authRequired, requirePermission('community.interact'), async (req, res) => {
  const { userId } = getAuth(req)
  const exists = await query(
    `SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2`,
    [userId, req.params.id],
  )
  if (exists.rowCount) {
    await query(`DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2`, [
      userId,
      req.params.id,
    ])
    await query(`UPDATE community_posts SET likes = GREATEST(0, likes - 1) WHERE id = $1`, [
      req.params.id,
    ])
  } else {
    await query(`INSERT INTO post_likes (user_id, post_id) VALUES ($1,$2)`, [
      userId,
      req.params.id,
    ])
    await query(`UPDATE community_posts SET likes = likes + 1 WHERE id = $1`, [req.params.id])
  }
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/community/events/:id/join', authRequired, requirePermission('community.interact'), async (req, res) => {
  const { userId } = getAuth(req)
  await query(
    `INSERT INTO event_rsvps (user_id, event_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [userId, req.params.id],
  )
  await query(`UPDATE users SET hearts = hearts + 1 WHERE id = $1`, [userId])
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/library/:id/complete', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  await query(
    `INSERT INTO library_completions (user_id, item_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [userId, req.params.id],
  )
  const item = await query(`SELECT pillar FROM library_items WHERE id = $1`, [req.params.id])
  if (item.rows[0]?.pillar) {
    await query(
      `UPDATE method_pillars SET progress = LEAST(100, progress + 3)
       WHERE user_id = $1 AND pillar_key = $2`,
      [userId, item.rows[0].pillar],
    )
  }
  await addLedger(userId, 'Conteúdo da biblioteca', 5)
  await recalculateScore(userId, { kind: 'library', label: 'Conteúdo da biblioteca concluído' })
  res.json({ user: await getFullProfile(userId) })
})

// —— Cadastros (empresas, parceiros, influenciadores, benefícios) ——
app.post('/api/companies', authRequired, requirePermission('companies.create'), async (req, res) => {
  const { userId } = getAuth(req)
  const body = req.body as {
    name: string
    category: string
    city?: string
    state?: string
    description?: string
    website?: string
    phone?: string
  }
  if (!body.name?.trim()) {
    res.status(400).json({ error: 'Nome da empresa obrigatório' })
    return
  }
  const existing = await query<{ company_id: string | null; role: string }>(
    `SELECT company_id, role FROM users WHERE id = $1`,
    [userId],
  )
  const role = normalizeRole(existing.rows[0]?.role)
  // Perfil empresa: só um negócio vinculado
  if (role === 'empresa' && existing.rows[0]?.company_id) {
    res.status(403).json({
      error: 'Você já tem uma empresa cadastrada. Edite a existente em vez de criar outra.',
    })
    return
  }
  const id = crypto.randomUUID()
  const score = 60
  const seal = companySeal(score)
  const tu = await query<{ primary_tenant_id: string | null }>(
    `SELECT primary_tenant_id FROM users WHERE id = $1`,
    [userId],
  )
  await query(
    `INSERT INTO companies
     (id, name, initials, category, seal, score, city, state, description, website, phone, created_by, is_certified, tenant_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,FALSE,$13)`,
    [
      id,
      body.name.trim(),
      initialsFrom(body.name),
      body.category || 'Geral',
      seal,
      score,
      body.city || 'São Paulo',
      body.state || 'SP',
      body.description || 'Empresa cadastrada na comunidade Sou do Bem.',
      body.website || null,
      body.phone || null,
      userId,
      tu.rows[0]?.primary_tenant_id || null,
    ],
  )
  await query(`UPDATE users SET company_id = $2 WHERE id = $1`, [userId, id])
  await query(
    `INSERT INTO company_cert_requests (user_id, company_id, status, notes)
     VALUES ($1,$2,'pendente',$3)`,
    [userId, id, 'Aguardando análise para selo certificado'],
  )
  await addNotification(
    userId,
    'system',
    'Empresa cadastrada',
    `${body.name.trim()} entrou no catálogo (certificação pendente).`,
    '/app/empresas',
  )
  await query(`UPDATE users SET hearts = hearts + 1 WHERE id = $1`, [userId])
  res.status(201).json({ id, user: await getFullProfile(userId) })
})

app.patch('/api/companies/:id', authRequired, requirePermission('companies.edit_own'), async (req, res) => {
  const { userId } = getAuth(req)
  const c = await query(`SELECT * FROM companies WHERE id = $1`, [req.params.id])
  if (!c.rowCount) {
    res.status(404).json({ error: 'Empresa não encontrada' })
    return
  }
  const u = await query<{ company_id: string | null; role: string }>(
    `SELECT company_id, role FROM users WHERE id = $1`,
    [userId],
  )
  const role = normalizeRole(u.rows[0]?.role)
  const owns =
    role === 'admin' ||
    c.rows[0].created_by === userId ||
    u.rows[0]?.company_id === req.params.id
  if (!owns) {
    res.status(403).json({ error: 'Você só pode editar a empresa vinculada ao seu perfil.' })
    return
  }
  const b = req.body as Record<string, string | number | undefined>
  await query(
    `UPDATE companies SET
      name = COALESCE($2, name),
      category = COALESCE($3, category),
      city = COALESCE($4, city),
      state = COALESCE($5, state),
      description = COALESCE($6, description),
      website = COALESCE($7, website),
      phone = COALESCE($8, phone),
      initials = COALESCE($9, initials)
     WHERE id = $1`,
    [
      req.params.id,
      b.name ?? null,
      b.category ?? null,
      b.city ?? null,
      b.state ?? null,
      b.description ?? null,
      b.website ?? null,
      b.phone ?? null,
      b.name ? initialsFrom(String(b.name)) : null,
    ],
  )
  res.json({ user: await getFullProfile(userId) })
})

app.post(
  '/api/companies/:id/certify-request',
  authRequired,
  requirePermission('companies.certify_own'),
  async (req, res) => {
  const { userId } = getAuth(req)
  // demo: auto-aprova e sobe score/selo
  const c = await query(`SELECT * FROM companies WHERE id = $1`, [req.params.id])
  if (!c.rowCount) {
    res.status(404).json({ error: 'Empresa não encontrada' })
    return
  }
  const u = await query<{ company_id: string | null; role: string }>(
    `SELECT company_id, role FROM users WHERE id = $1`,
    [userId],
  )
  const role = normalizeRole(u.rows[0]?.role)
  const owns =
    role === 'admin' ||
    c.rows[0].created_by === userId ||
    u.rows[0]?.company_id === req.params.id
  if (!owns) {
    res.status(403).json({ error: 'Só a empresa dona do cadastro pode solicitar certificação.' })
    return
  }
  const newScore = Math.min(100, (c.rows[0].score || 60) + 15)
  await query(
    `UPDATE companies SET is_certified = TRUE, score = $2, seal = $3 WHERE id = $1`,
    [req.params.id, newScore, companySeal(newScore)],
  )
  await query(
    `INSERT INTO company_cert_requests (user_id, company_id, status, notes)
     VALUES ($1,$2,'aprovado',$3)`,
    [userId, req.params.id, 'Certificação demo aprovada'],
  )
  await addLedger(userId, 'Certificação de empresa', 30)
  await boostDimension(userId, 'etica', 2)
  await recalculateScore(userId, {
    kind: 'certify',
    label: `Certificação: ${c.rows[0].name}`,
  })
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/partners', authRequired, requirePermission('partners.create'), async (req, res) => {
  const { userId } = getAuth(req)
  const b = req.body as {
    name: string
    category?: string
    discount?: string
    heartsRequired?: number
    address?: string
    companyId?: string
  }
  if (!b.name?.trim()) {
    res.status(400).json({ error: 'Nome obrigatório' })
    return
  }
  const u = await query<{ company_id: string | null; role: string }>(
    `SELECT company_id, role FROM users WHERE id = $1`,
    [userId],
  )
  const role = normalizeRole(u.rows[0]?.role)
  let companyId = b.companyId || null
  // Empresa só cadastra parceiro do próprio negócio
  if (role === 'empresa') {
    companyId = u.rows[0]?.company_id || companyId
    if (!companyId) {
      res.status(400).json({ error: 'Cadastre sua empresa antes de criar parceiros.' })
      return
    }
  }
  const id = `p-${crypto.randomUUID().slice(0, 8)}`
  await query(
    `INSERT INTO partners (id, name, category, discount, hearts_required, active, address, company_id, created_by)
     VALUES ($1,$2,$3,$4,$5,TRUE,$6,$7,$8)`,
    [
      id,
      b.name.trim(),
      b.category || 'Geral',
      b.discount || '5% para membros',
      Number(b.heartsRequired ?? 1),
      b.address || null,
      companyId,
      userId,
    ],
  )
  await addNotification(userId, 'system', 'Parceiro cadastrado', b.name.trim(), '/app/parceiros')
  res.status(201).json({ id, user: await getFullProfile(userId) })
})

app.post('/api/influencers', authRequired, requirePermission('influencers.create'), async (req, res) => {
  const { userId } = getAuth(req)
  const b = req.body as {
    name: string
    handle?: string
    niche?: string
    bio?: string
  }
  if (!b.name?.trim()) {
    res.status(400).json({ error: 'Nome obrigatório' })
    return
  }
  const id = crypto.randomUUID()
  const handle =
    b.handle?.trim() ||
    `@${b.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .slice(0, 20)}`
  await query(
    `INSERT INTO influencers
     (id, name, handle, niche, bio, score, reach, engagement, verified, rising, created_by)
     VALUES ($1,$2,$3,$4,$5,70,'1.0K','3.0%',FALSE,TRUE,$6)`,
    [
      id,
      b.name.trim(),
      handle.startsWith('@') ? handle : `@${handle}`,
      b.niche || 'Comunidade',
      b.bio || 'Voz da comunidade Sou do Bem.',
      userId,
    ],
  )
  res.status(201).json({ id, user: await getFullProfile(userId) })
})

app.post('/api/benefits', authRequired, requirePermission('benefits.create'), async (req, res) => {
  const { userId } = getAuth(req)
  const b = req.body as {
    title: string
    companyId: string
    type?: string
    valueLabel?: string
    cost?: number
    featured?: boolean
  }
  if (!b.title?.trim() || !b.companyId) {
    res.status(400).json({ error: 'title e companyId obrigatórios' })
    return
  }
  const company = await query<{ id: string; created_by: string | null }>(
    `SELECT id, created_by FROM companies WHERE id = $1`,
    [b.companyId],
  )
  if (!company.rowCount) {
    res.status(400).json({ error: 'Empresa inválida' })
    return
  }
  const u = await query<{ company_id: string | null; role: string }>(
    `SELECT company_id, role FROM users WHERE id = $1`,
    [userId],
  )
  const role = normalizeRole(u.rows[0]?.role)
  const owns =
    role === 'admin' ||
    company.rows[0].created_by === userId ||
    u.rows[0]?.company_id === b.companyId
  if (!owns) {
    res.status(403).json({ error: 'Só a empresa dona pode criar benefícios no marketplace.' })
    return
  }
  const id = `b-${crypto.randomUUID().slice(0, 8)}`
  await query(
    `INSERT INTO benefits (id, title, company_id, type, value_label, cost, featured, created_by, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)`,
    [
      id,
      b.title.trim(),
      b.companyId,
      b.type || 'Produto',
      b.valueLabel || 'Benefício exclusivo',
      Number(b.cost ?? 100),
      Boolean(b.featured),
      userId,
    ],
  )
  res.status(201).json({ id, user: await getFullProfile(userId) })
})

app.post('/api/partners/:id/favorite', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const exists = await query(
    `SELECT 1 FROM favorite_partners WHERE user_id = $1 AND partner_id = $2`,
    [userId, req.params.id],
  )
  if (exists.rowCount) {
    await query(`DELETE FROM favorite_partners WHERE user_id = $1 AND partner_id = $2`, [
      userId,
      req.params.id,
    ])
  } else {
    await query(`INSERT INTO favorite_partners (user_id, partner_id) VALUES ($1,$2)`, [
      userId,
      req.params.id,
    ])
  }
  res.json({ user: await getFullProfile(userId) })
})

// —— Favorites / follow / reviews ——
app.post('/api/companies/:id/favorite', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const exists = await query(
    `SELECT 1 FROM favorite_companies WHERE user_id = $1 AND company_id = $2`,
    [userId, req.params.id],
  )
  if (exists.rowCount) {
    await query(`DELETE FROM favorite_companies WHERE user_id = $1 AND company_id = $2`, [
      userId,
      req.params.id,
    ])
  } else {
    await query(`INSERT INTO favorite_companies (user_id, company_id) VALUES ($1,$2)`, [
      userId,
      req.params.id,
    ])
  }
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/companies/:id/review', authRequired, requirePermission('companies.review'), async (req, res) => {
  const { userId } = getAuth(req)
  const rating = clamp(Number(req.body.rating || 5), 1, 5)
  const comment = String(req.body.comment || 'Sem comentário')
  await query(
    `INSERT INTO company_reviews (user_id, company_id, rating, comment)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, company_id) DO UPDATE SET rating = $3, comment = $4, created_at = NOW()`,
    [userId, req.params.id, rating, comment],
  )
  await addLedger(userId, 'Avaliação de empresa', 10)
  await query(`UPDATE users SET hearts = hearts + 1 WHERE id = $1`, [userId])
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/influencers/:id/follow', authRequired, requirePermission('influencers.follow'), async (req, res) => {
  const { userId } = getAuth(req)
  const exists = await query(
    `SELECT 1 FROM following_influencers WHERE user_id = $1 AND influencer_id = $2`,
    [userId, req.params.id],
  )
  if (exists.rowCount) {
    await query(`DELETE FROM following_influencers WHERE user_id = $1 AND influencer_id = $2`, [
      userId,
      req.params.id,
    ])
  } else {
    await query(`INSERT INTO following_influencers (user_id, influencer_id) VALUES ($1,$2)`, [
      userId,
      req.params.id,
    ])
  }
  res.json({ user: await getFullProfile(userId) })
})

// —— Mediation ——
app.post('/api/mediations', authRequired, requirePermission('mediations.create'), async (req, res) => {
  const { userId } = getAuth(req)
  const { title, withWhom, notes } = req.body as {
    title: string
    withWhom: string
    notes?: string
  }
  const tu = await query<{ primary_tenant_id: string | null }>(
    `SELECT primary_tenant_id FROM users WHERE id = $1`,
    [userId],
  )
  const ins = await query<{ id: string }>(
    `INSERT INTO mediations (user_id, title, with_whom, notes, tenant_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [userId, title, withWhom, notes || null, tu.rows[0]?.primary_tenant_id || null],
  )
  await query(
    `INSERT INTO mediation_messages (mediation_id, role, content) VALUES ($1,'ai',$2)`,
    [
      ins.rows[0].id,
      `Vamos estruturar a mediação “${title}” com ${withWhom}. Passo 1: descreva só os fatos observáveis (sem adjetivos pejorativos).`,
    ],
  )
  res.status(201).json({ user: await getFullProfile(userId) })
})

app.post('/api/mediations/:id/message', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const text = String(req.body.text || '').trim()
  const m = await query(`SELECT * FROM mediations WHERE id = $1 AND user_id = $2`, [
    req.params.id,
    userId,
  ])
  if (!m.rowCount || !text) {
    res.status(400).json({ error: 'Mediação/mensagem inválida' })
    return
  }
  await query(
    `INSERT INTO mediation_messages (mediation_id, role, content) VALUES ($1,'user',$2)`,
    [req.params.id, text],
  )
  const count = await query(
    `SELECT COUNT(*)::int AS n FROM mediation_messages WHERE mediation_id = $1 AND role = 'user'`,
    [req.params.id],
  )
  const steps = [
    'Passo 2: diga qual necessidade ou valor foi impactado (segurança, respeito, clareza, parceria…).',
    'Passo 3: formule um pedido concreto e verificável (o que, quando, como).',
    'Passo 4: imagine o que a outra pessoa diria se se sentisse ouvida. Ajuste o tom.',
    'Passo 5: proponha um acordo de 1–3 itens e defina como vão revisar em 7 dias.',
    'Ótimo. Quando quiser, marque a mediação como resolvida e registre o acordo final.',
  ]
  const step = Math.min(count.rows[0].n - 1, steps.length - 1)
  await query(
    `INSERT INTO mediation_messages (mediation_id, role, content) VALUES ($1,'ai',$2)`,
    [req.params.id, steps[step]],
  )
  res.json({ user: await getFullProfile(userId) })
})

app.patch(
  '/api/mediations/:id',
  authRequired,
  requirePermission('mediations.create', 'mediations.manage'),
  async (req, res) => {
  const { userId } = getAuth(req)
  const { status, agreement } = req.body as { status?: string; agreement?: string }
  await query(
    `UPDATE mediations SET status = COALESCE($3, status), agreement = COALESCE($4, agreement)
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, userId, status || null, agreement || null],
  )
  if (status === 'resolvida') {
    await boostDimension(userId, 'etica', 2)
    await boostDimension(userId, 'responsabilidade', 2)
    await query(`UPDATE users SET hearts = hearts + 2 WHERE id = $1`, [userId])
    await addLedger(userId, 'Mediação resolvida', 40)
    await recalculateScore(userId, { kind: 'mediation', label: 'Mediação resolvida' })
  }
  res.json({ user: await getFullProfile(userId) })
})

// —— Notifications ——
app.post('/api/notifications/read-all', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  await query(`UPDATE notifications SET read = TRUE WHERE user_id = $1`, [userId])
  res.json({ user: await getFullProfile(userId) })
})

app.post('/api/notifications/:id/read', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  await query(`UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2`, [
    req.params.id,
    userId,
  ])
  res.json({ user: await getFullProfile(userId) })
})

// —— OpenRouter chat ——
app.post('/api/ai/chat', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const message = String(req.body.message || '').trim()
  if (!message) {
    res.status(400).json({ error: 'message obrigatório' })
    return
  }

  await query(`INSERT INTO chat_messages (user_id, role, content) VALUES ($1,'user',$2)`, [
    userId,
    message,
  ])

  const profile = await getFullProfile(userId)
  if (!profile) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }

  const history = await query<{ role: string; content: string }>(
    `SELECT role, content FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 16`,
    [userId],
  )
  const turns = history.rows
    .reverse()
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const system = buildSystemPrompt({
    name: profile.name,
    role: profile.role,
    intent: profile.intent,
    tenantName: profile.tenant
      ? `${profile.tenant.name} (${profile.tenant.region})`
      : undefined,
    score: profile.score,
    seal: profile.seal,
    goodcoins: profile.goodcoins,
    hearts: profile.hearts,
    streakDays: profile.streakDays,
    dimensions: profile.dimensions,
    methodSummary: profile.method.map((p) => `${p.title}:${p.progress}%`).join(', '),
    relationsSummary:
      profile.relations.length === 0
        ? 'nenhuma relação cadastrada'
        : profile.relations
            .slice(0, 5)
            .map((r) => `${r.name}(${r.category}, score ${r.score})`)
            .join('; '),
  })

  try {
    const { reply, toolsUsed } = await chatWithTools(system, turns, userId)
    await query(`INSERT INTO chat_messages (user_id, role, content) VALUES ($1,'assistant',$2)`, [
      userId,
      reply,
    ])
    res.json({
      reply,
      toolsUsed,
      user: await getFullProfile(userId),
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    const fallback = `Não consegui falar com o OpenRouter agora (${err}). Verifique OPENROUTER_API_KEY no .env e tente de novo.`
    await query(`INSERT INTO chat_messages (user_id, role, content) VALUES ($1,'assistant',$2)`, [
      userId,
      fallback,
    ])
    res.status(502).json({ error: err, reply: fallback, user: await getFullProfile(userId) })
  }
})

/** Contexto do usuário logado (API REST espelhando as tools MCP) */
async function handleAiContext(req: express.Request, res: express.Response) {
  const { userId } = getAuth(req)
  const slice = (req.params.slice || 'full') as
    | 'profile'
    | 'score'
    | 'relations'
    | 'interactions'
    | 'posts'
    | 'method'
    | 'mediations'
    | 'ledger'
    | 'notifications'
    | 'tenant'
    | 'full'
  const limit = Number(req.query.limit) || 30
  const data = await getUserContext(userId, slice, limit)
  if (!data) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }
  res.json(data)
}
app.get('/api/ai/context', authRequired, handleAiContext)
app.get('/api/ai/context/:slice', authRequired, handleAiContext)

app.get('/api/ai/tools', (_req, res) => {
  res.json({ tools: LLM_TOOLS })
})

app.post('/api/ai/tools/:name', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const result = await executeUserTool(userId, req.params.name, req.body || {})
  res.json({ name: req.params.name, result })
})

app.post('/api/ai/clear', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  await query(`DELETE FROM chat_messages WHERE user_id = $1`, [userId])
  const u = await query(`SELECT name FROM users WHERE id = $1`, [userId])
  await query(`INSERT INTO chat_messages (user_id, role, content) VALUES ($1,'assistant',$2)`, [
    userId,
    `Conversa reiniciada. Olá, ${u.rows[0].name.split(' ')[0]}! Como posso ajudar na sua jornada do Bem?`,
  ])
  res.json({ user: await getFullProfile(userId) })
})

// —— Reset demo ——
app.post('/api/me/reset', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const u = await query(`SELECT email, name, password_hash FROM users WHERE id = $1`, [userId])
  if (!u.rowCount) {
    res.status(404).json({ error: 'not found' })
    return
  }
  await query(`DELETE FROM users WHERE id = $1`, [userId])
  const ins = await query<{ id: string }>(
    `INSERT INTO users (id, email, password_hash, name, onboarded, challenge, settings, achievements)
     VALUES ($1,$2,$3,$4,TRUE,$5::jsonb,$6::jsonb,$7) RETURNING id`,
    [
      userId,
      u.rows[0].email,
      u.rows[0].password_hash,
      u.rows[0].name,
      JSON.stringify(defaultChallenge),
      JSON.stringify(defaultSettings),
      [
        'Coração de Ouro — 30 dias consecutivos no método',
        'Mediador do Bem — 5 mediações concluídas com sucesso',
        'Voz Empática — Top 10% em escuta ativa este mês',
      ],
    ],
  )
  await ensureUserExtras(pool, ins.rows[0].id, u.rows[0].name)
  await recalculateScore(ins.rows[0].id, { kind: 'reset', label: 'Reset demo' })
  res.json({ user: await getFullProfile(userId) })
})

// —— Multi-tenant + perfis ——
app.get('/api/tenants', async (_req, res) => {
  res.json({ tenants: await listTenants(), roles: ROLE_META })
})

app.get('/api/roles', (_req, res) => {
  res.json({
    roles: Object.entries(ROLE_META).map(([id, meta]) => ({ id, ...meta })),
  })
})

app.post('/api/me/role', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const role = normalizeRole(String(req.body.role || 'pessoa'))
  const tenantId = req.body.tenantId as string | undefined
  const intent = req.body.intent as string | undefined
  const onboarded = req.body.onboarded !== false

  if (role === 'admin') {
    res.status(400).json({ error: 'Não é possível auto-atribuir admin' })
    return
  }

  // Executivo e mediador precisam de território
  if ((role === 'executivo' || role === 'mediador') && !tenantId) {
    res.status(400).json({ error: 'Selecione um território (tenant) para este perfil' })
    return
  }

  await setUserRole(userId, role as AppRole, {
    tenantId:
      tenantId ||
      (role === 'pessoa' || role === 'empresa' || role === 'influenciador'
        ? ((await listTenants()).find((t) => t.slug === 'sudeste')?.id as string | undefined)
        : undefined),
    intent: intent || ROLE_META[role as Exclude<AppRole, 'admin'>]?.tagline,
  })

  if (onboarded) {
    await query(`UPDATE users SET onboarded = TRUE WHERE id = $1`, [userId])
  }

  // Atalhos por perfil
  if (role === 'empresa') {
    // ok — painel lista empresas created_by
  }
  if (role === 'influenciador') {
    const existing = await query(`SELECT id FROM influencers WHERE created_by = $1 LIMIT 1`, [
      userId,
    ])
    if (!existing.rowCount) {
      const u = await query(`SELECT name FROM users WHERE id = $1`, [userId])
      const id = crypto.randomUUID()
      const handle = `@${String(u.rows[0].name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .slice(0, 18)}`
      await query(
        `INSERT INTO influencers (id, name, handle, niche, bio, score, reach, engagement, verified, rising, created_by, tenant_id)
         VALUES ($1,$2,$3,'Comunidade','Perfil criado no onboarding',70,'0.5K','2.0%',FALSE,TRUE,$4,$5)`,
        [id, u.rows[0].name, handle, userId, tenantId || null],
      )
      await query(`UPDATE users SET influencer_id = $2 WHERE id = $1`, [userId, id])
    }
  }

  await addNotification(
    userId,
    'system',
    'Perfil definido',
    `Você está como ${ROLE_META[role as Exclude<AppRole, 'admin'>]?.label || role}.`,
    '/app',
  )

  res.json({ user: await getFullProfile(userId) })
})

app.get(
  '/api/tenants/:id/dashboard',
  authRequired,
  requireRoles('executivo', 'admin'),
  async (req, res) => {
    const data = await getExecutiveDashboard(req.params.id)
    res.json(data)
  },
)

app.get('/api/panels/empresa', authRequired, requireRoles('empresa', 'admin'), async (req, res) => {
  const { userId } = getAuth(req)
  res.json(await getCompanyPanel(userId))
})

app.get(
  '/api/panels/influenciador',
  authRequired,
  requireRoles('influenciador', 'admin'),
  async (req, res) => {
    const { userId } = getAuth(req)
    res.json(await getInfluencerPanel(userId))
  },
)

app.get(
  '/api/panels/mediador',
  authRequired,
  requireRoles('mediador', 'admin'),
  async (req, res) => {
    const { userId } = getAuth(req)
    const u = await query<{ primary_tenant_id: string | null }>(
      `SELECT primary_tenant_id FROM users WHERE id = $1`,
      [userId],
    )
    res.json(await getMediatorQueue(u.rows[0]?.primary_tenant_id || null, userId))
  },
)

app.post(
  '/api/mediations/:id/claim',
  authRequired,
  requireRoles('mediador', 'admin'),
  async (req, res) => {
    const { userId } = getAuth(req)
    const r = await query(
      `UPDATE mediations SET mediator_id = $2, assigned_at = NOW()
       WHERE id = $1 AND mediator_id IS NULL AND status = 'aberta'
       RETURNING id`,
      [req.params.id, userId],
    )
    if (!r.rowCount) {
      res.status(409).json({ error: 'Mediação indisponível ou já atribuída' })
      return
    }
    await query(
      `INSERT INTO mediation_messages (mediation_id, role, content) VALUES ($1,'system',$2)`,
      [req.params.id, 'Um mediador do território assumiu este caso e irá conduzir o diálogo.'],
    )
    res.json({ user: await getFullProfile(userId) })
  },
)

app.get('/api/score/explain', authRequired, async (req, res) => {
  const { userId } = getAuth(req)
  const profile = await getFullProfile(userId)
  if (!profile) {
    res.status(404).json({ error: 'not found' })
    return
  }
  res.json({
    score: profile.score,
    seal: profile.seal,
    breakdown: profile.scoreBreakdown,
    seals: [
      { min: 85, name: 'Exemplar' },
      { min: 75, name: 'Confiável' },
      { min: 60, name: 'Em evolução' },
      { min: 0, name: 'Iniciante' },
    ],
    howToIncrease: [
      'Avalie relações reais nas 5 dimensões',
      'Evolua os 5 pilares do Método com honestidade',
      'Conclua desafios diários e mediações',
      'Apoie causas e publique na comunidade',
      'Avalie empresas com transparência',
    ],
    events: profile.scoreEvents,
    history: profile.scoreHistory,
  })
})

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' })
})

async function main() {
  await runMigrations()
  app.listen(env.PORT, () => {
    console.log(`Sou do Bem API em http://localhost:${env.PORT}`)
    console.log(`OpenRouter: ${env.OPENROUTER_API_KEY ? 'configurado' : 'SEM CHAVE'}`)
    console.log(`Modelo: ${env.OPENROUTER_MODEL}`)
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
