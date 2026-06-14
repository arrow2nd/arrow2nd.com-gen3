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
      <img src={thumbnail} alt={`${title} ${shortDescription}`} />
    </a>
  );
}
