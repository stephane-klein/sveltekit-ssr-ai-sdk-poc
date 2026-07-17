# sveltekit-ssr-ai-sdk-poc

This project is a POC to learn how to integrate [Vercel AI SDK](https://sdk.vercel.ai) into a SvelteKit SSR project with a tool that allows the AI agent to read from a PostgreSQL database.

## Tech Stack

- **Frontend**: SvelteKit 2 (SSR) + Svelte 5 + Vite 8
- **Adapter**: `@sveltejs/adapter-node` — standalone Node.js server
- **Runtime**: Node.js 24 (ESM)
- **Package manager**: pnpm
- **Database**: PostgreSQL 18
- **SQL client**: [postgres](https://github.com/porsager/postgres)
- **DB schema**: [sqls/schema.sql](./sqls/schema.sql)
- **Containers**: Podman Compose
- **Tooling**: mise

## AI-Assisted Development

This project was developed using:

- [OpenCode](https://opencode.ai) CLI — coding assistant workflow (not vibe coding)
- Models: DeepSeek V4 Flash

## Principles

- Monorepository and monolithic application pattern ([notes](https://notes.sklein.xyz/2025-05-06_2224/zen/))
- Raw SQL — no ORM
- Trying to embrace [Radical Simplicity](https://www.radicalsimpli.city/): reducing accidental complexity, applying LEAN techniques
- Vigilance against [cargo cult](https://en.wikipedia.org/wiki/Cargo_cult)
- Following [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it)

## Roadmap

- [x] Setup SvelteKit SSR
- [ ] First AI SDK integration — minimalistic web chat
- [ ] Implement a tool to read from the PostgreSQL database

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


