/* scroll-fx.js: sticky nav state, extra reveals and parallax on every page. */
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = $('.nav');

  /* ---- extra reveals (the base reveal styles live in style.css) ---- */
  const tag = (el, kind, i) => {
    if (!el || el.hasAttribute('data-r') || el.closest('[data-r]')) return null;
    el.dataset.r = kind; el.style.setProperty('--i', i || 0); return el;
  };
  const found = [];
  const add = (sel, kind, stagger) => $$(sel).forEach(el => { const i = stagger ? [...el.parentElement.children].indexOf(el) : 0; const t = tag(el, kind, Math.min(i, 6)); t && found.push(t) });
  add('.sheet header', '1');
  $$('.sheet section').forEach(sec => [...sec.children].forEach((c, i) => { const t = tag(c, c.matches('h2') ? 'mask' : '1', Math.min(i, 4)); t && found.push(t) }));
  add('.cwrap .fld', 'zoom', true);
  add('.cwrap .opts', '1');
  add('.filters', '1');
  add('.meta4>*', 'zoom', true);
  add('.story>*', '1', true);
  add('.pn>*', 'zoom', true);
  add('.crumb', '1');
  add('.nf>*', '1', true);
  add('.steps>*', 'zoom', true);
  add('.cd.rv, .mini .cd', 'zoom', true);
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  found.forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---- scroll-linked frame: nav state, parallax ---- */
  const feet = $$('.foot .bl'), head = $('.pg-head'), pj = $('.pj-shot');
  const vis = r => r.bottom > -80 && r.top < innerHeight + 80;
  const frame = () => {
    const y = scrollY;
    nav && nav.classList.toggle('scrolled', y > 36);
    if (reduce) return;
    if (head) {
      const h = head.offsetHeight || 1, p = Math.min(1, y / h);
      const h1 = $('h1', head), pp = $(':scope>p', head);
      if (h1) h1.style.translate = `0 ${y * .16}px`;
      if (pp) pp.style.translate = `0 ${y * .09}px`;
      head.style.opacity = String(1 - p * .8);
    }
    feet.forEach((b, k) => { const r = b.parentElement.getBoundingClientRect(); if (!vis(r)) return; const p = (innerHeight - r.top) / (innerHeight + r.height); b.style.translate = `0 ${(p - .5) * (k % 2 ? 90 : -90)}px` });
    if (pj) { const r = pj.getBoundingClientRect(); if (vis(r)) pj.style.translate = `0 ${((r.top + r.height / 2) / innerHeight - .5) * -26}px` }
    $$('.pc .shot img').forEach(im => { const r = im.parentElement.getBoundingClientRect(); if (!vis(r)) return; im.style.translate = `0 ${((r.top + r.height / 2) / innerHeight - .5) * -22}px` });
  };
  let tick = false;
  const queue = () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; frame() }) } };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue); frame();

  /* ---- "Back to top" works on pages that have no #hero ---- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="#hero"]'); if (!a || document.getElementById('hero')) return;
    e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();
