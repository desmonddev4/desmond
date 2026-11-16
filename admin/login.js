/* admin/login.js: the one place the admin signs in. Every admin page and the inbox send people here when there is no session. */
(() => {
  const C = window.NSTCore, A = C.admin, cfg = window.NST_CHAT || {}, owner = cfg.owner || {};
  const $ = s => document.querySelector(s);
  const card = $('#card'), sf = $('#sf'), rf = $('#rf'), err = $('#err'), go = $('#go'), pw = $('#pw'), eye = $('#eye');
  const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  eye.innerHTML = EYE;

  /* ---------- where to go afterwards (allow-list: never an open redirect) ---------- */
  const dest = (() => {
    const n = new URLSearchParams(location.search).get('next') || '';
    return /^(\.\.\/inbox\.html|(index|conversations|leads|projects|audience|system)\.html)(\?[\w=&%.\-]{0,120})?$/.test(n) ? n : 'index.html';
  })();
  const enter = () => location.replace(dest);

  /* ---------- state ---------- */
  const show = v => { card.dataset.view = v; sf.hidden = v !== 'signin'; rf.hidden = v !== 'reset'; (v === 'signin' ? sf : rf).email.focus({ preventScroll: true }) };
  const say = (el, msg) => { el.textContent = msg || ''; };
  const busy = (btn, on) => { btn.disabled = on; btn.classList.toggle('busy', on) };
  const fail = msg => { say(err, msg); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake') };

  if (owner.email) sf.email.value = owner.email, rf.email.value = owner.email;

  if (C.misconfigured) {
    $('#cfgErr').hidden = false;
    sf.querySelectorAll('input,button').forEach(el => { if (el.id !== 'toReset') el.disabled = true });
    $('#toReset').disabled = true;
    return;
  }
  if (!C.live) $('#demo').hidden = false;

  /* ---------- show / hide password, caps lock ---------- */
  eye.addEventListener('click', () => {
    const on = pw.type === 'password';
    pw.type = on ? 'text' : 'password';
    eye.innerHTML = on ? EYE_OFF : EYE;
    eye.setAttribute('aria-pressed', on); eye.setAttribute('aria-label', on ? 'Hide password' : 'Show password');
    pw.focus();
  });
  const caps = e => { if (e.getModifierState) $('#caps').hidden = !e.getModifierState('CapsLock') };
  pw.addEventListener('keydown', caps); pw.addEventListener('keyup', caps); pw.addEventListener('blur', () => { $('#caps').hidden = true });

  /* ---------- slow down guessing: 5 misses, then a growing wait (Firebase also rate-limits on its side) ---------- */
  const KEY = 'nst_lg';
  const lock = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || { n: 0, until: 0 } } catch { return { n: 0, until: 0 } } };
  const saveLock = o => { try { sessionStorage.setItem(KEY, JSON.stringify(o)) } catch {} };
  let tick = 0;
  const waiting = () => {
    clearInterval(tick);
    const l = lock(), left = Math.ceil((l.until - Date.now()) / 1000);
    if (left <= 0) { busy(go, false); go.querySelector('span').textContent = 'Sign in'; return false }
    go.disabled = true;
    const paint = () => { const s = Math.max(0, Math.ceil((lock().until - Date.now()) / 1000)); if (!s) { clearInterval(tick); go.disabled = false; go.querySelector('span').textContent = 'Sign in'; say(err, ''); return } go.querySelector('span').textContent = `Try again in ${s}s` };
    paint(); tick = setInterval(paint, 500); return true;
  };
  const miss = () => { const l = lock(); l.n++; if (l.n >= 5) l.until = Date.now() + Math.min(900, 30 * 2 ** (l.n - 5)) * 1000; saveLock(l); waiting() };

  const human = m => {
    m = String(m || '');
    if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_EMAIL|MISSING_PASSWORD/.test(m)) return 'Wrong email or password.';
    if (/NOT_OWNER/.test(m)) return 'That account does not have admin access.';
    if (/TOO_MANY_ATTEMPTS/.test(m)) return 'Too many attempts. Wait a few minutes or reset your password.';
    if (/USER_DISABLED/.test(m)) return 'This account has been disabled.';
    if (/API_KEY|API key/.test(m)) return 'The site\'s Firebase API key is not valid. Check js/chat-config.js.';
    if (/NOT_CONFIGURED/.test(m)) return 'The admin is not set up on this site yet.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Could not reach the server. Check your connection and try again.';
    return 'Could not sign in. Please try again.';
  };

  /* ---------- sign in ---------- */
  sf.addEventListener('submit', async e => {
    e.preventDefault(); say(err, '');
    if (waiting()) return;
    const email = sf.email.value.trim(), pass = pw.value;
    if (!email || !pass) return fail('Enter your email and password.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('That email does not look right.');
    busy(go, true);
    try {
      const r = await A.login(email, pass, $('#keep').checked);
      if (C.live && r && r.verified === false) { A.logout(); busy(go, false); return fail('Your email is not verified yet. Use "Forgot password?" to get a link; opening it verifies the address.') }
      saveLock({ n: 0, until: 0 });
      go.querySelector('span').textContent = 'Welcome back';
      enter();
    } catch (x) {
      busy(go, false); pw.value = ''; pw.focus();
      if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND|NOT_OWNER/.test(x.message)) miss();
      fail(human(x.message));
    }
  });

  /* ---------- reset ---------- */
  $('#toReset').addEventListener('click', () => { rf.email.value = sf.email.value; say($('#rerr'), ''); $('#rok').hidden = true; show('reset') });
  $('#toSign').addEventListener('click', () => show('signin'));
  rf.addEventListener('submit', async e => {
    e.preventDefault(); const em = rf.email.value.trim(), b = $('#rgo'); say($('#rerr'), ''); $('#rok').hidden = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return say($('#rerr'), 'That email does not look right.');
    busy(b, true);
    try { await A.reset(em); $('#rok').hidden = false }
    catch (x) { say($('#rerr'), /TOO_MANY/.test(x.message) ? 'Too many requests. Try again in a little while.' : /Failed to fetch|Network/i.test(x.message) ? 'Could not reach the server.' : 'Could not send the reset email. Try again.') }
    busy(b, false);
  });

  waiting();
  // Already signed in? Skip the form. (If the session is dead the form just stays.)
  A.ready().then(ok => { if (ok && C.live) enter() }).catch(() => {});
  sf.email.focus({ preventScroll: true });
})();
