import BudouX from "../BudouX/budoux";
import styles from "./index.module.css";
import Neko from "../Neko";

export default function Meishi() {
  return (
    <section id="home" class={styles.root}>
      <Neko class={styles.neko} />
      <h1 class={styles.heading}>
        <span class={styles.greeting}>はじめまして、</span>
        <span>
          <span class={styles.name}>arrow2nd</span>
          <span class={styles.suffix}>です。</span>
        </span>
      </h1>
      <div class={styles.description}>
        <p>
          <BudouX>フロントエンドエンジニア</BudouX>
        </p>
        <p class={styles.hobby}>
          <BudouX>触りたくなるデザインと、</BudouX>
          <br />
          <BudouX>やさしいインターネットと、</BudouX>
          <br />
          <BudouX>口中の水分が全部持っていかれる食べ物がすき</BudouX>
        </p>
      </div>
    </section>
  );
}
