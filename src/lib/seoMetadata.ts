export interface SeoUrls {
  canonicalUrl?: string;
  socialImageUrl?: string;
}

export function createSeoUrls(publicSiteUrl: string | undefined, socialImagePath: string): SeoUrls {
  if (!publicSiteUrl?.trim()) {
    return {};
  }

  try {
    const siteUrl = new URL(publicSiteUrl.trim());

    if (
      !['http:', 'https:'].includes(siteUrl.protocol) ||
      !siteUrl.hostname ||
      siteUrl.username ||
      siteUrl.password
    ) {
      return {};
    }

    siteUrl.search = '';
    siteUrl.hash = '';
    siteUrl.pathname = `${siteUrl.pathname.replace(/\/+$/u, '')}/`;

    const socialImageUrl = new URL(socialImagePath, siteUrl);

    return {
      canonicalUrl: siteUrl.href,
      ...(socialImageUrl.origin === siteUrl.origin ? { socialImageUrl: socialImageUrl.href } : {}),
    };
  } catch {
    return {};
  }
}
