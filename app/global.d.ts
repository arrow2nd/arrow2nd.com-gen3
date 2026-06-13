import type { Child } from "hono/jsx";
import type { JsonLd } from "./lib/json-ld";

type RendererProps = {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  article?: boolean;
  jsonLd?: JsonLd | JsonLd[];
};

declare module "hono" {
  // biome-ignore lint/complexity/noBannedTypes: Hono's Renderer conditional type explicitly checks `ContextRenderer extends Function`.
  interface ContextRenderer extends Function {
    (content: Child | Promise<Child>, props?: RendererProps): Response | Promise<Response>;
  }
}

declare module "hono/dist/types/context" {
  // biome-ignore lint/complexity/noBannedTypes: Hono's Renderer conditional type explicitly checks `ContextRenderer extends Function`.
  interface ContextRenderer extends Function {
    (content: Child | Promise<Child>, props?: RendererProps): Response | Promise<Response>;
  }
}
