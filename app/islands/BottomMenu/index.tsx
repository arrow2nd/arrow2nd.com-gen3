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

// 扇の半径(px)。ピル中央を原点に各ボタンを配置する
const RADIUS = 88;

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

// active なセクションの扇ボタン座標(インジケータの吸着先)を引くためのマップ
const COORD_BY_ID = new Map(ITEMS.map((item) => [item.id, { tx: item.tx, ty: item.ty }]));

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
  // popup は単一 state で表現することで Works / Contact の排他が自動的に成り立つ
  const [popup, setPopup] = useState<PopupId | null>(null);
  const [active, setActive] = useState<SectionId>("home");

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

  // インジケータの座標。メニュー閉時は原点へ畳む
  const activeCoord = COORD_BY_ID.get(active);
  const indicatorStyle =
    open && activeCoord
      ? { "--tx": `${activeCoord.tx}px`, "--ty": `${activeCoord.ty}px` }
      : { "--tx": "0px", "--ty": "0px" };

  return (
    <div ref={rootRef} class={styles.root} data-open={open ? "" : undefined}>
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
              <a
                class={styles.popupItem}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                onClick={closeAll}
              >
                <Icon class={styles.popupIcon} />
                <span class={styles.popupLabel}>{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* 現在地に吸着するインジケータ(リング)。fanItem と同座標系・pointer-events なし */}
      <span class={styles.indicator} style={indicatorStyle} aria-hidden="true" />

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
        <span class={styles.dot} aria-hidden="true" />
        <span class={styles.menuLabel}>menu</span>
      </button>
    </div>
  );
}
