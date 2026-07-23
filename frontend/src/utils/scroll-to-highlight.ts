/**
 * Scroll to an element and apply a temporary highlight effect.
 *
 * @param selectorOrEl  CSS selector string or an HTMLElement
 * @param delay         ms to wait before scrolling (0 = immediate)
 * @returns true if the element was found and scrolled to
 */
export function scrollToHighlight(
  selectorOrEl: string | Element,
  delay = 0,
): boolean {
  const el =
    typeof selectorOrEl === 'string'
      ? document.querySelector<HTMLElement>(selectorOrEl)
      : selectorOrEl as HTMLElement;

  if (!el) return false;

  const doScroll = () => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bg-primary/20', 'transition-colors', 'duration-500');
    setTimeout(() => el.classList.remove('bg-primary/20'), 2000);
  };

  if (delay > 0) {
    setTimeout(doScroll, delay);
  } else {
    doScroll();
  }

  return true;
}

/**
 * Poll for an element and scroll to it once found.
 *
 * @param selector      CSS selector to poll for
 * @param options       maxAttempts (default 50), intervalMs (default 200), delay (default 100), onFailed callback
 * @returns a cleanup function that stops polling
 */
export function pollAndScroll(
  selector: string,
  options?: { maxAttempts?: number; intervalMs?: number; delay?: number; onFailed?: () => void },
): () => void {
  const { maxAttempts = 50, intervalMs = 200, delay = 100, onFailed } = options ?? {};
  let attempts = 0;

  const check = setInterval(() => {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      clearInterval(check);
      setTimeout(() => scrollToHighlight(el), delay);
    } else if (++attempts >= maxAttempts) {
      clearInterval(check);
      onFailed?.();
    }
  }, intervalMs);

  return () => clearInterval(check);
}
