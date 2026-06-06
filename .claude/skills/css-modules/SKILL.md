---
description: CSS Modules 運用ルール
trigger: When creating, editing, or reviewing CSS module files (.module.css) or global CSS files (globals.css)
---

# CSS Modules 運用ルール

CSS / CSS Modules を書く・レビューするときにこのルールに従う。

---

## 1. レイヤー設計

グローバルCSS の先頭でレイヤー順を宣言する。後ろのレイヤーが常に勝つ。

```css
@layer components, utilities;
```

### module は必ず `@layer components` で包む

```css
/* components/Card.module.css */
@layer components {
  .root {
    padding: var(--space-4);
  }
}
```

1つでも包み忘れるとレイヤー外扱いになり、utilities より強くなって上書きが効かなくなる。**最も事故りやすい箇所**なので新規ファイル作成時に真っ先に書く。

> 全 module の `@layer` 包みが手作業で回らなくなったら PostCSS プラグインで自動化する。最初は手動で十分。

### ユーティリティは `@layer utilities` で定義

```css
/* globals.css */
@layer utilities {
  .mt-2 { margin-top: var(--space-2); }
}
```

### 合成順に頼らない

`clsx` 等でクラスを合成する際、出力順は保証されない。上書きの優先度は必ず `@layer` で固定する。

---

## 2. コンポーネントスタイルの書き方

### フラットな単一クラス・低詳細度

詳細度を上げるとレイヤーによる後勝ちが効かなくなる。ネストで詳細度を上げない。

```css
/* OK */
@layer components {
  .title { font-size: 1.5rem; }
  .subtitle { font-size: 1rem; }
}

/* NG — 詳細度が上がる */
@layer components {
  .intro .title { font-size: 1.5rem; }
}
```

### 動的な値は CSS 変数で受け渡す

```tsx
<div className={styles.bar} style={{ '--progress': `${percent}%` } as React.CSSProperties}>
```

```css
@layer components {
  .bar {
    width: var(--progress);
  }
}
```

---

## 3. レスポンシブ

### ブレークポイントは1本だけ

スマホ / それ以外の2段階。値は `768px`。

グローバル CSS の先頭にコメントで基準値を明記し、単一の真実とする。

```css
/* breakpoint: 768px (tablet & up) */
```

1本だけなので `@custom-media` は導入しない。ブレークポイントが増えた時点で移行する。

### モバイルファースト

ベースをスマホのスタイルとし、`@media (min-width: 768px)` で上書きする。`max-width` と混在させない。

### セレクタ内に `@media` をネスト

コンポーネント単位でスマホ時とそれ以外を1箇所にまとめる。

```css
@layer components {
  .hero {
    padding: var(--space-4);

    @media (min-width: 768px) {
      padding: var(--space-8);
    }
  }
}
```

---

## 4. ユーティリティの方針

- マージン・余白系を中心に、**実際に使う分だけ**最小限で定義する。
- 値は CSS 変数を参照する（例: `.mt-2 { margin-top: var(--space-2); }`）。
- 使う側から `className` で当て、ラッパー div を足さずに調整する。

---

## 5. グローバルに置くもの

グローバル CSS（非 module）に置くのは**複数箇所で共有するもの**だけ。

| 種類 | 例 |
|---|---|
| CSS 変数 | 色、余白スケール(`--space-*`)、イージング、duration |
| 共有 `@keyframes` | `fadeIn`, `slideUp` など複数 module から参照するアニメーション |
| ユーティリティ | `@layer utilities` 内に定義 |

グローバルに書いた `@keyframes` は名前がハッシュ化されないため、module 側から直接参照できる。

```css
/* globals.css */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

```css
/* Card.module.css */
@layer components {
  .root {
    animation: fadeIn var(--dur-md) var(--ease-out);
  }
}
```

ユーティリティも module 内スタイルも同じ CSS 変数を参照し、スケールを一元管理する。

---

## 6. module に置くもの

- そのコンポーネント専用のスタイル。
- **そこでしか使わない `@keyframes`**。module 内に書けばスコープされ、命名衝突を気にしなくてよい。ただし名前がハッシュ化されるため、同じ module 内でのみ `animation: 名前` で参照する。

---

## チェックリスト（新規 `.module.css` 作成時）

1. ファイル全体を `@layer components { ... }` で包んだか
2. セレクタはフラットな単一クラスか（ネストで詳細度を上げていないか）
3. レスポンシブは `@media (min-width: 768px)` のモバイルファーストか
4. 余白等のマジックナンバーは CSS 変数（`--space-*` 等）を参照しているか
5. 動的な値は `style` prop → CSS 変数経由で渡しているか
