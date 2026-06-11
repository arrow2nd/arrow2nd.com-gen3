import build from "@hono/vite-build/cloudflare-workers";
import mdx from "@mdx-js/rollup";
import honox from "honox/vite";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

// SSG は scripts/build-ssg.mjs が dist/index.js(SSRバンドル)を toSSG に通して生成する。
// @hono/vite-ssg は内部の ssrLoadModule が CSS Modules の transform で壊れるため使わない。
export default defineConfig(({ mode }) => ({
  build: {
    // 全CSS(グローバル + CSS Modules)を1ファイルに集約し、
    // AppCss の manifest["style.css"] 解決1本でブラウザに届ける
    cssCodeSplit: false,
    // SSRビルド(2段目)で clientビルドの成果物(dist/static, manifest)を消さない
    emptyOutDir: mode === "client",
  },
  plugins: [
    // honox の島変換より先に MDX → JSX 変換を通す
    {
      enforce: "pre",
      ...mdx({ jsxImportSource: "hono/jsx", remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }),
    },
    honox(),
    build(),
  ],
}));
