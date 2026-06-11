import Carousel from "../../islands/carousel";
import type { Work } from "../../lib/works";
import MarkdownContent from "../MarkdownContent";
import styles from "./index.module.css";

type Props = {
  work: Work;
};

// 作品詳細の中身。フルページ(/works/:slug)とドロワー(fragment)で共有する
export default function WorkDetail({ work }: Props) {
  return (
    <>
      <Carousel images={work.images} alt={work.title} />
      <div class={styles.container}>
        <h1 class={styles.title}>{work.title}</h1>
        <p class={styles.category}>#{work.category}</p>
        <MarkdownContent Content={work.Content} />
      </div>
    </>
  );
}
