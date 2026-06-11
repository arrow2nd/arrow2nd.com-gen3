import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import WorkDetail from "../../../components/WorkDetail";
import { getAllSlugs, getWorkBySlug } from "../../../lib/works";

// ドロワーに流し込む部分HTML。c.html なのでレンダラー(_renderer)を通らない
export default createRoute(
  ssgParams(() => getAllSlugs().map((slug) => ({ slug }))),
  (c) => {
    const work = getWorkBySlug(c.req.param("slug") ?? "");

    if (!work) {
      return c.notFound();
    }

    return c.html(<WorkDetail work={work} />);
  },
);
