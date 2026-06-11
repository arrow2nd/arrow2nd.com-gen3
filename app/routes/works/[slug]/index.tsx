import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import WorkDetail from "../../../components/WorkDetail";
import { getAllSlugs, getWorkBySlug } from "../../../lib/works";
import styles from "./index.module.css";

export default createRoute(
  // SSG時に全slugを列挙して具象パスでレンダリングさせる
  ssgParams(() => getAllSlugs().map((slug) => ({ slug }))),
  (c) => {
    const work = getWorkBySlug(c.req.param("slug") ?? "");

    if (!work) {
      return c.notFound();
    }

    return c.render(
      <div class={styles.root}>
        <div class={styles.header}>
          <a href={`/#${work.slug}`} class={styles.backButton}>
            <span class={styles.text}>もどる</span>
          </a>
        </div>
        <WorkDetail work={work} />
      </div>,
    );
  },
);
