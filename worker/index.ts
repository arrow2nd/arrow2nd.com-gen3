import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import {
  DEFAULT_THEME,
  parseStoredTheme,
  themeCss,
  themeInputSchema,
  themeSchema,
  validateTheme,
} from "../shared/theme";

async function readTheme(env: Env) {
  const stored = await env.PORTFOLIO_STATE.get("theme", "json");

  return stored === null ? DEFAULT_THEME : parseStoredTheme(stored);
}

const result = (theme: z.infer<typeof themeSchema>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(theme) }],
  structuredContent: theme,
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/theme.css") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(null, { status: 405 });
      }

      // 全閲覧者で同じ配色を使うため、クエリやリクエストヘッダーでキャッシュを分けない。
      const cacheKey = new Request(`${url.origin}/theme.css`);

      try {
        const cached = await caches.default.match(cacheKey);

        if (cached) {
          return request.method === "HEAD" ? new Response(null, cached) : cached;
        }
      } catch {
        console.error(JSON.stringify({ event: "theme_cache_read_failed" }));
      }

      let theme = DEFAULT_THEME;
      let cacheControl = "public, max-age=60, s-maxage=300";

      try {
        theme = await readTheme(env);
      } catch {
        // 障害時の初期配色を保存すると、復旧後も本来の配色に戻らないため。
        cacheControl = "no-store";
        console.error(JSON.stringify({ event: "theme_fallback" }));
      }

      // HEADでも完全なCSSを保存し、後続のGETへ空の本文を返さない。
      const response = new Response(themeCss(theme), {
        headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": cacheControl },
      });

      if (cacheControl !== "no-store") {
        ctx.waitUntil(
          caches.default.put(cacheKey, response.clone()).catch(() => {
            console.error(JSON.stringify({ event: "theme_cache_write_failed" }));
          }),
        );
      }

      return request.method === "HEAD" ? new Response(null, response) : response;
    }

    if (url.pathname !== "/mcp") {
      return env.ASSETS.fetch(request);
    }

    if (!env.PORTFOLIO_MCP_TOKEN) {
      return new Response(null, { status: 503 });
    }

    const encoder = new TextEncoder();
    const [provided, expected] = await Promise.all([
      crypto.subtle.digest("SHA-256", encoder.encode(request.headers.get("Authorization") ?? "")),
      crypto.subtle.digest("SHA-256", encoder.encode(`Bearer ${env.PORTFOLIO_MCP_TOKEN}`)),
    ]);

    if (!crypto.subtle.timingSafeEqual(provided, expected)) {
      return new Response(null, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
    }

    // MCPはブラウザへ公開しないため、Origin付き接続は同一サイトだけを許可する。
    const origin = request.headers.get("Origin");

    if (origin !== null && origin !== url.origin) {
      return new Response(null, { status: 403 });
    }

    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { Allow: "POST" } });
    }

    let mcpRequest = request;

    if (request.method === "POST" && request.body) {
      // SDKがJSONを全量読み込む前に、配色ツールに不要な大きな入力を拒否する。
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        size += value.byteLength;

        if (size > 16 * 1024) {
          await reader.cancel();

          return new Response(null, { status: 413 });
        }

        chunks.push(value);
      }

      const body = new Uint8Array(size);
      let offset = 0;

      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }

      mcpRequest = new Request(request.url, { method: request.method, headers: request.headers, body });
    }

    const server = new McpServer({ name: "arrow2nd-portfolio", version: "1.0.0" });

    server.registerTool(
      "get_theme",
      {
        description: "ポートフォリオの現在の配色を取得します。地域間の反映に遅延があります。",
        inputSchema: z.strictObject({}),
        outputSchema: themeSchema,
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async () => {
        try {
          return result(await readTheme(env));
        } catch {
          return { isError: true, content: [{ type: "text", text: "保存された配色を取得できません。" }] };
        }
      },
    );

    server.registerTool(
      "set_theme",
      {
        description: "色相と彩度を変更します。視認性の悪い配色は拒否します。明度は40%固定です。",
        inputSchema: themeInputSchema,
        outputSchema: themeSchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async (input) => {
        let theme: z.infer<typeof themeSchema>;

        try {
          theme = { ...validateTheme(input), updatedAt: new Date().toISOString() };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text", text: error instanceof Error ? error.message : "配色が不正です。" }],
          };
        }

        try {
          await env.PORTFOLIO_STATE.put("theme", JSON.stringify(theme));

          return result(theme);
        } catch {
          return {
            isError: true,
            content: [{ type: "text", text: "配色を保存できません。自動再試行はしないでください。" }],
          };
        }
      },
    );

    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });

    await server.connect(transport);

    try {
      return await transport.handleRequest(mcpRequest);
    } finally {
      await server.close();
    }
  },
} satisfies ExportedHandler<Env>;
