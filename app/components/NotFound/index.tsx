import styles from "./index.module.css";

export default function NotFound() {
  return (
    <main class={styles.root}>
      <h1 class={styles.heading}>404</h1>
      <p>ページが見つかりませんでした</p>
      <a href="/" class={styles.backLink}>
        トップへもどる
      </a>
    </main>
  );
}
