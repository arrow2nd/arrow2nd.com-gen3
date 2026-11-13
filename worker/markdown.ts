import { parseAccept } from "hono/utils/accept";

// HTMLを明示的に要求しないクライアントはエージェントとみなし、Markdownを返す。
// ブラウザはページ遷移のAcceptに必ず text/html を含め、text/markdown は含めない。
// 両方を要求するクライアントには、Markdownのq値がHTML以上のときにMarkdownを返す(RFC 9110 12.5.1)。
export function prefersMarkdown(header: string | null | undefined): boolean {
  const ranges = parseAccept(header ?? "");
  const quality = (type: string) =>
    Math.max(0, ...ranges.filter((range) => range.type.toLowerCase() === type).map((range) => range.q));

  const html = quality("text/html");

  return html === 0 || quality("text/markdown") >= html;
}
