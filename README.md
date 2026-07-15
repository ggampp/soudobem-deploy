# Sou do Bem — Docker (Postgres + API + Front)

Stack unificada no **docker compose**:

| Serviço   | URL / porta              |
|-----------|--------------------------|
| **Web**   | http://localhost:8080    |
| **API**   | http://localhost:3001    |
| **Postgres** | localhost:5432        |

A web (nginx) faz proxy de `/api` e `/health` para a API.

## 1. Configurar `.env`

```bash
copy .env.example .env
```

Obrigatório para a IA:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
CORS_ORIGIN=http://localhost:8080
OPENROUTER_SITE_URL=http://localhost:8080
```

## 2. Subir tudo

```bash
docker compose up -d --build
```

Aguarde os containers ficarem healthy:

```bash
docker compose ps
curl http://localhost:8080/health
```

Resposta esperada:

```json
{ "ok": true, "db": true, "openrouter": true, "model": "openai/gpt-4o-mini", ... }
```

Se `openrouter: false`, a chave não entrou no container — confira `.env` e rode:

```bash
docker compose up -d --force-recreate api
```

## 3. Usar o app

Abra **http://localhost:8080**

Login demo: `ggampp@gmail.com` / `demo`

## 4. Logs e debug da IA

```bash
docker compose logs -f api
```

Teste de chat (substitua TOKEN):

```bash
# login
# depois POST /api/ai/chat com Authorization: Bearer ...
```

## Desenvolvimento local (sem Docker do front/API)

```bash
docker compose up -d postgres
npm run setup
npm run dev:server   # :3001
npm run dev          # :5173
```

## Parar / reset

```bash
docker compose down
# apaga dados do banco:
docker compose down -v
```

## MCP (contexto do usuário para LLMs)

Servidor MCP em `server/src/mcp/server.ts` — a LLM acessa score, histórico, posts e interações do usuário.

```bash
cd server
set SOUDOBEM_USER_EMAIL=ggampp@gmail.com
npm run mcp
```

Config de exemplo: `mcp/soudobem.mcp.json` e docs em `mcp/README.md`.

No app, `POST /api/ai/chat` usa as **mesmas tools** via OpenRouter function calling.
