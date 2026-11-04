import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { type Context, Hono, type MiddlewareHandler } from "hono";
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
  isDiaryDateInRange,
  publicHeartRate,
  type Signals,
  sha256Hex,
  signalsSchema,
} from "../shared/owner-status";

type AppEnv = { Bindings: Env };

const SIGNALS_KEY = "ruru_signals";
const LATEST_DIARY_KEY = "diary:latest";
const diaryKey = (date: string) => `diary:${date}`;
// 公開APIは誰でも叩けるため、KVの値を短時間キャッシュして読み取り回数を抑える。
const KV_CACHE_TTL_SECONDS = 30;

const log = (event: string) => console.error(JSON.stringify({ event }));

// KVの値とキャッシュの読み書きをまとめる。リクエストのoriginをキャッシュキーに使う。
class Store {
  constructor(
    private readonly env: Env,
    private readonly ctx: Context<AppEnv>["executionCtx"],
    private readonly origin: string,
  ) {}

  static from(c: Context<AppEnv>) {
    return new Store(c.env, c.executionCtx, new URL(c.req.url).origin);
  }

  private cacheKey(key: string) {
    return new Request(`${this.origin}/__kv-cache/${encodeURIComponent(key)}`);
  }

  // KVの読み取りに失敗した場合は例外を投げる。キャッシュの失敗はKVへの読み取りで補う。
  private async readJson(key: string): Promise<unknown> {
    const cacheKey = this.cacheKey(key);

    try {
      const cached = await caches.default.match(cacheKey);
      if (cached) {
        return await cached.json();
      }
    } catch {
      log("status_cache_read_failed");
    }

    const value = await this.env.PORTFOLIO_STATE.get(key, "json");
    const response = new Response(JSON.stringify(value), {
      headers: { "Cache-Control": `max-age=${KV_CACHE_TTL_SECONDS}` },
    });
    this.ctx.waitUntil(caches.default.put(cacheKey, response).catch(() => log("status_cache_write_failed")));
    return value;
  }

  async write(key: string, value: unknown) {
    await this.env.PORTFOLIO_STATE.put(key, JSON.stringify(value));
    // 他の拠点のキャッシュは消せないため、反映はKV_CACHE_TTL_SECONDSまで遅れることがある。
    await caches.default.delete(this.cacheKey(key)).catch(() => log("status_cache_delete_failed"));
  }

  // 保存済みの値も検証する。壊れた値を公開せず、未受信と同じ扱いにするため。
  async signals(): Promise<Signals | null> {
    const parsed = signalsSchema.safeParse(await this.readJson(SIGNALS_KEY));
    return parsed.success ? parsed.data : null;
  }

  async diary(date?: string): Promise<(Diary & { date: string }) | null> {
    const target = date ?? diaryDateSchema.safeParse(await this.readJson(LATEST_DIARY_KEY)).data;
    if (target === undefined || !isDiaryDateInRange(target, new Date())) {
      return null;
    }
    const parsed = diarySchema.safeParse(await this.readJson(diaryKey(target)));
    return parsed.success ? { date: target, ...parsed.data } : null;
  }

  // 書き込みの判断に使うため、キャッシュを通さずに読む。壊れた値は未設定として上書きさせる。
  async latestDiaryDate(): Promise<string | null> {
    const stored = await this.env.PORTFOLIO_STATE.get(LATEST_DIARY_KEY, "json").catch((error: unknown) => {
      if (error instanceof SyntaxError) {
        return null;
      }
      throw error;
    });
    return diaryDateSchema.safeParse(stored).data ?? null;
  }
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

function createPublicMcpServer(store: Store) {
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
        return toolResult(publicHeartRate(await store.signals(), new Date()));
      } catch {
        log("status_read_failed");
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
        return toolResult(evaluateAwake(await store.signals(), new Date()));
      } catch {
        log("status_read_failed");
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
        const diary = await store.diary(date);
        return diary ? toolResult(diary) : toolError("該当する日記はありません。");
      } catch {
        log("status_read_failed");
        return toolError("日記を取得できません。");
      }
    },
  );

  return server;
}

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=30" },
  });

// KVの障害時は503を返す。障害を示す応答をブラウザやCDNに保存させない。
async function respond(c: Context<AppEnv>, read: (store: Store) => Promise<unknown>) {
  let body: unknown;

  try {
    body = await read(Store.from(c));
  } catch {
    log("status_read_failed");
    return c.body(null, 503, { "Cache-Control": "no-store" });
  }

  return body === null ? c.json({ error: "not_found" }, 404) : json(body);
}

const ruruAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.env.PORTFOLIO_MCP_TOKEN) {
    return c.body(null, 503);
  }
  return bearerAuth<AppEnv>({ token: c.env.PORTFOLIO_MCP_TOKEN })(c, next);
};

export const ownerStatus = new Hono<AppEnv>({ strict: false });

// 公開APIはどのWebサービスからも読めるようにする。書き込みはプリフライトで拒否される。
ownerStatus.use("/api/*", cors({ origin: "*", allowMethods: ["GET", "HEAD"] }));

ownerStatus.get("/api/heart-rate", (c) =>
  respond(c, async (store) => publicHeartRate(await store.signals(), new Date())),
);
ownerStatus.get("/api/awake", (c) => respond(c, async (store) => evaluateAwake(await store.signals(), new Date())));

ownerStatus.get("/api/ruru/diary", (c) => respond(c, (store) => store.diary()));

ownerStatus.get("/api/ruru/diary/:date", async (c) => {
  const date = diaryDateSchema.safeParse(c.req.param("date"));
  if (!date.success) {
    return c.json({ error: "invalid_date" }, 400);
  }
  return respond(c, (store) => store.diary(date.data));
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
  await Store.from(c).write(SIGNALS_KEY, parsed.data);
  return c.body(null, 204);
});

ownerStatus.put("/api/ruru/diary/:date", ruruAuth, bodyLimit({ maxSize: 4 * 1024 }), async (c) => {
  const date = diaryDateSchema.safeParse(c.req.param("date"));
  const parsed = diarySchema.safeParse(await c.req.json().catch(() => undefined));
  if (!date.success || !parsed.success || !isDiaryDateInRange(date.data, new Date())) {
    return c.json({ error: "invalid_diary" }, 400);
  }
  // 承認された下書きと公開する本文が同一であることを、Ruruが承認時に記録したハッシュで確かめる。
  if ((await sha256Hex(parsed.data.text)) !== parsed.data.sha256) {
    return c.json({ error: "sha256_mismatch" }, 400);
  }
  const store = Store.from(c);
  await store.write(diaryKey(date.data), parsed.data);
  const latest = await store.latestDiaryDate();
  if (latest === null || date.data >= latest) {
    await store.write(LATEST_DIARY_KEY, date.data);
  }
  return c.body(null, 204);
});

// 公開MCPは読み取り専用で秘密情報を扱わないため、認証もOriginの制限もかけない。
ownerStatus.post("/mcp/public", bodyLimit({ maxSize: 16 * 1024 }), async (c) => {
  const server = createPublicMcpServer(Store.from(c));
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });

  await server.connect(transport);

  try {
    return await transport.handleRequest(c.req.raw);
  } finally {
    await server.close();
  }
});

ownerStatus.all("/mcp/public", (c) => c.body(null, 405, { Allow: "POST" }));
