// 本番ビルドで集約CSSアセットを<link>で出力する
// cssCodeSplit:false の場合、全CSSはmanifestの "style.css" キーに単一ファイルとして載る
// honoxの<Script>はCSSを一切リンクしないため自作が必要
type Manifest = Record<string, { file: string; css?: string[] }>;

export default function AppCss() {
  if (!import.meta.env.PROD) {
    // dev: Viteがclient.tsのモジュールグラフ経由で<style>を注入するので不要
    return null;
  }

  const manifests = import.meta.glob<{ default: Manifest }>("/dist/.vite/manifest.json", {
    eager: true,
  });

  const manifest = Object.values(manifests)[0]?.default;
  const file = manifest?.["style.css"]?.file;

  if (!file) {
    return null;
  }

  return <link rel="stylesheet" href={`/${file}`} />;
}
