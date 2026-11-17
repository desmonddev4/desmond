/* projects.js: one place for the portfolio's projects.
   - Projects added from the admin are stored in Firebase (live) or localStorage (demo),
     then loaded into window.WORKS so every page (home, work, case study) shows them.
   Load order: data.js, chat-config.js, chat-core.js, projects.js, then the page scripts.
   Pages that draw projects should draw once now and again on the 'nst:projects' event. */
(() => {
  'use strict';
  const cfg = window.NST_CHAT || {}, fb = cfg.firebase || {};
  const db = (fb.databaseURL || '').replace(/\/+$/, '');
  const live = !!(db && fb.apiKey);
  const KEY = 'nst_projects_v1', CACHE = 'nst_projects_cache', IMGS = 'nst_project_imgs_v1';
  const rd = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch { return d } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch { return false } };

  let custom = [], listeners = new Set();
  const tok = () => (window.NSTCore && window.NSTCore.token && window.NSTCore.token()) || null;

  /* ---------- normalise one stored record into the shape the pages expect ---------- */
  const shape = (id, r) => ({
    id, custom: true, status: r.status || 'Shipped', created: r.created || 0,
    t: r.t || 'Untitled project', tag: r.tag || 'Frontend', d: r.d || '', img: r.img || '', src: r.thumb || '',
    client: r.client || '', role: r.role || '', year: r.year || String(new Date().getFullYear()),
    stack: Array.isArray(r.stack) ? r.stack : String(r.stack || '').split(',').map(s => s.trim()).filter(Boolean),
    live: r.live || '', prototypeUrl: r.prototypeUrl || '', brief: r.brief || '', built: r.built || '', result: r.result || ''
  });
  const fromTree = tree => Object.entries(tree || {}).map(([id, r]) => shape(id, r || {})).sort((a, b) => b.created - a.created);

  /* ---------- build window.WORKS from admin-managed projects ---------- */
  const merge = () => {
    const all = [...custom];
    window.WORKS = all; window.NSTProjects.list = all;
    listeners.forEach(f => { try { f(all) } catch {} });
    document.dispatchEvent(new CustomEvent('nst:projects', { detail: all }));
  };

  /* ---------- image URL for any project ---------- */
  const imgOf = w => w.src || `assets/${w.img}.jpg`;
  const imgAdmin = w => w.src ? w.src : `../assets/${w.img}.jpg`;

  /* ---------- LIVE transport (Firebase REST) ---------- */
  const url = (p, auth) => `${db}/${p}.json${auth ? '?auth=' + encodeURIComponent(auth) : ''}`;
  const http = async (method, p, body) => {
    const request = () => fetch(url(p, method === 'GET' ? null : tok()), { method, body: body === undefined ? undefined : JSON.stringify(body) });
    let r = await request();
    if (live && method !== 'GET' && (r.status === 401 || r.status === 403) && await window.NSTCore.admin.ready()) r = await request();
    if (!r.ok) {
      const text = await r.text();
      let reason = text;
      try { const data = JSON.parse(text); reason = typeof data === 'string' ? data : data.error || text } catch {}
      const auth = window.NSTCore.authInfo ? window.NSTCore.authInfo() : {};
      const diagnostic = r.status === 401 || r.status === 403
        ? ` Token email=${auth.email || 'missing'}, email_verified=${auth.emailVerified === true}, project=${auth.projectId || 'missing'}, database=${new URL(db).hostname}.`
        : '';
      const e = new Error(`Firebase rejected ${method} ${p} (${r.status}): ${reason || r.statusText}.${diagnostic}`);
      e.status = r.status; e.path = p; e.reason = reason;
      throw e;
    }
    return r.json();
  };

  /* ---------- load ---------- */
  const load = async () => {
    if (!live) { custom = fromTree(rd(KEY, {})); merge(); return }
    custom = fromTree(rd(CACHE, {})); merge();                           // instant paint from the last visit
    try { const t = await http('GET', 'projects'); wr(CACHE, t || {}); custom = fromTree(t); merge() } catch {}
  };

  /* ---------- admin API (writes use the admin sign-in token from chat-core.js) ---------- */
  const newId = () => 'p' + Date.now().toString(36) + [...crypto.getRandomValues(new Uint8Array(4))].map(b => (b % 36).toString(36)).join('');
  const save = async (id, rec, fullImg) => {
    id = id || newId(); rec = { ...rec, created: rec.created || Date.now() };
    if (live) {
      await http('PUT', `projects/${id}`, rec);
      if (fullImg !== undefined) { if (fullImg) await http('PUT', `projectImgs/${id}`, fullImg); else await http('DELETE', `projectImgs/${id}`) }
      const t = await http('GET', 'projects'); wr(CACHE, t || {}); custom = fromTree(t);
    } else {
      const m = rd(KEY, {}); m[id] = rec; if (!wr(KEY, m)) throw new Error('This browser is out of storage space. Try a smaller image.');
      if (fullImg !== undefined) { const im = rd(IMGS, {}); if (fullImg) im[id] = fullImg; else delete im[id]; wr(IMGS, im) }
      custom = fromTree(m);
    }
    merge(); return id;
  };
  const remove = async id => {
    if (live) { await http('DELETE', `projects/${id}`); await http('DELETE', `projectImgs/${id}`); const t = await http('GET', 'projects'); wr(CACHE, t || {}); custom = fromTree(t) }
    else { const m = rd(KEY, {}); delete m[id]; wr(KEY, m); const im = rd(IMGS, {}); delete im[id]; wr(IMGS, im); custom = fromTree(m) }
    merge();
  };
  // raw stored record (used by the edit form so thumbnails are not re-encoded)
  const raw = async id => live ? http('GET', `projects/${id}`) : rd(KEY, {})[id];
  // the larger picture, loaded only on the case study page and in the lightbox
  const full = async id => { try { if (live) return await (await fetch(url(`projectImgs/${id}`))).json(); return rd(IMGS, {})[id] || null } catch { return null } };

  /* ---------- resize an uploaded file in the browser so it fits in the database ---------- */
  const shrink = (file, max, q, maxLength) => new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error('Please choose an image file.'));
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Could not read that file.'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('That image could not be opened.'));
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
        let w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
        const g = c.getContext('2d');
        while (true) {
          c.width = w; c.height = h;
          g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
          for (let quality = q; quality >= .35; quality -= .1) {
            const result = c.toDataURL('image/jpeg', quality);
            if (result.length <= maxLength) return res(result);
          }
          if (Math.max(w, h) <= 320) return rej(new Error('This image cannot be compressed enough. Choose a simpler or smaller image.'));
          w = Math.max(1, Math.round(w * .8)); h = Math.max(1, Math.round(h * .8));
        }
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  window.NSTProjects = {
    live, list: [], imgOf, imgAdmin, save, remove, raw, full, shrink, load,
    onChange: f => { listeners.add(f); return () => listeners.delete(f) },
    find: id => window.WORKS.find(w => String(w.id) === String(id))
  };
  load();
})();
