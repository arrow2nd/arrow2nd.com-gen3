# 0003: スタイリングは CSS Modules を維持する

- ステータス: 採用
- 日付: 2026-06-11

## コンテキスト

HonoX は CSS Modules を公式サポートしていない（[honojs/discussions#3258](https://github.com/orgs/honojs/discussions/3258) は未回答のまま）。公式に整備されているのは「単一エントリ CSS（Tailwind 等）を `<Link>` で読む」方式のみ。一方、既存スタイル資産は全て CSS Modules で書かれており、運用ルール（`.claude/skills/css-modules`）も整備済み。

検討した選択肢:

1. **CSS Modules 維持（自前配線）** ← 採用
2. 素の CSS 単一エントリ + 命名規約
3. Tailwind CSS（公式ルート）
4. `hono/css`（組み込み CSS-in-JS、Experimental）

## 決定

CSS Modules を維持し、以下の **3点セット** で配線する（スパイクで dev / prod 両方のクラス名ハッシュ一致を検証済み）。

1. `vite.config.ts`: `build.cssCodeSplit: false` — 全 CSS を単一アセットに集約
2. `app/client.ts`: `import.meta.glob("./**/*.module.css", { eager: true })` を `globalThis` に保持 — **Vite は CSS Modules の export 未使用だと CSS ごと tree-shake する**ため、参照を残す
3. `app/components/AppCss`: 本番で manifest の `"style.css"` キーを `<link>` に解決 — **honox の `<Script>` は manifest の css 配列を一切リンクしない**ため自作が必要

クラス名ハッシュは「同一ファイル・同一設定」なら client / SSR の2段ビルド間で決定的に一致する。

## 不採用の理由

- **素のCSS**: フォールバックとしては有効だが、スコープ衝突回避を命名規約に頼ることになる。3点セットの検証が通ったため不要
- **Tailwind**: 全スタイルの書き直しになり、移行コストの大半がスタイル変換に化ける
- **hono/css**: ①fragment を `innerHTML` で挿入する本サイトの構成と根本的に相性が悪い（`<Style/>` 不在時のスタイル配送は `<script>` 埋め込みだが、innerHTML 経由の script は実行されない）②reset / フォント CSS はプレーン CSS 経路が残るため配線が消えない ③Experimental

## 結果・トレードオフ

- 3点セットのどれかが欠けると**本番でのみ**スタイルが消える。配線の意図は各ファイルのコメントと AGENTS.md に明記してある
- 全 CSS が1ファイルになる（ページ別分割なし）。本サイトはペライチなので CSS 総量では実質影響なし
- `composes` を使うため biome は `css.parser.cssModules: true` が必要

## 再検討の条件

- honox が CSS Modules を公式サポートしたら3点セットを撤去する
- ドロワー（fragment + innerHTML）をやめる場合は hono/css の損益が逆転しうる
