// ビルド済みのSSRバンドル(dist/index.js)を toSSG に通して静的ファイルを生成する
import fs from "node:fs/promises";
import path from "node:path";
import { toSSG } from "hono/ssg";

const SITE_URL = "https://arrow2nd.com/";
const OUTPUT_DIR = "./dist";

// fragment はドロワーに差し込む部分HTML、404 はクローラに辿らせる必要がないので除外
const sitemapPlugin = {
  afterGenerateHook: async (result, fsModule, options) => {
    if (!result.files) {
      return;
    }

    const outputDir = options?.dir ?? OUTPUT_DIR;
    const urls = result.files
      .map((file) => path.relative(outputDir, file).replaceAll(path.sep, "/"))
      .filter((rel) => rel.endsWith(".html"))
      // 404 は検索結果に出したくない、fragment はドロワーに差し込む部分HTMLでクローラに辿らせる必要なし
      .filter((rel) => rel !== "404.html" && !rel.endsWith("/fragment.html"))
      // 拡張子なし URL でサイトを運用しているので canonical に合わせる(index.html → "")
      .map((rel) => rel.replace(/(?:^|\/)index\.html$/, "/").replace(/\.html$/, ""))
      .map((rel) => new URL(rel, SITE_URL).toString())
      .sort();

    const body = urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

    await fsModule.writeFile(path.join(outputDir, "sitemap.xml"), xml);
  },
};

const app = (await import(new URL("../dist/index.js", import.meta.url))).default;

const result = await toSSG(app, fs, {
  dir: OUTPUT_DIR,
  plugins: [sitemapPlugin],
});

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
