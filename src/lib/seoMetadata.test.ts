import { describe, expect, it } from 'vitest';
import { createSeoUrls } from './seoMetadata';

describe('createSeoUrls', () => {
  it('omits canonical and social image URLs when the public site URL is missing', () => {
    expect(createSeoUrls(undefined, '/_astro/family-preview.jpg')).toEqual({});
    expect(createSeoUrls('   ', '/_astro/family-preview.jpg')).toEqual({});
  });

  it('builds absolute canonical and social image URLs from a valid public site URL', () => {
    expect(createSeoUrls('https://invite.example.test/', '/_astro/family-preview.jpg')).toEqual({
      canonicalUrl: 'https://invite.example.test/',
      socialImageUrl: 'https://invite.example.test/_astro/family-preview.jpg',
    });
  });

  it('omits URLs for an invalid public site URL without throwing', () => {
    expect(createSeoUrls('not a URL', '/_astro/family-preview.jpg')).toEqual({});
    expect(createSeoUrls('javascript:alert(1)', '/_astro/family-preview.jpg')).toEqual({});
  });

  it('does not allow a social image path to point at a different origin', () => {
    expect(createSeoUrls('https://invite.example.test', 'https://other.example.test/image.jpg')).toEqual({
      canonicalUrl: 'https://invite.example.test/',
    });
  });
});
