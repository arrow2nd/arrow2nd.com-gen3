import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {
  assertContrast,
  contrast,
  DEFAULT_THEME,
  linearRgb,
  parseStoredTheme,
  validateTheme,
} from "../shared/theme.ts";

test("配色の輝度計算と入力検証がCSSの生成規則に一致する", async () => {
  assert.equal(contrast([0, 0, 0], [1, 1, 1]), 21);
  assert.equal(contrast([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), 1);
  assert.throws(() => assertContrast([0.19, 0.19, 0.19], [1, 1, 1], 4.5, "本文"), /コントラスト/);
  assert.doesNotThrow(() => assertContrast([0.18, 0.18, 0.18], [1, 1, 1], 4.5, "本文"));
  assert.ok(linearRgb(0.5, 0, 0).every((value) => Math.abs(value - 0.125) < 1e-8));
  assert.deepEqual(parseStoredTheme(DEFAULT_THEME), DEFAULT_THEME);
  for (let hue = 0; hue < 360; hue++) {
    for (const chroma of [0, 0.0335, 0.067]) assert.doesNotThrow(() => validateTheme({ hue, chroma }));
  }
  for (const input of [
    { hue: 360, chroma: 0 },
    { hue: -1, chroma: 0 },
    { hue: 21, chroma: 0.2 },
    { hue: "21", chroma: 0 },
    { hue: Number.NaN, chroma: 0 },
    { hue: 21, chroma: 0, css: "red" },
  ])
    assert.throws(() => validateTheme(input));
  assert.throws(() => parseStoredTheme({ ...DEFAULT_THEME, updatedAt: "yesterday" }));
  const css = await fs.readFile(new URL("../app/styles/globals.css", import.meta.url), "utf8");
  for (const value of ["99.8", "82", "55", "40"]) {
    assert.ok(
      css.includes(
        `--color-${{ 99.8: "50", 82: "200", 55: "500", 40: "700" }[value]}: oklch(from var(--color-base) ${value}% calc(c * (100 - ${value}) / 60) h)`,
      ),
    );
  }
});
