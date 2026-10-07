import { parseAccept } from "hono/utils/accept";

export function prefersMarkdown(header: string | null | undefined): boolean {
  const ranges = parseAccept(header ?? "");
  const quality = (type: string) => ranges.find((range) => range.type.toLowerCase() === type)?.q;

  // ワイルドカードだけのブラウザやクライアントには従来のHTMLを返す
  const markdown = quality("text/markdown") ?? 0;
  const html = quality("text/html") ?? quality("text/*") ?? quality("*/*") ?? 0;

  return markdown > 0 && markdown >= html;
}
