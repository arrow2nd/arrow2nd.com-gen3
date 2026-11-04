import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono, type MiddlewareHandler } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { z } from "zod";
import {
  assertNotFuture,
  type Diary,
  diaryDateSchema,
  diarySchema,
  evaluateAwake,
  publicHeartRate,
  type Signals,
  sha256Hex,
  signalsSchema,
} from "../shared/owner-status";

type AppEnv = { Bindings: Env };

const SIGNALS_KEY = "ruru_signals";
const LATEST_DIARY_KEY = "diary:latest";
const diaryKey = (date: string) => `diary:${date}`;

// 保存済みの値も検証する。壊れた値を公開せず、未受信と同じ扱いにするため。
async function readSignals(env: Env): Promise<Signals | null> {
  const parsed = signalsSchema.safeParse(await env.PORTFOLIO_STATE.get(SIGNALS_KEY, "json"));
  return parsed.success ? parsed.data : null;
}

async function readDiary(env: Env, date?: string): Promise<(Diary & { date: string }) | null> {
  const target = date ?? (await env.PORTFOLIO_STATE.get(LATEST_DIARY_KEY));
  if (target === null) {
    return null;
  }
  const parsed = diarySchema.safeParse(await env.PORTFOLIO_STATE.get(diaryKey(target), "json"));
  return parsed.success ? { date: target, ...parsed.data } : null;
}

const toolResult = (value: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
  structuredContent: value,
});
const toolError = (text: string) => ({ isError: true, content: [{ type: "text" as const, text }] });

const heartRateOutput = z.object({
  bpm: z.number().nullable(),
  observedAt: z.string().nullable(),
  stale: z.boolean(),
});
const awakeOutput = z.object({
  awake: z.boolean().nullable(),
  confidence: z.enum(["high", "low"]).nullable(),
  evaluatedAt: z.string(),
});
const diaryOutput = z.object({
  date: z.string(),
  text: z.string(),
  generatedAt: z.string(),
  approvedAt: z.string(),
  sha256: z.string(),
});

function createPublicMcpServer(env: Env) {
  const server = new McpServer({ name: "arrow2nd-status", version: "1.0.0" });
  const readOnly = { readOnlyHint: true, openWorldHint: false };

  server.registerTool(
    "get_heart_rate",
    {
      description:
        "arrow2ndの最新の心拍数(bpm)と計測時刻を返します。数十分程度の遅れがあり、30分より古い値はstale=trueになります。",
      inputSchema: z.strictObject({}),
      outputSchema: heartRateOutput,
      annotations: readOnly,
    },
    async () => {
      try {
        return toolResult(publicHeartRate(await readSignals(env), new Date()));
      } catch {
        return toolError("心拍数を取得できません。");
      }
    },
  );

  server.registerTool(
    "is_awake",
    {
      description:
        "arrow2ndが起きているかを推定して返します。awakeがnullなら判断できない状態です。confidenceがlowの推定は外れることがあります。",
      inputSchema: z.strictObject({}),
      outputSchema: awakeOutput,
      annotations: readOnly,
    },
    async () => {
      try {
        return toolResult(evaluateAwake(await readSignals(env), new Date()));
      } catch {
        return toolError("状態を取得できません。");
      }
    },
  );

  server.registerTool(
    "get_ruru_diary",
    {
      description:
        "arrow2ndのパーソナルエージェントRuruが書き、arrow2ndが承認した日記を返します。dateを省略すると最新の日記を返します。",
      inputSchema: z.strictObject({ date: diaryDateSchema.optional().describe("JSTの日付(YYYY-MM-DD)") }),
      outputSchema: diaryOutput,
      annotations: readOnly,
    },
    async ({ date }) => {
      try {
        const diary = await readDiary(env, date);
        return diary ? toolResult(diary) : toolError("該当する日記はありません。");
      } catch {
        return toolError("日記を取得できません。");
      }
    },
  );

  return server;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=30" },
  });

const ruruAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.env.PORTFOLIO_MCP_TOKEN) {
    return c.body(null, 503);
  }
  return bearerAuth<AppEnv>({ token: c.env.PORTFOLIO_MCP_TOKEN })(c, next);
};

export const ownerStatus = new Hono<AppEnv>({ strict: false });

// 公開APIはどのWebサービスからも読めるようにする。書き込みはプリフライトで拒否される。
ownerStatus.use("/api/*", cors({ origin: "*", allowMethods: ["GET", "HEAD"] }));

ownerStatus.get("/api/heart-rate", async (c) => json(publicHeartRate(await readSignals(c.env), new Date())));
ownerStatus.get("/api/awake", async (c) => json(evaluateAwake(await readSignals(c.env), new Date())));

ownerStatus.get("/api/ruru/diary", async (c) => {
  const diary = await readDiary(c.env);
  return diary ? json(diary) : c.json({ error: "not_found" }, 404);
});

ownerStatus.get("/api/ruru/diary/:date", async (c) => {
  const date = diaryDateSchema.safeParse(c.req.param("date"));
  if (!date.success) {
    return c.json({ error: "invalid_date" }, 400);
  }
  const diary = await readDiary(c.env, date.data);
  return diary ? json(diary) : c.json({ error: "not_found" }, 404);
});

ownerStatus.put("/api/ruru/signals", ruruAuth, bodyLimit({ maxSize: 4 * 1024 }), async (c) => {
  const parsed = signalsSchema.safeParse(await c.req.json().catch(() => undefined));
  if (!parsed.success) {
    return c.json({ error: "invalid_signals" }, 400);
  }
  try {
    assertNotFuture(parsed.data, new Date());
  } catch {
    return c.json({ error: "future_timestamp" }, 400);
  }
  await c.env.PORTFOLIO_STATE.put(SIGNALS_KEY, JSON.stringify(parsed.data));
  return c.body(null, 204);
});

ownerStatus.put("/api/ruru/diary/:date", ruruAuth, bodyLimit({ maxSize: 4 * 1024 }), async (c) => {
  const date = diaryDateSchema.safeParse(c.req.param("date"));
  const parsed = diarySchema.safeParse(await c.req.json().catch(() => undefined));
  if (!date.success || !parsed.success) {
    return c.json({ error: "invalid_diary" }, 400);
  }
  // 承認された下書きと公開する本文が同一であることを、Ruruが承認時に記録したハッシュで確かめる。
  if ((await sha256Hex(parsed.data.text)) !== parsed.data.sha256) {
    return c.json({ error: "sha256_mismatch" }, 400);
  }
  await c.env.PORTFOLIO_STATE.put(diaryKey(date.data), JSON.stringify(parsed.data));
  const latest = await c.env.PORTFOLIO_STATE.get(LATEST_DIARY_KEY);
  if (latest === null || date.data >= latest) {
    await c.env.PORTFOLIO_STATE.put(LATEST_DIARY_KEY, date.data);
  }
  return c.body(null, 204);
});

// 公開MCPは読み取り専用で秘密情報を扱わないため、認証もOriginの制限もかけない。
ownerStatus.post("/mcp/public", bodyLimit({ maxSize: 16 * 1024 }), async (c) => {
  const server = createPublicMcpServer(c.env);
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });

  await server.connect(transport);

  try {
    return await transport.handleRequest(c.req.raw);
  } finally {
    await server.close();
  }
});

ownerStatus.all("/mcp/public", (c) => c.body(null, 405, { Allow: "POST" }));
