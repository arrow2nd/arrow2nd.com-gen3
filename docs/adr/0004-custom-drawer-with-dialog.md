# 0004: ドロワーは dialog 要素で自前実装する

- ステータス: 採用
- 日付: 2026-06-11

## コンテキスト

Next.js 版では vaul のフォーク（@arrow2nd/vaul）でドロワーを実装していた。vaul は `@radix-ui/react-dialog` に依存しており、Radix UI Primitives は hono/jsx/dom で**動作しないことが確認されている**（[honojs/hono#2508](https://github.com/honojs/hono/issues/2508)）。

検討した選択肢:

1. **`<dialog>` + Pointer Events で自前実装** ← 採用
2. ドロワー island 内だけ React をマウント（react + react-dom + radix で +60KB 弱、移行の動機と矛盾）
3. `@hono/react-compat` でエイリアス（Radix が動かない実績があるため不可）

## 決定

`app/islands/works-drawer.tsx` として自前実装する。指に追従するドラッグ（vaul 相当の体験）は必須要件。

### `<dialog>.showModal()` を使う

フォーカストラップ・閉時のフォーカス復帰・Esc（`cancel` イベント）・`::backdrop`・top layer がブラウザ組み込みで手に入る。fixed div 自前方式に対する a11y コスト差が大きい。

### 実装上の設計

- **useState を使わず ref + 命令的 DOM のみ**。fragment を `innerHTML` で挿入するため、hono/jsx の再レンダリングが走ると挿入内容が消える
- ドラッグ確定条件: 下方向 +8px かつ（ハンドル起点 or `inner.scrollTop <= 0`）。確定後のみ非 passive `touchmove` で `preventDefault`（内側スクロールとの取り合い防止）
- 閉じ判定: **直近 100ms のサンプル**から算出した速度 > 0.4px/ms、または高さの 40% 超の移動。サンプル窓を区切らないと「速くドラッグ → 停止 → 離す」で古い速度により誤って閉じる
- backdrop のフェードは `--drag-progress` CSS 変数を dialog にセットし `::backdrop` が継承する
- ハンドルは `touch-action: none`、内側スクロール領域は `overscroll-behavior: contain`

## 結果・トレードオフ

- 実装は約 300 行。vaul のスナップポイント等の機能は持たない（不要）
- `::backdrop` のカスタムプロパティ継承は比較的新しいブラウザ機能。非対応ブラウザではフェードが効かないだけで機能は壊れない
- iOS Safari 実機でのジェスチャ確認は未実施（要実機テスト）
