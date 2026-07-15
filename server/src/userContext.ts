/**
 * Camada de contexto do usuário para MCP + tool-calling da LLM.
 * Somente leitura — a IA consulta dados do usuário autenticado.
 */
import { query } from './db.js'
import { getFullProfile } from './userService.js'

export type UserContextSlice =
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

export async function resolveUserId(opts: {
  userId?: string
  email?: string
}): Promise<string | null> {
  if (opts.userId) {
    const r = await query(`SELECT id FROM users WHERE id = $1`, [opts.userId])
    return r.rows[0]?.id ?? null
  }
  if (opts.email) {
    const r = await query(`SELECT id FROM users WHERE lower(email) = lower($1)`, [
      opts.email.trim(),
    ])
    return r.rows[0]?.id ?? null
  }
  return null
}

export async function getUserContext(
  userId: string,
  slice: UserContextSlice = 'full',
  limit = 30,
) {
  const profile = await getFullProfile(userId)
  if (!profile) return null

  const base = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    intent: profile.intent,
    tenant: profile.tenant,
    memberships: profile.memberships,
    score: profile.score,
    seal: profile.seal,
    goodcoins: profile.goodcoins,
    hearts: profile.hearts,
    streakDays: profile.streakDays,
    dimensions: profile.dimensions,
    scoreBreakdown: profile.scoreBreakdown,
  }

  if (slice === 'profile') return { slice, ...base }

  if (slice === 'score') {
    return {
      slice,
      score: profile.score,
      seal: profile.seal,
      dimensions: profile.dimensions,
      scoreBreakdown: profile.scoreBreakdown,
      scoreEvents: (profile.scoreEvents || []).slice(0, limit),
      scoreHistory: (profile.scoreHistory || []).slice(-limit),
      howToRead:
        'Score = 55% dimensões + 25% método + 20% relações. Eventos listam mudanças recentes.',
    }
  }

  if (slice === 'relations') {
    return {
      slice,
      count: profile.relations.length,
      averageScore:
        profile.relations.length === 0
          ? null
          : Math.round(
              profile.relations.reduce((s, r) => s + r.score, 0) / profile.relations.length,
            ),
      relations: profile.relations.slice(0, limit).map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        score: r.score,
        notes: r.notes,
        email: r.email,
        evaluationsCount: r.evaluations?.length || 0,
        lastEvaluation: r.evaluations?.[0]
          ? {
              average: r.evaluations[0].average,
              note: r.evaluations[0].note,
              at: r.evaluations[0].createdAt,
              dimensions: r.evaluations[0].dimensions,
            }
          : null,
        createdAt: r.createdAt,
      })),
    }
  }

  if (slice === 'method') {
    return {
      slice,
      pillars: profile.method,
      averageProgress: profile.scoreBreakdown?.methodAvg ?? 0,
      challenge: profile.challenge,
    }
  }

  if (slice === 'posts') {
    const seedPosts = await query(
      `SELECT id, type, title, body, likes, tags, created_at, author_name, tenant_id
       FROM community_posts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    )
    return {
      slice,
      posts: seedPosts.rows.map((p) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        body: p.body,
        likes: p.likes,
        tags: p.tags,
        author: p.author_name,
        createdAt: p.created_at,
      })),
      likedPostIds: profile.likedPostIds,
    }
  }

  if (slice === 'mediations') {
    return {
      slice,
      mediations: profile.mediations.slice(0, limit).map((m) => ({
        id: m.id,
        title: m.title,
        withWhom: m.withWhom,
        status: m.status,
        notes: m.notes,
        agreement: m.agreement,
        messagesCount: m.messages?.length || 0,
        lastMessages: (m.messages || []).slice(-5).map((msg) => ({
          role: msg.role,
          text: msg.text,
          at: msg.createdAt,
        })),
        createdAt: m.createdAt,
      })),
    }
  }

  if (slice === 'ledger') {
    return {
      slice,
      goodcoins: profile.goodcoins,
      recent: profile.goodcoinLedger.slice(0, limit),
      redeemedBenefitIds: profile.redeemedBenefitIds,
      causeContributions: profile.causeContributions,
    }
  }

  if (slice === 'notifications') {
    return {
      slice,
      unread: profile.notifications.filter((n) => !n.read).length,
      notifications: profile.notifications.slice(0, limit),
    }
  }

  if (slice === 'tenant') {
    return {
      slice,
      role: profile.role,
      tenant: profile.tenant,
      memberships: profile.memberships,
      primaryTenantId: profile.primaryTenantId,
    }
  }

  if (slice === 'interactions') {
    // Histórico unificado de interações
    const [evals, chat, likes] = await Promise.all([
      query(
        `SELECT e.average, e.note, e.created_at, r.name AS relation_name, r.category
         FROM relation_evaluations e
         JOIN relations r ON r.id = e.relation_id
         WHERE r.user_id = $1
         ORDER BY e.created_at DESC
         LIMIT $2`,
        [userId, limit],
      ),
      query(
        `SELECT role, content, created_at FROM chat_messages
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [userId, Math.min(limit, 20)],
      ),
      query(
        `SELECT pl.post_id, p.title, p.type, pl.user_id
         FROM post_likes pl
         JOIN community_posts p ON p.id = pl.post_id
         WHERE pl.user_id = $1
         LIMIT $2`,
        [userId, limit],
      ),
    ])

    const timeline = [
      ...(profile.scoreEvents || []).map((e) => ({
        kind: 'score_event' as const,
        at: e.createdAt,
        summary: e.label,
        detail: { before: e.scoreBefore, after: e.scoreAfter, kind: e.kind },
      })),
      ...evals.rows.map((e) => ({
        kind: 'relation_evaluation' as const,
        at: e.created_at,
        summary: `Avaliou ${e.relation_name} (${e.category}) média ${e.average}`,
        detail: { note: e.note },
      })),
      ...profile.goodcoinLedger.slice(0, limit).map((t) => ({
        kind: 'goodcoin' as const,
        at: t.date,
        summary: `${t.label}: ${t.amount > 0 ? '+' : ''}${t.amount} GC`,
        detail: { amount: t.amount },
      })),
      ...profile.mediations.slice(0, 10).map((m) => ({
        kind: 'mediation' as const,
        at: m.createdAt,
        summary: `Mediação "${m.title}" — ${m.status}`,
        detail: { withWhom: m.withWhom },
      })),
      ...chat.rows.map((c) => ({
        kind: 'chat' as const,
        at: c.created_at,
        summary: `${c.role}: ${String(c.content).slice(0, 120)}`,
        detail: {},
      })),
      ...likes.rows.map((l) => ({
        kind: 'post_like' as const,
        at: null,
        summary: `Apoiou post "${l.title}" (${l.type})`,
        detail: { postId: l.post_id },
      })),
    ]
      .sort((a, b) => {
        const ta = a.at ? new Date(a.at).getTime() : 0
        const tb = b.at ? new Date(b.at).getTime() : 0
        return tb - ta
      })
      .slice(0, limit)

    return {
      slice,
      totalItems: timeline.length,
      timeline,
      summary: {
        relations: profile.relations.length,
        evaluations: evals.rows.length,
        scoreEvents: (profile.scoreEvents || []).length,
        posts: profile.communityPosts.length,
        mediations: profile.mediations.length,
        chatMessages: chat.rows.length,
      },
    }
  }

  // full
  return {
    slice: 'full',
    profile: base,
    method: profile.method,
    challenge: profile.challenge,
    relations: profile.relations.slice(0, 15),
    scoreEvents: (profile.scoreEvents || []).slice(0, 20),
    scoreHistory: (profile.scoreHistory || []).slice(-20),
    posts: profile.communityPosts.slice(0, 15),
    mediations: profile.mediations.slice(0, 10),
    ledger: profile.goodcoinLedger.slice(0, 15),
    achievements: profile.achievements,
    notifications: profile.notifications.slice(0, 10),
  }
}

