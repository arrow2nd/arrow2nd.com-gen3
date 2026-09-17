import Carousel from "../../islands/Carousel";
import type { Work } from "../../lib/works";
import MarkdownContent from "../MarkdownContent";
import styles from "./index.module.css";

type Props = {
  work: Work;
};

export default function WorkDetail({ work }: Props) {
  return (
    <main class={styles.root}>
      <div class={styles.gallery}>
        <div class={styles.carousel}>
          <Carousel images={work.images} alt={work.title} />
        </div>
        <div class={styles.images}>
          {work.images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${work.title} (${i + 1}/${work.images.length})`}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
      </div>
      <div class={styles.container}>
        <h1 class={styles.title}>{work.title}</h1>
        <p class={styles.category}>#{work.category}</p>
        <MarkdownContent Content={work.Content} />
      </div>
    </main>
  );
}
