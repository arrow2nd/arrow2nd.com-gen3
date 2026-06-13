import type { FC } from "hono/jsx";
import { CATEGORY_ORDER, type WorkCategory } from "./categories";

type Frontmatter = {
  title: string;
  images: string[];
  // ISO 形式 (YYYY-MM-DD)。文字列比較でソートできる
  createdAt: string;
};

// MDX(remark-mdx-frontmatter)がビルド時に生成するモジュールの形
type WorkModule = {
  default: FC<{ components?: Record<string, FC> }>;
  frontmatter: Frontmatter;
};

export type Work = {
  slug: string;
  category: WorkCategory;
  title: string;
  images: string[];
  createdAt: string;
  Content: WorkModule["default"];
};

const modules = import.meta.glob<WorkModule>("../data/works/*/*/index.mdx", { eager: true });

const works: Work[] = Object.entries(modules)
  .flatMap(([path, mod]) => {
    const matched = path.match(/works\/([^/]+)\/([^/]+)\/index\.mdx$/);

    if (!matched) {
      return [];
    }

    const [, category, slug] = matched;

    return [
      {
        slug,
        category: category as WorkCategory,
        title: mod.frontmatter.title,
        images: mod.frontmatter.images,
        createdAt: mod.frontmatter.createdAt,
        Content: mod.default,
      },
    ];
  })
  // 一覧・slug 列挙の共通の並び順として制作日の新しい順にしておく
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function getAllWorksByCategory(): Map<WorkCategory, Work[]> {
  const map = new Map<WorkCategory, Work[]>();

  for (const category of CATEGORY_ORDER) {
    map.set(
      category,
      works.filter((w) => w.category === category),
    );
  }

  return map;
}

export function getWorkBySlug(slug: string): Work | undefined {
  return works.find((w) => w.slug === slug);
}

export function getAllSlugs(): string[] {
  // 一覧と同じカテゴリ順で返す
  return CATEGORY_ORDER.flatMap((category) => works.filter((w) => w.category === category).map((w) => w.slug));
}
