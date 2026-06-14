import type { NotFoundHandler } from "hono";
import NotFound from "../components/NotFound";

// dev と c.notFound() 用の 404 ハンドラ(SSG では routes/404.tsx が使われる)
const handler: NotFoundHandler = (c) => {
  return c.render(<NotFound />);
};

export default handler;
