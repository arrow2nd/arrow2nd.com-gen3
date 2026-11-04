import assert from "node:assert/strict";
import test from "node:test";
import { assertNotFuture, evaluateAwake, publicHeartRate, signalsSchema } from "../shared/owner-status.ts";

// 昼の14:00(JST)と夜の03:00(JST)を基準にする。
const noon = new Date("2026-11-04T05:00:00Z");
const night = new Date("2026-11-04T18:00:00Z");
const ago = (now, minutes) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

function signals(now, overrides = {}) {
  return {
    heartRate: null,
    sleep: null,
    spotify: { playing: false, observedAt: ago(now, 1) },
    sentAt: ago(now, 1),
    ...overrides,
  };
}

test("契約どおりのシグナルだけを受け付ける", () => {
  const valid = signals(noon, { heartRate: { bpm: 72, observedAt: "2026-11-04T14:00:00+09:00" } });
  assert.deepEqual(signalsSchema.parse(valid), valid);
  for (const invalid of [
    { ...valid, location: { atHome: true } },
    { ...valid, heartRate: { bpm: 19, observedAt: valid.sentAt } },
    { ...valid, heartRate: { bpm: 72.5, observedAt: valid.sentAt } },
    { ...valid, spotify: { playing: true, track: "song", observedAt: valid.sentAt } },
    { ...valid, sentAt: "2026-11-04 14:00" },
    { ...valid, sentAt: undefined },
    // 廃止した項目は未知のキーとして拒否する。
    { ...valid, discord: { active: true, observedAt: valid.sentAt } },
  ]) {
    assert.equal(signalsSchema.safeParse(invalid).success, false);
  }
});

test("Ruruとの時計のずれを超える未来の時刻を拒否する", () => {
  assert.doesNotThrow(() => assertNotFuture(signals(noon, { sentAt: ago(noon, -4) }), noon));
  assert.throws(() => assertNotFuture(signals(noon, { sentAt: ago(noon, -6) }), noon));
  assert.throws(() => assertNotFuture(signals(noon, { heartRate: { bpm: 60, observedAt: ago(noon, -60) } }), noon));
});

test("心拍は30分を過ぎるとstaleになる", () => {
  assert.deepEqual(publicHeartRate(null, noon), { bpm: null, observedAt: null, stale: true });
  const fresh = { bpm: 80, observedAt: ago(noon, 30) };
  assert.deepEqual(publicHeartRate(signals(noon, { heartRate: fresh }), noon), { ...fresh, stale: false });
  const old = { bpm: 80, observedAt: ago(noon, 31) };
  assert.equal(publicHeartRate(signals(noon, { heartRate: old }), noon).stale, true);
});

test("Ruruから45分以上届いていなければ判断しない", () => {
  assert.deepEqual(evaluateAwake(null, noon), { awake: null, confidence: null, evaluatedAt: noon.toISOString() });
  const stopped = signals(noon, { sentAt: ago(noon, 46), spotify: { playing: true, observedAt: ago(noon, 46) } });
  assert.equal(evaluateAwake(stopped, noon).awake, null);
});

test("日中の再生は起きている強い根拠になる", () => {
  const day = signals(noon, { spotify: { playing: true, observedAt: ago(noon, 1) } });
  assert.equal(evaluateAwake(day, noon).confidence, "high");
});

test("寝るときに音楽を流す場合があるため、夜の再生は弱い根拠にする", () => {
  const playing = signals(night, { spotify: { playing: true, observedAt: ago(night, 1) } });
  assert.deepEqual(evaluateAwake(playing, night), { awake: true, confidence: "low", evaluatedAt: night.toISOString() });
});

test("3時間以内の起床記録は起きている根拠になる", () => {
  const woke = signals(noon, { sleep: { lastWakeAt: ago(noon, 180), observedAt: ago(noon, 5) } });
  assert.equal(evaluateAwake(woke, noon).confidence, "high");
  const longAgo = signals(noon, { sleep: { lastWakeAt: ago(noon, 181), observedAt: ago(noon, 5) } });
  assert.equal(evaluateAwake(longAgo, noon).awake, null);
});

test("心拍だけで判断する場合は弱い根拠にする", () => {
  const high = signals(noon, { heartRate: { bpm: 75, observedAt: ago(noon, 5) } });
  assert.deepEqual(evaluateAwake(high, noon), { awake: true, confidence: "low", evaluatedAt: noon.toISOString() });
  const resting = signals(night, { heartRate: { bpm: 55, observedAt: ago(night, 5) } });
  assert.deepEqual(evaluateAwake(resting, night), {
    awake: false,
    confidence: "low",
    evaluatedAt: night.toISOString(),
  });
  // 古い心拍は根拠にしない。
  const stale = signals(noon, { heartRate: { bpm: 90, observedAt: ago(noon, 31) } });
  assert.equal(evaluateAwake(stale, noon).awake, null);
});

test("夜に活動がなければ心拍がなくても寝ていると推定し、日中は判断しない", () => {
  assert.equal(evaluateAwake(signals(night), night).awake, false);
  assert.equal(evaluateAwake(signals(noon), noon).awake, null);
  const middle = signals(night, { heartRate: { bpm: 65, observedAt: ago(night, 5) } });
  assert.equal(evaluateAwake(middle, night).awake, null);
});
