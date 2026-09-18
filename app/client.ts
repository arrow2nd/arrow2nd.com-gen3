import { createClient } from "honox/client";
import { parseThemeInput } from "../shared/theme-input";

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

async function refreshTheme() {
  try {
    const response = await fetch("/theme.json");
    if (!response.ok) {
      return;
    }

    const theme = parseThemeInput(await response.json());
    if (!theme) {
      return;
    }

    // 保存色があるページでは、取得した最新色は次のページから使う。
    const style = document.documentElement.style;
    if (!style.getPropertyValue("--color-base")) {
      style.setProperty("--color-base", `oklch(40% ${theme.chroma} ${theme.hue})`);
    }

    localStorage.setItem("theme", JSON.stringify(theme));
  } catch {
    // 通信や保存が失敗しても、表示中の配色を維持する。
  }
}

if (import.meta.env.PROD) {
  // 初期色からのトランジションのため、更新前に描画の機会を挟む。
  requestAnimationFrame(() => requestAnimationFrame(refreshTheme));
}

createClient();
