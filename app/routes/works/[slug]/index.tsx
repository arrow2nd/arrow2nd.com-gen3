import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import WorkDetail from "../../../components/WorkDetail";
import { buildCreativeWorkJsonLd } from "../../../lib/json-ld";
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M13.883 5.007l.058 -.005h.118l.058 .005l.06 .009l.052 .01l.108 .032l.067 .027l.132 .07l.09 .065l.081 .073l.083 .094l.054 .077l.054 .096l.017 .036l.027 .067l.032 .108l.01 .053l.01 .06l.004 .057l.002 .059v12c0 .852 -.986 1.297 -1.623 .783l-.084 -.076l-6 -6a1 1 0 0 1 -.083 -1.32l.083 -.094l6 -6l.094 -.083l.077 -.054l.096 -.054l.036 -.017l.067 -.027l.108 -.032l.053 -.01l.06 -.01z" />
            </svg>
            <span class={styles.text}>もどる</span>
          </a>
        </div>
        <WorkDetail work={work} />
      </div>,
      {
        title: `${work.title} | arrow2nd`,
        description: work.title,
        imageUrl: work.images[0],
        url: `/works/${work.slug}`,
        article: true,
        jsonLd: buildCreativeWorkJsonLd(work),
      },
    );
  },
);
