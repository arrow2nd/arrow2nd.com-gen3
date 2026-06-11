import styles from "./index.module.css";

export default function Footer() {
  // SSGのためビルド時の年で固定される(年次の再ビルドで更新される想定)
  const year = new Date().getFullYear();

  return <footer class={styles.root}>(c) {year} arrow2nd</footer>;
}
