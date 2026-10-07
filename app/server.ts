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

export default app;
