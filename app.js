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
    lang: LANGS.indexOf(store.get('lang')) >= 0 ? store.get('lang') : guessLang(),
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
    S.lang = e.target.value; store.set('lang', S.lang); applyLang();
    if (S.token) api('setLang', { lang: S.lang }).catch(() => {});
    S.catalog = null; route();
  });
  function renderNav() {
    const nav = $('#nav');
    const req = `<a class="navbtn hide-sm" href="#/request">${t('requestTraining')}</a>`;
    if (!S.token) { nav.innerHTML = req + `<a class="navbtn" href="#/login">${t('signIn')}</a>`; return; }
    nav.innerHTML = req + `<a class="navbtn" href="#/home">${t('myCourses')}</a>` +
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
      if (!S.token) {
        if (p[0] === 'signup') return viewSignup();
        if (p[0] === 'verify') return viewVerify();
        if (p[0] === 'forgot') return viewForgot();
        if (p[0] === 'reset') return viewReset();
        if (p[0] === 'login') return viewLogin();
        return viewLanding();
      }
      if (!S.user) await loadMe();
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
    applyLang(); go('/home');
  }
  function showErr(form, err) {
    let m = form.parentNode.querySelector('.msg'); if (m) m.remove();
    m = document.createElement('div'); m.className = 'msg err'; m.textContent = errText(err);
    form.parentNode.insertBefore(m, form);
  }
  function viewLogin() {
    view(`<div class="card auth"><h2>${t('signIn')}</h2>${msgBox()}${loginForm()}
      <div class="links"><span>${t('noAccount')}</span><a href="#/signup">${t('createAccount')}</a><a href="#/forgot">${t('forgot')}</a></div></div>`);
    bindLogin();
  }
  function viewSignup() {
    view(`<div class="card auth"><h2>${t('createAccount')}</h2><p class="hint">${t('accessNote')}</p>${msgBox()}
      <form id="sf"><label class="field"><span>${t('fullName')}</span><input name="name" required maxlength="80" autocomplete="name"></label>
      <label class="field"><span>${t('email')}</span><input name="email" type="email" required dir="ltr" autocomplete="email"></label>
      <label class="field"><span>${t('password')}</span><input name="password" type="password" required minlength="8" dir="ltr" autocomplete="new-password"><div class="hint">${t('pwRule')}</div></label>
      <label class="field"><span>${t('company')}</span><input name="company" maxlength="80" autocomplete="organization"></label>
      <label class="field"><span>${t('phone')}</span><input name="phone" type="tel" maxlength="30" dir="ltr" autocomplete="tel"></label>
      <button class="btn gold" style="width:100%">${t('createAccount')}</button></form>
      <div class="links"><span>${t('haveAccount')}</span><a href="#/login">${t('signIn')}</a></div></div>`);
    $('#sf').onsubmit = async e => {
      e.preventDefault();
      const f = e.target, b = f.querySelector('button'); busy(b, true);
      try {
        await api('signup', { name: f.name.value, email: f.email.value, password: f.password.value, company: f.company.value, phone: f.phone.value });
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
  async function certificatePdf(d) {
    const off = $('#offscreen');
    const local = S.lang !== 'en';
    const enTitle = d.courseTitleEn || (d.courseId === 'PC-101' ? 'Powder Coating Fundamentals' : d.courseTitle);
    off.innerHTML = `<div class="certpage" id="cp"><div class="cert"><div class="in">
      <div class="top1"><i>I</i>INOVEX ACADEMY</div>
      <h1>CERTIFICATE OF COMPLETION</h1>${local ? `<div class="tl">${esc(t('certTitle'))}</div>` : '<div class="tl">&nbsp;</div>'}
      <div style="font-size:18px;color:#444">This certifies that</div>${local ? `<div dir="${I18N[S.lang]._dir}" style="font-size:16px;color:#777">${esc(t('certBody'))}</div>` : ''}
      <div class="nm">${esc(d.name)}</div>
      <div style="font-size:18px;color:#444">has successfully completed the course</div>${local ? `<div dir="${I18N[S.lang]._dir}" style="font-size:16px;color:#777">${esc(t('certCompleted'))}</div>` : ''}
      <div class="cr">${esc(d.courseId)} — ${esc(enTitle)}</div>${local ? `<div class="crl" dir="${I18N[S.lang]._dir}">${esc(d.courseTitle)}</div>` : ''}
      <div class="partners">Authorised by Wagner Group · In association with Al Qemma Academy</div>
      <div class="row"><div>${'Assessment score'}<b>${d.score} / ${d.total} (${d.percent}%)</b></div><div>Date<b>${fmtDate(d.date, 'en')}</b></div>
        <div>Certificate ID<b>${esc(d.certificateId)}</b></div><div class="sig">Academy Director<br><span style="font-size:12px;color:#666">INOVEX Group LLC · Riyadh</span></div></div>
      <div style="position:absolute;left:0;right:0;bottom:16px;font-size:11px;color:#888">Verify: ${location.origin}${location.pathname}#/cert/${esc(d.certificateId)}</div>
    </div></div></div>`;
    const lang = S.lang; const dir = document.documentElement.dir;
    document.documentElement.dir = 'ltr';
    try {
      const canvas = await snap($('#cp'));
      const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 297, 210);
      pdf.save(`INOVEX_Academy_Certificate_${d.courseId}_${d.certificateId}.pdf`);
    } finally { document.documentElement.dir = dir; off.innerHTML = ''; S.lang = lang; }
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
  function viewCertCheck(id) {
    view(`<div class="card auth"><h2>${t('verifyCert')}</h2><form id="cf"><label class="field"><span>${t('certId')}</span><input name="id" class="mono" value="${esc(decodeURIComponent(id))}" required></label>
      <button class="btn gold" style="width:100%">${t('check')}</button></form><div id="cr" style="margin-top:14px"></div></div>`);
    const run = async () => {
      const out = $('#cr'); out.innerHTML = t('loading');
      try {
        const r = await api('verifyCert', { id: $('#cf').id.value });
        out.innerHTML = `<div class="msg ok"><b>✓ ${t('certValid')}</b><br>${esc(r.name)} · <span class="mono">${esc(r.course)}</span> · ${fmtDate(r.date)} · <span class="mono">${r.percent}%</span></div>`;
      } catch (e) { out.innerHTML = `<div class="msg err">${e.message === 'not_found' ? t('certInvalid') : errText(e)}</div>`; }
    };
    $('#cf').onsubmit = e => { e.preventDefault(); run(); };
    if (id) run();
  }

  /* ---------------------------------------------------------------- admin */
  async function viewAdmin(tab) {
    tab = tab || 'trainees';
    view(`<p>${t('loading')}</p>`);
    const [u, r, a] = await Promise.all([api('adminUsers'), api('adminResults'), api('adminApplications').catch(() => ({ applications: [] }))]);
    const users = u.users, results = r.results, apps = a.applications || [];
    const now = Date.now();
    const state = x => x.status === 'disabled' ? 'disabled' : !x.verified ? 'pending' : (x.expires && new Date(x.expires) < now ? 'expired' : 'active');
    const passedSet = new Set(results.filter(x => x.passed).map(x => x.email));
    const kpi = `<div class="kpis"><div class="kpi"><b>${users.length}</b><span>${t('trainees')}</span></div>
      <div class="kpi"><b>${users.filter(x => state(x) === 'active').length}</b><span>${t('active')}</span></div>
      <div class="kpi"><b>${passedSet.size}</b><span>${t('passed')}</span></div>
      <div class="kpi"><b>${results.length}</b><span>${t('attempts')}</span></div></div>`;
    view(`<h1>${t('admin')}</h1>${kpi}<div class="tabs"><button data-tab="trainees" class="${tab === 'trainees' ? 'on' : ''}">${t('trainees')}</button><button data-tab="results" class="${tab === 'results' ? 'on' : ''}">${t('results')}</button><button data-tab="requests" class="${tab === 'requests' ? 'on' : ''}">${t('requests')} (${apps.length})</button></div>
      <div class="toolbar"><input id="q" placeholder="${t('search')}"><button class="btn small dark" id="csv">${t('exportCsv')}</button></div><div class="tablewrap" id="tb"></div>`);
    app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => viewAdmin(b.getAttribute('data-tab')));
    const draw = () => {
      const q = ($('#q').value || '').toLowerCase();
      if (tab === 'trainees') {
        const rows = users.filter(x => !q || (x.name + ' ' + x.email + ' ' + x.company).toLowerCase().indexOf(q) >= 0)
          .sort((a, b) => String(b.created).localeCompare(String(a.created)));
        $('#tb').innerHTML = `<table class="table"><tr><th>${t('fullName')}</th><th>${t('email')}</th><th>${t('company').replace(/\s*\(.*\)/, '')}</th><th>${t('created')}</th><th>${t('expires')}</th><th>${t('status')}</th><th>${t('progress')}</th><th>${t('best')}</th><th></th></tr>` +
          rows.map(x => {
            const s = state(x);
            return `<tr><td>${esc(x.name)}</td><td class="mono">${esc(x.email)}</td><td>${esc(x.company)}</td><td>${fmtDate(x.created)}</td>
            <td>${x.expires ? fmtDate(x.expires) + ` <span class="hint">(${daysLeft(x.expires)})</span>` : '—'}</td>
            <td><span class="pill ${s === 'active' ? 'ok' : s === 'pending' ? '' : 'bad'}">${t(s)}</span></td>
            <td class="mono">${x.modulesOpened}/8 ${x.presentation ? '▶' : ''}</td><td class="mono">${x.best ? x.best.score + ' (' + x.best.percent + '%)' + (x.best.passed ? ' ✓' : '') : '—'} <span class="hint">×${x.attempts}</span></td>
            <td style="white-space:nowrap"><button class="btn small gold" data-ext="${esc(x.email)}">${t('extend')}</button>
            <button class="btn small ghost" data-st="${esc(x.email)}" data-v="${x.status === 'disabled' ? 'active' : 'disabled'}">${x.status === 'disabled' ? t('enable') : t('disable')}</button></td></tr>`;
          }).join('') + `</table>`;
        $('#tb').querySelectorAll('[data-ext]').forEach(b => b.onclick = () => upd(b, { email: b.getAttribute('data-ext'), extendDays: 30 }));
        $('#tb').querySelectorAll('[data-st]').forEach(b => b.onclick = () => upd(b, { email: b.getAttribute('data-st'), status: b.getAttribute('data-v') }));
      } else if (tab === 'requests') {
        const rows = apps.filter(x => !q || (x.company + ' ' + x.contact + ' ' + x.email).toLowerCase().indexOf(q) >= 0);
        $('#tb').innerHTML = `<table class="table"><tr><th>${t('certDate')}</th><th>Ref</th><th>${t('company').replace(/\s*\(.*\)/, '')}</th><th>${t('fullName')}</th><th>${t('email')}</th><th>${t('phone').replace(/\s*\(.*\)/, '')}</th><th>${t('trainees')}</th><th>PDF</th></tr>` +
          rows.map(x => `<tr><td>${fmtDate(x.time)}</td><td class="mono">${esc(x.ref)}</td><td>${esc(x.company)}</td><td>${esc(x.contact)}</td><td class="mono">${esc(x.email)}</td><td class="mono">${esc(x.phone)}</td><td class="mono">${esc(x.trainees)}</td><td>${x.pdf ? `<a href="${esc(x.pdf)}" target="_blank" rel="noopener">PDF</a>` : ''}</td></tr>`).join('') + `</table>`;
      } else {
        const rows = results.filter(x => !q || (x.name + ' ' + x.email).toLowerCase().indexOf(q) >= 0);
        $('#tb').innerHTML = `<table class="table"><tr><th>${t('certDate')}</th><th>${t('fullName')}</th><th>${t('email')}</th><th>${t('assessment')}</th><th>${t('language')}</th><th>${t('yourScore')}</th><th>${t('status')}</th><th>${t('certId')}</th></tr>` +
          rows.map(x => `<tr><td>${fmtDate(x.time)}</td><td>${esc(x.name)}</td><td class="mono">${esc(x.email)}</td><td class="mono">${esc(x.course)}</td><td>${esc((I18N[x.lang] || {})._name || x.lang)}</td>
          <td class="mono">${x.score}/${x.total} (${x.percent}%)</td><td><span class="pill ${x.passed ? 'ok' : 'bad'}">${x.passed ? t('passed') : t('notPassed')}</span></td><td class="mono">${esc(x.certificateId || '')}</td></tr>`).join('') + `</table>`;
      }
    };
    async function upd(b, data) {
      busy(b, true);
      try { await api('adminUpdate', data); viewAdmin(tab); } catch (e) { alertless(errText(e)); busy(b, false); }
    }
    $('#q').oninput = draw;
    $('#csv').onclick = () => {
      const rows = tab === 'requests'
        ? [['time', 'ref', 'company', 'contact', 'email', 'phone', 'trainees', 'pdf']].concat(apps.map(x => [x.time, x.ref, x.company, x.contact, x.email, x.phone, x.trainees, x.pdf]))
        : tab === 'trainees'
        ? [['name', 'email', 'company', 'phone', 'created', 'expires', 'status', 'modulesOpened', 'presentation', 'attempts', 'bestScore', 'bestPercent', 'passed']].concat(users.map(x => [x.name, x.email, x.company, x.phone, x.created, x.expires, state(x), x.modulesOpened, x.presentation, x.attempts, x.best ? x.best.score : '', x.best ? x.best.percent : '', x.best ? x.best.passed : '']))
        : [['time', 'name', 'email', 'course', 'lang', 'score', 'total', 'percent', 'passed', 'certificateId']].concat(results.map(x => [x.time, x.name, x.email, x.course, x.lang, x.score, x.total, x.percent, x.passed, x.certificateId]));
      const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `INOVEX_Academy_${tab}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    };
    draw();
  }

  /* ---------------------------------------------------------------- start */
  applyLang();
  route();
})();
