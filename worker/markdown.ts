import { parseAccept } from "hono/utils/accept";

// HTMLを明示的に要求しないクライアントはエージェントとみなし、Markdownを返す。
// ブラウザはページ遷移のAcceptに必ず text/html を含める。
export function prefersMarkdown(header: string | null | undefined): boolean {
  return !parseAccept(header ?? "").some((range) => range.type.toLowerCase() === "text/html" && range.q > 0);
}
