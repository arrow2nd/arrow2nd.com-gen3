import { useEffect, useRef, useState } from "hono/jsx";
import { CATEGORY_ORDER } from "../../lib/categories";
import {
  AboutIcon,
  ContactIcon,
  GameIcon,
  GitHubIcon,
  HomeIcon,
  MailIcon,
  StickerIcon,
  ToolIcon,
  WebIcon,
  WorksIcon,
  XIcon,
} from "./icons";
import styles from "./index.module.css";
import { setupSectionObserver } from "./observer";

type SectionId = "home" | "about" | "works" | "contact";
type PopupId = "works" | "contact";

// 扇の半径(px)。ピル中央を原点に各ボタンを配置する。
// 72px ボタンが隣と重ならないよう、中心間距離 2*R*sin(20°) ≧ ボタン径+隙間 を満たす値にしている
const RADIUS = 117;

// 4ボタンの配置角度(度, 0=右 / 90=上)。左→右に Home/About/Works/Contact を並べる。
// 座標はモジュールスコープで事前計算し、CSS 変数で各ボタンへ渡す。
const ITEMS = [
  { id: "home", angle: 150, label: "Home" },
  { id: "about", angle: 110, label: "About" },
  { id: "works", angle: 70, label: "Works" },
  { id: "contact", angle: 30, label: "Contact" },
].map((item, i) => ({
  ...item,
  id: item.id as SectionId,
  i,
  tx: Math.cos((item.angle * Math.PI) / 180) * RADIUS,
  ty: -Math.sin((item.angle * Math.PI) / 180) * RADIUS,
}));

const CONTACT_LINKS = [
  { label: "X", href: "https://x.com/_arrow2nd", external: true, Icon: XIcon },
  { label: "GitHub", href: "https://github.com/arrow2nd", external: true, Icon: GitHubIcon },
  { label: "Mail", href: "mailto:contact@arrow2nd.com", external: false, Icon: MailIcon },
] as const;

const CATEGORY_ICONS = {
  web: WebIcon,
  tool: ToolIcon,
  game: GameIcon,
  sticker: StickerIcon,
} as const;

const NAV_ICONS = {
  home: HomeIcon,
  about: AboutIcon,
  works: WorksIcon,
  contact: ContactIcon,
} as const;

export default function BottomMenu() {
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState<PopupId | null>(null);
  const [active, setActive] = useState<SectionId>("home");
  const [hidden, setHidden] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // reduce 指定時はスクロールアニメーションを無効化する
  const getScrollBehavior = (): ScrollBehavior => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return "auto";
    }
    return "smooth";
  };

  const closeAll = () => {
    setOpen(false);
    setPopup(null);
  };

  const scrollToSection = (id: string) => {
    const behavior = getScrollBehavior();

    // home はトップへのスクロール。ペライチ表示中はそのままスクロールする
    if (id === "home" && location.pathname === "/") {
      window.scrollTo({ top: 0, behavior });
      return;
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior });
      return;
    }

    // 詳細ページなど対象が無いページではトップへ遷移する
    location.assign(id === "home" ? "/" : `/#${id}`);
  };

  // 扇ボタンの操作: Works/Contact は popup トグル、それ以外はスクロールして全閉
  const handleFanItem = (id: SectionId) => {
    if (id === "works" || id === "contact") {
      // 同じボタン再タップでトグル閉
      setPopup((prev) => (prev === id ? null : id));
      return;
    }

    scrollToSection(id);
    closeAll();
  };

  const handleCategory = (category: string) => {
    scrollToSection(`works-${category}`);
    closeAll();
  };

  // 外側クリック・Esc の document リスナー
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (e.target instanceof Node && !root.contains(e.target)) {
        closeAll();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") {
        return;
      }

      // popup が開いていれば popup のみ閉じる。なければ全閉してメニューボタンへフォーカス復帰
      if (popup !== null) {
        setPopup(null);
        return;
      }
      if (open) {
        closeAll();
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, popup]);

  // 現在地ハイライト
  useEffect(() => {
    return setupSectionObserver((id) => setActive(id as SectionId));
  }, []);

  // スクロール方向でメニューを出し入れする。下スクロールで表示 / 上スクロールで隠す
  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      // 微小な揺れは無視してチャタリングを防ぐ
      if (Math.abs(delta) < 8) {
        return;
      }

      if (delta > 0) {
        setHidden(false);
      } else {
        // 隠す際は展開中のメニューも畳む
        setHidden(true);
        closeAll();
      }

      lastY = y;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={rootRef} class={styles.root} data-open={open ? "" : undefined} data-hidden={hidden ? "" : undefined}>
      {/* Works popup: カテゴリの縦リスト。常設し data-open で出し分ける */}
      <div class={`${styles.popup} ${styles.popupWorks}`} data-open={popup === "works" ? "" : undefined}>
        <ul class={styles.popupList}>
          {CATEGORY_ORDER.map((category) => {
            const CategoryIcon = CATEGORY_ICONS[category];

            return (
              <li key={category}>
                <button type="button" class={styles.popupItem} onClick={() => handleCategory(category)}>
                  <CategoryIcon class={styles.popupIcon} />
                  <span class={styles.popupLabel}>{category}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Contact popup */}
      <div class={`${styles.popup} ${styles.popupContact}`} data-open={popup === "contact" ? "" : undefined}>
        <ul class={styles.popupList}>
          {CONTACT_LINKS.map(({ label, href, external, Icon }) => (
            <li key={label}>
              <a class={styles.popupItem} href={href} target={external ? "_blank" : undefined} onClick={closeAll}>
                <Icon class={styles.popupIcon} />
                <span class={styles.popupLabel}>{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {ITEMS.map(({ id, label, tx, ty, i }) => {
        const NavIcon = NAV_ICONS[id];
        const isPopup = id === "works" || id === "contact";

        return (
          <button
            key={id}
            type="button"
            class={styles.fanItem}
            style={{ "--tx": `${tx}px`, "--ty": `${ty}px`, "--i": i }}
            data-active={active === id ? "" : undefined}
            tabIndex={open ? 0 : -1}
            aria-label={label}
            aria-expanded={isPopup ? popup === id : undefined}
            onClick={() => handleFanItem(id)}
          >
            <NavIcon class={styles.fanIcon} />
            <span class={styles.fanLabel}>{label}</span>
          </button>
        );
      })}

      <button
        ref={menuButtonRef}
        type="button"
        class={styles.menuButton}
        aria-expanded={open}
        onClick={() => {
          // メニューを閉じるときは popup も畳む
          setOpen((prev) => {
            if (prev) {
              setPopup(null);
            }

            return !prev;
          });
        }}
      >
        <span class={styles.menuLabel}>menu</span>
      </button>
    </div>
  );
}
