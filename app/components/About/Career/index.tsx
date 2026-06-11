import DashedHeading from "../../DashedHeading";
import styles from "./index.module.css";

type CareerEntry = {
  period: {
    from: string;
    to?: string;
  };
  name: string;
  role: string;
};

const entries: CareerEntry[] = [
  {
    period: {
      from: "2020-04",
      to: "2023-03",
    },
    name: "神戸電子専門学校",
    role: "エンターテインメントソフト学科",
  },
  {
    period: {
      from: "2023-04",
      to: "2024-08",
    },
    name: "株式会社jig.jp",
    role: "エンジニア (Webフロントエンド)",
  },
  {
    period: {
      from: "2024-09",
    },
    name: "ちょっと株式会社 (chot Inc.)",
    role: "Webエンジニア",
  },
];

function formatPeriod(yearMonth: string) {
  const [year, month] = yearMonth.split("-");

  return `${year}/${Number(month)}`;
}

export default function Career() {
  return (
    <>
      <DashedHeading as="h3">経歴</DashedHeading>
      <dl class={styles.root}>
        {entries.map((entry) => (
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
