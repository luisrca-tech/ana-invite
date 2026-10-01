export function computeScrollTopForCenteredSection(
  sectionTop: number,
  sectionHeight: number,
  viewportHeight: number,
  maxScrollTop: number,
): number {
  const idealTop = sectionTop + sectionHeight / 2 - viewportHeight / 2;
  return Math.max(0, Math.min(idealTop, maxScrollTop));
}

export function getCenteredScrollTopForElement(
  element: HTMLElement,
  viewportHeight = window.innerHeight,
  scrollY = window.scrollY,
  documentScrollHeight = document.documentElement.scrollHeight,
): number {
  const rect = element.getBoundingClientRect();
  const sectionTop = scrollY + rect.top;
  const maxScrollTop = Math.max(0, documentScrollHeight - viewportHeight);

  return computeScrollTopForCenteredSection(
    sectionTop,
    element.offsetHeight,
    viewportHeight,
    maxScrollTop,
  );
}

export function scrollSectionIntoViewportCenter(
  element: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): void {
  const top = getCenteredScrollTopForElement(element);
  window.scrollTo({ top, behavior });
}
