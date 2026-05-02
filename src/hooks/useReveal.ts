import { useEffect, useRef, useState } from 'react';

/**
 * IntersectionObserver-based reveal hook.
 * Returns a ref + a `revealed` boolean. Use with utility classes for fade/slide-up.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setRevealed(true);
      return;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setRevealed(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [options]);

  return { ref, revealed } as const;
}

/** Tailwind class helper for reveal-up animations */
export function revealClass(revealed: boolean, delayMs = 0): string {
  const base = 'transition-all duration-700 ease-out will-change-transform';
  const state = revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';
  const delay = delayMs ? `delay-[${delayMs}ms]` : '';
  return `${base} ${state} ${delay}`;
}
