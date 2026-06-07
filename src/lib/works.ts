import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const WORKS_DIR = path.join(process.cwd(), "src/data/works");

const CATEGORY_ORDER = ["web", "tool", "game", "sticker"] as const;

type WorkCategory = (typeof CATEGORY_ORDER)[number];

type Work = {
  slug: string;
  category: WorkCategory;
  title: string;
  images: string[];
  link?: string;
  content: string;
};

function getWorksByCategory(category: WorkCategory): Work[] {
  const dir = path.join(WORKS_DIR, category);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug: path.basename(file, ".md"),
      category,
      title: data.title,
      images: data.images,
      link: data.link,
      content,
    };
  });
}

export function getAllWorksByCategory(): Map<WorkCategory, Work[]> {
  const map = new Map<WorkCategory, Work[]>();

  for (const category of CATEGORY_ORDER) {
    map.set(category, getWorksByCategory(category));
  }

  return map;
}

export function getWorkBySlug(slug: string): Work | undefined {
  for (const category of CATEGORY_ORDER) {
    const works = getWorksByCategory(category);
    const found = works.find((w) => w.slug === slug);

    if (found) {
      return found;
    }
  }

  return undefined;
}

export function getAllSlugs(): string[] {
  return CATEGORY_ORDER.flatMap((category) => getWorksByCategory(category).map((w) => w.slug));
}
