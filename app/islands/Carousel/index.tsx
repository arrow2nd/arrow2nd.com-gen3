import { useEffect, useRef, useState } from "hono/jsx";
import styles from "./index.module.css";

type Props = {
  images: string[];
  alt: string;
};

const INTERVAL_MS = 4000;

export default function Carousel({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  // hono/jsx の useRef は current が T | null になるため null 初期化
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval>>(null);
  const initializedRef = useRef(false);

  // クローン込みのスライド: [last, ...images, first]
  const totalSlides = images.length + 2;

  const getSlideWidth = () => {
    const el = trackRef.current;

    if (!el) {
      return 0;
    }

    return el.scrollWidth / totalSlides;
  };

  // DOM上のインデックス（クローン込み）でスクロール
  const scrollToDom = (domIndex: number, behavior: ScrollBehavior) => {
    const el = trackRef.current;

    if (!el) {
      return;
    }

    el.scrollTo({ left: domIndex * getSlideWidth(), behavior });
  };

  // 論理インデックス（0〜length-1）でスクロール
  const scrollToLogical = (index: number) => {
    scrollToDom(index + 1, "smooth");
  };

  const startAutoScroll = () => {
    clearInterval(autoScrollRef.current ?? undefined);
    autoScrollRef.current = setInterval(() => {
      const el = trackRef.current;
      if (!el) {
        return;
      }

      const slideWidth = getSlideWidth();
      const domIndex = Math.round(el.scrollLeft / slideWidth);

      scrollToDom(domIndex + 1, "smooth");
    }, INTERVAL_MS);
  };

  const stopAutoScroll = () => {
    clearInterval(autoScrollRef.current ?? undefined);
  };

  // 自動スクロールと同じく現在のDOMインデックス±1へ送る。端のwrapは handleScroll が処理する
  const scrollByStep = (delta: 1 | -1) => {
    const el = trackRef.current;
    if (!el) {
      return;
    }

    const slideWidth = getSlideWidth();
    if (slideWidth === 0) {
      return;
    }

    const domIndex = Math.round(el.scrollLeft / slideWidth);
    scrollToDom(domIndex + delta, "smooth");
  };

  // スクロール可能になった時点で一度だけ初期位置(クローンを除いた1枚目)を適用する
  const initPosition = () => {
    const el = trackRef.current;
    if (!el || initializedRef.current) {
      return;
    }
    // 画像ロード前は scrollWidth が clientWidth 以下で scrollTo が 0 に clamp されるため、
    // スクロール可能になってから初期位置(クローンを除いた1枚目)を適用する
    if (el.scrollWidth <= el.clientWidth) {
      return;
    }
    initializedRef.current = true;
    scrollToDom(1, "instant");
  };

  // 初回マウント時の初期化 + クリーンアップ
  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    initPosition();
    startAutoScroll();

    return () => stopAutoScroll();
  }, []);

  // スクロール停止後にクローン→本物へジャンプ + タイマーリセット
  const handleScroll = () => {
    clearTimeout(scrollTimerRef.current ?? undefined);

    scrollTimerRef.current = setTimeout(() => {
      const el = trackRef.current;
      if (!el) {
        return;
      }

      const slideWidth = getSlideWidth();
      if (slideWidth === 0) {
        return;
      }

      const domIndex = Math.round(el.scrollLeft / slideWidth);

      if (domIndex === 0) {
        scrollToDom(images.length, "instant");
        setActiveIndex(images.length - 1);
      } else if (domIndex === totalSlides - 1) {
        scrollToDom(1, "instant");
        setActiveIndex(0);
      } else {
        setActiveIndex(domIndex - 1);
      }

      if (!paused) {
        startAutoScroll();
      }
    }, 80);
  };

  // クリック座標が左右25%の帯なら前後送りする。
  // fine pointer 環境ではボタン(track の兄弟)がクリックを受けるため、クリックは track まで届かず二重発火しない。
  // coarse 環境ではボタンが pointer-events: none で素通しになり img がターゲットになるため、クリックが track まで bubble してここで処理される。
  // タッチでスワイプ(スクロール)が発生した場合はブラウザが click を発火しないため、誤発火もしない。
  const handleTrackClick = (e: MouseEvent) => {
    const el = trackRef.current;
    if (!el) {
      return;
    }

    const rect = el.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;

    if (ratio < 0.25) {
      scrollByStep(-1);
    } else if (ratio > 0.75) {
      scrollByStep(1);
    }
  };

  const pause = () => {
    setPaused(true);
    stopAutoScroll();
  };

  const resume = () => {
    setPaused(false);
    startAutoScroll();
  };

  if (images.length === 1) {
    return <img src={images[0]} alt={alt} class={styles.image} />;
  }

  // [last, ...images, first]
  const slides = [images.at(-1), ...images, images.at(0)].filter((src) => typeof src === "string");

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ドラッグでのスクロールを優先させたい
    <div onMouseEnter={pause} onMouseLeave={resume} onTouchStart={pause} onTouchEnd={resume} onTouchCancel={resume}>
      <div class={styles.viewport}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: タッチ時のクリック座標で前後送りを判定する。スワイプ(スクロール)を妨げないよう div のままにする。キーボード操作は下部のインジケーターと、coarse 環境でも activation を受けられる前後ボタンで担保されている */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: クリック座標による帯判定はポインタ専用の補助操作。キーボード操作は前後ボタンとインジケーターで担保されている */}
        <div ref={trackRef} class={styles.track} onScroll={handleScroll} onClick={handleTrackClick}>
          {slides.map((src, i) => {
            const logicalIndex = (i - 1 + images.length) % images.length;

            return (
              <img
                key={`${src}-${i.toString()}`}
                src={src}
                alt={`${alt} (${logicalIndex + 1}/${images.length})`}
                class={styles.image}
                aria-hidden={i === 0 || i === slides.length - 1}
                onLoad={initPosition}
              />
            );
          })}
        </div>
        <button type="button" class={styles.tapPrev} aria-label="前の画像" onClick={() => scrollByStep(-1)} />
        <button type="button" class={styles.tapNext} aria-label="次の画像" onClick={() => scrollByStep(1)} />
      </div>
      <div class={styles.indicators}>
        {images.map((_, i) => (
          <button
            key={i.toString()}
            type="button"
            class={i === activeIndex ? styles.indicatorActive : styles.indicator}
            aria-label={`${i + 1}枚目の画像`}
            onClick={() => scrollToLogical(i)}
          />
        ))}
      </div>
    </div>
  );
}
