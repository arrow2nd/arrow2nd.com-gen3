import { createApp } from "honox/server";
import { careerEntries, profile } from "./data/profile";
import { toAbsoluteUrl } from "./lib/site";
import { getAllWorksByCategory } from "./lib/works";

const app = createApp();

// HonoXのファイルルートは末尾の.mdを除去するため、URLを明示して登録する。
app.get("/index.md", (c) => {
  const markdown = [
    `# ${profile.name}`,
    profile.jobTitle,
    profile.interests.join(""),
    ...profile.about.flatMap(({ title, text }) => [`## ${title}`, text]),
    "## やりたいこと",
    profile.goals.map((goal) => `- ${goal}`).join("\n"),
    "## 経歴",
    careerEntries
      .map(({ period, name, role }) => `- ${period.from}〜${period.to ?? "現在"}: ${name} / ${role}`)
      .join("\n"),
    "## 作品",
    ...Array.from(getAllWorksByCategory(), ([category, works]) => [
      `### ${category}`,
      works
        .map((work) => `- [${work.title}](${toAbsoluteUrl(`/works/${work.slug}.md`)}): ${work.shortDescription}`)
        .join("\n"),
    ]).flat(),
  ].join("\n\n");

  return c.body(`${markdown}\n`, 200, { "Content-Type": "text/markdown; charset=utf-8" });
});

// llms.txtの書式(https://llmstxt.org/)に従い、エージェントへの案内とMarkdown版への入口を示す。
app.get("/llms.txt", (c) => {
  const text = [
    `# ${profile.name}`,
    `> ${profile.jobTitle}の${profile.name}のポートフォリオ`,
    "## When to use",
    `${profile.name}のことが気になったらいつでもみにきてね`,
    "## Pages",
    [
      `- [プロフィールと作品一覧](${toAbsoluteUrl("/index.md")})`,
      `- [サイトマップ](${toAbsoluteUrl("/sitemap.xml")})`,
    ].join("\n"),
  ].join("\n\n");

  return c.body(`${text}\n`, 200, { "Content-Type": "text/plain; charset=utf-8" });
});

export default app;
