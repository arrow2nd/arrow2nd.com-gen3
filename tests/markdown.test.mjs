import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { careerEntries, profile } from "../app/data/profile.ts";
import { prefersMarkdown } from "../worker/markdown.ts";

test("Markdownの明示指定とAcceptの優先度を尊重する", () => {
  for (const [header, expected] of [
    [null, false],
    ["*/*", false],
    ["text/*", false],
    ["text/html", false],
    ["text/markdown", true],
    ["TEXT/MARKDOWN; Q=1", true],
    ["text/markdown;q=0", false],
    ["text/markdown;q=0, */*", false],
    ["text/markdown;q=0.5, text/html", false],
    ["text/html, text/markdown", true],
    ["text/markdown;q=0.5, text/*;q=0.8", false],
    ["text/markdown;q=0.5, text/html;q=0, */*", true],
    ["text/markdown;q=0.5, */*", false],
  ])
    assert.equal(prefersMarkdown(header), expected, String(header));
});

const base = process.env.PORTFOLIO_TEST_URL;

test("トップのMarkdownに共通プロフィールと全作品へのリンクを含める", { skip: !base }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
  const direct = await fetch(`${base}/index.md`);
  assert.equal(direct.status, 200);
  assert.equal(direct.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  const markdown = await direct.text();
  for (const value of [
    profile.name,
    profile.jobTitle,
    ...profile.about.map(({ text }) => text),
    ...profile.goals,
    ...careerEntries.map(({ name }) => name),
  ]) {
    assert.ok(markdown.includes(value), value);
  }
  for await (const source of fs.glob("app/data/works/*/*/index.mdx")) {
    const slug = source.split("/").at(-2);
    assert.ok(markdown.includes(`https://arrow2nd.com/works/${slug}.md`), slug);
    assert.equal(await fs.readFile(`dist/works/${slug}.md`, "utf8"), await fs.readFile(source, "utf8"));
  }
  const negotiated = await fetch(`${base}/?from=test`, { headers: { Accept: "text/markdown" } });
  assert.equal(negotiated.status, 200);
  assert.match(negotiated.headers.get("Vary"), /Accept/i);
  assert.equal(await negotiated.text(), markdown);
  const head = await fetch(`${base}/`, { method: "HEAD", headers: { Accept: "text/markdown" } });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.equal(await head.text(), "");
  const html = await fetch(`${base}/`, { headers: { Accept: "text/html" } });
  assert.match(html.headers.get("Content-Type"), /text\/html/);
  assert.match(html.headers.get("Vary"), /Accept/i);
  assert.match(await html.text(), /rel="alternate" type="text\/markdown" href="https:\/\/arrow2nd.com\/index.md"/);
});

test("静的Markdownとヘッダー指定の本文がMDX原文に一致する", { skip: !base }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
  const source = await fs.readFile(new URL("../app/data/works/tool/nekome/index.mdx", import.meta.url), "utf8");
  for (const path of ["/works/nekome.md", "/works/nekome", "/works/nekome/?from=test"]) {
    const response = await fetch(`${base}${path}`, { headers: { Accept: "text/markdown" } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
    assert.equal(await response.text(), source);
    if (!path.endsWith(".md")) assert.match(response.headers.get("Vary"), /Accept/i);
    const head = await fetch(`${base}${path}`, { method: "HEAD", headers: { Accept: "text/markdown" } });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assert.equal(head.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  }
  for (const accept of ["text/html", "*/*", "text/markdown;q=0", "text/markdown;q=0.5, text/html"]) {
    const response = await fetch(`${base}/works/nekome`, { headers: { Accept: accept } });
    assert.match(response.headers.get("Content-Type"), /text\/html/);
    assert.match(response.headers.get("Vary"), /Accept/i);
    assert.match(await response.text(), /rel="alternate" type="text\/markdown"/);
  }
  for (const path of ["/works/missing-work", "/works/missing-work.md"]) {
    assert.equal((await fetch(`${base}${path}`, { headers: { Accept: "text/markdown" } })).status, 404);
  }
});
