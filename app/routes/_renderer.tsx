import type { Child } from "hono/jsx";
import { jsxRenderer } from "hono/jsx-renderer";
import { Script } from "honox/server";
import AppCss from "../components/AppCss";
import Footer from "../components/Footer";
import BottomMenu from "../islands/BottomMenu";
import { buildPersonJsonLd, type JsonLd, JsonLdScript } from "../lib/json-ld";

type RendererComponentProps = {
  children?: Child;
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  article?: boolean;
  jsonLd?: JsonLd | JsonLd[];
};

const SITE_URL = "https://www.arrow2nd.com/";
const DEFAULT_IMAGE_URL = "https://avatars.githubusercontent.com/u/44780846?v=4";

const toAbsoluteUrl = (pathOrUrl: string) => new URL(pathOrUrl, SITE_URL).toString();

export default jsxRenderer((props, c) => {
  const {
    children,
    title = "arrow2nd",
    description = "arrow2nd のポートフォリオサイト",
    imageUrl = DEFAULT_IMAGE_URL,
    url = c.req.path,
    article = false,
    jsonLd = [],
  } = props as RendererComponentProps;
  const jsonLdGraph = [buildPersonJsonLd(), ...(Array.isArray(jsonLd) ? jsonLd : [jsonLd])];
  const canonicalUrl = toAbsoluteUrl(url);
  const ogImageUrl = toAbsoluteUrl(imageUrl);

  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="image" content={ogImageUrl} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content={article ? "article" : "website"} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="twitter:card" content={article ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
        <JsonLdScript data={jsonLdGraph} />
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
