'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * The behaviour that is about the page rather than about the data:
 * scroll reveals, the seamless marquee, the reading progress bar and
 * the gentle float on project plates. Everything here is skipped when
 * the visitor asks for reduced motion.
 */
export default function Effects() {
  // the layout survives client side navigation, so this has to run again
  // for every page, otherwise the new page never gets observed
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealables = document.querySelectorAll<HTMLElement>('[data-reveal], .splitline');

    let io: IntersectionObserver | null = null;
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach((el) => el.classList.add('is-in'));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            io?.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
      revealables.forEach((el) => io?.observe(el));
    }


    // Safety net: the reveal is decoration, the words are not. If the
    // observer never gets to run, because the tab was opened in the
    // background or the browser throttled it, show everything anyway.
    const revealNow = () => {
      revealables.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
      });
    };
    const failsafe = window.setTimeout(revealNow, 2500);
    const onVisible = () => {
      if (document.visibilityState === 'visible') revealNow();
    };
    document.addEventListener('visibilitychange', onVisible);

    // clone the ticker so the loop has no seam
    const clones: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('.marquee').forEach((bar) => {
      if (bar.dataset.cloned) return;
      const track = bar.querySelector('.marquee__track');
      if (!track) return;
      const clone = track.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      bar.appendChild(clone);
      bar.dataset.cloned = 'yes';
      clones.push(clone);
    });

    const bar = document.querySelector<HTMLElement>('.progress');
    const article = document.querySelector<HTMLElement>('[data-progress-source]');
    const tick = () => {
      if (!bar || !article) return;
      const box = article.getBoundingClientRect();
      const total = box.height - window.innerHeight;
      const done = total > 0 ? Math.min(Math.max(-box.top / total, 0), 1) : 0;
      bar.style.width = `${(done * 100).toFixed(2)}%`;
    };

    const floaters = Array.from(document.querySelectorAll<HTMLElement>('[data-float]'));
    const canFloat = floaters.length > 0 && !reduced && window.matchMedia('(min-width: 901px)').matches;
    let ticking = false;
    const move = () => {
      const mid = window.innerHeight / 2;
      floaters.forEach((el) => {
        const box = el.getBoundingClientRect();
        const offset = (box.top + box.height / 2 - mid) / mid;
        const depth = parseFloat(el.dataset.float || '1');
        el.style.transform = `translate3d(0, ${(offset * depth * -22).toFixed(2)}px, 0)`;
      });
      ticking = false;
    };
    const onScroll = () => {
      tick();
      if (!canFloat || ticking) return;
      ticking = true;
      window.requestAnimationFrame(move);
    };

    tick();
    if (canFloat) move();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.clearTimeout(failsafe);
      document.removeEventListener('visibilitychange', onVisible);
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clones.forEach((clone) => clone.remove());
      document.querySelectorAll<HTMLElement>('.marquee').forEach((el) => delete el.dataset.cloned);
    };
  }, [pathname]);

  return null;
}
