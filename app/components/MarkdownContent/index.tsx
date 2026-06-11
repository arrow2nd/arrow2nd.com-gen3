import type { FC, PropsWithChildren } from "hono/jsx";
import type { Work } from "../../lib/works";
import DashedHeading from "../DashedHeading";
import styles from "./index.module.css";

const heading =
  (as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"): FC =>
  ({ children }: PropsWithChildren) => <DashedHeading as={as}>{children}</DashedHeading>;

// MDX本文の見出しをDashedHeadingに差し替える
const components: Record<string, FC> = {
  h1: heading("h1"),
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  h5: heading("h5"),
  h6: heading("h6"),
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
