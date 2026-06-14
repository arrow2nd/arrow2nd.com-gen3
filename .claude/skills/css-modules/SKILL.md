---
description: CSS Modules 運用ルール
trigger: When creating, editing, or reviewing CSS module files (.module.css) or global CSS files (globals.css)
---

# CSS Modules 運用ルール

CSS / CSS Modules を書く・レビューするときにこのルールに従う。

---

## 1. コンポーネントスタイルの書き方

### 単一クラス起点 + 自己参照ネスト

セレクタの起点は単一クラスとする。**別の名前付きクラスを子孫に連ねて詳細度を意図的に上げる**(`.intro .title`)のはしない。

一方で、`&` による自己参照ネストや、クラスを振れない要素への一段ネストは**積極的に活用する**。関連スタイルを1箇所にまとめられ、可読性が上がるため。

- `&::before` / `&::after`(擬似要素)
- `&:hover` / `&:active` / `&:not(...)`(擬似クラス・状態)
- `@media (width >= 768px)`(レスポンシブ)
- `> li + li` / `> :is(h1, h2)` など、クラスを振れない子要素・MDX 生成要素への一段

```css
/* OK — 単一クラス起点 + 自己参照ネスト */
.body {
  color: var(--color-text);

  &::after {
    content: "";
    flex: 1;
  }

  &:hover {
    color: var(--color-text-head);
  }

  @media (width >= 768px) {
    font-size: 1.25rem;
  }

  /* li にはクラスを振れないので要素への一段ネストで対応 */
  > li + li {
    margin-top: 0.25rem;
  }
}

/* NG — 別の名前付きクラスを子孫に連ねて詳細度を上げる */
.intro .title {
  font-size: 1.5rem;
}
```

### 単位の使い分け

- **`rem`**: フォントサイズ、余白（margin / padding / gap）など、テキストのスケーリングに追従すべき値
- **`px`**: border-width、border-radius、box-shadow の offset など、視覚的に固定したい細かな装飾値

```css
/* OK */
.card {
  font-size: 1.25rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

/* NG — border 系に rem、フォントに px */
.card {
  font-size: 20px;
  border-radius: 1rem;
}
```

### 動的な値は CSS 変数で受け渡す

```tsx
<div className={styles.bar} style={{ '--progress': `${percent}%` } as React.CSSProperties}>
```

```css
.bar {
  width: var(--progress);
}
```

---

## 2. レスポンシブ

### ブレークポイントは固定セット2本（ADR 0009）

Tailwind 相当の固定セット。**この2本以外の値を勝手に増やさない**。

| 名前 | 値 | 用途 |
|---|---|---|
| md | `@media (width >= 768px)` | SP / それ以外の基本分岐 |
| lg | `@media (width >= 1024px)` | グリッド列数など広い画面での追加分岐 |

グローバル CSS の先頭にコメントで基準値を明記し、単一の真実とする。

固定2本のうちは `@custom-media` は導入しない。3本目が必要になった時点で移行する（[ADR 0009](../../../docs/adr/0009-single-breakpoint-hardcoded.md)）。

### モバイルファースト + range 構文

ベースをスマホのスタイルとし、`@media (width >= 768px)` 等で上書きする。

- range 構文（`width >=`）で統一し、`min-width` / `max-width` 表記は使わない。値変更時に grep 一発で全箇所を更新できるようにするため
- `width <`（デスクトップファースト）と混在させない

### セレクタ内に `@media` をネスト

コンポーネント単位でスマホ時とそれ以外を1箇所にまとめる。

```css
.hero {
  padding: 1rem;

  @media (width >= 768px) {
    padding: 2rem;
  }
}
```

---

## 3. グローバルに置くもの

グローバル CSS（非 module）に置くのは**複数箇所で共有するもの**だけ。

| 種類 | 例 |
|---|---|
| CSS 変数 | 色、イージング、duration |
| 共有 `@keyframes` | `fadeIn`, `slideUp` など複数 module から参照するアニメーション |

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
.root {
  animation: fadeIn var(--dur-md) var(--ease-out);
}
```

module 内スタイルも globals.css と同じ CSS 変数（色・イージング・duration）を参照し、テーマを一元管理する。余白・サイズは各 module で `rem` / `px` を直書きしてよい(`--space-*` のような余白スケールは設けない)。

---

## 4. module に置くもの

- そのコンポーネント専用のスタイル。
- **そこでしか使わない `@keyframes`**。module 内に書けばスコープされ、命名衝突を気にしなくてよい。ただし名前がハッシュ化されるため、同じ module 内でのみ `animation: 名前` で参照する。

---

## チェックリスト（新規 `.module.css` 作成時）

1. セレクタの起点は単一クラスか（別の名前付きクラスを子孫に連ねて詳細度を上げていないか）。`&` ネストや要素への一段ネストは活用してよい
2. レスポンシブは `@media (width >= 768px)` のモバイルファーストか（`min-width` / `max-width` 表記は使わない）
3. 色・イージング・duration など**複数箇所で共有する値**は CSS 変数を参照しているか（余白・サイズは `rem` / `px` 直書きでよい）
4. 動的な値は `style` prop → CSS 変数経由で渡しているか
5. フォント・余白は `rem`、border-width・border-radius は `px` か
