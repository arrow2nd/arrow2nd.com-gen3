import { notFound } from "next/navigation";
import MarkdownContent from "@/components/MarkdownContent";
import WorksDrawer from "@/components/WorksDrawer";
import { getWorkBySlug } from "@/lib/works";
import styles from "./page.module.css";

export default async function DrawerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  return (
    <WorksDrawer>
      <div className={styles.inner}>
        <div className={styles.carousel}>
          <img src={work.images[0]} alt={work.title} />
        </div>
        <div className={styles.container}>
          <h1 className={styles.title}>{work.title}</h1>
          <p>#{work.category}</p>
          <MarkdownContent content={work.content} />
        </div>
      </div>
    </WorksDrawer>
  );
}
