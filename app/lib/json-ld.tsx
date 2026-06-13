import { raw } from "hono/html";
import type { Work } from "./works";

const SITE_URL = "https://www.arrow2nd.com";
const PERSON_ID = `${SITE_URL}/#person`;

type JsonLdValue = string | number | boolean | null | JsonLd | JsonLdValue[];

export type JsonLd = {
  [key: string]: JsonLdValue;
};

type Props = {
  data: JsonLd | JsonLd[];
};

function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).toString();
}

function stringifyJsonLd(data: JsonLd | JsonLd[]): string {
  const graph = Array.isArray(data) ? data : [data];
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  }).replace(/</g, "\\u003c");
}

export function JsonLdScript({ data }: Props) {
  return <script type="application/ld+json">{raw(stringifyJsonLd(data))}</script>;
}

export function buildPersonJsonLd(): JsonLd {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "arrow2nd",
    url: SITE_URL,
    jobTitle: "フロントエンドエンジニア",
    sameAs: ["https://x.com/_arrow2nd", "https://github.com/arrow2nd"],
  };
}

export function buildCreativeWorkJsonLd(work: Work): JsonLd {
  const pageUrl = `${SITE_URL}/works/${work.slug}`;

  return {
    "@type": "CreativeWork",
    "@id": `${pageUrl}#creative-work`,
    name: work.title,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    dateCreated: work.createdAt,
    genre: work.category,
    image: work.images.map(absoluteUrl),
    author: { "@id": PERSON_ID },
    creator: { "@id": PERSON_ID },
    inLanguage: "ja",
  };
}
