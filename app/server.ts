import { createApp } from "honox/server";
import { careerEntries, profile } from "./data/profile";
import { toAbsoluteUrl } from "./lib/site";
import { statusApiMarkdown } from "./lib/status-api-doc";
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
    "## API と MCP",
    `心拍数と、起きているかどうかの推定を公開しています。使い方は [API と MCP の説明](${toAbsoluteUrl("/api.md")}) を参照してください。`,
  ].join("\n\n");

  return c.body(`${markdown}\n`, 200, { "Content-Type": "text/markdown; charset=utf-8" });
});

app.get("/api.md", (c) => c.body(statusApiMarkdown(), 200, { "Content-Type": "text/markdown; charset=utf-8" }));

export default app;
