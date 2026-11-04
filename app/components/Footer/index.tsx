import styles from "./index.module.css";

export default function Footer() {
  // SSG なのでビルド時の年で固定される(年が変わったら再ビルドで更新する想定)
  const year = new Date().getFullYear();

  return <footer class={styles.root}>© {year} arrow2nd</footer>;
}
