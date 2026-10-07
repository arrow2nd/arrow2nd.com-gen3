import { profile } from "../../data/profile";
import BudouX from "../BudouX/budoux";
import Neko from "../Neko";
import styles from "./index.module.css";

export default function Meishi() {
  return (
    <section id="home" class={styles.root}>
      <Neko class={styles.neko} />
      <h1 class={styles.heading}>
        <span class={styles.greeting}>はじめまして、</span>
        <span>
          <span class={styles.name}>{profile.name}</span>
          <span class={styles.suffix}>です。</span>
        </span>
      </h1>
      <div class={styles.description}>
        <p>
          <BudouX>{profile.jobTitle}</BudouX>
        </p>
        <p class={styles.hobby}>
          <BudouX>{profile.interests[0]}</BudouX>
          <br />
          <BudouX>{profile.interests[1]}</BudouX>
          <br />
          <BudouX>{profile.interests[2]}</BudouX>
        </p>
      </div>
    </section>
  );
}
