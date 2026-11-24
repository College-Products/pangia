/* Pangia | College Products */
(function () {
  'use strict';

  var CFG = window.PANGIA_CONFIG || {};
  var state = {
    token: null,
    data: null,
    schoolCache: {},
    filter: 'all',
    search: '',
    logSearch: '',
    contactFilter: 'all',
    contactSearch: '',
    contactSchool: '',
    modal: false,
    map: null,
    mapObj: null,
    palette: { open: false, query: '', index: 0, items: [] }
  };

  /* ---------------------------------------------------------------- */
  /* Utilities                                                        */
  /* ---------------------------------------------------------------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) { return /^https:\/\//i.test(String(u || '')) ? String(u) : ''; }
  function fmtNum(n) { return n == null ? '' : Number(n).toLocaleString('en-US'); }
  function toDate(iso) {
    if (!iso) return null;
    var d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T00:00:00') : new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmtDate(iso, opts) {
    var d = toDate(iso);
    return d ? d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  }
  function relTime(iso) {
    var d = toDate(iso);
    if (!d) return '';
    var s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) { var h = Math.round(s / 3600); return h + (h === 1 ? ' hour ago' : ' hours ago'); }
    if (s < 172800) return 'Yesterday';
    if (s < 604800) return Math.round(s / 86400) + ' days ago';
    return fmtDate(iso, { month: 'short', day: 'numeric' });
  }
  function initials(name) {
    var words = String(name || '').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) {
      return w && /^[A-Z0-9]/.test(w) && ['University', 'College', 'Of', 'The', 'And'].indexOf(w) === -1;
    });
    if (!words.length) words = String(name || '?').split(/\s+/);
    return words.slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  function firstName(name) { return String(name || '').split(/[\s@]/)[0]; }
  function schoolHref(name) { return '#/school/' + encodeURIComponent(name); }
  function role() { return state.data ? state.data.user.role : ''; }
  function isManager() { return role() === 'Manager'; }
  var TEAM_ROLES = ['Customer Success', 'Sales', 'Finance', 'On-Field'];
  function isTeam() { return TEAM_ROLES.indexOf(role()) !== -1; }
  function can(cap) {
    if (isManager()) return true;
    var caps = (state.data && state.data.caps) || [];
    return caps.indexOf(cap) !== -1;
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, ''); }

  /* ---------------------------------------------------------------- */
  /* Icons                                                            */
  /* ---------------------------------------------------------------- */

  var PATHS = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z',
    school: 'M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3',
    layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
    file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5zM14 3v5h5M9 13h6M9 17h6',
    cm: 'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M8 11h8M8 15h5',
    delivery: 'M2 6h12v10H2zM14 10h4l3 3v3h-7M6.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    collection: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
    logout: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
    chev: 'M9 6l6 6-6 6',
    ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    check: 'M5 12l5 5L20 7',
    alert: 'M12 3l10 18H2L12 3zM12 10v4M12 17.5v.5',
    spark: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',
    lock: 'M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3',
    plus: 'M12 5v14M5 12h14',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
    pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    x: 'M6 6l12 12M18 6L6 18',
    map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
    box: 'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
    key: 'M15 7a4 4 0 1 1-3.5 6L4 20.5 3.5 18 5 16.5 6.5 18 8 16.5 6.5 15l4.9-4.9A4 4 0 0 1 15 7zM16 8h.01',
    dir: 'M12 2l8 8-8 8-8-8 8-8zM9 11h4V9l3 3-3 3v-2H10v2'
  };
  function icon(name, size, stroke) {
    return '<svg class="i" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (stroke || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + PATHS[name] + '"></path></svg>';
  }
  function logo(size, light) {
    var s = size || 34;
    var bg = light ? '#FFFFFF' : '#054D80';
    var fg = light ? '#054D80' : '#FFFFFF';
    var line = ' fill="none" stroke="' + fg + '" stroke-linecap="round" stroke-linejoin="round"';
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 34 34" aria-hidden="true">' +
      '<rect width="34" height="34" rx="10" fill="' + bg + '"></rect>' +
      '<path d="M26.83 10.12A12 12 0 1 1 20.11 5.41"' + line + ' stroke-width="1.6"></path>' +
      '<circle cx="23.88" cy="7.17" r="2.2" fill="#80BC41"></circle>' +
      '<g transform="translate(17 16.4) scale(.82) translate(-17.25 -16.65)">' +
      '<path d="M14.7 11.2 9.6 18.7h6.6M14.7 11.2v10.9"' + line + ' stroke-width="2.56"></path>' +
      '<path d="M18.6 14.1a3 3 0 0 1 6 0c0 2.9-6 4.9-6 8h6.3"' + line + ' stroke-width="2.56"></path></g>' +
      '<path d="M11.4 24.3c1.9.8 3.8.8 5.6 0s3.8-.8 5.6 0" fill="none" stroke="#80BC41" stroke-width="1.9" stroke-linecap="round"></path></svg>';
  }


  function ring(score, size) {
    var sz = size || 44;
    var has = typeof score === 'number';
    var col = !has ? 'var(--track)' : score >= 80 ? 'var(--ring-good)' : score >= 50 ? 'var(--ring-warn)' : 'var(--ring-bad)';
    var dash = has ? (score / 100 * 100.5).toFixed(1) : 0;
    var fs = Math.round(sz * 0.29);
    return '<div class="ring" style="width:' + sz + 'px;height:' + sz + 'px" role="img" aria-label="Health score ' + (has ? score : 'unknown') + ' of 100">' +
      '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--track)" stroke-width="4"></circle>' +
      '<circle cx="20" cy="20" r="16" fill="none" stroke="' + col + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + dash + ' 101" transform="rotate(-90 20 20)"></circle></svg>' +
      '<span style="font-size:' + fs + 'px">' + (has ? score : '-') + '</span></div>';
  }

  /* ---------------------------------------------------------------- */
  /* Status helpers                                                   */
  /* ---------------------------------------------------------------- */

  var STOCK_CLASS = { Healthy: 'b-good', Low: 'b-warn', Critical: 'b-bad', Check: 'b-mute' };
  var STOCK_BAR = { Healthy: 'var(--ring-good)', Low: 'var(--ring-warn)', Critical: 'var(--ring-bad)', Check: 'var(--border-strong)' };
  var CONTRACT_CLASS = { 'Active': 'b-good', 'Renewing soon': 'b-warn', 'Pending': 'b-info', 'Expired': 'b-mute' };

  function contractBadge(c) {
    if (!c) return '<span class="badge b-mute">No contract on file</span>';
    var label = c.status === 'Renewing soon' ? 'Renews in ' + c.daysLeft + ' days' : c.status;
    return '<span class="badge ' + (CONTRACT_CLASS[c.status] || 'b-mute') + '">' + esc(label) + '</span>';
  }
  function contractNote(c) {
    if (!c) return '';
    if (c.status === 'Expired') return 'Ended ' + fmtDate(c.end, { month: 'short', year: 'numeric' });
    if (c.status === 'Pending') return 'Starts ' + fmtDate(c.start, { month: 'short', year: 'numeric' });
    return 'Ends ' + fmtDate(c.end, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function coverage(inStock, ordered) {
    if (inStock == null) return 0;
    if (!ordered) return 1;
    return Math.max(0, Math.min(inStock / ordered, 1));
  }
  function covBar(inStock, ordered, status, big) {
    var r = coverage(inStock, ordered);
    var w = r > 0 ? Math.max(r * 100, 3) : 0;
    return '<div class="track' + (big ? ' lg' : '') + '" aria-hidden="true"><div style="width:' + w.toFixed(0) + '%;background:' + (STOCK_BAR[status] || STOCK_BAR.Check) + '"></div></div>';
  }
  function reasonFor(s) {
    var bits = [];
    if (s.ordered != null && (s.stockStatus === 'Critical' || s.stockStatus === 'Low')) bits.push(fmtNum(s.inStock) + ' of ' + fmtNum(s.ordered) + ' ordered in stock');
    if (s.stockStatus === 'Check') bits.push('Stock count needs a check');
    if (s.contract && s.contract.status === 'Renewing soon') bits.push('Renewal in ' + s.contract.daysLeft + ' days');
    if (s.contract && s.contract.status === 'Expired') bits.push('Contract expired');
    if (!s.contract) bits.push('No contract on file');
    if (s.openTasks) bits.push(s.openTasks + ' open CM task' + (s.openTasks === 1 ? '' : 's'));
    return bits.slice(0, 2).join('. ') + (bits.length ? '.' : 'Looking good.');
  }

  /* ---------------------------------------------------------------- */
  /* Season mode                                                      */
  /* ---------------------------------------------------------------- */

  function season(d) {
    var m = d.getMonth();
    if (m === 7) return { label: 'Delivery season', title: 'Move-in deliveries are underway', body: 'Keep the Delivery Logs moving and watch stock coverage closely.', log: 'delivery' };
    if (m === 4) return { label: 'Spring collection', title: 'Spring collection is underway', body: 'This is the big pickup of the year. Keep the Collection Logs moving.', log: 'collection' };
    if (m === 11) return { label: 'Fall collection', title: 'Fall collection is underway', body: 'Fall rentals are being picked up. Keep the Collection Logs moving and lock in renewals.', log: 'collection' };
    if (m === 9 || m === 10) return { label: 'Off season', title: 'Off season, with fall collection ahead', body: 'Fall pickups start in December. Get Collection Logs ready, lock in renewals and restock before spring orders open.', log: 'collection' };
    if (m === 0) return { label: 'Off season', title: 'Spring term is starting', body: 'A quiet stretch: lock in renewals and restock before spring orders open.', log: 'cm' };
    if (m === 5 || m === 6) return { label: 'Pre-season', title: 'Get ready for move-in', body: 'Restock low schools and check contracts before deliveries start in August.', log: 'delivery' };
    if (m === 8) return { label: 'Fall term', title: 'Campuses are settled in', body: 'Stay on top of CM tasks while the fall term gets going.', log: 'cm' };
    return { label: 'Spring term', title: 'Keep campuses running smoothly', body: 'Stay on top of CM tasks and line up renewals before the spring collection in May.', log: 'cm' };
  }
  var LOG_NAMES = { cm: 'CM Log', delivery: 'Delivery Log', collection: 'Collection Log' };
  var LOG_FIELD = { cm: 'cmLogUrl', delivery: 'deliveryLogUrl', collection: 'collectionLogUrl' };

  function monthStrip(now) {
    var names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var off = [9, 10, 11, 0];
    var cells = names.map(function (n, i) {
      var dot = i === 7 ? '#80BC41' : (i === 4 || i === 11) ? '#F2B544' : 'transparent';
      var cls = 'month' + (off.indexOf(i) !== -1 ? ' off' : '') + (i === now.getMonth() ? ' now' : '');
      return '<div class="' + cls + '"><div class="bar"><i class="dot" style="background:' + dot + '"></i></div><span>' + n + '</span></div>';
    }).join('');
    return '<div class="months"><div class="month-row" role="img" aria-label="Season calendar, today is in ' + names[now.getMonth()] + '">' + cells + '</div>' +
      '<div class="legend"><span><i style="width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.28)"></i>Off season</span>' +
      '<span><i style="width:8px;height:8px;border-radius:50%;background:#80BC41"></i>Delivery</span>' +
      '<span><i style="width:8px;height:8px;border-radius:50%;background:#F2B544"></i>Collection</span>' +
      '<span><i style="width:10px;height:10px;border-radius:3px;border:2px solid #fff"></i>Today</span></div></div>';
  }

  /* ---------------------------------------------------------------- */
  /* Theme & toast                                                    */
  /* ---------------------------------------------------------------- */

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function toggleTheme() {
    var dark = !isDark();
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('pangia_theme', dark ? 'dark' : 'light'); } catch (e) { /* private mode */ }
    var btn = $('[data-action="theme"]');
    if (btn) { btn.innerHTML = icon(dark ? 'sun' : 'moon'); btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode'); }
    if (state.mapObj) setMapTiles();
  }
  function toast(msg, isErr) {
    var root = $('#toast-root');
    var el = document.createElement('div');
    el.className = 'toast' + (isErr ? ' err' : '');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () { el.remove(); }, isErr ? 6000 : 3200);
  }

  /* ---------------------------------------------------------------- */
  /* API & auth                                                       */
  /* ---------------------------------------------------------------- */

  function api(action, payload) {
    return fetch(CFG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: action, idToken: state.token, payload: payload || {} })
    }).then(function (res) {
      if (!res.ok) throw new Error('Pangia could not be reached. Please try again.');
      return res.json().catch(function () {
        throw new Error('Pangia got an unexpected reply. Check that the Apps Script is deployed with access set to "Anyone".');
      });
    }).then(function (json) {
      if (json.ok) return json.data;
      var err = new Error(json.message || 'Something went wrong.');
      err.code = json.error;
      err.email = json.email;
      if (json.error === 'auth_expired') sessionExpired();
      throw err;
    });
  }

  function tokenValid(t) {
    try {
      var p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return p.exp * 1000 > Date.now() + 60000;
    } catch (e) { return false; }
  }

  function waitForGsi(cb, tries) {
    if (window.google && google.accounts && google.accounts.id) return cb();
    if ((tries || 0) > 100) return;
    setTimeout(function () { waitForGsi(cb, (tries || 0) + 1); }, 100);
  }

  var gsiReady = false;
  function initGsi() {
    google.accounts.id.initialize({
      client_id: CFG.CLIENT_ID,
      callback: onCredential,
      auto_select: true,
      cancel_on_tap_outside: false,
      itp_support: true
    });
    gsiReady = true;
    if (!state.token) showGsiButton(true);
  }

  function showGsiButton(prompt) {
    if (!gsiReady) return;
    var holder = $('#gsi-btn');
    if (holder) {
      holder.innerHTML = '';
      google.accounts.id.renderButton(holder, { theme: isDark() ? 'filled_black' : 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 320 });
    }
    if (prompt) google.accounts.id.prompt();
  }

  function onCredential(resp) {
    if (!resp || !resp.credential) return;
    state.token = resp.credential;
    try { sessionStorage.setItem('pangia_token', resp.credential); } catch (e) { /* ignore */ }
    boot();
  }

  function sessionExpired() {
    state.token = null;
    try { sessionStorage.removeItem('pangia_token'); } catch (e) { /* ignore */ }
    renderSignIn('Your session timed out. Sign in again to keep going.');
  }

  function signOut() {
    state.token = null;
    state.data = null;
    state.schoolCache = {};
    try { sessionStorage.removeItem('pangia_token'); } catch (e) { /* ignore */ }
    if (gsiReady) google.accounts.id.disableAutoSelect();
    closePalette();
    renderSignIn();
  }

  /* ---------------------------------------------------------------- */
  /* Splash screen                                                    */
  /* ---------------------------------------------------------------- */

  var SPLASH_HTML = '<div class="splash" id="splash" role="status" aria-live="polite"><svg class="splash-mark" width="84" height="84" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#054D80"/><path class="sp-ring" pathLength="100" d="M26.83 10.12A12 12 0 1 1 20.11 5.41" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><g class="sp-digits" fill="none" stroke="#fff" stroke-width="2.56" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(17 16.4) scale(.82) translate(-17.25 -16.65)"><path d="M14.7 11.2 9.6 18.7h6.6M14.7 11.2v10.9"/><path d="M18.6 14.1a3 3 0 0 1 6 0c0 2.9-6 4.9-6 8h6.3"/></g></g><path class="sp-wave" pathLength="100" d="M11.4 24.3c1.9.8 3.8.8 5.6 0s3.8-.8 5.6 0" fill="none" stroke="#80BC41" stroke-width="1.9" stroke-linecap="round"/><g class="sp-orbit"><circle cx="23.88" cy="7.17" r="2.2" fill="#80BC41"/></g></svg><div class="splash-name"><b>Pangia</b><small>by College Products</small></div><div class="splash-bar" aria-hidden="true"><i></i></div><div class="splash-msg" id="splash-msg">Waking up Pangia</div></div>';
  var SPLASH_MSGS = ['Waking up Pangia', 'Loading your schools', 'Checking stock and contracts', 'Finding the answer to everything'];
  var splashShownAt = Date.now();
  var splashTimer = null;

  function showSplash() {
    var el = $('#splash');
    if (!el) {
      document.body.insertAdjacentHTML('beforeend', SPLASH_HTML);
      el = $('#splash');
      splashShownAt = Date.now();
    }
    el.classList.remove('out');
    var i = 0;
    clearInterval(splashTimer);
    splashTimer = setInterval(function () {
      var msg = $('#splash-msg');
      if (!msg) return clearInterval(splashTimer);
      i = Math.min(i + 1, SPLASH_MSGS.length - 1);
      msg.classList.add('swap');
      setTimeout(function () { msg.textContent = SPLASH_MSGS[i]; msg.classList.remove('swap'); }, 180);
      if (i === SPLASH_MSGS.length - 1) clearInterval(splashTimer);
    }, 1400);
  }

  function hideSplash() {
    var el = $('#splash');
    if (!el || el.classList.contains('out')) return;
    var wait = Math.max(0, 1100 - (Date.now() - splashShownAt));
    setTimeout(function () {
      clearInterval(splashTimer);
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
    }, wait);
  }

  function boot() {
    showSplash();
    api('bootstrap').then(function (data) {
      state.data = data;
      state.schoolCache = {};
      renderRoute();
    }).catch(function (err) {
      if (err.code === 'not_authorized') renderNoAccess(err.email);
      else if (err.code !== 'auth_expired') renderError(err.message);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Full-screen states                                               */
  /* ---------------------------------------------------------------- */

  function renderSignIn(note) {
    $('#app').innerHTML =
      '<div class="signin">' +
      '<section class="left" aria-label="About Pangia">' +
      '<div class="row" style="gap:12px">' + logo(40, true) + '<span style="font-family:var(--display);font-weight:800;font-size:24px">Pangia</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:20px;max-width:520px">' +
      '<span class="season-tag">College Products · internal</span>' +
      '<h1>One for all.</h1>' +
      '<p>Fewer "hey, do you have that sheet?" messages.</p></div>' +
      '<div class="roles"><span><i></i>Managers</span><span><i></i>Campus Managers</span><span><i></i>School Admins</span></div>' +
      '</section>' +
      '<section class="right" aria-label="Sign in"><div class="signcard">' +
      '<div style="display:flex;flex-direction:column;gap:8px"><h2>Sign in to Pangia</h2>' +
      '<p class="sub">Use the Google account College Products has on file for you. We\'ll open the right view for your role.</p></div>' +
      (note ? '<div class="badge b-warn" style="white-space:normal;justify-content:center">' + esc(note) + '</div>' : '') +
      '<div id="gsi-btn"><span class="small muted">Loading Google Sign-In...</span></div>' +
      '<div class="note">' + icon('lock') + '<span>You\'ll only see the schools assigned to you. School Admins can update their school\'s registered information.</span></div>' +
      '</div></section></div>';
    showGsiButton(true);
    hideSplash();
  }

  function renderLoading() {
    $('#app').innerHTML = '<div class="shell"><aside class="side"><a class="brand" href="#/">' + logo() + '<span><b>Pangia</b><small>by College Products</small></span></a>' +
      '<div class="skel" style="height:260px"></div></aside><div class="main"><div class="view">' +
      '<div class="skel" style="height:60px;max-width:420px"></div><div class="skel" style="height:190px"></div>' +
      '<div class="kpis"><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div></div>' +
      '<div class="skel" style="height:320px"></div></div></div></div>';
  }

  function renderNoAccess(email) {
    $('#app').innerHTML = '<div class="center"><div class="statecard">' + logo(48) +
      '<h1 class="h1">You don\'t have access yet</h1>' +
      '<p class="sub">This Google account isn\'t set up in Pangia. Ask your College Products contact to add it.</p>' +
      (email ? '<code>' + esc(email) + '</code>' : '') +
      '<button type="button" class="btn" data-action="signout">' + icon('logout') + 'Use a different account</button></div></div>';
    hideSplash();
  }

  function renderError(msg) {
    $('#app').innerHTML = '<div class="center"><div class="statecard">' + logo(48) +
      '<h1 class="h1">Pangia couldn\'t load</h1><p class="sub">' + esc(msg) + '</p>' +
      '<div class="row" style="justify-content:center"><button type="button" class="btn primary" data-action="retry">Try again</button>' +
      '<button type="button" class="btn" data-action="signout">Sign out</button></div></div></div>';
    hideSplash();
  }

  function renderSetupNeeded() {
    $('#app').innerHTML = '<div class="center"><div class="statecard">' + logo(48) +
      '<h1 class="h1">Almost ready</h1><p class="sub">Add the Apps Script web app URL to <b>config.js</b> to connect Pangia.</p></div></div>';
    hideSplash();
  }

  /* ---------------------------------------------------------------- */
  /* Shell                                                            */
  /* ---------------------------------------------------------------- */

  function navLink(href, ico, label, active, extra) {
    return '<a href="' + href + '"' + (active ? ' class="active" aria-current="page"' : '') + '>' + icon(ico) + '<span class="grow">' + esc(label) + '</span>' + (extra || '') + '</a>';
  }
  function extLink(url, ico, label) {
    var u = safeUrl(url);
    if (!u) return '<a href="#" aria-disabled="true" style="opacity:.5" data-action="no-log">' + icon(ico) + '<span class="grow">' + esc(label) + '</span></a>';
    return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + icon(ico) + '<span class="grow">' + esc(label) + '</span>' + icon('ext', 14) + '</a>';
  }

  function renderShell(route, inner) {
    var d = state.data;
    var u = d.user;
    var r = route.name;
    var nav = '';
    var invLink = d.inventoryDashboardUrl ? '<a href="' + esc(safeUrl(d.inventoryDashboardUrl)) + '" target="_blank" rel="noopener">' + icon('layers') + '<span class="grow">Inventory</span>' + icon('ext', 14) + '</a>' : '';
    var logNav = '<span class="nav-label">Logs</span>' +
      navLink('#/logs/cm', 'cm', 'CM Logs', route.type === 'cm', u.role === 'Campus Manager' && d.schools.reduce(function (a, s) { return a + (s.openTasks || 0); }, 0) ? '<span class="count">' + d.schools.reduce(function (a, s) { return a + (s.openTasks || 0); }, 0) + '</span>' : '') +
      navLink('#/logs/delivery', 'delivery', 'Delivery Logs', route.type === 'delivery') +
      navLink('#/logs/collection', 'collection', 'Collection Logs', route.type === 'collection');
    if (u.role === 'Manager' || isTeam()) {
      var renewCount = d.schools.filter(function (s) { return s.contract && s.contract.status === 'Renewing soon'; }).length;
      var reviewCount = can('contacts.review') ? (d.contacts || []).filter(function (ct) { return ct.review && ct.status === 'Active'; }).length : 0;
      nav = navLink('#/', 'home', 'Home', r === 'home') +
        '<span class="nav-label">Directory</span>' +
        navLink('#/schools', 'school', 'Schools', r === 'schools' || r === 'school') +
        (can('contacts') ? navLink('#/contacts', 'users', 'Contacts', r === 'contacts', reviewCount ? '<span class="count">' + reviewCount + '</span>' : '') : '') +
        (can('contract.docs') ? navLink('#/contracts', 'file', 'Contracts', r === 'contracts', renewCount ? '<span class="count">' + renewCount + '</span>' : '') : '') +
        (can('map') ? navLink('#/map', 'map', 'Map', r === 'map') : '') +
        invLink +
        (can('logs') ? logNav : '');
    } else if (u.role === 'Campus Manager') {
      nav = navLink('#/', 'school', 'My schools', r === 'home' || r === 'school') +
        (can('contacts') ? navLink('#/contacts', 'users', 'Contacts', r === 'contacts') : '') +
        (can('map') ? navLink('#/map', 'map', 'Map', r === 'map') : '') +
        logNav;
    } else {
      var s0 = d.schools[0] || {};
      nav = navLink('#/', 'pencil', 'My school', r === 'home') +
        '<span class="nav-label">Logs</span>' +
        extLink(s0.cmLogUrl, 'cm', 'CM Log') + extLink(s0.deliveryLogUrl, 'delivery', 'Delivery Log') + extLink(s0.collectionLogUrl, 'collection', 'Collection Log');
    }

    var pic = safeUrl(u.picture);
    var scopeNote = u.role === 'Manager' ? 'Manager' : u.role + (d.schools.length > 1 ? ' · ' + d.schools.length + ' schools' : '');
    var dark = isDark();

    $('#app').innerHTML =
      '<div class="shell">' +
      '<aside class="side"><a class="brand" href="#/">' + logo() + '<span><b>Pangia</b><small>by College Products</small></span></a>' +
      '<nav class="nav" aria-label="Main">' + nav + '</nav>' +
      '<div class="me"><div class="avatar">' + (pic ? '<img src="' + esc(pic) + '" alt="" referrerpolicy="no-referrer">' : esc(initials(u.name))) + '</div>' +
      '<div class="who"><b>' + esc(u.name) + '</b><span>' + esc(scopeNote) + '</span></div>' +
      '<button type="button" class="iconbtn" style="width:36px;height:36px;border:0" data-action="signout" aria-label="Sign out">' + icon('logout', 16) + '</button></div>' +
      '</aside>' +
      '<div class="main">' +
      '<div class="topbar">' +
      '<button type="button" class="searchbtn" data-action="palette">' + icon('search') + '<span>Search schools, people, products, logs</span><kbd>Ctrl K</kbd></button>' +
      '<div class="top-actions">' +
      (u.role === 'Manager' ? '<button type="button" class="iconbtn" data-action="refresh" aria-label="Refresh the directory" title="Refresh the directory">' + icon('refresh') + '</button>' : '') +
      '<button type="button" class="iconbtn" data-action="theme" aria-label="' + (dark ? 'Switch to light mode' : 'Switch to dark mode') + '">' + icon(dark ? 'sun' : 'moon') + '</button>' +
      '</div></div>' +
      '<main class="view" id="view">' + inner + '</main>' +
      '</div></div>';
  }

  /* ---------------------------------------------------------------- */
  /* Router                                                           */
  /* ---------------------------------------------------------------- */

  function parseRoute() {
    var h = location.hash.replace(/^#\/?/, '');
    var qIndex = h.indexOf('?');
    var query = {};
    if (qIndex !== -1) {
      h.slice(qIndex + 1).split('&').forEach(function (kv) {
        var p = kv.split('=');
        if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
      h = h.slice(0, qIndex);
    }
    var parts = h.split('/');
    if (parts[0] === 'school' && parts[1]) return { name: 'school', school: decodeURIComponent(parts.slice(1).join('/')), query: query };
    if (parts[0] === 'logs' && LOG_NAMES[parts[1]]) return { name: 'logs', type: parts[1], query: query };
    if (parts[0] === 'schools' && can('directory')) return { name: 'schools', query: query };
    if (parts[0] === 'contracts' && can('contract.docs')) return { name: 'contracts', query: query };
    if (parts[0] === 'contacts' && can('contacts')) return { name: 'contacts', query: query };
    if (parts[0] === 'map' && can('map')) return { name: 'map', query: query };
    return { name: 'home', query: query };
  }

  function renderRoute() {
    if (!state.data) return;
    closePalette();
    closeModal();
    destroyMap();
    var route = parseRoute();
    var r = role();
    var html;
    if (route.name === 'school' && r !== 'School Admin') html = viewSchoolShell(route.school);
    else if (route.name === 'schools') html = viewSchools();
    else if (route.name === 'contracts') html = viewContracts(route.query.school);
    else if (route.name === 'contacts') {
      if (route.query.school != null) { state.contactSchool = route.query.school; state.contactFilter = 'all'; }
      if (route.query.filter) state.contactFilter = route.query.filter;
      html = viewContacts();
    }
    else if (route.name === 'logs' && can('logs')) html = viewLogs(route.type);
    else if (route.name === 'map') html = viewMap(route.query);
    else if (r === 'Manager') html = viewManagerHome();
    else if (isTeam()) html = viewTeamHome();
    else if (r === 'Campus Manager') html = viewCampusHome();
    else html = viewAdminHome();
    renderShell(route, html);
    hideSplash();
    window.scrollTo(0, 0);
    if (route.name === 'school' && r !== 'School Admin') loadSchool(route.school);
    if (route.name === 'map') initMap(route.query);
  }

  /* ---------------------------------------------------------------- */
  /* Shared view pieces                                               */
  /* ---------------------------------------------------------------- */

  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }
  function today() { return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }

  function activityList(items, withSchool) {
    if (!items || !items.length) return '<div class="empty">No activity yet. Contract changes, renewal reminders and registered info updates show up here.</div>';
    return items.map(function (a) {
      return '<div class="act"><span class="tag">' + esc(a.tag || 'P') + '</span><div class="t">' +
        '<span>' + (withSchool && a.school ? '<b style="font-weight:600">' + esc(a.school) + '</b> <span class="muted">· ' + esc(a.text) + '</span>' : esc(a.text)) + '</span>' +
        '<small>' + esc(a.actor) + ' · ' + esc(relTime(a.at)) + '</small></div></div>';
    }).join('');
  }

  function logTiles(s, withNotes) {
    return '<div class="tiles">' + ['cm', 'delivery', 'collection'].map(function (t) {
      var u = safeUrl(s[LOG_FIELD[t]]);
      var note = t === 'cm' && s.openTasks != null ? (s.openTasks ? s.openTasks + ' open task' + (s.openTasks === 1 ? '' : 's') : 'No open tasks') : (u ? 'Open in Google Sheets' : t === 'cm' && s.contractOnly ? 'No CM Log for this school' : 'Not connected yet');
      var inner = '<div class="row" style="justify-content:space-between"><span class="ic">' + icon(t, 20) + '</span>' + (u ? icon('ext', 16) : '') + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:4px"><b>' + LOG_NAMES[t] + '</b>' + (withNotes !== false ? '<small>' + esc(note) + '</small>' : '') + '</div>';
      return u ? '<a class="tile" href="' + esc(u) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<div class="tile off">' + inner + '</div>';
    }).join('') + '</div>';
  }

  function seasonHero(isCompact) {
    var s = season(new Date());
    var action = '<a class="btn light" href="#/logs/' + s.log + '">Open ' + LOG_NAMES[s.log] + 's</a>';
    if (isCompact) {
      return '<section class="banner" aria-labelledby="season-h"><span class="ic">' + icon(s.log, 22, 2) + '</span>' +
        '<div class="copy"><small>Season mode · ' + esc(s.label) + '</small><h2 id="season-h">' + esc(s.title) + '</h2><p>' + esc(s.body) + '</p></div>' +
        '<a class="btn" href="#/logs/' + s.log + '">Open ' + LOG_NAMES[s.log] + 's</a></section>';
    }
    var renew = state.data.schools.filter(function (x) { return x.contract && x.contract.status === 'Renewing soon'; }).length;
    return '<section class="hero" aria-labelledby="season-h"><div class="copy">' +
      '<span class="season-tag">' + icon('spark', 14, 2.2) + 'Season mode · ' + esc(s.label) + '</span>' +
      '<h2 id="season-h">' + esc(s.title) + '</h2><p>' + esc(s.body) + '</p>' +
      '<div class="row" style="margin-top:4px">' + action + (isManager() && renew ? '<a class="btn ghost" href="#/contracts">Review ' + renew + ' renewal' + (renew === 1 ? '' : 's') + '</a>' : '') + '</div></div>' +
      monthStrip(new Date()) + '</section>';
  }

  /* ---------------------------------------------------------------- */
  /* Manager home                                                     */
  /* ---------------------------------------------------------------- */

  function viewManagerHome() {
    var d = state.data;
    var schools = d.schools;
    var scored = schools.filter(function (s) { return s.health; });
    var avg = scored.length ? Math.round(scored.reduce(function (a, s) { return a + s.health.score; }, 0) / scored.length) : null;
    var renewals = schools.filter(function (s) { return s.contract && s.contract.status === 'Renewing soon'; })
      .sort(function (a, b) { return a.contract.daysLeft - b.contract.daysLeft; });
    var critical = schools.filter(function (s) { return s.stockStatus === 'Critical'; }).length;
    var noContract = schools.filter(function (s) { return !s.contract; }).length;
    var attention = scored.slice().sort(function (a, b) { return a.health.score - b.health.score; }).slice(0, 5);

    var kpis = [
      { label: 'Partner schools', value: schools.length, note: noContract ? noContract + ' without a contract on file' : 'All contracts on file', cls: noContract ? 'b-mute' : 'b-good' },
      { label: 'Average health score', value: avg == null ? '-' : avg, note: avg == null ? 'No data yet' : avg >= 80 ? 'Healthy' : avg >= 50 ? 'Some schools need attention' : 'Needs attention', cls: avg == null ? 'b-mute' : avg >= 80 ? 'b-good' : avg >= 50 ? 'b-warn' : 'b-bad' },
      { label: 'Renewals in 90 days', value: renewals.length, note: renewals.length ? 'Next in ' + renewals[0].contract.daysLeft + ' days' : 'Nothing due', cls: renewals.length ? 'b-warn' : 'b-good' },
      { label: 'Critical stock', value: critical, note: critical ? 'Schools to restock' : 'No critical schools', cls: critical ? 'b-bad' : 'b-good' }
    ];

    return '<header class="pagehead"><div class="titles"><span class="eyebrow">' + esc(today()) + '</span>' +
      '<h1 class="h1">' + greeting() + ', ' + esc(firstName(d.user.name)) + '</h1></div>' +
      '<span class="small muted">Directory refreshed ' + esc(relTime(d.builtAt)) + '</span></header>' +
      seasonHero(false) +
      '<section class="kpis" aria-label="Summary">' + kpis.map(function (k) {
        return '<div class="kpi"><span class="label">' + esc(k.label) + '</span><span class="value">' + esc(k.value) + '</span><span class="badge ' + k.cls + '" style="align-self:flex-start">' + esc(k.note) + '</span></div>';
      }).join('') + '</section>' +
      '<div class="grid-2">' +
      '<section class="card" aria-labelledby="att-h"><div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="att-h">Schools needing attention</h2><span class="hint">Lowest health scores first</span></div><a href="#/schools">See all</a></div>' +
      (attention.length ? attention.map(function (s) {
        return '<a class="rowlink" href="' + schoolHref(s.name) + '">' + ring(s.health.score) + '<span class="t"><b>' + esc(s.name) + '</b><span>' + esc(reasonFor(s)) + '</span></span>' + icon('chev', 16) + '</a>';
      }).join('') : '<div class="empty">No schools found yet.</div>') + '</section>' +
      '<div class="stack">' +
      '<section class="card" aria-labelledby="ren-h"><div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="ren-h">Renewals, next 90 days</h2><span class="hint">Reminders go out 60 and 30 days before the end date</span></div></div>' +
      (renewals.length ? renewals.slice(0, 4).map(function (s) {
        var end = toDate(s.contract.end);
        var dl = s.contract.daysLeft;
        var r60 = new Date(end.getTime() - 60 * 86400000);
        var r30 = new Date(end.getTime() - 30 * 86400000);
        var note = dl <= 30 ? '30-day reminder sent' : dl <= 60 ? '60-day reminder sent, next on ' + fmtDate(r30.toISOString(), { month: 'short', day: 'numeric' }) : '60-day reminder goes out ' + fmtDate(r60.toISOString(), { month: 'short', day: 'numeric' });
        return '<a class="renewal" href="' + schoolHref(s.name) + '"><span class="cal"><small>' + esc(fmtDate(s.contract.end, { month: 'short' })) + '</small><b>' + end.getDate() + '</b></span>' +
          '<span class="t" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><b style="font-size:14px">' + esc(s.name) + '</b><span class="small muted">' + esc(note) + '</span></span>' +
          '<span class="badge ' + (dl <= 30 ? 'b-bad' : 'b-warn') + '">' + dl + ' days</span></a>';
      }).join('') : '<div class="empty">No contracts end in the next 90 days.</div>') + '</section>' +
      '<section class="card" aria-labelledby="act-h" style="gap:4px"><div class="card-head" style="margin-bottom:10px"><h2 id="act-h">Activity</h2><span class="live"><i></i>Live</span></div>' +
      activityList(d.activity, true) + '</section>' +
      '</div></div>';
  }

  /* ---------------------------------------------------------------- */
  /* Schools directory (Manager)                                      */
  /* ---------------------------------------------------------------- */

  var FILTERS = [
    { key: 'all', label: 'All schools', test: function () { return true; } },
    { key: 'attention', label: 'Needs attention', test: function (s) { return s.health && s.health.score < 50; } },
    { key: 'renewing', label: 'Renewing soon', test: function (s) { return s.contract && s.contract.status === 'Renewing soon'; } },
    { key: 'critical', label: 'Critical stock', test: function (s) { return s.stockStatus === 'Critical'; } },
    { key: 'nocontract', label: 'No contract', test: function (s) { return !s.contract; } },
    { key: 'lease', label: 'Leases', test: function (s) { return s.contract && s.contract.type === 'Lease'; } },
    { key: 'confirm', label: 'To confirm', test: function (s) { return s.contract && /blank|not signed|no start/i.test(s.contract.note || ''); } }
  ];

  function filteredSchools() {
    var f = FILTERS.filter(function (x) { return x.key === state.filter; })[0] || FILTERS[0];
    var q = state.search.trim().toLowerCase();
    return state.data.schools.filter(function (s) {
      if (!f.test(s)) return false;
      if (!q) return true;
      return (s.name + ' ' + s.products.map(function (p) { return p.label; }).join(' ')).toLowerCase().indexOf(q) !== -1;
    });
  }

  function schoolRows() {
    var list = filteredSchools();
    if (!list.length) return '<tr><td colspan="7"><div class="empty">No schools match.</div></td></tr>';
    return list.map(function (s) {
      var prods = s.products.length ? s.products.map(function (p) { return '<span class="chip">' + esc(p.label) + '</span>'; }).join('') : '<span class="small muted">Not in inventory</span>';
      var cov = s.ordered != null ?
        '<div class="cov"><div class="top"><span><strong>' + fmtNum(s.inStock) + '</strong> <span class="muted">/ ' + fmtNum(s.ordered) + ' ordered</span></span>' +
        (s.stockStatus ? '<span class="badge ' + STOCK_CLASS[s.stockStatus] + '" style="padding:2px 8px;font-size:11px">' + esc(s.stockStatus) + '</span>' : '') + '</div>' +
        covBar(s.inStock, s.ordered, s.stockStatus) + '</div>' : '<span class="small muted">No stock data</span>';
      var logs = '<div class="logicons">' + ['cm', 'delivery', 'collection'].map(function (t) {
        var u = safeUrl(s[LOG_FIELD[t]]);
        return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener" aria-label="' + LOG_NAMES[t] + ' for ' + esc(s.name) + '" title="' + LOG_NAMES[t] + '">' + icon(t) + '</a>' :
          '<span title="' + LOG_NAMES[t] + ' not connected" aria-label="' + LOG_NAMES[t] + ' not connected">' + icon(t) + '</span>';
      }).join('') + '</div>';
      return '<tr><td><div class="namecell">' + ring(s.health ? s.health.score : null, 42) + '<div style="display:flex;flex-direction:column;gap:2px"><a href="' + schoolHref(s.name) + '">' + esc(s.name) + '</a><span class="small muted">Health ' + (s.health ? s.health.score : '-') + ' of 100</span></div></div></td>' +
        '<td><div class="chips">' + prods + '</div></td><td>' + cov + '</td>' +
        '<td><div style="display:flex;flex-direction:column;gap:4px;align-items:flex-start">' + contractBadge(s.contract) + '<span class="small muted">' + esc(contractNote(s.contract)) + '</span></div></td>' +
        '<td style="font-weight:600">' + (s.openTasks == null ? '<span class="small muted" style="font-weight:400">No CM Log</span>' : s.openTasks) + '</td><td>' + logs + '</td>' +
        '<td style="text-align:right"><a class="iconbtn" style="border:0;width:36px;height:36px" href="' + schoolHref(s.name) + '" aria-label="Open ' + esc(s.name) + '">' + icon('chev') + '</a></td></tr>';
    }).join('');
  }

  function viewSchools() {
    var d = state.data;
    var pills = FILTERS.map(function (f) {
      var n = d.schools.filter(f.test).length;
      return '<button type="button" class="pill" data-filter="' + f.key + '" aria-pressed="' + (state.filter === f.key) + '">' + esc(f.label) + ' · ' + n + '</button>';
    }).join('');
    return '<header class="pagehead"><div class="titles"><h1 class="h1">Schools</h1><p class="sub">Health, stock coverage and contract status for every partner school.</p></div>' +
      '<div class="field" style="width:280px;max-width:100%"><label for="school-search" class="sr-only">Filter schools</label>' +
      '<input id="school-search" type="search" placeholder="Filter by school or product" value="' + esc(state.search) + '" autocomplete="off"></div></header>' +
      '<div class="row" role="group" aria-label="Quick filters">' + pills + '</div>' +
      '<section class="tablecard" aria-label="School directory"><div class="scroll"><table>' +
      '<thead><tr><th scope="col">School</th><th scope="col">Products</th><th scope="col">Stock coverage</th><th scope="col">Contract</th><th scope="col">Open CM tasks</th><th scope="col">Logs</th><th scope="col"><span class="sr-only">Open</span></th></tr></thead>' +
      '<tbody id="school-rows">' + schoolRows() + '</tbody></table></div>' +
      '<div class="tfoot"><span>Health score = contract (40) + stock coverage (40) + open CM tasks (20)</span><span>Refreshed ' + esc(relTime(d.builtAt)) + '</span></div></section>';
  }

  /* ---------------------------------------------------------------- */
  /* School detail (Manager, Campus Manager)                          */
  /* ---------------------------------------------------------------- */

  function viewSchoolShell(name) {
    var s = state.data.schools.filter(function (x) { return x.name === name; })[0];
    if (!s) return '<div class="empty">That school was not found, or it isn\'t assigned to you. <a href="#/">Go home</a></div>';
    var back = can('directory') ? '<a href="#/schools">Schools</a>' : '<a href="#/">My schools</a>';
    var pin = can('map') && (state.data.locations || []).some(function (l) { return norm(l.school) === norm(s.name); });
    var chips = contractBadge(s.contract) + (s.contract && s.contract.type ? '<span class="badge b-mute">' + esc(s.contract.type) + '</span>' : '') +
      (s.contractOnly ? '<span class="badge b-mute">No CM Log</span>' : '') +
      s.products.map(function (p) { return '<span class="badge b-info">' + esc(p.label) + '</span>'; }).join('');
    var cm = safeUrl(s.cmLogUrl);
    return '<nav class="crumbs" aria-label="Breadcrumb">' + back + icon('chev', 14, 2) + '<span aria-current="page" style="color:var(--ink);font-weight:500">' + esc(s.name) + '</span></nav>' +
      '<header class="schoolhead"><div class="who"><div class="bigmark" aria-hidden="true">' + esc(initials(s.name)) + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><h1 class="h1">' + esc(s.name) + '</h1><div class="row" style="gap:8px">' + chips + '</div></div></div>' +
      '<div class="row"><button type="button" class="btn" data-action="copy-link">' + icon('link', 16, 2) + 'Copy link</button>' +
      (pin ? '<a class="btn" href="#/map?school=' + encodeURIComponent(s.name) + '">' + icon('map', 16, 2) + 'Show on map</a>' : '') +
      (isManager() ? '<a class="btn" href="#/contracts?school=' + encodeURIComponent(s.name) + '">' + icon('plus', 16, 2) + 'Add contract</a>' : '') +
      (cm ? '<a class="btn primary" href="' + esc(cm) + '" target="_blank" rel="noopener">Open CM Log' + icon('ext', 16, 2) + '</a>' : '') + '</div></header>' +
      '<div id="school-body"><div class="grid"><div class="skel" style="height:240px"></div><div class="skel" style="height:240px"></div><div class="skel" style="height:240px"></div></div></div>';
  }

  function loadSchool(name) {
    var cached = state.schoolCache[name];
    if (cached) { paintSchool(name, cached); }
    api('school', { name: name }).then(function (res) {
      state.schoolCache[name] = res;
      paintSchool(name, res);
    }).catch(function (err) {
      if (err.code === 'auth_expired') return;
      var body = $('#school-body');
      if (body && !cached) body.innerHTML = '<div class="empty">' + esc(err.message) + '</div>';
    });
  }

  function paintSchool(name, res) {
    var route = parseRoute();
    if (route.name !== 'school' || route.school !== name) return;
    var body = $('#school-body');
    if (!body) return;
    var s = res.school;
    var mgr = isManager();
    var dates = can('contract.dates');
    var docs = can('contract.docs');
    var h = s.health || { score: null, contract: 0, stock: 0, tasks: 0 };

    var health = '<section class="card" aria-labelledby="h-h"><h2 id="h-h">Health score</h2><div class="row" style="gap:20px;flex-wrap:nowrap">' + ring(h.score, 112) +
      '<div class="parts">' + [['Contract', h.contract, 40], ['Stock coverage', h.stock, 40], ['CM tasks', h.tasks, 20]].map(function (p) {
        var r = p[1] / p[2];
        var col = r >= 0.8 ? 'var(--ring-good)' : r >= 0.5 ? 'var(--ring-warn)' : 'var(--ring-bad)';
        return '<div class="part"><div class="top"><span style="font-weight:600">' + p[0] + '</span><span class="muted">' + p[1] + ' / ' + p[2] + '</span></div><div class="track"><div style="width:' + Math.round(r * 100) + '%;background:' + col + '"></div></div></div>';
      }).join('') + '</div></div><p class="small muted" style="margin:0">' + esc(biggestLift(h)) + '</p></section>';

    var c = s.contract;
    var contract;
    if (!c) {
      contract = '<section class="card"><div class="card-head"><h2>Contract</h2>' + contractBadge(null) + '</div><div class="empty">No contract on file yet.</div>' +
        (mgr ? '<a class="btn" href="#/contracts?school=' + encodeURIComponent(s.name) + '">' + icon('plus', 16, 2) + 'Add contract</a>' : '') + '</section>';
    } else {
      var start = toDate(c.start), end = toDate(c.end);
      var pct = start && end ? Math.max(0, Math.min(1, (Date.now() - start) / (end - start))) : 0;
      var r60 = end ? new Date(end.getTime() - 60 * 86400000) : null;
      var r30 = end ? new Date(end.getTime() - 30 * 86400000) : null;
      var step = function (done, label, when) {
        return '<div>' + (done ? '<span class="dotdone">' + icon('check', 12, 3) + '</span>' : '<span class="dotnext"></span>') + '<span class="grow">' + label + '</span><span class="muted">' + esc(when) + '</span></div>';
      };
      var live = c.status === 'Active' || c.status === 'Renewing soon';
      contract = '<section class="card"><div class="card-head"><h2>Contract</h2>' + contractBadge(c) + '</div>' +
        (dates ? '<div class="dates"><div><span class="muted">Start</span><b>' + esc(fmtDate(c.start)) + '</b></div><div style="text-align:right"><span class="muted">End</span><b>' + esc(fmtDate(c.end)) + '</b></div></div>' +
          '<div class="track lg"><div style="width:' + Math.round(pct * 100) + '%;background:var(--accent)"></div></div>' : '<div class="dates"><div><span class="muted">Ends</span><b>' + esc(fmtDate(c.end)) + '</b></div></div>') +
        (live && r60 ? '<div class="steps">' + step(c.daysLeft <= 60, '60-day reminder', fmtDate(r60.toISOString(), { month: 'short', day: 'numeric' })) + step(c.daysLeft <= 30, '30-day reminder', fmtDate(r30.toISOString(), { month: 'short', day: 'numeric' })) + '</div>' : '') +
        (docs && c.note && /blank|not signed|no start/i.test(c.note) ? '<div class="badge b-warn" style="white-space:normal;align-self:flex-start">' + icon('alert', 14, 2) + 'Confirm: ' + esc(c.note.split('.')[0]) + '</div>' : '') +
        (docs && safeUrl(c.pdf) ? '<a class="rowlink" style="margin:0;border:1px solid var(--border)" href="' + esc(safeUrl(c.pdf)) + '" target="_blank" rel="noopener">' + icon('file') + '<span class="t"><b style="font-size:14px">Signed contract</b></span><span class="small" style="color:var(--link);font-weight:600">View</span></a>' : '') +
        '</section>';
    }

    var stock = '<section class="card"><div class="card-head"><h2>Stock coverage</h2>' + (mgr && state.data.inventoryDashboardUrl ? '<a href="' + esc(safeUrl(state.data.inventoryDashboardUrl)) + '" target="_blank" rel="noopener">Inventory dashboard</a>' : '') + '</div>' +
      (s.products.length ? s.products.map(function (p) {
        var cov = p.ordered ? Math.round(coverage(p.inStock, p.ordered) * 100) + '% coverage' : '';
        return '<div style="display:flex;flex-direction:column;gap:8px"><div class="card-head"><span style="font-size:15px;font-weight:600">' + esc(p.label) + '</span><span class="badge ' + (STOCK_CLASS[p.status] || 'b-mute') + '">' + esc(p.status === 'Check' ? 'Needs a check' : p.status) + '</span></div>' +
          covBar(p.inStock, p.ordered, p.status, true) +
          '<span class="small muted">' + (p.inStock == null ? 'Stock count missing' : '<strong style="color:var(--ink)">' + fmtNum(p.inStock) + '</strong> in stock for ' + fmtNum(p.ordered) + ' ordered' + (cov ? ' · ' + cov : '')) + '</span></div>';
      }).join('') : '<div class="empty">This school isn\'t in the inventory sheet yet.</div>') + '</section>';

    var logs = '<section class="card span-all"><h2>Logs</h2>' + logTiles(s) + '</section>';

    var people = mgr ? '<section class="card"><div class="card-head"><h2>People with access</h2></div>' +
      ((res.people && res.people.length) ? res.people.map(function (p) {
        return '<div class="person"><div class="avatar">' + esc(initials(p.name)) + '</div><div class="t"><b>' + esc(p.name) + '</b><span>' + esc(p.email) + '</span></div><span class="badge ' + (p.role === 'School Admin' ? 'b-good' : 'b-info') + '">' + esc(p.role) + '</span></div>';
      }).join('') : '<div class="empty">No Campus Manager or School Admin is assigned yet. Add them in the Users &amp; Roles sheet.</div>') + '</section>' : '';

    var activity = '<section class="card" style="gap:4px"><h2 style="margin-bottom:10px">Recent activity</h2>' + activityList(res.activity, false) + '</section>';

    var reg = '<section class="card"><div class="card-head"><h2>Registered info</h2>' + (res.registered && res.registered.updatedAt ? '<span class="hint">Updated ' + esc(relTime(res.registered.updatedAt)) + '</span>' : '') + '</div>' +
      regFacts(res.registered) + '</section>';

    var editor = mgr ? '<section class="card span-all"><div class="card-head"><h2>Edit registered info</h2><span class="hint">School Admins can edit this too</span></div>' + regForm(s.name, res.registered, true) + '</section>' +
      '<section class="card span-all" style="gap:6px"><div class="card-head" style="margin-bottom:8px"><h2>Change history</h2><span class="hint">Every save is kept</span></div><div id="history">' + historyList(res.history) + '</div></section>' : '';

    var contractsCard = docs ? contractRecords(s.name, res, mgr) : '';
    body.innerHTML = '<div class="grid">' + (s.health ? health : '') + contract + stock + contactsCard(s.name, res.contacts || [], res.contactHistory) + storageCard(s.name, res.storage, res.storageHistory) + contractsCard + (can('logs') || role() === 'Campus Manager' ? logs : '') + profileCard(res.profile) + people + activity + reg + editor + '</div>';
  }

  function contractRecords(schoolName, res, editable) {
    var docs = res.docs || [];
    var rows = res.contracts || [];
    var hist = res.contractHistory || [];
    var docHtml = docs.length ? docs.map(function (d) {
      var u = safeUrl(d.url);
      return '<a class="rowlink" href="' + esc(u) + '" target="_blank" rel="noopener"><span class="tag">' + icon('file', 18) + '</span>' +
        '<span class="t"><b style="font-size:14px">' + esc(d.title) + '</b><span>' + esc(d.kind) + ' · ' + esc(d.type) + (d.signed ? ' · Signed' : '') + '</span></span>' + icon('ext', 16) + '</a>';
    }).join('') : '<div class="empty">No contract PDFs linked yet.</div>';

    var rowHtml = rows.length ? rows.map(function (c) {
      return '<div style="border-top:1px solid var(--border);padding:12px 0;display:flex;flex-direction:column;gap:8px">' +
        '<div class="card-head"><span style="display:flex;flex-direction:column;gap:3px"><b style="font-size:14px">' + esc(fmtDate(c.start, { month: 'short', year: 'numeric' })) + ' to ' + esc(fmtDate(c.end, { month: 'short', year: 'numeric' })) + '</b>' +
        '<span class="small muted">' + esc(c.type || 'Contract') + (c.note ? ' · ' + esc(c.note) : '') + '</span></span>' +
        '<span class="badge ' + (CONTRACT_CLASS[c.status] || 'b-mute') + '">' + esc(c.status) + '</span></div>' +
        (editable ? '<details><summary class="small" style="cursor:pointer;color:var(--link);font-weight:600">Edit this contract</summary>' +
        '<form class="form contract-edit" data-row="' + c.row + '" data-school="' + esc(schoolName) + '" style="margin-top:12px" novalidate><div class="fields">' +
        '<div class="field"><label for="ce-s-' + c.row + '">Start date</label><input id="ce-s-' + c.row + '" name="start" type="date" value="' + esc(c.start) + '" required></div>' +
        '<div class="field"><label for="ce-e-' + c.row + '">End date</label><input id="ce-e-' + c.row + '" name="end" type="date" value="' + esc(c.end) + '" required></div>' +
        '<div class="field"><label for="ce-t-' + c.row + '">Type</label><select id="ce-t-' + c.row + '" name="type"><option' + (c.type !== 'Lease' ? ' selected' : '') + '>Rental</option><option' + (c.type === 'Lease' ? ' selected' : '') + '>Lease</option></select></div>' +
        '<div class="field"><label for="ce-p-' + c.row + '">PDF link</label><input id="ce-p-' + c.row + '" name="pdf" type="url" value="' + esc(c.pdf) + '" placeholder="https://"></div>' +
        '<div class="field full"><label for="ce-n-' + c.row + '">Note</label><input id="ce-n-' + c.row + '" name="note" type="text" maxlength="300" value="' + esc(c.note) + '"></div>' +
        '</div><div class="row" style="justify-content:flex-end"><button type="submit" class="btn primary sm">Save contract</button></div></form></details>' : '') + '</div>';
    }).join('') : '<div class="empty">No contract periods on file.</div>';

    var histHtml = hist.length ? hist.map(function (h) {
      return '<div class="hist"><span class="dot" aria-hidden="true"></span><div class="t"><b>' + esc(h.field) + ' changed</b>' +
        '<span>' + (h.oldValue ? '<s>' + esc(h.oldValue) + '</s> to ' : '') + esc(h.newValue || '(blank)') + '</span>' +
        '<span>' + esc(h.by) + ' · ' + esc(relTime(h.at)) + '</span></div></div>';
    }).join('') : '<div class="empty">No contract changes yet. Edits and new contracts are recorded here.</div>';

    return '<section class="card span-all" aria-labelledby="cr-h"><div class="card-head"><h2 id="cr-h">Contract records</h2><span class="hint">' + (editable ? 'Managers only' : 'View only') + '</span></div>' +
      '<div class="grid" style="gap:28px">' +
      '<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="legend-title" style="margin-bottom:6px">Signed documents · ' + docs.length + '</span>' + docHtml + '</div>' +
      '<div style="display:flex;flex-direction:column;min-width:0"><span class="legend-title" style="margin-bottom:6px">Contract periods</span>' + rowHtml + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="legend-title" style="margin-bottom:6px">Change history</span>' + histHtml + '</div>' +
      '</div></section>';
  }

  function biggestLift(h) {
    var gaps = [['contract', 40 - h.contract, 'Get a current contract on file'], ['stock', 40 - h.stock, 'Restock this school'], ['tasks', 20 - h.tasks, 'Close out open CM tasks']]
      .sort(function (a, b) { return b[1] - a[1]; });
    return gaps[0][1] > 0 ? 'Biggest lift: ' + gaps[0][2].charAt(0).toLowerCase() + gaps[0][2].slice(1) + '.' : 'Everything looks healthy.';
  }

  /* ---------------------------------------------------------------- */
  /* Registered info                                                  */
  /* ---------------------------------------------------------------- */

  function regFacts(reg) {
    var fields = state.data.regFields || [];
    if (!reg) return '<div class="empty">The School Admin hasn\'t added registered info yet.</div>';
    var pick = ['office', 'contact', 'email', 'phone', 'moveIn', 'moveOut'];
    return '<dl class="facts">' + fields.filter(function (f) { return pick.indexOf(f.key) !== -1; }).map(function (f) {
      var v = reg[f.key];
      if (f.type === 'date' && v) v = fmtDate(v);
      return '<div><dt>' + esc(f.label) + '</dt><dd>' + (v ? esc(v) : '<span class="muted" style="font-weight:400">Not set</span>') + '</dd></div>';
    }).join('') + '</dl>';
  }

  function regForm(schoolName, reg, editable) {
    var fields = state.data.regFields || [];
    var r = reg || {};
    var groups = [
      { title: 'Housing office', keys: ['office', 'contact', 'title', 'email', 'phone', 'address'] },
      { title: 'Academic year dates', keys: ['moveIn', 'moveOut', 'notes'] }
    ];
    var full = ['office', 'address', 'notes'];
    var ph = { office: 'e.g. Housing & Residential Education', contact: 'Full name', title: 'e.g. Assistant Director', email: 'name@school.edu', phone: '(555) 555-5555', address: 'Street, city, state, ZIP', notes: 'Loading dock hours, building access, anything our crew should know' };
    var html = groups.map(function (g) {
      return '<div class="fields"><span class="legend-title">' + g.title + '</span>' + g.keys.map(function (k) {
        var f = fields.filter(function (x) { return x.key === k; })[0];
        if (!f) return '';
        var id = 'reg-' + k;
        var common = ' id="' + id + '" name="' + k + '" maxlength="' + (f.max || 500) + '"' + (editable ? '' : ' readonly');
        var input = k === 'notes' ?
          '<textarea' + common + ' rows="3" placeholder="' + esc(ph[k] || '') + '">' + esc(r[k] || '') + '</textarea>' :
          '<input' + common + ' type="' + (f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text') + '" value="' + esc(r[k] || '') + '" placeholder="' + esc(ph[k] || '') + '">';
        return '<div class="field' + (full.indexOf(k) !== -1 ? ' full' : '') + '"><label for="' + id + '">' + esc(f.label) + (k === 'notes' ? ' <span class="muted" style="font-weight:400">(optional)</span>' : '') + '</label>' + input + '</div>';
      }).join('') + '</div>';
    }).join('');
    var saved = r.updatedAt ? 'Last saved ' + relTime(r.updatedAt) : 'Not saved yet';
    return '<form class="form" id="reg-form" data-school="' + esc(schoolName) + '" novalidate>' + html +
      (editable ? '<div class="formfoot"><span class="small muted" id="reg-saved">' + esc(saved) + '</span><div class="row"><button type="reset" class="btn">Discard</button><button type="submit" class="btn primary">Save changes</button></div></div>' : '') +
      '</form>';
  }

  function historyList(items) {
    if (!items || !items.length) return '<div class="empty">No changes yet.</div>';
    var undoable = role() !== 'Campus Manager';
    return items.map(function (h, i) {
      var change = h.oldValue || h.newValue ?
        '<span>' + (h.oldValue ? '<s>' + esc(h.oldValue) + '</s> to ' : 'Set to ') + esc(h.newValue || '(blank)') + '</span>' : '';
      return '<div class="hist' + (i === 0 ? ' latest' : '') + '"><span class="dot" aria-hidden="true"></span><div class="t"><b>' + esc(h.field) + ' changed</b>' + change +
        '<span>' + esc(h.by) + ' · ' + esc(relTime(h.at)) + (h.undone ? ' · Undone' : ' · College Products notified') + '</span></div>' +
        (undoable && !h.undone ? '<button type="button" class="btn sm" data-action="undo" data-id="' + esc(h.id) + '">Undo</button>' : '') + '</div>';
    }).join('');
  }

  /* ---------------------------------------------------------------- */
  /* School Admin home                                                */
  /* ---------------------------------------------------------------- */

  function viewAdminHome() {
    var d = state.data;
    var s = d.schools[0];
    if (!s) return '<div class="empty">No school is assigned to your account yet. Ask your College Products contact to set this up.</div>';
    return '<header class="schoolhead"><div class="who"><div class="bigmark" aria-hidden="true">' + esc(initials(s.name)) + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><span class="eyebrow">' + greeting() + ', ' + esc(firstName(d.user.name)) + '</span><h1 class="h1">' + esc(s.name) + '</h1>' +
      '<div class="row" style="gap:8px"><span class="badge b-good">Partner school</span>' + s.products.map(function (p) { return '<span class="badge b-info">' + esc(p.label) + '</span>'; }).join('') + '</div></div></div></header>' +
      '<div class="row" style="align-items:flex-start;gap:20px">' +
      '<section class="card" style="flex:2 1 520px;padding:28px" aria-labelledby="reg-h"><div class="card-head" style="align-items:flex-start;flex-wrap:wrap">' +
      '<div style="display:flex;flex-direction:column;gap:6px"><h2 id="reg-h" style="font-family:var(--display);font-size:20px;font-weight:800">Registered information</h2>' +
      '<p class="sub small" style="max-width:520px">Keep this current. College Products uses it for deliveries, print materials and move-in planning.</p></div>' +
      '<span class="badge b-good">' + icon('check', 14, 2.4) + 'You can edit this</span></div>' + regForm(s.name, d.registered, true) + '</section>' +
      '<div class="stack" style="flex:1 1 300px">' +
      '<section class="card"><h2>Your logs</h2>' + logTiles(s, false) + '</section>' +
      ((d.contacts || []).length ? '<section class="card" style="gap:4px"><div class="card-head" style="margin-bottom:6px"><h2>Contacts on file</h2><span class="hint">Who we reach out to</span></div>' + d.contacts.map(function (ct) { return contactPerson(ct, false); }).join('') + '<p class="small muted" style="margin:10px 0 0">Something out of date? Let your College Products manager know.</p></section>' : '') +
      '<section class="card" style="gap:6px"><div class="card-head" style="margin-bottom:8px"><h2>Change history</h2><span class="hint">Every save is kept</span></div><div id="history">' + historyList(d.history) + '</div></section>' +
      '<section class="helpcard"><h2 style="font-size:16px">Need something changed?</h2><p>Contract or product questions go to your College Products manager.</p></section>' +
      '</div></div>';
  }

  /* ---------------------------------------------------------------- */
  /* Campus Manager home                                              */
  /* ---------------------------------------------------------------- */

  function viewCampusHome() {
    var d = state.data;
    var cards = d.schools.map(function (s) {
      var tasks = s.openTasks ? s.openTasks + ' open CM task' + (s.openTasks === 1 ? '' : 's') : 'No open CM tasks';
      var stock = s.products.length ? s.products.map(function (p) {
        return '<div style="display:flex;flex-direction:column;gap:6px"><div class="card-head"><span style="font-weight:600;font-size:14px">' + esc(p.label) + '</span><span class="badge ' + (STOCK_CLASS[p.status] || 'b-mute') + '" style="padding:2px 8px;font-size:11px">' + esc(p.status) + '</span></div>' +
          covBar(p.inStock, p.ordered, p.status) + '<span class="small muted">' + (p.inStock == null ? 'Stock count missing' : '<strong style="color:var(--ink)">' + fmtNum(p.inStock) + '</strong> in stock for ' + fmtNum(p.ordered) + ' ordered') + '</span></div>';
      }).join('') : '<div class="empty">No stock data for this school.</div>';
      return '<article class="card" style="gap:20px;border-radius:22px"><a class="rowlink" style="margin:0;padding:0" href="' + schoolHref(s.name) + '">' + ring(s.health ? s.health.score : null, 56) +
        '<span class="t"><b style="font-family:var(--display);font-size:20px;font-weight:800">' + esc(s.name) + '</b><span class="row" style="gap:6px">' + contractBadge(s.contract) + '<span class="badge b-info">' + esc(tasks) + '</span></span></span>' + icon('chev') + '</a>' +
        '<div style="display:flex;flex-direction:column;gap:14px"><span class="small muted" style="font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:12px">Stock coverage</span>' + stock + '</div>' +
        logTiles(s, false) + '</article>';
    }).join('');
    return '<header class="pagehead"><div class="titles"><span class="eyebrow">' + esc(today()) + '</span><h1 class="h1">' + greeting() + ', ' + esc(firstName(d.user.name)) + '</h1></div></header>' +
      seasonHero(true) +
      (d.schools.length ? '<div class="grid">' + cards + '</div>' : '<div class="empty">No schools are assigned to your account yet. Ask your manager to set your school scope.</div>') +
      '<section class="card" style="gap:4px"><h2 style="margin-bottom:10px">Recent activity at your schools</h2>' + activityList(d.activity, true) + '</section>';
  }

  /* ---------------------------------------------------------------- */
  /* Logs list                                                        */
  /* ---------------------------------------------------------------- */

  function logRows(type) {
    var q = state.logSearch.trim().toLowerCase();
    var list = state.data.schools.filter(function (s) { return !q || s.name.toLowerCase().indexOf(q) !== -1; });
    if (!list.length) return '<div class="empty">No schools match.</div>';
    return list.map(function (s) {
      var u = safeUrl(s[LOG_FIELD[type]]);
      var note = type === 'cm' && s.openTasks != null ? (s.openTasks ? s.openTasks + ' open task' + (s.openTasks === 1 ? '' : 's') : 'No open tasks') : (u ? 'Open in Google Sheets' : 'Not connected yet');
      return u ? '<a class="rowlink" href="' + esc(u) + '" target="_blank" rel="noopener"><span class="tag">' + icon(type, 18) + '</span><span class="t"><b>' + esc(s.name) + '</b><span>' + esc(note) + '</span></span>' + icon('ext', 16) + '</a>' :
        '<div class="rowlink" style="opacity:.6"><span class="tag">' + icon(type, 18) + '</span><span class="t"><b>' + esc(s.name) + '</b><span>' + esc(note) + '</span></span></div>';
    }).join('');
  }

  function viewLogs(type) {
    return '<header class="pagehead"><div class="titles"><h1 class="h1">' + LOG_NAMES[type] + 's</h1><p class="sub">Open any school\'s ' + LOG_NAMES[type] + ' in Google Sheets.</p></div>' +
      '<div class="field" style="width:280px;max-width:100%"><label for="log-search" class="sr-only">Filter schools</label><input id="log-search" type="search" placeholder="Filter schools" value="' + esc(state.logSearch) + '" autocomplete="off" data-type="' + type + '"></div></header>' +
      '<section class="card" id="log-rows" style="gap:0">' + logRows(type) + '</section>';
  }

  /* ---------------------------------------------------------------- */
  /* Contracts (Manager)                                              */
  /* ---------------------------------------------------------------- */

  function viewContracts(preselect) {
    var schools = state.data.schools;
    var rank = { 'Renewing soon': 0, 'Expired': 1, 'Pending': 2, 'Active': 3 };
    var sorted = schools.slice().sort(function (a, b) {
      var ra = a.contract ? rank[a.contract.status] : 4, rb = b.contract ? rank[b.contract.status] : 4;
      if (ra !== rb) return ra - rb;
      if (a.contract && b.contract) return new Date(a.contract.end) - new Date(b.contract.end);
      return a.name.localeCompare(b.name);
    });
    var opts = schools.map(function (s) { return '<option value="' + esc(s.name) + '"></option>'; }).join('');
    if (!isManager()) {
      return '<header class="pagehead"><div class="titles"><h1 class="h1">Contracts</h1><p class="sub">Contract status for every school, renewals first. Open a school to see its signed PDFs.</p></div></header>' +
        '<section class="card" style="gap:0">' + sorted.map(function (s) {
          return '<a class="rowlink" href="' + schoolHref(s.name) + '"><span class="t"><b>' + esc(s.name) + '</b><span>' + esc(contractNote(s.contract) || 'No contract on file') + '</span></span>' + contractBadge(s.contract) + '</a>';
        }).join('') + '</section>';
    }
    return '<header class="pagehead"><div class="titles"><h1 class="h1">Contracts</h1><p class="sub">Status comes from the dates, so it stays current on its own. Renewal reminders are emailed 60 and 30 days out.</p></div></header>' +
      '<div class="grid-2">' +
      '<section class="card" aria-labelledby="add-h"><h2 id="add-h">Add a contract</h2>' +
      '<form class="form" id="contract-form" novalidate><div class="fields">' +
      '<div class="field full"><label for="c-school">School</label><input id="c-school" name="school" list="c-schools" required autocomplete="off" placeholder="Pick a school, or type a new lease school" value="' + esc(preselect || '') + '"><datalist id="c-schools">' + opts + '</datalist></div>' +
      '<div class="field full"><label for="c-type">Contract type</label><select id="c-type" name="type"><option>Rental</option><option>Lease</option></select></div>' +
      '<div class="field"><label for="c-start">Start date</label><input id="c-start" name="start" type="date" required></div>' +
      '<div class="field"><label for="c-end">End date</label><input id="c-end" name="end" type="date" required></div>' +
      '<div class="field full"><label for="c-pdf">Signed contract PDF link <span class="muted" style="font-weight:400">(optional)</span></label><input id="c-pdf" name="pdf" type="url" placeholder="Paste a Google Drive sharing link"></div>' +
      '</div><div class="formfoot" style="border:0;padding:0"><span class="small muted">Past contracts are kept as history.</span><button type="submit" class="btn primary">' + icon('plus', 16, 2) + 'Save contract</button></div></form></section>' +
      '<section class="card" style="gap:0"><div class="card-head" style="margin-bottom:8px"><h2>All schools</h2><span class="hint">Renewals first</span></div>' +
      sorted.map(function (s) {
        return '<a class="rowlink" href="' + schoolHref(s.name) + '"><span class="t"><b>' + esc(s.name) + '</b><span>' + esc(contractNote(s.contract) || 'No contract on file') + '</span></span>' + contractBadge(s.contract) + '</a>';
      }).join('') + '</section></div>';
  }

  /* ---------------------------------------------------------------- */
  /* Contacts                                                         */
  /* ---------------------------------------------------------------- */

  var ROLE_CLASS = { Primary: 'b-good', Secondary: 'b-info', Housing: 'b-info', Billing: 'b-mute', Other: 'b-mute' };

  function webUrl(u) {
    u = String(u || '').trim();
    if (/^https?:\/\/[^\s"'<>]+$/i.test(u)) return u;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s"'<>]*)?$/i.test(u)) return 'https://' + u;
    return '';
  }
  function telHref(p) {
    var m = String(p || '').match(/\+?\d[\d\s().-]{5,}\d/);
    return m ? 'tel:' + m[0].replace(/[^\d+]/g, '') : '';
  }
  function money(n) { return n == null ? '' : '$' + Number(n).toFixed(2); }
  function copyBtn(text, what) {
    return '<button type="button" class="copybtn" data-action="copy" data-copy="' + esc(text) + '" aria-label="Copy ' + esc(what) + '" title="Copy ' + esc(what) + '">' + icon('copy', 15, 2) + '</button>';
  }
  function reachLine(kind, value) {
    if (!value) return '';
    var href = kind === 'mail' ? 'mailto:' + value : telHref(value);
    return '<div class="reachline">' + icon(kind, 14, 2) + (href ? '<a href="' + esc(href) + '">' + esc(value) + '</a>' : '<span>' + esc(value) + '</span>') + copyBtn(value, kind === 'mail' ? 'email' : 'phone') + '</div>';
  }

  function contactPerson(ct, editable) {
    return '<div class="contact' + (ct.status === 'Inactive' ? ' inactive' : '') + '">' +
      '<div class="avatar" aria-hidden="true">' + esc(initials(ct.name)) + '</div>' +
      '<div class="t"><div class="nm"><b>' + esc(ct.name) + '</b><span class="badge sm ' + (ROLE_CLASS[ct.role] || 'b-mute') + '">' + esc(ct.role) + '</span>' +
      (ct.status === 'Inactive' ? '<span class="badge sm b-mute">Inactive</span>' : '') +
      (ct.review ? '<span class="badge sm b-warn">' + icon('alert', 12, 2.2) + 'Review</span>' : '') + '</div>' +
      (ct.title ? '<span class="small muted">' + esc(ct.title) + '</span>' : '') +
      '<div class="reach">' + reachLine('mail', ct.email) + reachLine('phone', ct.phone) + '</div>' +
      (ct.review ? '<div class="reviewnote">' + esc(ct.review) + '</div>' : '') + '</div>' +
      (editable ? '<button type="button" class="copybtn" data-action="edit-contact" data-id="' + esc(ct.id) + '" aria-label="Edit ' + esc(ct.name) + '" title="Edit">' + icon('pencil', 15, 2) + '</button>' : '') +
      '</div>';
  }

  function contactsCard(schoolName, contacts, hist) {
    var mgr = can('contacts.edit');
    var list = contacts.slice().sort(function (a, b) { return (a.status === 'Inactive') - (b.status === 'Inactive'); });
    var active = list.filter(function (c) { return c.status === 'Active'; }).length;
    var histHtml = (mgr && hist && hist.length) ? '<details class="morebox"><summary>Contact changes · ' + hist.length + '</summary>' + hist.map(function (h) {
      return '<div class="hist"><span class="dot" aria-hidden="true"></span><div class="t"><b>' + esc(h.field) + '</b>' +
        '<span>' + (h.oldValue ? '<s>' + esc(h.oldValue) + '</s> to ' : '') + esc(h.newValue || '(blank)') + '</span>' +
        '<span>' + esc(h.by) + ' · ' + esc(relTime(h.at)) + '</span></div></div>';
    }).join('') + '</details>' : '';
    return '<section class="card span-all" aria-labelledby="ct-h"><div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="ct-h">Contacts</h2>' +
      '<span class="hint">' + (active ? active + ' active contact' + (active === 1 ? '' : 's') : 'No active contacts yet') + '</span></div>' +
      '<div class="row">' + (mgr ? '<button type="button" class="btn sm" data-action="add-contact" data-school="' + esc(schoolName) + '">' + icon('plus', 15, 2) + 'Add contact</button>' : '') +
      '<a class="btn sm" href="#/contacts?school=' + encodeURIComponent(schoolName) + '">All contacts</a></div></div>' +
      (list.length ? '<div class="contact-grid">' + list.map(function (c) { return contactPerson(c, mgr); }).join('') + '</div>' : '<div class="empty">No contacts on file for this school yet.</div>') +
      histHtml + '</section>';
  }

  function profileCard(p) {
    if (!p) return '';
    var mgr = isManager();
    var a = p.address || {};
    var addrLines = [a.attention, a.line1, a.line2, [a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean);
    var addrText = addrLines.join('\n');
    var block = function (title, inner) { return inner ? '<div class="pblock"><span class="legend-title">' + title + '</span>' + inner + '</div>' : ''; };
    var link = function (label, u) { var w = webUrl(u); return w ? '<a class="plink" href="' + esc(w) + '" target="_blank" rel="noopener">' + icon('globe', 15, 2) + '<span>' + esc(label) + '</span>' + icon('ext', 13, 2) + '</a>' : ''; };
    var yn = function (label, v) { if (!v) return ''; var yes = /^y/i.test(v); return '<span class="badge sm ' + (yes ? 'b-good' : 'b-mute') + '">' + esc(label) + ': ' + (yes ? 'Yes' : 'No') + '</span>'; };

    var col1 = block('Mailing address', addrLines.length ? '<div class="row" style="gap:6px;align-items:flex-start;flex-wrap:nowrap"><div class="addr">' + esc(addrText) + '</div>' + copyBtn(addrText, 'address') + '</div>' : '<div class="small muted">No mailing address on file.</div>') +
      block('Links', link('School website', p.website) + link('Housing page', p.housingUrl) + link('Our listing on their site', p.listingUrl)) +
      (p.marketing ? block('Print materials', '<div class="chips">' + yn('Rack cards in stock', p.marketing.rackStock) + yn('Posters in stock', p.marketing.posterStock) + yn('Rack cards shipped', p.marketing.rackShipped) + yn('Posters shipped', p.marketing.posterShipped) + '</div>') : '') +
      (mgr && p.listingNotes ? block('Listing notes', '<p class="small" style="margin:0;white-space:pre-line">' + esc(p.listingNotes) + '</p>') : '');

    var facts = [['Products offered', p.products], ['Service', p.service], ['Service requirements', p.requirements], ['School rules', p.regulations]].filter(function (f) { return f[1]; });
    var prices = (p.pricing || []).length ? '<table class="prices"><thead><tr><th>Product</th><th class="num">Regular</th><th class="num">Early bird</th></tr></thead><tbody>' + p.pricing.map(function (x) {
      return '<tr><td><b>' + esc(x.product) + '</b>' + (x.notes ? '<div class="small muted">' + esc(x.notes) + '</div>' : '') + '</td><td class="num">' + esc(money(x.regular)) + '</td><td class="num">' + (x.earlyBird != null ? esc(money(x.earlyBird)) : '<span class="muted">None</span>') + '</td></tr>';
    }).join('') + '</tbody></table>' : '';
    var col2 = block('Service', facts.length ? '<dl class="facts one">' + facts.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
      block('Pricing', prices);

    var dorms = p.dorms || [];
    var chip = function (n) { return '<span class="chip">' + esc(n) + '</span>'; };
    var dormHtml = dorms.length ? '<div class="chips">' + dorms.slice(0, 14).map(chip).join('') + '</div>' +
      (dorms.length > 14 ? '<details class="morebox"><summary>Show all ' + dorms.length + ' halls</summary><div class="chips" style="margin-top:10px">' + dorms.slice(14).map(chip).join('') + '</div></details>' : '') : '';
    var flags = (p.flags || []).length ? '<div style="display:flex;flex-direction:column;gap:8px">' + p.flags.map(function (f) {
      return '<div class="reviewnote" style="margin:0"><b>' + esc(f.area) + ':</b> ' + esc(f.issue) + '</div>';
    }).join('') + '</div>' : '';
    var col3 = block('Residence halls' + (dorms.length ? ' · ' + dorms.length : ''), dormHtml || '<div class="small muted">No residence halls on file.</div>') +
      (mgr ? block('Data to review', flags) : '');

    return '<section class="card span-all" aria-labelledby="pf-h"><div class="card-head"><h2 id="pf-h">School profile</h2>' +
      (mgr && p.code ? '<span class="hint">School code: <b style="color:var(--ink)">' + esc(p.code) + '</b></span>' : '') + '</div>' +
      '<div class="profile-grid"><div class="stack" style="gap:22px">' + col1 + '</div><div class="stack" style="gap:22px">' + col2 + '</div><div class="stack" style="gap:22px">' + col3 + '</div></div></section>';
  }

  var CONTACT_FILTERS = [
    { key: 'all', label: 'All', mgr: false },
    { key: 'primary', label: 'Primary', mgr: false },
    { key: 'other', label: 'Other roles', mgr: false },
    { key: 'review', label: 'Needs review', mgr: true, cap: 'contacts.review' },
    { key: 'inactive', label: 'Inactive', mgr: true, cap: 'contacts.edit' },
    { key: 'missing', label: 'Schools with no contact', mgr: false }
  ];

  function contactMatches(ct, f) {
    if (f === 'inactive') { if (ct.status !== 'Inactive') return false; }
    else if (ct.status !== 'Active') return false;
    if (f === 'primary' && ct.role !== 'Primary') return false;
    if (f === 'other' && ct.role === 'Primary') return false;
    if (f === 'review' && !ct.review) return false;
    return true;
  }

  function filteredContacts() {
    var q = state.contactSearch.trim().toLowerCase();
    var sch = state.contactSchool;
    return (state.data.contacts || []).filter(function (ct) {
      if (!contactMatches(ct, state.contactFilter)) return false;
      if (sch && ct.school !== sch) return false;
      if (q && (ct.name + ' ' + ct.title + ' ' + ct.email + ' ' + ct.phone + ' ' + ct.school + ' ' + ct.role).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function schoolsWithoutContact() {
    var covered = {};
    (state.data.contacts || []).forEach(function (ct) { if (ct.status === 'Active') covered[ct.school.toLowerCase()] = true; });
    var q = state.contactSearch.trim().toLowerCase();
    return state.data.schools.filter(function (s) {
      return !covered[s.name.toLowerCase()] && (!q || s.name.toLowerCase().indexOf(q) !== -1) && (!state.contactSchool || s.name === state.contactSchool);
    });
  }

  function contactResults() {
    var mgr = can('contacts.edit');
    if (state.contactFilter === 'missing') {
      var miss = schoolsWithoutContact();
      return '<section class="card" style="gap:0">' + (miss.length ? miss.map(function (s) {
        return '<div class="rowlink"><span class="tag">' + esc(initials(s.name)) + '</span><span class="t"><a href="' + schoolHref(s.name) + '" style="color:var(--ink);text-decoration:none"><b>' + esc(s.name) + '</b></a><span>No active contact on file</span></span>' +
          (mgr ? '<button type="button" class="btn sm" data-action="add-contact" data-school="' + esc(s.name) + '">' + icon('plus', 15, 2) + 'Add contact</button>' : '') + '</div>';
      }).join('') : '<div class="empty">Every school has at least one active contact.</div>') + '</section>';
    }
    var list = filteredContacts();
    var emails = list.filter(function (c) { return c.email; }).length;
    var rows = list.length ? list.map(function (ct) {
      return '<tr' + (ct.status === 'Inactive' ? ' style="opacity:.6"' : '') + '><td><div class="namecell"><div class="avatar" aria-hidden="true">' + esc(initials(ct.name)) + '</div><div style="display:flex;flex-direction:column;gap:2px;min-width:0"><b>' + esc(ct.name) + '</b>' +
        (ct.title ? '<span class="small muted">' + esc(ct.title) + '</span>' : '') + (ct.review ? '<span class="small" style="color:var(--warn)">' + icon('alert', 12, 2.2) + ' ' + esc(ct.review) + '</span>' : '') + '</div></div></td>' +
        '<td><a class="plain" href="' + schoolHref(ct.school) + '">' + esc(ct.school) + '</a></td>' +
        '<td><span class="badge sm ' + (ROLE_CLASS[ct.role] || 'b-mute') + '">' + esc(ct.role) + '</span></td>' +
        '<td>' + (ct.email ? reachLine('mail', ct.email) : '<span class="muted small">None</span>') + '</td>' +
        '<td>' + (ct.phone ? reachLine('phone', ct.phone) : '<span class="muted small">None</span>') + '</td>' +
        '<td style="text-align:right">' + (mgr ? '<button type="button" class="btn sm" data-action="edit-contact" data-id="' + esc(ct.id) + '">' + icon('pencil', 14, 2) + 'Edit</button>' : '') + '</td></tr>';
    }).join('') : '<tr><td colspan="6"><div class="empty">No contacts match.</div></td></tr>';
    return '<section class="tablecard" aria-label="Contacts"><div class="scroll"><table>' +
      '<thead><tr><th scope="col">Name</th><th scope="col">School</th><th scope="col">Role</th><th scope="col">Email</th><th scope="col">Phone</th><th scope="col"><span class="sr-only">Edit</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<div class="tfoot"><span>' + list.length + ' contact' + (list.length === 1 ? '' : 's') + '</span>' +
      (emails ? '<button type="button" class="btn sm" data-action="copy-emails">' + icon('copy', 14, 2) + 'Copy ' + emails + ' email' + (emails === 1 ? '' : 's') + '</button>' : '') + '</div></section>';
  }

  function viewContacts() {
    var d = state.data;
    var mgr = can('contacts.edit');
    var all = d.contacts || [];
    var active = all.filter(function (c) { return c.status === 'Active'; });
    var review = active.filter(function (c) { return c.review; }).length;
    var missing = schoolsWithoutContactAll();
    var covered = d.schools.length - missing;
    var names = {};
    d.schools.forEach(function (s) { names[s.name] = true; });
    all.forEach(function (c) { names[c.school] = true; });
    var opts = Object.keys(names).sort().map(function (n) { return '<option value="' + esc(n) + '"' + (n === state.contactSchool ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
    var pills = CONTACT_FILTERS.filter(function (f) { return !f.cap || can(f.cap); }).map(function (f) {
      var n = f.key === 'missing' ? missing : all.filter(function (c) { return contactMatches(c, f.key); }).length;
      return '<button type="button" class="pill" data-cfilter="' + f.key + '" aria-pressed="' + (state.contactFilter === f.key) + '">' + esc(f.label) + ' · ' + n + '</button>';
    }).join('');
    var kpis = [
      { label: 'Active contacts', value: active.length, f: 'all' },
      { label: 'Schools covered', value: covered + ' of ' + d.schools.length, f: 'all' },
      { label: 'Schools with no contact', value: missing, f: 'missing' }
    ];
    if (can('contacts.review')) kpis.push({ label: 'Needs review', value: review, f: 'review' });
    return '<header class="pagehead"><div class="titles"><h1 class="h1">Contacts</h1><p class="sub">Everyone we work with at ' + (can('directory') ? 'our partner schools' : 'your schools') + '. Click the copy icon next to any email or phone number.</p></div>' +
      (mgr ? '<button type="button" class="btn primary" data-action="add-contact">' + icon('plus', 16, 2) + 'Add contact</button>' : '') + '</header>' +
      '<section class="kpis" aria-label="Contact summary">' + kpis.map(function (k) {
        return '<button type="button" class="kpi kpibtn" data-cfilter="' + k.f + '"><span class="label">' + esc(k.label) + '</span><span class="value">' + esc(k.value) + '</span></button>';
      }).join('') + '</section>' +
      '<div class="row" style="justify-content:space-between;align-items:flex-end"><div class="row" role="group" aria-label="Contact filters">' + pills + '</div>' +
      '<div class="row" style="gap:10px"><div class="field" style="width:240px;max-width:100%"><label for="contact-school" class="sr-only">School</label><select id="contact-school"><option value="">All schools</option>' + opts + '</select></div>' +
      '<div class="field" style="width:240px;max-width:100%"><label for="contact-search" class="sr-only">Search contacts</label><input id="contact-search" type="search" placeholder="Search name, email, title" value="' + esc(state.contactSearch) + '" autocomplete="off"></div></div></div>' +
      '<div id="contact-results">' + contactResults() + '</div>';
  }

  function schoolsWithoutContactAll() {
    var covered = {};
    (state.data.contacts || []).forEach(function (ct) { if (ct.status === 'Active') covered[ct.school.toLowerCase()] = true; });
    return state.data.schools.filter(function (s) { return !covered[s.name.toLowerCase()]; }).length;
  }

  function repaintContacts() {
    var box = $('#contact-results');
    if (box) box.innerHTML = contactResults();
    document.querySelectorAll('[data-cfilter]').forEach(function (b) {
      if (b.classList.contains('pill')) b.setAttribute('aria-pressed', String(b.getAttribute('data-cfilter') === state.contactFilter));
    });
  }

  function currentSchoolName() {
    var route = parseRoute();
    return route.name === 'school' ? route.school : '';
  }

  function openContactModal(ct, presetSchool) {
    if (!can('contacts.edit')) return;
    closePalette();
    var d = state.data;
    var roles = d.contactRoles || ['Primary', 'Secondary', 'Housing', 'Billing', 'Other'];
    var school = ct ? ct.school : (presetSchool || '');
    var names = {};
    d.schools.forEach(function (s) { names[s.name] = true; });
    (d.contacts || []).forEach(function (c) { names[c.school] = true; });
    var v = ct || { role: 'Primary', name: '', title: '', email: '', phone: '', status: 'Active' };
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="cm-h">' +
      '<div class="card-head"><h2 id="cm-h" style="font-family:var(--display);font-size:20px;font-weight:800">' + (ct ? 'Edit contact' : 'Add a contact') + '</h2>' +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<form class="form" id="contact-modal-form" data-id="' + esc(ct ? ct.id : '') + '" novalidate>' +
      (ct && ct.review ? '<div class="reviewnote" style="margin:0"><b>Flagged for review:</b> ' + esc(ct.review) + '<label class="checkline"><input type="checkbox" name="reviewed"> Mark as reviewed</label></div>' : '') +
      '<div class="fields">' +
      '<div class="field full"><label for="m-school">School</label><input id="m-school" name="school" list="m-schools" required autocomplete="off" value="' + esc(school) + '"><datalist id="m-schools">' + Object.keys(names).sort().map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('') + '</datalist></div>' +
      '<div class="field"><label for="m-name">Name</label><input id="m-name" name="name" required maxlength="120" value="' + esc(v.name) + '"></div>' +
      '<div class="field"><label for="m-role">Role</label><select id="m-role" name="role">' + roles.map(function (r) { return '<option' + (r === v.role ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field full"><label for="m-title">Title or department <span class="muted" style="font-weight:400">(optional)</span></label><input id="m-title" name="title" maxlength="160" value="' + esc(v.title) + '"></div>' +
      '<div class="field"><label for="m-email">Email</label><input id="m-email" name="email" type="email" maxlength="200" value="' + esc(v.email) + '"></div>' +
      '<div class="field"><label for="m-phone">Phone</label><input id="m-phone" name="phone" type="tel" maxlength="60" value="' + esc(v.phone) + '"></div>' +
      (ct ? '<div class="field"><label for="m-status">Status</label><select id="m-status" name="status"><option' + (v.status !== 'Inactive' ? ' selected' : '') + '>Active</option><option' + (v.status === 'Inactive' ? ' selected' : '') + '>Inactive</option></select></div>' : '') +
      '</div><div class="formfoot" style="border:0;padding:0"><span class="small muted">' + (ct ? 'Every change is kept in the school\'s contact history.' : 'Add an email, a phone number, or both.') + '</span>' +
      '<button type="submit" class="btn primary">' + (ct ? 'Save contact' : icon('plus', 16, 2) + 'Add contact') + '</button></div></form></div></div>';
    var first = $(school ? '#m-name' : '#m-school');
    if (first) first.focus();
  }

  function closeModal() {
    if (!state.modal) return;
    state.modal = false;
    $('#palette-root').innerHTML = '';
  }

  /* ---------------------------------------------------------------- */
  /* Team home (Customer Success, Sales, Finance, On-Field)           */
  /* ---------------------------------------------------------------- */

  var TEAM_INFO = {
    'Customer Success': 'Contacts, school details and logs, so every student and partner question gets a fast, right answer.',
    'Sales': 'Partner contacts, contracts and renewals, all in one place.',
    'Finance': 'Contracts, renewals and storage costs across every school.',
    'On-Field': 'Storage locations, access codes, stock and open tasks for every campus.'
  };

  function kpiCard(label, value, href, note) {
    return '<a class="kpi" href="' + href + '" style="text-decoration:none;color:var(--ink)"><span class="label">' + esc(label) + '</span><span class="value">' + esc(value) + '</span>' + (note ? '<span class="small muted">' + esc(note) + '</span>' : '') + '</a>';
  }

  function storageRateTotal(list) {
    return list.reduce(function (a, st) { var n = parseFloat(String(st.rate || '').replace(/[^0-9.]/g, '')); return a + (isFinite(n) ? n : 0); }, 0);
  }

  function viewTeamHome() {
    var d = state.data;
    var r = role();
    var schools = d.schools;
    var renewals = schools.filter(function (s) { return s.contract && s.contract.status === 'Renewing soon'; }).sort(function (a, b) { return a.contract.daysLeft - b.contract.daysLeft; });
    var storage = (d.storage || []).filter(function (st) { return st.status !== 'Closed'; });
    var critical = schools.filter(function (s) { return s.stockStatus === 'Critical'; });
    var tasks = schools.filter(function (s) { return s.openTasks; }).sort(function (a, b) { return b.openTasks - a.openTasks; });
    var contacts = (d.contacts || []).filter(function (c) { return c.status === 'Active'; });
    var review = contacts.filter(function (c) { return c.review; });
    var missing = schoolsWithoutContactAll();
    var kpis = '';
    var main = '';
    var schoolRow = function (s, sub, badge) { return '<a class="rowlink" href="' + schoolHref(s.name) + '"><span class="tag">' + esc(initials(s.name)) + '</span><span class="t"><b>' + esc(s.name) + '</b><span>' + esc(sub) + '</span></span>' + (badge || icon('chev')) + '</a>'; };
    var listCard = function (title, hint, rows, empty) { return '<section class="card" style="gap:0"><div class="card-head" style="margin-bottom:8px"><h2>' + title + '</h2>' + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>' + (rows || '<div class="empty">' + empty + '</div>') + '</section>'; };
    var renewCard = listCard('Renewals in the next 90 days', 'Soonest first', renewals.map(function (s) { return schoolRow(s, 'Ends ' + fmtDate(s.contract.end) + ' · ' + s.contract.daysLeft + ' days left', contractBadge(s.contract)); }).join(''), 'No contracts end in the next 90 days.');

    if (r === 'Customer Success') {
      kpis = kpiCard('Active contacts', contacts.length, '#/contacts') + kpiCard('Contacts to review', review.length, '#/contacts?filter=review') + kpiCard('Schools with no contact', missing, '#/contacts?filter=missing') + kpiCard('Open CM tasks', tasks.reduce(function (a, s) { return a + s.openTasks; }, 0), '#/logs/cm');
      main = listCard('Contacts to review', 'Flagged in the master sheet', review.map(function (ct) {
        return '<a class="rowlink" href="' + schoolHref(ct.school) + '"><span class="tag">' + esc(initials(ct.name)) + '</span><span class="t"><b>' + esc(ct.name) + '</b><span>' + esc(ct.school) + ' · ' + esc(ct.review) + '</span></span>' + icon('chev') + '</a>';
      }).join(''), 'Every contact has been reviewed.') +
        listCard('Schools with open CM tasks', 'Most first', tasks.slice(0, 8).map(function (s) { return schoolRow(s, s.openTasks + ' open task' + (s.openTasks === 1 ? '' : 's')); }).join(''), 'No open CM tasks.');
    } else if (r === 'Sales') {
      var noContract = schools.filter(function (s) { return !s.contract; });
      kpis = kpiCard('Partner schools', schools.length, '#/schools') + kpiCard('Renewing in 90 days', renewals.length, '#/contracts') + kpiCard('No contract on file', noContract.length, '#/schools') + kpiCard('Active contacts', contacts.length, '#/contacts');
      main = renewCard + listCard('No contract on file', 'Worth a conversation', noContract.map(function (s) { return schoolRow(s, s.products.map(function (p) { return p.label; }).join(', ') || 'No products listed'); }).join(''), 'Every school has a contract on file.');
    } else if (r === 'Finance') {
      var total = storageRateTotal(storage);
      var expired = schools.filter(function (s) { return s.contract && s.contract.status === 'Expired'; });
      kpis = kpiCard('Monthly storage cost', money(total), '#/map?layer=storage', storage.length + ' locations') + kpiCard('Renewing in 90 days', renewals.length, '#/contracts') + kpiCard('Expired contracts', expired.length, '#/contracts') + kpiCard('Active contracts', schools.filter(function (s) { return s.contract && s.contract.status === 'Active'; }).length, '#/contracts');
      main = listCard('Storage costs', 'Highest first', storage.slice().sort(function (a, b) { return storageRateTotal([b]) - storageRateTotal([a]); }).map(function (st) {
        return '<a class="rowlink" href="#/map?storage=' + encodeURIComponent(st.id) + '"><span class="tag">' + icon('box', 16) + '</span><span class="t"><b>' + esc(st.company || st.address) + '</b><span>' + esc(st.school) + (st.size ? ' · ' + esc(st.size) : '') + '</span></span><b>' + (st.rate ? esc(money(storageRateTotal([st]))) + '<span class="small muted"> /mo</span>' : '<span class="small muted">No rate</span>') + '</b></a>';
      }).join(''), 'No storage locations yet.') + renewCard;
    } else {
      kpis = kpiCard('Storage locations', storage.length, '#/map?layer=storage') + kpiCard('Critical stock', critical.length, '#/schools', 'Schools') + kpiCard('Open CM tasks', tasks.reduce(function (a, s) { return a + s.openTasks; }, 0), '#/logs/cm') + kpiCard('Schools on the map', (d.locations || []).length, '#/map');
      main = '<section class="card" style="gap:4px"><div class="card-head" style="margin-bottom:8px"><h2>Storage locations</h2>' + (can('storage.edit') ? '<button type="button" class="btn sm" data-action="add-storage">' + icon('plus', 15, 2) + 'Add storage</button>' : '') + '</div>' +
        (storage.length ? '<div style="display:flex;flex-direction:column">' + storage.map(storageRow).join('') + '</div>' : '<div class="empty">No storage locations yet.</div>') + '</section>' +
        '<div class="stack">' + listCard('Critical stock', 'Restock first', critical.map(function (s) { return schoolRow(s, fmtNum(s.inStock) + ' in stock for ' + fmtNum(s.ordered) + ' ordered', '<span class="badge b-bad">Critical</span>'); }).join(''), 'No schools are critical right now.') +
        listCard('Open CM tasks', 'Most first', tasks.slice(0, 6).map(function (s) { return schoolRow(s, s.openTasks + ' open task' + (s.openTasks === 1 ? '' : 's')); }).join(''), 'No open CM tasks.') + '</div>';
    }
    var tiles = [
      can('map') ? ['#/map', 'map', 'Map', 'Schools and storage'] : null,
      ['#/schools', 'school', 'Schools', schools.length + ' schools'],
      can('contacts') ? ['#/contacts', 'users', 'Contacts', contacts.length + ' people'] : null,
      can('contract.docs') ? ['#/contracts', 'file', 'Contracts', renewals.length + ' renewing soon'] : null,
      can('logs') ? ['#/logs/cm', 'cm', 'CM Logs', 'Per school'] : null
    ].filter(Boolean);
    return '<header class="pagehead"><div class="titles"><span class="eyebrow">' + esc(today()) + ' · ' + esc(r) + '</span><h1 class="h1">' + greeting() + ', ' + esc(firstName(d.user.name)) + '</h1><p class="sub">' + esc(TEAM_INFO[r] || '') + '</p></div></header>' +
      '<section class="kpis" aria-label="Summary">' + kpis + '</section>' +
      '<div class="tiles">' + tiles.map(function (t) { return '<a class="tile" href="' + t[0] + '"><span class="ic">' + icon(t[1], 20) + '</span><span style="display:flex;flex-direction:column;gap:4px"><b>' + t[2] + '</b><small>' + esc(t[3]) + '</small></span></a>'; }).join('') + '</div>' +
      '<div class="grid-2">' + main + '</div>' +
      '<section class="card" style="gap:4px"><h2 style="margin-bottom:10px">Recent activity</h2>' + activityList(d.activity, true) + '</section>';
  }

  /* ---------------------------------------------------------------- */
  /* Storage                                                          */
  /* ---------------------------------------------------------------- */

  function directionsUrl(lat, lng, addr) {
    if (lat != null && lng != null) return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
    return addr ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(addr) : '';
  }
  function storageAddress(st) {
    if (st.address && ((st.zip && st.address.indexOf(st.zip) !== -1) || (st.city && st.address.indexOf(st.city) !== -1))) return st.address;
    return [st.address, st.city, [st.state, st.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  }

  function storageRow(st) {
    var bits = [st.gate ? 'Gate ' + st.gate : '', st.padlock ? 'Lock ' + st.padlock : '', st.unit ? 'Unit ' + st.unit : ''].filter(Boolean);
    return '<a class="rowlink" href="#/map?storage=' + encodeURIComponent(st.id) + '"><span class="tag">' + icon('box', 16) + '</span><span class="t"><b>' + esc(st.company || st.address) + '</b><span>' + esc(st.school) + (st.city ? ' · ' + esc(st.city) : '') + '</span>' +
      (bits.length ? '<span class="codeline">' + bits.map(function (b) { return '<code>' + esc(b) + '</code>'; }).join('') + '</span>' : '') + '</span>' + icon('chev') + '</a>';
  }

  function storageItem(st, editable, withSchool) {
    var addr = storageAddress(st);
    var dir = directionsUrl(st.lat, st.lng, addr);
    var fact = function (label, v) { return v ? '<div><dt>' + label + '</dt><dd>' + esc(v) + '</dd></div>' : ''; };
    var secret = function (label, v) { return v ? '<div class="secret"><span class="small muted">' + label + '</span><b>' + esc(v) + '</b>' + copyBtn(v, label.toLowerCase()) + '</div>' : ''; };
    var codes = secret('Gate code', st.gate) + secret('Padlock', st.padlock) + secret('Account login', st.accountLogin) + secret('Account email', st.accountEmail);
    var site = webUrl(st.website);
    return '<div class="storage' + (st.status === 'Closed' ? ' inactive' : '') + '">' +
      '<div class="card-head" style="align-items:flex-start"><div style="display:flex;gap:12px;min-width:0"><span class="tag">' + icon('box', 18) + '</span><div style="display:flex;flex-direction:column;gap:4px;min-width:0">' +
      '<div class="nm"><b>' + esc(st.company || 'Storage') + '</b><span class="badge sm b-info">' + esc(st.type || 'Storage') + '</span>' + (st.status === 'Closed' ? '<span class="badge sm b-mute">Closed</span>' : '') + '</div>' +
      (withSchool ? '<a class="small plain" href="' + schoolHref(st.school) + '">' + esc(st.school) + '</a>' : '') + '</div></div>' +
      '<div class="row" style="gap:4px;flex-wrap:nowrap">' + (dir ? '<a class="copybtn" href="' + esc(dir) + '" target="_blank" rel="noopener" title="Directions" aria-label="Directions to ' + esc(st.company || 'storage') + '">' + icon('dir', 16, 2) + '</a>' : '') +
      (can('map') && st.lat != null ? '<a class="copybtn" href="#/map?storage=' + encodeURIComponent(st.id) + '" title="Show on map" aria-label="Show on map">' + icon('map', 16, 2) + '</a>' : '') +
      (editable ? '<button type="button" class="copybtn" data-action="edit-storage" data-id="' + esc(st.id) + '" title="Edit" aria-label="Edit ' + esc(st.company || 'storage') + '">' + icon('pencil', 15, 2) + '</button>' : '') + '</div></div>' +
      (addr ? '<div class="reachline">' + icon('pin', 14, 2) + '<span>' + esc(addr) + '</span>' + copyBtn(addr, 'address') + '</div>' : '') +
      '<dl class="facts">' + fact('Size', st.size) + fact('Unit', st.unit) + (st.rate ? fact('Monthly rate', money(storageRateTotal([st]))) : '') + fact('Location contact', st.contact) + '</dl>' +
      (codes ? '<div class="codes">' + codes + '</div>' : '') +
      (site ? '<a class="plink" href="' + esc(site) + '" target="_blank" rel="noopener">' + icon('globe', 15, 2) + '<span>' + esc(site.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</span>' + icon('ext', 13, 2) + '</a>' : '') +
      (st.notes ? '<p class="small muted" style="margin:0;white-space:pre-line">' + esc(st.notes) + '</p>' : '') +
      '</div>';
  }

  function storageCard(schoolName, list, hist) {
    if (!list) return '';
    var edit = can('storage.edit');
    var histHtml = (hist && hist.length) ? '<details class="morebox"><summary>Storage changes · ' + hist.length + '</summary>' + hist.map(function (h) {
      return '<div class="hist"><span class="dot" aria-hidden="true"></span><div class="t"><b>' + esc(h.field) + '</b><span>' + (h.oldValue ? '<s>' + esc(h.oldValue) + '</s> to ' : '') + esc(h.newValue || '(blank)') + '</span><span>' + esc(h.by) + ' · ' + esc(relTime(h.at)) + '</span></div></div>';
    }).join('') + '</details>' : '';
    return '<section class="card span-all" aria-labelledby="st-h"><div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="st-h">Storage</h2><span class="hint">' + (list.length ? list.length + ' location' + (list.length === 1 ? '' : 's') : 'Where our products are kept near campus') + '</span></div>' +
      (edit ? '<button type="button" class="btn sm" data-action="add-storage" data-school="' + esc(schoolName) + '">' + icon('plus', 15, 2) + 'Add storage</button>' : '') + '</div>' +
      (list.length ? '<div class="contact-grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">' + list.map(function (st) { return storageItem(st, edit, false); }).join('') + '</div>' : '<div class="empty">No storage location on file for this school.</div>') +
      histHtml + '</section>';
  }

  var STORAGE_TYPES = ['Self storage', 'On campus', 'Semi parking', 'Yard', 'Warehouse', 'Other'];

  function openStorageModal(st, presetSchool) {
    if (!can('storage.edit')) return;
    closePalette();
    var d = state.data;
    var names = {};
    d.schools.forEach(function (s) { names[s.name] = true; });
    (d.locations || []).forEach(function (l) { names[l.school] = true; });
    var v = st || { type: 'Self storage', status: 'Active' };
    var f = function (id, label, val, opts) {
      opts = opts || {};
      return '<div class="field' + (opts.full ? ' full' : '') + '"><label for="s-' + id + '">' + label + (opts.optional ? ' <span class="muted" style="font-weight:400">(optional)</span>' : '') + '</label>' +
        (opts.area ? '<textarea id="s-' + id + '" name="' + id + '" maxlength="1000">' + esc(val || '') + '</textarea>' : '<input id="s-' + id + '" name="' + id + '" value="' + esc(val || '') + '"' + (opts.list ? ' list="' + opts.list + '" autocomplete="off"' : '') + (opts.mode ? ' inputmode="' + opts.mode + '"' : '') + '>') + '</div>';
    };
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="sm-h">' +
      '<div class="card-head"><h2 id="sm-h" style="font-family:var(--display);font-size:20px;font-weight:800">' + (st ? 'Edit storage location' : 'Add a storage location') + '</h2>' +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<form class="form" id="storage-modal-form" data-id="' + esc(st ? st.id : '') + '" novalidate><div class="fields">' +
      f('school', 'School', st ? st.school : (presetSchool || ''), { full: true, list: 's-schools' }) + '<datalist id="s-schools">' + Object.keys(names).sort().map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('') + '</datalist>' +
      '<div class="field"><label for="s-type">Type</label><select id="s-type" name="type">' + STORAGE_TYPES.map(function (t) { return '<option' + (t === v.type ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      f('company', 'Company or place', v.company) +
      f('address', 'Street address', v.address, { full: true }) +
      f('city', 'City', v.city) + f('state', 'State', v.state) + f('zip', 'ZIP', v.zip, { mode: 'numeric' }) + f('size', 'Size', v.size, { optional: true }) +
      f('unit', 'Unit or trailer', v.unit, { optional: true }) + f('rate', 'Monthly rate', v.rate, { optional: true, mode: 'decimal' }) +
      '<span class="legend-title">Access</span>' +
      f('gate', 'Gate code', v.gate, { optional: true }) + f('padlock', 'Padlock', v.padlock, { optional: true }) +
      f('accountEmail', 'Account email', v.accountEmail, { optional: true }) + f('accountLogin', 'Account login', v.accountLogin, { optional: true }) +
      '<span class="legend-title">Details</span>' +
      f('contact', 'Location contact', v.contact, { optional: true }) + f('website', 'Website', v.website, { optional: true }) +
      f('notes', 'Notes', v.notes, { full: true, area: true, optional: true }) +
      (st ? '<div class="field"><label for="s-status">Status</label><select id="s-status" name="status"><option' + (v.status !== 'Closed' ? ' selected' : '') + '>Active</option><option' + (v.status === 'Closed' ? ' selected' : '') + '>Closed</option></select></div>' : '') +
      '</div><div class="formfoot" style="border:0;padding:0"><span class="small muted">Codes are only shown to Managers, On-Field and Campus Managers.</span>' +
      '<button type="submit" class="btn primary">' + (st ? 'Save storage' : icon('plus', 16, 2) + 'Add storage') + '</button></div></form></div></div>';
    var first = $(st || presetSchool ? '#s-company' : '#s-school');
    if (first) first.focus();
  }

  /* ---------------------------------------------------------------- */
  /* Map                                                              */
  /* ---------------------------------------------------------------- */

  var PROGRAM_COLORS = { Rental: '#1F6FB5', Lease: '#5FA02E', Purchase: '#E08A1E', Other: '#8A99A8' };
  var PROGRAMS = ['Rental', 'Lease', 'Purchase', 'Other'];
  var leafletPromise = null;

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      var s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = function () { resolve(window.L); };
      s.onerror = function () { leafletPromise = null; reject(new Error('The map could not load. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
    return leafletPromise;
  }

  function programOf(p) { return PROGRAMS.indexOf(p) !== -1 ? p : 'Other'; }

  function mapPoints() {
    var d = state.data;
    var bySchool = {};
    d.schools.forEach(function (s) { bySchool[norm(s.name)] = s; });
    var seen = {};
    var pts = (d.locations || []).map(function (l) {
      var s = bySchool[norm(l.school)] || null;
      var program = programOf(l.program || (s && s.contract && s.contract.type));
      var key = l.lat.toFixed(3) + ',' + l.lng.toFixed(3);
      var n = seen[key] = (seen[key] || 0) + 1;
      return { id: 'sc:' + l.school, kind: 'school', name: l.school, program: program, lat: l.lat, lng: l.lng + (n - 1) * 0.012, loc: l, school: s };
    });
    (d.storage || []).forEach(function (st) {
      if (st.lat == null || st.lng == null || st.status === 'Closed') return;
      pts.push({ id: 'st:' + st.id, kind: 'storage', name: st.company || st.address || 'Storage', lat: st.lat, lng: st.lng, storage: st });
    });
    return pts;
  }

  function mapFiltered() {
    var m = state.map;
    var q = m.q.trim().toLowerCase();
    return mapPoints().filter(function (p) {
      if (p.kind === 'storage') { if (!m.storage) return false; }
      else {
        if (!m.programs[p.program]) return false;
        if (m.critical && !(p.school && p.school.stockStatus === 'Critical')) return false;
      }
      if (!q) return true;
      var hay = p.kind === 'storage' ? [p.name, p.storage.school, p.storage.city, p.storage.state, p.storage.type].join(' ') : [p.name, p.loc.city, p.loc.state, p.program].join(' ');
      return hay.toLowerCase().indexOf(q) !== -1;
    });
  }

  function miles(a, b) {
    var R = 3958.8, toR = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function viewMap(query) {
    if (!state.map) state.map = { programs: { Rental: true, Lease: true, Purchase: true, Other: true }, storage: true, critical: false, q: '', selected: null };
    var m = state.map;
    m.selected = null;
    if (query.school) m.selected = 'sc:' + query.school;
    if (query.storage) { m.selected = 'st:' + query.storage; m.storage = true; }
    if (query.layer === 'storage') { m.storage = true; m.programs = { Rental: false, Lease: false, Purchase: false, Other: false }; }
    return '<header class="pagehead"><div class="titles"><h1 class="h1">Map</h1><p class="sub">Every school we rent, lease and sell to' + (can('storage') ? ', plus our storage spots' : '') + '. Click a pin to see how it connects.</p></div></header>' +
      '<div class="mapwrap"><aside class="card mappanel" id="map-panel" aria-label="Map details">' + mapPanel() + '</aside>' +
      '<div class="mapbox"><div id="map" role="region" aria-label="Map of schools"><div class="empty" style="margin:20px">Loading the map...</div></div>' +
      '<div class="maplegend">' + PROGRAMS.map(function (p) { return '<span><i style="background:' + PROGRAM_COLORS[p] + '"></i>' + p + '</span>'; }).join('') + (can('storage') ? '<span><i class="sq"></i>Storage</span>' : '') + '<span><i style="background:#fff;border:2px solid #D64545"></i>Critical stock</span></div></div></div>';
  }

  function mapPanel() {
    var m = state.map;
    var all = mapPoints();
    if (m.selected) {
      var p = all.filter(function (x) { return x.id === m.selected; })[0];
      if (p) return p.kind === 'storage' ? mapStorageDetail(p, all) : mapSchoolDetail(p, all);
    }
    var counts = {};
    all.forEach(function (x) { var k = x.kind === 'storage' ? 'storage' : x.program; counts[k] = (counts[k] || 0) + 1; });
    var chips = PROGRAMS.filter(function (p) { return counts[p]; }).map(function (p) {
      return '<button type="button" class="pill sm" data-mapf="' + p + '" aria-pressed="' + !!m.programs[p] + '"><i class="dot" style="background:' + PROGRAM_COLORS[p] + '"></i>' + p + ' · ' + counts[p] + '</button>';
    }).join('') + (counts.storage ? '<button type="button" class="pill sm" data-mapf="storage" aria-pressed="' + m.storage + '"><i class="dot sq"></i>Storage · ' + counts.storage + '</button>' : '') +
      (all.some(function (x) { return x.school && x.school.stockStatus === 'Critical'; }) ? '<button type="button" class="pill sm" data-mapf="critical" aria-pressed="' + m.critical + '">Critical stock only</button>' : '');
    var list = mapFiltered().sort(function (a, b) { return (a.kind === b.kind ? 0 : a.kind === 'school' ? -1 : 1) || a.name.localeCompare(b.name); });
    return '<div class="field"><label for="map-search" class="sr-only">Search the map</label><input id="map-search" type="search" placeholder="Search schools, cities, storage" value="' + esc(m.q) + '" autocomplete="off"></div>' +
      '<div class="row" style="gap:6px">' + chips + '</div>' +
      '<div class="small muted">' + list.length + ' on the map</div>' +
      '<div class="maplist" id="map-list">' + mapListHtml(list) + '</div>';
  }

  function mapListHtml(list) {
    if (!list.length) return '<div class="empty">Nothing matches these filters.</div>';
    return list.map(function (p) {
      var sub = p.kind === 'storage' ? [p.storage.type, p.storage.school].filter(Boolean).join(' · ') : [p.program, [p.loc.city, p.loc.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
      var mark = p.kind === 'storage' ? '<span class="pinmark sq"></span>' : '<span class="pinmark' + (p.school && p.school.stockStatus === 'Critical' ? ' crit' : '') + '" style="background:' + PROGRAM_COLORS[p.program] + '"></span>';
      return '<button type="button" class="maprow" data-mappick="' + esc(p.id) + '">' + mark + '<span class="t"><b>' + esc(p.name) + '</b><span>' + esc(sub) + '</span></span>' + icon('chev', 16) + '</button>';
    }).join('');
  }

  function nearbyStorage(p, all) {
    return all.filter(function (x) { return x.kind === 'storage'; }).map(function (x) {
      return { p: x, mi: miles(p, x), own: norm(x.storage.school) === norm(p.name) };
    }).filter(function (x) { return x.own || x.mi < 60; }).sort(function (a, b) { return (b.own - a.own) || a.mi - b.mi; }).slice(0, 4);
  }

  function mapSchoolDetail(p, all) {
    var s = p.school;
    var l = p.loc;
    var addr = l.address && ((l.zip && l.address.indexOf(l.zip) !== -1) || (l.city && l.address.indexOf(l.city) !== -1)) ? l.address : [l.address, l.city, [l.state, l.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    var contacts = (state.data.contacts || []).filter(function (c) { return c.status === 'Active' && norm(c.school) === norm(p.name); });
    var primary = contacts.filter(function (c) { return c.role === 'Primary'; })[0] || contacts[0];
    var near = nearbyStorage(p, all);
    var block = function (title, inner) { return inner ? '<div class="pblock"><span class="legend-title">' + title + '</span>' + inner + '</div>' : ''; };
    var stock = s && s.products && s.products.length ? s.products.slice(0, 4).map(function (pr) {
      return '<div style="display:flex;flex-direction:column;gap:6px"><div class="card-head"><span style="font-weight:600;font-size:13px">' + esc(pr.label) + '</span>' + (pr.status ? '<span class="badge sm ' + (STOCK_CLASS[pr.status] || 'b-mute') + '">' + esc(pr.status === 'Check' ? 'Check' : pr.status) + '</span>' : '') + '</div>' +
        (pr.ordered != null ? covBar(pr.inStock, pr.ordered, pr.status) + '<span class="small muted">' + (pr.inStock == null ? 'Stock count missing' : fmtNum(pr.inStock) + ' in stock for ' + fmtNum(pr.ordered) + ' ordered') + '</span>' : '') + '</div>';
    }).join('') : '';
    return '<button type="button" class="btn sm" data-action="map-back" style="align-self:flex-start">' + icon('chev', 14, 2).replace('<svg', '<svg style="transform:rotate(180deg)"') + 'All locations</button>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><h2 style="font-family:var(--display);font-size:20px;font-weight:800;margin:0">' + esc(p.name) + '</h2>' +
      '<div class="row" style="gap:6px"><span class="badge sm" style="background:' + PROGRAM_COLORS[p.program] + ';color:#fff">' + esc(p.program) + '</span>' + (s && s.contract ? contractBadge(s.contract) : '') + (s && s.openTasks ? '<span class="badge sm b-info">' + s.openTasks + ' open CM task' + (s.openTasks === 1 ? '' : 's') + '</span>' : '') + '</div></div>' +
      block('Campus', (addr ? '<div class="reachline">' + icon('pin', 14, 2) + '<span>' + esc(addr) + '</span>' + copyBtn(addr, 'address') + '</div>' : '') +
        '<a class="plink" href="' + esc(directionsUrl(l.lat, l.lng, addr)) + '" target="_blank" rel="noopener">' + icon('dir', 15, 2) + '<span>Directions</span>' + icon('ext', 13, 2) + '</a>') +
      block('Stock', stock) +
      block('Contact', primary ? '<div style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px">' + esc(primary.name) + '</b>' + (primary.title ? '<span class="small muted">' + esc(primary.title) + '</span>' : '') + reachLine('mail', primary.email) + reachLine('phone', primary.phone) + '</div>' + (contacts.length > 1 ? '<span class="small muted">+' + (contacts.length - 1) + ' more on the school page</span>' : '') : '') +
      block('Storage nearby', near.map(function (x) {
        return '<button type="button" class="maprow" data-mappick="' + esc(x.p.id) + '"><span class="pinmark sq"></span><span class="t"><b>' + esc(x.p.name) + '</b><span>' + esc(x.p.storage.type || 'Storage') + ' · ' + (x.mi < 0.2 ? 'on campus' : x.mi.toFixed(1) + ' mi away') + (x.own ? '' : ' · ' + esc(x.p.storage.school)) + '</span></span>' + icon('chev', 16) + '</button>';
      }).join('')) +
      (s ? '<a class="btn primary" href="' + schoolHref(s.name) + '">Open school page' + icon('chev', 16, 2) + '</a>' : '<p class="small muted" style="margin:0">' + (p.program === 'Purchase' ? 'A Purchase school. It has no CM Log or rental stock in Pangia.' : 'Not in the Pangia directory yet.') + '</p>');
  }

  function mapStorageDetail(p, all) {
    var st = p.storage;
    var campus = all.filter(function (x) { return x.kind === 'school' && norm(x.name) === norm(st.school); })[0];
    return '<button type="button" class="btn sm" data-action="map-back" style="align-self:flex-start">' + icon('chev', 14, 2).replace('<svg', '<svg style="transform:rotate(180deg)"') + 'All locations</button>' +
      storageItem(st, can('storage.edit'), true) +
      (campus ? '<button type="button" class="maprow" data-mappick="' + esc(campus.id) + '"><span class="pinmark" style="background:' + PROGRAM_COLORS[campus.program] + '"></span><span class="t"><b>' + esc(campus.name) + '</b><span>Campus · ' + (miles(p, campus) < 0.2 ? 'on campus' : miles(p, campus).toFixed(1) + ' mi away') + '</span></span>' + icon('chev', 16) + '</button>' : '');
  }

  function setMapTiles() {
    var L = window.L;
    if (!L || !state.mapObj) return;
    if (state.mapTiles) state.mapObj.removeLayer(state.mapTiles);
    // OpenStreetMap tiles need no key. Dark mode is done with a CSS filter on the tiles.
    state.mapTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, className: 'pangia-tiles', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(state.mapObj);
  }

  function drawMarkers(fit) {
    var L = window.L;
    if (!L || !state.mapObj) return;
    if (state.mapLayer) state.mapObj.removeLayer(state.mapLayer);
    var layer = L.layerGroup();
    var markers = {};
    var pts = mapFiltered();
    pts.forEach(function (p) {
      var mk;
      var sel = state.map.selected === p.id;
      if (p.kind === 'storage') {
        mk = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'stpin' + (sel ? ' sel' : ''), html: '<span>' + icon('box', 12, 2.4) + '</span>', iconSize: [22, 22], iconAnchor: [11, 11] }), keyboard: true, title: p.name });
      } else {
        var crit = p.school && p.school.stockStatus === 'Critical';
        mk = L.circleMarker([p.lat, p.lng], { radius: sel ? 10 : 7, fillColor: PROGRAM_COLORS[p.program], fillOpacity: 1, color: crit ? '#D64545' : (sel ? '#10233A' : '#FFFFFF'), weight: crit || sel ? 3 : 2 });
      }
      mk.bindTooltip(esc(p.name), { direction: 'top', offset: [0, -6] });
      mk.on('click', function () { selectMapPoint(p.id, false); });
      mk.addTo(layer);
      markers[p.id] = mk;
    });
    layer.addTo(state.mapObj);
    state.mapLayer = layer;
    state.mapMarkers = markers;
    if (fit && pts.length) {
      var sel = pts.filter(function (p) { return p.id === state.map.selected; })[0];
      if (sel) state.mapObj.setView([sel.lat, sel.lng], 11);
      else state.mapObj.fitBounds(L.latLngBounds(pts.map(function (p) { return [p.lat, p.lng]; })).pad(0.08), { maxZoom: 9 });
    }
  }

  function selectMapPoint(id, fly) {
    state.map.selected = id;
    var panel = $('#map-panel');
    if (panel) { panel.innerHTML = mapPanel(); panel.scrollTop = 0; }
    drawMarkers(false);
    var p = mapPoints().filter(function (x) { return x.id === id; })[0];
    if (p && state.mapObj && fly) state.mapObj.flyTo([p.lat, p.lng], Math.max(state.mapObj.getZoom(), 10), { duration: 0.6 });
  }

  function initMap() {
    loadLeaflet().then(function (L) {
      var el = $('#map');
      if (!el || parseRoute().name !== 'map') return;
      el.innerHTML = '';
      state.mapObj = L.map(el, { zoomControl: true, worldCopyJump: true }).setView([39.5, -96], 4);
      setMapTiles();
      drawMarkers(true);
    }).catch(function (err) {
      var el = $('#map');
      if (el) el.innerHTML = '<div class="empty" style="margin:20px">' + esc(err.message) + '</div>';
    });
  }

  function destroyMap() {
    if (state.mapObj) { try { state.mapObj.remove(); } catch (e) { /* already gone */ } }
    state.mapObj = null; state.mapLayer = null; state.mapTiles = null; state.mapMarkers = null;
  }

  function repaintMapPanel() {
    var list = $('#map-list');
    var panel = $('#map-panel');
    if (state.map.selected || !list) { if (panel) panel.innerHTML = mapPanel(); }
    else list.innerHTML = mapListHtml(mapFiltered().sort(function (a, b) { return (a.kind === b.kind ? 0 : a.kind === 'school' ? -1 : 1) || a.name.localeCompare(b.name); }));
    drawMarkers(false);
  }

  /* ---------------------------------------------------------------- */
  /* Command palette (Ctrl+K)                                         */
  /* ---------------------------------------------------------------- */

  function paletteItems() {
    var d = state.data;
    var items = [];
    var r = role();
    if (r !== 'School Admin') {
      d.schools.forEach(function (s) {
        var bits = [];
        if (s.health) bits.push('Health ' + s.health.score);
        if (s.contract && s.contract.status === 'Renewing soon') bits.push('Renewal in ' + s.contract.daysLeft + ' days');
        if (s.ordered != null) bits.push(fmtNum(s.inStock) + ' of ' + fmtNum(s.ordered) + ' in stock');
        items.push({ group: 'Schools', tag: initials(s.name), label: s.name, sub: bits.join(' · ') || s.products.map(function (p) { return p.label; }).join(', '), href: schoolHref(s.name), words: s.products.map(function (p) { return p.label; }).join(' ') });
      });
    }
    if (can('contacts')) {
      (d.contacts || []).forEach(function (ct) {
        if (ct.status !== 'Active') return;
        items.push({ group: 'People', tag: initials(ct.name), label: ct.name, sub: [ct.role, ct.title, ct.school].filter(Boolean).join(' · '), href: schoolHref(ct.school) + '?contact=' + encodeURIComponent(ct.id), words: ct.email + ' ' + ct.phone, contactSchool: ct.school });
      });
    }
    d.schools.forEach(function (s) {
      ['cm', 'delivery', 'collection'].forEach(function (t) {
        var u = safeUrl(s[LOG_FIELD[t]]);
        if (u) items.push({ group: 'Logs', tag: t === 'cm' ? 'CM' : t === 'delivery' ? 'DL' : 'CL', label: s.name + ' ' + LOG_NAMES[t], sub: 'Opens in Google Sheets', href: u, external: true });
      });
    });
    (d.storage || []).forEach(function (st) {
      if (st.status === 'Closed') return;
      items.push({ group: 'Storage', tag: icon('box', 16), raw: true, label: st.company || st.address, sub: [st.type, st.school, st.city].filter(Boolean).join(' · '), href: '#/map?storage=' + encodeURIComponent(st.id), words: 'storage ' + st.unit + ' ' + st.address });
    });
    if (r !== 'School Admin') items.push({ group: 'Go to', tag: icon('home', 16), label: 'Home', sub: 'Your overview', href: '#/', raw: true });
    if (can('directory')) items.push({ group: 'Go to', tag: icon('school', 16), label: 'Schools', sub: 'The full directory', href: '#/schools', raw: true });
    if (can('contacts')) items.push({ group: 'Go to', tag: icon('users', 16), label: 'Contacts', sub: 'Everyone we work with at each school', href: '#/contacts', raw: true });
    if (can('map')) items.push({ group: 'Go to', tag: icon('map', 16), label: 'Map', sub: 'Schools and storage on a map', href: '#/map', raw: true });
    if (can('contract.docs')) items.push({ group: 'Go to', tag: icon('file', 16), label: 'Contracts', sub: 'Contract status and renewals', href: '#/contracts', raw: true });
    if (can('contacts.edit')) items.push({ group: 'Actions', tag: icon('plus', 16), label: 'Add a contact', sub: 'Contacts', action: 'add-contact', raw: true });
    if (can('storage.edit')) items.push({ group: 'Actions', tag: icon('plus', 16), label: 'Add a storage location', sub: 'Storage', action: 'add-storage', raw: true });
    if (r === 'Manager') {
      items.push({ group: 'Actions', tag: icon('plus', 16), label: 'Add a contract', sub: 'Contracts', href: '#/contracts', raw: true });
      items.push({ group: 'Actions', tag: icon('refresh', 16), label: 'Refresh the directory', sub: 'Re-read logs, inventory and contracts', action: 'refresh', raw: true });
    }
    items.push({ group: 'Actions', tag: icon(isDark() ? 'sun' : 'moon', 16), label: isDark() ? 'Switch to light mode' : 'Switch to dark mode', sub: 'Appearance', action: 'theme', raw: true });
    items.push({ group: 'Actions', tag: icon('logout', 16), label: 'Sign out', sub: state.data.user.email, action: 'signout', raw: true });
    return items;
  }

  function openPalette() {
    if (!state.data || state.palette.open) return;
    state.palette = { open: true, query: '', index: 0, items: [] };
    $('#palette-root').innerHTML = '<div class="overlay" data-action="palette-bg"><div class="palette" role="dialog" aria-modal="true" aria-label="Search Pangia">' +
      '<div class="q">' + icon('search', 22, 2) + '<label for="pal-q" class="sr-only">Search Pangia</label><input id="pal-q" type="text" autocomplete="off" spellcheck="false" placeholder="Search schools, people, logs or actions" role="combobox" aria-expanded="true" aria-controls="pal-list"><kbd>Esc</kbd></div>' +
      '<div class="results" id="pal-list" role="listbox"></div>' +
      '<div class="foot"><span><kbd>↑ ↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Ctrl K</kbd> anywhere in Pangia</span></div></div></div>';
    paintPalette();
    $('#pal-q').focus();
  }

  function closePalette() {
    if (!state.palette.open) return;
    state.palette.open = false;
    $('#palette-root').innerHTML = '';
  }

  function paintPalette() {
    var q = state.palette.query.trim().toLowerCase();
    var all = paletteItems();
    var hits = all.filter(function (it) {
      if (!q) return it.group !== 'Logs' && it.group !== 'People' && it.group !== 'Storage';
      var hay = (it.label + ' ' + (it.sub || '') + ' ' + (it.words || '')).toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    });
    var groups = ['Schools', 'People', 'Storage', 'Go to', 'Logs', 'Actions'];
    var flat = [];
    var html = '';
    groups.forEach(function (g) {
      var inGroup = hits.filter(function (h) { return h.group === g; }).slice(0, q ? 6 : 5);
      if (!inGroup.length) return;
      html += '<div class="group">' + g + '</div>';
      inGroup.forEach(function (it) {
        var i = flat.length;
        flat.push(it);
        html += '<button type="button" class="item' + (i === state.palette.index ? ' sel' : '') + '" role="option" aria-selected="' + (i === state.palette.index) + '" data-pal="' + i + '">' +
          '<span class="tag">' + (it.raw ? it.tag : esc(it.tag)) + '</span><span class="t"><b>' + esc(it.label) + '</b><span>' + esc(it.sub || '') + '</span></span>' +
          (it.external ? icon('ext', 16) : (i === state.palette.index ? '<kbd>Enter</kbd>' : '')) + '</button>';
      });
    });
    if (!flat.length) html = '<div class="empty" style="margin:16px">Nothing matches "' + esc(state.palette.query) + '". Try a school name or a log.</div>';
    state.palette.items = flat;
    if (state.palette.index >= flat.length) state.palette.index = Math.max(0, flat.length - 1);
    $('#pal-list').innerHTML = html;
    var sel = $('#pal-list .item.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function runPaletteItem(i) {
    var it = state.palette.items[i];
    if (!it) return;
    closePalette();
    if (it.action) return doAction(it.action);
    if (it.external) return window.open(it.href, '_blank', 'noopener');
    if (location.hash === it.href) renderRoute(); else location.hash = it.href;
  }

  /* ---------------------------------------------------------------- */
  /* Actions & events                                                 */
  /* ---------------------------------------------------------------- */

  function doAction(name, el) {
    if (name === 'theme') { toggleTheme(); if (state.palette.open) paintPalette(); return; }
    if (name === 'signout') return signOut();
    if (name === 'retry') return boot();
    if (name === 'palette') return openPalette();
    if (name === 'no-log') return toast('This log is not connected yet.');
    if (name === 'copy' && el) {
      var val = el.getAttribute('data-copy') || '';
      if (navigator.clipboard) navigator.clipboard.writeText(val).then(function () { toast('Copied ' + val.split('\n')[0]); }, function () { toast(val); });
      else toast(val);
      return;
    }
    if (name === 'copy-emails') {
      var list = filteredContacts().map(function (c) { return c.email; }).filter(Boolean);
      var joined = list.filter(function (x, i) { return list.indexOf(x) === i; }).join(', ');
      if (navigator.clipboard) navigator.clipboard.writeText(joined).then(function () { toast(list.length + ' emails copied'); }, function () { toast(joined); });
      else toast(joined);
      return;
    }
    if (name === 'add-contact') return openContactModal(null, (el && el.getAttribute('data-school')) || currentSchoolName() || state.contactSchool);
    if (name === 'edit-contact' && el) {
      var id = el.getAttribute('data-id');
      var ct = (state.data.contacts || []).filter(function (c) { return c.id === id; })[0];
      if (ct) openContactModal(ct);
      return;
    }
    if (name === 'close-modal') return closeModal();
    if (name === 'add-storage') return openStorageModal(null, (el && el.getAttribute('data-school')) || currentSchoolName());
    if (name === 'edit-storage' && el) {
      var sid = el.getAttribute('data-id');
      var stv = (state.data.storage || []).filter(function (x) { return x.id === sid; })[0];
      if (stv) openStorageModal(stv);
      return;
    }
    if (name === 'map-back') { state.map.selected = null; var mp = $('#map-panel'); if (mp) mp.innerHTML = mapPanel(); drawMarkers(false); return; }
    if (name === 'copy-link') {
      var text = location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast('Link copied'); }, function () { toast(text); });
      else toast(text);
      return;
    }
    if (name === 'refresh') {
      var btn = $('[data-action="refresh"]');
      if (btn) btn.classList.add('spin');
      toast('Refreshing the directory. This can take a minute.');
      return api('refresh').then(function (data) {
        state.data = data;
        state.schoolCache = {};
        renderRoute();
        toast('Directory refreshed');
      }).catch(function (err) {
        if (btn) btn.classList.remove('spin');
        if (err.code !== 'auth_expired') toast(err.message, true);
      });
    }
    if (name === 'undo' && el) {
      el.disabled = true;
      return api('undoChange', { id: el.getAttribute('data-id') }).then(function (res) {
        applyRegResult(res);
        toast('Change undone');
      }).catch(function (err) {
        el.disabled = false;
        if (err.code !== 'auth_expired') toast(err.message, true);
      });
    }
  }

  function applyRegResult(res) {
    var route = parseRoute();
    if (role() === 'School Admin') {
      state.data.registered = res.registered;
      state.data.history = res.history;
      renderRoute();
    } else if (route.name === 'school') {
      var c = state.schoolCache[route.school];
      if (c) { c.registered = res.registered; c.history = res.history; paintSchool(route.school, c); }
    }
  }

  document.addEventListener('click', function (e) {
    var pal = e.target.closest('[data-pal]');
    if (pal) { e.preventDefault(); return runPaletteItem(Number(pal.getAttribute('data-pal'))); }
    if (e.target.matches('[data-action="palette-bg"]')) return closePalette();
    if (e.target.matches('[data-action="modal-bg"]')) return closeModal();
    var act = e.target.closest('[data-action]');
    if (act && act.getAttribute('data-action') !== 'palette-bg' && act.getAttribute('data-action') !== 'modal-bg') {
      e.preventDefault();
      return doAction(act.getAttribute('data-action'), act);
    }
    var mpick = e.target.closest('[data-mappick]');
    if (mpick) return selectMapPoint(mpick.getAttribute('data-mappick'), true);
    var mf = e.target.closest('[data-mapf]');
    if (mf) {
      var k = mf.getAttribute('data-mapf');
      if (k === 'storage') state.map.storage = !state.map.storage;
      else if (k === 'critical') state.map.critical = !state.map.critical;
      else state.map.programs[k] = !state.map.programs[k];
      var pnl = $('#map-panel');
      if (pnl) pnl.innerHTML = mapPanel();
      drawMarkers(true);
      return;
    }
    var cf = e.target.closest('[data-cfilter]');
    if (cf) {
      state.contactFilter = cf.getAttribute('data-cfilter');
      return repaintContacts();
    }
    var f = e.target.closest('[data-filter]');
    if (f) {
      state.filter = f.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === f)); });
      var rows = $('#school-rows');
      if (rows) rows.innerHTML = schoolRows();
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'school-search') {
      state.search = e.target.value;
      var rows = $('#school-rows');
      if (rows) rows.innerHTML = schoolRows();
    } else if (e.target.id === 'map-search') {
      state.map.q = e.target.value;
      repaintMapPanel();
    } else if (e.target.id === 'contact-search') {
      state.contactSearch = e.target.value;
      repaintContacts();
    } else if (e.target.id === 'log-search') {
      state.logSearch = e.target.value;
      var lr = $('#log-rows');
      if (lr) lr.innerHTML = logRows(e.target.getAttribute('data-type'));
    } else if (e.target.id === 'pal-q') {
      state.palette.query = e.target.value;
      state.palette.index = 0;
      paintPalette();
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'contact-school') {
      state.contactSchool = e.target.value;
      repaintContacts();
    }
  });

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.id === 'storage-modal-form') {
      e.preventDefault();
      var se = form.elements;
      var sp = { id: form.getAttribute('data-id') };
      ['school', 'type', 'company', 'address', 'city', 'state', 'zip', 'size', 'unit', 'rate', 'gate', 'padlock', 'accountEmail', 'accountLogin', 'contact', 'website', 'notes'].forEach(function (k) { sp[k] = se[k] ? se[k].value.trim() : ''; });
      sp.status = se.status ? se.status.value : 'Active';
      if (!sp.school) { toast('Pick a school for this storage location.', true); return; }
      if (!sp.company && !sp.address) { toast('Add the storage company or the address.', true); return; }
      var sbtn = form.querySelector('[type="submit"]');
      sbtn.disabled = true; sbtn.textContent = 'Saving...';
      api('saveStorage', sp).then(function (res) {
        state.data.storage = res.storage;
        if (res.locations) state.data.locations = res.locations;
        if (res.school) state.schoolCache[sp.school] = res.school;
        closeModal();
        toast(!res.changed ? 'No changes to save.' : sp.id ? 'Storage saved. The change is in the history.' : 'Storage location added');
        renderRoute();
      }).catch(function (err) {
        sbtn.disabled = false; sbtn.textContent = sp.id ? 'Save storage' : 'Add storage';
        if (err.code !== 'auth_expired') toast(err.message, true);
      });
      return;
    }
    if (form.id === 'contact-modal-form') {
      e.preventDefault();
      var el = form.elements;
      var cp = { id: form.getAttribute('data-id'), school: el.school.value.trim(), role: el.role.value, name: el.name.value.trim(), title: el.title.value.trim(),
        email: el.email.value.trim(), phone: el.phone.value.trim(), status: el.status ? el.status.value : 'Active', reviewed: !!(el.reviewed && el.reviewed.checked) };
      if (!cp.school) { toast('Pick a school for this contact.', true); return; }
      if (!cp.name) { toast('Enter the contact\'s name.', true); return; }
      if (cp.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cp.email)) { toast('Please enter a valid email address.', true); return; }
      if (!cp.email && !cp.phone) { toast('Add an email or a phone number.', true); return; }
      var mb = form.querySelector('[type="submit"]');
      mb.disabled = true; mb.textContent = 'Saving...';
      api('saveContact', cp).then(function (res) {
        state.data.contacts = res.contacts;
        if (res.school) state.schoolCache[cp.school] = res.school;
        closeModal();
        toast(!res.changed ? 'No changes to save.' : cp.id ? 'Contact saved. The change is in the history.' : 'Contact added');
        renderRoute();
      }).catch(function (err) {
        mb.disabled = false; mb.textContent = cp.id ? 'Save contact' : 'Add contact';
        if (err.code !== 'auth_expired') toast(err.message, true);
      });
      return;
    }
    if (form.id === 'reg-form') {
      e.preventDefault();
      var values = {};
      (state.data.regFields || []).forEach(function (f) { var el = form.elements[f.key]; if (el) values[f.key] = el.value.trim(); });
      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { toast('Please enter a valid email address.', true); return; }
      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true; btn.textContent = 'Saving...';
      api('saveRegisteredInfo', { school: form.getAttribute('data-school'), values: values }).then(function (res) {
        applyRegResult(res);
        toast(res.changed ? 'Saved. College Products has been notified.' : 'No changes to save.');
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = 'Save changes';
        if (err.code !== 'auth_expired') toast(err.message, true);
      });
    } else if (form.classList.contains('contract-edit')) {
      e.preventDefault();
      var payload = { row: Number(form.getAttribute('data-row')), school: form.getAttribute('data-school'), start: form.elements.start.value, end: form.elements.end.value, type: form.elements.type.value, pdf: form.elements.pdf.value.trim(), note: form.elements.note.value.trim() };
      if (!payload.start || !payload.end) { toast('Start and end dates are required.', true); return; }
      if (payload.end < payload.start) { toast('The end date must be after the start date.', true); return; }
      var sb = form.querySelector('[type="submit"]');
      sb.disabled = true; sb.textContent = 'Saving...';
      api('updateContract', payload).then(function (res) {
        state.data = res.boot;
        state.schoolCache[payload.school] = res.school;
        toast(res.changed ? 'Contract saved. The change is in the history.' : 'No changes to save.');
        renderRoute();
      }).catch(function (err) {
        sb.disabled = false; sb.textContent = 'Save contract';
        if (err.code !== 'auth_expired') toast(err.message, true);
      });
    } else if (form.id === 'contract-form') {
      e.preventDefault();
      var data = { school: form.elements.school.value.trim(), type: form.elements.type.value, start: form.elements.start.value, end: form.elements.end.value, pdf: form.elements.pdf.value.trim() };
      if (!data.school || !data.start || !data.end) { toast('School, start date and end date are required.', true); return; }
      if (data.end < data.start) { toast('The end date must be after the start date.', true); return; }
      var b = form.querySelector('[type="submit"]');
      b.disabled = true; b.textContent = 'Saving...';
      api('addContract', data).then(function (res) {
        state.data = res;
        state.schoolCache = {};
        toast('Contract saved for ' + data.school);
        location.hash = schoolHref(data.school);
      }).catch(function (err) {
        b.disabled = false; b.textContent = 'Save contract';
        if (err.code !== 'auth_expired') toast(err.message, true);
      });
    }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      closeModal();
      if (state.palette.open) closePalette(); else openPalette();
      return;
    }
    if (state.modal && e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (!state.palette.open) return;
    if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); state.palette.index = Math.min(state.palette.index + 1, state.palette.items.length - 1); paintPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); state.palette.index = Math.max(state.palette.index - 1, 0); paintPalette(); }
    else if (e.key === 'Enter' && e.target.id === 'pal-q') { e.preventDefault(); runPaletteItem(state.palette.index); }
  });

  window.addEventListener('hashchange', renderRoute);

  /* ---------------------------------------------------------------- */
  /* Start                                                            */
  /* ---------------------------------------------------------------- */

  function start() {
    if ($('#splash')) showSplash();
    if (!CFG.API_URL || !/^https:\/\//.test(CFG.API_URL)) { renderSetupNeeded(); return; }
    var saved = null;
    try { saved = sessionStorage.getItem('pangia_token'); } catch (e) { /* ignore */ }
    if (saved && tokenValid(saved)) { state.token = saved; boot(); }
    else renderSignIn();
    waitForGsi(initGsi);
  }

  start();
})();
