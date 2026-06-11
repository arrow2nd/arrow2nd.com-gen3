# 0007: フォントは @fontsource で自己ホストする

- ステータス: 採用
- 日付: 2026-06-11

## コンテキスト

Next.js 版は `next/font/google` で IBM Plex Sans JP (400/500/600) と Poppins (500) を自己ホストしていた。HonoX に同等機能はない。

検討した選択肢:

1. **@fontsource パッケージ** ← 採用
2. Google Fonts CDN の `<link>`（自己ホスト放棄）
3. 手動で woff2 をサブセット化して配置

## 決定

`@fontsource/ibm-plex-sans-jp` + `@fontsource/poppins` の CSS を `app/client.ts` で import する。CSS Modules と同じ経路（[ADR-0003](./0003-keep-css-modules.md) の集約 CSS）で配信され、woff2 は `dist/static/` にハッシュ付きで emit される。

## 根拠

- @fontsource の日本語フォントは Google Fonts 同様 `unicode-range` で分割済みの woff2 を宣言するだけなので、**手動サブセット作業が不要**でブラウザが必要チャンクのみ取得する。next/font とほぼ等価の挙動
- `font-display: swap` がデフォルト
- 旧 `--font-poppins` 変数は `globals.css` で `"Poppins", sans-serif` として定義し直した

## 結果・トレードオフ

- `@font-face` 宣言が集約 CSS に大量に入る（許容範囲）
- dist に数百個のフォントファイルが emit される（unicode-range チャンク。配信されるのは実際に使われた分だけ）
