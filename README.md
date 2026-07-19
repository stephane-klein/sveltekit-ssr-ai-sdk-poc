# sveltekit-ssr-ai-sdk-poc

This project is a POC to learn how to integrate [Vercel AI SDK](https://sdk.vercel.ai) into a SvelteKit SSR project with a tool that allows the AI agent to read from a PostgreSQL database.

## Features

- **AI Chat interface** — chat UI with conversation list and message history
- **AI SQL tool** — `readOnlySqlQuery` tool that lets the LLM query the `contacts` table using raw SQL
- **Streaming responses** — real-time token-by-token streaming for a responsive chat experience
- **Skill system** — OpenCode-inspired skills reproduced as AI SDK tools: the LLM discovers available skills by name and description, then loads them on demand via a `loadSkill` tool (see [src/lib/server/skills/](./src/lib/server/skills/))
- **Conversation title generation** — a button in the chat page that uses the LLM to generate a concise title from the conversation content, saves it to the database, and updates the UI in real time

## Tech Stack

- **Frontend**: SvelteKit 2 (SSR) + Svelte 5 + Vite 8
- **Adapter**: `@sveltejs/adapter-node` — standalone Node.js server
- **Runtime**: Node.js 24 (ESM)
- **Package manager**: pnpm
- **Database**: PostgreSQL 18
- **SQL client**: [postgres](https://github.com/porsager/postgres)
- **DB schema**: [sqls/schema.sql](./sqls/schema.sql)
- **DB security**: dedicated `ai_readonly` PostgreSQL role with SELECT-only privileges on the `contacts` table (grants in [sqls/rls/](./sqls/rls/))
- **AI SQL tool**: `readOnlySqlQuery` — a Vercel AI SDK tool that lets the LLM execute read-only SQL queries against PostgreSQL via the `ai_readonly` role (see [src/lib/server/sql-query-tool.js](./src/lib/server/sql-query-tool.js))
- **Containers**: Podman Compose
- **Tooling**: mise
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai) (`ai` v7)
  - `@ai-sdk/openai-compatible` — OpenAI-compatible provider (connected to OpenCode Go — DeepSeek V4 Flash)
  - `@ai-sdk/svelte` — Svelte integration
- **Validation**: [Zod](https://zod.dev) v4
- **Skill architecture**: skills are implemented as AI SDK `tool` definitions (not `HarnessAgent`) — the Vercel AI SDK `HarnessAgent` was evaluated but deemed unsuitable for a chat context as it is designed for coding agent harnesses (sandboxed terminal environments), not streaming chat conversations

## AI-Assisted Development

This project was developed using:

- [OpenCode](https://opencode.ai) CLI — coding assistant workflow (not vibe coding)
- Models: DeepSeek V4 Flash

## Roadmap

- [x] Setup SvelteKit SSR
- [x] First AI SDK integration — minimalistic web chat
- [x] Implement a tool to read from the PostgreSQL database
- [x] Implement a skill system
- [x] Add a button to generate a conversation title
- [ ] Add a button to compact the conversation

## Prerequisite

Install [mise](https://mise.jdx.dev/getting-started.html) — it will handle installing Node.js and pnpm for you.

## Environment Configuration

Copy `.secret.example` to `.secret` and fill in your API keys:

```bash
$ cp .secret.example .secret
$ edit .secret
```

For Stéphane Klein (gopass user), generate `.secret` directly from the password store:

```bash
$ mise run setup-secret
```

Mise loads `.secret` automatically when present — no additional setup needed.

## Getting Started

```bash
$ mise install  # install Node.js and pnpm via mise
$ pnpm install
$ mise run up   # start PostgreSQL container
$ reload        # load environment variables
$ mise load-schema  # load database schema from sqls/schema.sql
$ mise seed     # populate with demo data

# Start the SvelteKit dev server
$ pnpm run dev

# Stop the database
$ mise teardown
```


