import { describe, expect, it } from 'vitest';
import { computeScrollTopForCenteredSection } from './scrollSectionIntoViewport';

describe('computeScrollTopForCenteredSection', () => {
  it('centers a section shorter than the viewport', () => {
    expect(computeScrollTopForCenteredSection(400, 600, 900, 2000)).toBe(250);
  });

  it('centers a section taller than the viewport on its midpoint', () => {
    expect(computeScrollTopForCenteredSection(1000, 1600, 800, 3000)).toBe(1400);
  });

  it('clamps to the top and bottom of the page', () => {
    expect(computeScrollTopForCenteredSection(50, 600, 900, 1200)).toBe(0);
    expect(computeScrollTopForCenteredSection(2500, 800, 900, 1200)).toBe(1200);
  });
});
