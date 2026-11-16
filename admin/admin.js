/* admin.js: shell (sticky sidebar + header), sign-in gate, data layer and chart helpers.
   Page screens live in pages.js. Uses the same transport as the inbox (NSTCore), so
   it runs in demo mode with no server and goes live as soon as chat-config.js is filled in. */
(() => {
  'use strict';
  const C = window.NSTCore, A = C.admin, cfg = window.NST_CHAT || {}, own = cfg.owner || {};
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch { return d } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- icons ---------- */
  const S = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ic = {
    dash: S('<rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="2"/>'),
    chat: S('<path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/>'),
    inbox: S('<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19v-6l2.5-8Z"/>'),
    users: S('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.2a6.5 6.5 0 0 1 3 5.8"/>'),
    bolt: S('<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z"/>'),
    clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    folder: S('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-10Z"/>'),
    chart: S('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    cog: S('<circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h0a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>'),
    bell: S('<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    search: S('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    menu: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    arrow: S('<path d="M7 17 17 7M8 7h9v9"/>'),
    left: S('<path d="m15 5-7 7 7 7"/>'), right: S('<path d="m9 5 7 7-7 7"/>'),
    check: S('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    out: S('<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 8l4 4-4 4M20 12H9"/>'),
    down: S('<path d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M5 20h14"/>'),
    refresh: S('<path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>'),
    globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    eye: S('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
    warn: S('<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.5h.01"/>'),
    plus: S('<path d="M12 5v14M5 12h14"/>'),
    edit: S('<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14.5 7.5 3 3"/>'),
    target: S('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    trash: S('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>')
  };
  const png = (n, cls = '') => `<img class="${cls}" src="../assets/icons/${n}.png" alt="" width="26" height="26" decoding="async">`;

  /* ---------- navigation ---------- */
  const NAV = [
    { id: 'overview', href: '/admin', label: 'Overview', img: 'home' },
    { id: 'conversations', href: '/admin/conversations', label: 'Conversations', img: 'chatbot', badge: true },
    { id: 'leads', href: '/admin/leads', label: 'Leads', img: 'mail' },
    { id: 'projects', href: '/admin/projects', label: 'Projects', img: 'work' },
    { id: 'audience', href: '/admin/audience', label: 'Audience', img: 'about' },
    { id: 'system', href: '/admin/system', label: 'System', svg: 'cog' }
  ];
  const SHORT = [
    { href: '/', label: 'View site', img: 'service', ext: 1 },
    { href: '/inbox', label: 'Live inbox', img: 'chatbot', ext: 1 },
    { href: 'https://wa.me/' + (own.whatsapp || '233509459009'), label: 'WhatsApp', img: 'whatsapp', ext: 1, blank: 1 },
    { href: '/cv', label: 'My CV', img: 'cv', ext: 1 }
  ];
  const pi = n => n.img ? `<span class="pi">${png(n.img)}</span>` : `<span class="pi sv">${ic[n.svg]}</span>`;

  /* ---------- data ---------- */
  const D = { chats: [], sample: false, ready: false, owner: {}, subs: new Set() };
  const seen = () => lsGet('nst_seen', {});
  const nameOf = c => (c && c.name) || 'Guest';
  const unread = c => c.lastFrom === 'v' && (c.lastAt || 0) > (seen()[c.cid] || 0);
  const H = 36e5, DAY = 864e5;
  const makeSample = () => {
    const now = Date.now(); let s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const hand = [
      ['Kofi Mensah', 'Project', 'Hi Desmond, I’d like to start a project: a booking site for my guesthouse in Kumasi.', 'v', .4],
      ['Ama Boateng', 'Project', 'Can you build an online shop that takes MoMo payments?', 'a', 3],
      ['Yaw Owusu', 'Question', 'Do you work with IoT sensors for farms?', 'v', 5],
      ['Akosua Frimpong', 'Project', 'We need a dashboard for our logistics fleet.', 'a', 20],
      ['Kwame Adjei', 'Question', 'What’s your usual timeline for a five page site?', 'a', 30],
      ['Efua Quaye', 'Project', 'Looking for a portfolio site with smooth animations.', 'v', 47],
      ['Nana Osei', 'Project', 'The proposal looks good. When can we start?', 'v', 70],
      ['Abena Darko', 'Question', 'Do you offer maintenance after launch?', 'a', 96],
      ['Kojo Asante', 'Project', 'Need an API for our school fees app.', 'a', 120],
      ['Esi Mensima', 'Question', 'Are you free for a quick call tomorrow?', 'v', 150],
      ['Yaa Serwaa', 'Project', 'A storefront like Lynne’s, but for hair products.', 'a', 200],
      ['Samuel Tetteh', 'Question', 'Can you share your CV?', 'a', 260],
      ['Adwoa Pokua', 'Project', 'Restaurant menu site with online ordering.', 'a', 310],
      ['Fiifi Ansah', 'Question', 'Which stack do you prefer for a startup MVP?', 'v', 380]
    ];
    const names = ['Kojo Boadu', 'Maame Efua', 'Kwesi Armah', 'Araba Quansah', 'Ebo Sam', 'Naa Lamiokor', 'Yaw Gyasi', 'Akua Nyarko', 'Kofi Annan Jr', 'Selina Ofori', 'Ike Baffoe', 'Dede Aidoo'];
    const texts = [['Project', 'Can you quote for a company website?'], ['Question', 'Do you work with Next.js?'], ['Project', 'I want an admin panel for my clinic.'], ['Question', 'How do payments work on your shops?'], ['Project', 'Landing page for a product launch.']];
    const rows = hand.map((h, i) => ({ cid: 'sample-' + i, name: h[0], topic: h[1], lastText: h[2], lastFrom: h[3], lastAt: now - h[4] * H, email: h[0].toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com' }));
    for (let i = 0; i < 16; i++) { const t = texts[i % texts.length]; rows.push({ cid: 'sample-x' + i, name: names[i % names.length], topic: t[0], lastText: t[1], lastFrom: 'a', lastAt: now - (400 + i * 26 + r() * 20) * H }) }
    return rows;
  };
  const emit = () => D.subs.forEach(f => f(D));
  const setRows = rows => {
    const real = rows.filter(x => x && x.lastAt);
    const sig = real.map(c => c.cid + c.lastAt + c.lastFrom).sort().join('|');
    if (D.ready && sig === D.sig) return;
    D.sig = sig; D.sample = !real.length; D.chats = (D.sample ? makeSample() : real).sort((a, b) => b.lastAt - a.lastAt);
    D.ready = true; badge(); emit();
  };
  const stats = (list = D.chats) => {
    const now = Date.now(), wk = list.filter(c => now - c.lastAt < 7 * DAY).length, pw = list.filter(c => { const d = now - c.lastAt; return d >= 7 * DAY && d < 14 * DAY }).length;
    const waiting = list.filter(c => c.lastFrom === 'v'), oldest = waiting.length ? Math.max(...waiting.map(c => now - c.lastAt)) : 0;
    return { total: list.length, awaiting: waiting.length, replied: list.length - waiting.length, unread: list.filter(unread).length, week: wk, prev: pw,
      projects: list.filter(c => c.topic === 'Project').length, questions: list.filter(c => c.topic !== 'Project').length,
      rate: list.length ? Math.round((list.length - waiting.length) / list.length * 100) : 0, oldest };
  };
  const daily = (days, list = D.chats) => {
    const out = [], now = new Date(); now.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) { const t = now.getTime() - i * DAY; out.push({ t, label: new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' }), v: 0, a: 0 }) }
    list.forEach(c => { const k = Math.floor((c.lastAt - out[0].t) / DAY); if (k >= 0 && k < days) out[k][c.lastFrom === 'a' ? 'a' : 'v']++ });
    return out;
  };
  const hours = (list = D.chats) => { const g = Array.from({ length: 7 }, () => Array(12).fill(0)); list.forEach(c => { const d = new Date(c.lastAt); g[(d.getDay() + 6) % 7][Math.floor(d.getHours() / 2)]++ }); return g };
  const ago = t => { const d = Date.now() - t; return d < 6e4 ? 'now' : d < H ? Math.floor(d / 6e4) + 'm ago' : d < DAY ? Math.floor(d / H) + 'h ago' : Math.floor(d / DAY) + 'd ago' };
  const dur = ms => ms < H ? Math.max(1, Math.round(ms / 6e4)) + ' min' : ms < DAY ? Math.round(ms / H) + ' hr' : (ms / DAY).toFixed(ms < 10 * DAY ? 1 : 0).replace('.0', '') + ' days';
  const av = n => 'av a' + (1 + ([...nameOf({ name: n })].reduce((a, c) => a + c.charCodeAt(0), 0) % 5));
  const ini = n => (Array.from((n || '').trim())[0] || '?').toUpperCase();
  const LEADS = ['new', 'talking', 'proposal', 'won'];
  const leadStage = c => { const m = lsGet('nst_admin_leads', {}); if (m[c.cid]) return m[c.cid]; if (c.cid === 'sample-6') return 'proposal'; if (c.cid === 'sample-8' || c.cid === 'sample-10') return 'won'; if (c.cid.startsWith('sample-x')) return ['won', 'proposal', 'talking', 'won'][+c.cid.slice(8) % 4]; return c.lastFrom === 'a' ? 'talking' : 'new' };

  /* ---------- small UI helpers ---------- */
  let tt = 0;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200) };
  const countUp = (n, to, f = v => Math.round(v).toLocaleString()) => {
    if (reduce || !isFinite(to)) { n.textContent = f(to); return }
    const t0 = performance.now(), d = 1100; const step = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); n.textContent = f(to * e); k < 1 && requestAnimationFrame(step) }; requestAnimationFrame(step);
  };
  const countAll = (root, anim = true) => $$('[data-n]', root).forEach(n => { const to = +n.dataset.n, suf = n.dataset.s || '', f = v => Math.round(v).toLocaleString() + suf; anim ? countUp(n, to, f) : (n.textContent = f(to)) });
  document.addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.card'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px') }, { passive: true });
  const stagger = root => $$('.grid > *', root).forEach((n, i) => n.style.setProperty('--i', Math.min(i, 10)));
  const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 500) };

  /* ---------- charts (plain SVG, no library) ---------- */
  let uid = 0;
  const smooth = pts => pts.map((p, i) => i ? `C${(pts[i - 1][0] + p[0]) / 2},${pts[i - 1][1]} ${(pts[i - 1][0] + p[0]) / 2},${p[1]} ${p[0]},${p[1]}` : `M${p[0]},${p[1]}`).join('');
  const area = (root, { labels, series, h = 250 }) => {
    const id = 'g' + (++uid), W = 720, pl = 30, pr = 8, pt = 12, pb = 26, n = labels.length, mx = Math.max(3, ...series.flatMap(s => s.values));
    const step = mx > 40 ? 10 : mx > 16 ? 5 : mx > 8 ? 2 : 1, top = Math.ceil(mx / step) * step;
    const X = i => pl + (W - pl - pr) * (n < 2 ? .5 : i / (n - 1)), Y = v => pt + (h - pt - pb) * (1 - v / top);
    const every = Math.ceil(n / 7);
    let g = '';
    for (let v = 0; v <= top; v += step) g += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pl - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
    labels.forEach((l, i) => { if (i % every === 0 || i === n - 1) g += `<text x="${X(i)}" y="${h - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(l)}</text>` });
    const defs = series.map((s, k) => `<linearGradient id="${id}f${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".34"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`).join('');
    const paths = series.map((s, k) => { const pts = s.values.map((v, i) => [X(i), Y(v)]), d = smooth(pts); return `<path d="${d}L${X(n - 1)},${h - pb}L${X(0)},${h - pb}Z" fill="url(#${id}f${k})" class="fa"/><path class="ln" pathLength="1" d="${d}" stroke="${s.color}"/>` }).join('');
    const pts = series.map(s => `<circle class="pt" r="5.5" fill="#fff" stroke="${s.color}" stroke-width="3"/>`).join('');
    root.classList.add('chart'); root.innerHTML = `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="Chart"><defs>${defs}</defs>${g}${paths}<line class="guide" y1="${pt}" y2="${h - pb}"/>${pts}<rect class="hit" x="${pl}" y="0" width="${W - pl - pr}" height="${h}" fill="transparent"/></svg><div class="tip"></div>`;
    const svg = $('svg', root), tip = $('.tip', root), guide = $('.guide', root), dots = $$('.pt', root), lines = $$('.ln', root), fills = $$('.fa', root);
    if (!reduce) { lines.forEach(l => { l.style.strokeDasharray = 1; l.style.strokeDashoffset = 1 }); fills.forEach(f => { f.style.opacity = 0 }); requestAnimationFrame(() => requestAnimationFrame(() => { lines.forEach(l => { l.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)'; l.style.strokeDashoffset = 0 }); fills.forEach(f => { f.style.transition = 'opacity 1.2s .3s'; f.style.opacity = 1 }) })) }
    const at = e => { const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, i = Math.max(0, Math.min(n - 1, Math.round((x - pl) / (W - pl - pr) * (n - 1))));
      root.classList.add('hv'); guide.setAttribute('x1', X(i)); guide.setAttribute('x2', X(i)); dots.forEach((d, k) => { d.setAttribute('cx', X(i)); d.setAttribute('cy', Y(series[k].values[i])) });
      tip.innerHTML = `<b>${esc(labels[i])}</b>` + series.map(s => `<i style="--c:${s.color}">${esc(s.name)}: <strong style="color:#fff;margin-left:auto">${s.values[i]}</strong></i>`).join('');
      tip.style.left = Math.max(70, Math.min(r.width - 70, X(i) / W * r.width)) + 'px'; tip.style.top = '4px'; tip.classList.add('on') };
    $('.hit', root).addEventListener('pointermove', at); $('.hit', root).addEventListener('pointerdown', at);
    root.addEventListener('pointerleave', () => { root.classList.remove('hv'); tip.classList.remove('on') });
  };
  const donut = (root, segs, big, small) => {
    const R = 60, CI = 2 * Math.PI * R, tot = segs.reduce((a, s) => a + s.value, 0) || 1; let off = 0;
    const arcs = segs.map(s => { const L = s.value / tot * CI, gap = segs.length > 1 && s.value ? 6 : 0, o = off; off += L; return `<circle cx="80" cy="80" r="${R}" stroke="${s.color}" data-l="${Math.max(0, L - gap)}" data-o="${-o}" stroke-dasharray="0 ${CI}" stroke-dashoffset="${-o}"/>` }).join('');
    root.innerHTML = `<div class="dn"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="${R}" stroke="#7b7cff1c"/>${arcs}</svg><div class="mid"><b>${esc(big)}</b><small>${esc(small)}</small></div></div>`;
    const go = () => $$('circle[data-l]', root).forEach(c => { c.setAttribute('stroke-dasharray', `${c.dataset.l} ${CI}`) });
    reduce ? go() : requestAnimationFrame(() => requestAnimationFrame(go));
  };
  const bars = (root, rows, fmt = v => v) => {
    const mx = Math.max(1, ...rows.map(r => r.value));
    root.classList.add('hb'); root.innerHTML = rows.map(r => `<div><span title="${esc(r.label)}">${esc(r.label)}</span><em><i data-w="${r.value / mx * 100}"></i></em><b>${esc(fmt(r.value))}</b></div>`).join('');
    const go = () => $$('i[data-w]', root).forEach(i => { i.style.width = i.dataset.w + '%' }); reduce ? go() : requestAnimationFrame(() => requestAnimationFrame(go));
  };
  const sparkSvg = vals => { const w = 100, h = 40, mx = Math.max(1, ...vals), P = vals.map((v, i) => [i / Math.max(1, vals.length - 1) * w, h - 4 - v / mx * (h - 10)]), d = smooth(P); return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path class="fa" d="${d}L${w},${h}L0,${h}Z"/><path d="${d}"/></svg>` };
  const heat = (root, grid) => {
    const mx = Math.max(1, ...grid.flat()), days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let h = '<span></span>' + Array.from({ length: 12 }, (_, i) => `<span class="hh">${i % 2 ? '' : (i * 2 % 12 || 12) + (i < 6 ? 'a' : 'p')}</span>`).join('');
    grid.forEach((row, d) => { h += `<span>${days[d]}</span>` + row.map((v, i) => `<i class="hc" style="--a:${(.07 + v / mx * .8).toFixed(2)}" title="${days[d]} ${i * 2}:00 to ${i * 2 + 2}:00: ${v}"></i>`).join('') });
    root.classList.add('hm'); root.innerHTML = h;
  };

  /* ---------- shell ---------- */
  const badge = () => { const n = stats().unread; $$('[data-badge]').forEach(b => { b.textContent = n; b.hidden = !n }) };
  const buildShell = (page, title, sub) => {
    document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="gsp" x1="0" x2="1"><stop offset="0" stop-color="#a27bff"/><stop offset="1" stop-color="#6e93ff"/></linearGradient><linearGradient id="gsf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b7cff" stop-opacity=".28"/><stop offset="1" stop-color="#7b7cff" stop-opacity="0"/></linearGradient></defs></svg>');
    $('#side').innerHTML = `<div class="side-in"><i class="bl" style="width:240px;height:240px;left:-90px;top:-60px;background:#1d3fff"></i><i class="bl" style="width:220px;height:220px;right:-100px;bottom:80px;background:#3a1fc0"></i>
      <a class="sbrand" href="/admin" aria-label="Admin overview"><img src="../assets/logo-mark.png" alt=""><span><b>Nexus Sync</b><small>Admin console</small></span></a>
      <nav class="snav" aria-label="Admin"><h4>Manage</h4><ul>${NAV.map(n => `<li><a class="pb" href="${n.href}"${n.id === page ? ' aria-current="page"' : ''}>${pi(n)}<span>${n.label}</span>${n.badge ? '<b class="n" data-badge hidden>0</b>' : ''}</a></li>`).join('')}</ul>
      <h4>Shortcuts</h4><ul>${SHORT.map(n => `<li><a class="pb" href="${n.href}"${n.blank ? ' target="_blank" rel="noopener"' : ''}>${pi(n)}<span>${n.label}</span></a></li>`).join('')}</ul></nav>
      <div class="sfoot"><div class="me" data-on="false" id="me"><span class="av">${esc(ini(own.name || 'D'))}</span><span><b>${esc(own.name || 'Desmond')}</b><small><i class="dot"></i><span id="meSt">Checking…</span></small></span></div>
      <a class="pb" href="#" id="out"><span class="pi sv">${ic.out}</span><span>Sign out</span></a></div></div>`;
    $('#top').innerHTML = `<button class="ib menu" id="mbtn" aria-label="Open menu" aria-expanded="false">${ic.menu}</button>
      <div class="ttl"><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>
      <span class="tag-s" id="sampleTag" hidden>${ic.warn.replace('<svg', '<svg width="15" height="15" style="stroke:#8a5a00;fill:none;stroke-width:2.2"')}Sample data</span>
      <label class="srch">${ic.search}<input id="gs" type="search" placeholder="Search conversations" aria-label="Search conversations" autocomplete="off"></label>
      <label class="avail" data-on="false" id="av"><i class="dot"></i><span class="lbl">Available</span><input class="sw" id="avSw" type="checkbox" role="switch" aria-label="Show me as available"></label>
      <a class="ib" href="/admin/conversations?f=awaiting" aria-label="Awaiting reply">${ic.bell}<b class="bd" data-badge hidden>0</b></a>
      <span class="av sm" title="${esc(own.name || 'Desmond')}">${esc(ini(own.name || 'D'))}</span>`;
    const side = $('#side'), scrim = $('#scrim'), mb = $('#mbtn'), close = () => { side.classList.remove('open'); scrim.classList.remove('on'); mb.setAttribute('aria-expanded', 'false') };
    mb.addEventListener('click', () => { const o = side.classList.toggle('open'); scrim.classList.toggle('on', o); mb.setAttribute('aria-expanded', o) });
    scrim.addEventListener('click', close); document.addEventListener('keydown', e => e.key === 'Escape' && close());
    $$('.pb', side).forEach(a => a.addEventListener('click', close));
    const top = $('#top'), sc = () => top.classList.toggle('scrolled', scrollY > 24); addEventListener('scroll', sc, { passive: true }); sc();
    $('#gs').addEventListener('keydown', e => { if (e.key === 'Enter' && page !== 'conversations') { const q = e.target.value.trim(); location.href = '/admin/conversations' + (q ? '?q=' + encodeURIComponent(q) : '') } });
    $('#out').addEventListener('click', async e => { e.preventDefault(); try { await A.presence(false) } catch {} A.logout(); location.replace('/admin/login') });
    const sw = $('#avSw'); sw.checked = lsGet('nst_avail', true);
    const paintAv = () => { $('#av').dataset.on = sw.checked; $('#me').dataset.on = sw.checked; $('#meSt').textContent = sw.checked ? 'Available to visitors' : 'Away'; $('.lbl', $('#av')).textContent = sw.checked ? 'Available' : 'Away' };
    const pulse = () => A.presence(sw.checked).catch(() => {});
    sw.addEventListener('change', () => { lsSet('nst_avail', sw.checked); paintAv(); pulse(); toast(sw.checked ? 'Visitors now see you as available' : 'Visitors now see you as away') });
    paintAv(); pulse(); setInterval(pulse, 30000);
  };
  // No session? Send them to the one sign-in page and bring them back afterwards.
  const toLogin = () => { const page = document.body.dataset.page || 'overview'; location.replace('/admin/login?next=' + encodeURIComponent((page === 'overview' ? 'index' : page) + location.search)) };

  const start = async pages => {
    const body = document.body, id = body.dataset.page, P = pages[id]; if (!P) return;
    const ok = (!C.live && !C.misconfigured) || await A.ready().catch(() => false);
    if (!ok) return toLogin();
    buildShell(id, body.dataset.title, body.dataset.sub);
    const view = $('#view'); body.classList.add('boot'); setTimeout(() => body.classList.remove('boot'), 1600);
    const q = new URLSearchParams(location.search).get('q'); if (q) $('#gs').value = q;
    const ctx = { D, stats, daily, hours, ago, dur, av, ini, nameOf, unread, esc, ic, png, lsGet, lsSet, toast, countAll, area, donut, bars, heat, sparkSvg, download, leadStage, LEADS, stagger, C, A, own, $, $$ };
    let first = true;
    const paint = () => { $('#sampleTag').hidden = !D.sample || !P.usesChats; P.render(view, ctx, first); countAll(view, first); stagger(view); first = false };
    ctx.repaint = paint;
    if (P.usesChats === false) { paint(); D.ready = true; badge() }
    D.subs.add(() => { if (D.ready && P.usesChats !== false) paint(); });
    C.presence(o => { D.owner = o || {}; P.onOwner && P.onOwner(D.owner, ctx) });
    if (P.usesChats !== false) view.innerHTML = '<div class="empty">Loading…</div>';
    A.watchIndex(setRows);
  };
  window.ADM = { start, D };
})();
