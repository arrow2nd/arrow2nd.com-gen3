import { createRoute } from "honox/factory";
import NotFound from "../components/NotFound";

// SSG用の404ページ。Workers Assets の not_found_handling: "404-page" が
// /404.html を見つけて404ステータスで配信する
export default createRoute((c) => {
  return c.render(<NotFound />);
});
