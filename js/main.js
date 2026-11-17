(() => {
  const $ = (s, c = document) => c.querySelector(s) || document.createElement('div'), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  // intro
  const start = () => setTimeout(() => document.body.classList.add('loaded'), 500);
  document.readyState === 'complete' ? start() : addEventListener('load', start);

  // page transitions
  const curtain = $('.curtain');
  addEventListener('pageshow', () => curtain.classList.remove('in'));
  $$('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    if (!h || h[0] === '#' || h.startsWith('mailto') || a.target) return;
    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault(); curtain.classList.add('in');
      setTimeout(() => location.href = h, 650);
    });
  });

  // nav: sliding pill + mobile menu
  const nav = $('.nav'), pill = $('.pill'), links = $$('.nav li a');
  const moveTo = el => { if (!el) return; pill.style.width = el.offsetWidth + 'px'; pill.style.transform = `translateX(${el.offsetLeft}px)` };
  const current = $('.nav a[aria-current]');
  moveTo(current);
  links.forEach(l => { l.addEventListener('mouseenter', () => moveTo(l)); l.addEventListener('focus', () => moveTo(l)) });
  $('.nav ul').addEventListener('mouseleave', () => moveTo(current));
  addEventListener('resize', () => moveTo(current));
  document.fonts && document.fonts.ready.then(() => moveTo(current));
  addEventListener('load', () => moveTo(current));
  $('.menu').addEventListener('click', e => { const o = nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o) });
  // nav stays visible while scrolling; its compact state lives in scroll-fx.js

  // cursor + magnetic buttons
  const cur = $('.cur'); let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY });
  $$('a,button,.card').forEach(el => { el.addEventListener('mouseenter', () => cur.classList.add('big')); el.addEventListener('mouseleave', () => cur.classList.remove('big')) });
  if (fine && !reduce) $$('.mag').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px,${(e.clientY - r.top - r.height / 2) * .4}px)` });
    b.addEventListener('pointerleave', () => { b.style.transition = 'transform .6s cubic-bezier(.2,1.6,.4,1)'; b.style.transform = '' });
    b.addEventListener('pointerenter', () => b.style.transition = 'box-shadow .4s');
  });

  // hero: 3D tilt on the logo mark, parallax orbs, name drift
  const mark = $('.mark'), orbs = $$('.orb'), name = $('.name');
  let tx = 0, ty = 0, rx = 0, ry = 0;
  const hero = $('#hero');
  hero.addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2 });
  hero.addEventListener('pointerleave', () => { tx = ty = 0 });

  // scroll state
  let sy = 0;
  addEventListener('scroll', () => sy = scrollY, { passive: true });

  // lanyard card: spring pendulum, drag to swing
  const card = $('#card'); let ang = 18, vel = 0, drag = false, moved = false, startX = 0, startY = 0, tgt = 0;
  const px = e => (e.clientX - (card.parentElement.getBoundingClientRect().left + card.parentElement.offsetWidth / 2));
  const flipCard = () => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-expanded', String(flipped));
    card.querySelector('.card-back').setAttribute('aria-hidden', String(!flipped));
    card.querySelector('.card-back').inert = !flipped;
    card.querySelector('.card-front').setAttribute('aria-hidden', String(flipped));
    card.setAttribute('aria-label', flipped ? 'Contact QR code shown. Scan to add Desmond Amedzie. Click or press Enter to turn back.' : 'Digital contact card. Click or press Enter to reveal the contact QR code. Drag to swing it.');
  };
  card.addEventListener('pointerdown', e => { if (e.target.closest('a')) return; drag = true; moved = false; startX = e.clientX; startY = e.clientY; card.setPointerCapture(e.pointerId) });
  card.addEventListener('pointermove', e => { if (drag) { if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) moved = true; tgt = Math.max(-40, Math.min(40, px(e) / 5)) } });
  card.addEventListener('pointerup', () => { drag = false });
  card.addEventListener('pointercancel', () => { drag = false; moved = true });
  card.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    if (moved) { e.preventDefault(); moved = false; return }
    flipCard();
  });
  card.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) { e.preventDefault(); flipCard() }
  });
  const swing = new IntersectionObserver(([e]) => { if (e.isIntersecting && !drag) { ang = 24; vel = 0 } }, { threshold: .5 });
  swing.observe(card);


  // big footer word + ring respond to scroll
  const big = $('.big');

  // main loop
  const loop = () => {
    cx = lerp(cx, mx, .2); cy = lerp(cy, my, .2); cur.style.transform = `translate(${cx}px,${cy}px)`;
    if (!reduce) {
      rx = lerp(rx, ty * -14, .06); ry = lerp(ry, tx * 20, .06);
      mark.style.transform = `rotateX(${rx}deg) rotateY(${ry + Math.sin(performance.now() / 1500) * 4}deg) translateY(${sy * .12}px)`;
      orbs.forEach(o => { const d = +o.dataset.depth || 20; o.style.transform = `translate(${tx * d}px,${ty * d - sy * d * .004 * 10}px)` });
      name.style.transform = `translate(${tx * -14}px,${sy * .25}px)`;
      // spring
      const f = drag ? (tgt - ang) * .12 : -ang * .018;
      vel = (vel + f) * (drag ? .8 : .985); ang += vel; if (!drag) tgt = 0;
      card.style.transform = `rotate(${ang}deg)`;
      if (big) big.style.transform = `translateY(${Math.max(0, (innerHeight - big.getBoundingClientRect().top)) * -.04}px)`;
    }
    requestAnimationFrame(loop);
  };
  loop();

  // scroll progress + reveals + band velocity + hero fade
  const prog = $('.prog'), bandTrack = $('.band'), heroEls = [$('.hero-visual'), $('.hero-panel'), $('.hero-services')];
  $$('.about h2,.about p,.about .btns,.works .head,.works .rail,.works .dots,.talk h2 i,.talk .btn,.glass .cols>div,.rv,.pg-head h1,.pg-head p').forEach((el, k, all) => {
    el.dataset.r = el.matches('h2,h2 i,h1') ? 'mask' : '1';
    el.style.setProperty('--i', el.matches('.pillar,.cols>div,.rv') ? [...el.parentElement.children].indexOf(el) : 0);
  });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .15 });
  $$('[data-r]').forEach(el => io.observe(el));
  let last = 0;
  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${scrollY / max})`;
    const v = Math.max(-6, Math.min(6, (scrollY - last) * .15)); last = scrollY;
    bandTrack.style.transform = `rotate(-1.6deg) scale(1.04) skewX(${v}deg)`;
    const p = Math.min(1, scrollY / (innerHeight * .8)); if (!reduce) heroEls.forEach(e => e && (e.style.opacity = loadedOp(e, 1 - p)));
  }, { passive: true });
  const loadedOp = (e, v) => document.body.classList.contains('loaded') ? v : 0;

  // works carousel (coverflow). Redrawn when the admin's projects arrive (nst:projects).
  const rail = $('#rail'), dots = $('#dots'); let cur2 = 2, cards = [];
  if (rail) {
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const imgOf = w => window.NSTProjects ? NSTProjects.imgOf(w) : `assets/${w.img}.jpg`;
  const place = () => { if (!cards.length) return; const narrow = innerWidth < 700, w = cards[0].offsetWidth;
    cards.forEach((c, i) => { const o = i - cur2, a = Math.abs(o), step = w * (narrow ? .96 : .68), s = a ? Math.max(.66, 1 - a * .17) : 1;
      c.style.transform = `translateX(calc(-50% + ${o * step}px)) translateY(${a * 22}px) scale(${s}) rotateY(${o * -5}deg)`;
      const lim = narrow ? 1 : 2; c.style.opacity = a > lim ? 0 : 1 - a * .3; c.style.zIndex = 10 - a; c.style.pointerEvents = a > lim ? 'none' : 'auto'; c.style.filter = a ? `brightness(${1 - a * .18})` : 'none'; c.classList.toggle('act', !a) });
    [...dots.children].forEach((b, i) => b.classList.toggle('on', i === cur2)) };
  const go = i => { if (!cards.length) return; cur2 = Math.max(0, Math.min(cards.length - 1, i)); place() };
  const buildRail = () => {
    rail.textContent = ''; dots.textContent = ''; const W = window.WORKS || [];
    if (!W.length) {
      const empty = document.createElement('p'); empty.className = 'project-empty rail-empty'; empty.textContent = 'Projects are on the way. Check back soon.';
      rail.appendChild(empty); cards = []; return;
    }
    rail.innerHTML = '<button class="arrow l" aria-label="Previous">&#8249;</button><button class="arrow r" aria-label="Next">&#8250;</button>';
    $('.arrow.l', rail).onclick = () => go(cur2 - 1); $('.arrow.r', rail).onclick = () => go(cur2 + 1);
    cards = W.map((w, i) => { const d = document.createElement('article'); d.className = 'wc';
      d.innerHTML = `<div class="shot"><img src="${esc(imgOf(w))}" alt="${esc(w.t)}" loading="lazy"><span class="tag">${esc(w.tag)}</span></div><h3>${esc(w.t)}</h3><p>${esc(w.d)}</p><div class="row"><span>${esc(w.year || '2026')}</span><a class="btn" href="project.html?id=${encodeURIComponent(w.id)}">View project</a></div>`;
      d.addEventListener('click', () => go(i)); rail.appendChild(d);
      const b = document.createElement('button'); b.setAttribute('aria-label', 'Project ' + (i + 1)); b.onclick = () => go(i); dots.appendChild(b); return d });
    cur2 = Math.max(0, Math.min(cards.length - 1, cur2)); place();
  };
  let sx = null; rail.addEventListener('pointerdown', e => sx = e.clientX);
  addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(cur2 + (e.clientX < sx ? 1 : -1)); sx = null });
  addEventListener('resize', place); buildRail(); document.addEventListener('nst:projects', buildRail);
  }

  // Accra clock
  const clock = $('#clock');
  const tick = () => clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Accra', hour: '2-digit', minute: '2-digit' });
  tick(); setInterval(tick, 3e4);
})();


/* Footer social links come from js/chat-config.js; an unfilled one is hidden, never a dead "#" link. */
(() => {
  const soc = ((window.NST_CHAT || {}).owner || {}).social || {};
  const map = { gh: 'github', li: 'linkedin', x: 'x' };
  document.querySelectorAll('a.wi[href="#"]').forEach(a => {
    const k = (a.querySelector('.fic') && [...a.querySelector('.fic').classList].map(c => c.replace('fic-', '')).find(c => map[c])) || '';
    const url = soc[map[k]] || '';
    if (/^https:\/\//i.test(url)) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer' } else a.closest('li').remove();
  });
})();
