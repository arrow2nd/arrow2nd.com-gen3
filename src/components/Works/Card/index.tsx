import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  slug: string;
  title: string;
  thumbnail: string;
};

export default function Card({ slug, title, thumbnail }: Props) {
  return (
    <Link id={slug} href={`/works/${slug}`} className={styles.root}>
      <img src={thumbnail} alt={title} />
    </Link>
  );
}
