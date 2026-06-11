// ビルド済みのSSRバンドル(dist/index.js)を toSSG に通して静的ファイルを生成する
import fs from "node:fs/promises";
import { toSSG } from "hono/ssg";

const app = (await import(new URL("../dist/index.js", import.meta.url))).default;

const result = await toSSG(app, fs, { dir: "./dist" });

if (!result.success) {
  throw result.error;
}

// SSRバンドルはSSGレンダリング専用なので配信物から除く
await fs.rm("./dist/index.js");
// SSRビルド側が抽出したCSS(クライアントは manifest 経由の static/ を参照する)も不要
await fs.rm("./dist/assets", { recursive: true, force: true });
// ビルドマニフェストはアップロード対象から除外
await fs.writeFile("./dist/.assetsignore", ".vite\n");

console.log(`SSG done: ${result.files?.length ?? 0} files`);
for (const file of result.files ?? []) {
  console.log(`  ${file}`);
}
