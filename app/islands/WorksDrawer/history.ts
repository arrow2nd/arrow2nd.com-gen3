import { type Controller, WORK_PATH_RE } from "./controller";

/**
 * 履歴との双方向同期。
 *
 * - 一覧リンクをクリック委譲で横取りして pushState + open する(プログレッシブエンハンスメント)
 * - popstate でフォワード(open) / ブラウザバック(closeWithAnimation) を反映する
 */
export const setupHistory = (controller: Controller) => {
  // --- 一覧リンクの横取り(プログレッシブエンハンスメント) ---

  const onDocumentClick = (e: MouseEvent) => {
    // 修飾キーや中クリック等は、ブラウザのデフォルト動作(新規タブ等)を尊重する
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
    void controller.open(matched[1]);
  };

  // --- 履歴との双方向同期 ---

  const onPopState = () => {
    if (controller.isClosingViaUI()) {
      controller.consumeClosingViaUI();
      return;
    }

    const matched = location.pathname.match(WORK_PATH_RE);

    if (matched) {
      // フォワードで作品 URL に戻ってきた
      void controller.open(matched[1]);
    } else if (controller.isOpen()) {
      // ブラウザバック。履歴はもう戻っているので、アニメーションだけ動かす
      controller.closeWithAnimation(false);
    }
  };

  document.addEventListener("click", onDocumentClick);
  window.addEventListener("popstate", onPopState);

  return () => {
    document.removeEventListener("click", onDocumentClick);
    window.removeEventListener("popstate", onPopState);
  };
};
