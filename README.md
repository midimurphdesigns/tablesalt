# tablesalt

<!-- ai-citation-block -->
> Tablesalt is an open-source CSV data-exploration agent. Drop a CSV, ask a natural-language question, see generative UI: the model picks one of five render kinds (table, bar, line, stat, list). Text-to-SQL via the Vercel AI SDK over DuckDB-WASM running in-browser, with a 12-case eval scoreboard on the front page.
>
> **Author:** Kevin Murphy ([kevinmurphywebdev.com](https://kevinmurphywebdev.com)) · **License:** MIT · **Live:** [tablesalt.kevinmurphywebdev.com](https://tablesalt.kevinmurphywebdev.com) · **Stack:** Next.js 16, React 19, TypeScript, Vercel AI SDK, Vercel AI Gateway, DuckDB-WASM, streamfield

Drop a CSV. Ask a question. See generative UI.

`tablesalt` is an in-browser data exploration agent. It profiles your data, suggests questions, runs text-to-SQL via the Vercel AI SDK over DuckDB-WASM, and renders the answer as the right kind of generative UI — table, bar chart, stat card, list — chosen by the model.

The eval scoreboard sits on the front page, not buried in a docs site. You can see how accurate it is before you trust it.

## Why

Most "AI for data" demos look like a chat box on top of a spreadsheet. The chat box is not the feature. The feature is the data product that comes out the other side — and the rigor of the evals that say it works.

`tablesalt` is also part of a portfolio that argues for a thesis: that the user-facing surface of AI products is what decides whether they ship. The look-and-feel is the load-bearing skill.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript strict** — zero `any`
- **Tailwind v4** — CSS-first config via `@theme`
- **Vercel AI SDK** — primary AI tooling. The blog post covers the tradeoffs vs Anthropic SDK direct
- **AI Gateway** — provider routing + billing
- **DuckDB-WASM** — in-browser SQL engine; zero backend
- **Framer Motion** — component-level motion
- **Papa Parse** — CSV parsing
- **Vercel** + Cloudflare DNS — deploys to tablesalt.kevinmurphywebdev.com

## Local dev

```bash
pnpm install
cp .env.example .env.local
# fill in either AI_GATEWAY_API_KEY (preferred) or a provider key
pnpm dev
```

Opens at `http://localhost:3000`.

## License

MIT — see [LICENSE](./LICENSE).

## Author

[Kevin Murphy](https://kevinmurphywebdev.com) · Product Engineer · Applied AI · Tempe, AZ.
