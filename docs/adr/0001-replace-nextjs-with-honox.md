# 0001: Next.js を HonoX + hono/jsx に置き換える

- ステータス: 採用
- 日付: 2026-06-11

## コンテキスト

gen3 は当初 Next.js 16 (App Router) で構築していた。ペライチ + 作品詳細のみの小規模サイトに対して、React + Next.js のランタイムは過剰だった。

- クライアント JS が大きい（hono/jsx/dom のカウンタ例: Brotli 2.8KB vs React 47.8KB）
- 実際に必要なクライアント処理はカルーセル・ドロワー・シェアボタンの3つだけ
- Parallel Routes / Intercepting Routes など、ドロワー出し分けのために使っていた機能はフレームワーク依存度が高い

## 決定

HonoX + hono/jsx（サーバー）+ hono/jsx/dom（islands）にフルリプレイスする。インタラクティブな部分のみ `app/islands/` に置き、それ以外はサーバーレンダリングのみとする。

## 根拠

- 移行後のクライアント JS は gzip 約 9KB
- islands アーキテクチャがこのサイトの構造（ほぼ静的 + 点在するインタラクション）に合致する
- hono/jsx のフック API は React 互換が高く、Carousel はロジック無変更で移植できた

## 結果・トレードオフ

- **React 専用ライブラリは使えない**。hono/jsx/dom の React 互換は部分的で、Radix UI Primitives 等は動かない（[honojs/hono#2508](https://github.com/honojs/hono/issues/2508)）→ vaul を自前実装に置き換えた（[ADR-0004](./0004-custom-drawer-with-dialog.md)）
- Storybook のレンダラーが存在しない → 廃止（[ADR-0006](./0006-drop-storybook.md)）
- hono/jsx の `useRef` は `current: T | null` 型など、React と微妙に異なる点がある
- honox は `ssr: { noExternal: true }` を強制するため、CJS を含む依存が SSR で壊れることがある（[ADR-0008](./0008-budoux-parser-shim.md)）
