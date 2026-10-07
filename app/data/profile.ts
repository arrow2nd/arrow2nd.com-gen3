export const profile = {
  name: "arrow2nd",
  jobTitle: "フロントエンドエンジニア",
  interests: ["触りたくなるデザインと、", "やさしいインターネットと、", "口中の水分が全部持っていかれる食べ物がすき"],
  about: [
    { title: "これ好き", text: "シャニマス / ARIA / 上伊那ぼたん / 薬袋カルテ" },
    {
      title: "これも好き",
      text: "フレデリック / 花奏かのん / 長瀬有花 / somunia / Aiobahn / 中村さんそ / KMNZ / VALIS",
    },
    { title: "よく使う技術", text: "TypeScript / Golang / React" },
  ],
  goals: [
    "ストレスがなく手触りのよいWebサイト・アプリをつくること",
    "インターネットカルチャーと技術が交わるところで何かつくること",
  ],
};

type CareerEntry = {
  period: {
    from: string;
    to?: string;
  };
  name: string;
  role: string;
};

export const careerEntries: CareerEntry[] = [
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
