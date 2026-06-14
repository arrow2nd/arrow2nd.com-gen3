// 今表示しているセクションの id を監視して、変わったら onChange を呼ぶ。
// 戻り値は後始末用の cleanup 関数
export function setupSectionObserver(onChange: (id: string) => void): () => void {
  const sections = ["home", "about", "works"]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  // /works/:slug など対象セクションが無いページでは、何もしない
  if (sections.length === 0) {
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onChange(entry.target.id);
        }
      }
    },
    // 画面中央の帯に入ったセクションを「現在地」とみなす
    { rootMargin: "-40% 0px -55% 0px" },
  );

  for (const section of sections) {
    io.observe(section);
  }

  return () => io.disconnect();
}
