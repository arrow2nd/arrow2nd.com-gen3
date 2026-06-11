# arrow2nd.com (gen 3)

HonoX + hono/jsx + CSS Modules + SSG (Cloudflare Workers Assets)

## Getting Started

```bash
pnpm dev
```

## Build & Deploy

```bash
pnpm build    # vite build(client/SSR) + toSSG で dist/ に静的サイトを生成
pnpm preview  # wrangler dev で dist/ を配信
pnpm deploy   # Cloudflare Workers (assets-only) へデプロイ
```
