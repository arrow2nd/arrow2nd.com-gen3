import type { FC, JSX, PropsWithChildren } from "hono/jsx";
import type { Work } from "../../lib/works";
import DashedHeading from "../DashedHeading";
import styles from "./index.module.css";

const heading =
  (as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"): FC =>
  ({ children }: PropsWithChildren) => <DashedHeading as={as}>{children}</DashedHeading>;

// 「・」マーカー付きリスト。ネストした ul も MDX が同じコンポーネントに置換するため自動で揃う
const list: FC<JSX.IntrinsicElements["ul"]> = (props) => <ul {...props} class={styles.list} />;

// 下線付きリンク。href 等の属性は MDX から渡るものをそのまま透過させる
const link: FC<JSX.IntrinsicElements["a"]> = (props) => <a {...props} target="_blank" class={styles.link} />;

// MDX本文の各要素をサイトのスタイルに差し替える
const components: Record<string, FC> = {
  h1: heading("h1"),
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  h5: heading("h5"),
  h6: heading("h6"),
  ul: list,
  a: link,
};

type Props = {
  Content: Work["Content"];
};

export default function MarkdownContent({ Content }: Props) {
  return (
    <div class={styles.root}>
      <Content components={components} />
    </div>
  );
}
