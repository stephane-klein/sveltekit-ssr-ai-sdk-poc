# Agent Instructions

## Project Context

This project is a POC to learn how to integrate Vercel AI SDK into a SvelteKit SSR project with a tool that allows the AI agent to read from a PostgreSQL database.

## Language Policy

- **All project content must be in English**: source code, comments, commit messages, and documentation.
- **Human conversations in OpenCode remain in French**.

## Package Manager Policy

- Always use `pnpm` for installing, adding, and removing packages.
- Never use `npm` or `yarn`.

## Database

This project uses **PostgreSQL** as its database, accessed directly with raw SQL — **no ORM**.

SQL queries are executed using the [`postgres`](https://github.com/porsager/postgres) library (package name: `postgres`).

The schema is maintained by hand in `sqls/schema.sql` and loaded via `mise load-schema`.

## Example / Scaffolding Files

The following files are examples meant to be replaced with your actual project code:

- `sqls/fixtures/00001_contacts.sql` — example fixture data
- `sqls/schema.sql` — example consolidated schema

These files are marked with comments (`-- Example` / `// Example`) at the top. Replace or remove them as needed.

> **Remove this entire section once the example files have been replaced or deleted.**

## Version Control

This project uses **Jujutsu** for version control.

## Project Structure

- `src/routes/chats/` — chat UI and API
  - `+page.svelte` / `+page.server.js` — conversation list + create
  - `[slug]/+page.svelte` / `[slug]/+page.server.js` — single chat page
  - `[slug]/+server.js` — AI chat API endpoint (streaming response)
- `src/lib/ai.js` — Vercel AI SDK model provider configuration (OpenCode Go / DeepSeek V4 Flash)
- `src/db.js` — PostgreSQL connection (via `postgres` library)

## AI SDK / LLM Provider

This project uses [Vercel AI SDK](https://sdk.vercel.ai) (`ai` v7) with:
- `@ai-sdk/openai-compatible` — provider connected to [OpenCode Go](https://opencode.ai) serving DeepSeek V4 Flash
- `@ai-sdk/svelte` — Svelte integration for reactive chat UI

The LLM endpoint and API key are configured via environment variables (see `.secret.example`).

## Validation

[Zod](https://zod.dev) v4 is used for runtime validation of tool schemas and LLM responses.

## Documentation Maintenance

Remove from this file any section or reference that becomes obsolete after file deletions or structural changes. Keep AGENTS.md up to date.
