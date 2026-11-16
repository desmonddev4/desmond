(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WA = '233509459009', MAIL = 'damedzie4@gmail.com';

  // scroll-scrubbed words
  const scr = $$('[data-scrub]').map(sc => { sc.innerHTML = sc.textContent.trim().split(' ').map(w => `<span>${w}</span>`).join(' '); return [sc, $$('span', sc)] });
  const upd = () => scr.forEach(([sc, sp]) => { const r = sc.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (innerHeight * .5 + r.height))); const n = Math.round(p * sp.length); sp.forEach((s, i) => s.classList.toggle('on', i < n)) });

  // scroll-filled progress line
  const line = $('.line i'), steps = $('.steps');
  const fill = () => { if (!line) return; const r = steps.getBoundingClientRect(); line.style.transform = `scaleX(${Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (r.height + innerHeight * .3)))})` };
  addEventListener('scroll', () => { upd(); fill() }, { passive: true }); upd(); fill();

  // work grid + filters + lightbox (redrawn when the admin's projects arrive)
  const grid = $('#grid');
  if (grid) {
    const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const imgOf = w => window.NSTProjects ? NSTProjects.imgOf(w) : `assets/${w.img}.jpg`;
    const fl = $('#filters'), lb = $('.lb'), im = $('img', lb);
    let active = 'All';
    const draw = () => {
      const W = window.WORKS || [], tags = [...new Set(W.map(w => w.tag))];
      if (active !== 'All' && !tags.includes(active)) active = 'All';
      grid.innerHTML = W.map((w, i) => `<article class="pc rv in${active === 'All' || w.tag === active ? '' : ' gone'}" data-t="${esc(w.tag)}" data-i="${i}" tabindex="0" role="button" aria-label="View ${esc(w.t)} full size"><div class="shot"><img src="${esc(imgOf(w))}" alt="${esc(w.t)}" loading="lazy"></div><div class="meta"><h3>${esc(w.t)}</h3><span class="tg">${esc(w.tag)}</span></div><p>${esc(w.d)} <a class="more" href="project.html?id=${encodeURIComponent(w.id)}">Read case study</a></p></article>`).join('');
      fl.innerHTML = ['All', ...tags].map(t => `<button class="f${t === active ? ' on' : ''}" data-f="${esc(t)}">${esc(t)}</button>`).join('');
    };
    fl.addEventListener('click', e => { const b = e.target.closest('.f'); if (!b) return; active = b.dataset.f;
      $$('.f', fl).forEach(x => x.classList.toggle('on', x === b));
      $$('.pc', grid).forEach(c => { const show = active === 'All' || c.dataset.t === active; c.classList.add('out'); setTimeout(() => { c.classList.toggle('gone', !show); if (show) requestAnimationFrame(() => c.classList.remove('out')) }, 320) }) });
    const open = async c => {
      const w = (window.WORKS || [])[+c.dataset.i]; if (!w) return;
      im.src = imgOf(w); lb.classList.add('on');
      if (w.custom && window.NSTProjects) { const big = await NSTProjects.full(w.id); if (big && lb.classList.contains('on')) im.src = big }
    };
    grid.addEventListener('click', e => { if (e.target.closest('a')) return; const c = e.target.closest('.pc'); c && open(c) });
    grid.addEventListener('keydown', e => { if (e.key === 'Enter') { const c = e.target.closest('.pc'); c && open(c) } });
    lb.addEventListener('click', () => lb.classList.remove('on'));
    addEventListener('keydown', e => e.key === 'Escape' && lb.classList.remove('on'));
    draw(); document.addEventListener('nst:projects', draw);
  }

  // services accordion
  const svc = $$('.svc');
  const setOpen = (s, o) => { s.classList.toggle('open', o); $('.sh', s).setAttribute('aria-expanded', o); $('.sb', s).style.maxHeight = o ? $('.sb', s).scrollHeight + 'px' : 0 };
  svc.forEach((s, i) => { $('.sh', s).addEventListener('click', () => svc.forEach(x => setOpen(x, x === s && !s.classList.contains('open')))); if (i === 0) setTimeout(() => setOpen(s, true), 1400) });

  // contact form: hands the message to WhatsApp or email
  const form = $('#cf'), toast = $('.toast');
  const say = m => { toast.textContent = m; toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 3200) };
  if (form) {
    const read = () => { const d = new FormData(form); return { n: (d.get('name') || '').trim(), e: (d.get('email') || '').trim(), t: d.get('type') || 'Website', m: (d.get('msg') || '').trim() } };
    const ok = d => { let good = true; [['name', d.n], ['msg', d.m]].forEach(([k, v]) => { const el = form.elements[k]; el.classList.toggle('err', !v); if (!v) good = false }); if (!good) say('Add your name and a short message first.'); return good };
    const text = d => `Hi Desmond, I'm ${d.n}.\nProject: ${d.t}\n${d.m}${d.e ? '\nReply to: ' + d.e : ''}`;
    $('#wa').addEventListener('click', () => { const d = read(); if (ok(d)) { open(`https://wa.me/${WA}?text=${encodeURIComponent(text(d))}`, '_blank'); say('Opening WhatsApp') } });
    $('#em').addEventListener('click', () => { const d = read(); if (ok(d)) { location.href = `mailto:${MAIL}?subject=${encodeURIComponent('New project: ' + d.t)}&body=${encodeURIComponent(text(d))}`; say('Opening your email app') } });
    form.addEventListener('submit', e => e.preventDefault());
  }
})();
