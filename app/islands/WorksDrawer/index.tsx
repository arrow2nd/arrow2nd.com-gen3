import { useEffect, useRef } from "hono/jsx";
import { createController } from "./controller";
import { setupDrag } from "./drag";
import { setupHistory } from "./history";
import styles from "./index.module.css";

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

    const controller = createController(dialog, inner);
    const cleanups = [controller.setupDialog(), setupHistory(controller), setupDrag(dialog, inner, controller)];

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
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
