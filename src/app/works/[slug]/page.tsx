import Link from "next/link";
import { notFound } from "next/navigation";
import Carousel from "@/components/Carousel";
import MarkdownContent from "@/components/MarkdownContent";
import { getAllSlugs, getWorkBySlug } from "@/lib/works";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Link href={`/#${slug}`} className={styles.backButton}>
          <span className={styles.text}>もどる</span>
        </Link>
      </div>
      <Carousel images={work.images} alt={work.title} />
      <div className={styles.container}>
        <h1 className={styles.title}>{work.title}</h1>
        <p>#{work.category}</p>
        <MarkdownContent content={work.content} />
      </div>
    </div>
  );
}
