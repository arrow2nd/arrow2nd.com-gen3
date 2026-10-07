import { careerEntries } from "../../../data/profile";
import DashedHeading from "../../DashedHeading";
import styles from "./index.module.css";

function formatPeriod(yearMonth: string) {
  const [year, month] = yearMonth.split("-");

  return `${year}/${Number(month)}`;
}

export default function Career() {
  return (
    <>
      <DashedHeading as="h3">経歴</DashedHeading>
      <dl class={styles.root}>
        {careerEntries.map((entry) => (
          <div class={styles.item} key={entry.name}>
            <dt>
              <span class={styles.period}>
                <time datetime={entry.period.from}>{formatPeriod(entry.period.from)}</time>〜
                {entry.period.to && <time datetime={entry.period.to}>{formatPeriod(entry.period.to)}</time>}
              </span>
              <span class={styles.name}>{entry.name}</span>
            </dt>
            <dd class={styles.role}>{entry.role}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
