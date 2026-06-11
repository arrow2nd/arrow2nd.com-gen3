import BudouX from "../BudouX/budoux";
import DashedHeading from "../DashedHeading";
import Career from "./Career";
import styles from "./index.module.css";

export default function About() {
  return (
    <section class={styles.root}>
      <h2 class={styles.heading}>about</h2>

      <div class={styles.section}>
        <DashedHeading as="h3">これ好き</DashedHeading>
        <p class={styles.text}>シャニマス / ARIA / 上伊那ぼたん / 薬袋カルテ</p>
      </div>

      <div class={styles.section}>
        <DashedHeading as="h3">これも好き</DashedHeading>
        <p class={styles.text}>フレデリック / 花奏かのん / 長瀬有花 / somunia / Aiobahn / 中村さんそ / VALIS</p>
      </div>

      <div class={styles.section}>
        <DashedHeading as="h3">よく使う技術</DashedHeading>
        <p class={styles.text}>JavaScript / TypeScript / Golang / React / Next.js / GitHub Actions / Playwright</p>
      </div>

      <div class={styles.section}>
        <DashedHeading as="h3">やりたいこと</DashedHeading>
        <ul class={styles.list}>
          <li>
            <BudouX>触り心地のいいUIを考え実装すること</BudouX>
          </li>
          <li>
            <BudouX>インターネットカルチャーと技術が交わるところで何かつくること</BudouX>
          </li>
        </ul>
      </div>

      <div class={styles.section}>
        <Career />
      </div>
    </section>
  );
}
