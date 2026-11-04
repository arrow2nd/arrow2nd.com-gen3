import { useEffect, useState } from "hono/jsx";
import styles from "./index.module.css";

type HeartRateResponse = { bpm: number | null; stale: boolean };

async function fetchBpm() {
  try {
    const response = await fetch("/api/heart-rate");
    if (!response.ok) {
      return null;
    }

    const heartRate: HeartRateResponse = await response.json();
    // 古い値は今の心拍数として出さない
    return heartRate.stale ? null : heartRate.bpm;
  } catch {
    return null;
  }
}

export default function HeartRate() {
  // undefined は取得中、null は取得できなかった
  const [bpm, setBpm] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    fetchBpm().then(setBpm);
  }, []);

  // 1拍の長さを心拍数から求め拍動の周期に
  const beatStyle = bpm == null ? undefined : { "--beat-duration": `${60 / bpm}s` };

  return (
    <p class={styles.root} data-visible={String(bpm !== undefined)}>
      <svg
        class={styles.heart}
        data-beating={String(bpm != null)}
        style={beatStyle}
        viewBox="0 0 24 24"
        role="img"
        aria-label="心拍数"
      >
        <path d="M12 21s-7.5-4.6-10-9.4C.4 8.4 2.2 4.5 6 4.5c2.3 0 3.7 1.3 6 3.6 2.3-2.3 3.7-3.6 6-3.6 3.8 0 5.6 3.9 4 7.1C19.5 16.4 12 21 12 21Z" />
      </svg>
      <span class={styles.bpm}>{bpm ?? "--"}</span>
      <span class={styles.unit}>bpm</span>
    </p>
  );
}
