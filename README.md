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

型チェックとテストにはNode.js 24以上を使用する。構成の根拠は [ADR 0011](docs/adr/0011-ruru-mcp-with-static-assets.md) を参照。

```bash
pnpm typegen  # Wrangler設定からWorkerの型を生成
pnpm typecheck
pnpm test
```

配色MCPのローカル確認は `.dev.vars.example` を `.dev.vars` へコピーし、ローカル専用トークンを設定してから `pnpm build` と `pnpm preview` を実行する。本番KVへ書き込む設定は使用しない。本番では `pnpm exec wrangler secret put PORTFOLIO_MCP_TOKEN` でトークンを設定する。MCPクライアントはサイトの `/mcp` に接続し、Bearer認証で `get_theme` と `set_theme` を使用する。

`/theme.css` はブラウザで60秒、エッジで300秒キャッシュする。配色の変更ではキャッシュを削除しないため、反映までキャッシュの有効期限とKVの反映時間がかかる。通信に失敗した場合はデフォルトの配色を維持する。

```bash
PORTFOLIO_TEST_URL=http://localhost:8787 pnpm test
```

コメントの追加・再生成は `ruru-work-comment` スキルを使用する。接続済みRuru MCPへページ全文を渡し、作品そのものへのコメントを取得して作品ディレクトリの `ruru-comment.json` に保存する。保存されたコメントを確認してからコミットする。通常のビルドにはRuruへの接続は不要。

コメントのある作品ページではMDX本文の後の「Ruruにきいてみました」セクションにアイコンと吹き出しでコメントを表示する。ローカルプレビューのPC・SP表示は `agent-browser` を使って確認する。

```bash
RURU_COMMENT_PREVIEW_URL=http://localhost:8787/works/katasu-me pnpm test
```

配色CSSの遅延・失敗とトランジションは、ビルド後に一時ローカルサーバーと `agent-browser` で確認する。

```bash
pnpm build
THEME_UI_TEST=1 node --test tests/theme-ui.test.mjs
```
