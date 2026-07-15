import { env } from './env.js'
import { executeUserTool, LLM_TOOLS } from './userContext.js'

export type ChatTurn = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content?: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

type ToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export async function chatWithOpenRouter(messages: ChatTurn[]): Promise<string> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error(
      'OPENROUTER_API_KEY não configurada. Defina no arquivo .env na raiz do projeto e reinicie a API (ou docker compose).',
    )
  }

  if (!env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
    throw new Error(
      'OPENROUTER_API_KEY parece inválida (deve começar com sk-or-). Verifique o .env.',
    )
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.OPENROUTER_SITE_URL,
      'X-Title': env.OPENROUTER_SITE_NAME,
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1200,
      tools: LLM_TOOLS,
      tool_choice: 'auto',
    }),
  })

  const raw = await res.text()
  if (!res.ok) {
    let detail = raw.slice(0, 500)
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } | string }
      if (typeof j.error === 'string') detail = j.error
      else if (j.error && typeof j.error === 'object' && j.error.message) detail = j.error.message
    } catch {
      /* keep */
    }
    throw new Error(`OpenRouter HTTP ${res.status}: ${detail}`)
  }

  const data = JSON.parse(raw) as {
    choices?: {
      message?: {
        content?: string | null
        tool_calls?: ToolCall[]
        role?: string
      }
      finish_reason?: string
    }[]
    error?: { message?: string }
  }

  if (data.error?.message) {
    throw new Error(`OpenRouter: ${data.error.message}`)
  }

  const message = data.choices?.[0]?.message
  if (!message) throw new Error('OpenRouter retornou resposta vazia')

  return JSON.stringify(message)
}

/**
 * Loop de tool-calling: a LLM pode consultar score, posts, interações etc.
 */
export async function chatWithTools(
  system: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userId: string,
  maxRounds = 4,
): Promise<{ reply: string; toolsUsed: string[] }> {
  const messages: ChatTurn[] = [{ role: 'system', content: system }, ...history]
  const toolsUsed: string[] = []

  for (let round = 0; round < maxRounds; round++) {
    const raw = await chatWithOpenRouter(messages)
    const message = JSON.parse(raw) as {
      content?: string | null
      tool_calls?: ToolCall[]
    }

    if (message.tool_calls?.length) {
      messages.push({
        role: 'assistant',
        content: message.content || null,
        tool_calls: message.tool_calls,
      })

      for (const call of message.tool_calls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(call.function.arguments || '{}')
        } catch {
          args = {}
        }
        toolsUsed.push(call.function.name)
        const result = await executeUserTool(userId, call.function.name, args)
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(result),
        })
      }
      continue
    }

    const content = message.content?.trim()
    if (!content) throw new Error('OpenRouter retornou conteúdo vazio')
    return { reply: content, toolsUsed }
  }

  // última tentativa sem tools se estourar rounds
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.OPENROUTER_SITE_URL,
      'X-Title': env.OPENROUTER_SITE_NAME,
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [
        ...messages,
        {
          role: 'user',
          content: 'Com base nas ferramentas já consultadas, responda agora de forma completa e prática.',
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  })
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const reply = data.choices?.[0]?.message?.content?.trim()
  if (!reply) throw new Error('Falha ao finalizar resposta com tools')
  return { reply, toolsUsed }
}

export function buildSystemPrompt(profile: {
  name: string
  role?: string
  intent?: string
  tenantName?: string
  score: number
  seal: string
  goodcoins: number
  hearts: number
  streakDays: number
  dimensions: Record<string, number>
  methodSummary: string
  relationsSummary: string
}) {
  return `Você é a IA do Bem da plataforma Sou do Bem (SocialTech da Confiança).
Fale em português do Brasil, com tom acolhedor, prático e ético.

Você TEM FERRAMENTAS (function calling) para consultar dados reais do usuário logado:
- get_user_score, get_user_profile, get_user_relations
- get_user_interactions (timeline), get_user_posts, get_user_method
- get_user_mediations, search_user_activity, get_user_full_context

USE as ferramentas quando precisar de números atualizados, histórico ou posts — não invente dados do usuário.
Depois de consultar, responda de forma integrada e acionável.

Perfis: pessoa | empresa | influenciador | executivo | mediador.

Snapshot inicial (pode estar desatualizado — prefira tools para detalhes):
- Nome: ${profile.name}
- Perfil: ${profile.role || 'pessoa'}
- Intenção: ${profile.intent || '—'}
- Território: ${profile.tenantName || '—'}
- Score: ${profile.score} (${profile.seal})
- GC: ${profile.goodcoins} · Corações: ${profile.hearts} · Streak: ${profile.streakDays}
- Dimensões: ${JSON.stringify(profile.dimensions)}
- Método: ${profile.methodSummary}
- Relações (resumo): ${profile.relationsSummary}`
}
