import type { Controller } from "./controller";

// ドラッグ確定までの遊び(px)
const DRAG_THRESHOLD = 8;
// 閉じる判定: 速度(px/ms) または ドロワー高さに対する移動量の割合
const CLOSE_VELOCITY = 0.4;
const CLOSE_DISTANCE_RATIO = 0.4;
// 速度計算に使うサンプルの有効期間(ms)。途中で止めて離した場合に古い速度で閉じないため
const VELOCITY_WINDOW_MS = 100;

/**
 * 追従ドラッグ。
 *
 * 下方向に DRAG_THRESHOLD を超え、かつ(ハンドル起点 or 内側スクロールが先頭)のときだけ
 * ドラッグを確定し、ドロワーを指に追従させる。離した時の velocity / 移動量で閉じるか戻すかを決める。
 */
export const setupDrag = (dialog: HTMLDialogElement, inner: HTMLDivElement, controller: Controller) => {
  let tracking = false;
  let dragging = false;
  let dragPointerId: number | null = null;
  let dragStartY = 0;
  let startedOnHandle = false;
  let samples: { t: number; y: number }[] = [];

  const onTouchMove = (e: TouchEvent) => {
    // ドラッグ確定中のみネイティブスクロールを抑止(非passiveで登録)
    if (dragging) {
      e.preventDefault();
    }
  };

  const stopTracking = () => {
    tracking = false;
    dragging = false;
    dragPointerId = null;
    document.removeEventListener("touchmove", onTouchMove);
    inner.style.overflow = "";
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!controller.isOpen() || e.button !== 0) {
      return;
    }

    tracking = true;
    dragging = false;
    dragPointerId = e.pointerId;
    dragStartY = e.clientY;
    startedOnHandle = !!(e.target as Element | null)?.closest?.("[data-drawer-handle]");
    samples = [{ t: e.timeStamp, y: e.clientY }];

    document.addEventListener("touchmove", onTouchMove, { passive: false });
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== dragPointerId) {
      return;
    }

    const dy = e.clientY - dragStartY;

    samples.push({ t: e.timeStamp, y: e.clientY });
    if (samples.length > 8) {
      samples.shift();
    }

    if (!dragging) {
      // 下方向 + (ハンドル起点 or 内側スクロールが先頭) のときだけドラッグ確定
      if (dy > DRAG_THRESHOLD && (startedOnHandle || inner.scrollTop <= 0)) {
        dragging = true;
        dialog.setPointerCapture(e.pointerId);
        dialog.style.transition = "none";
        // ドラッグ中は内側スクロールを止めて取り合いを防ぐ
        inner.style.overflow = "hidden";
      } else if (dy < -DRAG_THRESHOLD) {
        // 上方向は内側スクロールに委譲
        stopTracking();
      }

      return;
    }

    const offset = Math.max(0, dy);
    dialog.style.transform = `translateY(${offset}px)`;
    controller.setDragProgress(Math.min(1, offset / dialog.offsetHeight));
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== dragPointerId) {
      return;
    }

    const wasDragging = dragging;
    stopTracking();

    if (!wasDragging) {
      return;
    }

    dialog.style.transition = "";

    const dy = Math.max(0, e.clientY - dragStartY);
    // 直近のサンプルだけで速度を出す(ドラッグを止めてから離した場合は velocity 0 扱い)
    const recent = samples.filter((s) => e.timeStamp - s.t < VELOCITY_WINDOW_MS);
    const newest = recent[recent.length - 1];
    const oldest = recent[0];
    const dt = newest && oldest ? newest.t - oldest.t : 0;
    const velocity = dt > 0 ? (newest.y - oldest.y) / dt : 0;

    if (velocity > CLOSE_VELOCITY || dy > dialog.offsetHeight * CLOSE_DISTANCE_RATIO) {
      controller.closeWithAnimation(true);
    } else {
      // スナップバック(インラインを外して data-state="open" の位置へ戻す)
      dialog.style.transform = "";
      controller.setDragProgress(0);
    }
  };

  const onPointerCancel = () => {
    if (!tracking) {
      return;
    }

    stopTracking();
    dialog.style.transition = "";
    dialog.style.transform = "";
    controller.setDragProgress(0);
  };

  dialog.addEventListener("pointerdown", onPointerDown);
  dialog.addEventListener("pointermove", onPointerMove);
  dialog.addEventListener("pointerup", onPointerUp);
  dialog.addEventListener("pointercancel", onPointerCancel);

  return () => {
    dialog.removeEventListener("pointerdown", onPointerDown);
    dialog.removeEventListener("pointermove", onPointerMove);
    dialog.removeEventListener("pointerup", onPointerUp);
    dialog.removeEventListener("pointercancel", onPointerCancel);
    document.removeEventListener("touchmove", onTouchMove);
  };
};
