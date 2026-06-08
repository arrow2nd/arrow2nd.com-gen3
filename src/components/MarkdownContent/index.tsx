import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import DashedHeading from "../DashedHeading";
import styles from "./index.module.css";

const components: Components = {
  h1: ({ children }) => <DashedHeading as="h1">{children}</DashedHeading>,
  h2: ({ children }) => <DashedHeading as="h2">{children}</DashedHeading>,
  h3: ({ children }) => <DashedHeading as="h3">{children}</DashedHeading>,
  h4: ({ children }) => <DashedHeading as="h4">{children}</DashedHeading>,
  h5: ({ children }) => <DashedHeading as="h5">{children}</DashedHeading>,
  h6: ({ children }) => <DashedHeading as="h6">{children}</DashedHeading>,
};

type Props = {
  content: string;
};

export default function MarkdownContent({ content }: Props) {
  return (
    <div className={styles.root}>
      <Markdown components={components}>{content}</Markdown>
    </div>
  );
}
