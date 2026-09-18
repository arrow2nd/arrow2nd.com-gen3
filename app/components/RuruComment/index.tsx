import styles from "./index.module.css";

type Props = { text: string };

export default function RuruComment({ text }: Props) {
  return (
    <aside class={styles.root} aria-label="Ruruのひとこと">
      <img src="/ruru.png" alt="" width="44" height="44" class={styles.avatar} />
      <div class={styles.message}>
        <p class={styles.name}>Ruru</p>
        <p class={styles.bubble}>{text}</p>
      </div>
    </aside>
  );
}
