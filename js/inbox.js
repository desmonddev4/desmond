/* inbox.js: owner inbox. Sign in, see every visitor conversation, reply live. */
(() => {
  const C = window.NSTCore, UI = window.NSTUI, A = C.admin, { i } = UI;
  const $ = s => document.querySelector(s);
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch { return d } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} };
  const mobile = matchMedia('(max-width:860px)'), coarse = matchMedia('(pointer:coarse)');
  const app = $('#app'), login = null, list = $('#list'), ta = $('#ta'), sendBtn = $('#send');
  const bell = '<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>';
  $('#back').innerHTML = i.back; $('#delc').innerHTML = i.trash; $('#cbtn').innerHTML = i.plus; sendBtn.innerHTML = i.send; $('#menuBtn').innerHTML = i.dots; $('#notif').innerHTML = bell;
  const q = $('#q'), filtersEl = $('#filters'), menu = $('#menu'), menuBtn = $('#menuBtn');
  let filter = 'all', query = '';

  let chats = [], cur = null, th = null, stopIdx = null, stopChat = null, server = [], pending = new Map();
  let seen = get('nst_seen', {}), baseline = false, beat = 0, titleBase = document.title, audio = null;
  const known = new Map();

  const nameOf = c => (c && c.name) || 'Guest';
  const ago = t => { const d = Date.now() - t; return d < 6e4 ? 'now' : d < 36e5 ? Math.floor(d / 6e4) + 'm' : UI.day(t).startsWith('Today') ? UI.tm(t) : UI.day(t).split(' · ')[0] };

  /* ---------- sign in lives on admin/login.html ---------- */
  const toLogin = () => location.replace('admin/login.html?next=' + encodeURIComponent('../inbox.html'));
  const show = ok => { if (!ok) return toLogin(); login && (login.hidden = true); app.hidden = false; boot() };
  $('#out').addEventListener('click', async () => { try { await A.presence(false) } catch {} A.logout(); stopIdx && stopIdx(); stopChat && stopChat(); clearInterval(beat); location.replace('admin/login.html') });
  if (!C.live && !C.misconfigured) { const p = document.createElement('p'); p.className = 'nc-demo'; p.textContent = 'Demo mode: no server yet. Open the site in another tab of this browser to try it.'; $('.ib-side').insertBefore(p, $('#avbox')) }

  /* ---------- thread ---------- */
  th = UI.thread($('#feed'), { mine: 'a', name: () => nameOf(chats.find(c => c.cid === cur)), onQuote: q => { ta.value = '“' + q.slice(0, 160) + (q.length > 160 ? '…' : '') + '”\n'; fit(); ta.focus() }, onRetry: k => { const m = pending.get(k); if (m) push(m) } });
  const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 132) + 'px'; const l = 2000 - ta.value.length; document.querySelector('#tbox .cnt').textContent = l < 200 ? l : ''; sendBtn.disabled = !ta.value.trim() };
  const render = () => { const keys = new Set(server.map(m => m.k)); pending.forEach((m, k) => keys.has(k) && pending.delete(k)); th.update([...server, ...pending.values()]) };
  const push = m => { m.status = 'sending'; render(); A.send(cur, m).then(() => { m.status = 'sent'; render() }).catch(() => { m.status = 'failed'; render() }) };
  const send = () => {
    const text = ta.value.trim(); if (!text || !cur) return;
    const m = { k: C.newKey(), text, from: 'a', ts: Date.now(), status: 'sending' }; pending.set(m.k, m);
    ta.value = ''; fit(); $('#canned').hidden = true; $('#cbtn').setAttribute('aria-expanded', 'false'); push(m); if (!coarse.matches) ta.focus();
  };
  sendBtn.addEventListener('click', send);
  let lastTyped = 0;
  ta.addEventListener('input', () => { fit(); if (ta.value.trim() && cur && Date.now() - lastTyped > 2500) { lastTyped = Date.now(); A.typing(cur) } });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !coarse.matches) { e.preventDefault(); send() } });
  [['Thanks for reaching out! What are you looking to build?'], ['Happy to help. What’s your timeline and rough budget?'], ['Give me a moment, I’ll get back to you shortly.'], ['Let’s hop on a quick call. What time works for you?']].forEach(([t]) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = t.length > 34 ? t.slice(0, 32) + '…' : t; b.title = t; b.addEventListener('click', () => { ta.value = t; fit(); ta.focus() }); $('#canned').append(b);
  });
  $('#cbtn').addEventListener('click', e => { const c = $('#canned'); c.hidden = !c.hidden; e.currentTarget.setAttribute('aria-expanded', !c.hidden) });

  let typTimer = 0;
  const select = cid => {
    if (cid === cur) { if (mobile.matches) app.dataset.v = 'thread'; return }
    stopChat && stopChat(); cur = cid; server = []; pending.clear(); th.reset(); ta.value = ''; fit();
    $('#none').style.display = 'none'; const tb = $('#tbox'); tb.hidden = false; tb.style.display = 'flex';
    const c = chats.find(x => x.cid === cid); head(c); paintList();
    app.dataset.v = 'thread';
    stopChat = A.watchChat(cid, ({ msgs, typing }) => {
      server = msgs; render(); markSeen();
      clearTimeout(typTimer); const a = Date.now() - typing, on = typing && a < 5000; th.setTyping(!!on); $('#tstat').textContent = on ? 'typing…' : 'Visitor';
      if (on) typTimer = setTimeout(() => { th.setTyping(false); $('#tstat').textContent = 'Visitor' }, 5000 - a);
    });
    if (!mobile.matches) ta.focus();
  };
  const head = c => {
    $('#tname').textContent = nameOf(c); $('#tav').textContent = UI.ini(nameOf(c)); $('#tav').style.visibility = 'visible';
    const t = $('#ttags'); t.textContent = '';
    if (c && c.email) { const a = document.createElement('a'); a.href = 'mailto:' + c.email; a.textContent = c.email; t.append(a) }
    if (c && c.topic) { const s = document.createElement('span'); s.textContent = c.topic; t.append(s) }
  };
  const markSeen = () => { const c = chats.find(x => x.cid === cur); if (c && document.visibilityState === 'visible') { seen[cur] = c.lastAt; set('nst_seen', seen); paintList() } };
  document.addEventListener('visibilitychange', markSeen);
  $('#back').addEventListener('click', () => { app.dataset.v = 'list' });
  $('#delc').addEventListener('click', async () => { if (cur && confirm('Delete this conversation for good?')) { const id = cur; stopChat && stopChat(); cur = null; $('#tbox').style.display = 'none'; $('#none').style.display = ''; app.dataset.v = 'list'; try { await A.del(id) } catch { alert('Could not delete. Check your connection.') } } });

  /* ---------- list ---------- */
  const isUnread = c => c.lastFrom === 'v' && (c.lastAt || 0) > (seen[c.cid] || 0) && !(c.cid === cur && document.visibilityState === 'visible');
  const FILTERS = { all: ['All', () => true], unread: ['Unread', isUnread], project: ['Projects', c => c.topic === 'Project'], question: ['Questions', c => c.topic && c.topic !== 'Project'] };
  const hue = n => 1 + ([...n].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 5);
  const matches = c => { if (!query) return true; const t = query.toLowerCase(); return [nameOf(c), c.email, c.topic, c.lastText].some(v => v && String(v).toLowerCase().includes(t)) };
  const paintFilters = () => {
    filtersEl.textContent = '';
    Object.entries(FILTERS).forEach(([k, [label, fn]]) => {
      const n = k === 'all' ? chats.length : chats.filter(fn).length;
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', k === filter); b.className = k === filter ? 'on' : '';
      b.append(label); if (n) { const c = document.createElement('b'); c.textContent = n; b.append(c) }
      b.addEventListener('click', () => { filter = k; paintFilters(); paintList() }); filtersEl.append(b);
    });
  };
  const empty = (html) => { const d = document.createElement('div'); d.className = 'ib-empty'; d.innerHTML = html; list.append(d) };
  const paintList = () => {
    chats.sort((a, b) => b.lastAt - a.lastAt);
    list.textContent = '';
    const n = chats.filter(isUnread).length; document.title = (n ? `(${n}) ` : '') + titleBase;
    $('#sum').textContent = !chats.length ? 'No conversations yet' : (n ? `${n} unread · ` : '') + `${chats.length} conversation${chats.length === 1 ? '' : 's'}`;
    const rows = chats.filter(FILTERS[filter][1]).filter(matches);
    if (!chats.length) empty('<div class="orbx" aria-hidden="true"><b><s></s><s></s></b><i></i></div>No conversations yet.<br>They’ll show up here the moment someone says hello.');
    else if (!rows.length) empty(query ? 'No one matches “' + UI.el('i', '', query).innerHTML + '”.' : 'Nothing here right now.');
    rows.forEach(c => {
      const un = isUnread(c), b = document.createElement('button'); b.type = 'button'; b.className = 'ci-row' + (c.cid === cur ? ' on' : '') + (un ? ' unread' : '');
      const av = document.createElement('span'); av.className = 'av v' + hue(nameOf(c)); av.textContent = UI.ini(nameOf(c));
      const tx = document.createElement('span'); tx.className = 'tx';
      const nm = document.createElement('span'); nm.className = 'nm'; const n1 = document.createElement('span'); n1.textContent = nameOf(c); const t = document.createElement('time'); t.textContent = ago(c.lastAt); nm.append(n1, t);
      const ls = document.createElement('span'); ls.className = 'ls'; ls.textContent = (c.lastFrom === 'a' ? 'You: ' : '') + (c.lastText || '');
      tx.append(nm, ls);
      if (c.topic) { const tp = document.createElement('span'); tp.className = 'tp'; const ch = document.createElement('i'); ch.textContent = c.topic; if (c.topic !== 'Project') ch.className = 'q'; tp.append(ch); tx.append(tp) }
      b.append(av, tx); if (un) { const u = document.createElement('span'); u.className = 'ub'; u.setAttribute('aria-label', 'Unread'); b.append(u) }
      b.addEventListener('click', () => select(c.cid)); list.append(b);
    });
    paintFilters();
  };
  q.addEventListener('input', () => { query = q.value.trim(); paintList() });
  menuBtn.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; menuBtn.setAttribute('aria-expanded', !menu.hidden); if (!menu.hidden) menu.querySelector('a').focus() });
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#menu')) { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false') } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus() } });

  /* ---------- alerts ---------- */
  const beep = () => { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(.001, audio.currentTime); g.gain.exponentialRampToValueAtTime(.15, audio.currentTime + .02); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .35); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + .4) } catch {} };
  const alertNew = c => {
    beep();
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      const n = new Notification(nameOf(c), { body: c.lastText || 'New message', icon: 'assets/logo-mark.png', tag: c.cid });
      n.onclick = () => { focus(); select(c.cid); n.close() };
    }
  };
  const notifBtn = $('#notif');
  const notifState = () => { const ok = !('Notification' in window) || Notification.permission === 'granted'; notifBtn.hidden = ok };
  notifBtn.addEventListener('click', async () => { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)() } catch {} await Notification.requestPermission(); notifState() });
  notifState();

  /* ---------- presence ---------- */
  const avail = $('#avail');
  avail.checked = get('nst_avail', true);
  const pulse = () => A.presence(avail.checked).catch(() => {});
  const paintAv = () => { $('#avbox').dataset.state = avail.checked ? 'online' : 'away'; $('#avbox .lbl').textContent = avail.checked ? 'Showing as available' : 'Showing as away' };
  avail.addEventListener('change', () => { set('nst_avail', avail.checked); paintAv(); pulse() }); paintAv();

  /* ---------- boot ---------- */
  function boot() {
    pulse(); clearInterval(beat); beat = setInterval(pulse, 30000);
    stopIdx = A.watchIndex(rows => {
      chats = rows;
      rows.forEach(c => {
        const prev = known.get(c.cid);
        if (baseline && c.lastFrom === 'v' && c.lastAt > (prev || 0) && !(c.cid === cur && document.visibilityState === 'visible')) alertNew(c);
        known.set(c.cid, c.lastAt);
      });
      baseline = true;
      const c = chats.find(x => x.cid === cur); if (c) head(c);
      paintList();
    });
    setInterval(paintList, 60000);
  }
  const vv = () => { const v = window.visualViewport; if (!v || !mobile.matches) { app.style.removeProperty('--vv'); return } app.style.setProperty('--vv', v.height + 'px') };
  if (window.visualViewport) { visualViewport.addEventListener('resize', vv); visualViewport.addEventListener('scroll', vv) } mobile.addEventListener && mobile.addEventListener('change', vv); vv();
  (C.misconfigured ? Promise.resolve(false) : A.ready()).then(ok => show(ok)).catch(() => toLogin());
})();
