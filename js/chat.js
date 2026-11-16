/* chat.js: the visitor-facing live chat (mobile sheet + desktop two-pane window). */
(() => {
  const C = window.NSTCore, UI = window.NSTUI, cfg = window.NST_CHAT || {}, own = cfg.owner || {};
  if (!C || !UI) return;
  // Live site with no chat server configured: never pretend to deliver messages. Send "Hire me" to WhatsApp instead.
  if (C.misconfigured) {
    const wa = own.whatsapp ? 'https://wa.me/' + String(own.whatsapp).replace(/\D/g, '') : 'contact.html';
    document.querySelectorAll('[data-chat]').forEach(a => { a.setAttribute('href', wa); if (own.whatsapp) { a.target = '_blank'; a.rel = 'noopener' } a.removeAttribute('aria-haspopup'); a.removeAttribute('data-chat') });
    return;
  }
  const { i } = UI, $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch { return d } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} };
  const del = k => { try { localStorage.removeItem(k) } catch {} };
  const mobile = matchMedia('(max-width:860px)'), coarse = matchMedia('(pointer:coarse)');

  let cid = get('nst_cid', null), profile = get('nst_cprof', { name: '', email: '' }), topic = null;
  let root, win, th, ta, sendBtn, api, stop = null, server = [], pending = new Map();
  let ownerO = {}, connected = true, typingTimer = 0, lastTyped = 0, lastSend = 0, lastFocus = null, built = false, isOpen = false;

  const ensure = () => { if (!cid) { cid = C.rnd(24); set('nst_cid', cid) } };
  const online = () => C.ownerOnline(ownerO);

  /* ---------- status text / dots (also used by buttons on the contact page) ---------- */
  const paintStatus = () => {
    const on = online(), state = on ? 'online' : 'away';
    $$('[data-chat-status]').forEach(n => n.dataset.state = state);
    $$('[data-chat-text]').forEach(n => n.textContent = on ? 'Online now' : 'Away, leave a message');
    if (!built) return;
    const typing = root.classList.contains('typing');
    $('[data-sub]', root).textContent = typing ? 'typing…' : (!connected && C.live) ? 'Reconnecting…' : on ? 'Online' : 'Away';
    $('[data-strip]', root).textContent = on ? 'Online now' : 'Away, I reply when I’m back';
    $('.nc-strip .dot', root).dataset.state = state;
    $('.nc-sub', root).dataset.state = state;
    note();
  };
  setInterval(paintStatus, 15000);

  /* ---------- build ---------- */
  const build = () => {
    root = document.createElement('div');
    root.className = 'nc'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Chat with ' + (own.name || 'me'));
    root.innerHTML = `
<div class="nc-scrim"></div>
<div class="nc-win" data-view="welcome">
  <section class="nc-side">
    <header class="nc-bar nc-bar-m">
      <button class="ic-btn" data-a="close" aria-label="Close chat" type="button">${i.back}</button>
      <h2>Chat with ${own.name || 'me'}</h2>
      <button class="ic-btn" data-a="menu" aria-label="More options" aria-haspopup="menu" aria-expanded="false" type="button">${i.dots}</button>
    </header>
    <div class="nc-hello">
      <div class="orbx" aria-hidden="true"><b><s></s><s></s></b><i></i></div>
      <p class="hi">Hello, <span data-name>there</span></p>
      <h3>How can I help you?</h3>
      <label class="nc-name"><span>Your name</span><input data-in="name" maxlength="60" autocomplete="given-name" placeholder="What should I call you?" enterkeyhint="done"></label>
    </div>
    <div class="nc-cards">
      <button type="button" class="nc-card-b" data-card="project"><span class="ci v">${i.spark}</span><span class="go">${i.arrow}</span><b>Start a project</b><small>Websites, apps and stores, from idea to launch</small></button>
      <button type="button" class="nc-card-b" data-card="question"><span class="ci a">${i.help}</span><span class="go">${i.arrow}</span><b>Ask a question</b><small>Pricing, timelines or how I work</small></button>
    </div>
    <p class="nc-alt">Prefer another way? <a href="https://wa.me/${own.whatsapp}" target="_blank" rel="noopener">WhatsApp</a> or <a href="mailto:${own.email}">email</a></p>
  </section>
  <section class="nc-main">
    <header class="nc-bar">
      <button class="ic-btn nc-back" data-a="home" aria-label="Back" type="button">${i.back}</button>
      <div class="nc-who"><span class="av orbm"></span><span class="nc-ttl"><b>${own.name ? own.name + ' Amedzie' : 'Chat'}</b><span class="nc-sub" data-state="away"><i class="dot"></i><span data-sub>Away</span></span></span></div>
      <button class="ic-btn" data-a="menu" aria-label="More options" aria-haspopup="menu" aria-expanded="false" type="button">${i.dots}</button>
      <button class="ic-btn nc-x" data-a="close" aria-label="Close chat" type="button">${i.close}</button>
    </header>
    ${C.live ? '' : '<p class="nc-demo">Demo mode: not connected to a server yet, so messages stay in this browser.</p>'}
    <div class="nc-feedwrap"></div>
  </section>
  <footer class="nc-comp">
    <div class="nc-note" hidden><p>I’m away right now. Leave your email and I’ll reply there too.</p><form><input type="email" placeholder="you@example.com" aria-label="Your email" autocomplete="email" maxlength="120"><button class="btn" type="submit">Save</button></form></div>
    <div class="nc-card">
      <div class="nc-strip"><span class="st"><i class="dot" data-state="away"></i><span data-strip>Away</span></span><a class="wa" href="https://wa.me/${own.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>
      <div class="nc-chips" hidden></div>
      <div class="nc-box">
        <textarea rows="1" maxlength="2000" placeholder="Write to ${own.name || 'me'}…" aria-label="Your message" enterkeyhint="send"></textarea>
        <div class="nc-tools"><button class="ic-btn sm" data-a="chips" aria-label="Quick prompts" aria-expanded="false" type="button">${i.plus}</button><span class="cnt" aria-live="polite"></span><button class="send" type="button" aria-label="Send message" disabled>${i.send}</button></div>
      </div>
    </div>
  </footer>
  <div class="nc-menu" role="menu" hidden>
    <a role="menuitem" href="https://wa.me/${own.whatsapp}" target="_blank" rel="noopener">Continue on WhatsApp</a>
    <a role="menuitem" href="mailto:${own.email}">Email ${own.name || 'me'}</a>
    <button role="menuitem" type="button" data-a="rename">Change my name</button>
    <button role="menuitem" type="button" data-a="clear">Clear chat on this device</button>
  </div>
</div>`;
    document.body.appendChild(root);
    win = $('.nc-win', root); ta = $('textarea', root); sendBtn = $('.send', root);

    th = UI.thread($('.nc-feedwrap', root), { mine: 'v', name: () => profile.name, onQuote: q => { ta.value = '“' + q.slice(0, 160) + (q.length > 160 ? '…' : '') + '”\n'; fit(); ta.focus() }, onRetry: k => { const m = pending.get(k); if (m) push(m) } });

    const chips = $('.nc-chips', root);
    [['Business website', 'I need a website for my business. '], ['Web app', 'I want to build a web app. '], ['E-commerce store', 'I’d like an online store. '], ['Motion design', 'I’m interested in motion and animation work. '], ['Quick question', 'I have a quick question: ']].forEach(([l, t]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.addEventListener('click', () => { topic = l; ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + t; fit(); ta.focus(); toggleChips(false) }); chips.append(b);
    });

    wire(); built = true; hydrate();
  };

  const hydrate = () => { $('[data-in=name]', root).value = profile.name || ''; greet() };
  const first = () => (profile.name || '').trim().split(/\s+/)[0] || '';
  const greet = () => { const n = $('[data-name]', root); n.textContent = first() || 'there'; };

  /* ---------- composer ---------- */
  const fit = () => {
    ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 132) + 'px';
    const left = 2000 - ta.value.length; $('.cnt', root).textContent = left < 200 ? left : '';
    sendBtn.disabled = !ta.value.trim();
  };
  const toggleChips = on => { const c = $('.nc-chips', root), b = $('[data-a=chips]', root); on = on ?? c.hidden; c.hidden = !on; b.setAttribute('aria-expanded', on); b.classList.toggle('on', on) };
  const info = () => ({ name: (profile.name || '').trim() || 'Guest', email: profile.email || null, topic });

  const render = () => {
    const keys = new Set(server.map(m => m.k));
    pending.forEach((m, k) => { if (keys.has(k)) pending.delete(k) });
    const nm = first(), intro = { k: 'intro', from: 'a', local: true, text: nm ? `Hi ${nm} 👋 I'm ${own.name || 'here'}. Tell me what you're building and when you need it. I'll reply right here.` : (own.greeting || 'Hi! How can I help?'), ts: 0 };
    th.update([intro, ...server, ...pending.values()]);
  };
  const push = m => {
    m.status = 'sending'; render();
    api.send(m, info()).then(() => { m.status = 'sent'; render() }).catch(() => { m.status = 'failed'; render() });
  };
  const send = () => {
    const text = ta.value.trim(); if (!text || Date.now() - lastSend < 500) return;
    lastSend = Date.now(); ensure();
    const m = { k: C.newKey(), text, from: 'v', ts: Date.now(), status: 'sending' };
    pending.set(m.k, m); set('nst_sent', 1);
    ta.value = ''; fit(); toggleChips(false);
    if (win.dataset.view !== 'chat') view('chat');
    push(m); note();
  };
  const note = () => {
    const n = $('.nc-note', root); if (!n) return;
    n.hidden = !(get('nst_sent', 0) && !online() && !profile.email && win.dataset.view === 'chat');
  };

  /* ---------- view switching ---------- */
  const view = v => { win.dataset.view = v; note(); if (v === 'chat') requestAnimationFrame(() => th.toEnd(false)) };

  /* ---------- stream ---------- */
  const start = () => {
    ensure(); api = C.visitor(cid);
    stop = api.start({
      msgs: l => { server = l; if (l.length) set('nst_sent', 1); render() },
      typing: ts => { clearTimeout(typingTimer); const ago = Date.now() - ts; const on = ts && ago < 5000; root.classList.toggle('typing', !!on); th.setTyping(!!on); if (on) typingTimer = setTimeout(() => { root.classList.remove('typing'); th.setTyping(false); paintStatus() }, 5000 - ago); paintStatus() },
      owner: o => { ownerO = o || {}; paintStatus() },
      conn: ok => { connected = ok; paintStatus() }
    });
  };

  /* ---------- open / close ---------- */
  const open = (opts = {}) => {
    if (isOpen) return;
    if (!built) build();
    isOpen = true; lastFocus = opts.origin || document.activeElement;
    const nav = $('.nav'); nav && nav.classList.remove('open');
    start(); view(opts.view || (get('nst_sent', 0) ? 'chat' : 'welcome')); hydrate(); render(); fit(); paintStatus();
    root.classList.add('show'); document.documentElement.classList.add('nc-lock');
    if (!mobile.matches && opts.origin && opts.origin.getBoundingClientRect) {
      const r = opts.origin.getBoundingClientRect();
      win.style.transformOrigin = `${r.left + r.width / 2 - win.offsetLeft - root.offsetLeft}px ${r.top + r.height / 2 - win.offsetTop}px`;
    } else win.style.transformOrigin = '';
    root.offsetWidth; root.classList.add('on'); vv();
    history.replaceState(null, '', location.pathname + location.search + '#chat');
    setTimeout(() => { if (!mobile.matches) ta.focus({ preventScroll: true }); else $('[data-card],textarea', win.dataset.view === 'chat' ? $('.nc-comp', root) : root).focus({ preventScroll: true }) }, 420);
  };
  const close = () => {
    if (!isOpen) return; isOpen = false;
    win.style.transform = ''; $('.nc-scrim', root).style.opacity = '';
    root.classList.remove('on'); closeMenu(); stop && stop(); stop = null;
    document.documentElement.classList.remove('nc-lock');
    if (location.hash === '#chat') history.replaceState(null, '', location.pathname + location.search);
    setTimeout(() => { if (!isOpen) root.classList.remove('show') }, 480);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  };

  /* ---------- menu ---------- */
  const menu = () => $('.nc-menu', root);
  let menuBtn = null;
  const closeMenu = () => { if (!built) return; menu().hidden = true; $$('[data-a=menu]', root).forEach(b => b.setAttribute('aria-expanded', 'false')); menuBtn = null };
  const openMenu = btn => {
    const m = menu(); if (!m.hidden && menuBtn === btn) return closeMenu();
    menuBtn = btn; const wr = win.getBoundingClientRect(), br = btn.getBoundingClientRect();
    m.hidden = false; m.style.top = br.bottom - wr.top + 8 + 'px'; m.style.right = wr.right - br.right + 'px';
    btn.setAttribute('aria-expanded', 'true'); $('a', m).focus();
  };

  /* ---------- wiring ---------- */
  function wire() {
    root.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'), card = e.target.closest('[data-card]');
      if (e.target.classList.contains('nc-scrim')) return close();
      if (!e.target.closest('.nc-menu,[data-a=menu]')) closeMenu();
      if (card) { topic = card.dataset.card === 'project' ? 'Project' : 'Question'; ta.value = card.dataset.card === 'project' ? 'Hi ' + (own.name || '') + ', I’d like to start a project: ' : 'Hi ' + (own.name || '') + ', I have a question about '; fit(); view('chat'); setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) }, 380); return }
      if (!a) return;
      const act = a.dataset.a;
      if (act === 'close') close();
      else if (act === 'home') view('welcome');
      else if (act === 'menu') openMenu(a);
      else if (act === 'chips') toggleChips();
      else if (act === 'rename') { closeMenu(); const o = lastFocus; close(); setTimeout(() => openGate(o, true), 300) }
      else if (act === 'clear') { closeMenu(); if (confirm('Clear this chat on this device? You’ll start a fresh conversation.')) { stop && stop(); del('nst_cid'); del('nst_sent'); cid = null; server = []; pending.clear(); th.reset(); view('welcome'); start(); render() } }
    });
    sendBtn.addEventListener('click', () => { send(); if (!coarse.matches) ta.focus() });
    ta.addEventListener('input', () => { fit(); if (ta.value.trim() && Date.now() - lastTyped > 2500) { lastTyped = Date.now(); api && api.typing() } });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !coarse.matches) { e.preventDefault(); send() } });
    const nm = $('[data-in=name]', root);
    nm.addEventListener('input', () => { profile.name = nm.value; set('nst_cprof', profile); greet(); render() });
    nm.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nm.blur() } });
    $('.nc-note form', root).addEventListener('submit', e => {
      e.preventDefault(); const inp = $('input', e.target), v = inp.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(v)) { inp.setCustomValidity('Enter a valid email'); inp.reportValidity(); setTimeout(() => inp.setCustomValidity(''), 1500); return }
      profile.email = v; set('nst_cprof', profile); api.saveContact({ email: v, name: info().name }); note();
    });
    root.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); menu().hidden ? close() : closeMenu(); return }
      if (e.key !== 'Tab') return;
      const f = $$('a[href],button:not(:disabled),input,textarea', win).filter(n => n.offsetParent !== null && getComputedStyle(n).visibility !== 'hidden' && !n.closest('[hidden]'));
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    });

    /* drag the sheet down to dismiss (mobile): 1:1 with the finger, velocity on release */
    let d = null;
    win.addEventListener('pointerdown', e => {
      if (!mobile.matches || e.target.closest('button,a,input,textarea,.nc-menu') || !e.target.closest('.nc-bar,.nc-win>.grab')) return;
      d = { y0: e.clientY, dy: 0, v: 0, ly: e.clientY, lt: e.timeStamp }; win.setPointerCapture(e.pointerId); win.classList.add('drag');
    });
    win.addEventListener('pointermove', e => {
      if (!d) return; const raw = e.clientY - d.y0; d.dy = raw > 0 ? raw : raw / 5;
      const dt = e.timeStamp - d.lt; if (dt > 0) { d.v = (e.clientY - d.ly) / dt; d.ly = e.clientY; d.lt = e.timeStamp }
      win.style.transform = `translateY(${d.dy}px)`; $('.nc-scrim', root).style.opacity = Math.max(0, 1 - d.dy / (innerHeight * .8));
    });
    const end = () => { if (!d) return; const x = d; d = null; win.classList.remove('drag'); if (x.dy > 130 || x.v > .6) close(); else { win.style.transform = ''; $('.nc-scrim', root).style.opacity = '' } };
    win.addEventListener('pointerup', end); win.addEventListener('pointercancel', end);
  }

  /* keep the composer above the on-screen keyboard (visualViewport) */
  const vv = () => {
    if (!root) return; const v = window.visualViewport;
    if (!v || !mobile.matches) { root.style.removeProperty('--vv'); root.style.removeProperty('--vt'); root.classList.remove('kb'); return }
    root.style.setProperty('--vv', v.height + 'px'); root.style.setProperty('--vt', v.offsetTop + 'px');
    root.classList.toggle('kb', innerHeight - v.height > 120);
  };
  if (window.visualViewport) { visualViewport.addEventListener('resize', vv); visualViewport.addEventListener('scroll', vv) }
  mobile.addEventListener && mobile.addEventListener('change', vv);

  /* ---------- triggers: Hire me + any [data-chat] button ---------- */
  /* ---------- name gate: asks for the visitor's name once, then opens the chat ---------- */
  const clean = v => (v || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  let gate = null, gateOpen = false, gateOrigin = null, gateInput, gateGo, gateErr;
  const buildGate = () => {
    gate = document.createElement('div');
    gate.className = 'nd'; gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-label', 'Tell us your name');
    gate.innerHTML = `
<div class="nd-scrim"></div>
<form class="nd-card" novalidate>
  <button class="ic-btn nd-x" type="button" data-nd="close" aria-label="Close">${i.close}</button>
  <div class="orbx" aria-hidden="true"><b><s></s><s></s></b><i></i></div>
  <p class="nd-hi">Hello 👋</p>
  <h3>What should I call you?</h3>
  <p class="nd-sub">Tell ${own.name || 'me'} your name and we'll start chatting.</p>
  <label class="nc-name"><span>Your name</span><input maxlength="60" autocomplete="given-name" placeholder="Type your name" enterkeyhint="go"><button class="send" type="submit" aria-label="Start chat" disabled>${i.send}</button></label>
  <p class="nd-err" role="alert" hidden>Please type your name to continue</p>
  <p class="nc-alt">Prefer another way? <a href="https://wa.me/${own.whatsapp}" target="_blank" rel="noopener">WhatsApp</a> or <a href="mailto:${own.email}">email</a></p>
</form>`;
    document.body.appendChild(gate);
    gateInput = $('input', gate); gateGo = $('.send', gate); gateErr = $('.nd-err', gate);
    gateInput.addEventListener('input', () => { gateGo.disabled = !clean(gateInput.value); gateErr.hidden = true });
    $('form', gate).addEventListener('submit', e => {
      e.preventDefault(); const v = clean(gateInput.value);
      if (!v) { gateErr.hidden = false; gateInput.focus(); return }
      profile.name = v; set('nst_cprof', profile);
      if (built) { hydrate() }
      closeGate(true); open({ origin: gateOrigin, view: 'chat' });
    });
    gate.addEventListener('click', e => { if (e.target.classList.contains('nd-scrim') || e.target.closest('[data-nd=close]')) closeGate() });
    gate.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); closeGate(); return }
      if (e.key !== 'Tab') return;
      const f = $$('a[href],button:not(:disabled),input', gate).filter(n => n.offsetParent !== null);
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    });
  };
  const openGate = (origin, rename) => {
    if (gateOpen || isOpen) return;
    const known = clean(profile.name);
    if (known && !rename) return open({ origin, view: 'chat' });          // name already given: straight to the chat
    if (!gate) buildGate();
    gateOpen = true; gateOrigin = origin || null;
    gateInput.value = rename ? known : ''; gateGo.disabled = !clean(gateInput.value); gateErr.hidden = true;
    const nav = $('.nav'); nav && nav.classList.remove('open');
    gate.classList.add('show'); document.documentElement.classList.add('nc-lock');
    gate.offsetWidth; gate.classList.add('on');
    setTimeout(() => gateInput.focus({ preventScroll: true }), 380);
  };
  const closeGate = handoff => {
    if (!gateOpen) return; gateOpen = false;
    gate.classList.remove('on');
    if (!handoff) { document.documentElement.classList.remove('nc-lock'); const o = gateOrigin; o && o.focus && o.focus({ preventScroll: true }) }
    setTimeout(() => { if (!gateOpen) gate.classList.remove('show') }, 420);
  };

  /* ---------- floating chat button ---------- */
  const fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'nc-fab'; fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-label', 'Chat with ' + (own.name || 'me'));
  fab.innerHTML = `<span class="fab-tip">Chat with ${own.name || 'me'}</span><span class="fab-orb"><i class="fab-ring"></i><img class="fab-bot" src="assets/icons/chatbot.png" alt="" width="256" height="240" decoding="async"><i class="dot fab-dot" data-chat-status data-state="away"></i></span>`;
  fab.addEventListener('click', () => openGate(fab));
  document.body.appendChild(fab);
  C.presence(o => { ownerO = o || {}; paintStatus() });
  setTimeout(() => { if (!isOpen && !gateOpen && !get('nst_peeked', 0)) { fab.classList.add('peek'); set('nst_peeked', 1); setTimeout(() => fab.classList.remove('peek'), 5200) } }, 3500);

  document.addEventListener('click', e => { const t = e.target.closest('[data-chat]'); if (t) { e.preventDefault(); openGate(t) } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen && !root.contains(e.target)) close() });
  window.addEventListener('hashchange', () => { if (location.hash === '#chat') openGate(); else if (isOpen) close() });
    const auto = () => { if (location.hash === '#chat') setTimeout(() => openGate(), 1400) };
  document.readyState === 'complete' ? auto() : addEventListener('load', auto);
  window.NSTChat = { open: openGate, close };
})();
