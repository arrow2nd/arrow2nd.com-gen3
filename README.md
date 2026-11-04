# arrow2nd.com (gen 3)

🐟️ ポートフォリオサイト

## Getting Started

```bash
pnpm dev
```

## Build & Deploy

```bash
pnpm build    # vite build(client/SSR) + toSSG で dist/ に静的サイトを生成
pnpm preview  # wrangler dev で dist/ を配信
pnpm deploy   # Cloudflare Workers (static assets + 配色MCP) へデプロイ
```

## Ruru連携

自作AIエージェントとの (いらない) 連携機能があります

### テーマカラー変更用のリモートMCPサーバー

ローカル確認用のトークンは `.dev.vars.example` を参考に `.dev.vars` へ設定する。

### コメントを貰う

これは開発マシンで codex が `ruru-work-comment` スキルで Ruru を呼ぶことで実現してます。
