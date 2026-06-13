---
description: CSS Modules 運用ルール
trigger: When creating, editing, or reviewing CSS module files (.module.css) or global CSS files (globals.css)
---

# CSS Modules 運用ルール

CSS / CSS Modules を書く・レビューするときにこのルールに従う。

---

## 1. コンポーネントスタイルの書き方

### フラットな単一クラス・低詳細度

詳細度を上げない。ネストで詳細度を上げない。

```css
/* OK */
.title { font-size: 1.5rem; }
.subtitle { font-size: 1rem; }

/* NG — 詳細度が上がる */
.intro .title { font-size: 1.5rem; }
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
  padding: var(--space-4);

  @media (width >= 768px) {
    padding: var(--space-8);
  }
}
```

---

## 3. ユーティリティの方針

- マージン・余白系を中心に、**実際に使う分だけ**最小限で定義する。
- 値は CSS 変数を参照する（例: `.mt-2 { margin-top: var(--space-2); }`）。
- 使う側から `className` で当て、ラッパー div を足さずに調整する。

---

## 4. グローバルに置くもの

グローバル CSS（非 module）に置くのは**複数箇所で共有するもの**だけ。

| 種類 | 例 |
|---|---|
| CSS 変数 | 色、余白スケール(`--space-*`)、イージング、duration |
| 共有 `@keyframes` | `fadeIn`, `slideUp` など複数 module から参照するアニメーション |
| ユーティリティ | グローバルに定義 |

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

ユーティリティも module 内スタイルも同じ CSS 変数を参照し、スケールを一元管理する。

---

## 5. module に置くもの

- そのコンポーネント専用のスタイル。
- **そこでしか使わない `@keyframes`**。module 内に書けばスコープされ、命名衝突を気にしなくてよい。ただし名前がハッシュ化されるため、同じ module 内でのみ `animation: 名前` で参照する。

---

## チェックリスト（新規 `.module.css` 作成時）

1. セレクタはフラットな単一クラスか（ネストで詳細度を上げていないか）
2. レスポンシブは `@media (width >= 768px)` のモバイルファーストか（`min-width` / `max-width` 表記は使わない）
3. 余白等のマジックナンバーは CSS 変数（`--space-*` 等）を参照しているか
4. 動的な値は `style` prop → CSS 変数経由で渡しているか
5. フォント・余白は `rem`、border-width・border-radius は `px` か
