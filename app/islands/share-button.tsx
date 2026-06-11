import { useState } from "hono/jsx";
import styles from "./share-button.module.css";

const COPIED_RESET_MS = 2000;

type Props = {
  title: string;
  // 正規URLのパス(/works/:slug)。絶対URLはクライアント側で組み立てる
  path: string;
};

export default function ShareButton({ title, path }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${location.origin}${path}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // ユーザーによるキャンセルは無視
      }

      return;
    }

    // Web Share API 非対応時はクリップボードへ
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  return (
    <button type="button" class={styles.root} onClick={share}>
      {copied ? "コピーしました" : "シェア"}
    </button>
  );
}
