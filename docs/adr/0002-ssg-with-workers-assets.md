# 0002: SSG + Cloudflare Workers Assets で配信する

- ステータス: 採用
- 日付: 2026-06-11

## コンテキスト

作品データは `app/data/works/**/*.mdx` で管理され、コンテンツは全てビルド時に確定する。当初は SSR (Worker で都度レンダリング + fragment への Cache-Control 付与) も検討した。

## 決定

全ルートを `toSSG`（hono/ssg）で静的ファイル化し、**Worker スクリプトなしの assets-only Worker** として配信する。

- ビルド: `vite build --mode client` → `vite build`（SSRバンドル）→ `scripts/build-ssg.mjs`
- 動的ルート `/works/:slug` は `ssgParams` で slug を列挙
- 404 は `app/routes/404.tsx` → `dist/404.html` + `not_found_handling: "404-page"`
- fragment（部分HTML）も `dist/works/<slug>/fragment.html` として静的化され、Workers Assets の `auto-trailing-slash` がそのまま 200 で返す

## 根拠

- Worker の実行コストとキャッシュ設計（Cache-Control / Vary の混線対策）が丸ごと不要になる
- 無料枠で完結する
- 将来ランタイム処理が必要になったら Worker スクリプトを追加すれば段階的に SSR へ戻せる

## @hono/vite-ssg を使わなかった理由

`@hono/vite-ssg` は `generateBundle` 内で `createServer` + `ssrLoadModule` を使ってアプリを読み込むが、この経路では **CSS Modules の transform が `Cannot read properties of undefined (reading 'set')` で壊れる**（vite:css プラグインのキャッシュが内部サーバーのコンテキストで初期化されない）。

代わりに `@hono/vite-build/cloudflare-workers` で通常の SSR ビルド（CSS Modules は正しく処理される）を行い、生成された `dist/index.js` を Node から import して `toSSG` に通す自前スクリプトにした。SSG 完了後、SSR バンドルと不要な抽出 CSS は削除する。

## 結果・トレードオフ

- ビルドが3段になる（client → SSR → SSG スクリプト）
- `Footer` の `new Date()` などはビルド時に固定される（年表示のみなので許容）
- コンテンツ更新 = 再ビルド & 再デプロイ
