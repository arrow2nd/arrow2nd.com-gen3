export const WORK_PATH_RE = /^\/works\/([^/]+)$/;

// transitionend が取りこぼされた場合の保険(ms)
const CLOSE_FALLBACK_MS = 500;

type HydrateFn = (root: { querySelectorAll: Element["querySelectorAll"] }) => Promise<void>;

/**
 * ドロワーの状態(isOpen / closingViaUI)と開閉処理を一元管理する。
 *
 * - 状態は生の let を外へ出さず、アクセサ/メソッド経由でのみ公開する
 * - dialog が「どう閉じられても」状態が壊れないように、後始末は close イベントに集約する
 */
export const createController = (dialog: HTMLDialogElement, inner: HTMLDivElement) => {
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

    const firstOpen = !isOpen;

    if (firstOpen) {
      // data-state 未設定 = CSSの「閉じ」状態(画面外)のまま表示する。
      // 後続の await が描画機会を生むため、ここで開き状態にすると
      // 最終位置のドロワーが数フレーム見えてチラつく
      dialog.style.transition = "none";
      setDragProgress(1);
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = "hidden";
    inner.innerHTML = html;
    inner.scrollTop = 0;

    // fragment 内の island(カルーセル等)を手動ハイドレーション
    // showModal 後でないと display:none 中の採寸が 0 になる
    // (translateY で画面外でもレイアウトは生きているので採寸できる)
    const hydrate = (globalThis as Record<string, unknown>).__hydrateIslands as HydrateFn | undefined;
    await hydrate?.(inner);

    // await中に閉じられた場合はここで中断する。
    // 続行して isOpen を立てると、次回 open() が firstOpen=false 判定になり
    // 開き状態への遷移がスキップされて画面外でスタックする
    if (!dialog.open) {
      return;
    }

    if (!firstOpen) {
      return;
    }

    isOpen = true;

    // CSSの「閉じ」状態 → 「開き」状態へ遷移(スライドイン + scale/blur 解除)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // rAF発火前にEscのネイティブclose等で閉じられた場合、閉じたdialogに
        // data-state="open"を付けると次回open時に最終位置で表示されチラつくため中断する
        if (!isOpen || !dialog.open) {
          return;
        }

        dialog.style.transition = "";
        dialog.style.transform = "";
        dialog.dataset.state = "open";
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
      // 後始末は close イベントハンドラ(onDialogClose)に集約されている
      dialog.close();
    };

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === dialog && e.propertyName === "transform") {
        finish();
      }
    };

    dialog.addEventListener("transitionend", onTransitionEnd);
    setTimeout(finish, CLOSE_FALLBACK_MS);

    // CSSの「閉じ」状態へ遷移。ドラッグ中ならインラインのtransformを外し、
    // 現在位置からアニメーションさせる
    dialog.style.transition = "";
    dialog.style.transform = "";
    delete dialog.dataset.state;
    setDragProgress(1);

    if (viaUI) {
      closingViaUI = true;
      history.back();
    }
  };

  // dialog が「どう閉じられても」状態が壊れないように、後始末は close イベントに集約する。
  // cancel の preventDefault は CloseWatcher 仕様により無視されることがあり
  // (user activation の無い Esc、連続 Esc 等)、ネイティブの即時 close を完全には防げない
  const onDialogClose = () => {
    document.body.style.overflow = "";
    dialog.style.transform = "";
    delete dialog.dataset.state;
    setDragProgress(0);
    inner.innerHTML = "";
    isOpen = false;

    // closingViaUI が立っている = closeWithAnimation が back() 発行済み(popstate 未処理)。
    // Esc のネイティブ close では cancel → closeWithAnimation(back 1回目) → 即 close がほぼ同時に来るため、
    // この時点では location.pathname が /works/:slug のまま(back() は非同期)。
    // フラグを見ずに pathname だけで判定すると古い URL を見て二重に back() し2段戻ってしまう
    if (!closingViaUI && WORK_PATH_RE.test(location.pathname)) {
      // closeWithAnimation を経ずに閉じられた場合(開ききる前の close 含む)の履歴同期
      closingViaUI = true;
      history.back();
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

  const setupDialog = () => {
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onDialogClose);
    dialog.addEventListener("click", onDialogClick);

    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onDialogClose);
      dialog.removeEventListener("click", onDialogClick);
    };
  };

  return {
    open,
    closeWithAnimation,
    setDragProgress,
    setupDialog,
    isOpen: () => isOpen,
    // popstate 側が UI 起点の back() 由来かを判定するためのアクセサ
    isClosingViaUI: () => closingViaUI,
    consumeClosingViaUI: () => {
      closingViaUI = false;
    },
  };
};

export type Controller = ReturnType<typeof createController>;
