import { z } from "zod";

export const themeInputSchema = z.strictObject({
  hue: z.number().min(0).lt(360),
  chroma: z.number().min(0).max(0.067),
});
export const themeSchema = themeInputSchema.extend({ updatedAt: z.iso.datetime().nullable() });
export type Theme = z.infer<typeof themeSchema>;
export const DEFAULT_THEME: Theme = { hue: 21, chroma: 0.067, updatedAt: null };

// CSS Color 4の変換式。色域外を拒否してブラウザごとのgamut mappingに依存しない。
export function linearRgb(lightness: number, chroma: number, hue: number) {
  const angle = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(angle);
  const b = chroma * Math.sin(angle);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function contrast(foreground: number[], background: number[]) {
  const luminance = (rgb: number[]) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

export function assertContrast(foreground: number[], background: number[], minimum: number, name: string) {
  const ratio = contrast(foreground, background);
  if (ratio < minimum) {
    throw new Error(`${name}のコントラストが${ratio.toFixed(2)}:1です。${minimum}:1以上が必要です。`);
  }
}

export function validateTheme(input: unknown) {
  const theme = themeInputSchema.parse(input);
  const color = (lightness: number) => linearRgb(lightness, (theme.chroma * (1 - lightness)) / 0.6, theme.hue);
  const background = color(0.998);
  const text = color(0.55);
  const heading = color(0.4);
  const border = color(0.82);
  const hover = heading.map((value, i) => {
    // 半透明ホバー背景はCSSと同じsRGB上で合成してから輝度を計算する。
    const encode = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
    const mixed = encode(value) * 0.06 + encode(background[i]) * 0.94;
    return mixed <= 0.04045 ? mixed / 12.92 : ((mixed + 0.055) / 1.055) ** 2.4;
  });
  if ([background, text, heading, border].flat().some((value) => value < 0 || value > 1)) {
    throw new Error("sRGBの色域外の配色は使用できません。");
  }
  for (const [name, foreground, surface, minimum] of [
    ["本文・カテゴリラベル", text, background, 4.5],
    ["見出し・ボタン文字", heading, background, 4.5],
    ["メニューのホバー文字", heading, hover, 4.5],
    ["選択・フォーカス表示", heading, background, 3],
  ] as const) {
    assertContrast(foreground, surface, minimum, name);
  }
  return theme;
}

export function parseStoredTheme(input: unknown): Theme {
  const theme = themeSchema.parse(input);
  validateTheme({ hue: theme.hue, chroma: theme.chroma });
  return theme;
}

export function themeCss(theme: Theme) {
  return `:root { --color-base: oklch(40% ${theme.chroma} ${theme.hue}); }\n`;
}
