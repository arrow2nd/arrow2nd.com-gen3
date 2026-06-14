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

// 扇の半径(px)。ピルの中央を原点にして各ボタンを配置する。
// 72px のボタンが隣と重ならないよう、中心間距離 2*R*sin(20°) ≧ ボタン径+隙間 を満たす値にしている
const RADIUS = 117;

// 4ボタンの配置角度(度, 0=右 / 90=上)。左から右に Home/About/Works/Contact を並べる。
// 座標はモジュールスコープで先に計算しておき、CSS 変数で各ボタンに渡す
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

  const rootRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // reduce が指定されているときはスクロールアニメーションを無効にする
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

    // home はトップへスクロール。ペライチを表示中ならそのままスクロールする
    if (id === "home" && location.pathname === "/") {
      window.scrollTo({ top: 0, behavior });
      return;
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior });
      return;
    }

    // 詳細ページなど対象が無いページでは、トップへ遷移する
    location.assign(id === "home" ? "/" : `/#${id}`);
  };

  // 扇ボタンの操作。Works/Contact は popup をトグル、それ以外はスクロールして全部閉じる
  const handleFanItem = (id: SectionId) => {
    if (id === "works" || id === "contact") {
      // 同じボタンをもう一度タップしたら閉じる
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

  // 外側クリックと Esc を拾う document リスナー
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

      // popup が開いていれば popup だけ閉じる。なければ全部閉じて、メニューボタンへフォーカスを戻す
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

  // 現在地のハイライト
  useEffect(() => {
    return setupSectionObserver((id) => setActive(id as SectionId));
  }, []);

  return (
    <nav ref={rootRef} class={styles.root} data-open={open ? "" : undefined} aria-label="メインメニュー">
      {/* Works popup。カテゴリの縦リスト。常に置いておき、data-open で出し分ける */}
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
          // メニューを閉じるときは popup も一緒に畳む
          setOpen((prev) => {
            if (prev) {
              setPopup(null);
            }

            return !prev;
          });
        }}
      >
        <span class={styles.menuLabel}>{open ? "close" : "menu"}</span>
      </button>
    </nav>
  );
}
