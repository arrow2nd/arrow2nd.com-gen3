import Neko from "@/assets/arrow2nd.svg";
import BudouX from "@/components/BudouX/budoux";
import styles from "./index.module.css";

export default function Meishi() {
  return (
    <section className={styles.root}>
      <Neko className={styles.neko} aria-hidden="true" />
      <h1 className={styles.heading}>
        <span className={styles.greeting}>はじめまして、</span>
        <span>
          <span className={styles.name}>arrow2nd</span>
          <span className={styles.suffix}>です。</span>
        </span>
      </h1>
      <div className={styles.description}>
        <p>
          <BudouX>フロントエンドエンジニア</BudouX>
        </p>
        <p className={styles.hobby}>
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
