/* chat-core.js: transport layer.
   LIVE = Firebase Realtime Database over plain REST + EventSource (no SDK, no build step).
   DEMO = localStorage, synced between tabs of the same browser. */
(() => {
  const cfg = window.NST_CHAT || {}, fb = cfg.firebase || {};
  const db = (fb.databaseURL || '').replace(/\/+$/, '');
  const live = !!(db && fb.apiKey);
  const rnd = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => (b % 36).toString(36)).join('');
  const newKey = () => 'm' + Date.now().toString(36) + rnd(5);
  const SV = { '.sv': 'timestamp' };
  const list = o => Object.entries(o || {}).map(([k, v]) => ({ k, ...v })).filter(m => m.text).sort((a, b) => (a.ts - b.ts) || (a.k < b.k ? -1 : 1));

  /* ---------- LIVE ---------- */
  let token = null, refresh = null, tokenTimer = 0;
  const RT = 'nst_rt';
  const stGet = () => { try { return localStorage.getItem(RT) || sessionStorage.getItem(RT) } catch { return null } };
  const stSet = (rt, remember) => { try { localStorage.removeItem(RT); sessionStorage.removeItem(RT); (remember === false ? sessionStorage : localStorage).setItem(RT, rt) } catch {} };
  const stClear = () => { try { localStorage.removeItem(RT); sessionStorage.removeItem(RT) } catch {} };
  const inSession = () => { try { return !localStorage.getItem(RT) && !!sessionStorage.getItem(RT) } catch { return false } };
  refresh = stGet();
  const OWNER = String(((cfg.owner || {}).email) || '').toLowerCase();
  const jwt = t => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) } catch { return {} } };
  const u = (p, q) => { const s = new URLSearchParams(q || {}); if (token) s.set('auth', token); const t = s.toString(); return `${db}/${p}.json${t ? '?' + t : ''}` };
  const call = async (method, p, body, keepalive) => {
    const r = await fetch(u(p), { method, body: body === undefined ? undefined : JSON.stringify(body), keepalive: !!keepalive });
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  };
  // Mirrors a database path into a local tree and calls on(tree) after every server event.
  const mirror = (p, on, conn) => {
    let es, dead = false, tree = null, retry;
    const put = (path, data) => {
      if (path === '/' || path === '') { tree = data; return }
      const parts = path.split('/').filter(Boolean);
      if (tree == null || typeof tree !== 'object') tree = {};
      let o = tree;
      parts.slice(0, -1).forEach(k => { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k] });
      const last = parts[parts.length - 1];
      if (data === null) delete o[last]; else o[last] = data;
    };
    const open = () => {
      if (dead) return;
      es = new EventSource(u(p));
      es.onopen = () => conn && conn(true);
      es.onerror = () => conn && conn(false);
      es.addEventListener('put', e => { const d = JSON.parse(e.data); put(d.path, d.data); on(tree || {}) });
      es.addEventListener('patch', e => { const d = JSON.parse(e.data), base = d.path.replace(/\/$/, ''); for (const k in d.data) put(base + '/' + k, d.data[k]); on(tree || {}) });
      es.addEventListener('auth_revoked', () => { es.close(); retry = setTimeout(open, 1200) });
      es.addEventListener('cancel', () => { es.close(); conn && conn(false) });
    };
    open();
    return () => { dead = true; clearTimeout(retry); es && es.close() };
  };

  const liveVisitor = cid => ({
    start(h) {
      const a = mirror(`chats/${cid}`, t => { h.msgs(list(t.msgs)); h.typing((t.typing && t.typing.a) || 0) }, h.conn);
      const b = mirror('owner', t => h.owner(t));
      return () => { a(); b() };
    },
    async send(m, info) {
      await call('PUT', `chats/${cid}/msgs/${m.k}`, { from: 'v', text: m.text, ts: SV });
      await call('PATCH', `chatIndex/${cid}`, { name: info.name, email: info.email || null, topic: info.topic || null, lastAt: SV, lastFrom: 'v', lastText: m.text.slice(0, 140) });
    },
    typing() { call('PUT', `chats/${cid}/typing/v`, SV).catch(() => {}) },
    saveContact(info) { return call('PATCH', `chatIndex/${cid}`, info) }
  });

  const API_KEY = fb.apiKey;
  const applyToken = (idToken, rt, expires, remember) => {
    token = idToken; refresh = rt;
    stSet(rt, remember === undefined ? !inSession() : remember);
    clearTimeout(tokenTimer);
    tokenTimer = setTimeout(() => doRefresh().catch(() => {}), Math.max(60, (+expires || 3600) - 120) * 1000);
  };
  const doRefresh = async () => {
    const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refresh)}` });
    if (!r.ok) { const e = new Error('refresh failed'); e.dead = r.status >= 400 && r.status < 500; throw e }
    const d = await r.json(); applyToken(d.id_token, d.refresh_token, d.expires_in);
  };
  const liveAdmin = {
    async ready() {
      if (!refresh) return false;
      try {
        await doRefresh();
        if (OWNER && String(jwt(token).email || '').toLowerCase() !== OWNER) { token = null; refresh = null; stClear(); return false }
        return true;
      } catch (e) {
        // A real "refresh token is dead" answer ends the session; a dropped connection does not.
        if (e && e.dead) { token = null; refresh = null; stClear() }
        return false;
      }
    },
    async login(email, pw, remember) {
      const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw, returnSecureToken: true }) });
      const d = await r.json();
      if (!r.ok) throw new Error((d.error && d.error.message) || 'Sign in failed');
      // Only the owner account may use the admin. Anyone else is signed straight back out.
      const c = jwt(d.idToken);
      if (OWNER && String(c.email || '').toLowerCase() !== OWNER) throw new Error('NOT_OWNER');
      if (c.email_verified !== true) {
        const verification = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken: d.idToken })
        });
        const result = await verification.json();
        if (!verification.ok) throw new Error('VERIFY_EMAIL:' + ((result.error && result.error.message) || 'FAILED'));
        return { verified: false, verificationSent: true };
      }
      applyToken(d.idToken, d.refreshToken, d.expiresIn, remember !== false);
      return { verified: true };
    },
    async reset(email) {
      const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }) });
      const d = await r.json();
      // EMAIL_NOT_FOUND is swallowed on purpose so the form never reveals which emails exist.
      if (!r.ok && !/EMAIL_NOT_FOUND/.test((d.error && d.error.message) || '')) throw new Error((d.error && d.error.message) || 'Could not send reset email');
    },
    logout() { token = null; refresh = null; stClear(); clearTimeout(tokenTimer) },
    watchIndex(cb, conn) { return mirror('chatIndex', t => cb(Object.entries(t).map(([cid, v]) => ({ cid, ...v })).filter(x => x.lastAt)), conn) },
    watchChat(cid, cb, conn) { return mirror(`chats/${cid}`, t => cb({ msgs: list(t.msgs), typing: (t.typing && t.typing.v) || 0 }), conn) },
    async send(cid, m) {
      await call('PUT', `chats/${cid}/msgs/${m.k}`, { from: 'a', text: m.text, ts: SV });
      await call('PATCH', `chatIndex/${cid}`, { lastAt: SV, lastFrom: 'a', lastText: m.text.slice(0, 140) });
    },
    typing(cid) { call('PUT', `chats/${cid}/typing/a`, SV).catch(() => {}) },
    presence(on) { return call('PUT', 'owner', { ts: SV, on }, true) },
    async del(cid) { await call('DELETE', `chats/${cid}`); await call('DELETE', `chatIndex/${cid}`) }
  };

  /* ---------- DEMO (localStorage, cross-tab) ---------- */
  const LS = 'nst_demo_v1', subs = new Set();
  const rd = () => { try { return JSON.parse(localStorage.getItem(LS)) || {} } catch { return {} } };
  const wr = o => { try { localStorage.setItem(LS, JSON.stringify(o)) } catch {} subs.forEach(f => f()) };
  addEventListener('storage', e => e.key === LS && subs.forEach(f => f()));
  const watch = f => { subs.add(f); f(); return () => subs.delete(f) };
  const upd = fn => { const s = rd(); s.index = s.index || {}; s.chats = s.chats || {}; fn(s); wr(s) };
  const chatOf = (s, cid) => (s.chats[cid] = s.chats[cid] || { msgs: {}, typing: {} });

  const demoVisitor = cid => ({
    start(h) { h.conn(true); return watch(() => { const s = rd(), c = (s.chats || {})[cid] || {}; h.msgs(list(c.msgs)); h.typing((c.typing || {}).a || 0); h.owner(s.owner || {}) }) },
    async send(m, info) { upd(s => { chatOf(s, cid).msgs[m.k] = { from: 'v', text: m.text, ts: Date.now() }; s.index[cid] = { ...(s.index[cid] || {}), name: info.name, email: info.email || null, topic: info.topic || null, lastAt: Date.now(), lastFrom: 'v', lastText: m.text.slice(0, 140) } }) },
    typing() { upd(s => { chatOf(s, cid).typing.v = Date.now() }) },
    async saveContact(info) { upd(s => { s.index[cid] = { ...(s.index[cid] || {}), ...info } }) }
  });
  const demoAdmin = {
    async ready() { return true }, async login() {}, logout() {},
    watchIndex(cb, conn) { conn && conn(true); return watch(() => cb(Object.entries(rd().index || {}).map(([cid, v]) => ({ cid, ...v })).filter(x => x.lastAt))) },
    watchChat(cid, cb, conn) { conn && conn(true); return watch(() => { const c = ((rd().chats || {})[cid]) || {}; cb({ msgs: list(c.msgs), typing: (c.typing || {}).v || 0 }) }) },
    async send(cid, m) { upd(s => { chatOf(s, cid).msgs[m.k] = { from: 'a', text: m.text, ts: Date.now() }; s.index[cid] = { ...(s.index[cid] || {}), lastAt: Date.now(), lastFrom: 'a', lastText: m.text.slice(0, 140) } }) },
    typing(cid) { upd(s => { chatOf(s, cid).typing.a = Date.now() }) },
    async presence(on) { upd(s => { s.owner = { ts: Date.now(), on } }) },
    async del(cid) { upd(s => { delete s.chats[cid]; delete s.index[cid] }) }
  };

  // Demo mode is for local testing only. On a real domain with no Firebase config it must fail closed.
  const local = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname) || location.protocol === 'file:';
  const misconfigured = !live && !local;
  if (misconfigured) { demoAdmin.ready = async () => false; demoAdmin.login = async () => { throw new Error('NOT_CONFIGURED') } }

  window.NSTCore = {
    live, local, misconfigured, rnd, newKey, token: () => token,
    visitor: cid => (live ? liveVisitor : demoVisitor)(cid),
    admin: live ? liveAdmin : demoAdmin,
    presence: cb => live ? mirror('owner', cb) : watch(() => cb(rd().owner || {})),
    ownerOnline: o => !!(o && o.on && o.ts && Date.now() - o.ts < 90000)
  };
})();
