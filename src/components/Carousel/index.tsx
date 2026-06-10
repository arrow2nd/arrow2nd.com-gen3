"use client";

import { useEffect, useRef, useState } from "react";
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
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoScrollRef = useRef<ReturnType<typeof setInterval>>(undefined);

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
    clearInterval(autoScrollRef.current);
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
    clearInterval(autoScrollRef.current);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: 初回マウント時の初期化 + クリーンアップ
  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    scrollToDom(1, "instant");
    startAutoScroll();

    return () => stopAutoScroll();
  }, []);

  // スクロール停止後にクローン→本物へジャンプ + タイマーリセット
  const handleScroll = () => {
    clearTimeout(scrollTimerRef.current);

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

  const pause = () => {
    setPaused(true);
    stopAutoScroll();
  };

  const resume = () => {
    setPaused(false);
    startAutoScroll();
  };

  if (images.length === 1) {
    return <img src={images[0]} alt={alt} className={styles.image} />;
  }

  // [last, ...images, first]
  const slides = [images.at(-1), ...images, images.at(0)].filter((src) => typeof src === "string");

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ドラッグでのスクロールを優先させたい
    <div onMouseEnter={pause} onMouseLeave={resume} onTouchStart={pause} onTouchEnd={resume} onTouchCancel={resume}>
      <div ref={trackRef} className={styles.track} onScroll={handleScroll}>
        {slides.map((src, i) => {
          const logicalIndex = (i - 1 + images.length) % images.length;

          return (
            <img
              key={`${src}-${i.toString()}`}
              src={src}
              alt={`${alt} (${logicalIndex + 1}/${images.length})`}
              className={styles.image}
              aria-hidden={i === 0 || i === slides.length - 1}
            />
          );
        })}
      </div>
      <div className={styles.indicators}>
        {images.map((_, i) => (
          <button
            key={i.toString()}
            type="button"
            className={i === activeIndex ? styles.indicatorActive : styles.indicator}
            aria-label={`${i + 1}枚目の画像`}
            onClick={() => scrollToLogical(i)}
          />
        ))}
      </div>
    </div>
  );
}
