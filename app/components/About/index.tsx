import { profile } from "../../data/profile";
import BudouX from "../BudouX/budoux";
import DashedHeading from "../DashedHeading";
import Career from "./Career";
import styles from "./index.module.css";

export default function About() {
  return (
    <section id="about" class={styles.root}>
      <h2 class={styles.heading}>about</h2>

      <div class={styles.sections}>
        {profile.about.map(({ title, text }) => (
          <div class={styles.section} key={title}>
            <DashedHeading as="h3">{title}</DashedHeading>
            <p class={styles.text}>{text}</p>
          </div>
        ))}

        <div class={styles.section}>
          <DashedHeading as="h3">やりたいこと</DashedHeading>
          <ul class={styles.list}>
            {profile.goals.map((goal) => (
              <li key={goal}>
                <BudouX>{goal}</BudouX>
              </li>
            ))}
          </ul>
        </div>

        <div class={styles.section}>
          <Career />
        </div>
      </div>
    </section>
  );
}
