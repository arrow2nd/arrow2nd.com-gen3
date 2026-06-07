import type { PropsWithChildren } from "react";
import styles from "./index.module.css";

type Lang = "ja" | "en";

type Props = PropsWithChildren<{
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  lang?: Lang;
}>;

export default function DashedHeading({
  as: Tag = "h2",
  lang = "ja",
  children,
}: Props) {
  return (
    <Tag className={`${styles.root} ${styles[lang]}`}>{children}</Tag>
  );
}
