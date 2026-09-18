import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";

const url = process.env.RURU_COMMENT_PREVIEW_URL;
const run = promisify(execFile);

test("Ruruコメントの常時表示・モバイル表示", { skip: !url }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(url).hostname));
  const browser = async (...args) =>
    (
      await run("agent-browser", args, {
        env: { ...process.env, AGENT_BROWSER_SESSION: `ruru-comment-check-${process.pid}` },
        timeout: 30000,
      })
    ).stdout.trim();
  const evaluate = async (expression) => JSON.parse(await browser("eval", expression));
  try {
    await browser("open", url);
    for (const width of [1280, 390]) {
      await browser("set", "viewport", String(width), "844");
      assert.equal(
        await evaluate(`document.querySelector('aside[aria-label="Ruruのひとこと"]').innerText.includes("Ruru")`),
        true,
      );
      assert.equal(await evaluate('document.querySelector("dialog") === null'), true);
      assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true);
      assert.equal(await evaluate('document.querySelector("aside img").naturalWidth > 0'), true);
    }
  } finally {
    await browser("close");
  }
});