export async function searchUserActivity(userId: string, q: string, limit = 20) {
  const term = `%${q.trim().toLowerCase()}%`
  if (!q.trim()) return { query: q, results: [] }

  const [rels, posts, events, meds] = await Promise.all([
    query(
      `SELECT id, name, category, score, notes FROM relations
       WHERE user_id = $1 AND (lower(name) LIKE $2 OR lower(coalesce(notes,'')) LIKE $2)
       LIMIT $3`,
      [userId, term, limit],
    ),
    query(
      `SELECT id, type, title, body, likes FROM community_posts
       WHERE user_id = $1 AND (lower(title) LIKE $2 OR lower(body) LIKE $2)
       LIMIT $3`,
      [userId, term, limit],
    ),
    query(
      `SELECT id, kind, label, score_before, score_after, created_at FROM score_events
       WHERE user_id = $1 AND lower(label) LIKE $2
       ORDER BY created_at DESC LIMIT $3`,
      [userId, term, limit],
    ),
    query(
      `SELECT id, title, status, with_whom, notes FROM mediations
       WHERE user_id = $1 AND (lower(title) LIKE $2 OR lower(coalesce(notes,'')) LIKE $2)
       LIMIT $3`,
      [userId, term, limit],
    ),
  ])

  return {
    query: q,
    results: [
      ...rels.rows.map((r) => ({ type: 'relation', ...r })),
      ...posts.rows.map((p) => ({ type: 'post', ...p })),
      ...events.rows.map((e) => ({ type: 'score_event', ...e })),
      ...meds.rows.map((m) => ({ type: 'mediation', ...m })),
    ],
  }
}

