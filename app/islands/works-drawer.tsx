import { useEffect, useRef } from "hono/jsx";
import styles from "./works-drawer.module.css";

const WORK_PATH_RE = /^\/works\/([^/]+)$/;

// ドラッグ確定までの遊び(px)
const DRAG_THRESHOLD = 8;
// 閉じる判定: 速度(px/ms) または ドロワー高さに対する移動量の割合
const CLOSE_VELOCITY = 0.4;
const CLOSE_DISTANCE_RATIO = 0.4;
// 速度計算に使うサンプルの有効期間(ms)。途中で止めて離した場合に古い速度で閉じないため
const VELOCITY_WINDOW_MS = 100;
// transitionend が取りこぼされた場合の保険(ms)
const CLOSE_FALLBACK_MS = 500;

type HydrateFn = (root: { querySelectorAll: Element["querySelectorAll"] }) => Promise<void>;

/**
 * 作品詳細ドロワー
 *
 * - `/` の作品リンクをクリック委譲で横取りし、pushState + fragment fetch で表示する
 * - 状態は持たず ref + 命令的DOMのみで動かす(innerHTML で挿入した内容を再レンダリングで消さないため)
 * - 閉じる操作は history.back() に集約し、popstate と双方向で同期する
 */
export default function WorksDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const inner = innerRef.current;

    if (!dialog || !inner) {
      return;
    }

    const fragmentCache = new Map<string, string>();

    let isOpen = false;
    // UI起点で閉じた時に history.back() 由来の popstate を無視するためのフラグ
    let closingViaUI = false;

    const setDragProgress = (progress: number) => {
      dialog.style.setProperty("--drag-progress", String(progress));
    };

    const fetchFragment = async (slug: string): Promise<string | null> => {
      const cached = fragmentCache.get(slug);

      if (cached) {
        return cached;
      }

      try {
        const res = await fetch(`/works/${slug}/fragment`);

        if (!res.ok) {
          return null;
        }

        const html = await res.text();
        fragmentCache.set(slug, html);

        return html;
      } catch {
        return null;
      }
    };

    const open = async (slug: string) => {
      const html = await fetchFragment(slug);

      if (html === null) {
        // fragment が取れない場合はフルページへフォールバック
        location.assign(`/works/${slug}`);
        return;
      }

      if (!dialog.open) {
        dialog.showModal();
      }

      document.body.style.overflow = "hidden";
      inner.innerHTML = html;
      inner.scrollTop = 0;

      // fragment 内の island(カルーセル等)を手動ハイドレーション
      // showModal 後でないと display:none 中の採寸が 0 になる
      const hydrate = (globalThis as Record<string, unknown>).__hydrateIslands as HydrateFn | undefined;
      await hydrate?.(inner);

      if (isOpen) {
        return;
      }

      isOpen = true;

      // 画面外 → 0 へスライドイン
      dialog.style.transition = "none";
      dialog.style.transform = "translateY(110%)";
      setDragProgress(1);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dialog.style.transition = "";
          dialog.style.transform = "translateY(0)";
          setDragProgress(0);
        });
      });
    };

    const closeWithAnimation = (viaUI: boolean) => {
      if (!isOpen) {
        return;
      }

      isOpen = false;

      let finished = false;

      const finish = () => {
        if (finished) {
          return;
        }

        finished = true;
        dialog.removeEventListener("transitionend", onTransitionEnd);
        dialog.close();
        document.body.style.overflow = "";
        dialog.style.transform = "";
        setDragProgress(0);
        inner.innerHTML = "";
      };

      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.target === dialog && e.propertyName === "transform") {
          finish();
        }
      };

      dialog.addEventListener("transitionend", onTransitionEnd);
      setTimeout(finish, CLOSE_FALLBACK_MS);

      dialog.style.transition = "";
      dialog.style.transform = "translateY(110%)";
      setDragProgress(1);

      if (viaUI) {
        closingViaUI = true;
        history.back();
      }
    };

    // --- 一覧リンクの横取り(プログレッシブエンハンスメント) ---

    const onDocumentClick = (e: MouseEvent) => {
      // 修飾キー・中クリック等はブラウザのデフォルト動作(新規タブ等)を尊重
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const anchor = (e.target as Element | null)?.closest?.('a[href^="/works/"]');

      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href") ?? "";
      const matched = href.match(WORK_PATH_RE);

      if (!matched) {
        return;
      }

      e.preventDefault();
      history.pushState({ drawer: true }, "", href);
      void open(matched[1]);
    };

    // --- 履歴との双方向同期 ---

    const onPopState = () => {
      if (closingViaUI) {
        closingViaUI = false;
        return;
      }

      const matched = location.pathname.match(WORK_PATH_RE);

      if (matched) {
        // フォワードで作品URLに戻ってきた
        void open(matched[1]);
      } else if (isOpen) {
        // ブラウザバック: 履歴は既に戻っているのでアニメーションだけ
        closeWithAnimation(false);
      }
    };

    // --- dialog 標準の閉じ操作を横取り ---

    const onCancel = (e: Event) => {
      e.preventDefault();
      closeWithAnimation(true);
    };

    const onDialogClick = (e: MouseEvent) => {
      // 子要素ではなく dialog 自体がターゲット = backdrop クリック
      if (e.target === dialog) {
        closeWithAnimation(true);
      }
    };

    // --- 追従ドラッグ ---

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
      if (!isOpen || e.button !== 0) {
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
      setDragProgress(Math.min(1, offset / dialog.offsetHeight));
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
        closeWithAnimation(true);
      } else {
        // スナップバック
        dialog.style.transform = "translateY(0)";
        setDragProgress(0);
      }
    };

    const onPointerCancel = () => {
      if (!tracking) {
        return;
      }

      stopTracking();
      dialog.style.transition = "";
      dialog.style.transform = "translateY(0)";
      setDragProgress(0);
    };

    document.addEventListener("click", onDocumentClick);
    window.addEventListener("popstate", onPopState);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("click", onDialogClick);
    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointermove", onPointerMove);
    dialog.addEventListener("pointerup", onPointerUp);
    dialog.addEventListener("pointercancel", onPointerCancel);

    return () => {
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("popstate", onPopState);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("click", onDialogClick);
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointermove", onPointerMove);
      dialog.removeEventListener("pointerup", onPointerUp);
      dialog.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <dialog ref={dialogRef} class={styles.content} aria-label="作品詳細">
      <div class={styles.handle} data-drawer-handle>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i.toString()} class={styles.handleDot} />
        ))}
      </div>
      <div ref={innerRef} class={styles.inner} />
    </dialog>
  );
}
