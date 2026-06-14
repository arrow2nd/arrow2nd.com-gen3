import { createClient } from "honox/client";

// グローバル CSS も client.ts 経由で集約する(プレーン CSS の import は tree-shake されないので)
import "./styles/reset.css";
import "./styles/globals.css";

// フォント(next/font の代わり)。unicode-range で分割済みなのでサブセット作業は要らない
import "@fontsource/ibm-plex-sans-jp/400.css";
import "@fontsource/ibm-plex-sans-jp/500.css";
import "@fontsource/ibm-plex-sans-jp/600.css";
import "@fontsource/poppins/500.css";

// サーバー専用コンポーネントが import した CSS Modules を、
// クライアントのモジュールグラフに乗せるための一括 import。
// dev は Vite が <style> を注入し、prod は client ビルドの CSS アセットに集約される
const cssModules = import.meta.glob("./**/*.module.css", { eager: true });

// HACK: Vite は CSS Modules の export が未使用だと CSS ごと tree-shake してしまうので、参照だけ残しておく
(globalThis as Record<string, unknown>).__cssModules = cssModules;

createClient({
  triggerHydration: async (hydrate) => {
    // HACK:
    // fragment を動的挿入するドロワーから島を再ハイドレーションできるよう退避しておく。
    // (<honox-island> は customElement ではないので、挿入しても自動ではハイドレーションされない)
    (globalThis as Record<string, unknown>).__hydrateIslands = hydrate;
    await hydrate(document);
  },
});
