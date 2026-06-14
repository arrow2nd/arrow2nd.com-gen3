// 本番ビルドで、集約した CSS アセットを <link> で出力する。
// cssCodeSplit:false だと全 CSS が manifest の "style.css" キーに単一ファイルとして載る。
// honox の <Script> は CSS を一切リンクしてくれないので、自作するしかない
type Manifest = Record<string, { file: string; css?: string[] }>;

export default function AppCss() {
  if (!import.meta.env.PROD) {
    // dev は Vite が client.ts のモジュールグラフ経由で <style> を注入してくれるので不要
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
