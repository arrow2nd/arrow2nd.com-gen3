import { createRoute } from "honox/factory";
import NotFound from "../components/NotFound";

// SSG 用の 404 ページ。Workers Assets の not_found_handling: "404-page" が
// /404.html を見つけて、404 ステータスで配信してくれる
export default createRoute((c) => {
  return c.render(<NotFound />);
});
