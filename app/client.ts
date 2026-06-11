import { createClient } from "honox/client";

// グローバルCSSもclient.ts経由で集約する(プレーンCSSのimportはtree-shakeされない)
import "./styles/reset.css";
import "./styles/globals.css";

// フォント(next/font の代替)。unicode-range 分割済みのためサブセット作業は不要
import "@fontsource/ibm-plex-sans-jp/400.css";
import "@fontsource/ibm-plex-sans-jp/500.css";
import "@fontsource/ibm-plex-sans-jp/600.css";
import "@fontsource/poppins/500.css";

// サーバー専用コンポーネントが import した CSS Modules を
// クライアントのモジュールグラフに乗せるための一括 import
// dev: Vite が <style> 注入 / prod: client ビルドの CSS アセットに集約
const cssModules = import.meta.glob("./**/*.module.css", { eager: true });

// Vite は CSS Modules の export が未使用だと CSS ごと tree-shake するため、参照を残す
(globalThis as Record<string, unknown>).__cssModules = cssModules;

createClient({
  triggerHydration: async (hydrate) => {
    // fragment を動的挿入するドロワーから島を再ハイドレーションできるよう退避
    // (<honox-island> は customElement ではないため、挿入後の自動ハイドレーションは無い)
    (globalThis as Record<string, unknown>).__hydrateIslands = hydrate;
    await hydrate(document);
  },
});
