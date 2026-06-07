import About from "@/components/About";
import Meishi from "@/components/Meishi";
import Works from "@/components/Works";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <Meishi />
      <About />
      <Works />
    </main>
  );
}
