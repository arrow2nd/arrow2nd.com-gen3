// gen2 (../arrow2nd.com-gen2/src/data/works/<slug>/index.toml + *.png) を
// gen3 の MDX 形式へ移植する一回限りのスクリプト。
// TOML を smol-toml でパースし、MDX を app/data/works/<category>/<slug>.mdx へ、
// 元 PNG を app/data/works/<category>/<slug>/ へコピーする。
//
// 実行: node scripts/migrate-from-gen2.mjs

import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "smol-toml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GEN2_WORKS = join(ROOT, "..", "arrow2nd.com-gen2", "src", "data", "works");
const OUT_WORKS = join(ROOT, "app", "data", "works");

// vrc は gen3 に存在しないカテゴリのため game へ編入する
const CATEGORY_MAP = {
  web: "web",
  tool: "tool",
  game: "game",
  sticker: "sticker",
  vrc: "game",
};

// createdAt は "2019/12/27" と "2025-01-01" の2形式が混在する。
// どちらも先頭2フィールドが年・月なので区切り文字を吸収して "YYYY年M月" に整形する。
function formatCreatedAt(createdAt) {
  const [year, month] = createdAt.split(/[/-]/);
  return `${Number(year)}年${Number(month)}月`;
}

// frontmatter にはソート用に ISO 形式（文字列比較で時系列順になる）へ正規化して出力する
function normalizeCreatedAt(createdAt) {
  const [year, month, day = "1"] = createdAt.split(/[/-]/);
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// title に "display: 283;" のような YAML 特殊文字が含まれるため、
// frontmatter の文字列値は JSON.stringify でクオートして安全に出力する。
function quote(value) {
  return JSON.stringify(value);
}

function buildMdx(toml, slug) {
  const images = (toml.images ?? []).map((img) => {
    // src は "./0_top.png" 形式。ファイル名だけ取り出し WebP の配信パスへ変換する
    const name = img.src.replace(/^\.\//, "").replace(/\.png$/i, "");
    return `/images/works/${slug}/${name}.webp`;
  });
  const links = toml.links ?? [];

  const frontmatterLines = [`title: ${quote(toml.title)}`];

  if (images.length > 0) {
    frontmatterLines.push("images:");
    for (const image of images) {
      frontmatterLines.push(`  - ${image}`);
    }
  }

  // frontmatter の link には先頭のリンクのみを置く
  if (links.length > 0) {
    frontmatterLines.push(`link: ${links[0].href}`);
  }

  if (toml.createdAt) {
    frontmatterLines.push(`createdAt: ${normalizeCreatedAt(toml.createdAt)}`);
  }

  const bodyParts = [];

  // sections は gen2 の順序を維持する
  for (const section of toml.sections ?? []) {
    // body 末尾の改行を整理して段落として出力する
    bodyParts.push(`## ${section.title}\n\n${section.body.trim()}`);
  }

  // createdAt は本文「## 制作時期」へ "YYYY年M月" 表記で出力する
  if (toml.createdAt) {
    bodyParts.push(`## 制作時期\n\n${formatCreatedAt(toml.createdAt)}`);
  }

  // links は全件を Markdown リストとして「## リンク」節に保持する
  if (links.length > 0) {
    const items = links.map((link) => `- [${link.label}](${link.href})`).join("\n");
    bodyParts.push(`## リンク\n\n${items}`);
  }

  return `---\n${frontmatterLines.join("\n")}\n---\n\n${bodyParts.join("\n\n")}\n`;
}

function main() {
  const slugs = readdirSync(GEN2_WORKS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const counts = {};

  for (const slug of slugs) {
    const tomlPath = join(GEN2_WORKS, slug, "index.toml");
    const toml = parseToml(readFileSync(tomlPath, "utf-8"));
    const category = CATEGORY_MAP[toml.category];

    if (!category) {
      throw new Error(`未知のカテゴリ: ${toml.category} (${slug})`);
    }

    const destDir = join(OUT_WORKS, category, slug);
    mkdirSync(destDir, { recursive: true });

    // 元 PNG をコピーする
    for (const entry of readdirSync(join(GEN2_WORKS, slug))) {
      if (entry.toLowerCase().endsWith(".png")) {
        cpSync(join(GEN2_WORKS, slug, entry), join(destDir, entry));
      }
    }

    // MDX を出力する
    const mdx = buildMdx(toml, slug);
    writeFileSync(join(destDir, "index.mdx"), mdx);

    counts[category] = (counts[category] ?? 0) + 1;
  }

  console.log("移植完了:", counts);
  console.log(
    "合計:",
    Object.values(counts).reduce((a, b) => a + b, 0),
  );
}

main();
