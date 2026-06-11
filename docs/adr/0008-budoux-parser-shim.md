# 0008: budoux は parser を直接参照する

- ステータス: 採用
- 日付: 2026-06-11

## コンテキスト

BudouX コンポーネントは `budoux` の `Parser` と `jaModel` だけを使う。しかし budoux のメインエントリは `HTMLProcessingParser` 経由で css-select → boolbase（CJS）を無条件に引き込む。

honox の vite プラグインは `ssr: { noExternal: true }` を強制するため、SSR では全依存がモジュールランナーでインライン評価され、**CJS の boolbase が `module is not defined` で壊れる**。`ssr.external` を指定しても honox の設定が優先され効かない。

## 決定

`app/lib/budoux.ts` で、依存ゼロの実装ファイルをパッケージの exports マップを迂回してファイルパスで直接 re-export する。

```ts
export { model as jaModel } from "../../node_modules/budoux/module/data/models/ja.js";
export { Parser } from "../../node_modules/budoux/module/parser.js";
```

`parser.js` は import を一切持たない自己完結モジュールであることを確認済み。

## 根拠

- css-select / dom 系のサブツリーを丸ごと回避でき、SSR エラーの根本原因が消える
- 使わないコードがバンドルに入らない

## 結果・トレードオフ

- `node_modules` への相対パス参照は脆い。**budoux のバージョン更新時はパスとモジュール構成の確認が必要**
- budoux が exports マップで `./module/parser` 等を公開したら、そちらへ切り替えて撤去する
