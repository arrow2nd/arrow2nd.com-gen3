# 0005: 同一 URL でのドロワー / フルページ出し分け

- ステータス: 採用
- 日付: 2026-06-11

## コンテキスト

作品詳細は「`/` からの遷移 → ドロワー表示」「URL 直アクセス → フルページ表示」を同じ `/works/:slug` URL で実現したい。Next.js 版は Parallel Routes + Intercepting Routes で実現していたが、HonoX に同等機能はない。

## 決定

fragment ルート + プログレッシブエンハンスメントで実現する。

- `/works/:slug` … フルページ（`c.render`、SSG）
- `/works/:slug/fragment` … ドロワー用の部分 HTML（`c.html`、レンダラー非適用、SSG）
- 一覧リンクは本物の `href` を持ち、ドロワー island が document レベルのクリック委譲で横取りする（修飾キー・中クリックは素通し）
- 横取り時: `history.pushState` でアドレスバーを `/works/:slug` にし、fetch 先は `/fragment`
- 閉じる操作は `history.back()` に集約。`popstate` では「UI 起点フラグ」を見て、ブラウザバック時はアニメーションのみ・フォワード時は再オープンと双方向同期する
- fragment が取得できない場合は `location.assign` でフルページへフォールバック

### fragment 内 island の手動ハイドレーション

`<honox-island>` は customElement ではないため、innerHTML で挿入しただけではハイドレーションされない。`createClient({ triggerHydration })` で honox の `hydrateComponent` を `globalThis.__hydrateIslands` に退避し、ドロワーが fragment 挿入後に呼ぶ。

- `data-hono-hydrated` ガードがあるため二重ハイドレーションは起きない
- **`showModal()` の後に hydrate する**こと。`display: none` 中だとカルーセルの採寸が 0 になる

## 根拠

- フルページと fragment で URL を分けることでキャッシュ混線を構造的に回避
- リンクが本物の `href` を持つため、JS 無効・クローラー・新規タブで自然に機能する
- 中身は `WorkDetail` コンポーネントを両ルートで共有しており、二重実装はない

## 結果・トレードオフ

- ドロワー表示中のリロードはフルページ表示になる（仕様として自然）
- `triggerHydration` は honox の公開オプションだが、内部関数の引数仕様（`querySelectorAll` を持つものなら何でも渡せる）に依存している。honox 更新時は要確認
