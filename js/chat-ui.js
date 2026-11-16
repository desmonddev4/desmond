/* chat-ui.js: the message thread, shared by the visitor widget and the owner inbox. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (t, c, txt) => { const n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n };
  const i = {
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>',
    quote: '<svg viewBox="0 0 24 24"><path d="m9 14-5-5 5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v4"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="12" cy="19" r=".9"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>'
  };
  const URLRE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;
  const fill = (n, text) => {
    n.textContent = '';
    text.split(URLRE).forEach((p, k) => {
      if (k % 2) { const a = el('a'); a.href = p; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow'; a.textContent = p; n.append(a) }
      else if (p) n.append(p);
    });
  };
  const ini = name => (Array.from((name || '').trim())[0] || '?').toUpperCase();
  const tm = t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const same = (a, b) => a.toDateString() === b.toDateString();
  const day = t => { const d = new Date(t), n = new Date();
    return (same(d, n) ? 'Today' : same(d, new Date(n - 864e5)) ? 'Yesterday' : d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })) + ' · ' + tm(t) };

  /* thread(root, { mine:'v'|'a', name:()=>visitorName, onQuote(text), onRetry(key) }) */
  function thread(root, o) {
    const other = o.mine === 'v' ? 'a' : 'v';
    const feed = el('div', 'nc-feed'), list = el('div', 'nc-list'), typ = el('div', 'nc-typing'), more = el('button', 'nc-more', 'New message');
    feed.setAttribute('role', 'log'); feed.setAttribute('aria-live', 'polite'); feed.setAttribute('aria-relevant', 'additions');
    more.type = 'button';
    typ.innerHTML = `<div class="b ${other}"><span class="av${other === 'a' ? ' orbm' : ''}"></span><div class="col"><div class="bub tdots" aria-label="typing"><i></i><i></i><i></i></div></div></div>`;
    const typAv = typ.querySelector('.av');
    feed.append(list, typ); root.append(feed, more);

    const nodes = new Map();
    let ready = false, stuck = true;
    const near = () => feed.scrollHeight - feed.scrollTop - feed.clientHeight < 120;
    const toEnd = smooth => feed.scrollTo({ top: feed.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    feed.addEventListener('scroll', () => { stuck = near(); if (stuck) more.classList.remove('on') }, { passive: true });
    more.addEventListener('click', () => toEnd(true));
    const ro = new ResizeObserver(() => { if (stuck) toEnd(false) });
    ro.observe(feed); ro.observe(list);

    const mkSep = r => el('div', 'sep', r.sep);
    const mkMsg = it => {
      const mine = it.from === o.mine, n = el('div', 'b ' + it.from + (mine ? ' mine' : ''));
      const av = el('span', 'av' + (it.from === 'a' ? ' orbm' : '')), col = el('div', 'col'), bub = el('div', 'bub'), meta = el('div', 'meta');
      const time = el('span', 'tm');
      meta.append(time);
      if (!mine) {
        const acts = el('span', 'acts');
        const mkBtn = (name, label, fn) => { const b = el('button'); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; b.innerHTML = i[name]; b.addEventListener('click', () => fn(b)); return b };
        acts.append(
          mkBtn('copy', 'Copy message', b => { (navigator.clipboard ? navigator.clipboard.writeText(n._it.text) : Promise.reject()).then(() => { b.innerHTML = i.check; b.classList.add('ok'); setTimeout(() => { b.innerHTML = i.copy; b.classList.remove('ok') }, 1300) }).catch(() => {}) }),
          mkBtn('quote', 'Reply to this message', () => o.onQuote && o.onQuote(n._it.text)));
        meta.append(acts);
      } else {
        meta.addEventListener('click', () => { if (n._it && n._it.status === 'failed') o.onRetry && o.onRetry(n._it.k) });
      }
      col.append(bub, meta); n.append(av, col);
      Object.assign(n, { _bub: bub, _av: av, _tm: time, _meta: meta });
      return n;
    };
    const paint = (n, r) => {
      const it = r.it; n._it = it;
      n.classList.toggle('end', r.end);
      if (n._t !== it.text) { n._t = it.text; fill(n._bub, it.text) }
      if (it.from === 'v') n._av.textContent = ini(o.name && o.name());
      if (it.from === o.mine) {
        const st = it.status;
        n._tm.textContent = st === 'failed' ? 'Not sent. Tap to retry' : st === 'sending' ? 'Sending…' : tm(it.ts);
        n._meta.classList.toggle('fail', st === 'failed');
        n._meta.setAttribute('role', st === 'failed' ? 'button' : 'presentation');
        n._meta.tabIndex = st === 'failed' ? 0 : -1;
      } else n._tm.textContent = it.local ? '' : tm(it.ts);
      n.classList.toggle('local', !!it.local);
    };

    function update(items) {
      const rows = []; let lastReal = null;
      items.forEach(it => {
        if (!it.local && (!lastReal || it.ts - lastReal.ts > 15 * 60e3)) rows.push({ id: 's' + it.k, sep: day(it.ts) });
        const pr = rows[rows.length - 1];
        const cont = !!(pr && pr.it && !pr.it.local && !it.local && pr.it.from === it.from && it.ts - pr.it.ts < 120e3);
        rows.push({ id: 'm' + it.k, it, cont });
        if (!it.local) lastReal = it;
      });
      rows.forEach((r, k) => { if (r.it) { const nx = rows[k + 1]; r.end = !(nx && nx.it && nx.cont) } });

      let cursor = list.firstChild, addedMine = false, addedOther = false; const keep = new Set();
      rows.forEach(r => {
        keep.add(r.id);
        let n = nodes.get(r.id);
        if (!n) {
          n = r.sep ? mkSep(r) : mkMsg(r.it); nodes.set(r.id, n);
          if (r.it && !r.it.local) { if (r.it.from === o.mine) addedMine = true; else addedOther = true }
          if (ready && r.it) { n.classList.add('pop'); n.addEventListener('animationend', () => n.classList.remove('pop'), { once: true }) }
        }
        if (n === cursor) cursor = cursor.nextSibling; else list.insertBefore(n, cursor);
        if (r.it) paint(n, r);
      });
      nodes.forEach((n, id) => { if (!keep.has(id)) { n.remove(); nodes.delete(id) } });

      if (!ready) { ready = true; toEnd(false) }
      else if (addedMine || (addedOther && stuck)) toEnd(true);
      else if (addedOther) more.classList.add('on');
    }
    return {
      update, feed, toEnd,
      setTyping(on) { typ.classList.toggle('on', on); if (on) { if (other === 'v') typAv.textContent = ini(o.name && o.name()); if (stuck) toEnd(true) } },
      reset() { nodes.forEach(n => n.remove()); nodes.clear(); ready = false; stuck = true; typ.classList.remove('on'); more.classList.remove('on') }
    };
  }
  window.NSTUI = { thread, i, el, ini, tm, day, reduce };
})();
