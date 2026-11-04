import { HEART_RATE_STALE_AFTER_MS } from "../../shared/owner-status";
import { toAbsoluteUrl } from "./site";

const hours = (ms: number) => ms / 60 / 60 / 1000;

// staleになるまでの時間は実装の定数から埋め込み、説明と実装の食い違いを防ぐ。
export function statusApiMarkdown() {
  const mcpUrl = toAbsoluteUrl("/mcp/public");

  return `# 俺 API & 俺 Remote MCP Server

arrow2nd の最新の心拍数と、起きているかどうかの推定をパブリックAPI & Remote MCP サーバーで公開しています。

- 認証は不要です。どのオリジンからも読めます（\`Access-Control-Allow-Origin: *\`）
- 計測から公開まで、数時間の遅れが出ることがあります
- 応答は最大30秒キャッシュされます

## REST API

### GET ${toAbsoluteUrl("/api/heart-rate")}

最新の心拍数を返します。

\`\`\`json
{ "bpm": 72, "observedAt": "2026-11-04T18:44:42+09:00", "stale": false }
\`\`\`

- \`bpm\`: 心拍数。まだ届いていない場合は \`null\`
- \`observedAt\`: 計測した時刻（ISO 8601）。まだ届いていない場合は \`null\`
- \`stale\`: 計測から${hours(HEART_RATE_STALE_AFTER_MS)}時間を超えていると \`true\`

### GET ${toAbsoluteUrl("/api/awake")}

起きているかどうかの推定を返します。

\`\`\`json
{ "awake": true, "confidence": "low", "evaluatedAt": "2026-11-04T10:16:53.420Z" }
\`\`\`

- \`awake\`: 起きていれば \`true\`、寝ていれば \`false\`、判断できなければ \`null\`
- \`confidence\`: 推定の強さ（\`high\` / \`low\`）。\`awake\` が \`null\` のときは \`null\`
- \`evaluatedAt\`: 推定した時刻

### エラー

- \`503\`: 一時的にデータを読めません。時間をおいて再試行してください

## MCP

読み取り専用の MCP サーバーを Streamable HTTP で公開しています。認証は不要です。

- URL: ${mcpUrl}
- ツール
  - \`get_heart_rate\`: \`GET /api/heart-rate\` と同じ内容を返します
  - \`is_awake\`: \`GET /api/awake\` と同じ内容を返します

Claude Code では次のコマンドで追加できます。

\`\`\`sh
claude mcp add --transport http arrow2nd-status ${mcpUrl}
\`\`\`
`;
}
