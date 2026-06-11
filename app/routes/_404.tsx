import type { NotFoundHandler } from "hono";
import NotFound from "../components/NotFound";

// dev・c.notFound() 用の404ハンドラ(SSGでは routes/404.tsx が使われる)
const handler: NotFoundHandler = (c) => {
  return c.render(<NotFound />);
};

export default handler;
