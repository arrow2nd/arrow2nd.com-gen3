import { jsxRenderer } from "hono/jsx-renderer";
import { Script } from "honox/server";
import AppCss from "../components/AppCss";
import Footer from "../components/Footer";
import BottomMenu from "../islands/BottomMenu";

export default jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>arrow2nd</title>
        <meta name="description" content="arrow2nd のポートフォリオサイト" />
        <link rel="icon" href="/favicon.ico" />
        <AppCss />
        <Script src="/app/client.ts" async />
      </head>
      <body>
        {children}
        <BottomMenu />
        <Footer />
      </body>
    </html>
  );
});
