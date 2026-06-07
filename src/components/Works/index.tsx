import { getAllWorksByCategory } from "@/lib/works";
import DashedHeading from "../DashedHeading";
import Card from "./Card";
import styles from "./index.module.css";

export default function Works() {
  const worksByCategory = getAllWorksByCategory();

  return (
    <section className={styles.root}>
      <h2 className={styles.heading}>works</h2>

      {Array.from(worksByCategory.entries()).map(([category, works]) => (
        <div key={category} className={styles.section}>
          <DashedHeading as="h3" lang="en">
            {category}
          </DashedHeading>
          <div className={styles.cards}>
            {works.map((work) => (
              <Card
                key={work.slug}
                slug={work.slug}
                title={work.title}
                thumbnail={work.images[0]}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
