import { getImageSize } from "../../../lib/image-sizes";
import styles from "./index.module.css";

type Props = {
  slug: string;
  title: string;
  shortDescription: string;
  thumbnail: string;
};

export default function Card({ slug, title, shortDescription, thumbnail }: Props) {
  return (
    <a id={slug} href={`/works/${slug}`} class={styles.root}>
      {/* 作品一覧は最初の画面に入らないので、近づくまで読み込まない */}
      <img src={thumbnail} alt={`${title} ${shortDescription}`} {...getImageSize(thumbnail)} loading="lazy" />
    </a>
  );
}
