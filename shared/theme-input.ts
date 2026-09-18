// 描画前の復元スクリプトにも埋め込むため、外部の変数や関数に依存させない。
export function parseThemeInput(input: unknown): { hue: number; chroma: number } | null {
  if (!input || typeof input !== "object" || !("hue" in input) || !("chroma" in input)) return null;
  const { hue, chroma } = input;
  if (
    typeof hue !== "number" ||
    !Number.isFinite(hue) ||
    hue < 0 ||
    hue >= 360 ||
    typeof chroma !== "number" ||
    !Number.isFinite(chroma) ||
    chroma < 0 ||
    chroma > 0.067
  )
    return null;
  return { hue, chroma };
}
