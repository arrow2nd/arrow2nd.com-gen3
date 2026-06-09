import styles from "./index.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return <footer className={styles.root}>(c) {year} arrow2nd</footer>;
}
