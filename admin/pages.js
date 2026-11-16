/* pages.js: the six admin screens. Each one renders into #view from the shared data. */
(() => {
  const pages = {};
  const W = () => window.WORKS || [];
  const PROJ = ['Planned', 'Building', 'Shipped'];
  const projState = () => w => w.status || 'Shipped';

  /* ============ Overview ============ */
  let ovRange = 7;
  pages.overview = { usesChats: true, render(v, x) {
    if (!x._sub) { x._sub = 1; document.addEventListener('nst:projects', () => x.repaint()) }
    const s = x.stats(), h = new Date().getHours(), hi = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const d7 = x.daily(7), spk = d7.map(d => d.v + d.a), delta = s.prev ? Math.round((s.week - s.prev) / s.prev * 100) : (s.week ? 100 : 0);
    const stage = x.D.chats.reduce((m, c) => (m[x.leadStage(c)]++, m), { new: 0, talking: 0, proposal: 0, won: 0 });
    const ps = projState(), shipped = W().filter(w => ps(w) === 'Shipped').length;
    v.innerHTML = `
    <div class="ph"><div><h2>${hi}, ${x.esc(x.own.name || 'Desmond')}</h2><p>${s.awaiting ? `${s.awaiting} visitor${s.awaiting > 1 ? 's are' : ' is'} waiting for a reply${s.oldest > 36e5 ? `, the longest for ${x.dur(s.oldest)}` : ''}.` : 'Every conversation has a reply. Nice work.'}</p></div>
      <div class="acts"><a class="pb lt" href="../inbox.html"><span class="pi">${x.png('chatbot')}</span><span>Open inbox</span></a><a class="pb lt" href="../index.html"><span class="pi">${x.png('service')}</span><span>View site</span></a><a class="pb lt" href="leads.html"><span class="pi">${x.png('mail')}</span><span>Review leads</span></a></div></div>
    <div class="grid">
      <article class="card st s3">${x.sparkSvg(spk)}<span class="ti">${x.ic.chat}</span><span class="lb">Conversations</span><span class="nm" data-n="${s.total}">0</span><span class="nt"><span class="dl ${delta < 0 ? 'dn' : delta ? '' : 'nu'}">${delta > 0 ? '+' : ''}${delta}%</span>${s.week} this week</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#ff9ec0,#ffb98a);box-shadow:0 14px 24px -10px #ff8fb0">${x.ic.clock}</span><span class="lb">Awaiting your reply</span><span class="nm" data-n="${s.awaiting}">0</span><span class="nt">${s.awaiting ? `<span class="dl wa">${s.unread} unread</span>` : '<span class="dl">All clear</span>'} <a class="pb lt sm" href="../inbox.html" style="margin-left:auto"><span>Reply</span></a></span></article>
      <article class="card st s3"><svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="#7b7cff1c" stroke-width="8"/><circle cx="32" cy="32" r="26" fill="none" stroke="url(#gsp)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(s.rate / 100 * 163.4).toFixed(1)} 163.4" transform="rotate(-90 32 32)"/></svg><span class="ti" style="background:linear-gradient(135deg,#26c281,#6edbb0);box-shadow:0 14px 24px -10px #26c281">${x.ic.bolt}</span><span class="lb">Reply rate</span><span class="nm" data-n="${s.rate}" data-s="%">0%</span><span class="nt">${s.replied} of ${s.total} answered</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#6e93ff,#3bb3ff);box-shadow:0 14px 24px -10px #3bb3ff">${x.ic.folder}</span><span class="lb">Projects on the site</span><span class="nm" data-n="${W().length}">0</span><span class="nt"><span class="dl nu">${shipped} shipped</span>${W().length - shipped} in the pipeline</span></article>

      <article class="card s8"><div class="ch"><div><h3>Conversation activity</h3><small>Days on which a visitor wrote or you replied last</small></div><div class="seg" id="rng"><button data-r="7" class="${ovRange === 7 ? 'on' : ''}">7 days</button><button data-r="30" class="${ovRange === 30 ? 'on' : ''}">30 days</button></div></div><div id="ac"></div><div class="lg" style="margin-top:10px"><span style="--c:#7b7cff">From visitors</span><span style="--c:#ffaecb">Your replies</span></div></article>
      <article class="card s4"><div class="ch"><div><h3>Inbox health</h3><small>Who spoke last</small></div></div><div class="dn-wrap"><div id="dn"></div><div class="lgv"><div style="--c:#7b7cff">Awaiting you<b>${s.awaiting}</b></div><div style="--c:#26c281">Answered<b>${s.replied}</b></div><div style="--c:#ffaecb">Projects<b>${s.projects}</b></div><div style="--c:#a9c1ff">Questions<b>${s.questions}</b></div></div></div></article>

      <article class="card s7"><div class="ch"><div><h3>Latest conversations</h3><small>Tap one to open it in the inbox</small></div><a class="pb lt sm" href="conversations.html"><span class="pi sv">${x.ic.arrow}</span><span>See all</span></a></div>
        <div class="lst">${x.D.chats.slice(0, 6).map(c => `<a class="li${x.unread(c) ? ' unread' : ''}" href="../inbox.html"><span class="${x.av(c.name)}">${x.esc(x.ini(c.name))}</span><span class="tx"><span class="nm2"><span>${x.esc(x.nameOf(c))}</span>${c.topic ? `<span class="chip">${x.esc(c.topic)}</span>` : ''}</span><span class="ls">${c.lastFrom === 'a' ? 'You: ' : ''}${x.esc(c.lastText || '')}</span></span>${x.unread(c) ? '<i class="ub" aria-label="Unread"></i>' : ''}<time>${x.ago(c.lastAt)}</time></a>`).join('') || '<div class="empty">No conversations yet.</div>'}</div></article>
      <article class="card s5 dark" id="sysc"><div class="ch"><div><h3>System status</h3><small>What is running right now</small></div><a class="pb sm" href="system.html"><span class="pi sv">${x.ic.cog}</span><span>Details</span></a></div><div class="stl" id="ovst"></div></article>

      <article class="card s6"><div class="ch"><div><h3>Lead pipeline</h3><small>Where your conversations stand</small></div><a class="pb lt sm" href="leads.html"><span class="pi sv">${x.ic.target}</span><span>Open board</span></a></div>
        <div class="hb" id="pipe"></div></article>
      <article class="card s6"><div class="ch"><div><h3>Projects</h3><small>Tracker status, saved in this browser</small></div><a class="pb lt sm" href="projects.html"><span class="pi">${x.png('work')}</span><span>Manage</span></a></div>
        <div class="lst">${W().slice(0, 4).map(w => `<a class="li" href="../project.html?id=${encodeURIComponent(w.id)}"><img src="${x.esc(window.NSTProjects.imgAdmin(w))}" alt="" width="64" height="40" style="width:64px;height:40px;border-radius:12px;object-fit:cover;flex:none"><span class="tx"><span class="nm2"><span>${x.esc(w.t)}</span></span><span class="ls">${x.esc(w.tag)} · ${x.esc(w.year)}</span></span><span class="chip ${ps(w) === 'Shipped' ? 'g' : ps(w) === 'Building' ? 'o' : 'n'}">${ps(w)}</span></a>`).join('')}</div></article>
    </div>`;
    x.donut(x.$('#dn', v), [{ value: s.awaiting, color: '#7b7cff' }, { value: s.replied, color: '#26c281' }], s.total, 'chats');
    const draw = () => { const d = x.daily(ovRange); x.area(x.$('#ac', v), { labels: d.map(k => k.label), series: [{ name: 'From visitors', color: '#7b7cff', values: d.map(k => k.v) }, { name: 'Your replies', color: '#ffaecb', values: d.map(k => k.a) }] }) };
    draw(); x.$$('#rng button', v).forEach(b => b.addEventListener('click', () => { ovRange = +b.dataset.r; x.$$('#rng button', v).forEach(k => k.classList.toggle('on', k === b)); draw() }));
    x.bars(x.$('#pipe', v), [['New', 'new'], ['In talks', 'talking'], ['Proposal sent', 'proposal'], ['Won', 'won']].map(([l, k]) => ({ label: l, value: stage[k] })));
    pages.overview.onOwner(x.D.owner, x);
  },
  onOwner(o, x) {
    const box = document.getElementById('ovst'); if (!box) return;
    const on = x.C.ownerOnline(o), perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const row = (t, sub, st, cls) => `<div class="sr" style="background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)"><span class="dot ${cls}"></span><span class="tx"><b>${t}</b><small style="color:#8fa0d8">${sub}</small></span><span class="rt">${st}</span></div>`;
    box.innerHTML = row('Chat connection', x.C.live ? 'Firebase Realtime Database' : 'Demo mode, this browser only', x.C.live ? 'Live' : 'Demo', x.C.live ? 'ok' : 'warn')
      + row('Your presence', 'What visitors see in the chat', on ? 'Available' : 'Away', on ? 'ok' : '')
      + row('Desktop alerts', 'For new visitor messages', perm === 'granted' ? 'On' : perm === 'denied' ? 'Blocked' : 'Off', perm === 'granted' ? 'ok' : perm === 'denied' ? 'bad' : 'warn');
  } };

  /* ============ Conversations ============ */
  const cv = { f: new URLSearchParams(location.search).get('f') || 'all', q: new URLSearchParams(location.search).get('q') || '', sort: 'lastAt', dir: -1, n: 10 };
  pages.conversations = { usesChats: true, render(v, x) {
    const s = x.stats(), all = x.D.chats;
    const F = { all: ['All', () => true], awaiting: ['Awaiting reply', c => c.lastFrom === 'v'], replied: ['Replied', c => c.lastFrom === 'a'], unread: ['Unread', x.unread], project: ['Projects', c => c.topic === 'Project'], question: ['Questions', c => c.topic !== 'Project'] };
    const rows = () => { const q = cv.q.toLowerCase(); return all.filter(F[cv.f][1]).filter(c => !q || (x.nameOf(c) + ' ' + (c.lastText || '') + ' ' + (c.email || '') + ' ' + (c.topic || '')).toLowerCase().includes(q)).sort((a, b) => { const k = cv.sort, av = k === 'name' ? x.nameOf(a).toLowerCase() : a[k] || '', bv = k === 'name' ? x.nameOf(b).toLowerCase() : b[k] || ''; return (av > bv ? 1 : av < bv ? -1 : 0) * cv.dir }) };
    v.innerHTML = `
    <div class="ph"><div><h2>Conversations</h2><p>Everyone who has said hello through the site chat, with what needs you first.</p></div><div class="acts"><a class="pb lt" href="../inbox.html"><span class="pi">${x.png('chatbot')}</span><span>Open live inbox</span></a><button class="pb lt" id="exp" type="button"><span class="pi sv">${x.ic.down}</span><span>Export CSV</span></button></div></div>
    <div class="grid">
      <article class="card st s3"><span class="ti">${x.ic.users}</span><span class="lb">Total conversations</span><span class="nm" data-n="${s.total}">0</span><span class="nt">${s.week} active this week</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#ff9ec0,#ffb98a);box-shadow:0 14px 24px -10px #ff8fb0">${x.ic.clock}</span><span class="lb">Longest wait</span><span class="nm">${s.awaiting ? x.dur(s.oldest) : 'None'}</span><span class="nt">${s.awaiting} waiting for you</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#26c281,#6edbb0);box-shadow:0 14px 24px -10px #26c281">${x.ic.bolt}</span><span class="lb">Reply rate</span><span class="nm" data-n="${s.rate}" data-s="%">0%</span><span class="nt">${s.replied} answered</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#6e93ff,#3bb3ff);box-shadow:0 14px 24px -10px #3bb3ff">${x.ic.target}</span><span class="lb">Project enquiries</span><span class="nm" data-n="${s.projects}">0</span><span class="nt">${s.total ? Math.round(s.projects / s.total * 100) : 0}% of all chats</span></article>
      <article class="card s7"><div class="ch"><div><h3>When people write</h3><small>Last message time, by weekday and two-hour block</small></div></div><div id="hm"></div></article>
      <article class="card s5"><div class="ch"><div><h3>What they ask about</h3><small>And how long visitors have waited</small></div></div><div class="dn-wrap" style="margin-bottom:20px"><div id="tp"></div><div class="lgv"><div style="--c:#7b7cff">Projects<b>${s.projects}</b></div><div style="--c:#ffaecb">Questions<b>${s.questions}</b></div></div></div><div id="wt"></div></article>
      <article class="card s12"><div class="ch"><div><h3>All conversations</h3><small id="cnt"></small></div><div class="fl" id="fl">${Object.entries(F).map(([k, [l, fn]]) => `<button class="f${cv.f === k ? ' on' : ''}" data-f="${k}" type="button">${l}<span class="c">${all.filter(fn).length}</span></button>`).join('')}</div></div>
        <div class="tw"><table><thead><tr><th><button data-s="name" type="button">Visitor</button></th><th>Topic</th><th>Last message</th><th><button data-s="lastAt" type="button">Last activity</button></th><th>Status</th><th></th></tr></thead><tbody id="tb"></tbody></table></div><div style="display:flex;justify-content:center;margin-top:12px"><button class="pb lt" id="more" type="button"><span class="pi sv">${x.ic.plus}</span><span>Show more</span></button></div></article>
    </div>`;
    x.heat(x.$('#hm', v), x.hours());
    x.donut(x.$('#tp', v), [{ value: s.projects, color: '#7b7cff' }, { value: s.questions, color: '#ffaecb' }], s.total, 'chats');
    const wt = x.D.chats.filter(c => c.lastFrom === 'v').map(c => Date.now() - c.lastAt), bk = (a, b) => wt.filter(t => t >= a && t < b).length;
    x.bars(x.$('#wt', v), [{ label: 'Under 1 hour', value: bk(0, 36e5) }, { label: '1 to 24 hours', value: bk(36e5, 864e5) }, { label: '1 to 7 days', value: bk(864e5, 6048e5) }, { label: 'Over 7 days', value: bk(6048e5, 1e15) }]);
    const draw = () => { const all2 = rows(), r = all2.slice(0, cv.n); x.$('#cnt', v).textContent = `Showing ${r.length} of ${all2.length}`; x.$('#more', v).parentNode.hidden = all2.length <= cv.n;
      x.$('#tb', v).innerHTML = r.map(c => `<tr class="r"><td><div class="who"><span class="${x.av(c.name)} sm">${x.esc(x.ini(c.name))}</span><span>${x.esc(x.nameOf(c))}<small>${x.esc(c.email || 'No email left')}</small></span></div></td><td>${c.topic ? `<span class="chip">${x.esc(c.topic)}</span>` : '<span class="chip n">General</span>'}</td><td><div class="cut">${c.lastFrom === 'a' ? 'You: ' : ''}${x.esc(c.lastText || '')}</div></td><td class="num">${x.ago(c.lastAt)}</td><td>${c.lastFrom === 'v' ? `<span class="chip ${x.unread(c) ? 'o' : 'n'}">${x.unread(c) ? 'Unread' : 'Awaiting you'}</span>` : '<span class="chip g">Replied</span>'}</td><td><a class="pb lt sm" href="../inbox.html"><span>Open</span></a></td></tr>`).join('') || `<tr><td colspan="6"><div class="empty">Nothing matches. Try another filter or clear the search.</div></td></tr>` };
    draw();
    x.$('#more', v).addEventListener('click', () => { cv.n += 10; draw() });
    x.$$('#fl .f', v).forEach(b => b.addEventListener('click', () => { cv.f = b.dataset.f; cv.n = 10; x.$$('#fl .f', v).forEach(k => k.classList.toggle('on', k === b)); draw() }));
    x.$$('th button', v).forEach(b => b.addEventListener('click', () => { cv.dir = cv.sort === b.dataset.s ? -cv.dir : -1; cv.sort = b.dataset.s; draw() }));
    const gs = x.$('#gs'); gs.oninput = () => { cv.q = gs.value; cv.n = 10; draw() };
    x.$('#exp', v).addEventListener('click', () => { const q = t => '"' + String(t == null ? '' : t).replace(/"/g, '""') + '"'; x.download('conversations.csv', ['Name,Email,Topic,Last from,Last message,Last activity'].concat(rows().map(c => [x.nameOf(c), c.email, c.topic, c.lastFrom === 'a' ? 'You' : 'Visitor', c.lastText, new Date(c.lastAt).toISOString()].map(q).join(','))).join('\n'), 'text/csv'); x.toast('Exported ' + rows().length + ' conversations') });
  } };

  /* ============ Leads (kanban) ============ */
  let ldOnly = false;
  const COLS = [['new', 'New', '#7b7cff'], ['talking', 'In talks', '#3bb3ff'], ['proposal', 'Proposal sent', '#f0a020'], ['won', 'Won', '#26c281']];
  pages.leads = { usesChats: true, render(v, x) {
    const list = x.D.chats.filter(c => !ldOnly || c.topic === 'Project'), st = c => x.leadStage(c);
    const cnt = k => list.filter(c => st(c) === k).length, won = cnt('won'), closed = list.length;
    const setStage = (cid, k) => { const m = x.lsGet('nst_admin_leads', {}); m[cid] = k; x.lsSet('nst_admin_leads', m); x.repaint(); x.toast('Moved to ' + COLS.find(c => c[0] === k)[1]) };
    v.innerHTML = `
    <div class="ph"><div><h2>Leads</h2><p>Drag a card, or use the arrows, to move a conversation through your pipeline. Stages are saved in this browser.</p></div>
      <div class="seg" id="lo"><button class="${ldOnly ? '' : 'on'}" data-o="0" type="button">All conversations</button><button class="${ldOnly ? 'on' : ''}" data-o="1" type="button">Project enquiries</button></div></div>
    <div class="grid">
      <article class="card st s3"><span class="ti">${x.ic.users}</span><span class="lb">In the pipeline</span><span class="nm" data-n="${list.length}">0</span><span class="nt">${ldOnly ? 'Project enquiries' : 'All conversations'}</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#6e93ff,#3bb3ff);box-shadow:0 14px 24px -10px #3bb3ff">${x.ic.chat}</span><span class="lb">In talks or proposal</span><span class="nm" data-n="${cnt('talking') + cnt('proposal')}">0</span><span class="nt">Active right now</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#26c281,#6edbb0);box-shadow:0 14px 24px -10px #26c281">${x.ic.check}</span><span class="lb">Won</span><span class="nm" data-n="${won}">0</span><span class="nt">Clients so far</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#ff9ec0,#ffb98a);box-shadow:0 14px 24px -10px #ff8fb0">${x.ic.target}</span><span class="lb">Win rate</span><span class="nm" data-n="${closed ? Math.round(won / closed * 100) : 0}" data-s="%">0%</span><span class="nt">Won out of all leads</span></article>
    </div>
    <div class="kb" style="margin-top:18px">${COLS.map(([k, l, col], ci) => `<section class="kc" data-k="${k}" aria-label="${l}"><div class="kh" style="--c:${col}"><i></i>${l}<span>${cnt(k)}</span></div><div class="kcards">${list.filter(c => st(c) === k).map(c => `<article class="lc" draggable="true" data-id="${x.esc(c.cid)}"><div class="t"><span class="${x.av(c.name)} sm">${x.esc(x.ini(c.name))}</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis">${x.esc(x.nameOf(c))}</span></div><p>${x.esc(c.lastText || '')}</p><div class="b">${c.topic ? `<span class="chip">${x.esc(c.topic)}</span>` : ''}<span class="chip n">${x.ago(c.lastAt)}</span><span class="mv"><button class="mvb" data-d="-1" aria-label="Move back" ${ci === 0 ? 'disabled' : ''} type="button">${x.ic.left}</button><button class="mvb" data-d="1" aria-label="Move forward" ${ci === 3 ? 'disabled' : ''} type="button">${x.ic.right}</button></span></div></article>`).join('') || '<div class="empty">Nothing here yet.</div>'}</div></section>`).join('')}</div>`;
    x.$$('#lo button', v).forEach(b => b.addEventListener('click', () => { ldOnly = b.dataset.o === '1'; x.repaint() }));
    x.$$('.lc', v).forEach(c => {
      const id = c.dataset.id, cur = COLS.findIndex(k => k[0] === c.closest('.kc').dataset.k);
      x.$$('.mvb', c).forEach(b => b.addEventListener('click', () => setStage(id, COLS[cur + +b.dataset.d][0])));
      c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; c.classList.add('drag') }); c.addEventListener('dragend', () => c.classList.remove('drag'));
    });
    x.$$('.kc', v).forEach(k => { k.addEventListener('dragover', e => { e.preventDefault(); k.classList.add('over') }); k.addEventListener('dragleave', () => k.classList.remove('over')); k.addEventListener('drop', e => { e.preventDefault(); k.classList.remove('over'); const id = e.dataTransfer.getData('text/plain'); id && setStage(id, k.dataset.k) }) });
  } };

  /* ============ Projects ============ */
  let pjTag = 'All';
  const CATS = ['E-commerce', 'Frontend', 'Motion', 'Full stack', 'Mobile app', 'Backend and API', 'IoT'];
  const field = (id, label, html, hint) => `<label class="fld" for="${id}"><span>${label}</span>${html}${hint ? `<em>${hint}</em>` : ''}</label>`;

  /* the Add / Edit window */
  const projectForm = async (x, id) => {
    const P = window.NSTProjects, editing = id != null;
    let rec = {};
    if (editing) { try { rec = (await P.raw(id)) || {} } catch { x.toast('Could not load that project'); return } }
    const tags = [...new Set([...CATS, ...W().map(w => w.tag)])];
    const back = document.activeElement;
    const m = document.createElement('div'); m.className = 'mod'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'mtitle');
    m.innerHTML = `
    <div class="mod-scrim"></div>
    <form class="mod-win" novalidate>
      <header class="mod-h"><div><h2 id="mtitle">${editing ? 'Edit project' : 'Add a project'}</h2><p>${editing ? 'Changes go live on your site as soon as you save.' : 'It appears in your Work section and on the home page as soon as you save.'}</p></div><button class="mod-x" type="button" data-x aria-label="Close">${x.ic.plus}</button></header>
      <div class="mod-b">
        <div class="fgrid">
          ${field('f-t', 'Project name <b>*</b>', `<input id="f-t" name="t" maxlength="90" autocomplete="off" placeholder="Lynne’s Cosmetics: home page" value="${x.esc(rec.t || '')}">`)}
          ${field('f-tag', 'Category <b>*</b>', `<input id="f-tag" name="tag" maxlength="30" list="f-tags" autocomplete="off" placeholder="Pick one or type your own" value="${x.esc(rec.tag || '')}"><datalist id="f-tags">${tags.map(t => `<option value="${x.esc(t)}">`).join('')}</datalist>`)}
        </div>
        ${field('f-d', 'Short description <b>*</b>', `<textarea id="f-d" name="d" rows="2" maxlength="180" placeholder="One or two sentences. Shown on the project card.">${x.esc(rec.d || '')}</textarea>`)}
        <div class="fld"><span>Cover image ${editing ? '' : '<b>*</b>'}</span>
          <div class="drop" id="drop" tabindex="0" role="button" aria-label="Choose a cover image">
            <img id="dprev" alt="" ${rec.thumb ? `src="${x.esc(rec.thumb)}"` : 'hidden'}>
            <div class="dtxt"><b>${rec.thumb ? 'Replace image' : 'Drop an image here, or click to choose'}</b><small>JPG, PNG or WebP. It is resized here in your browser, so big photos are fine. A wide screenshot (about 2:1) looks best.</small></div>
            <input id="f-img" type="file" accept="image/*" hidden>
          </div>
        </div>
        <div class="fgrid">
          ${field('f-st', 'Status', `<select id="f-st" name="status">${PROJ.map(p => `<option${(rec.status || 'Shipped') === p ? ' selected' : ''}>${p}</option>`).join('')}</select>`)}
          ${field('f-live', 'Live link', `<input id="f-live" name="live" type="url" inputmode="url" maxlength="300" placeholder="https://example.com" value="${x.esc(rec.live || '')}">`, 'Leave empty to hide the “Visit live site” button.')}
        </div>
        <details class="more" ${rec.brief || rec.built || rec.result || rec.client ? 'open' : ''}><summary>Case study details <small>optional, fills the project page</small></summary>
          <div class="fgrid">
            ${field('f-c', 'Client', `<input id="f-c" name="client" maxlength="90" value="${x.esc(rec.client || '')}">`)}
            ${field('f-r', 'Your role', `<input id="f-r" name="role" maxlength="90" placeholder="Frontend development" value="${x.esc(rec.role || '')}">`)}
            ${field('f-y', 'Year', `<input id="f-y" name="year" maxlength="9" inputmode="numeric" value="${x.esc(rec.year || new Date().getFullYear())}">`)}
            ${field('f-s', 'Built with', `<input id="f-s" name="stack" maxlength="160" placeholder="HTML, CSS, JavaScript" value="${x.esc(Array.isArray(rec.stack) ? rec.stack.join(', ') : rec.stack || '')}">`, 'Separate with commas.')}
          </div>
          ${field('f-b', 'The brief', `<textarea id="f-b" name="brief" rows="3" maxlength="700" placeholder="What did the client need?">${x.esc(rec.brief || '')}</textarea>`)}
          ${field('f-w', 'What I built', `<textarea id="f-w" name="built" rows="3" maxlength="700" placeholder="What did you make?">${x.esc(rec.built || '')}</textarea>`)}
          ${field('f-res', 'The result', `<textarea id="f-res" name="result" rows="3" maxlength="500" placeholder="What changed for the client?">${x.esc(rec.result || '')}</textarea>`)}
        </details>
        <p class="ferr" role="alert" hidden></p>
      </div>
      <footer class="mod-f"><button class="pb lt" type="button" data-x><span>Cancel</span></button><button class="pb fill" type="submit"><span class="pi sv">${x.ic.check}</span><span data-go>${editing ? 'Save changes' : 'Add project'}</span></button></footer>
    </form>`;
    document.body.append(m); document.documentElement.classList.add('mod-lock');
    const $ = s => m.querySelector(s), form = $('form'), err = $('.ferr'), drop = $('#drop'), file = $('#f-img'), prev = $('#dprev');
    let thumb = rec.thumb || '', full, busy = false;
    const close = () => { m.classList.remove('on'); document.documentElement.classList.remove('mod-lock'); setTimeout(() => m.remove(), 280); back && back.focus && back.focus({ preventScroll: true }) };
    const fail = (t, el) => { err.textContent = t; err.hidden = false; el && el.focus() };
    const take = async f => {
      if (!f) return; err.hidden = true;
      try { [thumb, full] = await Promise.all([P.shrink(f, 900, .78), P.shrink(f, 1800, .82)]); prev.src = thumb; prev.hidden = false; $('.dtxt b', drop).textContent = 'Replace image'; drop.classList.add('has') }
      catch (e) { fail(e.message) }
    };
    drop.addEventListener('click', () => file.click());
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click() } });
    file.addEventListener('change', () => take(file.files[0]));
    ['dragenter', 'dragover'].forEach(n => drop.addEventListener(n, e => { e.preventDefault(); drop.classList.add('over') }));
    ['dragleave', 'drop'].forEach(n => drop.addEventListener(n, e => { e.preventDefault(); drop.classList.remove('over') }));
    drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));
    if (rec.thumb) drop.classList.add('has');
    m.addEventListener('click', e => { if (e.target.classList.contains('mod-scrim') || e.target.closest('[data-x]')) close() });
    m.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return }
      if (e.key !== 'Tab') return;
      const f = [...m.querySelectorAll('a[href],button:not(:disabled),input:not([type=file]),textarea,select,summary')].filter(n => n.offsetParent !== null);
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    });
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (busy) return;
      const g = n => form.elements[n].value.trim(), t = g('t'), tag = g('tag'), d = g('d'), live = g('live');
      if (!t) return fail('Give the project a name.', form.elements.t);
      if (!tag) return fail('Pick a category or type a new one.', form.elements.tag);
      if (!d) return fail('Add a short description.', form.elements.d);
      if (!thumb) return fail('Add a cover image.', drop);
      if (live && !/^https?:\/\//i.test(live)) return fail('The live link must start with http:// or https://', form.elements.live);
      const next = { ...rec, t, tag, d, img: '', thumb, status: g('status'), live, client: g('client'), role: g('role'), year: g('year') || String(new Date().getFullYear()),
        stack: g('stack').split(',').map(s => s.trim()).filter(Boolean).slice(0, 12), brief: g('brief'), built: g('built'), result: g('result') };
      busy = true; err.hidden = true; const go = $('[data-go]'); go.textContent = 'Saving…'; form.querySelector('.fill').disabled = true;
      try { await P.save(editing ? id : null, next, full); x.toast(editing ? 'Project updated' : 'Project added. It is live on your site.'); close() }
      catch (ex) { busy = false; go.textContent = editing ? 'Save changes' : 'Add project'; form.querySelector('.fill').disabled = false; fail(ex.status === 401 || ex.status === 403 ? 'Firebase denied this change. Sign in again; if it still fails, publish firebase-rules.json and check the owner email in its rules.' : (ex.message || 'Could not save. Check your connection and try again.')) }
    });
    requestAnimationFrame(() => { m.classList.add('on'); form.elements.t.focus({ preventScroll: true }) });
  };

  pages.projects = { usesChats: false, render(v, x) {
    if (!x._sub) { x._sub = 1; document.addEventListener('nst:projects', () => x.repaint()) }
    const P = window.NSTProjects, ps = projState(), tags = ['All', ...new Set(W().map(w => w.tag))];
    const set = async (w, st) => {
      try {
        const r = await P.raw(w.id); await P.save(w.id, { ...r, status: st });
        x.toast(`${w.t.split(':')[0]} marked ${st.toLowerCase()}`);
      } catch { x.toast('Could not change the status') }
    };
    const by = k => W().filter(w => ps(w) === k).length, tagRows = tags.slice(1).map(t => ({ label: t, value: W().filter(w => w.tag === t).length }));
    const mine = W().length;
    v.innerHTML = `
    <div class="ph"><div><h2>Projects</h2><p>Add the work you want visitors to see. Projects you add show up in your Work section, on the home page and as their own case study page. ${P.live ? '' : 'Demo mode: they are saved in this browser until you connect Firebase.'}</p></div><div class="acts"><button class="pb fill" id="padd" type="button"><span class="pi sv">${x.ic.plus}</span><span>Add project</span></button><a class="pb lt" href="../work.html"><span class="pi">${x.png('work')}</span><span>Open Work page</span></a></div></div>
    <div class="grid">
      <article class="card st s3"><span class="ti">${x.ic.folder}</span><span class="lb">Total projects</span><span class="nm" data-n="${W().length}">0</span><span class="nt">${mine} added by you</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#26c281,#6edbb0);box-shadow:0 14px 24px -10px #26c281">${x.ic.check}</span><span class="lb">Shipped</span><span class="nm" data-n="${by('Shipped')}">0</span><span class="nt">Live and done</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#f0a020,#ffd37a);box-shadow:0 14px 24px -10px #f0a020">${x.ic.bolt}</span><span class="lb">Building</span><span class="nm" data-n="${by('Building')}">0</span><span class="nt">In progress</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#6e93ff,#3bb3ff);box-shadow:0 14px 24px -10px #3bb3ff">${x.ic.clock}</span><span class="lb">Planned</span><span class="nm" data-n="${by('Planned')}">0</span><span class="nt">Up next</span></article>
      <article class="card s4"><div class="ch"><div><h3>By category</h3><small>Projects per tag</small></div></div><div id="tg"></div></article>
      <article class="card s8"><div class="ch"><div><h3>Browse</h3><small>${W().length} projects</small></div><div class="fl" id="ptag">${tags.map(t => `<button class="f${t === pjTag ? ' on' : ''}" data-t="${x.esc(t)}" type="button">${x.esc(t)}</button>`).join('')}</div></div><p style="color:var(--soft);font-size:14px">Filter by category, then change a project’s status with the switch on its card. All listed projects are managed here and can be edited or removed.</p></article>
    </div>
    <div class="grid" id="pg"></div>`;
    x.bars(x.$('#tg', v), tagRows);
    const pg = x.$('#pg', v), list = W().filter(w => pjTag === 'All' || w.tag === pjTag);
    const add = `<button class="card pj s4 pj-add" id="padd2" type="button"><span class="plus">${x.ic.plus}</span><b>Add a project</b><small>Upload a screenshot, write a short description and it goes live on your site.</small></button>`;
    pg.innerHTML = add + list.map(w => `<article class="card pj s4" data-id="${x.esc(w.id)}"><div class="shot"><img src="${x.esc(P.imgAdmin(w))}" alt="" loading="lazy"><span class="chip">${x.esc(w.tag)}</span></div><div class="bd2"><h3>${x.esc(w.t)}</h3><p>${x.esc(w.d)}</p><div class="meta">${(w.stack || []).map(s => `<span class="chip w">${x.esc(s)}</span>`).join('')}<span class="chip n">${x.esc(w.year)}</span></div><div class="bar"><div class="seg">${PROJ.map(p => `<button class="${ps(w) === p ? 'on' : ''}" type="button">${p}</button>`).join('')}</div><span class="rowb"><button class="pb lt sm" data-edit type="button" aria-label="Edit ${x.esc(w.t)}"><span class="pi sv">${x.ic.edit}</span><span>Edit</span></button><button class="pb lt sm dng" data-del type="button" aria-label="Delete ${x.esc(w.t)}"><span class="pi sv">${x.ic.trash}</span></button><a class="pb lt sm" href="../project.html?id=${encodeURIComponent(w.id)}"><span class="pi sv">${x.ic.eye}</span><span>View</span></a></span></div></div></article>`).join('');
    x.stagger(v);
    const openAdd = () => projectForm(x, null);
    x.$('#padd', v).addEventListener('click', openAdd); x.$('#padd2', v).addEventListener('click', openAdd);
    x.$$('.pj[data-id]', pg).forEach(c => {
      const w = W().find(k => String(k.id) === c.dataset.id); if (!w) return;
      x.$$('.seg button', c).forEach(b => b.addEventListener('click', () => set(w, b.textContent)));
      const ed = c.querySelector('[data-edit]'), dl = c.querySelector('[data-del]');
      ed && ed.addEventListener('click', () => projectForm(x, w.id));
      dl && dl.addEventListener('click', async () => { if (!confirm(`Delete “${w.t}”? It will disappear from your site.`)) return; try { await P.remove(w.id); x.toast('Project deleted') } catch { x.toast('Could not delete. Check your connection.') } });
    });
    x.$$('#ptag .f', v).forEach(b => b.addEventListener('click', () => { pjTag = b.dataset.t; x.repaint() }));
  } };

  /* ============ Audience (sample data) ============ */
  let auRange = 30;
  pages.audience = { usesChats: false, render(v, x) {
    let sd = 11; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const days = 30, base = Array.from({ length: days }, (_, i) => Math.round(38 + 22 * Math.sin(i / 3.2) + i * .9 + rnd() * 14));
    const vis = base.slice(-auRange), sum = a => a.reduce((p, c) => p + c, 0), tot = sum(vis), pv = Math.round(tot * 2.7);
    const lbl = Array.from({ length: auRange }, (_, i) => new Date(Date.now() - (auRange - 1 - i) * 864e5).toLocaleDateString([], { day: 'numeric', month: 'short' }));
    const F = [['Visits', tot], ['Viewed work', Math.round(tot * .58)], ['Opened contact', Math.round(tot * .27)], ['Started a chat', Math.round(tot * .11)], ['Sent a message', Math.round(tot * .06)]];
    v.innerHTML = `
    <div class="ph"><div><h2>Audience</h2><p>Who visits the site, which pages work, and where they drop off.</p></div><div class="seg" id="ar"><button data-r="7" class="${auRange === 7 ? 'on' : ''}" type="button">7 days</button><button data-r="30" class="${auRange === 30 ? 'on' : ''}" type="button">30 days</button></div></div>
    <div class="note">${x.ic.warn}<span>These numbers are sample data. Nothing on the site records visits yet, so connect an analytics tool (or add page-view logging) to replace them with real traffic.</span></div>
    <div class="grid">
      <article class="card st s3">${x.sparkSvg(vis)}<span class="ti">${x.ic.users}</span><span class="lb">Visitors</span><span class="nm" data-n="${tot}">0</span><span class="nt"><span class="dl">+12%</span>vs previous period</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#6e93ff,#3bb3ff);box-shadow:0 14px 24px -10px #3bb3ff">${x.ic.eye}</span><span class="lb">Page views</span><span class="nm" data-n="${pv}">0</span><span class="nt">2.7 pages per visit</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#f0a020,#ffd37a);box-shadow:0 14px 24px -10px #f0a020">${x.ic.clock}</span><span class="lb">Time on site</span><span class="nm">2m 41s</span><span class="nt"><span class="dl">+8%</span>longer than before</span></article>
      <article class="card st s3"><span class="ti" style="background:linear-gradient(135deg,#26c281,#6edbb0);box-shadow:0 14px 24px -10px #26c281">${x.ic.chat}</span><span class="lb">Visits that start a chat</span><span class="nm" data-n="11" data-s="%">0%</span><span class="nt">Of everyone who visits</span></article>
      <article class="card s8"><div class="ch"><div><h3>Visitors per day</h3><small>Unique visitors</small></div></div><div id="vc"></div></article>
      <article class="card s4"><div class="ch"><div><h3>Where they come from</h3><small>Share of visits</small></div></div><div class="dn-wrap"><div id="src"></div><div class="lgv"><div style="--c:#7b7cff">Direct<b>38%</b></div><div style="--c:#26c281">WhatsApp<b>24%</b></div><div style="--c:#ffaecb">LinkedIn<b>19%</b></div><div style="--c:#a9c1ff">Search<b>14%</b></div><div style="--c:#ffd37a">Other<b>5%</b></div></div></div></article>
      <article class="card s4"><div class="ch"><div><h3>Top pages</h3><small>Views in this period</small></div></div><div id="tp"></div></article>
      <article class="card s4"><div class="ch"><div><h3>Devices</h3><small>Most visitors are on phones</small></div></div><div id="dv"></div></article>
      <article class="card s4"><div class="ch"><div><h3>Conversion funnel</h3><small>Visit to message</small></div></div><div class="fun">${F.map(([l, n], i) => `<div style="--w:${Math.max(62, Math.round(n / F[0][1] * 100))}%;filter:hue-rotate(${i * -6}deg)">${l}<small>${n.toLocaleString()}</small></div>`).join('')}</div></article>
    </div>`;
    x.area(x.$('#vc', v), { labels: lbl, series: [{ name: 'Visitors', color: '#7b7cff', values: vis }] });
    x.donut(x.$('#src', v), [{ value: 38, color: '#7b7cff' }, { value: 24, color: '#26c281' }, { value: 19, color: '#ffaecb' }, { value: 14, color: '#a9c1ff' }, { value: 5, color: '#ffd37a' }], tot.toLocaleString(), 'visitors');
    x.bars(x.$('#tp', v), [['Home', .34], ['Work', .24], ['Services', .17], ['Contact', .13], ['About', .08], ['CV', .04]].map(([l, k]) => ({ label: l, value: Math.round(pv * k) })), n => n.toLocaleString());
    x.bars(x.$('#dv', v), [{ label: 'Phone', value: 64 }, { label: 'Desktop', value: 29 }, { label: 'Tablet', value: 7 }], n => n + '%');
    x.$$('#ar button', v).forEach(b => b.addEventListener('click', () => { auRange = +b.dataset.r; x.repaint() }));
  } };

  /* ============ System ============ */
  const PAGES = ['index.html', 'about.html', 'work.html', 'services.html', 'contact.html', 'cv.html', 'project.html', 'inbox.html', '404.html'];
  const STEPS = [['Create a Firebase project', 'console.firebase.google.com, skip Analytics'], ['Create the Realtime Database', 'Pick the region closest to Ghana, start in locked mode'], ['Enable Email/Password sign-in', 'Then add your admin user'], ['Verify your admin email', 'Rules need a verified email to allow replies'], ['Publish firebase-rules.json', 'Realtime Database, Rules tab'], ['Paste the keys into js/chat-config.js', 'databaseURL and apiKey'], ['Upload the site and sign in at inbox.html', 'Keep that tab open to get alerts']];
  pages.system = { usesChats: true, render(v, x) {
    const live = x.C.live, ck = x.lsGet('nst_admin_setup', live ? STEPS.map(() => 1) : []), done = () => ck.filter(Boolean).length;
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    v.innerHTML = `
    <div class="ph"><div><h2>System</h2><p>Connection health, page checks and the setup steps behind your live chat.</p></div><div class="acts"><button class="pb lt" id="chk" type="button"><span class="pi sv">${x.ic.refresh}</span><span>Check all pages</span></button></div></div>
    <div class="grid">
      <article class="card s7"><div class="ch"><div><h3>Services</h3><small>${live ? 'Connected to Firebase' : 'No server connected yet'}</small></div></div><div class="stl" id="sv"></div></article>
      <article class="card s5"><div class="ch"><div><h3>Go live checklist</h3><small id="cl-s"></small></div></div><div class="pbar"><i id="cl-b"></i></div><div id="cl"></div></article>
      <article class="card s7"><div class="ch"><div><h3>Page health</h3><small>Fetches each page of the site and times it</small></div></div><div class="stl" id="pg">${PAGES.map(p => `<div class="sr"><span class="dot"></span><span class="tx"><b>${p}</b><small>${p === 'inbox.html' ? 'Private, not linked from the site' : 'Public page'}</small></span><span class="rt" data-p="${p}">Not checked</span><a class="pb lt sm" href="../${p}"><span class="pi sv">${x.ic.arrow}</span><span>Open</span></a></div>`).join('')}</div></article>
      <article class="card s5"><div class="ch"><div><h3>Settings</h3><small>Saved in this browser</small></div></div><div class="stl">
        <div class="sr"><span class="tx"><b>Show me as available</b><small>Away shows visitors your email box and WhatsApp</small></span><input class="sw" id="s-av" type="checkbox" role="switch" aria-label="Show me as available"></div>
        <div class="sr"><span class="tx"><b>Desktop alerts</b><small>${perm === 'denied' ? 'Blocked in your browser settings' : perm === 'granted' ? 'On for new messages' : perm === 'unsupported' ? 'Not supported here' : 'Get pinged while the inbox tab is open'}</small></span>${perm === 'default' ? `<button class="pb lt sm" id="s-nt" type="button"><span>Turn on</span></button>` : `<span class="chip ${perm === 'granted' ? 'g' : 'n'}">${perm === 'granted' ? 'On' : 'Off'}</span>`}</div>
        <div class="sr"><span class="tx"><b>Export conversations</b><small>Download every conversation index as JSON</small></span><button class="pb lt sm" id="s-ex" type="button"><span class="pi sv">${x.ic.down}</span><span>Export</span></button></div>
        ${live ? '' : `<div class="sr"><span class="tx"><b>Clear demo data</b><small>Removes test chats stored in this browser</small></span><button class="pb lt sm" id="s-cl" type="button"><span class="pi sv">${x.ic.trash}</span><span>Clear</span></button></div>`}
      </div></article>
    </div>`;
    const sv = x.$('#sv', v);
    pages.system.onOwner = pages.system.onOwner || (() => {});
    pages.system.draw = o => { const on = x.C.ownerOnline(o), n = x.D.chats.length; sv.innerHTML = [
      ['Chat transport', live ? 'Firebase Realtime Database over REST + EventSource' : 'Demo mode: messages stay in this browser', live ? 'Live' : 'Demo', live ? 'ok' : 'warn'],
      ['Admin sign-in', live ? 'Signed in with your verified email' : 'Skipped in demo mode', live ? 'Signed in' : 'Demo', live ? 'ok' : 'warn'],
      ['Presence heartbeat', 'Refreshed every 30 seconds while an admin tab is open', on ? 'Available' : 'Away', on ? 'ok' : ''],
      ['Conversation index', D_sample(x) ? 'No real conversations yet, showing samples' : 'Read from chatIndex', D_sample(x) ? 'Empty' : n + ' chats', D_sample(x) ? 'warn' : 'ok'],
      ['Spam protection', 'No rate limit yet. App Check is recommended if spam appears', 'Recommended', 'warn']
    ].map(([t, s, st, c]) => `<div class="sr"><span class="dot ${c}"></span><span class="tx"><b>${t}</b><small>${s}</small></span><span class="rt">${st}</span></div>`).join('') };
    pages.system.draw(x.D.owner);
    pages.system.onOwner = o => pages.system.draw(o);
    const cl = x.$('#cl', v), paintCl = () => { x.$('#cl-s', v).textContent = `${done()} of ${STEPS.length} done`; x.$('#cl-b', v).style.width = done() / STEPS.length * 100 + '%' };
    cl.innerHTML = STEPS.map(([t, s], i) => `<label class="ck"><input type="checkbox" ${ck[i] ? 'checked' : ''} data-i="${i}"><span><b>${t}</b><small>${s}</small></span></label>`).join('');
    x.$$('input', cl).forEach(c => c.addEventListener('change', () => { ck[+c.dataset.i] = c.checked ? 1 : 0; x.lsSet('nst_admin_setup', ck); paintCl() })); paintCl();
    const sw = x.$('#s-av', v); sw.checked = x.lsGet('nst_avail', true); sw.addEventListener('change', () => { x.$('#avSw').checked = sw.checked; x.$('#avSw').dispatchEvent(new Event('change')) });
    const nt = x.$('#s-nt', v); nt && nt.addEventListener('click', async () => { await Notification.requestPermission(); x.repaint() });
    x.$('#s-ex', v).addEventListener('click', () => { x.download('conversations.json', JSON.stringify(x.D.chats, null, 2), 'application/json'); x.toast('Exported conversations') });
    const cc = x.$('#s-cl', v); cc && cc.addEventListener('click', () => { if (confirm('Remove all demo conversations from this browser?')) { try { localStorage.removeItem('nst_demo_v1') } catch {} location.reload() } });
    x.$('#chk', v).addEventListener('click', async () => {
      if (location.protocol === 'file:') { x.toast('Open the site over http or https to check pages'); return }
      for (const p of PAGES) { const el = x.$(`[data-p="${p}"]`, v), dot = el.closest('.sr').querySelector('.dot'); el.textContent = 'Checking…'; const t0 = performance.now();
        try { const r = await fetch('../' + p, { cache: 'no-store' }); const ms = Math.round(performance.now() - t0); el.textContent = r.ok ? `OK · ${ms} ms` : 'Error ' + r.status; dot.className = 'dot ' + (r.ok ? (ms > 1500 ? 'warn' : 'ok') : 'bad') } catch { el.textContent = 'Unreachable'; dot.className = 'dot bad' } }
      x.toast('Page check finished');
    });
  }, onOwner() {} };
  const D_sample = x => x.D.sample;

  window.ADM_PAGES = pages;
  ADM.start(pages);
})();
