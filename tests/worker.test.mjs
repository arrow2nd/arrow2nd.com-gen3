import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const base = process.env.PORTFOLIO_TEST_URL;

test("ローカルWorkerの認証・配色変更・不正入力拒否・JSONと静的配信", { skip: !base }, async () => {
  const url = new URL(base);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "本番へのテスト書き込みは禁止");
  const vars = await fs.readFile(new URL("../.dev.vars", import.meta.url), "utf8");
  const token = vars.match(/^PORTFOLIO_MCP_TOKEN=(.+)$/m)?.[1]?.replace(/^['"]|['"]$/g, "");
  assert.ok(token);
  for (const method of ["GET", "POST", "DELETE"]) {
    assert.equal((await fetch(`${base}/mcp`, { method })).status, 401);
  }
  assert.equal((await fetch(`${base}/mcp`, { headers: { Authorization: "Bearer wrong" } })).status, 401);
  assert.equal(
    (await fetch(`${base}/mcp`, { headers: { Authorization: `Bearer ${token}`, Origin: "https://evil.example" } }))
      .status,
    403,
  );
  const client = new Client({ name: "portfolio-test", version: "1.0.0" });
  assert.equal((await fetch(`${base}/mcp`, { headers: { Authorization: `Bearer ${token}` } })).status, 405);
  assert.equal(
    (
      await fetch(`${base}/mcp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: "x".repeat(16385),
      })
    ).status,
    413,
  );
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    }),
  );
  try {
    assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), ["get_theme", "set_theme"]);
    const changed = await client.callTool({ name: "set_theme", arguments: { hue: 240, chroma: 0.05 } });
    assert.ok(!changed.isError);
    assert.equal(changed.structuredContent.hue, 240);
    assert.ok(changed.structuredContent.updatedAt);
    for (const args of [
      { hue: 240, chroma: 0.2 },
      { hue: 21, chroma: 0, css: "red" },
      { hue: "21", chroma: 0 },
    ]) {
      const response = await client.callTool({ name: "set_theme", arguments: args });
      assert.equal(response.isError, true);
    }
    const current = await client.callTool({ name: "get_theme", arguments: {} });
    assert.equal(current.structuredContent.hue, 240);
    const theme = await fetch(`${base}/theme.json`);
    assert.equal(theme.headers.get("Cache-Control"), "public, max-age=60, s-maxage=300");
    assert.equal(theme.headers.get("Content-Type"), "application/json; charset=utf-8");
    assert.deepEqual(await theme.json(), { hue: 240, chroma: 0.05 });
    const head = await fetch(`${base}/theme.json`, { method: "HEAD" });
    assert.equal(await head.text(), "");
    assert.equal(head.headers.get("Cache-Control"), "public, max-age=60, s-maxage=300");
    const next = await client.callTool({ name: "set_theme", arguments: { hue: 120, chroma: 0.05 } });
    assert.ok(!next.isError);
    assert.equal((await client.callTool({ name: "get_theme", arguments: {} })).structuredContent.hue, 120);
    assert.deepEqual(await (await fetch(`${base}/theme.json?same-theme`)).json(), { hue: 240, chroma: 0.05 });
    assert.equal((await fetch(`${base}/`)).status, 200);
    assert.equal((await fetch(`${base}/works/katasu-me`)).status, 200);
    assert.equal((await fetch(`${base}/missing-page`)).status, 404);
  } finally {
    await client.callTool({ name: "set_theme", arguments: { hue: 21, chroma: 0.067 } });
    await client.close();
  }
});

test("ローカルWorkerの状態公開API・書き込み認証・公開MCP", { skip: !base }, async () => {
  const url = new URL(base);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "本番へのテスト書き込みは禁止");
  const vars = await fs.readFile(new URL("../.dev.vars", import.meta.url), "utf8");
  const token = vars.match(/^PORTFOLIO_MCP_TOKEN=(.+)$/m)?.[1]?.replace(/^['"]|['"]$/g, "");
  assert.ok(token);
  const put = (path, body, auth = token) =>
    fetch(`${base}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  const now = new Date().toISOString();
  const signals = {
    heartRate: { bpm: 88, observedAt: now },
    // 起床記録は時間帯によらず強い根拠になるため、実行時刻で結果が変わらない。
    sleep: { lastWakeAt: now, observedAt: now },
    spotify: { playing: false, observedAt: now },
    sentAt: now,
  };

  assert.equal((await put("/api/ruru/signals", signals, null)).status, 401);
  assert.equal((await put("/api/ruru/signals", signals, "wrong")).status, 401);
  assert.equal(
    (await put("/api/ruru/signals", { ...signals, discord: { active: true, observedAt: now } })).status,
    400,
  );
  assert.equal((await put("/api/ruru/signals", "{")).status, 400);
  assert.equal((await put("/api/ruru/signals", "x".repeat(4097))).status, 413);
  const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  assert.equal((await put("/api/ruru/signals", { ...signals, sentAt: future })).status, 400);
  assert.equal((await put("/api/ruru/signals", signals)).status, 204);

  const heartRate = await fetch(`${base}/api/heart-rate`, { headers: { Origin: "https://example.com" } });
  assert.equal(heartRate.headers.get("Access-Control-Allow-Origin"), "*");
  assert.deepEqual(await heartRate.json(), { bpm: 88, observedAt: now, stale: false });
  // 読み取りでキャッシュされた後でも、同じ拠点ではPUTした値がすぐ返る。
  assert.equal((await put("/api/ruru/signals", { ...signals, heartRate: { bpm: 70, observedAt: now } })).status, 204);
  assert.equal((await (await fetch(`${base}/api/heart-rate`)).json()).bpm, 70);
  assert.equal((await put("/api/ruru/signals", signals)).status, 204);
  const awake = await (await fetch(`${base}/api/awake`)).json();
  assert.equal(awake.awake, true);
  assert.equal(awake.confidence, "high");
  assert.equal(Object.keys(awake).sort().join(), "awake,confidence,evaluatedAt");

  const preflight = await fetch(`${base}/api/ruru/signals`, {
    method: "OPTIONS",
    headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "PUT" },
  });
  assert.ok(!preflight.headers.get("Access-Control-Allow-Methods")?.includes("PUT"));

  assert.equal((await fetch(`${base}/mcp/public`)).status, 405);
  const client = new Client({ name: "portfolio-public-test", version: "1.0.0" });
  // 認証なし・別Originからでも接続できることを確かめる。
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${base}/mcp/public`), {
      requestInit: { headers: { Origin: "https://example.com" } },
    }),
  );
  try {
    assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), ["get_heart_rate", "is_awake"]);
    assert.equal((await client.callTool({ name: "get_heart_rate", arguments: {} })).structuredContent.bpm, 88);
    assert.equal((await client.callTool({ name: "is_awake", arguments: {} })).structuredContent.awake, true);
  } finally {
    await client.close();
  }
});
