# MCP Sou do Bem — contexto do usuário para LLMs

Servidor **MCP (Model Context Protocol)** que expõe dados do usuário autenticado:

- Score do Bem + histórico + eventos  
- Perfil / role / território multi-tenant  
- Relações e avaliações  
- Timeline de interações  
- Posts da comunidade  
- Método, mediações, GoodCoins  

A mesma camada alimenta o **tool-calling** da IA no app (OpenRouter).

---

## Ferramentas MCP

| Tool | Descrição |
|------|-----------|
| `get_user_score` | Score, dimensões, fórmula, histórico, eventos |
| `get_user_profile` | Nome, role, tenant, GC, corações |
| `get_user_relations` | Círculo do bem + avaliações |
| `get_user_interactions` | Timeline unificada de interações |
| `get_user_posts` | Posts do usuário |
| `get_user_method` | 5 pilares + desafio |
| `get_user_mediations` | Mediações e mensagens |
| `get_user_ledger` | Extrato GoodCoins |
| `get_user_tenant` | Território e memberships |
| `search_user_activity` | Busca textual nas atividades |
| `get_user_full_context` | Snapshot completo |
| `get_user_context_slice` | Recorte genérico por `slice` |

---

## Autenticação do MCP

Defina **uma** variável de ambiente:

```env
SOUDOBEM_USER_EMAIL=ggampp@gmail.com
# ou
SOUDOBEM_USER_ID=<uuid>
# ou
SOUDOBEM_TOKEN=<jwt do /api/auth/login>
```

E o banco:

```env
DATABASE_URL=postgresql://soudobem:soudobem@localhost:5432/soudobem
JWT_SECRET=dev-soudobem-secret-change-me
```

---

## Rodar localmente

```bash
# Postgres precisa estar up
docker compose up -d postgres

cd server
npm install
set SOUDOBEM_USER_EMAIL=ggampp@gmail.com
npm run mcp
```

---

## Claude Desktop / Cursor / Grok

Exemplo de configuração (ajuste o caminho absoluto):

```json
{
  "mcpServers": {
    "soudobem-user-context": {
      "command": "npx",
      "args": ["tsx", "D:/claude_projects/dev-products/soudobem/server/src/mcp/server.ts"],
      "env": {
        "DATABASE_URL": "postgresql://soudobem:soudobem@localhost:5432/soudobem",
        "JWT_SECRET": "dev-soudobem-secret-change-me",
        "SOUDOBEM_USER_EMAIL": "ggampp@gmail.com"
      }
    }
  }
}
```

Arquivo de referência no repo: `mcp/soudobem.mcp.json`.

---

## API REST espelhada (app / integrações)

Com JWT do login:

```http
GET /api/ai/context/score
GET /api/ai/context/interactions
GET /api/ai/context/posts
GET /api/ai/tools
POST /api/ai/tools/get_user_score
```

A rota `POST /api/ai/chat` usa **tool calling** OpenRouter com as mesmas tools — a LLM consulta o banco do usuário durante a conversa.

---

## Segurança

- Tools são **somente leitura**.  
- MCP lê o usuário configurado no env (não expõe todos os usuários).  
- Em produção: use `SOUDOBEM_TOKEN` de curta duração e RLS/rede privada no Postgres.  
