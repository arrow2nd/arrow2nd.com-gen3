export type ImageSize = {
  width: number;
  height: number;
};

// scripts/build-images.mjs が生成する。Git管理外なので、無い状態でも型検査が通るよう glob で読む
const generated = import.meta.glob<Record<string, ImageSize>>("../generated/image-sizes.json", {
  eager: true,
  import: "default",
});
const sizes = Object.values(generated)[0] ?? {};

// 読み込み前から表示領域を確保するため、<img> に渡す元画像の寸法を返す
export function getImageSize(src: string): ImageSize {
  const size = sizes[src];

  if (!size) {
    throw new Error(`画像の寸法がありません: ${src}`);
  }

  return size;
}
