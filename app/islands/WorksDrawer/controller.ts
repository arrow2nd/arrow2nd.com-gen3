export const WORK_PATH_RE = /^\/works\/([^/]+)$/;

// transitionend を取りこぼした場合の保険(ms)
const CLOSE_FALLBACK_MS = 500;

type HydrateFn = (root: { querySelectorAll: Element["querySelectorAll"] }) => Promise<void>;

/**
 * ドロワーの状態(isOpen / closingViaUI)と開閉処理をまとめて管理する。
 *
 * - 生の let は外に出さず、アクセサ/メソッド経由でのみ公開する
 * - dialog が「どう閉じられても」状態が壊れないよう、後始末は close イベントに集約する
 */
export const createController = (dialog: HTMLDialogElement, inner: HTMLDivElement) => {
  const fragmentCache = new Map<string, string>();

  let isOpen = false;
  // UI 起点で閉じたとき、history.back() 由来の popstate を無視するためのフラグ
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
      // fragment が取れなかったらフルページへフォールバックする
      location.assign(`/works/${slug}`);
      return;
    }

    const firstOpen = !isOpen;

    if (firstOpen) {
      // data-state 未設定 = CSS の「閉じ」状態(画面外)のまま表示する。
      // 後続の await が描画の機会を作るので、ここで開き状態にしてしまうと
      // 最終位置のドロワーが数フレーム見えてチラついてしまう
      dialog.style.transition = "none";
      setDragProgress(1);
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = "hidden";
    inner.innerHTML = html;
    inner.scrollTop = 0;

    // fragment 内の island(カルーセル等)を手動でハイドレーションする。
    // showModal の後でないと、display:none 中は採寸が 0 になってしまう
    // (translateY で画面外に出ているだけならレイアウトは生きているので採寸できる)
    const hydrate = (globalThis as Record<string, unknown>).__hydrateIslands as HydrateFn | undefined;
    await hydrate?.(inner);

    // await の最中に閉じられた場合は、ここで中断する。
    // そのまま続けて isOpen を立ててしまうと、次の open() が firstOpen=false と判定して
    // 開き状態への遷移がスキップされ、画面外でスタックしてしまう
    if (!dialog.open) {
      return;
    }

    if (!firstOpen) {
      return;
    }

    isOpen = true;

    // CSS の「閉じ」状態 → 「開き」状態へ遷移(スライドイン + scale/blur の解除)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // rAF が発火する前に Esc のネイティブ close 等で閉じられた場合、閉じた dialog に
        // data-state="open" を付けると、次の open 時に最終位置で表示されてチラついてしまうので中断する
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
      // 後始末は close イベントハンドラ(onDialogClose)に集約してある
      dialog.close();
    };

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === dialog && e.propertyName === "transform") {
        finish();
      }
    };

    dialog.addEventListener("transitionend", onTransitionEnd);
    setTimeout(finish, CLOSE_FALLBACK_MS);

    // CSS の「閉じ」状態へ遷移する。ドラッグ中ならインラインの transform を外して、
    // 今の位置からアニメーションさせる
    dialog.style.transition = "";
    dialog.style.transform = "";
    delete dialog.dataset.state;
    setDragProgress(1);

    if (viaUI) {
      closingViaUI = true;
      history.back();
    }
  };

  // dialog が「どう閉じられても」状態が壊れないよう、後始末は close イベントに集約する。
  // cancel の preventDefault は CloseWatcher の仕様で無視されることがあり
  // (user activation の無い Esc や連続 Esc など)、ネイティブの即時 close は完全には防げない
  const onDialogClose = () => {
    document.body.style.overflow = "";
    dialog.style.transform = "";
    delete dialog.dataset.state;
    setDragProgress(0);
    inner.innerHTML = "";
    isOpen = false;

    // closingViaUI が立っている = closeWithAnimation が back() を発行済み(popstate はまだ未処理)。
    // Esc のネイティブ close だと cancel → closeWithAnimation(back 1回目) → 即 close がほぼ同時に来るので、
    // この時点では location.pathname がまだ /works/:slug のまま(back() は非同期なので)。
    // フラグを見ずに pathname だけで判定すると、古い URL を見て二重に back() してしまい2段戻ってしまう
    if (!closingViaUI && WORK_PATH_RE.test(location.pathname)) {
      // closeWithAnimation を通らずに閉じられた場合(開ききる前の close も含む)の履歴同期
      closingViaUI = true;
      history.back();
    }
  };

  // --- dialog 標準の閉じ操作を横取りする ---

  const onCancel = (e: Event) => {
    e.preventDefault();
    closeWithAnimation(true);
  };

  const onDialogClick = (e: MouseEvent) => {
    // 子要素ではなく dialog 自体がターゲット = backdrop のクリック
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
    // popstate 側で、UI 起点の back() 由来かどうかを判定するためのアクセサ
    isClosingViaUI: () => closingViaUI,
    consumeClosingViaUI: () => {
      closingViaUI = false;
    },
  };
};

export type Controller = ReturnType<typeof createController>;