/** Definições OpenAI/OpenRouter function-calling */
export const LLM_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_user_score',
      description:
        'Obtém Score do Bem do usuário logado: valor, selo, dimensões, fórmula, histórico e eventos recentes.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_profile',
      description:
        'Perfil do usuário: nome, papel (pessoa/empresa/influenciador/executivo/mediador), território, GC, corações.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_relations',
      description: 'Lista relações do círculo do bem e últimas avaliações.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Máximo de itens (padrão 20)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_interactions',
      description:
        'Timeline de interações: eventos de score, avaliações, GoodCoins, mediações, chat e likes.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Máximo de itens (padrão 30)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_posts',
      description: 'Posts da comunidade publicados pelo usuário e posts que curtiu.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_method',
      description: 'Progresso nos 5 pilares do Método e desafio do dia.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_mediations',
      description: 'Mediações abertas/resolvidas e últimas mensagens.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_user_activity',
      description: 'Busca textual nas relações, posts, eventos de score e mediações do usuário.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Termo de busca' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_full_context',
      description:
        'Contexto completo compactado do usuário (use com moderação — resposta maior).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
]

export async function executeUserTool(
  userId: string,
  name: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const limit = Number(args.limit) || 30
  switch (name) {
    case 'get_user_score':
      return getUserContext(userId, 'score', limit)
    case 'get_user_profile':
      return getUserContext(userId, 'profile')
    case 'get_user_relations':
      return getUserContext(userId, 'relations', limit)
    case 'get_user_interactions':
      return getUserContext(userId, 'interactions', limit)
    case 'get_user_posts':
      return getUserContext(userId, 'posts', limit)
    case 'get_user_method':
      return getUserContext(userId, 'method')
    case 'get_user_mediations':
      return getUserContext(userId, 'mediations', limit)
    case 'get_user_full_context':
      return getUserContext(userId, 'full', 20)
    case 'search_user_activity':
      return searchUserActivity(userId, String(args.query || ''), limit)
    default:
      return { error: `Ferramenta desconhecida: ${name}` }
  }
}
