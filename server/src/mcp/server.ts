#!/usr/bin/env node
/**
 * MCP Sou do Bem — expõe dados do usuário (score, interações, posts…) para LLMs.
 *
 * Auth (uma das opções):
 *   SOUDOBEM_USER_EMAIL=ggampp@gmail.com
 *   SOUDOBEM_USER_ID=<uuid>
 *   SOUDOBEM_TOKEN=<jwt do login>
 *
 * Banco:
 *   DATABASE_URL=postgresql://soudobem:soudobem@localhost:5432/soudobem
 *
 * Uso (stdio) no Claude Desktop / Cursor / Grok:
 *   { "command": "npx", "args": ["tsx", "server/src/mcp/server.ts"], "cwd": "…/soudobem" }
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import jwt from 'jsonwebtoken'
import { env } from '../env.js'
import {
  executeUserTool,
  getUserContext,
  resolveUserId,
  type UserContextSlice,
} from '../userContext.js'

async function resolveAuthUserId(): Promise<string> {
  if (process.env.SOUDOBEM_USER_ID) {
    const id = await resolveUserId({ userId: process.env.SOUDOBEM_USER_ID })
    if (id) return id
  }
  if (process.env.SOUDOBEM_USER_EMAIL) {
    const id = await resolveUserId({ email: process.env.SOUDOBEM_USER_EMAIL })
    if (id) return id
  }
  if (process.env.SOUDOBEM_TOKEN) {
    try {
      const payload = jwt.verify(process.env.SOUDOBEM_TOKEN, env.JWT_SECRET) as {
        userId: string
      }
      const id = await resolveUserId({ userId: payload.userId })
      if (id) return id
    } catch {
      throw new Error('SOUDOBEM_TOKEN inválido ou expirado')
    }
  }
  throw new Error(
    'Defina SOUDOBEM_USER_EMAIL, SOUDOBEM_USER_ID ou SOUDOBEM_TOKEN no ambiente do MCP.',
  )
}

const TOOLS = [
  {
    name: 'get_user_score',
    description:
      'Score do Bem do usuário logado: valor, selo, 5 dimensões, fórmula, histórico e eventos.',
    inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false },
  },
  {
    name: 'get_user_profile',
    description:
      'Perfil: nome, e-mail, role multi-tenant, intenção, território, GoodCoins e corações.',
    inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false },
  },
  {
    name: 'get_user_relations',
    description: 'Relações do círculo do bem e últimas avaliações comportamentais.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Máximo de relações (padrão 20)' },
      },
    },
  },
  {
    name: 'get_user_interactions',
    description:
      'Timeline de interações: score events, avaliações, GC, mediações, chat e likes em posts.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Máximo de itens (padrão 30)' },
      },
    },
  },
  {
    name: 'get_user_posts',
    description: 'Posts da comunidade criados pelo usuário.',
    inputSchema: {
      type: 'object' as const,
      properties: { limit: { type: 'number' } },
    },
  },
  {
    name: 'get_user_method',
    description: 'Progresso nos 5 pilares do Método e desafio do dia.',
    inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false },
  },
  {
    name: 'get_user_mediations',
    description: 'Mediações do usuário e trechos das conversas.',
    inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false },
  },
  {
    name: 'get_user_ledger',
    description: 'Saldo GoodCoins, extrato e contribuições a causas.',
    inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false },
  },
  {
    name: 'get_user_tenant',
    description: 'Território multi-tenant e memberships do usuário.',
    inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false },
  },
  {
    name: 'search_user_activity',
    description: 'Busca em relações, posts, eventos de score e mediações.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Termo de busca' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_user_full_context',
    description: 'Snapshot completo (use com moderação). Ideal no início de uma sessão profunda.',
    inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false },
  },
  {
    name: 'get_user_context_slice',
    description:
      'Obtém um recorte genérico: profile|score|relations|interactions|posts|method|mediations|ledger|notifications|tenant|full',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slice: {
          type: 'string',
          enum: [
            'profile',
            'score',
            'relations',
            'interactions',
            'posts',
            'method',
            'mediations',
            'ledger',
            'notifications',
            'tenant',
            'full',
          ],
        },
        limit: { type: 'number' },
      },
      required: ['slice'],
    },
  },
]

const server = new Server(
  { name: 'soudobem-user-context', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const userId = await resolveAuthUserId()
    const name = request.params.name
    const args = (request.params.arguments || {}) as Record<string, unknown>

    let result: unknown
    if (name === 'get_user_ledger') {
      result = await getUserContext(userId, 'ledger', Number(args.limit) || 30)
    } else if (name === 'get_user_tenant') {
      result = await getUserContext(userId, 'tenant')
    } else if (name === 'get_user_context_slice') {
      result = await getUserContext(
        userId,
        String(args.slice || 'full') as UserContextSlice,
        Number(args.limit) || 30,
      )
    } else {
      result = await executeUserTool(userId, name, args)
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      isError: true,
      content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }],
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stderr only — stdout é protocolo MCP
  console.error('MCP Sou do Bem (user context) ready')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
