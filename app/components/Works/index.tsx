import { getAllWorksByCategory } from "../../lib/works";
import DashedHeading from "../DashedHeading";
import Card from "./Card";
import styles from "./index.module.css";

export default function Works() {
  const worksByCategory = getAllWorksByCategory();

  return (
    <section class={styles.root}>
      <h2 class={styles.heading}>works</h2>

      {Array.from(worksByCategory.entries()).map(([category, works]) => (
        <div key={category} class={styles.section}>
          <DashedHeading as="h3" lang="en">
            {category}
          </DashedHeading>
          <div class={styles.cards}>
            {works.map((work) => (
              <Card key={work.slug} slug={work.slug} title={work.title} thumbnail={work.images[0]} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
