# プロジェクト構成

HonoX + hono/jsx + CSS Modules + SSG。Cloudflare Workers の static assets として配信する(Worker スクリプトなし)。

技術選定の経緯と根拠は [docs/adr/](./docs/adr/README.md) を参照。構成を変更する前に必ず該当 ADR を読むこと。

- React は使っていない。JSX は `hono/jsx`(サーバー) / `hono/jsx/dom`(islands)。React 専用ライブラリは動かない
- ページは `/`(ペライチ)と `/works/:slug`(作品詳細)のみ。`/works/:slug/fragment` はドロワー用の部分HTML
- 作品データは `app/data/works/<category>/<slug>.mdx`。frontmatter(title/images/link)は remark-mdx-frontmatter でビルド時に展開され、`app/lib/works.ts` の `import.meta.glob` で集約される

## CSS Modules の配線(壊さないこと)

Vite/honox の制約を回避するための3点セット。どれか欠けると本番でスタイルが消える。

1. `vite.config.ts` の `build.cssCodeSplit: false` — 全CSSを単一アセットに集約
2. `app/client.ts` の `import.meta.glob("./**/*.module.css", { eager: true })` + globalThis への参照保持 — Vite は CSS Modules の export 未使用だと CSS ごと tree-shake する
3. `app/components/AppCss` — manifest の `"style.css"` キーを `<link>` に解決(honox の `<Script>` は CSS をリンクしない)

## SSG

`pnpm build` = client ビルド → SSR ビルド(dist/index.js) → `scripts/build-ssg.mjs` が `toSSG` で静的化。
`@hono/vite-ssg` は内部の ssrLoadModule が CSS Modules と非互換なので使わない。
動的ルートは `ssgParams`(hono/ssg) で slug を列挙する。

## dev の注意点

- mdx の追加・編集は dev サーバーに反映されないことがある(eager glob の SSRキャッシュ) → サーバー再起動
- islands を追加した直後にハイドレーションされない場合、ブラウザが `node_modules/.vite/deps/honox_client.js` を immutable キャッシュしている → ハードリロード(キャッシュ無視)で解消。本番ビルドでは起きない
- ドロワー(app/islands/works-drawer.tsx)は useState を使わず ref + 命令的DOMで書く。innerHTML で挿入した fragment が再レンダリングで消えるため
