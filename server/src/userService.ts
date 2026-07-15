import type pg from 'pg'
import { query } from './db.js'
import { clamp, computeScore, sealFromScore, type Dimensions } from './score.js'
import { normalizeRole } from './roles.js'
import { getUserMemberships } from './tenantService.js'

const DEFAULT_PILLARS = [
  {
    key: 'autoconhecimento',
    title: 'Autoconhecimento',
    description: 'Reconheça padrões, valores e limites pessoais.',
    practices: ['Diário de gratidão', 'Mapeamento de valores', 'Reflexão diária guiada'],
    progress: 12,
  },
  {
    key: 'empatia',
    title: 'Empatia',
    description: 'Cultive a capacidade de se colocar no lugar do outro.',
    practices: ['Escuta ativa', 'Perguntas abertas', 'Pausa antes de responder'],
    progress: 18,
  },
  {
    key: 'comunicacao',
    title: 'Comunicação consciente',
    description: 'Fale com clareza, ouça com presença, conecte com verdade.',
    practices: ['Comunicação não-violenta', 'Feedback honesto', 'Linguagem positiva'],
    progress: 10,
  },
  {
    key: 'etica',
    title: 'Ética e responsabilidade',
    description: 'Aja com integridade — combinados, palavra, presença.',
    practices: ['Cumprir combinados', 'Assumir erros', 'Coerência entre fala e ação'],
    progress: 15,
  },
  {
    key: 'contribuicao',
    title: 'Contribuição',
    description: 'Gere valor para pessoas, comunidades e causas.',
    practices: ['Pequenos gestos diários', 'Voluntariado', 'Mentoria'],
    progress: 8,
  },
]

export const defaultChallenge = {
  id: 'challenge-escuta',
  title: 'Pratique a escuta ativa hoje',
  description:
    'Em sua próxima conversa, ouça por 2 minutos sem interromper. Depois resuma o que entendeu.',
  progress: 0,
  target: 3,
  rewardGc: 25,
  completed: false,
  accepted: false,
  daysLeft: 3,
  dimension: 'empatia',
  pillarId: 'empatia',
}

export const defaultSettings = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  showScorePublicly: false,
  allowRelationInvites: true,
  theme: 'light',
  language: 'pt-BR',
}

