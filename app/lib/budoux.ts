// budoux のメインエントリは HTMLProcessingParser 経由で css-select(CJSのboolbase)を
// 無条件に引き込み、honox の SSR(noExternal: true)で評価エラーになる。
// 使うのは Parser と jaModel だけなので、依存ゼロの実装ファイルを直接 re-export する。
// (パッケージの exports マップが深い import を許可していないため、ファイルパスで参照)
export { model as jaModel } from "../../node_modules/budoux/module/data/models/ja.js";
export { Parser } from "../../node_modules/budoux/module/parser.js";
