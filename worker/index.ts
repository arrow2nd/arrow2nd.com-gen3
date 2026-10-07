import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { type Context, Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { DEFAULT_THEME, parseStoredTheme, themeInputSchema, themeSchema, validateTheme } from "../shared/theme";
import { prefersMarkdown } from "./markdown";

type AppEnv = { Bindings: Env };

async function readTheme(env: Env) {
  const stored = await env.PORTFOLIO_STATE.get("theme", "json");

  return stored === null ? DEFAULT_THEME : parseStoredTheme(stored);
}

const result = (theme: z.infer<typeof themeSchema>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(theme) }],
  structuredContent: theme,
});

function createMcpServer(env: Env) {
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

  return server;
}

async function serveByAccept(c: Context<AppEnv>, markdownPath: string) {
  const url = new URL(c.req.url);

  if (prefersMarkdown(c.req.header("Accept"))) {
    url.pathname = markdownPath;
  }

  const asset = await c.env.ASSETS.fetch(new Request(url, c.req.raw));
  // 同じURLでもAcceptで本文が変わるため、キャッシュを分けさせる。
  const response = new Response(asset.body, asset);
  response.headers.append("Vary", "Accept");

  return response;
}

// 末尾スラッシュ付きの作品URLも同じルートで扱うため、strictを無効にする。
const app = new Hono<AppEnv>({ strict: false });

// HEADはHonoがGETハンドラーの結果から本文を除いて返すため、キャッシュには常に完全なJSONが入る。
app.get("/theme.json", async (c) => {
  // 全閲覧者で同じ配色を使うため、クエリやリクエストヘッダーでキャッシュを分けない。
  const cacheKey = new Request(`${new URL(c.req.url).origin}/theme.json`);

  try {
    const cached = await caches.default.match(cacheKey);

    if (cached) {
      return cached;
    }
  } catch {
    console.error(JSON.stringify({ event: "theme_cache_read_failed" }));
  }

  let theme: z.infer<typeof themeSchema>;

  try {
    theme = await readTheme(c.env);
  } catch {
    // 障害時の初期配色を保存すると、復旧後も本来の配色に戻らないため。
    console.error(JSON.stringify({ event: "theme_read_failed" }));
    return c.body(null, 503, { "Cache-Control": "no-store" });
  }

  const response = new Response(JSON.stringify({ hue: theme.hue, chroma: theme.chroma }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=300" },
  });

  c.executionCtx.waitUntil(
    caches.default.put(cacheKey, response.clone()).catch(() => {
      console.error(JSON.stringify({ event: "theme_cache_write_failed" }));
    }),
  );

  return response;
});

app.all("/theme.json", (c) => c.body(null, 405));

app.use("/mcp", async (c, next) => {
  if (!c.env.PORTFOLIO_MCP_TOKEN) {
    return c.body(null, 503);
  }

  return bearerAuth<AppEnv>({ token: c.env.PORTFOLIO_MCP_TOKEN })(c, next);
});

app.use("/mcp", async (c, next) => {
  // MCPはブラウザへ公開しないため、Origin付き接続は同一サイトだけを許可する。
  const origin = c.req.header("Origin");

  if (origin !== undefined && origin !== new URL(c.req.url).origin) {
    return c.body(null, 403);
  }

  await next();
});

// SDKがJSONを全量読み込む前に、配色ツールに不要な大きな入力を拒否する。
app.post("/mcp", bodyLimit({ maxSize: 16 * 1024 }), async (c) => {
  const server = createMcpServer(c.env);
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });

  await server.connect(transport);

  try {
    return await transport.handleRequest(c.req.raw);
  } finally {
    await server.close();
  }
});

app.all("/mcp", (c) => c.body(null, 405, { Allow: "POST" }));

app.get("/", (c) => serveByAccept(c, "/index.md"));
app.get("/works/:slug{[^/.]+}", (c) => serveByAccept(c, `/works/${c.req.param("slug")}.md`));

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
