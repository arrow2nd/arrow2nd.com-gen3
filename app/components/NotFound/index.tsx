import BudouX from "../BudouX/budoux";
import Neko from "../Neko";
import styles from "./index.module.css";

export default function NotFound() {
  return (
    <main class={styles.main}>
      <div class={styles.root}>
        <Neko class={styles.neko} />
        <h1 class={styles.heading}>
          <span class={styles.status}>HTTP Status 404</span>
          <span class={styles.title}>NotFound</span>
        </h1>
        <div class={styles.description}>
          <p>
            <BudouX>ページが見つかりませんでした</BudouX>
          </p>
          <p class={styles.guide}>
            <BudouX>URLを確認するか、下のmenuからHomeへ戻ってみてください！</BudouX>
          </p>
        </div>
      </div>
    </main>
  );
}
