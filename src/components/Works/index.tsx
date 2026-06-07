import DashedHeading from "../DashedHeading";
import Card from "./Card";
import styles from "./index.module.css";

export default function Works() {
  return (
    <section className={styles.root}>
      <h2 className={styles.heading}>works</h2>

      <div className={styles.section}>
        <DashedHeading as="h3" lang="en">
          web
        </DashedHeading>
        <div className={styles.cards}>
          <Card />
          <Card />
        </div>
      </div>

      <div className={styles.section}>
        <DashedHeading as="h3" lang="en">
          tool
        </DashedHeading>
        <div className={styles.cards}>
          <Card />
          <Card />
        </div>
      </div>

      <div className={styles.section}>
        <DashedHeading as="h3" lang="en">
          game
        </DashedHeading>
        <div className={styles.cards}>
          <Card />
          <Card />
        </div>
      </div>

      <div className={styles.section}>
        <DashedHeading as="h3" lang="en">
          sticker
        </DashedHeading>
        <div className={styles.cards}>
          <Card />
          <Card />
        </div>
      </div>
    </section>
  );
}
