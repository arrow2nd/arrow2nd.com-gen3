export const SITE_URL = "https://arrow2nd.com";

export const toAbsoluteUrl = (pathOrUrl: string) => new URL(pathOrUrl, SITE_URL).toString();
