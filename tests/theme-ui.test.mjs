import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);
const dist = path.resolve("dist");

test("配色JSONの遅延・保存・失敗・色の補間・動きを減らす設定", { skip: !process.env.THEME_UI_TEST }, async () => {
  let fail = false;
  let hue = 240;
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/theme.json") {
      setTimeout(() => {
        response.writeHead(fail ? 503 : 200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        response.end(fail ? "" : JSON.stringify({ hue, chroma: 0.05 }));
      }, 1000);
      return;
    }
    const filename = path.resolve(dist, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!filename.startsWith(`${dist}${path.sep}`)) {
      response.writeHead(404).end();
      return;
    }
    try {
      let content = await readFile(filename);
      const type = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" }[
        path.extname(filename)
      ];
      if (type === "text/html") {
        // 取得前の描画と途中色を、ブラウザの実際のフレームから観測する。
        content = content.toString().replace(
          "<head>",
          `<head><script>
          window.themeSamples = [];
          const sample = () => {
            window.themeSamples.push(getComputedStyle(document.documentElement).getPropertyValue('--color-base').trim());
            if (performance.now() < 5000) requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        </script>`,
        );
      }
      response.writeHead(200, { "Content-Type": type ?? "application/octet-stream" });
      response.end(content);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = async (...args) =>
    (
      await run("agent-browser", args, {
        env: { ...process.env, AGENT_BROWSER_SESSION: `theme-check-${process.pid}` },
        timeout: 30000,
      })
    ).stdout.trim();
  const evaluate = async (expression) => JSON.parse(await browser("eval", expression));
  try {
    await browser("open", url);
    await browser(
      "wait",
      "--fn",
      'getComputedStyle(document.documentElement).getPropertyValue("--color-base").trim() === "oklch(0.4 0.05 240)"',
    );
    const observed = await evaluate(`({
      colors: [...new Set(window.themeSamples)].filter(Boolean),
      paint: performance.getEntriesByName('first-contentful-paint')[0].startTime,
      responseEnd: performance.getEntriesByType('resource').find(entry => entry.name.endsWith('/theme.json')).responseEnd
    })`);
    assert.ok(observed.paint < observed.responseEnd, "配色JSONの取得完了前に本文を描画する");
    assert.ok(observed.colors.includes("oklch(0.4 0.067 21)"));
    assert.ok(observed.colors.length > 2, "途中色を補間する");
    hue = 120;
    await browser("open", `${url}works/ruru-ai.html`);
    await browser("wait", "--fn", 'JSON.parse(localStorage.getItem("theme"))?.hue === 120');
    assert.deepEqual(await evaluate("[...new Set(window.themeSamples)].filter(Boolean)"), ["oklch(0.4 0.05 240)"]);
    hue = "21); color: red; </script><script>window.injected = true</script>";
    await browser("open", `${url}?invalid-response`);
    await browser("wait", "1500");
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("theme")).hue'), 120);
    assert.deepEqual(await evaluate("[...new Set(window.themeSamples)].filter(Boolean)"), ["oklch(0.4 0.05 120)"]);
    assert.equal(await evaluate("Boolean(window.injected)"), false);
    await evaluate(`localStorage.setItem("theme", JSON.stringify({ hue: ${JSON.stringify(hue)}, chroma: 0.05 }))`);
    await browser("open", `${url}?invalid-storage`);
    await browser("wait", "1500");
    assert.deepEqual(await evaluate("[...new Set(window.themeSamples)].filter(Boolean)"), ["oklch(0.4 0.067 21)"]);
    assert.equal(await evaluate("Boolean(window.injected)"), false);
    await evaluate('localStorage.setItem("theme", JSON.stringify({ hue: 120, chroma: 0.05 }))');
    fail = true;
    await browser("open", `${url}?cached-failure`);
    await browser("wait", "1500");
    assert.deepEqual(await evaluate("[...new Set(window.themeSamples)].filter(Boolean)"), ["oklch(0.4 0.05 120)"]);
    await evaluate('localStorage.setItem("theme", "invalid-color")');
    await browser("open", `${url}?failure`);
    await browser("wait", "1500");
    assert.equal(
      await evaluate('getComputedStyle(document.documentElement).getPropertyValue("--color-base").trim()'),
      "oklch(0.4 0.067 21)",
    );
    fail = false;
    hue = 240;
    await evaluate('localStorage.removeItem("theme")');
    await browser("set", "media", "light", "reduced-motion");
    await browser("open", `${url}?reduced`);
    await browser(
      "wait",
      "--fn",
      'getComputedStyle(document.documentElement).getPropertyValue("--color-base").trim() === "oklch(0.4 0.05 240)"',
    );
    assert.equal(await evaluate("getComputedStyle(document.documentElement).transitionDuration"), "0s");
    const colors = await evaluate("[...new Set(window.themeSamples)].filter(Boolean)");
    assert.ok(colors.every((color) => ["oklch(0.4 0.067 21)", "oklch(0.4 0.05 240)"].includes(color)));
  } finally {
    await browser("close");
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
