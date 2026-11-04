import { z } from "zod";

// Ruruから受け取る公開用シグナル。在宅かどうかを推測できる情報は契約に含めない。
const timestamp = z.iso.datetime({ offset: true });

export const signalsSchema = z.strictObject({
  heartRate: z.strictObject({ bpm: z.int().min(20).max(300), observedAt: timestamp }).nullable(),
  sleep: z.strictObject({ lastWakeAt: timestamp, observedAt: timestamp }).nullable(),
  sentAt: timestamp,
});
export type Signals = z.infer<typeof signalsSchema>;

const MINUTE = 60 * 1000;
// Ruruは変化がなくても15分ごとに送る。3回分届かなければRuruの停止とみなす。
const SIGNALS_STALE_AFTER_MS = 45 * MINUTE;
export const HEART_RATE_STALE_AFTER_MS = 30 * MINUTE;
// Ruruとの時計のずれを許容する上限。これより未来の時刻は不正な入力として拒否する。
const MAX_CLOCK_SKEW_MS = 5 * MINUTE;
const RECENT_WAKE_MS = 3 * 60 * MINUTE;
// オーナーの記録では、心拍がこれ未満のときは寝ていることが多い。時間帯は問わない。
const AWAKE_MIN_BPM = 66;

export function assertNotFuture(signals: Signals, now: Date) {
  const times = [signals.sentAt, signals.heartRate?.observedAt, signals.sleep?.lastWakeAt, signals.sleep?.observedAt];
  if (times.some((time) => time !== undefined && Date.parse(time) - now.getTime() > MAX_CLOCK_SKEW_MS)) {
    throw new Error("未来の時刻を含むシグナルは受け付けません。");
  }
}

type HeartRate = { bpm: number | null; observedAt: string | null; stale: boolean };

export function publicHeartRate(signals: Signals | null, now: Date): HeartRate {
  const heartRate = signals?.heartRate;
  if (!heartRate) {
    return { bpm: null, observedAt: null, stale: true };
  }
  return { ...heartRate, stale: now.getTime() - Date.parse(heartRate.observedAt) > HEART_RATE_STALE_AFTER_MS };
}

type Awake = { awake: boolean | null; confidence: "high" | "low" | null; evaluatedAt: string };

// 判定の根拠は返さない。根拠から送っていない情報(起床時刻等)が推測できてしまうため。
export function evaluateAwake(signals: Signals | null, now: Date): Awake {
  const evaluatedAt = now.toISOString();
  const result = (awake: boolean | null, confidence: Awake["confidence"]): Awake => ({
    awake,
    confidence: awake === null ? null : confidence,
    evaluatedAt,
  });

  if (!signals || now.getTime() - Date.parse(signals.sentAt) > SIGNALS_STALE_AFTER_MS) {
    return result(null, null);
  }

  // 睡眠記録は起床後にまとめて書き込まれるため、記録の終了時刻は起きた根拠になる。
  if (signals.sleep && now.getTime() - Date.parse(signals.sleep.lastWakeAt) <= RECENT_WAKE_MS) {
    return result(true, "high");
  }

  const heartRate = publicHeartRate(signals, now);
  const bpm = heartRate.stale ? null : heartRate.bpm;
  if (bpm !== null) {
    return result(bpm >= AWAKE_MIN_BPM, "low");
  }
  return result(null, null);
}
