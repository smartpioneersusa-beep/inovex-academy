/* INOVEX Academy — portal front end (static). All course content comes from the API after sign-in. */
(function () {
  'use strict';
  const API = window.ACADEMY_API;
  const LANGS = ['en', 'ar', 'ur', 'hi'];
  const $ = (s, r) => (r || document).querySelector(s);
  const app = $('#app');
  const store = {
    get(k) { try { return localStorage.getItem('ia_' + k); } catch (e) { return null; } },
    set(k, v) { try { v === null ? localStorage.removeItem('ia_' + k) : localStorage.setItem('ia_' + k, v); } catch (e) {} }
  };
  const S = {
    lang: LANGS.indexOf(window.IA_LANG) >= 0 ? window.IA_LANG : LANGS.indexOf(store.get('lang')) >= 0 ? store.get('lang') : guessLang(),
    token: store.get('token'), user: null, results: [], progress: [], catalog: null,
    pendingEmail: store.get('pending') || '', cache: {}, flash: null, protectedView: false
  };

  function guessLang() {
    const n = (navigator.language || 'en').slice(0, 2);
    return LANGS.indexOf(n) >= 0 ? n : 'en';
  }
  function t(k, v) {
    let s = (I18N[S.lang] && I18N[S.lang][k]) || I18N.en[k] || k;
    if (v) Object.keys(v).forEach(x => { s = s.split('{' + x + '}').join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function iso(d) { return d ? new Date(d) : null; }
  function fmtDate(d, lang) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString((lang || S.lang) === 'en' ? 'en-GB' : (lang || S.lang), { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { return new Date(d).toISOString().slice(0, 10); }
  }
  function daysLeft(exp) { return exp ? Math.ceil((new Date(exp) - Date.now()) / 864e5) : 0; }

  /* ---------------------------------------------------------------- api */
  async function api(action, data) {
    let res;
    try {
      const r = await fetch(API, { method: 'POST', body: JSON.stringify(Object.assign({ action: action, token: S.token, lang: S.lang }, data || {})) });
      res = await r.json();
    } catch (e) { throw new Error('network'); }
    if (!res.ok) {
      if (['auth', 'session_expired', 'access_expired'].indexOf(res.error) >= 0 && S.token) {
        signOut(false); S.flash = { err: t('e_' + res.error) }; go('/login');
      } else if (res.error === 'no_access' && S.token && action !== 'redeem') {
        if (S.user) S.user.access = false; S.catalog = null; go('/access');
      }
      throw new Error(res.error || 'server_error');
    }
    return res;
  }
  function errText(e) { const k = 'e_' + (e && e.message); return I18N.en[k] ? t(k) : t('error'); }

  /* ---------------------------------------------------------------- language + chrome */
  function applyLang() {
    const L = I18N[S.lang];
    document.documentElement.lang = S.lang;
    document.documentElement.dir = L._dir;
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.getAttribute('data-t')); });
    const sel = $('#lang');
    sel.innerHTML = LANGS.map(l => `<option value="${l}" ${l === S.lang ? 'selected' : ''}>${I18N[l]._name}</option>`).join('');
    document.title = t('academy');
    renderNav();
  }
  $('#lang').addEventListener('change', e => {
    S.lang = e.target.value; store.set('lang', S.lang);
    if (/^\/((ar|ur|hi)\/?)?$/.test(location.pathname)) { location.href = '/' + (S.lang === 'en' ? '' : S.lang + '/') + location.hash; return; }   // each language has its own page for search engines
    applyLang();
    if (S.token) api('setLang', { lang: S.lang }).catch(() => {});
    S.catalog = null; route();
  });
  function renderNav() {
    const nav = $('#nav');
    const req = `<a class="navbtn hide-sm" href="#/request">${t('requestTraining')}</a>`;
    if (!S.token) { nav.innerHTML = req + `<a class="navbtn" href="#/login">${t('signIn')}</a>`; return; }
    nav.innerHTML = req + (S.user && S.user.manager && !S.user.access && !S.user.admin ? '' : `<a class="navbtn" href="#/home">${t('myCourses')}</a>`) +
      (S.user && S.user.manager ? `<a class="navbtn" href="#/manager">${t('dashboard')}</a>` : '') +
      (S.user && S.user.admin ? `<a class="navbtn" href="#/admin">${t('admin')}</a>` : '') +
      `<button class="navbtn" id="so">${t('signOut')}</button>`;
    $('#so').onclick = () => { signOut(true); };
  }
  function signOut(nav) {
    S.token = null; S.user = null; S.catalog = null; S.cache = {}; store.set('token', null);
    renderNav(); if (nav) go('/');
  }
  function go(path) { if (location.hash !== '#' + path) location.hash = '#' + path; else route(); }
  function view(html) { app.innerHTML = html; window.scrollTo(0, 0); }
  function msgBox() {
    if (!S.flash) return '';
    const f = S.flash; S.flash = null;
    return f.err ? `<div class="msg err">${esc(f.err)}</div>` : `<div class="msg ok">${esc(f.ok)}</div>`;
  }
  function busy(btn, on) { if (btn) { btn.disabled = on; } }

  /* ---------------------------------------------------------------- protection */
  function setProtected(on) {
    S.protectedView = on;
    document.body.classList.remove('blurred');
  }
  document.addEventListener('contextmenu', e => { if (S.protectedView || e.target.closest('.protect')) e.preventDefault(); });
  ['copy', 'cut', 'dragstart', 'selectstart'].forEach(ev => document.addEventListener(ev, e => {
    if (e.target.closest && e.target.closest('.protect')) e.preventDefault();
    else if (S.protectedView && ev !== 'selectstart' && !(e.target.closest && e.target.closest('input'))) e.preventDefault();
  }));
  document.addEventListener('keydown', e => {
    if (!S.protectedView) return;
    const k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ['c', 'x', 's', 'p', 'u', 'a'].indexOf(k) >= 0) { e.preventDefault(); }
    if (k === 'printscreen') { document.body.classList.add('blurred'); setTimeout(() => document.body.classList.remove('blurred'), 1500); }
  });
  window.addEventListener('blur', () => { if (S.protectedView) document.body.classList.add('blurred'); });
  window.addEventListener('focus', () => document.body.classList.remove('blurred'));
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.protectedView) document.body.classList.add('blurred'); });
  window.addEventListener('beforeprint', () => { if (S.protectedView) alertless(t('printBlocked')); });
  function alertless(m) { const d = document.createElement('div'); d.className = 'msg err'; d.textContent = m; app.prepend(d); setTimeout(() => d.remove(), 4000); }

  function watermark(scale) {
    const who = (S.user && S.user.email) || '';
    const stamp = who + ' · ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
    const w = 420 * (scale || 1), h = 220 * (scale || 1);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><text x='${w / 2}' y='${h / 2}' text-anchor='middle' transform='rotate(-22 ${w / 2} ${h / 2})' font-family='Arial' font-size='${15 * (scale || 1)}' fill='rgba(28,28,28,0.11)'>${esc(stamp)}</text><text x='${w / 2}' y='${h / 2 + 22 * (scale || 1)}' text-anchor='middle' transform='rotate(-22 ${w / 2} ${h / 2})' font-family='Arial' font-size='${11 * (scale || 1)}' fill='rgba(201,166,70,0.22)'>INOVEX ACADEMY · RESTRICTED</text></svg>`;
    return `<div class="wm" style="background-image:url(&quot;data:image/svg+xml,${encodeURIComponent(svg)}&quot;)"></div>`;
  }

  /* ---------------------------------------------------------------- router */
  window.addEventListener('hashchange', route);
  async function route() {
    const path = (location.hash || '#/').slice(1) || '/';
    const p = path.split('/').filter(Boolean);
    setProtected(false);
    try {
      if (p[0] === 'cert') return viewCertCheck(p[1] || '');
      const H = { lang: () => S.lang, signedIn: () => !!S.token, view: view, api: api, t: t };
      if (!p.length) return IA_PUBLIC.landing(H);
      if (p[0] === 'request') return IA_PUBLIC.request(H);
      if (p[0] === 'admin-login') return viewAdminLogin();
      if (p[0] === 'manager-login') return viewAdminLogin(true);
      if (!S.token) {
        if (p[0] === 'signup') return viewSignup(p[1] ? decodeURIComponent(p[1]) : '');
        if (p[0] === 'verify') return viewVerify();
        if (p[0] === 'forgot') return viewForgot();
        if (p[0] === 'reset') return viewReset();
        if (p[0] === 'login') return viewLogin();
        return viewLanding();
      }
      if (!S.user) await loadMe();
      else if (!S.user.access && !S.user.admin) await loadMe();   // pick up access granted by an admin
      if (p[0] === 'manager' && (S.user.manager || S.user.admin)) return viewManager(p[1] ? decodeURIComponent(p[1]) : '');
      if (S.user.manager && !S.user.access && !S.user.admin) return viewManager('');
      if ((p[0] === 'access' && !S.user.access) || (!S.user.access && !S.user.admin)) return viewAccess();
      if (p[0] === 'access') return viewHome();
      if (p[0] === 'admin' && S.user.admin) return viewAdmin();
      if (p[0] === 'c' && p[1]) {
        if (p[2] === 'm') return viewModule(p[1], Number(p[3] || 1));
        if (p[2] === 'slides') return viewSlides(p[1], Number(p[3] || 1));
        if (p[2] === 'quiz') return viewQuiz(p[1]);
        return viewCourse(p[1]);
      }
      return viewHome();
    } catch (e) {
      if (e.message === 'network') view(`<div class="card auth"><div class="msg err">${t('e_network')}</div></div>`);
      else if (S.token) view(`<div class="card auth"><div class="msg err">${errText(e)}</div><a class="btn ghost" href="#/home">${t('back')}</a></div>`);
    }
  }
  async function loadMe() {
    const r = await api('me');
    S.user = r.user; S.results = r.results || []; S.progress = r.progress || [];
    renderNav();
  }
  async function loadCatalog() {
    if (!S.catalog) S.catalog = (await api('catalog')).courses;
    return S.catalog;
  }

  /* ---------------------------------------------------------------- public views */
  function viewLanding() {
    view(`<section class="hero">
      <div class="pitch"><div class="eyebrow">${t('academy')}</div><h1>${t('heroTitle')}</h1><p>${t('heroSub')}</p>
        <div class="badges"><span class="badge"><b>✓</b> ${t('authorised')}</span><span class="badge"><b>✓</b> ${t('association')}</span><span class="badge">EN · العربية · اردو · हिन्दी</span></div></div>
      <div class="card"><h2>${t('signIn')}</h2>${msgBox()}${loginForm()}
        <div class="links"><span>${t('noAccount')}</span><a href="#/signup">${t('createAccount')}</a><a href="#/forgot">${t('forgot')}</a></div></div>
    </section>`);
    bindLogin();
  }
  function loginForm() {
    return `<form id="lf" autocomplete="on"><label class="field"><span>${t('email')}</span><input name="email" type="email" required autocomplete="username" dir="ltr"></label>
      <label class="field"><span>${t('password')}</span><input name="password" type="password" required autocomplete="current-password" dir="ltr"></label>
      <button class="btn gold" style="width:100%">${t('signIn')}</button></form>`;
  }
  function bindLogin() {
    $('#lf').onsubmit = async e => {
      e.preventDefault();
      const f = e.target, b = f.querySelector('button'); busy(b, true);
      try {
        const r = await api('login', { email: f.email.value, password: f.password.value });
        startSession(r);
      } catch (err) {
        if (err.message === 'not_verified') { S.pendingEmail = f.email.value.trim().toLowerCase(); store.set('pending', S.pendingEmail); S.flash = { err: t('e_not_verified') }; return go('/verify'); }
        showErr(f, err); busy(b, false);
      }
    };
  }
  function startSession(r) {
    S.token = r.token; S.user = r.user; store.set('token', r.token); store.set('pending', null);
    if (r.user.lang && r.user.lang !== S.lang && !store.get('lang')) { S.lang = r.user.lang; }
    applyLang(); go(r.user.access || r.user.admin ? '/home' : r.user.manager ? '/manager' : '/access');
  }
  function showErr(form, err) {
    let m = form.parentNode.querySelector('.msg'); if (m) m.remove();
    m = document.createElement('div'); m.className = 'msg err'; m.textContent = errText(err);
    form.parentNode.insertBefore(m, form);
  }
  function viewLogin() {
    view(`<div class="card auth"><h2>${t('signIn')}</h2>${msgBox()}${loginForm()}
      <div class="links"><span>${t('noAccount')}</span><a href="#/signup">${t('createAccount')}</a><a href="#/forgot">${t('forgot')}</a><a href="#/admin-login">${t('adminSignIn')}</a></div>
      <div class="links" style="margin-top:6px"><a href="#/manager-login">${t('managerLink')}</a></div></div>`);
    bindLogin();
  }
  function viewSignup(invited) {
    invited = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invited || '') ? invited : '';
    view(`<div class="card auth"><h2>${invited ? t('activateT') : t('createAccount')}</h2><p class="hint">${invited ? t('activateD') : t('accessNote')}</p>${msgBox()}
      <form id="sf"><label class="field"><span>${t('fullName')}</span><input name="name" required maxlength="80" autocomplete="name"></label>
      <label class="field"><span>${t('email')}</span><input name="email" type="email" required dir="ltr" autocomplete="email" value="${esc(invited)}" ${invited ? 'readonly' : ''}></label>
      <label class="field"><span>${t('password')}</span><input name="password" type="password" required minlength="8" dir="ltr" autocomplete="new-password"><div class="hint">${t('pwRule')}</div></label>
      <label class="field"><span>${t('company')}</span><input name="company" maxlength="80" autocomplete="organization"></label>
      <label class="field"><span>${t('phone')}</span><input name="phone" type="tel" maxlength="30" dir="ltr" autocomplete="tel"></label>
      <label class="field ${invited ? 'hidden' : ''}"><span>${t('accessCode')}</span><input name="accessCode" class="mono" dir="ltr" maxlength="20" placeholder="INX-XXXX-XXXX" style="text-transform:uppercase"><div class="hint">${t('accessCodeHint')}</div></label>
      <button class="btn gold" style="width:100%">${t('createAccount')}</button></form>
      <div class="links"><span>${t('haveAccount')}</span><a href="#/login">${t('signIn')}</a></div></div>`);
    $('#sf').onsubmit = async e => {
      e.preventDefault();
      const f = e.target, b = f.querySelector('button'); busy(b, true);
      try {
        await api('signup', { name: f.name.value, email: f.email.value, password: f.password.value, company: f.company.value, phone: f.phone.value, accessCode: f.accessCode.value });
        S.pendingEmail = f.email.value.trim().toLowerCase(); store.set('pending', S.pendingEmail); go('/verify');
      } catch (err) { showErr(f, err); busy(b, false); }
    };
  }
  function viewVerify() {
    view(`<div class="card auth"><h2>${t('verifyTitle')}</h2><p>${t('verifySub', { email: '<b dir="ltr">' + esc(S.pendingEmail) + '</b>' })}</p>${msgBox()}
      <form id="vf"><label class="field"><span>${t('email')}</span><input name="email" type="email" required dir="ltr" value="${esc(S.pendingEmail)}"></label>
      <label class="field"><span>${t('code')}</span><input class="code" name="code" inputmode="numeric" maxlength="6" required autocomplete="one-time-code"></label>
      <button class="btn gold" style="width:100%">${t('verifyBtn')}</button></form>
      <div class="links"><a id="rs">${t('resend')}</a><a href="#/login">${t('signIn')}</a></div></div>`);
    $('#vf').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = f.querySelector('button'); busy(b, true);
      try { startSession(await api('verify', { email: f.email.value, code: f.code.value })); }
      catch (err) { showErr(f, err); busy(b, false); }
    };
    $('#rs').onclick = async () => {
      const f = $('#vf');
      try { await api('resend', { email: f.email.value }); S.flash = { ok: t('codeSent') }; S.pendingEmail = f.email.value; viewVerify(); }
      catch (err) { showErr(f, err); }
    };
  }
  function viewForgot() {
    view(`<div class="card auth"><h2>${t('forgotTitle')}</h2><p>${t('forgotSub')}</p>${msgBox()}
      <form id="ff"><label class="field"><span>${t('email')}</span><input name="email" type="email" required dir="ltr"></label>
      <button class="btn gold" style="width:100%">${t('sendCode')}</button></form>
      <div class="links"><a href="#/login">${t('signIn')}</a></div></div>`);
    $('#ff').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = f.querySelector('button'); busy(b, true);
      try { await api('forgot', { email: f.email.value }); S.pendingEmail = f.email.value.trim().toLowerCase(); store.set('pending', S.pendingEmail); go('/reset'); }
      catch (err) { showErr(f, err); busy(b, false); }
    };
  }
  function viewReset() {
    view(`<div class="card auth"><h2>${t('resetTitle')}</h2><p>${t('verifySub', { email: '<b dir="ltr">' + esc(S.pendingEmail) + '</b>' }).split('.')[0]}.</p>${msgBox()}
      <form id="rf"><label class="field"><span>${t('email')}</span><input name="email" type="email" required dir="ltr" value="${esc(S.pendingEmail)}"></label>
      <label class="field"><span>${t('code')}</span><input class="code" name="code" inputmode="numeric" maxlength="6" required></label>
      <label class="field"><span>${t('newPassword')}</span><input name="password" type="password" required minlength="8" dir="ltr" autocomplete="new-password"><div class="hint">${t('pwRule')}</div></label>
      <button class="btn gold" style="width:100%">${t('resetBtn')}</button></form></div>`);
    $('#rf').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = f.querySelector('button'); busy(b, true);
      try { await api('reset', { email: f.email.value, code: f.code.value, password: f.password.value }); S.flash = { ok: t('resetDone') }; go('/login'); }
      catch (err) { showErr(f, err); busy(b, false); }
    };
  }

  /* ---------------------------------------------------------------- home */
  function courseProgress(id, c) {
    const seen = S.progress.filter(x => x.indexOf(id + '|') === 0).map(x => x.split('|')[1]);
    const mods = c.modules.filter(m => seen.indexOf('module ' + m.n) >= 0).length;
    const pres = seen.indexOf('presentation') >= 0 ? 1 : 0;
    const passed = S.results.some(r => r.course === id && r.passed) ? 1 : 0;
    return { mods: mods, pres: pres, passed: passed, pct: Math.round((mods + pres + passed * 2) / (c.modules.length + 3) * 100), seen: seen };
  }
  async function viewHome() {
    view(`<p>${t('loading')}</p>`);
    const courses = await loadCatalog();
    const dl = daysLeft(S.user.expires);
    const pill = S.user.admin ? `<span class="pill gold">${t('admin')}</span>` :
      `<span class="pill ${dl <= 3 ? 'bad' : 'gold'}">${dl <= 1 ? t('lastDay') : t('daysLeft', { n: dl })}</span> <span class="pill">${t('expiresOn', { date: fmtDate(S.user.expires) })}</span>`;
    const cards = courses.map(c => {
      const pr = courseProgress(c.id, c);
      return `<article class="course"><div class="cov"><div class="code">${esc(c.id)}</div><h3>${esc(c.title)}</h3><p>${t('authorised')}</p></div>
        <div class="body"><div class="stats3"><span><b>${c.modules.length}</b>${t('modules')}</span><span><b>${c.slides}</b>${t('slides')}</span><span><b>${c.questions}</b>${t('questions')}</span></div>
        <div class="meter"><i style="width:${pr.pct}%"></i></div>
        <a class="btn dark" href="#/c/${encodeURIComponent(c.id)}">${t('open')}</a></div></article>`;
    }).join('');
    view(`${msgBox()}<div class="dash-head"><div><h1>${t('welcome', { name: esc(S.user.name) })}</h1></div><div>${pill}</div></div>
      <h2 class="section-t">${t('myCourses')}</h2><div class="grid">${cards}</div>
      <h2 class="section-t">${t('myResults')}</h2>${resultsTable(S.results, courses)}`);
    bindCertButtons(courses);
  }
  function resultsTable(rows, courses) {
    if (!rows.length) return `<p class="hint">${t('noResults')}</p>`;
    return `<div class="tablewrap"><table class="table"><tr><th>${t('certDate')}</th><th>${t('assessment')}</th><th>${t('yourScore')}</th><th>${t('status')}</th><th>${t('certificate')}</th></tr>` +
      rows.slice().reverse().map(r => `<tr><td>${fmtDate(r.time)}</td><td class="mono">${esc(r.course)}</td><td class="mono">${r.score} / ${r.total}</td>
      <td><span class="pill ${r.passed ? 'ok' : 'bad'}">${r.passed ? t('passed') : t('notPassed')}</span></td>
      <td>${r.certificateId ? `<button class="btn small gold" data-cert="${esc(r.certificateId)}">${t('downloadCert')}</button>` : ''}</td></tr>`).join('') + `</table></div>`;
  }
  function bindCertButtons(courses) {
    app.querySelectorAll('[data-cert]').forEach(b => b.onclick = async () => {
      const r = S.results.filter(x => x.certificateId === b.getAttribute('data-cert'))[0];
      const c = (courses || []).filter(x => x.id === r.course)[0] || { title: r.course };
      busy(b, true);
      try { await certificatePdf({ name: S.user.name, courseId: r.course, courseTitle: c.title, percent: r.percent, score: r.score, total: r.total, date: r.time, certificateId: r.certificateId }); }
      finally { busy(b, false); }
    });
  }

  /* ---------------------------------------------------------------- course page */
  async function viewCourse(id) {
    const courses = await loadCatalog();
    const c = courses.filter(x => x.id === id)[0];
    if (!c) throw new Error('not_found');
    const pr = courseProgress(id, c);
    const best = S.results.filter(r => r.course === id).sort((a, b) => b.score - a.score)[0];
    view(`<div class="crumbs"><a href="#/home">${t('myCourses')}</a> / ${esc(id)}</div>
      <h1 style="font-size:32px">${esc(c.title)}</h1><p class="hint">${esc(c.sub || '')} · ${t('authorised')} · ${t('association')}</p>
      <div class="course-top">
        <div class="tile"><div class="ic">▤</div><h3>${t('courseBook')}</h3><p>${c.modules.length} ${t('modules')}</p><a class="btn ghost" href="#/c/${id}/m/1">${t('read')}</a></div>
        <div class="tile"><div class="ic">▶</div><h3>${t('presentation')}</h3><p>${c.slides} ${t('slides')}${pr.pres ? ' · ✓' : ''}</p><a class="btn ghost" href="#/c/${id}/slides">${t('startPresentation')}</a></div>
        <div class="tile"><div class="ic">✓</div><h3>${t('assessment')}</h3><p>${c.questions} ${t('questions')} · ${t('passMark', { p: c.passMark, t: c.questions })}${best ? ` · ${t('best')}: <b class="mono">${best.score}/${best.total}</b>` : ''}</p><a class="btn gold" href="#/c/${id}/quiz">${t('startQuiz')}</a></div>
      </div>
      <h2 class="section-t">${t('courseBook')}</h2>
      <div class="modlist">${c.modules.map(m => `<a class="modrow" href="#/c/${id}/m/${m.n}"><span class="n">${String(m.n).padStart(2, '0')}</span><span class="t">${esc(m.title)}</span>${pr.seen.indexOf('module ' + m.n) >= 0 ? `<span class="done">✓ ${t('opened')}</span>` : ''}</a>`).join('')}</div>`);
  }

  /* ---------------------------------------------------------------- module reader */
  async function viewModule(id, n) {
    view(`<p>${t('loading')}</p>`);
    const courses = await loadCatalog();
    const c = courses.filter(x => x.id === id)[0];
    const key = ['m', id, S.lang, n].join('|');
    if (!S.cache[key]) S.cache[key] = (await api('module', { course: id, n: n })).module;
    const m = S.cache[key];
    const tag = 'module ' + n;
    if (S.progress.indexOf(id + '|' + tag) < 0) S.progress.push(id + '|' + tag);
    const total = c.modules.length;
    view(`<div class="crumbs"><a href="#/home">${t('myCourses')}</a> / <a href="#/c/${id}">${esc(id)}</a> / ${t('module')} ${n}</div>
      <div class="reader-bar"><span class="reader-note">🔒 ${t('protected', { email: esc(S.user.email) })}</span>
        <select class="langsel" id="mjump" style="background:#fff;color:var(--ink);border-color:var(--line)">${c.modules.map(x => `<option value="${x.n}" ${x.n === n ? 'selected' : ''}>${x.n}. ${esc(x.title)}</option>`).join('')}</select></div>
      <div class="protect reader" id="rd">${m.html}${watermark()}</div>
      <div class="pager">${n > 1 ? `<a class="btn ghost" href="#/c/${id}/m/${n - 1}">${S.lang === 'ar' || S.lang === 'ur' ? '→' : '←'} ${t('prev')}</a>` : '<span></span>'}
        ${n < total ? `<a class="btn dark" href="#/c/${id}/m/${n + 1}">${t('next')} ${S.lang === 'ar' || S.lang === 'ur' ? '←' : '→'}</a>` : `<a class="btn gold" href="#/c/${id}/quiz">${t('startQuiz')}</a>`}</div>`);
    $('#mjump').onchange = e => go(`/c/${id}/m/${e.target.value}`);
    setProtected(true);
  }

  /* ---------------------------------------------------------------- presentation player */
  async function viewSlides(id, start) {
    view(`<p>${t('loading')}</p>`);
    const key = ['s', id, S.lang].join('|');
    if (!S.cache[key]) S.cache[key] = (await api('slides', { course: id })).slides;
    const slides = S.cache[key];
    if (S.progress.indexOf(id + '|presentation') < 0) S.progress.push(id + '|presentation');
    let i = Math.min(Math.max(1, start || 1), slides.length) - 1;
    const rtl = I18N[S.lang]._dir === 'rtl';
    view(`<div class="crumbs"><a href="#/home">${t('myCourses')}</a> / <a href="#/c/${id}">${esc(id)}</a> / ${t('presentation')}</div>
      <div class="player protect" id="pl"><div class="stagewrap" id="sw"><div class="stage" id="st"></div>${watermark(1)}</div>
        <div class="progress"><i id="pg"></i></div>
        <div class="controls"><button class="btn small ghost" style="color:#fff;border-color:#555" id="pv">${rtl ? '→' : '←'} ${t('prev')}</button>
          <span class="count" id="ct"></span><button class="btn small gold" id="nx">${t('next')} ${rtl ? '←' : '→'}</button><span class="sp"></span>
          <button class="btn small ghost" style="color:#fff;border-color:#555" id="nt">${t('notes')}</button>
          <button class="btn small ghost" style="color:#fff;border-color:#555" id="fs">⛶ ${t('fullscreen')}</button></div>
        <div class="notesbox hidden" id="nb"></div></div>`);
    const st = $('#st'), sw = $('#sw');
    function fit() { const s = sw.clientWidth / 1280; st.style.transform = `scale(${s})`; }
    function show() {
      st.innerHTML = slideHtml(slides[i], i, slides.length, id);
      $('#ct').textContent = (i + 1) + ' / ' + slides.length;
      $('#pg').style.width = ((i + 1) / slides.length * 100) + '%';
      $('#nb').textContent = slides[i].notes || '';
      $('#pv').disabled = i === 0; $('#nx').disabled = i === slides.length - 1;
      history.replaceState(null, '', `#/c/${id}/slides/${i + 1}`);
    }
    const step = d => { const j = i + d; if (j >= 0 && j < slides.length) { i = j; show(); } };
    $('#pv').onclick = () => step(-1); $('#nx').onclick = () => step(1);
    $('#nt').onclick = () => $('#nb').classList.toggle('hidden');
    $('#fs').onclick = () => { const p = $('#pl'); document.fullscreenElement ? document.exitFullscreen() : (p.requestFullscreen && p.requestFullscreen()); };
    const onKey = e => {
      if (!$('#pl')) return document.removeEventListener('keydown', onKey);
      const fwd = rtl ? 'ArrowLeft' : 'ArrowRight', bwd = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === fwd || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); step(1); }
      else if (e.key === bwd || e.key === 'PageUp') { e.preventDefault(); step(-1); }
      else if (e.key === 'Home') { i = 0; show(); } else if (e.key === 'End') { i = slides.length - 1; show(); }
      else if (e.key === 'n' || e.key === 'N') $('#nb').classList.toggle('hidden');
    };
    document.addEventListener('keydown', onKey);
    let x0 = null;
    sw.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    sw.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) step((dx < 0) !== rtl ? 1 : -1); x0 = null; });
    new ResizeObserver(fit).observe(sw); fit(); show();
    setProtected(true);
  }
  function slideHtml(s, i, n, id) {
    const foot = `<div class="foot"><span>INOVEX Academy · ${esc(id)}</span><span class="mono">${i + 1} / ${n}</span></div>`;
    const ey = s.eyebrow ? `<div class="ey">${esc(s.eyebrow)}</div>` : '';
    const ul = s.bullets && s.bullets.length ? `<ul>${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
    if (s.kind === 'cover') return `<div class="slide cover">${ey}<h2>${esc(s.title)}</h2>${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ''}<div class="partners">${t('partnerLine')}</div><div class="bar"></div></div>`;
    if (s.kind === 'statement') return `<div class="slide statement">${ey}<h2>${esc(s.title)}</h2>${foot}</div>`;
    let mid = '';
    if (s.stats) mid = `<div class="statsrow">${s.stats.map(x => `<div class="stat"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('')}</div>`;
    if (s.steps) mid = `<div class="flow">${s.steps.map((x, k) => `<div><small>${String(k + 1).padStart(2, '0')}</small>${esc(x)}</div>`).join('')}</div>`;
    if (s.svg) return `<div class="slide ${s.kind === 'dark' ? 'dark' : ''}">${ey}<h2>${esc(s.title)}</h2><div class="cols"><div>${mid}${ul}</div><div>${s.svg}</div></div>${foot}</div>`;
    return `<div class="slide ${s.kind === 'dark' ? 'dark' : ''}">${ey}<h2>${esc(s.title)}</h2>${mid}${ul}${foot}</div>`;
  }

  /* ---------------------------------------------------------------- quiz */
  async function viewQuiz(id) {
    view(`<p>${t('loading')}</p>`);
    const courses = await loadCatalog();
    const c = courses.filter(x => x.id === id)[0];
    const data = await api('quiz', { course: id });
    const qs = data.questions;
    const akey = 'ans_' + id + '_' + S.user.email;
    let ans; try { ans = JSON.parse(sessionStorage.getItem(akey) || 'null'); } catch (e) { ans = null; }
    if (!ans || ans.length !== qs.length) ans = qs.map(() => null);
    let i = 0;
    const save = () => { try { sessionStorage.setItem(akey, JSON.stringify(ans)); } catch (e) {} };
    function draw() {
      const q = qs[i];
      const rtl = I18N[S.lang]._dir === 'rtl';
      view(`<div class="quiz"><div class="crumbs"><a href="#/home">${t('myCourses')}</a> / <a href="#/c/${id}">${esc(id)}</a> / ${t('assessment')}</div>
        <h1 style="font-size:26px">${esc(c.title)}</h1><p class="hint">${t('passMark', { p: c.passMark, t: c.questions })}</p>
        <div class="qcard protect"><div class="qhead"><span>${t('question', { i: i + 1, n: qs.length })}</span><span class="pill">${t('module')} ${q.m}</span></div>
        <div class="qtext">${esc(q.q)}</div>
        ${q.o.map((o, k) => `<button class="opt ${ans[i] === k ? 'sel' : ''}" data-k="${k}"><span class="l">${'ABCD'[k]}</span><span>${esc(o)}</span></button>`).join('')}
        <div class="qnav"><button class="btn ghost" id="qp" ${i === 0 ? 'disabled' : ''}>${rtl ? '→' : '←'} ${t('prev')}</button>
        ${i < qs.length - 1 ? `<button class="btn dark" id="qn">${t('next')} ${rtl ? '←' : '→'}</button>` : `<button class="btn gold" id="qs">${t('finish')}</button>`}</div>
        ${watermark()}</div>
        <div class="dots">${qs.map((_, k) => `<button class="${ans[k] !== null ? 'a' : ''} ${k === i ? 'c' : ''}" data-j="${k}">${k + 1}</button>`).join('')}</div>
        <button class="btn gold" id="qs2">${t('finish')}</button></div>`);
      app.querySelectorAll('.opt').forEach(b => b.onclick = () => { ans[i] = Number(b.getAttribute('data-k')); save(); if (i < qs.length - 1) { i++; } draw(); });
      app.querySelectorAll('.dots button').forEach(b => b.onclick = () => { i = Number(b.getAttribute('data-j')); draw(); });
      $('#qp').onclick = () => { if (i > 0) { i--; draw(); } };
      if ($('#qn')) $('#qn').onclick = () => { i++; draw(); };
      [$('#qs'), $('#qs2')].forEach(b => b && (b.onclick = submit));
      setProtected(true);
    }
    async function submit() {
      const missing = ans.filter(a => a === null).length;
      if (missing && !confirmInline(t('unanswered', { n: missing }))) return;
      view(`<div class="quiz"><div class="qcard"><p>${t('submitting')}</p></div></div>`);
      try {
        const r = await api('submit', { course: id, answers: ans });
        try { sessionStorage.removeItem(akey); } catch (e) {}
        S.results.push({ time: r.date, course: id, lang: S.lang, score: r.score, total: r.total, percent: Math.round(r.score / r.total * 100), passed: r.passed, certificateId: r.certificateId });
        quizResult(id, c, qs, ans, r, data.moduleNames);
      } catch (err) { view(`<div class="quiz"><div class="msg err">${errText(err)}</div><button class="btn dark" id="again">${t('back')}</button></div>`); $('#again').onclick = draw; }
    }
    draw();
  }
  let confirmArmed = 0;
  function confirmInline(text) {
    if (Date.now() - confirmArmed < 8000) { confirmArmed = 0; return true; }
    confirmArmed = Date.now();
    const box = document.createElement('div'); box.className = 'msg err'; box.textContent = text + ' ↻';
    const q = $('.quiz'); q.insertBefore(box, q.children[1]);
    window.scrollTo(0, 0);
    return false;
  }
  function quizResult(id, c, qs, ans, r, names) {
    const pct = Math.round(r.score / r.total * 100);
    const mods = Object.keys(r.byModule).sort((a, b) => a - b).map(m => {
      const v = r.byModule[m], p = Math.round(v[0] / v[1] * 100);
      return `<div class="mbar ${p < 70 ? 'low' : ''}"><span>${m}. ${esc(names[m] || '')}</span><div class="meter"><i style="width:${p}%"></i></div><span class="mono">${v[0]}/${v[1]}</span></div>`;
    }).join('');
    const rv = r.review.map((x, k) => {
      const q = qs[k];
      return `<div class="rv ${x.ok ? 'ok' : 'no'}"><b>${k + 1}. ${esc(q.q)}</b>
        <div>${t('yourAnswer')}: ${x.given >= 0 ? `<b>${'ABCD'[x.given]}</b> ${esc(q.o[x.given])}` : t('noAnswer')} ${x.ok ? '✓' : '✗'}</div>
        ${x.ok ? '' : `<div>${t('correctAnswer')}: <b>${'ABCD'[x.correct]}</b> ${esc(q.o[x.correct])}</div>`}<div class="x">${esc(x.x)}</div></div>`;
    }).join('');
    view(`<div class="quiz"><div class="crumbs"><a href="#/home">${t('myCourses')}</a> / <a href="#/c/${id}">${esc(id)}</a> / ${t('assessment')}</div>
      <div class="qcard"><div class="score"><div class="ring" style="--p:${pct}"><div><span><b>${r.score}/${r.total}</b><span class="hint">${pct}%</span></span></div></div>
      <div><span class="pill ${r.passed ? 'ok' : 'bad'}">${r.passed ? t('passed') : t('notPassed')}</span><h2 style="margin-top:10px">${r.passed ? t('passedMsg') : t('failedMsg')}</h2>
      <p class="hint">${t('passMark', { p: r.passMark, t: r.total })}${r.certificateId ? ` · ${t('certId')}: <span class="mono">${esc(r.certificateId)}</span>` : ''}</p></div></div>
      <div class="actions">${r.passed ? `<button class="btn gold" id="dc">${t('downloadCert')}</button>` : ''}<button class="btn dark" id="dr">${t('downloadResults')}</button>
        <a class="btn ghost" href="#/c/${id}/quiz">${t('retake')}</a><a class="btn ghost" href="#/c/${id}">${t('back')}</a></div>
      <h3>${t('byModule')}</h3>${mods}</div>
      <h2 class="section-t">${t('review')}</h2>${rv}</div>`);
    const payload = { name: S.user.name, email: S.user.email, courseId: id, courseTitle: c.title, score: r.score, total: r.total, percent: pct, passed: r.passed, date: r.date, certificateId: r.certificateId, mods: mods, review: rv };
    if ($('#dc')) $('#dc').onclick = async e => { busy(e.target, true); await certificatePdf(payload); busy(e.target, false); };
    $('#dr').onclick = async e => { busy(e.target, true); await resultsPdf(payload); busy(e.target, false); };
  }

  /* ---------------------------------------------------------------- PDFs (rendered in the browser, so every script shapes correctly) */
  async function snap(node) {
    await document.fonts.ready;
    return html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
  }
  async function certificatePdf(d, mode) {
    const list = Array.isArray(d) ? d : [d];
    const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    for (let i = 0; i < list.length; i++) {
      const canvas = await certCanvas(list[i]);
      if (i) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 297, 210);
    }
    if (mode === 'print') return printPdf(pdf);
    pdf.save(list.length > 1 ? `INOVEX_Academy_Certificates_${new Date().toISOString().slice(0, 10)}.pdf` : `INOVEX_Academy_Certificate_${list[0].certificateId}.pdf`);
  }
  function printPdf(pdf) {
    pdf.autoPrint();
    const url = pdf.output('bloburl');
    let fr = $('#printframe'); if (fr) fr.remove();
    fr = document.createElement('iframe'); fr.id = 'printframe';
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
    fr.onload = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { window.open(url, '_blank'); } };
    fr.src = url; document.body.appendChild(fr);
  }
  async function certCanvas(d) {
    const off = $('#offscreen');
    const local = S.lang !== 'en' && !d.manual;
    const type = d.type || 'Completion';
    const head = { Completion: 'CERTIFICATE OF COMPLETION', Attendance: 'CERTIFICATE OF ATTENDANCE', Qualification: 'CERTIFICATE OF QUALIFICATION' }[type] || 'CERTIFICATE OF COMPLETION';
    const verb = { Completion: 'has successfully completed the course', Attendance: 'has attended the training program', Qualification: 'has been qualified in' }[type] || 'has successfully completed the course';
    const enTitle = d.courseTitleEn || (d.courseId === 'PC-101' ? 'Powder Coating Fundamentals' : d.courseTitle);
    const courseLine = d.courseId && d.courseId !== enTitle ? `${esc(d.courseId)} — ${esc(enTitle)}` : esc(enTitle);
    const scoreCell = d.score !== undefined && d.score !== '' && d.score !== null
      ? `<div>Assessment score<b>${d.total ? `${d.score} / ${d.total} (${d.percent}%)` : esc(d.score)}</b></div>` : (d.company ? `<div>Company<b style="font-family:Inter,sans-serif">${esc(d.company)}</b></div>` : '<div></div>');
    off.innerHTML = `<div class="certpage" id="cp"><div class="cert"><div class="in">
      <div class="clogos"><img src="/img/inovex.png" alt=""><span>ACADEMY</span></div>
      <h1>${head}</h1>${local ? `<div class="tl">${esc(t('certTitle'))}</div>` : '<div class="tl">&nbsp;</div>'}
      <div style="font-size:18px;color:#444">This certifies that</div>${local ? `<div dir="${I18N[S.lang]._dir}" style="font-size:16px;color:#777">${esc(t('certBody'))}</div>` : ''}
      <div class="nm">${esc(d.name)}</div>
      <div style="font-size:18px;color:#444">${verb}</div>${local ? `<div dir="${I18N[S.lang]._dir}" style="font-size:16px;color:#777">${esc(t('certCompleted'))}</div>` : ''}
      <div class="cr">${courseLine}</div>${local ? `<div class="crl" dir="${I18N[S.lang]._dir}">${esc(d.courseTitle)}</div>` : ''}
      <div class="partners"><span>Authorised by</span><img src="/img/wagner.jpg" alt="WAGNER" class="w"><span>In association with</span><img src="/img/alqemma.png" alt="Al Qemma" class="q"><b>Al Qemma Training Institute</b></div>
      <div class="row">${scoreCell}<div>Date<b>${fmtDate(d.date, 'en')}</b></div>
        <div>Certificate ID<b>${esc(d.certificateId)}</b></div><div class="sig">Academy Director<br><span style="font-size:12px;color:#666">INOVEX Group LLC · Riyadh</span></div></div>
      <div style="position:absolute;left:0;right:0;bottom:16px;font-size:11px;color:#888">Verify: academy.inovex-group.com/#/cert/${esc(d.certificateId)}</div>
    </div></div></div>`;
    const dir = document.documentElement.dir;
    document.documentElement.dir = 'ltr';
    try {
      await Promise.all([...off.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      return await snap($('#cp'));
    } finally { document.documentElement.dir = dir; off.innerHTML = ''; }
  }
  async function resultsPdf(d) {
    const off = $('#offscreen');
    off.innerHTML = `<div class="resultpage reader" id="rp" dir="${I18N[S.lang]._dir}" style="border:0;box-shadow:none">
      <div style="display:flex;justify-content:space-between;border-bottom:3px solid #1C1C1C;padding-bottom:10px;margin-bottom:14px">
        <div><div style="font-family:Oswald;letter-spacing:.2em;font-weight:600">INOVEX ACADEMY</div><div class="small">${t('partnerLine')}</div></div>
        <div class="mono" style="text-align:end">${esc(d.courseId)}<br><span class="small">${fmtDate(d.date)}</span></div></div>
      <h1 style="font-size:24px">${esc(d.courseTitle)}</h1>
      <table><tr><th>${t('fullName')}</th><td>${esc(d.name)}</td><th>${t('email')}</th><td class="mono">${esc(d.email)}</td></tr>
      <tr><th>${t('yourScore')}</th><td class="mono">${d.score} / ${d.total} (${d.percent}%)</td><th>${t('status')}</th><td>${d.passed ? t('passed') : t('notPassed')}${d.certificateId ? ' · <span class="mono">' + esc(d.certificateId) + '</span>' : ''}</td></tr></table>
      <h2>${t('byModule')}</h2>${d.mods}<h2>${t('review')}</h2>${d.review}</div>`;
    try {
      const canvas = await snap($('#rp'));
      const pdf = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      const pw = 210, ph = 297, pxPerMm = canvas.width / pw, pageH = Math.floor(ph * pxPerMm);
      for (let y = 0, page = 0; y < canvas.height; y += pageH, page++) {
        const h = Math.min(pageH, canvas.height - y);
        const c2 = document.createElement('canvas'); c2.width = canvas.width; c2.height = h;
        c2.getContext('2d').drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (page) pdf.addPage();
        pdf.addImage(c2.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pw, h / pxPerMm);
      }
      pdf.save(`INOVEX_Academy_Result_${d.courseId}_${(d.date || '').slice(0, 10)}.pdf`);
    } finally { off.innerHTML = ''; }
  }

  /* ---------------------------------------------------------------- certificate check (public) */
  function viewAccess() {
    const had = S.user.expires && S.user.status === 'active';
    view(`<div class="card auth" style="max-width:560px"><div class="pill ${had ? 'bad' : 'gold'}">${had ? t('expired') : t('awaiting')}</div>
      <h2 style="margin-top:10px">${t('accessT')}</h2><p>${t('accessD')}</p>${msgBox()}
      <form id="xf"><label class="field"><span>${t('accessCode')}</span><input name="code" class="mono code" style="font-size:22px;letter-spacing:.15em" dir="ltr" maxlength="20" placeholder="INX-XXXX-XXXX" required></label>
      <button class="btn gold" style="width:100%">${t('redeem')}</button></form>
      <div class="links"><a href="#/request">${t('requestTraining')}</a><a href="https://wa.me/966509620944" target="_blank" rel="noopener">WhatsApp +966 50 962 0944</a><a href="mailto:j.alnajar@inovex-group.com">j.alnajar@inovex-group.com</a></div></div>`);
    $('#xf').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = f.querySelector('button'); busy(b, true);
      try { const r = await api('redeem', { code: f.code.value }); S.user = Object.assign(S.user, r.user); S.catalog = null; S.flash = { ok: t('accessOk') }; go('/home'); }
      catch (err) { showErr(f, err); busy(b, false); }
    };
  }
  function viewAdminLogin(mgr) {
    view(`<div class="card auth"><div class="pill gold">${mgr ? t('manager') : t('admin')}</div><h2 style="margin-top:10px">${mgr ? t('managerSignIn') : t('adminSignIn')}</h2><p class="hint">${mgr ? t('managerSub') : t('adminSub')}</p>${msgBox()}
      <form id="af1"><label class="field"><span>${t('email')}</span><input name="email" type="email" required dir="ltr" value="${mgr ? '' : 'info@inovex-group.com'}" autocomplete="username"></label>
      <button class="btn dark" style="width:100%">${t('sendCode')}</button></form>
      <form id="af2" class="hidden" style="margin-top:16px"><label class="field"><span>${t('code')}</span><input class="code" name="code" inputmode="numeric" maxlength="6" required autocomplete="one-time-code"></label>
      <button class="btn gold" style="width:100%">${t('signIn')}</button></form>
      <div class="links"><a href="#/login">${t('back')}</a></div></div>`);
    let email = '';
    $('#af1').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = f.querySelector('button'); busy(b, true);
      try { email = f.email.value.trim().toLowerCase(); await api(mgr ? 'managerCode' : 'adminCode', { email: email }); $('#af2').classList.remove('hidden'); b.textContent = t('resend'); f.insertAdjacentHTML('afterend', `<div class="msg ok" style="margin-top:12px">${t('codeSent')}</div>`); $('#af2').code.focus(); }
      catch (err) { showErr(f, err); } finally { busy(b, false); }
    };
    $('#af2').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = f.querySelector('button'); busy(b, true);
      try { const r = await api(mgr ? 'managerLogin' : 'adminLogin', { email: email, code: f.code.value }); S.token = r.token; S.user = r.user; store.set('token', r.token); applyLang(); go(mgr ? '/manager' : '/admin'); }
      catch (err) { showErr(f, err); busy(b, false); }
    };
  }
  function viewCertCheck(id) {
    view(`<div class="card auth"><h2>${t('verifyCert')}</h2><form id="cf"><label class="field"><span>${t('certId')}</span><input name="id" class="mono" value="${esc(decodeURIComponent(id))}" required></label>
      <button class="btn gold" style="width:100%">${t('check')}</button></form><div id="cr" style="margin-top:14px"></div></div>`);
    const run = async () => {
      const out = $('#cr'); out.innerHTML = t('loading');
      try {
        const r = await api('verifyCert', { id: $('#cf').id.value });
        out.innerHTML = r.revoked ? `<div class="msg err"><b>✗ ${t('certRevoked')}</b></div>` :
          `<div class="msg ok"><b>✓ ${t('certValid')}</b><br>${esc(r.name)}${r.company ? ' · ' + esc(r.company) : ''} · <span class="mono">${esc(r.course)}</span> · ${fmtDate(r.date)}${r.percent !== '' && r.percent != null ? ` · <span class="mono">${esc(r.percent)}${String(r.percent).indexOf('%') < 0 && !isNaN(r.percent) ? '%' : ''}</span>` : ''}<br><span class="hint">${t('certificate')}: ${esc(r.type || 'Completion')}</span></div>`;
      } catch (e) { out.innerHTML = `<div class="msg err">${e.message === 'not_found' ? t('certInvalid') : errText(e)}</div>`; }
    };
    $('#cf').onsubmit = e => { e.preventDefault(); run(); };
    if (id) run();
  }

  /* ---------------------------------------------------------------- dialogs (edit forms + confirmations) */
  function dialog(title, fields, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const back = document.createElement('div'); back.className = 'modal-back';
      const fld = f => {
        const v = f.value == null ? '' : f.value;
        if (f.type === 'select') return `<label class="field"><span>${esc(f.label)}</span><select name="${f.name}" class="sel">${f.options.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
        if (f.type === 'checkbox') return `<label class="check"><input type="checkbox" name="${f.name}" ${v ? 'checked' : ''}> <span>${esc(f.label)}</span></label>`;
        if (f.type === 'textarea') return `<label class="field wide"><span>${esc(f.label)}</span><textarea name="${f.name}" rows="3" maxlength="${f.max || 500}">${esc(v)}</textarea></label>`;
        return `<label class="field"><span>${esc(f.label)}</span><input name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}" ${f.required ? 'required' : ''} ${f.min != null ? `min="${f.min}"` : ''} ${f.max ? `max="${f.max}"` : ''} ${f.ltr ? 'dir="ltr"' : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}>${f.hint ? `<small class="hint">${esc(f.hint)}</small>` : ''}</label>`;
      };
      back.innerHTML = `<form class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3>${opts.text ? `<p class="hint">${esc(opts.text)}</p>` : ''}
        <div class="modal-grid">${fields.map(fld).join('')}</div><div class="msg err hidden" id="dlgerr"></div>
        <div class="modal-actions"><button type="button" class="btn ghost" data-x>${t('cancel')}</button><button class="btn ${opts.danger ? 'danger' : 'gold'}">${esc(opts.ok || t('save'))}</button></div></form>`;
      document.body.appendChild(back);
      const form = back.querySelector('form');
      const close = v => { back.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
      const onKey = e => { if (e.key === 'Escape') close(null); };
      document.addEventListener('keydown', onKey);
      back.querySelector('[data-x]').onclick = () => close(null);
      back.addEventListener('mousedown', e => { if (e.target === back) close(null); });
      form.onsubmit = async e => {
        e.preventDefault();
        const out = {};
        fields.forEach(f => { const el = form.elements[f.name]; out[f.name] = f.type === 'checkbox' ? el.checked : el.value; });
        if (!opts.submit) return close(out);
        const b = form.querySelector('button:not([data-x])'); busy(b, true);
        try { close(await opts.submit(out) || out); }
        catch (err) { const m = $('#dlgerr', back); m.textContent = errText(err); m.classList.remove('hidden'); busy(b, false); }
      };
      const first = form.querySelector('input:not([type=checkbox]),select,textarea'); if (first) first.focus();
    });
  }
  const confirmDel = (text, extra) => dialog(t('del'), extra || [], { text: text || t('confirmDel'), ok: t('del'), danger: true });
  const coName = () => t('company').replace(/\s*\(.*\)/, '');
  const courseOpts = () => [['*', t('allCourses')], ['PC-101', 'PC-101']];
  const dateIn = d => d ? new Date(d).toISOString().slice(0, 10) : '';
  function certData(x) {
    if (x.source === 'online') { const sc = String(x.score).indexOf('/') > 0 ? String(x.score).split('/') : [x.score, x.total]; return { manual: true, name: x.name, courseId: x.course, courseTitle: x.course, type: x.type || 'Completion', date: x.date, score: sc[0], total: sc[1], percent: x.percent, certificateId: x.certificateId }; }
    return { manual: true, name: x.name, courseTitle: x.course, courseTitleEn: x.course, type: x.type, date: x.date, score: x.score, company: x.company, certificateId: x.certificateId };
  }

  /* ---------------------------------------------------------------- admin */
  async function viewAdmin(tab) {
    tab = tab || 'trainees';
    view(`<p>${t('loading')}</p>`);
    const need = (n, call, empty) => tab === n ? call() : Promise.resolve(empty);
    const [u, r, a, cz, kz, co, ad] = await Promise.all([api('adminUsers'), api('adminResults'), api('adminApplications').catch(() => ({ applications: [] })),
      need('certs', () => api('adminCerts'), { certificates: [] }), need('codes', () => api('adminCodes'), { codes: [] }),
      need('companies', () => api('adminCompanies'), { companies: [] }), need('admins', () => api('adminAdmins'), { admins: [] })]);
    const users = u.users, results = r.results, apps = a.applications || [], certs = cz.certificates || [], codes = kz.codes || [], comps = co.companies || [], admins = ad.admins || [];
    const now = Date.now();
    const state = x => x.status === 'disabled' ? 'disabled' : !x.verified ? 'pending' : x.status === 'awaiting' ? 'awaiting' : (x.expires && new Date(x.expires) < now ? 'expired' : 'active');
    const passedSet = new Set(results.filter(x => x.passed).map(x => x.email));
    const newReq = apps.filter(x => x.status === 'new').length;
    const kpi = `<div class="kpis"><div class="kpi"><b>${users.length}</b><span>${t('trainees')}</span></div>
      <div class="kpi"><b>${users.filter(x => state(x) === 'active').length}</b><span>${t('active')}</span></div>
      <div class="kpi"><b>${passedSet.size}</b><span>${t('passed')}</span></div>
      <div class="kpi"><b>${results.length}</b><span>${t('attempts')}</span></div></div>`;
    const TABS = [['trainees', t('trainees')], ['results', t('results')], ['requests', t('requests') + (newReq ? ` (${newReq})` : '')], ['companies', t('companiesTab')], ['certs', t('certificates')], ['codes', t('codesTab')], ['admins', t('admins')]];
    view(`${msgBox()}<h1>${t('admin')}</h1>${kpi}<div class="tabs">${TABS.map(x => `<button data-tab="${x[0]}" class="${tab === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>
      <div class="toolbar"><input id="q" placeholder="${t('search')}"><button class="btn small dark" id="csv">${t('exportCsv')}</button></div><div class="tablewrap" id="tb"></div>`);
    app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => viewAdmin(b.getAttribute('data-tab')));
    const reload = msg => { if (msg) S.flash = { ok: msg }; viewAdmin(tab); };
    const act = async (b, action, data, msg) => { busy(b, true); try { await api(action, data); reload(msg); } catch (e) { alertless(errText(e)); busy(b, false); } };
    const ED = `class="btn small ghost"`, DL = `class="btn small danger"`;
    const on = (sel, fn) => $('#tb').querySelectorAll(sel).forEach(b => b.onclick = () => fn(b));
    const draw = () => {
      const q = ($('#q').value || '').toLowerCase();
      const has = s => !q || String(s).toLowerCase().indexOf(q) >= 0;
      if (tab === 'trainees') {
        const rows = users.filter(x => has(x.name + ' ' + x.email + ' ' + x.company)).sort((a, b) => String(b.created).localeCompare(String(a.created)));
        $('#tb').innerHTML = `<table class="table"><tr><th>${t('fullName')}</th><th>${t('email')}</th><th>${coName()}</th><th>${t('created')}</th><th>${t('expires')}</th><th>${t('status')}</th><th>${t('progress')}</th><th>${t('best')}</th><th></th></tr>` +
          rows.map((x, i) => {
            const s = state(x);
            return `<tr><td>${esc(x.name)}</td><td class="mono">${esc(x.email)}</td><td>${esc(x.company)}</td><td>${fmtDate(x.created)}</td>
            <td>${x.expires ? fmtDate(x.expires) + ` <span class="hint">(${daysLeft(x.expires)})</span>` : '—'}</td>
            <td><span class="pill ${s === 'active' ? 'ok' : s === 'pending' ? '' : 'bad'}">${t(s)}</span></td>
            <td class="mono">${x.modulesOpened}/8 ${x.presentation ? '▶' : ''}</td><td class="mono">${x.best ? x.best.score + ' (' + x.best.percent + '%)' + (x.best.passed ? ' ✓' : '') : '—'} <span class="hint">×${x.attempts}</span></td>
            <td class="acts"><button class="btn small gold" data-ext="${i}">${s === 'awaiting' || s === 'expired' ? t('grant') : t('extend')}</button>
            <button ${ED} data-st="${i}">${x.status === 'disabled' ? t('enable') : t('disable')}</button> <button ${ED} data-ed="${i}">${t('edit')}</button> <button ${DL} data-del="${i}">${t('del')}</button></td></tr>`;
          }).join('') + `</table>`;
        on('[data-ext]', b => act(b, 'adminUpdate', { email: rows[b.dataset.ext].email, extendDays: 30 }));
        on('[data-st]', b => { const x = rows[b.dataset.st]; act(b, 'adminUpdate', { email: x.email, status: x.status === 'disabled' ? 'active' : 'disabled' }); });
        on('[data-ed]', async b => {
          const x = rows[b.dataset.ed];
          const v = await dialog(t('edit') + ' — ' + x.email, [
            { name: 'name', label: t('fullName'), value: x.name, required: true }, { name: 'company', label: coName(), value: x.company },
            { name: 'phone', label: t('phone').replace(/\s*\(.*\)/, ''), value: x.phone, ltr: true },
            { name: 'expires', label: t('expires'), type: 'date', value: dateIn(x.expires) },
            { name: 'courses', label: t('courses'), type: 'select', value: x.courses || '*', options: courseOpts() },
            { name: 'status', label: t('status'), type: 'select', value: x.status === 'disabled' ? 'disabled' : x.status === 'awaiting' ? 'awaiting' : 'active', options: [['active', t('active')], ['awaiting', t('awaiting')], ['disabled', t('disabled')]] }
          ], { submit: v => api('adminEditUser', Object.assign({ email: x.email }, v)) });
          if (v) reload(t('saved'));
        });
        on('[data-del]', async b => {
          const x = rows[b.dataset.del];
          const v = await confirmDel(`${t('confirmDel')} ${x.name} · ${x.email}`, [{ name: 'withResults', label: t('alsoResults'), type: 'checkbox' }]);
          if (v) act(b, 'adminDeleteUser', { email: x.email, withResults: v.withResults });
        });
      } else if (tab === 'codes') {
        const rows = codes.filter(x => has(x.code + ' ' + x.company + ' ' + x.requestRef + ' ' + x.redeemedBy));
        const msgText = x => encodeURIComponent(`INOVEX Academy — your access code: ${x.code}\n1) Open https://academy.inovex-group.com/#/signup\n2) Create your account and enter the code (or enter it after signing in).\nAccess: ${x.days} days.\n\nأكاديمية INOVEX — رمز الوصول الخاص بك: ${x.code}\nأنشئ حسابك على الرابط أعلاه وأدخل الرمز.`);
        $('#tb').innerHTML = `<details class="issue" ${codes.length ? '' : 'open'}><summary class="btn small gold">＋ ${t('newCodes')}</summary>
          <form id="ccf" class="issue-grid"><label class="field"><span>${coName()}</span><input name="company" required maxlength="120"></label>
          <label class="field"><span>${t('codeKind')}</span><select name="mode" class="sel"><option value="shared">${t('codeShared')}</option><option value="single">${t('codeSingle')}</option></select></label>
          <label class="field"><span>${t('seats')}</span><input name="seats" type="number" min="1" max="500" value="5"></label>
          <label class="field"><span>${t('days')}</span><input name="days" type="number" min="1" max="365" value="30"></label>
          <label class="field"><span>${t('courses')}</span><select name="courses" class="sel"><option value="*">${t('allCourses')}</option><option value="PC-101">PC-101</option></select></label>
          <label class="field"><span>${t('deadline')} (${t('optional')})</span><input name="validUntil" type="date"></label>
          <label class="field"><span>${t('requestRef')} (${t('optional')})</span><input name="requestRef" maxlength="40" placeholder="TR-…"></label>
          <label class="field"><span>${t('notesLabel')}</span><input name="note" maxlength="300" placeholder="Invoice / PO"></label>
          <div><button class="btn dark">${t('newCodes')}</button></div></form></details>
          <table class="table"><tr><th>${t('accessCode')}</th><th>${coName()}</th><th>${t('seats')}</th><th>${t('days')}</th><th>${t('courses')}</th><th>${t('deadline')}</th><th>${t('status')}</th><th></th></tr>` +
          rows.map((x, i) => `<tr><td class="mono"><b>${esc(x.code)}</b>${x.requestRef ? `<div class="hint">${esc(x.requestRef)}</div>` : ''}</td><td>${esc(x.company)}${x.note ? `<div class="hint">${esc(x.note)}</div>` : ''}</td>
            <td class="mono">${x.used}/${x.seats}${x.redeemedBy ? `<div class="hint" title="${esc(x.redeemedBy)}">${esc(String(x.redeemedBy).split(',').slice(0, 2).join(', '))}${String(x.redeemedBy).split(',').length > 2 ? '…' : ''}</div>` : ''}</td>
            <td class="mono">${x.days}</td><td class="mono">${x.courses === '*' ? t('allCourses') : esc(x.courses)}</td><td>${x.validUntil ? fmtDate(x.validUntil) : '—'}</td>
            <td><span class="pill ${x.status === 'active' && Number(x.used) < Number(x.seats) ? 'ok' : 'bad'}">${x.status !== 'active' ? t('disabled') : Number(x.used) >= Number(x.seats) ? t('usedUp') : t('active')}</span></td>
            <td class="acts"><button ${ED} data-copy="${esc(x.code)}">${t('copy')}</button> <a ${ED} href="mailto:?subject=${encodeURIComponent('INOVEX Academy access code')}&body=${msgText(x)}">${t('email').replace(/\s*\(.*\)/, '')}</a> <a class="btn small wa" href="https://wa.me/?text=${msgText(x)}" target="_blank" rel="noopener">WA</a>
            <button ${ED} data-kst="${i}">${x.status === 'active' ? t('disable') : t('enable')}</button> <button ${ED} data-ed="${i}">${t('edit')}</button> <button ${DL} data-del="${i}">${t('del')}</button></td></tr>`).join('') + `</table>`;
        $('#ccf').onsubmit = async e => {
          e.preventDefault(); const f = e.target, b = f.querySelector('button'); busy(b, true);
          const single = f.mode.value === 'single';
          try {
            const r2 = await api('adminCreateCodes', { company: f.company.value, seats: single ? 1 : f.seats.value, count: single ? f.seats.value : 1, days: f.days.value, courses: f.courses.value, validUntil: f.validUntil.value, requestRef: f.requestRef.value, note: f.note.value });
            reload(r2.codes.map(c => c.code).join('  '));
          } catch (err) { alertless(errText(err)); busy(b, false); }
        };
        on('[data-copy]', b => { try { navigator.clipboard.writeText(b.getAttribute('data-copy')); b.textContent = '✓'; } catch (e) {} });
        on('[data-kst]', b => { const x = rows[b.dataset.kst]; act(b, 'adminCodeStatus', { code: x.code, status: x.status === 'active' ? 'disabled' : 'active' }); });
        on('[data-ed]', async b => {
          const x = rows[b.dataset.ed];
          const v = await dialog(t('edit') + ' — ' + x.code, [
            { name: 'company', label: coName(), value: x.company, required: true }, { name: 'seats', label: t('seats'), type: 'number', min: Math.max(1, Number(x.used) || 0), max: 500, value: x.seats },
            { name: 'days', label: t('days'), type: 'number', min: 1, max: 365, value: x.days }, { name: 'courses', label: t('courses'), type: 'select', value: x.courses, options: courseOpts() },
            { name: 'validUntil', label: t('deadline'), type: 'date', value: dateIn(x.validUntil) }, { name: 'requestRef', label: t('requestRef'), value: x.requestRef, ltr: true },
            { name: 'note', label: t('notesLabel'), value: x.note }
          ], { submit: v => api('adminEditCode', Object.assign({ code: x.code }, v)) });
          if (v) reload(t('saved'));
        });
        on('[data-del]', async b => { const x = rows[b.dataset.del]; if (await confirmDel(`${t('confirmDel')} ${x.code}`)) act(b, 'adminDeleteCode', { code: x.code }); });
      } else if (tab === 'certs') {
        const rows = certs.filter(x => has(x.name + ' ' + x.email + ' ' + x.company + ' ' + x.certificateId + ' ' + x.course));
        $('#tb').innerHTML = `<details class="issue" ${certs.length ? '' : 'open'}><summary class="btn small gold">＋ ${t('issueCert')}</summary>
          <form id="icf" class="issue-grid"><label class="field"><span>${t('fullName')}</span><input name="name" required maxlength="100"></label>
          <label class="field"><span>${coName()}</span><input name="company" maxlength="120"></label>
          <label class="field"><span>${t('email').replace(/\s*\(.*\)/, '')}</span><input name="email" type="email" dir="ltr"></label>
          <label class="field"><span>${t('courseName')}</span><input name="course" required maxlength="160" value="Powder Coating Fundamentals"></label>
          <label class="field"><span>${t('certKind')}</span><select name="type" class="sel"><option value="Completion">${t('kCompletion')}</option><option value="Attendance">${t('kAttendance')}</option><option value="Qualification">${t('kQualification')}</option></select></label>
          <label class="field"><span>${t('certDate')}</span><input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
          <label class="field"><span>${t('yourScore')} (${t('optional')})</span><input name="score" maxlength="20" placeholder="e.g. 92%"></label>
          <label class="field"><span>${t('notesLabel')}</span><input name="note" maxlength="300"></label>
          <div><button class="btn dark">${t('issueCert')}</button></div></form></details>
          <table class="table"><tr><th>${t('certId')}</th><th>${t('fullName')}</th><th>${t('courseName')}</th><th>${t('certKind')}</th><th>${t('certDate')}</th><th>${t('yourScore')}</th><th>${t('status')}</th><th></th></tr>` +
          rows.map((x, i) => `<tr><td class="mono">${esc(x.certificateId)}</td><td>${esc(x.name)}${x.company ? `<div class="hint">${esc(x.company)}</div>` : ''}</td><td>${esc(x.course)}<div class="hint">${x.source === 'online' ? 'online' : t('issuedManually')}</div></td>
            <td>${esc(x.type)}</td><td>${fmtDate(x.date)}</td><td class="mono">${esc(x.score || '')}</td>
            <td><span class="pill ${x.status === 'revoked' ? 'bad' : 'ok'}">${x.status === 'revoked' ? t('revoked') : t('valid')}</span></td>
            <td class="acts"><button class="btn small gold" data-cpdf="${i}">PDF</button> <button ${ED} data-cprint="${i}">${t('print')}</button> <button ${ED} data-cst="${i}">${x.status === 'revoked' ? t('reinstate') : t('revoke')}</button>
            <button ${ED} data-ed="${i}">${t('edit')}</button> <button ${DL} data-del="${i}">${t('del')}</button></td></tr>`).join('') + `</table>`;
        $('#icf').onsubmit = async e => {
          e.preventDefault(); const f = e.target, b = f.querySelector('button'); busy(b, true);
          try {
            const res = await api('adminIssueCert', { name: f.name.value, company: f.company.value, email: f.email.value, course: f.course.value, type: f.type.value, date: f.date.value, score: f.score.value, note: f.note.value });
            const c = res.certificate;
            await certificatePdf(certData(Object.assign({ source: 'manual' }, c)));
            reload();
          } catch (err) { alertless(errText(err)); busy(b, false); }
        };
        const pdfBtn = mode => async b => { const x = rows[Number(b.dataset.cpdf != null ? b.dataset.cpdf : b.dataset.cprint)]; busy(b, true); try { await certificatePdf(certData(x), mode); } finally { busy(b, false); } };
        on('[data-cpdf]', pdfBtn()); on('[data-cprint]', pdfBtn('print'));
        on('[data-cst]', b => { const x = rows[b.dataset.cst]; act(b, 'adminCertStatus', { id: x.certificateId, status: x.status === 'revoked' ? 'valid' : 'revoked' }); });
        on('[data-ed]', async b => {
          const x = rows[b.dataset.ed];
          const v = await dialog(t('edit') + ' — ' + x.certificateId, [
            { name: 'name', label: t('fullName'), value: x.name, required: true }, { name: 'company', label: coName(), value: x.company },
            { name: 'course', label: t('courseName'), value: x.course, required: true },
            { name: 'type', label: t('certKind'), type: 'select', value: x.type, options: [['Completion', t('kCompletion')], ['Attendance', t('kAttendance')], ['Qualification', t('kQualification')]] },
            { name: 'date', label: t('certDate'), type: 'date', value: dateIn(x.date) }
          ].concat(x.source === 'online' ? [] : [{ name: 'score', label: t('yourScore'), value: x.score }]), { submit: v => api('adminEditCert', Object.assign({ id: x.certificateId }, v)) });
          if (v) reload(t('saved'));
        });
        on('[data-del]', async b => { const x = rows[b.dataset.del]; if (await confirmDel(`${t('confirmDel')} ${x.certificateId} · ${x.name}`)) act(b, 'adminDeleteCert', { id: x.certificateId }); });
      } else if (tab === 'requests') {
        const rows = apps.filter(x => has(x.company + ' ' + x.contact + ' ' + x.email + ' ' + x.ref));
        const stPill = s => `<span class="pill ${s === 'approved' ? 'ok' : s === 'rejected' ? 'bad' : s === 'new' ? 'gold' : ''}">${t({ new: 'rNew', approved: 'approved', rejected: 'rejected', closed: 'closed' }[s] || 'rNew')}</span>`;
        $('#tb').innerHTML = `<table class="table"><tr><th>${t('certDate')}</th><th>Ref</th><th>${coName()}</th><th>${t('fullName')}</th><th>${t('email')}</th><th>${t('phone').replace(/\s*\(.*\)/, '')}</th><th>${t('trainees')}</th><th>${t('status')}</th><th></th></tr>` +
          rows.map((x, i) => `<tr><td>${fmtDate(x.time)}</td><td class="mono">${esc(x.ref)}${x.pdf ? `<div><a href="${esc(x.pdf)}" target="_blank" rel="noopener">PDF</a></div>` : ''}</td><td>${esc(x.company)}${x.note ? `<div class="hint">${esc(x.note)}</div>` : ''}</td><td>${esc(x.contact)}</td><td class="mono">${esc(x.email)}</td><td class="mono">${esc(x.phone)}</td><td class="mono">${esc(x.trainees)}</td>
            <td>${stPill(x.status)}</td><td class="acts">${x.status !== 'approved' ? `<button class="btn small gold" data-ap="${i}">${t('approve')}</button> ` : ''}<button ${ED} data-ed="${i}">${t('edit')}</button> <button ${DL} data-del="${i}">${t('del')}</button></td></tr>`).join('') + `</table>`;
        on('[data-ap]', async b => {
          const x = rows[b.dataset.ap];
          const v = await dialog(t('approveT') + ' — ' + x.ref, [
            { name: 'company', label: coName(), value: x.company, required: true },
            { name: 'managerName', label: t('managerName'), value: x.contact }, { name: 'managerEmail', label: t('managerEmail'), type: 'email', value: x.email, required: true, ltr: true },
            { name: 'mode', label: t('codeKind'), type: 'select', value: 'shared', options: [['shared', t('codeShared')], ['single', t('codeSingle')]] },
            { name: 'seats', label: t('seats'), type: 'number', min: 0, max: 500, value: parseInt(x.trainees, 10) || 5 },
            { name: 'days', label: t('days'), type: 'number', min: 1, max: 365, value: 30 }, { name: 'courses', label: t('courses'), type: 'select', value: '*', options: courseOpts() },
            { name: 'notify', label: t('notify'), type: 'checkbox', value: true }
          ], { text: t('approveD'), ok: t('approve'), submit: v => api('adminApprove', { ref: x.ref, company: v.company, managerName: v.managerName, managerEmail: v.managerEmail, single: v.mode === 'single', seats: v.seats, days: v.days, courses: v.courses, notify: v.notify }) });
          if (v && v.ref) reload(t('approvedOk', { codes: (v.codes || []).map(c => c.code).join('  ') || '—' }));
        });
        on('[data-ed]', async b => {
          const x = rows[b.dataset.ed];
          const v = await dialog(t('edit') + ' — ' + x.ref, [
            { name: 'company', label: coName(), value: x.company, required: true }, { name: 'contact', label: t('fullName'), value: x.contact },
            { name: 'email', label: t('email').replace(/\s*\(.*\)/, ''), type: 'email', value: x.email, ltr: true }, { name: 'phone', label: t('phone').replace(/\s*\(.*\)/, ''), value: x.phone, ltr: true },
            { name: 'trainees', label: t('trainees'), value: x.trainees },
            { name: 'status', label: t('status'), type: 'select', value: x.status || 'new', options: [['new', t('rNew')], ['approved', t('approved')], ['rejected', t('rejected')], ['closed', t('closed')]] },
            { name: 'note', label: t('notesLabel'), type: 'textarea', value: x.note }
          ], { submit: v => api('adminEditApplication', Object.assign({ ref: x.ref }, v)) });
          if (v) reload(t('saved'));
        });
        on('[data-del]', async b => { const x = rows[b.dataset.del]; if (await confirmDel(`${t('confirmDel')} ${x.ref} · ${x.company}`)) act(b, 'adminDeleteApplication', { ref: x.ref }); });
      } else if (tab === 'companies') {
        const rows = comps.filter(x => has(x.company + ' ' + x.managerEmail + ' ' + x.managerName + ' ' + x.requestRef));
        const form = x => [
          { name: 'company', label: coName(), value: x.company, required: true }, { name: 'managerName', label: t('managerName'), value: x.managerName },
          { name: 'managerEmail', label: t('managerEmail'), value: x.managerEmail, required: true, ltr: true, hint: t('managerEmailsHint') },
          { name: 'phone', label: t('phone').replace(/\s*\(.*\)/, ''), value: x.phone, ltr: true }, { name: 'requestRef', label: t('requestRef'), value: x.requestRef, ltr: true, hint: t('refsHint') },
          { name: 'status', label: t('status'), type: 'select', value: x.status || 'active', options: [['active', t('active')], ['disabled', t('disabled')]] },
          { name: 'note', label: t('notesLabel'), value: x.note }];
        $('#tb').innerHTML = `<p><button class="btn small gold" id="addco">＋ ${t('addCompany')}</button></p><table class="table"><tr><th>${coName()}</th><th>${t('manager')}</th><th>${t('requestRef')}</th><th>${t('seatsUsed')}</th><th>${t('trainees')}</th><th>${t('status')}</th><th></th></tr>` +
          rows.map((x, i) => `<tr><td><b>${esc(x.company)}</b>${x.note ? `<div class="hint">${esc(x.note)}</div>` : ''}</td><td>${esc(x.managerName || '')}<div class="mono hint">${esc(x.managerEmail)}</div></td><td class="mono">${esc(x.requestRef || '')}</td>
            <td class="mono">${x.used || 0}/${x.seats}<div class="hint">${x.codes} ${t('codesTab').toLowerCase()}</div></td><td class="mono">${x.trainees}</td><td><span class="pill ${x.status === 'disabled' ? 'bad' : 'ok'}">${x.status === 'disabled' ? t('disabled') : t('active')}</span></td>
            <td class="acts"><button class="btn small gold" data-seat="${i}">＋ ${t('addSeats')}</button> <a class="btn small ghost" href="#/manager/${encodeURIComponent(x.company)}">${t('dashboard')}</a> <button ${ED} data-ed="${i}">${t('edit')}</button> <button ${DL} data-del="${i}">${t('del')}</button></td></tr>`).join('') + `</table>`;
        on('[data-seat]', async b => {
          const x = rows[b.dataset.seat];
          const v = await dialog(t('addSeats') + ' — ' + x.company, [
            { name: 'seats', label: t('seats'), type: 'number', min: 1, max: 500, value: 5, required: true },
            { name: 'days', label: t('days'), type: 'number', min: 1, max: 365, value: 30 }, { name: 'courses', label: t('courses'), type: 'select', value: '*', options: courseOpts() }
          ], { text: t('addSeatsD'), submit: v => api('adminAddSeats', Object.assign({ company: x.company }, v)) });
          if (v) reload(t('saved'));
        });
        $('#addco').onclick = async () => { const v = await dialog(t('addCompany'), form({}), { submit: v => api('adminSaveCompany', v) }); if (v) reload(t('saved')); };
        on('[data-ed]', async b => { const x = rows[b.dataset.ed]; const v = await dialog(t('edit') + ' — ' + x.company, form(x), { submit: v => api('adminSaveCompany', Object.assign({ original: x.company }, v)) }); if (v) reload(t('saved')); });
        on('[data-del]', async b => { const x = rows[b.dataset.del]; if (await confirmDel(`${t('confirmDel')} ${x.company}`)) act(b, 'adminDeleteCompany', { company: x.company }); });
      } else if (tab === 'admins') {
        $('#tb').innerHTML = `<form id="aaf" class="toolbar" style="margin:0 0 12px"><input name="email" type="email" required dir="ltr" placeholder="name@inovex-group.com" pattern=".+@inovex-group\\.com$" title="${esc(t('adminDomain'))}"><button class="btn small gold">＋ ${t('addAdmin')}</button></form>
          <p class="hint">${t('adminDomain')}</p><table class="table"><tr><th>${t('email')}</th><th></th><th></th></tr>` +
          admins.filter(x => has(x.email)).map((x, i) => `<tr><td class="mono">${esc(x.email)}</td><td>${x.owner ? `<span class="pill gold">${t('owner')}</span>` : ''} ${x.you ? `<span class="pill">${t('you')}</span>` : ''} ${!x.valid ? `<span class="pill bad">${t('adminDomain')}</span>` : ''}</td>
            <td class="acts">${x.owner || x.you ? '' : `<button ${DL} data-rm="${esc(x.email)}">${t('remove')}</button>`}</td></tr>`).join('') + `</table>`;
        $('#aaf').onsubmit = async e => { e.preventDefault(); const f = e.target; act(f.querySelector('button'), 'adminAddAdmin', { email: f.email.value.trim().toLowerCase() }, t('saved')); };
        on('[data-rm]', async b => { if (await confirmDel(`${t('remove')} ${b.dataset.rm}?`)) act(b, 'adminRemoveAdmin', { email: b.dataset.rm }); });
      } else {
        const rows = results.filter(x => has(x.name + ' ' + x.email));
        $('#tb').innerHTML = `<table class="table"><tr><th>${t('certDate')}</th><th>${t('fullName')}</th><th>${t('email')}</th><th>${t('assessment')}</th><th>${t('language')}</th><th>${t('yourScore')}</th><th>${t('status')}</th><th>${t('certId')}</th><th></th></tr>` +
          rows.map((x, i) => `<tr><td>${fmtDate(x.time)}</td><td>${esc(x.name)}</td><td class="mono">${esc(x.email)}</td><td class="mono">${esc(x.course)}</td><td>${esc((I18N[x.lang] || {})._name || x.lang)}</td>
          <td class="mono">${x.score}/${x.total} (${x.percent}%)</td><td><span class="pill ${x.passed ? 'ok' : 'bad'}">${x.passed ? t('passed') : t('notPassed')}</span></td><td class="mono">${esc(x.certificateId || '')}</td>
          <td class="acts"><button ${DL} data-del="${i}">${t('del')}</button></td></tr>`).join('') + `</table>`;
        on('[data-del]', async b => { const x = rows[b.dataset.del]; if (await confirmDel(`${t('confirmDel')} ${x.name} · ${x.score}/${x.total}${x.certificateId ? ' · ' + x.certificateId : ''}`)) act(b, 'adminDeleteResult', { email: x.email, time: x.time }); });
      }
    };
    $('#q').oninput = draw;
    $('#csv').onclick = () => {
      const rows = tab === 'codes'
        ? [['code', 'company', 'seats', 'used', 'days', 'courses', 'validUntil', 'status', 'requestRef', 'note', 'redeemedBy']].concat(codes.map(x => [x.code, x.company, x.seats, x.used, x.days, x.courses, x.validUntil, x.status, x.requestRef, x.note, x.redeemedBy]))
        : tab === 'certs'
        ? [['certificateId', 'name', 'company', 'email', 'course', 'type', 'date', 'score', 'status', 'source']].concat(certs.map(x => [x.certificateId, x.name, x.company, x.email, x.course, x.type, x.date, x.score, x.status, x.source]))
        : tab === 'requests'
        ? [['time', 'ref', 'company', 'contact', 'email', 'phone', 'trainees', 'status', 'note', 'pdf']].concat(apps.map(x => [x.time, x.ref, x.company, x.contact, x.email, x.phone, x.trainees, x.status, x.note, x.pdf]))
        : tab === 'companies'
        ? [['company', 'managerName', 'managerEmail', 'phone', 'requestRef', 'codes', 'seats', 'trainees', 'status', 'note']].concat(comps.map(x => [x.company, x.managerName, x.managerEmail, x.phone, x.requestRef, x.codes, x.seats, x.trainees, x.status, x.note]))
        : tab === 'admins'
        ? [['email', 'owner']].concat(admins.map(x => [x.email, x.owner]))
        : tab === 'trainees'
        ? [['name', 'email', 'company', 'phone', 'created', 'expires', 'status', 'modulesOpened', 'presentation', 'attempts', 'bestScore', 'bestPercent', 'passed']].concat(users.map(x => [x.name, x.email, x.company, x.phone, x.created, x.expires, state(x), x.modulesOpened, x.presentation, x.attempts, x.best ? x.best.score : '', x.best ? x.best.percent : '', x.best ? x.best.passed : '']))
        : [['time', 'name', 'email', 'course', 'lang', 'score', 'total', 'percent', 'passed', 'certificateId']].concat(results.map(x => [x.time, x.name, x.email, x.course, x.lang, x.score, x.total, x.percent, x.passed, x.certificateId]));
      downloadCsv(rows, `INOVEX_Academy_${tab}_${new Date().toISOString().slice(0, 10)}.csv`);
    };
    draw();
  }
  function downloadCsv(rows, name) {
    const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = name; a.click();
  }

  /* ---------------------------------------------------------------- company manager dashboard */
  async function viewManager(company) {
    view(`<p>${t('loading')}</p>`);
    const d = await api('managerDashboard', company ? { company: company } : {});
    const tr = d.trainees, certs = d.certificates, codes = d.codes, M = d.modulesTotal || 8, now = Date.now();
    const seats = d.seats ? d.seats.total : codes.reduce((a, k) => a + k.seats, 0), used = d.seats ? d.seats.used : codes.reduce((a, k) => a + k.used, 0), free = d.seats ? d.seats.free : seats - used;
    const coArg = S.user.admin || d.companies.length > 1 ? { company: d.company.company } : {};
    const pct = x => Math.round(((x.modulesOpened + (x.presentation ? 1 : 0) + (x.best && x.best.passed ? 1 : 0)) / (M + 2)) * 100);
    const avg = tr.length ? Math.round(tr.reduce((a, x) => a + pct(x), 0) / tr.length) : 0;
    const st = x => x.invited ? 'invited' : x.status === 'disabled' ? 'disabled' : x.status === 'deleted' ? 'disabled' : !x.expires ? 'awaiting' : new Date(x.expires) < now ? 'expired' : 'active';
    const addCard = `<div class="card seatcard"><div class="seathead"><div><h2 style="margin:0">${t('addTrainees')}</h2><p class="hint" style="margin:4px 0 0">${t('addTraineesD')}</p></div>
        <div class="seatnum ${free ? '' : 'none'}"><b>${free}</b><span>${t('seatsFree')}</span></div></div>
      ${free ? `<form id="atf" class="addrow"><input name="name" required minlength="2" maxlength="80" placeholder="${esc(t('fullName'))}" autocomplete="off"><input name="email" type="email" required dir="ltr" placeholder="${esc(t('email').replace(/\s*\(.*\)/, ''))}" autocomplete="off"><button class="btn gold">＋ ${t('addTrainee')}</button></form>
      <details class="paste"><summary>${t('pasteList')}</summary><textarea id="atl" rows="5" dir="auto" placeholder="Ahmed Ali, ahmed@company.com&#10;Omar Saleh, omar@company.com"></textarea><button class="btn small dark" id="atlb">${t('addTrainees')}</button></details>`
        : `<p class="msg err" style="margin:10px 0 0">${t('noSeats')}</p>`}</div>`;
    const certOf = id => certs.filter(c => c.certificateId === id)[0];
    const switcher = S.user.admin || d.companies.length > 1
      ? `<label class="field" style="max-width:340px"><span>${t('viewAs')}</span>${S.user.admin ? `<input id="cosel" list="cos" value="${esc(d.company.company)}"><datalist id="cos">${d.companies.map(c => `<option value="${esc(c)}">`).join('')}</datalist>` : `<select id="cosel" class="sel">${d.companies.map(c => `<option ${c === d.company.company ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>`}</label>` : '';
    view(`${msgBox()}<div class="pill gold">${t('dashboard')}</div><h1 style="margin-top:8px" dir="auto">${esc(d.company.company)}</h1>
      ${d.company.requestRef ? `<p class="hint mono">${esc(d.company.requestRef)}</p>` : ''}${switcher}
      <div class="kpis"><div class="kpi"><b>${tr.length}</b><span>${t('trainees')}</span></div><div class="kpi"><b>${used}/${seats}</b><span>${t('seatsUsed')}</span></div>
      <div class="kpi"><b>${avg}%</b><span>${t('avgProgress')}</span></div><div class="kpi"><b>${tr.filter(x => x.best && x.best.passed).length}</b><span>${t('passed')}</span></div>
      <div class="kpi"><b>${certs.length}</b><span>${t('certificates')}</span></div></div>
      ${addCard}
      <div class="toolbar"><h2 style="margin:0;flex:1">${t('teamProgress')}</h2><button class="btn small dark" id="mcsv">${t('exportCsv')}</button></div>
      <div class="tablewrap">${tr.length ? `<table class="table"><tr><th>${t('fullName')}</th><th>${t('status')}</th><th>${t('progress')}</th><th>${t('best')}</th><th>${t('lastActivity')}</th><th>${t('certificates')}</th></tr>` +
        tr.map(x => { const s = st(x); return `<tr><td>${esc(x.name || '—')}<div class="mono hint">${esc(x.email)}</div></td>
          <td><span class="pill ${s === 'active' ? 'ok' : s === 'invited' ? 'gold' : 'bad'}">${t(s)}</span>${x.expires ? `<div class="hint">${t('expires')}: ${fmtDate(x.expires)}</div>` : ''}
            ${x.invited ? `<div class="acts" style="margin-top:6px"><button class="btn small ghost" data-resend="${esc(x.email)}">${t('resend')}</button> <button class="btn small danger" data-rmt="${esc(x.email)}">${t('remove')}</button></div>` : ''}</td>
          <td style="min-width:170px"><div class="bar"><i style="width:${pct(x)}%"></i></div><div class="hint">${t('modules')} <span class="mono" dir="ltr">${x.modulesOpened}/${M}</span>${x.presentation ? ' · ▶' : ''} · <span class="mono" dir="ltr">${pct(x)}%</span></div></td>
          <td class="mono">${x.best ? `${x.best.score}/${x.best.total} (${x.best.percent}%) ${x.best.passed ? '✓' : ''}` : '—'} <span class="hint">×${x.attempts}</span></td>
          <td>${x.lastActivity ? fmtDate(x.lastActivity) : '—'}</td>
          <td class="acts">${x.certificates.map(id => `<button class="btn small gold" data-mpdf="${esc(id)}">PDF</button> <button class="btn small ghost" data-mprint="${esc(id)}">${t('print')}</button>`).join('<br>') || '—'}</td></tr>`; }).join('') + `</table>` : `<p class="hint">${t('noTrainees')}</p>`}</div>
      <div class="toolbar" style="margin-top:22px"><h2 style="margin:0;flex:1">${t('certificates')}</h2>${certs.length ? `<button class="btn small gold" id="mall">${t('downloadAll')}</button> <button class="btn small ghost" id="mallp">${t('print')}</button>` : ''}</div>
      <div class="tablewrap">${certs.length ? `<table class="table"><tr><th>${t('certId')}</th><th>${t('fullName')}</th><th>${t('courseName')}</th><th>${t('certKind')}</th><th>${t('certDate')}</th><th></th></tr>` +
        certs.map(c => `<tr><td class="mono">${esc(c.certificateId)}</td><td>${esc(c.name)}</td><td>${esc(c.course)}</td><td>${esc(c.type)}</td><td>${fmtDate(c.date)}</td>
          <td class="acts"><button class="btn small gold" data-mpdf="${esc(c.certificateId)}">PDF</button> <button class="btn small ghost" data-mprint="${esc(c.certificateId)}">${t('print')}</button> <a class="btn small ghost" href="#/cert/${esc(c.certificateId)}">${t('check')}</a></td></tr>`).join('') + `</table>` : `<p class="hint">${t('noCerts')}</p>`}</div>
      <h2 style="margin-top:22px">${t('codesTab')}</h2><div class="tablewrap"><table class="table"><tr><th>${t('accessCode')}</th><th>${t('seatsUsed')}</th><th>${t('days')}</th><th>${t('deadline')}</th><th>${t('status')}</th></tr>` +
        codes.map(k => `<tr><td class="mono"><b>${esc(k.code)}</b></td><td class="mono">${k.used}/${k.seats}</td><td class="mono">${esc(k.days)}</td><td>${k.validUntil ? fmtDate(k.validUntil) : '—'}</td>
          <td><span class="pill ${k.status === 'active' && k.used < k.seats ? 'ok' : 'bad'}">${k.status !== 'active' ? t('disabled') : k.used >= k.seats ? t('usedUp') : t('active')}</span></td></tr>`).join('') + `</table></div>`);
    const run = mode => async b => { const c = certOf(b.getAttribute(mode === 'print' ? 'data-mprint' : 'data-mpdf')); if (!c) return; busy(b, true); try { await certificatePdf(certData(c), mode); } finally { busy(b, false); } };
    app.querySelectorAll('[data-mpdf]').forEach(b => b.onclick = () => run()(b));
    app.querySelectorAll('[data-mprint]').forEach(b => b.onclick = () => run('print')(b));
    const all = mode => async e => { const b = e.target; busy(b, true); try { await certificatePdf(certs.map(certData), mode); } finally { busy(b, false); } };
    if ($('#mall')) { $('#mall').onclick = all(); $('#mallp').onclick = all('print'); }
    const parse = txt => txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
      const m = l.match(/[^\s,;\t<>]+@[^\s,;\t<>]+/); const email = m ? m[0] : '';
      return { email: email, name: l.replace(email, '').replace(/[<>]/g, '').replace(/^[\s,;\t]+|[\s,;\t]+$/g, '').replace(/\s*[,;\t]\s*/g, ' ') };
    });
    const addMany = async (list, b) => {
      if (!list.length) return;
      busy(b, true);
      try { const r = await api('managerAddTrainees', Object.assign({ trainees: list, lang: S.lang }, coArg)); S.flash = { ok: t('addedOk', { n: r.added.length }) + (r.skipped.length ? ' · ' + t('alreadyIn') + ': ' + r.skipped.join(', ') : '') }; viewManager(company); }
      catch (e) { alertless(errText(e)); busy(b, false); }
    };
    if ($('#atf')) {
      $('#atf').onsubmit = e => { e.preventDefault(); const f = e.target; addMany([{ name: f.name.value.trim(), email: f.email.value.trim().toLowerCase() }], f.querySelector('button')); };
      $('#atlb').onclick = e => { e.preventDefault(); const list = parse($('#atl').value); if (list.some(x => !x.email || x.name.length < 2)) return alertless(t('e_trainee_invalid')); addMany(list, e.target); };
    }
    app.querySelectorAll('[data-resend]').forEach(b => b.onclick = async () => { busy(b, true); try { await api('managerResendInvite', Object.assign({ email: b.dataset.resend }, coArg)); b.textContent = '✓'; } catch (e) { alertless(errText(e)); busy(b, false); } });
    app.querySelectorAll('[data-rmt]').forEach(b => b.onclick = async () => {
      if (!(await confirmDel(`${t('remove')} ${b.dataset.rmt}? ${t('freeSeat')}`))) return;
      busy(b, true); try { await api('managerRemoveTrainee', Object.assign({ email: b.dataset.rmt }, coArg)); S.flash = { ok: t('saved') }; viewManager(company); } catch (e) { alertless(errText(e)); busy(b, false); }
    });
    const sel = $('#cosel'); if (sel) sel.onchange = () => go('/manager/' + encodeURIComponent(sel.value));
    $('#mcsv').onclick = () => downloadCsv([['name', 'email', 'status', 'expires', 'modulesOpened', 'presentation', 'progressPercent', 'attempts', 'bestScore', 'bestPercent', 'passed', 'lastActivity', 'certificates']]
      .concat(tr.map(x => [x.name, x.email, st(x), x.expires, x.modulesOpened, x.presentation, pct(x), x.attempts, x.best ? x.best.score + '/' + x.best.total : '', x.best ? x.best.percent : '', x.best ? x.best.passed : '', x.lastActivity, x.certificates.join(' ')])),
      `INOVEX_Academy_${d.company.company.replace(/[^\w]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  /* ---------------------------------------------------------------- start */
  applyLang();
  route();
})();