export async function ensureUserExtras(
  client: pg.PoolClient | typeof import('./db.js'),
  userId: string,
  name: string,
) {
  const pillars = await client.query(`SELECT 1 FROM method_pillars WHERE user_id = $1 LIMIT 1`, [
    userId,
  ])
  if (!pillars.rowCount) {
    for (const p of DEFAULT_PILLARS) {
      await client.query(
        `INSERT INTO method_pillars (user_id, pillar_key, title, description, practices, progress)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, p.key, p.title, p.description, p.practices, p.progress],
      )
    }
  }

  const chat = await client.query(`SELECT 1 FROM chat_messages WHERE user_id = $1 LIMIT 1`, [userId])
  if (!chat.rowCount) {
    await client.query(
      `INSERT INTO chat_messages (user_id, role, content) VALUES ($1,'assistant',$2)`,
      [
        userId,
        `Olá, ${name.split(' ')[0]}! Sou a IA do Bem 💛 Posso ajudar com relações, método, Score e recompensas. Por onde quer começar?`,
      ],
    )
  }

  const notif = await client.query(`SELECT 1 FROM notifications WHERE user_id = $1 LIMIT 1`, [
    userId,
  ])
  if (!notif.rowCount) {
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, href) VALUES
       ($1,'system','Bem-vindo ao Sou do Bem','Explore o Método, cadastre uma relação e aceite o desafio do dia.','/app'),
       ($1,'marketplace','+500 GoodCoins','Bônus de boas-vindas creditado no seu saldo.','/app/beneficios')`,
      [userId],
    )
  }

  const ledger = await client.query(`SELECT 1 FROM goodcoin_ledger WHERE user_id = $1 LIMIT 1`, [
    userId,
  ])
  if (!ledger.rowCount) {
    await client.query(
      `INSERT INTO goodcoin_ledger (user_id, label, amount) VALUES ($1,'Bônus de boas-vindas',500)`,
      [userId],
    )
  }
}

export async function recalculateScore(
  userId: string,
  event?: { kind: string; label: string; meta?: Record<string, unknown> },
) {
  const u = await query<{
    score: number
    dim_confianca: number
    dim_empatia: number
    dim_etica: number
    dim_cooperacao: number
    dim_responsabilidade: number
  }>(
    `SELECT score, dim_confianca, dim_empatia, dim_etica, dim_cooperacao, dim_responsabilidade
     FROM users WHERE id = $1`,
    [userId],
  )
  if (!u.rowCount) return null

  const before = u.rows[0].score
  const dims: Dimensions = {
    confianca: u.rows[0].dim_confianca,
    empatia: u.rows[0].dim_empatia,
    etica: u.rows[0].dim_etica,
    cooperacao: u.rows[0].dim_cooperacao,
    responsabilidade: u.rows[0].dim_responsabilidade,
  }

  const method = await query<{ progress: number }>(
    `SELECT progress FROM method_pillars WHERE user_id = $1`,
    [userId],
  )
  const methodAvg = method.rowCount
    ? Math.round(method.rows.reduce((s, r) => s + r.progress, 0) / method.rows.length)
    : 0

  const rel = await query<{ avg: string | null }>(
    `SELECT AVG(score)::float AS avg FROM relations WHERE user_id = $1`,
    [userId],
  )
  const relationsAvg =
    rel.rows[0]?.avg === null || rel.rows[0]?.avg === undefined
      ? null
      : Math.round(Number(rel.rows[0].avg))

  const score = computeScore(dims, methodAvg, relationsAvg)
  const seal = sealFromScore(score)
  await query(`UPDATE users SET score = $2, seal = $3, updated_at = NOW() WHERE id = $1`, [
    userId,
    score,
    seal,
  ])

  await query(
    `INSERT INTO score_history
     (user_id, score, dim_confianca, dim_empatia, dim_etica, dim_cooperacao, dim_responsabilidade, method_avg, relations_avg)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      userId,
      score,
      dims.confianca,
      dims.empatia,
      dims.etica,
      dims.cooperacao,
      dims.responsabilidade,
      methodAvg,
      relationsAvg,
    ],
  )

  if (event) {
    await query(
      `INSERT INTO score_events (user_id, kind, label, score_before, score_after, meta)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [
        userId,
        event.kind,
        event.label,
        before,
        score,
        JSON.stringify({
          methodAvg,
          relationsAvg,
          dimensions: dims,
          formula: '0.55*dims + 0.25*method + 0.20*relations',
          ...(event.meta || {}),
        }),
      ],
    )
  }

  return { score, seal, methodAvg, relationsAvg, dims, before }
}

export async function logScoreEvent(
  userId: string,
  kind: string,
  label: string,
  meta?: Record<string, unknown>,
) {
  const u = await query<{ score: number }>(`SELECT score FROM users WHERE id = $1`, [userId])
  const score = u.rows[0]?.score ?? 0
  await query(
    `INSERT INTO score_events (user_id, kind, label, score_before, score_after, meta)
     VALUES ($1,$2,$3,$4,$4,$5::jsonb)`,
    [userId, kind, label, score, JSON.stringify(meta || {})],
  )
}

export async function addLedger(userId: string, label: string, amount: number) {
  await query(`INSERT INTO goodcoin_ledger (user_id, label, amount) VALUES ($1,$2,$3)`, [
    userId,
    label,
    amount,
  ])
  await query(
    `UPDATE users SET goodcoins = GREATEST(0, goodcoins + $2), updated_at = NOW() WHERE id = $1`,
    [userId, amount],
  )
}

export async function addNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  href?: string,
) {
  await query(
    `INSERT INTO notifications (user_id, type, title, body, href) VALUES ($1,$2,$3,$4,$5)`,
    [userId, type, title, body, href || null],
  )
}

export async function boostDimension(
  userId: string,
  key: keyof Dimensions,
  amount: number,
) {
  const col = {
    confianca: 'dim_confianca',
    empatia: 'dim_empatia',
    etica: 'dim_etica',
    cooperacao: 'dim_cooperacao',
    responsabilidade: 'dim_responsabilidade',
  }[key]
  await query(
    `UPDATE users SET ${col} = LEAST(100, GREATEST(0, ${col} + $2)), updated_at = NOW() WHERE id = $1`,
    [userId, amount],
  )
}

