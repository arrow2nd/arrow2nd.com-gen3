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
