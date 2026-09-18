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

```bash
# ローカルWorkerの認証・配色変更・キャッシュ
PORTFOLIO_TEST_URL=http://localhost:8787 pnpm test

# ビルド済みサイトの配色CSSの遅延・失敗・トランジション
THEME_UI_TEST=1 node --test tests/theme-ui.test.mjs
```

### コメントを貰う

コメントの追加・再生成は `ruru-work-comment` スキルを使用する。ブラウザ確認には `agent-browser` を使用する。

```bash
# ローカルプレビューのPC・SP表示
RURU_COMMENT_PREVIEW_URL=http://localhost:8787/works/ruru-ai pnpm test
```
