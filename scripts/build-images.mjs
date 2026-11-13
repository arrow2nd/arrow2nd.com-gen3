// app/data/works/<category>/<slug>/*.png を sharp で WebP に変換し、
// public/images/works/<slug>/<name>.webp として配信用に出力する。
// dev / build の先頭で実行される（package.json で連結）。
//
// 出力が入力より新しい場合はスキップする mtime 比較の増分ビルド。
//
// 実行: node scripts/build-images.mjs

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WORKS_DIR = join(ROOT, "app", "data", "works");
const OUT_DIR = join(ROOT, "public", "images", "works");
// <img> の width / height に使う寸法の一覧。app/lib/image-sizes.ts が読み込む
const SIZES_FILE = join(ROOT, "app", "generated", "image-sizes.json");

// app/data/works/<category>/<slug>/*.png を列挙する
function collectPngs() {
  const result = [];

  if (!existsSync(WORKS_DIR)) {
    return result;
  }

  for (const category of readdirSync(WORKS_DIR, { withFileTypes: true })) {
    if (!category.isDirectory()) {
      continue;
    }

    const categoryDir = join(WORKS_DIR, category.name);

    for (const slug of readdirSync(categoryDir, { withFileTypes: true })) {
      if (!slug.isDirectory()) {
        continue;
      }

      const slugDir = join(categoryDir, slug.name);

      for (const entry of readdirSync(slugDir)) {
        if (entry.toLowerCase().endsWith(".png")) {
          result.push({ slug: slug.name, name: entry.replace(/\.png$/i, ""), input: join(slugDir, entry) });
        }
      }
    }
  }

  return result;
}

async function main() {
  const pngs = collectPngs();
  let converted = 0;
  let skipped = 0;
  const sizes = {};

  for (const { slug, name, input } of pngs) {
    // WebP化で寸法は変わらないので、変換をスキップした画像も元のPNGから読む
    const { width, height } = await sharp(input).metadata();
    sizes[`/images/works/${slug}/${name}.webp`] = { width, height };

    const outSlugDir = join(OUT_DIR, slug);
    mkdirSync(outSlugDir, { recursive: true });

    const output = join(outSlugDir, `${name}.webp`);

    // 出力が入力より新しければ変換不要（増分ビルド）
    if (existsSync(output) && statSync(output).mtimeMs >= statSync(input).mtimeMs) {
      skipped++;
      continue;
    }

    // quality 80 / アルファ保持で WebP 化する
    await sharp(input).webp({ quality: 80 }).toFile(output);
    converted++;
  }

  mkdirSync(dirname(SIZES_FILE), { recursive: true });
  writeFileSync(SIZES_FILE, `${JSON.stringify(sizes, null, 2)}\n`);

  console.log(`WebP変換: ${converted} 件変換, ${skipped} 件スキップ (合計 ${pngs.length})`);
}

main();
