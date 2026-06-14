// works.ts を island から import すると import.meta.glob の全 MDX がクライアントバンドルに入ってしまう。
// なので island からも参照するカテゴリ定数だけ、この軽量モジュールに切り出している
export const CATEGORY_ORDER = ["web", "tool", "game", "sticker"] as const;

export type WorkCategory = (typeof CATEGORY_ORDER)[number];