export async function getFullProfile(userId: string) {
  const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId])
  if (!userRes.rowCount) return null
  const u = userRes.rows[0]

  const [
    method,
    relations,
    evaluations,
    ledger,
    notifications,
    chat,
    mediations,
    mediationMsgs,
    posts,
    likes,
    eventsJoined,
    libraryDone,
    favorites,
    following,
    reviews,
    redeemed,
    contributions,
    favPartners,
    scoreEvents,
    scoreHistory,
  ] = await Promise.all([
    query(`SELECT * FROM method_pillars WHERE user_id = $1 ORDER BY title`, [userId]),
    query(`SELECT * FROM relations WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    query(
      `SELECT e.* FROM relation_evaluations e
       JOIN relations r ON r.id = e.relation_id WHERE r.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId],
    ),
    query(
      `SELECT * FROM goodcoin_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId],
    ),
    query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId],
    ),
    query(
      `SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100`,
      [userId],
    ),
    query(`SELECT * FROM mediations WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    query(
      `SELECT m.* FROM mediation_messages m
       JOIN mediations md ON md.id = m.mediation_id WHERE md.user_id = $1
       ORDER BY m.created_at ASC`,
      [userId],
    ),
    query(
      `SELECT * FROM community_posts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    ),
    query(`SELECT post_id FROM post_likes WHERE user_id = $1`, [userId]),
    query(`SELECT event_id FROM event_rsvps WHERE user_id = $1`, [userId]),
    query(`SELECT item_id FROM library_completions WHERE user_id = $1`, [userId]),
    query(`SELECT company_id FROM favorite_companies WHERE user_id = $1`, [userId]),
    query(`SELECT influencer_id FROM following_influencers WHERE user_id = $1`, [userId]),
    query(`SELECT * FROM company_reviews WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    query(`SELECT benefit_id FROM redeemed_benefits WHERE user_id = $1`, [userId]),
    query(
      `SELECT cause_id, SUM(amount_gc)::int AS total FROM cause_contributions WHERE user_id = $1 GROUP BY cause_id`,
      [userId],
    ),
    query(`SELECT partner_id FROM favorite_partners WHERE user_id = $1`, [userId]).catch(() => ({
      rows: [] as { partner_id: string }[],
    })),
    query(
      `SELECT * FROM score_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [userId],
    ).catch(() => ({ rows: [] as Record<string, unknown>[] })),
    query(
      `SELECT * FROM score_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 40`,
      [userId],
    ).catch(() => ({ rows: [] as Record<string, unknown>[] })),
  ])

  const evalsByRelation = new Map<string, typeof evaluations.rows>()
  for (const e of evaluations.rows) {
    const list = evalsByRelation.get(e.relation_id) || []
    list.push(e)
    evalsByRelation.set(e.relation_id, list)
  }

  const msgsByMediation = new Map<string, typeof mediationMsgs.rows>()
  for (const m of mediationMsgs.rows) {
    const list = msgsByMediation.get(m.mediation_id) || []
    list.push(m)
    msgsByMediation.set(m.mediation_id, list)
  }

  const causeContributions: Record<string, number> = {}
  for (const c of contributions.rows) {
    causeContributions[c.cause_id] = c.total
  }

  const memberships = await getUserMemberships(userId)
  const primaryTenant =
    memberships.find((m) => m.tenantId === u.primary_tenant_id)?.tenant ||
    memberships[0]?.tenant ||
    null

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: normalizeRole(u.role),
    intent: u.intent,
    onboarded: u.onboarded,
    bio: u.bio,
    city: u.city,
    companyId: u.company_id,
    influencerId: u.influencer_id,
    primaryTenantId: u.primary_tenant_id,
    tenant: primaryTenant,
    memberships,
    score: u.score,
    seal: u.seal,
    streakDays: u.streak_days,
    goodcoins: u.goodcoins,
    hearts: u.hearts,
    dimensions: {
      confianca: u.dim_confianca,
      empatia: u.dim_empatia,
      etica: u.dim_etica,
      cooperacao: u.dim_cooperacao,
      responsabilidade: u.dim_responsabilidade,
    },
    achievements: u.achievements || [],
    challenge: { ...defaultChallenge, ...(u.challenge || {}) },
    settings: { ...defaultSettings, ...(u.settings || {}) },
    method: method.rows.map((p) => ({
      id: p.pillar_key,
      title: p.title,
      description: p.description,
      practices: p.practices,
      progress: p.progress,
    })),
    relations: relations.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      score: r.score,
      notes: r.notes,
      email: r.email,
      phone: r.phone,
      createdAt: r.created_at,
      lastInteractionAt: r.last_interaction_at,
      evaluations: (evalsByRelation.get(r.id) || []).map((e) => ({
        id: e.id,
        createdAt: e.created_at,
        note: e.note,
        average: e.average,
        dimensions: {
          confianca: e.confianca,
          empatia: e.empatia,
          etica: e.etica,
          cooperacao: e.cooperacao,
          responsabilidade: e.responsabilidade,
        },
      })),
    })),
    goodcoinLedger: ledger.rows.map((t) => ({
      id: t.id,
      label: t.label,
      amount: t.amount,
      date: new Date(t.created_at).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
      }),
    })),
    notifications: notifications.rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      href: n.href,
      read: n.read,
      createdAt: n.created_at,
    })),
    chat: chat.rows.map((c) => ({
      role: c.role,
      text: c.content,
      createdAt: c.created_at,
    })),
    mediations: mediations.rows.map((m) => ({
      id: m.id,
      title: m.title,
      withWhom: m.with_whom,
      status: m.status,
      notes: m.notes,
      agreement: m.agreement,
      createdAt: m.created_at,
      messages: (msgsByMediation.get(m.id) || []).map((msg) => ({
        id: msg.id,
        role: msg.role,
        text: msg.content,
        createdAt: msg.created_at,
      })),
    })),
    communityPosts: posts.rows.map((p) => ({
      id: p.id,
      type: p.type,
      author: p.author_name,
      title: p.title,
      body: p.body,
      tags: p.tags,
      likes: p.likes,
      createdAt: p.created_at,
    })),
    likedPostIds: likes.rows.map((r) => r.post_id),
    joinedEventIds: eventsJoined.rows.map((r) => r.event_id),
    completedLibraryIds: libraryDone.rows.map((r) => r.item_id),
    favoriteCompanyIds: favorites.rows.map((r) => r.company_id),
    favoritePartnerIds: (favPartners.rows as { partner_id: string }[]).map((r) => r.partner_id),
    followingInfluencerIds: following.rows.map((r) => r.influencer_id),
    scoreBreakdown: {
      formula: 'Score = 55% dimensões + 25% método + 20% relações',
      weights: { dimensions: 0.55, method: 0.25, relations: 0.2 },
      dimensionsAvg: Math.round(
        (u.dim_confianca +
          u.dim_empatia +
          u.dim_etica +
          u.dim_cooperacao +
          u.dim_responsabilidade) /
          5,
      ),
      methodAvg: method.rowCount
        ? Math.round(method.rows.reduce((s, r) => s + r.progress, 0) / method.rows.length)
        : 0,
      relationsAvg:
        relations.rows.length === 0
          ? null
          : Math.round(relations.rows.reduce((s, r) => s + r.score, 0) / relations.rows.length),
    },
    scoreEvents: (scoreEvents.rows as Record<string, unknown>[]).map((e) => ({
      id: e.id,
      kind: e.kind,
      label: e.label,
      scoreBefore: e.score_before,
      scoreAfter: e.score_after,
      meta: e.meta,
      createdAt: e.created_at,
    })),
    scoreHistory: (scoreHistory.rows as Record<string, unknown>[])
      .slice()
      .reverse()
      .map((h) => ({
        score: h.score,
        methodAvg: h.method_avg,
        relationsAvg: h.relations_avg,
        dimensions: {
          confianca: h.dim_confianca,
          empatia: h.dim_empatia,
          etica: h.dim_etica,
          cooperacao: h.dim_cooperacao,
          responsabilidade: h.dim_responsabilidade,
        },
        createdAt: h.created_at,
      })),
    companyReviews: reviews.rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    })),
    redeemedBenefitIds: redeemed.rows.map((r) => r.benefit_id),
    causeContributions,
  }
}

export { clamp }
