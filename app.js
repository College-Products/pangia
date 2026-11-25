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
    assets: null,
    fin: null,
    finTab: null,
    finStatus: 'Open',
    exFilter: 'all',
    inv: null,
    invTab: 'stock',
    invKind: 'all',
    invQ: '',
    invType: 'All',
    invLogQ: '',
    tax: null,
    taxKind: 'quarter',
    taxPeriod: '',
    ye: null,
    yeYear: null,
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
    dir: 'M12 2l8 8-8 8-8-8 8-8zM9 11h4V9l3 3-3 3v-2H10v2',
    library: 'M4 4h4v16H4zM10 4h4v16h-4zM16.5 4.6l3.8-1 3.7 15.5-3.8.9z',
    dollar: 'M12 2v20M17 6.5C16 5 14.3 4.5 12 4.5c-3 0-4.5 1.6-4.5 3.5 0 4.6 9.5 2.6 9.5 7.6 0 2-1.8 3.9-5 3.9-2.6 0-4.3-.8-5.3-2.4'
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
      return '<button type="button" class="' + cls + (state.monthOpen === i ? ' open' : '') + '" data-month="' + i + '" aria-expanded="' + (state.monthOpen === i) + '"><div class="bar"><i class="dot" style="background:' + dot + '"></i></div><span>' + n + '</span></button>';
    }).join('');
    return '<div class="months"><div class="month-row" role="group" aria-label="Season calendar, today is in ' + names[now.getMonth()] + '. Pick a month for details.">' + cells + '</div>' +
      (state.monthOpen != null ? monthDetail(state.monthOpen) : '') +
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
    themeJoke(dark);
  }

  var TO_LIGHT = ['Flashbang out! Shield your eyes.', 'AAH, MY EYES. Light mode activated.', 'Sunglasses recommended beyond this point.', 'You chose violence. Light mode is on.'];
  var TO_DARK = ['Ahh, so much better.', 'Welcome back to the dark side.', 'Your retinas thank you.'];
  var lastJoke = -1;
  function themeJoke(dark) {
    var list = dark ? TO_DARK : TO_LIGHT;
    var i = Math.floor(Math.random() * list.length);
    if (i === lastJoke) i = (i + 1) % list.length;
    lastJoke = i;
    if (!dark && !calmMotion()) {
      var f = document.createElement('div');
      f.className = 'flashbang';
      f.setAttribute('aria-hidden', 'true');
      document.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 900);
    }
    toast(list[i]);
  }
  function toast(msg, isErr) {
    var root = $('#toast-root');
    var el = document.createElement('div');
    el.className = 'toast' + (isErr ? ' err' : '');
    // Hitchhiker's easter egg: every error ends calmly.
    el.textContent = isErr && !/don't panic/i.test(msg) ? String(msg).replace(/\s*$/, '') + " Don't Panic." : msg;
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
    toast('So long, and thanks for all the fish.');
    dolphinLeap();
  }

  // A Babel fish swims past the search box when someone searches in Spanish.
  var babelShown = 0;
  function babelFish(q) {
    if (calmMotion() || Date.now() - babelShown < 20000) return;
    if (!/[\u00f1\u00bf\u00a1]|\b(hola|escuela|universidad|buscar|d[o\u00f3]nde|gracias|contrato|almac[e\u00e9]n)\b/i.test(q)) return;
    var box = $('.palette');
    if (!box) return;
    babelShown = Date.now();
    var f = document.createElement('div');
    f.className = 'babel';
    f.setAttribute('aria-hidden', 'true');
    f.title = 'Babel fish';
    f.innerHTML = '<svg width="30" height="16" viewBox="0 0 30 16"><path d="M2 8c4-6 12-7 18-3l6-4-1 7 1 7-6-4C14 15 6 14 2 8z" fill="#F5C542"/><circle cx="7" cy="7" r="1.1" fill="#054D80"/><path d="M12 5c1 2 1 4 0 6" stroke="#E0A42A" stroke-width="1" fill="none"/></svg>';
    box.appendChild(f);
    toast('A Babel fish swam by. Pangia still only speaks English, sorry.');
    setTimeout(function () { f.remove(); }, 2600);
  }

  function viewLost() {
    return '<section class="lost"><div class="petunias" aria-hidden="true"><svg width="120" height="120" viewBox="0 0 120 120">' +
      '<path d="M34 70h52l-6 30a6 6 0 0 1-6 5H46a6 6 0 0 1-6-5z" fill="#C8723C"/><rect x="30" y="64" width="60" height="9" rx="3" fill="#A85A2C"/>' +
      '<path d="M60 64V44M48 64l-6-14M72 64l6-14" stroke="#5FA02E" stroke-width="3" stroke-linecap="round"/>' +
      '<g fill="#B05CC8"><circle cx="60" cy="38" r="8"/><circle cx="40" cy="46" r="7"/><circle cx="80" cy="46" r="7"/></g>' +
      '<g fill="#F5E6FA"><circle cx="60" cy="38" r="2.6"/><circle cx="40" cy="46" r="2.3"/><circle cx="80" cy="46" r="2.3"/></g></svg></div>' +
      '<h1 class="h1" style="margin:0">Oh no, not again.</h1><p class="sub" style="margin:0">This page doesn\'t exist. The link may be old or mistyped.</p>' +
      '<a class="btn primary" href="#/">Back to home</a></section>';
  }

  function calmMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  // A tiny dolphin leaps across the bottom of the screen once.
  function dolphinLeap() {
    if (calmMotion()) return;
    var d = document.createElement('div');
    d.className = 'dolphin';
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<svg width="46" height="30" viewBox="0 0 46 30"><path d="M3 20c6-9 16-13 27-11 4 1 8 3 10 6l4-1-2 4c-2 3-6 4-10 4-3 0-5-1-7-1l-3 5-1-5c-6-1-12-1-18-1z" fill="#1F6FB5"/><path d="M19 9l4-6 2 7z" fill="#1F6FB5"/><circle cx="36.5" cy="14.5" r="1.1" fill="#fff"/><path d="M8 21c7 1 14 2 22 1" stroke="#9CC9EE" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 3200);
  }

  // A few tiny stars burst out around an element.
  function starBurst(el) {
    if (calmMotion() || !el) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 8; i++) {
      var s = document.createElement('span');
      var a = i / 8 * Math.PI * 2 + Math.random() * .4, dist = 26 + Math.random() * 18;
      s.className = 'star42';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = i % 3 ? '\u2726' : '\u2727';
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.setProperty('--dx', Math.cos(a) * dist + 'px'); s.style.setProperty('--dy', Math.sin(a) * dist + 'px');
      s.style.color = i % 2 ? '#80BC41' : '#F5C542';
      document.body.appendChild(s);
      (function (n) { setTimeout(function () { n.remove(); }, 1000); })(s);
    }
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
    // 1 in 42 loads ends on a different line.
    if (Math.random() < 1 / 42) SPLASH_MSGS[SPLASH_MSGS.length - 1] = 'Computing the answer. ETA 7.5 million years';
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
    var invLink = can('inventory') ? navLink('#/inventory', 'layers', 'Inventory', r === 'inventory') : '';
    var logNav = '<span class="nav-label">Logs</span>' +
      navLink('#/logs/cm', 'cm', 'CM Logs', route.type === 'cm', u.role === 'Campus Manager' && d.schools.reduce(function (a, s) { return a + (s.openTasks || 0); }, 0) ? '<span class="count">' + d.schools.reduce(function (a, s) { return a + (s.openTasks || 0); }, 0) + '</span>' : '') +
      navLink('#/logs/delivery', 'delivery', 'Delivery Logs', route.type === 'delivery') +
      navLink('#/logs/collection', 'collection', 'Collection Logs', route.type === 'collection');
    var appNav = (d.apps || []).length ? '<span class="nav-label">Apps</span>' + d.apps.map(function (a) { return extLink(a.url, a.icon || 'ext', a.name); }).join('') : '';
    if (u.role === 'Manager' || isTeam()) {
      var renewCount = d.schools.filter(function (s) { return s.contract && s.contract.status === 'Renewing soon'; }).length;
      var reviewCount = can('contacts.review') ? (d.contacts || []).filter(function (ct) { return ct.review && ct.status === 'Active'; }).length : 0;
      nav = navLink('#/', 'home', 'Home', r === 'home') +
        '<span class="nav-label">Directory</span>' +
        navLink('#/schools', 'school', 'Schools', r === 'schools' || r === 'school') +
        (can('contacts') ? navLink('#/contacts', 'users', 'Contacts', r === 'contacts', reviewCount ? '<span class="count">' + reviewCount + '</span>' : '') : '') +
        (can('contract.docs') ? navLink('#/contracts', 'file', 'Contracts', r === 'contracts', renewCount ? '<span class="count">' + renewCount + '</span>' : '') : '') +
        (can('map') ? navLink('#/map', 'map', 'Map', r === 'map') : '') +
        (can('assets') ? navLink('#/assets', 'library', 'Asset Library', r === 'assets') : '') +
        invLink +
        (can('finance') ? '<span class="nav-label">Finance</span>' + navLink('#/finance', 'dollar', 'Invoices and tax', r === 'finance') : '') +
        (can('logs') ? logNav : '') + appNav;
    } else if (u.role === 'Campus Manager') {
      nav = navLink('#/', 'school', 'My schools', r === 'home' || r === 'school') +
        (can('contacts') ? navLink('#/contacts', 'users', 'Contacts', r === 'contacts') : '') +
        (can('map') ? navLink('#/map', 'map', 'Map', r === 'map') : '') +
        (can('assets') ? navLink('#/assets', 'library', 'Asset Library', r === 'assets') : '') +
        logNav + appNav;
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
      '<aside class="side"><a class="brand" href="#/">' + logo() + '<span><b>Pangia' + towel() + '</b><small>by College Products</small></span></a>' +
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
    if (parts[0] && ['school', 'logs', 'schools', 'contracts', 'contacts', 'map', 'assets', 'finance', 'inventory'].indexOf(parts[0]) === -1) return { name: 'lost', query: query };
    if (parts[0] === 'school' && parts[1]) return { name: 'school', school: decodeURIComponent(parts.slice(1).join('/')), query: query };
    if (parts[0] === 'logs' && LOG_NAMES[parts[1]]) return { name: 'logs', type: parts[1], query: query };
    if (parts[0] === 'schools' && can('directory')) return { name: 'schools', query: query };
    if (parts[0] === 'contracts' && can('contract.docs')) return { name: 'contracts', query: query };
    if (parts[0] === 'contacts' && can('contacts')) return { name: 'contacts', query: query };
    if (parts[0] === 'map' && can('map')) return { name: 'map', query: query };
    if (parts[0] === 'assets' && can('assets')) return { name: 'assets', query: query };
    if (parts[0] === 'finance' && can('finance')) return { name: 'finance', query: query };
    if (parts[0] === 'inventory' && can('inventory')) return { name: 'inventory', query: query };
    return { name: 'home', query: query };
  }

  function renderRoute(isRefresh) {
    if (!state.data) return;
    closePalette();
    closeModal();
    destroyMap();
    if (state.homeMap) { try { state.homeMap.remove(); } catch (e) { /* gone */ } state.homeMap = null; }
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
    else if (route.name === 'assets') html = viewAssets(route.query);
    else if (route.name === 'finance') html = viewFinance(route.query);
    else if (route.name === 'inventory') html = viewInventory(route.query);
    else if (route.name === 'lost') html = viewLost();
    else if (r === 'Manager') html = viewManagerHome();
    else if (isTeam()) html = viewTeamHome();
    else if (r === 'Campus Manager') html = viewCampusHome();
    else html = viewAdminHome();
    renderShell(route, html);
    hideSplash();
    window.scrollTo(0, 0);
    if (route.name === 'home' && (r === 'Manager' || isTeam())) {
      if (r === 'Manager') initHomeMap();
      if (!isRefresh) countUp($('#app'));
      startAutoRefresh();
    }
    if (route.name === 'school' && r !== 'School Admin') loadSchool(route.school);
    if (route.name === 'map') initMap(route.query);
    if (route.name === 'inventory') loadInventory(true).then(paintInventory).catch(function (err) { if (err.code !== 'auth_expired') { var b = $('#inv-body'); if (b) b.innerHTML = '<div class="empty">' + esc(err.message) + '</div>'; } });
    if (route.name === 'finance') loadFinance(true).then(paintFinance).catch(function (err) { if (err.code !== 'auth_expired') { var b = $('#fin-body'); if (b) b.innerHTML = '<div class="empty">' + esc(err.message) + '</div>'; } });
  }

  /* ---------------------------------------------------------------- */
  /* Shared view pieces                                               */
  /* ---------------------------------------------------------------- */

  function isTowelDay() { var n = new Date(); return n.getMonth() === 4 && n.getDate() === 25; }
  function towel() {
    return isTowelDay() ? '<span class="towel" title="Happy Towel Day. Do you know where your towel is?" aria-label="Towel Day"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.5" fill="#80BC41"/><path d="M2 6h12M2 10h12" stroke="#fff" stroke-width="1"/></svg></span>' : '';
  }

  function greeting() {
    if (isTowelDay()) return 'Happy Towel Day';
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

    var web7 = (d.trends || []).slice(-7).reduce(function (a, r) { return a + (r.web || 0); }, 0);
    var kpis = [
      { key: 'schools', label: 'Partner schools', value: schools.length, note: noContract ? noContract + ' without a contract on file' : 'All contracts on file', cls: noContract ? 'b-mute' : 'b-good', trend: sparkline('schools') },
      { key: 'health', label: 'Average health score', value: avg == null ? '-' : avg, note: avg == null ? 'No data yet' : avg >= 80 ? 'Healthy' : avg >= 50 ? 'Some schools need attention' : 'Needs attention', cls: avg == null ? 'b-mute' : avg >= 80 ? 'b-good' : avg >= 50 ? 'b-warn' : 'b-bad', trend: sparkline('health') },
      { key: 'renewals', label: 'Renewals in 90 days', value: renewals.length, note: renewals.length ? 'Next in ' + renewals[0].contract.daysLeft + ' days' : 'Nothing due', cls: renewals.length ? 'b-warn' : 'b-good', trend: sparkline('renewals', true) },
      { key: 'critical', label: 'Critical stock', value: critical, note: critical ? 'Schools to restock' : 'No critical schools', cls: critical ? 'b-bad' : 'b-good', trend: sparkline('critical', true) }
    ];
    if ((d.trends || []).some(function (r) { return r.web != null; })) kpis.push({ key: 'web', label: 'Web orders, last 7 days', value: web7, note: 'From WooCommerce', cls: 'b-mute', trend: sparkline('web') });

    var cards = {
      todo: todoStrip(),
      kpis: '<section class="kpis" aria-label="Summary">' + kpis.map(function (k) {
        var num = typeof k.value === 'number';
        return '<div class="kpi"><span class="label">' + esc(k.label) + '</span><span class="value"' + (num ? ' data-count="' + k.value + '" data-key="' + k.key + '"' : '') + '>' + esc(num ? fmtNum(k.value) : k.value) + '</span><span class="badge ' + k.cls + '" style="align-self:flex-start">' + esc(k.note) + '</span>' + k.trend + '</div>';
      }).join('') + '</section>',
      attention: '<section class="card" aria-labelledby="att-h"><div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="att-h">Schools needing attention</h2><span class="hint">Lowest health scores first</span></div><a href="#/schools">See all</a></div>' +
        (attention.length ? attention.map(function (s) {
          return '<a class="rowlink" href="' + schoolHref(s.name) + '">' + ring(s.health.score) + '<span class="t"><b>' + esc(s.name) + '</b><span>' + esc(reasonFor(s)) + '</span></span>' + icon('chev', 16) + '</a>';
        }).join('') : '<div class="empty">No schools found yet.</div>') + '</section>',
      renewals: '<section class="card" aria-labelledby="ren-h"><div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="ren-h">Renewals, next 90 days</h2><span class="hint">Reminders go out 60 and 30 days before the end date</span></div></div>' +
        (renewals.length ? renewals.slice(0, 4).map(function (s) {
          var end = toDate(s.contract.end);
          var dl = s.contract.daysLeft;
          var r60 = new Date(end.getTime() - 60 * 86400000);
          var r30 = new Date(end.getTime() - 30 * 86400000);
          var note = dl <= 30 ? '30-day reminder sent' : dl <= 60 ? '60-day reminder sent, next on ' + fmtDate(r30.toISOString(), { month: 'short', day: 'numeric' }) : '60-day reminder goes out ' + fmtDate(r60.toISOString(), { month: 'short', day: 'numeric' });
          return '<a class="renewal" href="' + schoolHref(s.name) + '"><span class="cal"><small>' + esc(fmtDate(s.contract.end, { month: 'short' })) + '</small><b>' + end.getDate() + '</b></span>' +
            '<span class="t" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><b style="font-size:14px">' + esc(s.name) + '</b><span class="small muted">' + esc(note) + '</span></span>' +
            '<span class="badge ' + (dl <= 30 ? 'b-bad' : 'b-warn') + '">' + dl + ' days</span></a>';
        }).join('') : '<div class="empty">No contracts end in the next 90 days.</div>') + '</section>',
      map: homeMapCard(),
      activity: '<section class="card" aria-labelledby="act-h" style="gap:4px"><div class="card-head" style="margin-bottom:10px"><h2 id="act-h">Activity</h2><span class="live"><i></i>Live</span></div>' +
        activityList(d.activity, true) + '</section>'
    };
    var prefs = homePrefs();
    var wide = { todo: true, kpis: true };
    var html = '', grid = '';
    prefs.order.forEach(function (k) {
      if (prefs.hidden.indexOf(k) !== -1 || !cards[k]) return;
      if (wide[k]) { if (grid) { html += '<div class="homegrid">' + grid + '</div>'; grid = ''; } html += cards[k]; }
      else grid += cards[k];
    });
    if (grid) html += '<div class="homegrid">' + grid + '</div>';

    return '<header class="pagehead"><div class="titles"><span class="eyebrow">' + esc(today()) + '</span>' +
      '<h1 class="h1">' + greeting() + ', ' + esc(firstName(d.user.name)) + '</h1></div>' +
      '<div class="row" style="gap:12px"><span class="small muted" id="home-updated">Directory refreshed ' + esc(relTime(d.builtAt)) + '</span>' +
      '<button type="button" class="btn sm" data-action="customize-home">' + icon('pencil', 14, 2) + 'Customize</button></div></header>' +
      seasonHero(false) + html;
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
    if (!list.length) return '<tr><td colspan="7"><div class="empty">No schools match. Space is big. Really big.</div></td></tr>';
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
    body.innerHTML = '<div class="grid">' + (s.health ? health : '') + contract + stock + contactsCard(s.name, res.contacts || [], res.contactHistory) + storageCard(s.name, res.storage, res.storageHistory) + contractsCard + (can('logs') || role() === 'Campus Manager' ? logs : '') + profileCard(res.profile) + schoolAssetsCard(res.profile) + marketingKitCard(s.name) + billingCard(res.billing, s.name) + (can('inventory') ? inventoryCard(res.inventory, s.name) : '') + people + activity + reg + editor + '</div>';
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
    if (!list.length) return '<div class="empty">No schools match. Space is big. Really big.</div>';
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
      can('logs') ? ['#/logs/cm', 'cm', 'CM Logs', 'Per school'] : null,
      can('assets') ? ['#/assets', 'library', 'Asset Library', (d.assets || []).length + ' files'] : null,
      can('finance') ? ['#/finance', 'dollar', 'Invoices and tax', 'Finance'] : null
    ].filter(Boolean);
    return '<header class="pagehead"><div class="titles"><span class="eyebrow">' + esc(today()) + ' · ' + esc(r) + '</span><h1 class="h1">' + greeting() + ', ' + esc(firstName(d.user.name)) + '</h1><p class="sub">' + esc(TEAM_INFO[r] || '') + '</p></div></header>' +
      todoStrip() +
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
      block('Inventory', invSummaryLine('school:' + schoolKey(p.name)) + invSummaryLine('sold:' + schoolKey(p.name))) +
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
      (invSummaryLine('wh:' + st.id) ? '<div class="pblock"><span class="legend-title">Inventory here</span>' + invSummaryLine('wh:' + st.id) + '<a class="plink" href="#/inventory?tab=stock&loc=' + encodeURIComponent(st.company || '') + '">' + icon('layers', 15, 2) + '<span>Open in Inventory</span></a></div>' : '') +
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
  /* Asset Library                                                    */
  /* ---------------------------------------------------------------- */

  var FORMAT_COLORS = { PDF: '#C2410C', DOCX: '#1D5FBF', DOC: '#1D5FBF', XLSX: '#1E7B45', XLS: '#1E7B45', PPTX: '#C04A1A', GDOC: '#1D5FBF', GSHEET: '#1E7B45', GSLIDES: '#B7791F', CANVA: '#7C3AED', PNG: '#0E7490', JPG: '#0E7490', SVG: '#0E7490', FOLDER: '#5B6B7C', LINK: '#5B6B7C' };
  var CATEGORY_ICON = { 'Spec sheet': 'file', 'SOP': 'cm', 'Marketing kit': 'spark', 'Poster': 'layers', 'Rack card': 'layers', 'Email': 'mail', 'Social': 'users', 'Logo': 'spark', 'Presentation': 'layers', 'Template': 'pencil', 'Training': 'school', 'Other': 'file' };

  function assetList() { return (state.data.assets || []); }

  function filteredAssets() {
    var a = state.assets;
    var q = a.q.trim().toLowerCase();
    return assetList().filter(function (x) {
      if (a.audience !== 'all' && x.audience !== a.audience) return false;
      if (a.category !== 'all' && x.category !== a.category) return false;
      if (a.archived !== (x.status === 'Archived')) return false;
      if (q && [x.title, x.description, x.product, x.category, x.tags, x.audience, x.format].join(' ').toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function assetCard(x) {
    var u = safeUrl(x.url);
    var color = FORMAT_COLORS[x.format] || '#5B6B7C';
    var restricted = x.access && x.access.length;
    return '<article class="asset' + (x.status === 'Archived' ? ' inactive' : '') + '">' +
      '<a class="asset-top" href="' + esc(u) + '" target="_blank" rel="noopener" style="--fmt:' + color + '" aria-label="Open ' + esc(x.title) + '">' +
      '<span class="asset-ic">' + icon(CATEGORY_ICON[x.category] || 'file', 22, 1.8) + '</span><span class="asset-fmt">' + esc(x.format || 'LINK') + '</span></a>' +
      '<div class="asset-body"><div class="row" style="gap:6px"><span class="badge sm b-info">' + esc(x.category) + '</span><span class="badge sm ' + (x.audience === 'Internal' ? 'b-mute' : 'b-good') + '">' + esc(x.audience) + '</span>' +
      (restricted ? '<span class="badge sm b-warn" title="Only these teams can see it">' + icon('lock', 11, 2.2) + esc(x.access.join(', ')) + '</span>' : '') +
      (x.status === 'Archived' ? '<span class="badge sm b-mute">Archived</span>' : '') + '</div>' +
      '<b class="asset-title">' + esc(x.title) + '</b>' +
      (x.description ? '<p class="asset-desc">' + esc(x.description) + '</p>' : '') +
      '<div class="asset-foot"><span class="small muted">' + esc(x.source || 'Link') + (x.updatedAt ? ' · ' + esc(relTime(x.updatedAt)) : '') + '</span>' +
      '<span class="row" style="gap:2px;flex-wrap:nowrap">' + copyBtn(u, 'link') +
      (can('assets.edit') ? '<button type="button" class="copybtn" data-action="edit-asset" data-id="' + esc(x.id) + '" title="Edit" aria-label="Edit ' + esc(x.title) + '">' + icon('pencil', 15, 2) + '</button>' : '') +
      '<a class="btn sm primary" href="' + esc(u) + '" target="_blank" rel="noopener">Open' + icon('ext', 14, 2) + '</a></span></div></div></article>';
  }

  function assetResults() {
    var list = filteredAssets();
    if (!list.length) return '<div class="empty">' + (assetList().length ? 'Nothing matches these filters.' : 'The library is empty. Run importAssets() in Apps Script to load the spec sheets and SOPs.') + '</div>';
    var groups = {};
    list.forEach(function (x) { (groups[x.category] = groups[x.category] || []).push(x); });
    var order = ((state.data.assetOptions || {}).categories || []).concat(Object.keys(groups));
    var seen = {};
    return order.filter(function (c) { if (seen[c] || !groups[c]) return false; seen[c] = true; return true; }).map(function (c) {
      return '<section class="asset-group"><div class="card-head"><h2>' + esc(c) + (/s$/.test(c) || c === 'Other' ? '' : 's') + '</h2><span class="hint">' + groups[c].length + ' file' + (groups[c].length === 1 ? '' : 's') + '</span></div>' +
        '<div class="asset-grid">' + groups[c].map(assetCard).join('') + '</div></section>';
    }).join('');
  }

  function viewAssets(query) {
    if (!state.assets) state.assets = { audience: 'all', category: 'all', q: '', archived: false };
    var a = state.assets;
    if (query.q != null) a.q = query.q;
    if (query.category) a.category = query.category;
    var all = assetList().filter(function (x) { return x.status !== 'Archived'; });
    var count = function (fn) { return all.filter(fn).length; };
    var audTabs = [['all', 'Everything'], ['B2B', 'B2B · partners'], ['B2C', 'B2C · students'], ['Internal', 'Internal']].map(function (t) {
      var n = t[0] === 'all' ? all.length : count(function (x) { return x.audience === t[0]; });
      return '<button type="button" class="seg" data-assetaud="' + t[0] + '" aria-pressed="' + (a.audience === t[0]) + '">' + esc(t[1]) + '<span>' + n + '</span></button>';
    }).join('');
    var cats = {};
    all.forEach(function (x) { cats[x.category] = (cats[x.category] || 0) + 1; });
    var chips = '<button type="button" class="pill sm" data-assetcat="all" aria-pressed="' + (a.category === 'all') + '">All types</button>' +
      Object.keys(cats).sort().map(function (k) { return '<button type="button" class="pill sm" data-assetcat="' + esc(k) + '" aria-pressed="' + (a.category === k) + '">' + esc(k) + ' · ' + cats[k] + '</button>'; }).join('') +
      (can('assets.edit') && assetList().some(function (x) { return x.status === 'Archived'; }) ? '<button type="button" class="pill sm" data-assetarch="1" aria-pressed="' + a.archived + '">Archived</button>' : '');
    return '<header class="pagehead"><div class="titles"><h1 class="h1">Asset Library</h1><p class="sub">Spec sheets, SOPs and marketing files for every team. Files open straight from SharePoint or Google Drive.</p></div>' +
      (can('assets.edit') ? '<button type="button" class="btn primary" data-action="add-asset">' + icon('plus', 16, 2) + 'Add a file</button>' : '') + '</header>' +
      '<div class="segbar" role="group" aria-label="Audience">' + audTabs + '</div>' +
      '<div class="row" style="justify-content:space-between;align-items:center"><div class="row" style="gap:6px" role="group" aria-label="File type">' + chips + '</div>' +
      '<div class="field" style="width:280px;max-width:100%"><label for="asset-search" class="sr-only">Search the library</label><input id="asset-search" type="search" placeholder="Search titles, products, tags" value="' + esc(a.q) + '" autocomplete="off"></div></div>' +
      '<div id="asset-results" class="stack" style="gap:28px">' + assetResults() + '</div>';
  }

  function repaintAssets() {
    var box = $('#asset-results');
    if (box) box.innerHTML = assetResults();
    document.querySelectorAll('[data-assetaud]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-assetaud') === state.assets.audience)); });
    document.querySelectorAll('[data-assetcat]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-assetcat') === state.assets.category)); });
    var ar = $('[data-assetarch]');
    if (ar) ar.setAttribute('aria-pressed', String(state.assets.archived));
  }

  // "3.2 USB/SS Combo, Loft Kit" -> ['3.2combo']. Used to match spec sheets to a school's products.
  function productKeys(text) {
    var keys = [];
    String(text || '').split(/,|\bor\b|\//).forEach(function (part) {
      var size = (part.match(/(\d+\.\d+)/) || [])[1];
      var type = /combo|combination/i.test(part) ? 'combo' : /fridge|refrigerator/i.test(part) ? 'fridge' : /microwave/i.test(part) ? 'microwave' : '';
      if (size && type) keys.push(size + type);
    });
    return keys;
  }

  // The school's partner marketing kit (social, emails, website), if one is in the Asset Library.
  function marketingKitCard(schoolName) {
    if (!can('assets')) return '';
    var key = schoolKey(schoolName);
    var kits = assetList().filter(function (x) {
      return x.status !== 'Archived' && x.category === 'Marketing kit' && String(x.tags || '').split(',').some(function (t) { return schoolKey(t.replace(/^\s*school:/i, '')) === key; });
    });
    if (!kits.length) return '';
    var k = kits[kits.length - 1];
    var u = safeUrl(k.url);
    if (!u) return '';
    var part = function (folder, label, note) {
      return '<a class="plink" href="' + esc(u.replace(/\/$/, '') + '/' + encodeURIComponent(folder)) + '" target="_blank" rel="noopener">' + icon('ext', 15, 2) + '<span><b>' + label + '</b> <span class="muted small">' + note + '</span></span></a>';
    };
    return '<section class="card" aria-labelledby="mk-h"><div class="card-head"><h2 id="mk-h">Marketing kit</h2><a href="' + esc(u) + '" target="_blank" rel="noopener">Open kit</a></div>' +
      '<p class="small muted" style="margin:0">' + esc(k.title) + '</p>' +
      part('01_Social', 'Social posts', '4 posts, 6 sizes, collab and CP only') +
      part('02_Emails', 'School emails', '4 emails, HTML and PNG') +
      part('03_Website_Placement', 'Website placement', 'Blurbs, snippets, banners') + '</section>';
  }

  function schoolAssetsCard(profile) {
    if (!can('assets') || !profile) return '';
    var want = productKeys(profile.products);
    if (!want.length) return '';
    var hits = assetList().filter(function (x) {
      return x.status !== 'Archived' && x.category === 'Spec sheet' && productKeys(x.product).some(function (k) { return want.indexOf(k) !== -1; });
    });
    if (!hits.length) return '';
    return '<section class="card" aria-labelledby="sa-h"><div class="card-head"><h2 id="sa-h">Spec sheets for this school</h2><a href="#/assets">Asset Library</a></div>' +
      hits.map(function (x) {
        var u = safeUrl(x.url);
        return '<div class="rowlink"><span class="tag" style="background:' + (FORMAT_COLORS[x.format] || '#5B6B7C') + ';color:#fff;font-size:10px">' + esc(x.format) + '</span>' +
          '<a class="t" href="' + esc(u) + '" target="_blank" rel="noopener" style="text-decoration:none;color:var(--ink)"><b>' + esc(x.title) + '</b><span>Matches ' + esc(x.product) + '</span></a>' + copyBtn(u, 'link') + '</div>';
      }).join('') + '</section>';
  }

  function openAssetModal(x) {
    if (!can('assets.edit')) return;
    closePalette();
    var opts = state.data.assetOptions || { categories: ['Other'], audiences: ['Internal'], roles: [] };
    var v = x || { category: 'Other', audience: 'Internal', access: [], status: 'Active' };
    var roles = (opts.roles || []).filter(function (r) { return r !== 'Manager'; });
    var sel = function (name, list, cur) { return '<select id="a-' + name + '" name="' + name + '">' + list.map(function (o) { return '<option' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>'; };
    var inp = function (name, label, val, extra) { return '<div class="field' + (extra && extra.full ? ' full' : '') + '"><label for="a-' + name + '">' + label + (extra && extra.optional ? ' <span class="muted" style="font-weight:400">(optional)</span>' : '') + '</label>' +
      (extra && extra.area ? '<textarea id="a-' + name + '" name="' + name + '" maxlength="600">' + esc(val || '') + '</textarea>' : '<input id="a-' + name + '" name="' + name + '" value="' + esc(val || '') + '"' + (extra && extra.type ? ' type="' + extra.type + '"' : '') + '>') + '</div>'; };
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="am-h">' +
      '<div class="card-head"><h2 id="am-h" style="font-family:var(--display);font-size:20px;font-weight:800">' + (x ? 'Edit library file' : 'Add a file to the library') + '</h2>' +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<form class="form" id="asset-modal-form" data-id="' + esc(x ? x.id : '') + '" novalidate><div class="fields">' +
      inp('title', 'Title', v.title, { full: true }) +
      inp('url', 'Link', v.url, { full: true, type: 'url' }) +
      '<div class="field"><label for="a-category">Type</label>' + sel('category', opts.categories, v.category) + '</div>' +
      '<div class="field"><label for="a-audience">Audience</label>' + sel('audience', opts.audiences, v.audience) + '</div>' +
      inp('product', 'Product', v.product, { optional: true }) + inp('tags', 'Tags', v.tags, { optional: true }) +
      inp('description', 'Short description', v.description, { full: true, area: true, optional: true }) +
      '<div class="field full"><span class="legend-title" style="margin-bottom:4px">Who can see it</span><div class="row" style="gap:8px">' +
      roles.map(function (r) { return '<label class="checkline pillcheck"><input type="checkbox" name="access" value="' + esc(r) + '"' + ((v.access || []).indexOf(r) !== -1 ? ' checked' : '') + '> ' + esc(r) + '</label>'; }).join('') +
      '</div><span class="small muted">Leave all unchecked so every team can see it. Managers always can.</span></div>' +
      (x ? '<div class="field"><label for="a-status">Status</label>' + sel('status', ['Active', 'Archived'], v.status) + '</div>' : '') +
      '</div><div class="formfoot" style="border:0;padding:0"><span class="small muted">Paste a SharePoint, Google Drive or Canva link.</span>' +
      '<button type="submit" class="btn primary">' + (x ? 'Save file' : icon('plus', 16, 2) + 'Add file') + '</button></div></form></div></div>';
    var f = $(x ? '#a-title' : '#a-title');
    if (f) f.focus();
  }

  /* ---------------------------------------------------------------- */
  /* Finance: invoices, lease billing, tax exemptions                 */
  /* ---------------------------------------------------------------- */

  var INV_CLASS = { 'Draft': 'b-mute', 'Ready': 'b-info', 'In QuickBooks': 'b-warn', 'Paid': 'b-good', 'Void': 'b-mute', 'Overdue': 'b-bad' };
  var EX_CLASS = { 'Exempt': 'b-good', 'Requested': 'b-warn', 'Not exempt': 'b-mute', 'Missing': 'b-bad' };

  function usd(n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function todayYmd() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function invStatus(i) { return i.status === 'In QuickBooks' && i.due && i.due < todayYmd() ? 'Overdue' : i.status; }
  function fmtYmd(s, opts) { return s ? fmtDate(s + 'T12:00:00', opts || { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }

  function loadFinance(force) {
    if (state.fin && !force) return Promise.resolve(state.fin);
    return api('finance').then(function (f) { state.fin = f; return f; });
  }

  function viewFinance(query) {
    state.finTab = query.tab || state.finTab || 'invoices';
    return '<header class="pagehead"><div class="titles"><h1 class="h1">Finance</h1><p class="sub">Prepare invoices for QuickBooks, keep lease billing on schedule, and get sales tax and year-end numbers ready to file.</p></div></header>' +
      '<div id="fin-body">' + (state.fin ? financeBody() : '<div class="kpis"><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div></div><div class="skel" style="height:360px;margin-top:20px"></div>') + '</div>';
  }

  function paintFinance() {
    var b = $('#fin-body');
    if (b && parseRoute().name === 'finance') b.innerHTML = financeBody();
  }

  function financeBody() {
    var f = state.fin;
    var inv = f.invoices || [];
    var t = todayYmd();
    var ready = inv.filter(function (i) { return i.status === 'Ready'; });
    var unpaid = inv.filter(function (i) { return i.status === 'In QuickBooks'; });
    var overdue = unpaid.filter(function (i) { return i.due && i.due < t; });
    var month = new Date(Date.now() - 30 * 86400000);
    var paid30 = inv.filter(function (i) { return i.status === 'Paid' && i.paidAt && new Date(i.paidAt + 'T12:00:00') >= month; });
    var sum = function (l) { return l.reduce(function (a, i) { return a + i.total; }, 0); };
    var kpi = function (label, value, note, tab) { return '<button type="button" class="kpi kpibtn" data-fintab="' + tab + '"><span class="label">' + esc(label) + '</span><span class="value">' + esc(value) + '</span>' + (note ? '<span class="small muted">' + esc(note) + '</span>' : '') + '</button>'; };
    var tabs = [['invoices', 'Invoices', inv.filter(function (i) { return i.status !== 'Paid' && i.status !== 'Void'; }).length], ['leases', 'Lease billing', (f.due || []).length], ['tax', 'Sales tax', 0], ['exemptions', 'Tax exemptions', exemptionRows().filter(function (r) { return r.flag; }).length], ['yearend', 'Year-end', 0]];
    var body = state.finTab === 'leases' ? financeLeases() : state.finTab === 'exemptions' ? financeExemptions() : state.finTab === 'tax' ? financeTax() : state.finTab === 'yearend' ? financeYearEnd() : financeInvoices();
    return '<section class="kpis" aria-label="Finance summary">' +
      kpi('Lease invoices to prepare', String((f.due || []).length), (f.due || []).some(function (d) { return d.late; }) ? 'Some are past their bill date' : 'Next 30 days', 'leases') +
      kpi('Ready for QuickBooks', usd(sum(ready)), ready.length + ' invoice' + (ready.length === 1 ? '' : 's'), 'invoices') +
      kpi('Unpaid in QuickBooks', usd(sum(unpaid)), overdue.length ? overdue.length + ' overdue, ' + usd(sum(overdue)) : 'None overdue', 'invoices') +
      kpi('Paid in the last 30 days', usd(sum(paid30)), paid30.length + ' invoice' + (paid30.length === 1 ? '' : 's'), 'invoices') + '</section>' +
      '<div class="segbar" role="group" aria-label="Finance sections" style="margin-top:20px">' + tabs.map(function (x) {
        return '<button type="button" class="seg" data-fintab="' + x[0] + '" aria-pressed="' + (state.finTab === x[0]) + '">' + x[1] + (x[2] ? '<span>' + x[2] + '</span>' : '') + '</button>';
      }).join('') + '</div><div style="margin-top:20px" class="stack">' + body + '</div>';
  }

  function financeInvoices() {
    var f = state.fin;
    var st = state.finStatus || 'Open';
    var all = f.invoices || [];
    var filters = ['Open', 'Draft', 'Ready', 'In QuickBooks', 'Overdue', 'Paid', 'Void', 'All'];
    var match = function (i) { var s = invStatus(i); return st === 'All' || (st === 'Open' ? (s !== 'Paid' && s !== 'Void') : s === st); };
    var list = all.filter(match);
    var due = (f.due || []).slice(0, 6);
    var dueCard = due.length ? '<section class="card" style="gap:0"><div class="card-head" style="margin-bottom:8px"><h2>Lease invoices to prepare</h2><button type="button" class="btn sm" data-fintab="leases">Lease billing</button></div>' +
      due.map(function (d) {
        return '<div class="rowlink"><span class="tag">' + esc(initials(d.school)) + '</span><span class="t"><b>' + esc(d.school) + '</b><span>' + esc(d.period) + ' · bill date ' + esc(fmtYmd(d.billDate)) + (d.late ? ' · past due to send' : '') + '</span></span>' +
          '<b>' + usd(d.amount) + '</b><button type="button" class="btn sm primary" data-action="prepare-lease" data-terms="' + esc(d.termsId) + '" data-period="' + esc(d.period) + '">Prepare</button></div>';
      }).join('') + '</section>' : '';
    var rows = list.length ? list.map(function (i) {
      var s = invStatus(i);
      return '<tr><td style="white-space:nowrap"><b>' + esc(i.ref) + '</b>' + (i.qbNumber ? '<div class="small muted">QB #' + esc(i.qbNumber) + '</div>' : '') + '</td>' +
        '<td><a class="plain" href="' + schoolHref(i.school) + '">' + esc(i.school) + '</a>' + (i.customer && i.customer !== i.school ? '<div class="small muted">' + esc(i.customer) + '</div>' : '') + '</td>' +
        '<td>' + esc(i.type) + (i.period ? '<div class="small muted">' + esc(i.period) + '</div>' : '') + '</td><td style="white-space:nowrap">' + esc(i.po || '') + '</td>' +
        '<td style="white-space:nowrap">' + esc(fmtYmd(i.date)) + '</td><td style="white-space:nowrap">' + esc(fmtYmd(i.due)) + '</td><td style="text-align:right;white-space:nowrap"><b>' + usd(i.total) + '</b></td>' +
        '<td><span class="badge sm ' + (INV_CLASS[s] || 'b-mute') + '">' + esc(s) + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap">' + (i.status === 'Draft' ? '<button type="button" class="btn sm" data-action="inv-status" data-id="' + esc(i.id) + '" data-status="Ready">Mark ready</button> ' : '') +
        (i.status === 'In QuickBooks' ? '<button type="button" class="btn sm" data-action="inv-status" data-id="' + esc(i.id) + '" data-status="Paid">Mark paid</button> ' : '') +
        '<button type="button" class="btn sm" data-action="edit-invoice" data-id="' + esc(i.id) + '">' + icon('pencil', 14, 2) + 'Open</button></td></tr>';
    }).join('') : '<tr><td colspan="9"><div class="empty">No invoices here yet.</div></td></tr>';
    var readyCount = all.filter(function (i) { return i.status === 'Ready'; }).length;
    return dueCard +
      '<div class="row" style="justify-content:space-between"><div class="row" style="gap:6px">' + filters.map(function (x) {
        var n = x === 'All' ? all.length : all.filter(function (i) { var s = invStatus(i); return x === 'Open' ? (s !== 'Paid' && s !== 'Void') : s === x; }).length;
        return '<button type="button" class="pill sm" data-invfilter="' + x + '" aria-pressed="' + (st === x) + '">' + x + ' · ' + n + '</button>';
      }).join('') + '</div><div class="row" style="gap:8px">' +
      '<button type="button" class="btn" data-action="export-qb"' + (readyCount ? '' : ' disabled title="Mark invoices Ready first"') + '>' + icon('file', 16, 2) + 'Export Ready for QuickBooks' + (readyCount ? ' (' + readyCount + ')' : '') + '</button>' +
      '<button type="button" class="btn primary" data-action="new-invoice">' + icon('plus', 16, 2) + 'New invoice</button></div></div>' +
      '<section class="tablecard" aria-label="Invoices"><div class="scroll"><table><thead><tr><th>Invoice</th><th>School</th><th>Type</th><th>PO</th><th>Date</th><th>Due</th><th style="text-align:right">Total</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="tfoot"><span>Pangia numbers invoices PG-0001 and up. Turn on custom transaction numbers in QuickBooks to keep them, or record the QuickBooks number on each invoice.</span></div></section>';
  }

  function financeLeases() {
    var f = state.fin;
    var termsBy = {};
    (f.terms || []).forEach(function (t) { termsBy[t.contractKey] = t; });
    var nextBill = function (t) { var d = (f.due || []).filter(function (x) { return x.termsId === t.id; })[0]; return d ? d.billDate : ''; };
    var rows = (f.leases || []).map(function (l) {
      var t = termsBy[l.key];
      return '<tr><td><a class="plain" href="' + schoolHref(l.school) + '"><b>' + esc(l.school) + '</b></a><div class="small muted">' + esc(fmtYmd(l.start, { month: 'short', year: 'numeric' })) + ' to ' + esc(fmtYmd(l.end, { month: 'short', year: 'numeric' })) + '</div></td>' +
        '<td><span class="badge sm ' + (CONTRACT_CLASS[l.status] || 'b-mute') + '">' + esc(l.status) + '</span></td>' +
        '<td>' + (t ? '<b>' + usd(t.amount) + '</b> <span class="small muted">' + esc(t.frequency.toLowerCase()) + '</span>' : '<span class="small muted">Not set up</span>') + '</td>' +
        '<td>' + (t ? esc(t.terms) : '') + '</td><td>' + (t && t.po ? esc(t.po) : '') + '</td>' +
        '<td>' + (t ? (nextBill(t) ? esc(fmtYmd(nextBill(t))) : '<span class="small muted">Nothing due in 30 days</span>') : '') + '</td>' +
        '<td style="text-align:right"><button type="button" class="btn sm' + (t ? '' : ' primary') + '" data-action="edit-terms" data-key="' + esc(l.key) + '">' + (t ? 'Edit billing' : 'Set up billing') + '</button></td></tr>';
    }).join('');
    return '<section class="tablecard" aria-label="Lease billing"><div class="scroll"><table><thead><tr><th>Lease</th><th>Contract</th><th>Billing</th><th>Terms</th><th>PO</th><th>Next bill</th><th><span class="sr-only">Edit</span></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="7"><div class="empty">No lease contracts on file. Add them on the Contracts page with the type set to Lease.</div></td></tr>') + '</tbody></table></div>' +
      '<div class="tfoot"><span>Once billing is set up, Pangia lists each lease invoice 30 days before its bill date under Invoices.</span></div></section>';
  }

  function exemptionRows() {
    var f = state.fin;
    var by = {};
    (f.exemptions || []).forEach(function (e) { by[norm(e.school)] = e; });
    var names = {};
    state.data.schools.forEach(function (s) { names[s.name] = true; });
    (f.exemptions || []).forEach(function (e) { names[e.school] = true; });
    var soon = new Date(Date.now() + 60 * 86400000);
    return Object.keys(names).sort().map(function (n) {
      var e = by[norm(n)] || null;
      var status = e ? e.status : 'Missing';
      var exp = e && e.expires ? new Date(e.expires + 'T12:00:00') : null;
      var expired = exp && exp < new Date();
      var expiring = exp && !expired && exp < soon;
      return { school: n, e: e, status: status, expired: expired, expiring: expiring, flag: status === 'Missing' || status === 'Requested' || expired || expiring };
    });
  }

  function financeExemptions() {
    var fl = state.exFilter || 'all';
    var list = exemptionRows().filter(function (r) { return fl === 'all' || (fl === 'attention' ? r.flag : r.status === fl); });
    var rows = list.map(function (r) {
      var e = r.e || {};
      var u = safeUrl(e.link);
      return '<tr><td><a class="plain" href="' + schoolHref(r.school) + '"><b>' + esc(r.school) + '</b></a></td>' +
        '<td><span class="badge sm ' + (EX_CLASS[r.status] || 'b-mute') + '">' + esc(r.status) + '</span></td><td>' + esc(e.state || '') + '</td>' +
        '<td>' + (e.expires ? '<span' + (r.expired ? ' style="color:var(--bad, #B42318);font-weight:600"' : r.expiring ? ' style="color:var(--warn);font-weight:600"' : '') + '>' + esc(fmtYmd(e.expires)) + (r.expired ? ' (expired)' : r.expiring ? ' (soon)' : '') + '</span>' : '<span class="small muted">' + (e.status === 'Exempt' ? 'No expiry' : '') + '</span>') + '</td>' +
        '<td>' + (u ? '<a class="plink" href="' + esc(u) + '" target="_blank" rel="noopener">' + icon('file', 14, 2) + '<span>Certificate</span>' + icon('ext', 12, 2) + '</a>' : '<span class="small muted">None</span>') + '</td>' +
        '<td style="text-align:right"><button type="button" class="btn sm" data-action="edit-exemption" data-school="' + esc(r.school) + '">' + (r.e ? 'Edit' : 'Add') + '</button></td></tr>';
    }).join('');
    var all = exemptionRows();
    var pill = function (k, label) { var n = k === 'all' ? all.length : k === 'attention' ? all.filter(function (r) { return r.flag; }).length : all.filter(function (r) { return r.status === k; }).length; return '<button type="button" class="pill sm" data-exfilter="' + k + '" aria-pressed="' + (fl === k) + '">' + label + ' · ' + n + '</button>'; };
    return '<div class="row" style="gap:6px">' + pill('all', 'All schools') + pill('attention', 'Needs attention') + pill('Exempt', 'Exempt') + pill('Requested', 'Requested') + pill('Not exempt', 'Not exempt') + pill('Missing', 'Missing') + '</div>' +
      '<section class="tablecard" aria-label="Tax exemptions"><div class="scroll"><table><thead><tr><th>School</th><th>Status</th><th>State</th><th>Expires</th><th>Certificate</th><th><span class="sr-only">Edit</span></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6"><div class="empty">No schools match.</div></td></tr>') + '</tbody></table></div>' +
      '<div class="tfoot"><span>Schools marked Exempt are billed without sales tax. Certificates expiring within 60 days are flagged.</span></div></section>';
  }

  function billingCard(b, schoolName) {
    if (!b || !can('finance')) return '';
    var e = b.exemption;
    var s = e ? e.status : 'Missing';
    return '<section class="card" aria-labelledby="bl-h"><div class="card-head"><h2 id="bl-h">Billing</h2><a href="#/finance">Finance</a></div>' +
      '<div class="row" style="gap:8px"><span class="small muted">Sales tax</span><span class="badge sm ' + (EX_CLASS[s] || 'b-mute') + '">' + esc(s) + '</span>' + (e && e.expires ? '<span class="small muted">until ' + esc(fmtYmd(e.expires)) + '</span>' : '') + '</div>' +
      (b.terms && b.terms.length ? b.terms.map(function (t) { return '<div class="small"><b>' + usd(t.amount) + '</b> ' + esc(t.frequency.toLowerCase()) + ', ' + esc(t.terms) + (t.po ? ', PO ' + esc(t.po) : '') + '</div>'; }).join('') : '') +
      (b.invoices && b.invoices.length ? b.invoices.slice(0, 5).map(function (i) { var st = invStatus(i); return '<div class="rowlink" style="padding:8px;margin:0 -8px"><span class="t"><b style="font-size:14px">' + esc(i.ref) + ' · ' + usd(i.total) + '</b><span>' + esc(i.type) + (i.period ? ', ' + esc(i.period) : '') + '</span></span><span class="badge sm ' + (INV_CLASS[st] || 'b-mute') + '">' + esc(st) + '</span></div>'; }).join('') : '<div class="small muted">No invoices yet.</div>') +
      '<button type="button" class="btn sm" data-action="new-invoice" data-school="' + esc(schoolName) + '">' + icon('plus', 14, 2) + 'New invoice</button></section>';
  }

  function allCustomerNames() {
    var names = {};
    state.data.schools.forEach(function (s) { names[s.name] = true; });
    (state.data.locations || []).forEach(function (l) { names[l.school] = true; });
    return Object.keys(names).sort();
  }

  function lineRow(l, i) {
    l = l || { item: '', description: '', qty: 1, rate: '' };
    return '<div class="invline" data-line="' + i + '">' +
      '<input aria-label="Item" name="li-item" placeholder="Item (QuickBooks product)" value="' + esc(l.item) + '">' +
      '<input aria-label="Description" name="li-desc" placeholder="Description" value="' + esc(l.description) + '">' +
      '<input aria-label="Quantity" name="li-qty" type="number" min="0" step="1" value="' + esc(l.qty) + '">' +
      '<input aria-label="Rate" name="li-rate" type="number" min="0" step="0.01" placeholder="0.00" value="' + esc(l.rate) + '">' +
      '<span class="li-amt">' + usd((Number(l.qty) || 0) * (Number(l.rate) || 0)) + '</span>' +
      '<button type="button" class="copybtn" data-action="remove-line" aria-label="Remove line">' + icon('x', 15, 2) + '</button></div>';
  }

  function openInvoiceModal(inv, presetSchool) {
    if (!can('finance')) return;
    var f = state.fin || { options: {} };
    var o = f.options || {};
    var v = inv || { school: presetSchool || '', type: 'Product sale', date: todayYmd(), terms: 'Net 30', lines: [{ item: '', description: '', qty: 1, rate: '' }], taxable: false, taxRate: 0, status: 'Draft' };
    if (!inv && presetSchool) {
      var cu = (f.customers || []).filter(function (c) { return norm(c.school) === norm(presetSchool); })[0];
      if (cu) { v.customer = cu.qbName; if (cu.terms) v.terms = cu.terms; }
    }
    var sel = function (name, list, cur) { return '<select id="i-' + name + '" name="' + name + '">' + list.map(function (x) { return '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; };
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal wide" role="dialog" aria-modal="true" aria-labelledby="im-h">' +
      '<div class="card-head"><h2 id="im-h" style="font-family:var(--display);font-size:20px;font-weight:800">' + (inv ? 'Invoice ' + esc(inv.ref) : 'New invoice') + '</h2>' +
      '<div class="row" style="gap:6px">' + (inv ? '<button type="button" class="btn sm" data-action="copy-invoice">' + icon('copy', 14, 2) + 'Copy for QuickBooks</button>' : '') +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div></div>' +
      '<form class="form" id="invoice-form" data-id="' + esc(inv ? inv.id : '') + '" novalidate><div class="fields three">' +
      '<div class="field"><label for="i-school">School</label><input id="i-school" name="school" list="i-schools" value="' + esc(v.school) + '" autocomplete="off"><datalist id="i-schools">' + allCustomerNames().map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('') + '</datalist></div>' +
      '<div class="field"><label for="i-customer">QuickBooks customer <span class="muted" style="font-weight:400">(if different)</span></label><input id="i-customer" name="customer" value="' + esc(v.customer && v.customer !== v.school ? v.customer : '') + '"></div>' +
      '<div class="field"><label for="i-type">Type</label>' + sel('type', ['Product sale', 'Lease payment', 'Service'], v.type) + '</div>' +
      '<div class="field"><label for="i-po">PO number</label><input id="i-po" name="po" value="' + esc(v.po || '') + '"></div>' +
      '<div class="field"><label for="i-date">Invoice date</label><input id="i-date" name="date" type="date" value="' + esc(v.date) + '"></div>' +
      '<div class="field"><label for="i-terms">Terms</label>' + sel('terms', o.terms || ['Net 30'], v.terms) + '</div>' +
      '</div><div class="stack" style="gap:8px"><span class="legend-title">Lines</span><div class="invline head"><span>Item</span><span>Description</span><span>Qty</span><span>Rate</span><span style="text-align:right">Amount</span><span></span></div>' +
      '<div id="inv-lines" class="stack" style="gap:8px">' + (v.lines.length ? v.lines : [{}]).map(lineRow).join('') + '</div>' +
      '<button type="button" class="btn sm" data-action="add-line" style="align-self:flex-start">' + icon('plus', 14, 2) + 'Add line</button></div>' +
      '<div class="invtotals"><label class="checkline"><input type="checkbox" name="taxable"' + (v.taxable ? ' checked' : '') + '> Charge sales tax</label>' +
      '<div class="field" style="width:110px"><label for="i-rate" class="sr-only">Tax rate</label><input id="i-rate" name="taxRate" type="number" min="0" max="30" step="0.001" value="' + esc(v.taxRate || '') + '" placeholder="Rate %"></div>' +
      '<div class="tot" id="inv-tot"></div></div>' +
      '<div class="fields three"><div class="field" style="grid-column:span 2"><label for="i-memo">Memo <span class="muted" style="font-weight:400">(optional)</span></label><input id="i-memo" name="memo" value="' + esc(v.memo || '') + '"></div>' +
      '<div class="field"><label for="i-status">Status</label>' + sel('status', o.statuses || ['Draft', 'Ready', 'In QuickBooks', 'Paid', 'Void'], v.status) + '</div>' +
      '<div class="field"><label for="i-qb">QuickBooks invoice #</label><input id="i-qb" name="qbNumber" value="' + esc(v.qbNumber || '') + '" placeholder="After it is in QuickBooks"></div>' +
      (inv && inv.period ? '<div class="field"><label>Lease period</label><input value="' + esc(inv.period) + '" readonly></div>' : '') +
      '</div><div class="formfoot" style="border:0;padding:0"><span class="small muted">' + (inv && inv.sentAt ? 'In QuickBooks since ' + esc(fmtYmd(inv.sentAt)) + (inv.paidAt ? ', paid ' + esc(fmtYmd(inv.paidAt)) : '') : 'Mark it Ready when it is checked and good to go into QuickBooks.') + '</span>' +
      '<button type="submit" class="btn primary">' + (inv ? 'Save invoice' : icon('plus', 16, 2) + 'Create invoice') + '</button></div></form></div></div>';
    updateInvoiceTotals();
    var first = $(presetSchool || inv ? '#i-po' : '#i-school');
    if (first) first.focus();
  }

  function readInvoiceForm() {
    var form = $('#invoice-form');
    var lines = Array.prototype.slice.call(form.querySelectorAll('.invline[data-line]')).map(function (r) {
      return { item: r.querySelector('[name="li-item"]').value.trim(), description: r.querySelector('[name="li-desc"]').value.trim(), qty: Number(r.querySelector('[name="li-qty"]').value) || 0, rate: Number(r.querySelector('[name="li-rate"]').value) || 0 };
    }).filter(function (l) { return l.item || l.description; });
    var el = form.elements;
    return { id: form.getAttribute('data-id'), school: el.school.value.trim(), customer: el.customer.value.trim(), type: el.type.value, po: el.po.value.trim(), date: el.date.value, terms: el.terms.value,
      lines: lines, taxable: el.taxable.checked, taxRate: Number(el.taxRate.value) || 0, memo: el.memo.value.trim(), status: el.status.value, qbNumber: el.qbNumber.value.trim() };
  }

  function updateInvoiceTotals() {
    var box = $('#inv-tot');
    if (!box) return;
    var v = readInvoiceForm();
    document.querySelectorAll('.invline[data-line]').forEach(function (r) {
      var q = Number(r.querySelector('[name="li-qty"]').value) || 0, rt = Number(r.querySelector('[name="li-rate"]').value) || 0;
      r.querySelector('.li-amt').textContent = usd(q * rt);
    });
    var sub = v.lines.reduce(function (a, l) { return a + l.qty * l.rate; }, 0);
    var tax = v.taxable ? Math.round(sub * v.taxRate) / 100 : 0;
    box.innerHTML = '<span>Subtotal <b>' + usd(sub) + '</b></span><span>Tax <b>' + usd(tax) + '</b></span><span class="grand">Total <b>' + usd(sub + tax) + '</b></span>';
  }

  function invoiceText(i) {
    var lines = ['Invoice ' + i.ref + (i.qbNumber ? ' (QuickBooks #' + i.qbNumber + ')' : ''), 'Customer: ' + (i.customer || i.school), 'Invoice date: ' + fmtYmd(i.date), 'Due date: ' + fmtYmd(i.due) + ' (' + i.terms + ')'];
    if (i.po) lines.push('PO: ' + i.po);
    lines.push('');
    i.lines.forEach(function (l) { lines.push(l.item + (l.description ? ' | ' + l.description : '') + ' | ' + l.qty + ' x ' + usd(l.rate) + ' = ' + usd(l.qty * l.rate)); });
    lines.push('', 'Subtotal: ' + usd(i.subtotal) + (i.taxable ? ' | Tax (' + i.taxRate + '%): ' + usd(i.tax) : ' | Not taxable') + ' | Total: ' + usd(i.total));
    if (i.memo) lines.push('Memo: ' + i.memo);
    return lines.join('\n');
  }

  function exportQuickBooksCsv() {
    var ready = (state.fin.invoices || []).filter(function (i) { return i.status === 'Ready'; });
    if (!ready.length) return toast('Mark invoices Ready first.', true);
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var us = function (s) { var p = String(s || '').split('-'); return p.length === 3 ? p[1] + '/' + p[2] + '/' + p[0] : ''; };
    var rows = [['InvoiceNo', 'Customer', 'InvoiceDate', 'DueDate', 'Terms', 'Memo', 'Item(Product/Service)', 'ItemDescription', 'ItemQuantity', 'ItemRate', 'ItemAmount', 'Taxable', 'TaxRate']];
    ready.forEach(function (i) {
      i.lines.forEach(function (l) {
        rows.push([i.ref, i.customer || i.school, us(i.date), us(i.due), i.terms, [i.po ? 'PO ' + i.po : '', i.memo].filter(Boolean).join('. '), l.item, l.description, l.qty, l.rate.toFixed(2), (l.qty * l.rate).toFixed(2), i.taxable ? 'Y' : 'N', i.taxable ? i.taxRate + '%' : '']);
      });
    });
    var csv = rows.map(function (r) { return r.map(q).join(','); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'pangia-invoices-' + todayYmd() + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Exported ' + ready.length + ' invoice' + (ready.length === 1 ? '' : 's') + '. Mark each one In QuickBooks after the import.');
  }

  function openTermsModal(key) {
    var f = state.fin;
    var l = (f.leases || []).filter(function (x) { return x.key === key; })[0];
    if (!l) return;
    var t = (f.terms || []).filter(function (x) { return x.contractKey === key; })[0] || { amount: '', frequency: 'Per semester', firstBill: l.start, terms: 'Net 30', item: 'Lease payment', po: '', memo: '' };
    var c = (f.customers || []).filter(function (x) { return norm(x.school) === norm(l.school); })[0] || {};
    var sel = function (name, list, cur) { return '<select id="t-' + name + '" name="' + name + '">' + list.map(function (x) { return '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; };
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="tm-h">' +
      '<div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="tm-h" style="font-family:var(--display);font-size:20px;font-weight:800">Lease billing</h2><span class="small muted">' + esc(l.school) + ', ' + esc(fmtYmd(l.start)) + ' to ' + esc(fmtYmd(l.end)) + '</span></div>' +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<form class="form" id="terms-form" data-key="' + esc(key) + '" data-school="' + esc(l.school) + '" novalidate><div class="fields">' +
      '<div class="field"><label for="t-amount">Amount per bill</label><input id="t-amount" name="amount" type="number" min="0" step="0.01" value="' + esc(t.amount) + '"></div>' +
      '<div class="field"><label for="t-frequency">Billed</label>' + sel('frequency', (f.options || {}).frequencies || ['Annual'], t.frequency) + '</div>' +
      '<div class="field"><label for="t-firstBill">First bill date</label><input id="t-firstBill" name="firstBill" type="date" value="' + esc(t.firstBill) + '"></div>' +
      '<div class="field"><label for="t-terms">Terms</label>' + sel('terms', (f.options || {}).terms || ['Net 30'], t.terms) + '</div>' +
      '<div class="field"><label for="t-item">QuickBooks item</label><input id="t-item" name="item" value="' + esc(t.item) + '"></div>' +
      '<div class="field"><label for="t-po">PO number <span class="muted" style="font-weight:400">(optional)</span></label><input id="t-po" name="po" value="' + esc(t.po) + '"></div>' +
      '<div class="field full"><label for="t-memo">Memo on each invoice <span class="muted" style="font-weight:400">(optional)</span></label><input id="t-memo" name="memo" value="' + esc(t.memo) + '"></div>' +
      '<span class="legend-title">Customer in QuickBooks</span>' +
      '<div class="field"><label for="t-qb">QuickBooks customer name</label><input id="t-qb" name="qbName" value="' + esc(c.qbName || '') + '" placeholder="' + esc(l.school) + '"></div>' +
      '<div class="field"><label for="t-email">Bill-to email</label><input id="t-email" name="billToEmail" type="email" value="' + esc(c.billToEmail || '') + '"></div>' +
      '</div><div class="formfoot" style="border:0;padding:0"><span class="small muted">The QuickBooks name must match the customer exactly, or the import creates a new one.</span>' +
      '<button type="submit" class="btn primary">Save billing</button></div></form></div></div>';
    $('#t-amount').focus();
  }

  function openExemptionModal(school) {
    var f = state.fin;
    var e = (f.exemptions || []).filter(function (x) { return norm(x.school) === norm(school); })[0] || { status: 'Requested' };
    var sel = function (name, list, cur) { return '<select id="x-' + name + '" name="' + name + '">' + list.map(function (x) { return '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; };
    var loc = (state.data.locations || []).filter(function (l) { return norm(l.school) === norm(school); })[0];
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="xm-h">' +
      '<div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="xm-h" style="font-family:var(--display);font-size:20px;font-weight:800">Tax exemption</h2><span class="small muted">' + esc(school) + '</span></div>' +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<form class="form" id="exemption-form" data-id="' + esc(e.id || '') + '" data-school="' + esc(school) + '" novalidate><div class="fields">' +
      '<div class="field"><label for="x-status">Status</label>' + sel('status', (f.options || {}).exemptStatuses || ['Exempt', 'Requested', 'Not exempt'], e.status) + '</div>' +
      '<div class="field"><label for="x-state">State</label><input id="x-state" name="state" value="' + esc(e.state || (loc ? loc.state : '')) + '"></div>' +
      '<div class="field full"><label for="x-link">Certificate link</label><input id="x-link" name="link" type="url" value="' + esc(e.link || '') + '" placeholder="SharePoint or Google Drive link to the signed certificate"></div>' +
      '<div class="field"><label for="x-number">Exemption number <span class="muted" style="font-weight:400">(optional)</span></label><input id="x-number" name="number" value="' + esc(e.number || '') + '"></div>' +
      '<div class="field"><label for="x-expires">Expires <span class="muted" style="font-weight:400">(optional)</span></label><input id="x-expires" name="expires" type="date" value="' + esc(e.expires || '') + '"></div>' +
      '<div class="field full"><label for="x-notes">Notes <span class="muted" style="font-weight:400">(optional)</span></label><input id="x-notes" name="notes" value="' + esc(e.notes || '') + '"></div>' +
      '</div><div class="formfoot" style="border:0;padding:0"><span class="small muted">Keep the certificate itself in SharePoint and link it here.</span><button type="submit" class="btn primary">Save</button></div></form></div></div>';
  }

  function finSave(action, payload, btn, label, msg) {
    btn.disabled = true; btn.textContent = 'Saving...';
    return api(action, payload).then(function (f) {
      state.fin = f;
      closeModal();
      toast(msg);
      var r = parseRoute();
      if (r.name === 'finance') paintFinance();
      else if (r.name === 'school') { delete state.schoolCache[r.school]; loadSchool(r.school); }
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = label;
      if (err.code !== 'auth_expired') toast(err.message, true);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Finance: sales tax and year-end                                  */
  /* ---------------------------------------------------------------- */

  function loadTax() {
    var kind = state.taxKind || 'quarter';
    return api('salesTax', { kind: kind }).then(function (t) { state.tax = t; if (!state.taxPeriod || !t.periods.some(function (p) { return p.period === state.taxPeriod; })) state.taxPeriod = t.periods[0] ? t.periods[0].period : ''; return t; });
  }
  function loadYearEnd() {
    var y = state.yeYear || new Date().getFullYear();
    return api('yearEnd', { year: y }).then(function (r) { state.ye = r; return r; });
  }

  function periodName(p) {
    if (/^\d{4}-Q\d$/.test(p)) return 'Q' + p.slice(6) + ' ' + p.slice(0, 4);
    if (/^\d{4}-\d{2}$/.test(p)) return fmtDate(p + '-15T12:00:00', { month: 'long', year: 'numeric' });
    return p;
  }

  function downloadCsv(name, rows) {
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(function (r) { return r.map(q).join(','); }).join('\r\n')], { type: 'text/csv' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }

  function financeTax() {
    var t = state.tax;
    if (!t) { loadTax().then(paintFinance).catch(function (err) { if (err.code !== 'auth_expired') toast(err.message, true); }); return '<div class="skel" style="height:420px"></div>'; }
    var names = t.stateNames || {};
    var registered = {};
    (t.taxStates || []).forEach(function (s) { if (s.registered) registered[s.state] = true; });
    var per = (t.periods || []).filter(function (p) { return p.period === state.taxPeriod; })[0];
    var kinds = [['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Year']].map(function (k) { return '<button type="button" class="seg" data-taxkind="' + k[0] + '" aria-pressed="' + ((state.taxKind || 'quarter') === k[0]) + '">' + k[1] + '</button>'; }).join('');
    var opts = (t.periods || []).map(function (p) { return '<option value="' + esc(p.period) + '"' + (p.period === state.taxPeriod ? ' selected' : '') + '>' + esc(periodName(p.period)) + '</option>'; }).join('');
    var today = todayYmd();
    var cal = (t.calendar || []).length ? (t.calendar || []).map(function (c) {
      return '<div class="filing"><div class="card-head"><b>' + esc(c.name) + '</b><span class="small muted">' + esc(c.frequency) + ', due day ' + c.dueDay + '</span></div><div class="row" style="gap:6px">' +
        c.periods.map(function (p) {
          var cls = p.filed ? 'b-good' : !p.closed ? 'b-mute' : p.due < today ? 'b-bad' : 'b-warn';
          var label = p.filed ? periodName(p.period) + ': filed' : !p.closed ? periodName(p.period) + ': open' : periodName(p.period) + ': due ' + fmtYmd(p.due, { month: 'short', day: 'numeric' });
          return '<button type="button" class="badge ' + cls + ' filebtn" data-action="file-period" data-state="' + esc(c.state) + '" data-period="' + esc(p.period) + '"' + (p.closed || p.filed ? '' : ' disabled') + ' title="' + (p.filed ? 'Filed ' + esc(fmtYmd(p.filed.filedOn)) + (p.filed.confirmation ? ', ' + esc(p.filed.confirmation) : '') : p.closed ? 'Mark as filed' : 'Period still open') + '">' + esc(label) + '</button>';
        }).join('') + '</div></div>';
    }).join('') : '<div class="empty">Add the states where College Products is registered to collect sales tax, and Pangia will track each filing deadline.</div>';
    var rows = per ? per.states : [];
    var tot = { orders: 0, gross: 0, taxable: 0, exempt: 0, tax: 0, refunds: 0, refundTax: 0, b2bTaxable: 0, b2bExempt: 0, b2bTax: 0 };
    rows.forEach(function (s) { Object.keys(tot).forEach(function (k) { tot[k] += s[k] || 0; }); });
    var cell = function (v) { return '<td style="text-align:right;white-space:nowrap">' + usd(v) + '</td>'; };
    var tr = function (s, isTotal) {
      var nm = isTotal ? 'All states' : s.state === '??' ? 'School not matched' : (names[s.state] || s.state);
      return '<tr' + (isTotal ? ' class="totrow"' : '') + '><td>' + (isTotal ? '<b>' + nm + '</b>' : esc(nm) + (registered[s.state] ? ' <span class="badge sm b-info">Registered</span>' : '') + (s.noTax ? ' <span class="badge sm b-warn" title="' + fmtNum(s.noTax) + ' orders, ' + usd(s.noTaxGross) + ' in sales, at a taxed school but with no tax on file. Most were imported from the old website.">' + fmtNum(s.noTax) + ' without tax on file</span>' : '')) + '</td>' +
        '<td style="text-align:right">' + fmtNum(s.orders) + '</td>' + cell(s.gross) + cell(s.taxable) + cell(s.exempt) + cell(s.tax) + cell(s.refunds) + cell(s.refundTax) +
        '<td style="text-align:right;white-space:nowrap"><b>' + usd((s.tax || 0) - (s.refundTax || 0) + (s.b2bTax || 0)) + '</b></td>' + cell(s.b2bTaxable) + cell(s.b2bExempt) + '</tr>';
    };
    return '<div class="row" style="justify-content:space-between"><div class="row" style="gap:10px"><div class="segbar" role="group" aria-label="Period length">' + kinds + '</div>' +
      '<div class="field" style="width:220px"><label for="tax-period" class="sr-only">Period</label><select id="tax-period">' + opts + '</select></div></div>' +
      '<div class="row" style="gap:8px"><span class="small muted">' + fmtNum(t.ordersOnFile) + ' web orders on file' + (t.syncedAt ? ', synced ' + esc(relTime(t.syncedAt)) : ', not synced yet') + '</span>' +
      '<button type="button" class="btn sm" data-action="sync-sales">' + icon('refresh', 14, 2) + 'Sync WooCommerce</button>' +
      '<button type="button" class="btn sm" data-action="export-tax"' + (per ? '' : ' disabled') + '>' + icon('file', 14, 2) + 'Export CSV</button></div></div>' +
      '<section class="card" style="gap:12px"><div class="card-head"><h2>Filing calendar</h2><button type="button" class="btn sm" data-action="tax-states">' + icon('pencil', 14, 2) + 'Manage states</button></div><div class="filings">' + cal + '</div></section>' +
      '<section class="tablecard" aria-label="Sales tax by state"><div class="scroll"><table class="taxtable"><thead><tr><th>State</th><th style="text-align:right">Web orders</th><th style="text-align:right">Gross sales</th><th style="text-align:right">Taxable</th><th style="text-align:right">Non-taxable</th><th style="text-align:right">Tax collected</th><th style="text-align:right">Refunds</th><th style="text-align:right">Tax refunded</th><th style="text-align:right">Net tax due</th><th style="text-align:right">B2B taxable</th><th style="text-align:right">B2B exempt</th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (s) { return tr(s, false); }).join('') + tr(tot, true) : '<tr><td colspan="11"><div class="empty">' + (t.ordersOnFile ? 'No sales in this period.' : 'No sales yet. Click Sync WooCommerce to pull orders in.') + '</div></td></tr>') + '</tbody></table></div>' +
      '<div class="tfoot"><span>Web orders are placed in the state of the school on the order (from the School Tax tab), plus B2B invoices by school state. Tax is the Tax fee charged on each order. Processing fees count as non-taxable. Net tax due includes B2B tax. Check the totals before filing.</span></div></section>';
  }

  function exportTaxCsv() {
    var t = state.tax, per = (t.periods || []).filter(function (p) { return p.period === state.taxPeriod; })[0];
    if (!per) return;
    var rows = [['Period', 'State', 'Web orders', 'Gross sales', 'Taxable sales', 'Non-taxable sales', 'Tax collected', 'Refunds', 'Tax refunded', 'Net tax due', 'B2B taxable', 'B2B exempt', 'B2B tax']];
    per.states.forEach(function (s) { rows.push([periodName(per.period), (t.stateNames || {})[s.state] || s.state, s.orders, s.gross, s.taxable, s.exempt, s.tax, s.refunds, s.refundTax, Math.round((s.tax - s.refundTax + s.b2bTax) * 100) / 100, s.b2bTaxable, s.b2bExempt, s.b2bTax]); });
    downloadCsv('pangia-sales-tax-' + per.period + '.csv', rows);
  }

  function openFilingModal(st, period) {
    var c = (state.tax.calendar || []).filter(function (x) { return x.state === st; })[0];
    var p = c && c.periods.filter(function (x) { return x.period === period; })[0];
    if (!p) return;
    var f = p.filed || {};
    var perData = (state.tax.periods || []).filter(function (x) { return x.period === period; })[0];
    var row = perData && perData.states.filter(function (x) { return x.state === st; })[0];
    var est = row ? Math.round((row.tax - row.refundTax + row.b2bTax) * 100) / 100 : 0;
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="fm-h">' +
      '<div class="card-head"><div style="display:flex;flex-direction:column;gap:4px"><h2 id="fm-h" style="font-family:var(--display);font-size:20px;font-weight:800">' + esc(c.name) + ' sales tax, ' + esc(periodName(period)) + '</h2>' +
      '<span class="small muted">Due ' + esc(fmtYmd(p.due)) + (row ? '. Pangia shows ' + usd(est) + ' net tax for this period.' : '') + '</span></div>' +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<form class="form" id="filing-form" data-state="' + esc(st) + '" data-period="' + esc(period) + '" novalidate><div class="fields">' +
      '<div class="field"><label for="f-on">Filed on</label><input id="f-on" name="filedOn" type="date" value="' + esc(f.filedOn || todayYmd()) + '"></div>' +
      '<div class="field"><label for="f-amt">Amount paid</label><input id="f-amt" name="amount" type="number" step="0.01" min="0" value="' + esc(f.amount != null ? f.amount : est) + '"></div>' +
      '<div class="field full"><label for="f-conf">Confirmation number <span class="muted" style="font-weight:400">(optional)</span></label><input id="f-conf" name="confirmation" value="' + esc(f.confirmation || '') + '"></div>' +
      '<div class="field full"><label for="f-notes">Notes <span class="muted" style="font-weight:400">(optional)</span></label><input id="f-notes" name="notes" value="' + esc(f.notes || '') + '"></div>' +
      '</div><div class="formfoot" style="border:0;padding:0">' + (p.filed ? '<button type="button" class="btn sm" data-action="unfile">Undo filed</button>' : '<span></span>') +
      '<button type="submit" class="btn primary">' + (p.filed ? 'Save' : 'Mark as filed') + '</button></div></form></div></div>';
  }

  function openTaxStatesModal() {
    var t = state.tax;
    var names = t.stateNames || {};
    var have = {};
    (t.taxStates || []).forEach(function (s) { have[s.state] = s; });
    var rowsHtml = (t.taxStates || []).map(function (s) {
      return '<div class="taxstate" data-st="' + esc(s.state) + '"><b>' + esc(names[s.state] || s.state) + '</b>' +
        '<select name="frequency">' + ['Monthly', 'Quarterly', 'Annual'].map(function (fq) { return '<option' + (fq === s.frequency ? ' selected' : '') + '>' + fq + '</option>'; }).join('') + '</select>' +
        '<label class="small muted">Due day <input name="dueDay" type="number" min="1" max="31" value="' + s.dueDay + '"></label>' +
        '<button type="button" class="btn sm" data-action="save-taxstate">Save</button><button type="button" class="copybtn" data-action="remove-taxstate" aria-label="Remove ' + esc(names[s.state] || s.state) + '">' + icon('x', 15, 2) + '</button></div>';
    }).join('');
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="ts-h">' +
      '<div class="card-head"><h2 id="ts-h" style="font-family:var(--display);font-size:20px;font-weight:800">States where we file sales tax</h2><button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<div class="stack" style="gap:8px">' + (rowsHtml || '<div class="empty">No states yet.</div>') + '</div>' +
      '<div class="taxstate add"><select id="ts-new"><option value="">Add a state...</option>' + Object.keys(names).filter(function (k) { return !have[k]; }).map(function (k) { return '<option value="' + k + '">' + esc(names[k]) + '</option>'; }).join('') + '</select>' +
      '<select id="ts-freq"><option>Monthly</option><option selected>Quarterly</option><option>Annual</option></select><label class="small muted">Due day <input id="ts-day" type="number" min="1" max="31" value="20"></label>' +
      '<button type="button" class="btn sm primary" data-action="add-taxstate">Add</button></div>' +
      '<p class="small muted" style="margin:0">Use the due day your state gives you, for example 20 for the 20th of the month after the period ends. Use 31 for the last day of that month.</p></div></div>';
  }

  function taxStateCall(payload) {
    payload.kind = state.taxKind || 'quarter';
    return api('saveTaxState', payload).then(function (t) { state.tax = t; openTaxStatesModal(); paintFinance(); toast('Saved'); })
      .catch(function (err) { if (err.code !== 'auth_expired') toast(err.message, true); });
  }

  function financeYearEnd() {
    var r = state.ye;
    if (!r) { loadYearEnd().then(paintFinance).catch(function (err) { if (err.code !== 'auth_expired') toast(err.message, true); }); return '<div class="skel" style="height:420px"></div>'; }
    var t = r.totals;
    var total = t.b2c + t.lease + t.purchase;
    var y0 = new Date().getFullYear();
    var years = [y0, y0 - 1, y0 - 2].map(function (y) { return '<option' + (String(y) === r.year ? ' selected' : '') + '>' + y + '</option>'; }).join('');
    var usd0 = function (v) { return '$' + Math.round(v || 0).toLocaleString('en-US'); };
    var k = function (label, v, note) { return '<div class="kpi"><span class="label">' + esc(label) + '</span><span class="value">' + esc(v) + '</span>' + (note ? '<span class="small muted">' + esc(note) + '</span>' : '') + '</div>'; };
    var max = Math.max.apply(null, r.months.map(function (m) { return m.total; }).concat([1]));
    var monthsAll = []; for (var i = 1; i <= 12; i++) monthsAll.push(r.year + '-' + String(i).padStart(2, '0'));
    var bars = monthsAll.map(function (key) {
      var m = r.months.filter(function (x) { return x.key === key; })[0] || { b2c: 0, lease: 0, purchase: 0, total: 0 };
      var h = function (v) { return Math.round(v / max * 150); };
      return '<div class="ybar" title="' + esc(periodName(key)) + ': ' + usd(m.total) + '"><div class="stackbar"><i style="height:' + h(m.purchase) + 'px;background:#E08A1E"></i><i style="height:' + h(m.lease) + 'px;background:#5FA02E"></i><i style="height:' + h(m.b2c) + 'px;background:#1F6FB5"></i></div><span>' + esc(fmtDate(key + '-15T12:00:00', { month: 'short' })) + '</span></div>';
    }).join('');
    var table = function (rows, label, limit) {
      return '<section class="tablecard"><div class="scroll"><table><thead><tr><th>' + label + '</th>' + (label === 'Product' ? '<th style="text-align:right">Qty</th>' : '') + '<th style="text-align:right">Web (B2C)</th><th style="text-align:right">Lease payments</th><th style="text-align:right">B2B sales and services</th><th style="text-align:right">Total</th></tr></thead><tbody>' +
        (rows.length ? rows.slice(0, limit).map(function (x) { return '<tr><td>' + (label === 'School' ? '<a class="plain" href="' + schoolHref(x.key) + '">' + esc(x.key) + '</a>' : esc(x.key)) + '</td>' + (label === 'Product' ? '<td style="text-align:right">' + fmtNum(x.qty) + '</td>' : '') +
          '<td style="text-align:right">' + usd(x.b2c) + '</td><td style="text-align:right">' + usd(x.lease) + '</td><td style="text-align:right">' + usd(x.purchase) + '</td><td style="text-align:right"><b>' + usd(x.total) + '</b></td></tr>'; }).join('') : '<tr><td colspan="6"><div class="empty">No sales for this year yet.</div></td></tr>') +
        '</tbody></table></div>' + (rows.length > limit ? '<div class="tfoot"><span>Showing the top ' + limit + ' of ' + rows.length + '. The CSV has all of them.</span></div>' : '') + '</section>';
    };
    return '<div class="row" style="justify-content:space-between"><div class="field" style="width:160px"><label for="ye-year" class="sr-only">Year</label><select id="ye-year">' + years + '</select></div>' +
      '<div class="row" style="gap:8px"><span class="small muted">' + (r.syncedAt ? 'Web orders synced ' + esc(relTime(r.syncedAt)) : 'Web orders not synced yet') + '</span>' +
      '<button type="button" class="btn sm" data-action="export-ye">' + icon('file', 14, 2) + 'Export CSV</button></div></div>' +
      '<section class="kpis">' + k('Total revenue', usd0(total), r.year) + k('Web rentals and sales', usd0(t.b2c), 'WooCommerce, before tax') + k('Lease payments', usd0(t.lease), 'Invoices sent or paid') + k('B2B sales and services', usd0(t.purchase), 'Invoices sent or paid') + k('Sales tax collected', usd0(t.tax), 'Refunds ' + usd(t.refunds)) + '</section>' +
      '<section class="card"><div class="card-head"><h2>By month</h2><div class="maplegend" style="position:static;box-shadow:none;border:0;padding:0"><span><i style="background:#1F6FB5"></i>Web</span><span><i style="background:#5FA02E"></i>Lease</span><span><i style="background:#E08A1E"></i>B2B sales</span></div></div><div class="ybars">' + bars + '</div></section>' +
      '<div class="card-head"><h2>By product</h2></div>' + table(r.products, 'Product', 50) +
      '<div class="card-head"><h2>By school</h2></div>' + table(r.schools, 'School', 25);
  }

  function exportYearEndCsv() {
    var r = state.ye;
    var rows = [['Year', 'Group', 'Name', 'Qty', 'Web (B2C)', 'Lease payments', 'B2B sales and services', 'Total', 'Sales tax']];
    r.products.forEach(function (x) { rows.push([r.year, 'Product', x.key, x.qty, x.b2c, x.lease, x.purchase, x.total, x.tax]); });
    r.schools.forEach(function (x) { rows.push([r.year, 'School', x.key, '', x.b2c, x.lease, x.purchase, x.total, x.tax]); });
    r.months.forEach(function (x) { rows.push([r.year, 'Month', x.key, '', x.b2c, x.lease, x.purchase, x.total, x.tax]); });
    downloadCsv('pangia-year-end-' + r.year + '.csv', rows);
  }

  /* ---------------------------------------------------------------- */
  /* Inventory                                                        */
  /* ---------------------------------------------------------------- */

  var SHIP_HINTS = {
    Shipment: 'Units leave a warehouse for a school.',
    Pickup: 'Units come back from a school to a warehouse.',
    Transfer: 'Units move between two warehouses or two schools.',
    Received: 'New units arrive from the supplier.',
    Sale: 'Units are sold to a school and stop being ours.',
    Count: 'You counted a location. This sets its number for that product.',
    'Write-off': 'Units are damaged, scrapped or lost.'
  };
  var SHIP_CLASS = { Shipment: 'b-info', Pickup: 'b-good', Transfer: 'b-mute', Received: 'b-good', Sale: 'b-warn', Count: 'b-mute', 'Write-off': 'b-bad' };

  // Same rules as schoolKey_ in Apps Script, so map pins and school pages find their inventory.
  function schoolKey(name) {
    return String(name || '').replace(/&amp;/gi, '&').toLowerCase().replace(/univesity/g, 'university').replace(/\bsaint\b/g, 'st').replace(/&/g, ' ')
      .replace(/\b(and|at|the)\b/g, ' ').replace(/[^a-z0-9]/g, '');
  }

  function loadInventory(force) {
    if (state.inv && !force) return Promise.resolve(state.inv);
    return api('inventory').then(function (r) { state.inv = r; return r; });
  }

  function viewInventory(query) {
    state.invTab = query.tab || state.invTab || 'stock';
    if (query.loc) { state.invQ = query.loc; state.invTab = 'stock'; }
    return '<header class="pagehead"><div class="titles"><h1 class="h1">Inventory</h1><p class="sub">Units at every warehouse and school, all calculated from one shipments log.</p></div></header>' +
      '<div id="inv-body">' + (state.inv ? inventoryBody() : '<div class="kpis"><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div></div><div class="skel" style="height:360px;margin-top:20px"></div>') + '</div>';
  }

  function paintInventory() {
    var b = $('#inv-body');
    if (b && parseRoute().name === 'inventory') b.innerHTML = inventoryBody();
  }

  // Units at a school are grouped by the school's program: rental (students rent online) or lease.
  function locGroup(l) {
    if (l.kind !== 'school') return l.kind;
    return /rental/i.test(l.program || '') ? 'rental' : /lease/i.test(l.program || '') ? 'lease' : 'other';
  }

  function productName(id) {
    var p = ((state.inv || {}).products || []).filter(function (x) { return x.id === id; })[0];
    return p ? p.name : id;
  }

  function inventoryBody() {
    var v = state.inv;
    var sumKind = function (k) { return v.locations.filter(function (l) { return l.kind === k || locGroup(l) === k; }).reduce(function (a, l) { return a + l.total; }, 0); };
    var otherAtSchools = sumKind('other');
    var crit = (v.b2c || []).filter(function (s) { return s.status === 'Critical'; }).length;
    var tabs = [['stock', 'Stock by location'], ['log', 'Shipments log'], ['rental', 'Rental stock'], ['products', 'Products']];
    var body = state.invTab === 'log' ? invLog() : state.invTab === 'rental' ? invRental() : state.invTab === 'products' ? invProducts() : invStock();
    var kpiCard = function (label, value, x, note) { return '<div class="kpi"><span class="label">' + esc(label) + '</span><span class="value">' + esc(value) + '</span><span class="small muted">' + esc(note) + '</span></div>'; };
    return '<section class="kpis" aria-label="Inventory summary">' +
      kpiCard('In warehouses', fmtNum(sumKind('warehouse')), '', (function (n) { return n + (n === 1 ? ' location' : ' locations') + ' with stock'; })(v.locations.filter(function (l) { return l.kind === 'warehouse' && l.total; }).length)) +
      kpiCard('At rental schools', fmtNum(sumKind('rental')), '', 'Units placed for student rentals') +
      kpiCard('At lease schools', fmtNum(sumKind('lease') + otherAtSchools), '', otherAtSchools ? fmtNum(otherAtSchools) + ' at schools with no program set' : 'Units leased to schools') +
      kpiCard('Sold to schools', fmtNum(sumKind('sold')), '', 'Logged sales') +
      kpiCard('Rental stock to check', String(crit), '', crit ? 'Schools at critical stock' : 'No critical schools') + '</section>' +
      '<div class="row" style="justify-content:space-between;margin-top:20px"><div class="segbar" role="group" aria-label="Inventory sections">' + tabs.map(function (x) {
        return '<button type="button" class="seg" data-invtab="' + x[0] + '" aria-pressed="' + (state.invTab === x[0]) + '">' + x[1] + '</button>';
      }).join('') + '</div>' + (v.canEdit ? '<button type="button" class="btn primary" data-action="log-shipment">' + icon('plus', 16, 2) + 'Log a shipment</button>' : '') + '</div>' + body;
  }

  function invStock() {
    var v = state.inv;
    var f = state.invKind || 'all';
    var q = norm(state.invQ || '');
    var counts = { all: 0, warehouse: 0, rental: 0, lease: 0, other: 0, sold: 0 };
    v.locations.forEach(function (l) { var g = locGroup(l); if (counts[g] != null) { counts[g]++; counts.all++; } });
    var list = v.locations.filter(function (l) { var g = locGroup(l); return counts[g] != null && (f === 'all' || g === f || (f === 'lease' && g === 'other')) && (!q || norm(l.label).indexOf(q) !== -1); });
    var kindLabel = { warehouse: 'Warehouse', rental: 'Rental school', lease: 'Lease school', other: 'At school', sold: 'Sold to school' };
    var pills = [['all', 'All'], ['warehouse', 'Warehouses'], ['rental', 'Rental schools'], ['lease', 'Lease schools'], ['sold', 'Sold']].map(function (x) {
      return '<button type="button" class="pill sm" data-invkind="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + ' · ' + (counts[x[0]] + (x[0] === 'lease' ? counts.other : 0)) + '</button>';
    }).join('');
    return '<div class="row" style="justify-content:space-between;margin-top:16px"><div class="row" style="gap:6px">' + pills + '</div>' +
      '<div class="field" style="width:280px"><label for="inv-q" class="sr-only">Search locations</label><input id="inv-q" type="search" placeholder="Search locations" value="' + esc(state.invQ || '') + '" autocomplete="off"></div></div>' +
      '<section class="tablecard" aria-label="Stock by location"><div class="scroll"><table><thead><tr><th>Location</th><th>Kind</th><th>Products</th><th style="text-align:right">Units</th><th>Last movement</th></tr></thead><tbody id="inv-rows">' +
      (list.length ? list.map(function (l) {
        var items = Object.keys(l.items).sort(function (a, b) { return l.items[b] - l.items[a]; });
        var name = l.school && l.kind !== 'warehouse' ? '<a class="plain" href="' + schoolHref(l.school) + '"><b>' + esc(l.label) + '</b></a>' : '<b>' + esc(l.label) + '</b>';
        return '<tr><td>' + name + (l.type ? '<div class="small muted">' + esc(l.type) + '</div>' : '') + '</td><td><span class="badge sm ' + (l.kind === 'warehouse' ? 'b-info' : l.kind === 'sold' ? 'b-warn' : locGroup(l) === 'rental' ? 'b-good' : 'b-mute') + '">' + kindLabel[locGroup(l)] + '</span></td>' +
          '<td>' + (items.length ? '<div class="row" style="gap:6px">' + items.map(function (p) { return '<span class="chip' + (l.items[p] < 0 ? ' neg' : '') + '">' + fmtNum(l.items[p]) + ' ' + esc(productName(p)) + '</span>'; }).join('') + '</div>' : '<span class="muted small">' + (l.kind === 'warehouse' ? 'No count yet' : 'None') + '</span>') + '</td>' +
          '<td style="text-align:right"><b>' + fmtNum(l.total) + '</b></td>' +
          '<td class="small">' + (l.last ? esc(l.last.type) + ', ' + fmtNum(l.last.qty) + '<div class="muted">' + esc(fmtYmd(l.last.date)) + '</div>' : '<span class="muted">Nothing logged</span>') + '</td></tr>';
      }).join('') : '<tr><td colspan="5"><div class="empty">No locations match.</div></td></tr>') + '</tbody></table></div>' +
      '<div class="tfoot"><span>Warehouses are the storage locations on the Map. Add a Count to set a starting number, then log shipments and pickups as they happen. A negative number means more left than was counted in.</span></div></section>';
  }

  function invLog() {
    var v = state.inv;
    var t = state.invType || 'All';
    var q = norm(state.invLogQ || '');
    var list = v.shipments.filter(function (s) {
      return (t === 'All' || s.type === t) && (!q || norm([s.fromLabel, s.toLabel, productName(s.product), s.ref, s.notes].join(' ')).indexOf(q) !== -1);
    });
    return '<div class="row" style="justify-content:space-between;margin-top:16px"><div class="row" style="gap:10px">' +
      '<div class="field" style="width:180px"><label for="inv-type" class="sr-only">Type</label><select id="inv-type">' + ['All'].concat(v.options.types).map(function (x) { return '<option' + (x === t ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field" style="width:280px"><label for="inv-logq" class="sr-only">Search the log</label><input id="inv-logq" type="search" placeholder="Search places, products, references" value="' + esc(state.invLogQ || '') + '" autocomplete="off"></div></div>' +
      '<button type="button" class="btn sm" data-action="export-ship">' + icon('file', 14, 2) + 'Export CSV</button></div>' +
      '<section class="tablecard" aria-label="Shipments log"><div class="scroll"><table><thead><tr><th>Date</th><th>Type</th><th>Product</th><th style="text-align:right">Qty</th><th>From</th><th>To</th><th>Reference</th><th>By</th></tr></thead><tbody>' +
      (list.length ? list.map(function (s) {
        var auto = s.source === 'WooCommerce';
        return '<tr' + (v.canEdit && !auto ? ' class="clickrow" data-action="edit-shipment" data-id="' + esc(s.id) + '" tabindex="0"' : '') + '><td style="white-space:nowrap">' + esc(fmtYmd(s.date)) + '</td>' +
          '<td><span class="badge sm ' + (SHIP_CLASS[s.type] || 'b-mute') + '">' + esc(s.type) + '</span>' + (auto ? ' <span class="badge sm b-info" title="Calculated from WooCommerce order statuses. Not editable here.">Auto</span>' : '') + '</td><td>' + esc(productName(s.product)) + '</td><td style="text-align:right"><b>' + fmtNum(s.qty) + '</b></td>' +
          '<td>' + esc(s.type === 'Count' ? '' : s.fromLabel) + '</td><td>' + esc(s.toLabel) + '</td><td class="small">' + esc(s.ref) + (s.notes ? '<div class="muted">' + esc(s.notes) + '</div>' : '') + '</td><td class="small muted" style="white-space:nowrap">' + esc(s.by) + '</td></tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty">' + (v.shipments.length ? 'Nothing matches.' : 'No shipments yet. Log the first one, or add a Count for each warehouse.') + '</div></td></tr>') +
      '</tbody></table></div>' + (v.shipmentCount > v.shipments.length ? '<div class="tfoot"><span>Showing the latest ' + v.shipments.length + ' of ' + fmtNum(v.shipmentCount) + '. The full log is in the Shipments tab of the data sheet.</span></div>' : '') + '</section>';
  }

  function invRental() {
    var v = state.inv;
    var rank = { Critical: 0, Low: 1, Check: 2, Healthy: 3 };
    var pf = state.invRentalProduct || 'All';
    var names = {};
    (v.b2c || []).forEach(function (s) { (s.products || []).forEach(function (p) { names[p.label] = true; }); });
    var schools = (v.b2c || []).map(function (s) {
      var prods = (s.products || []).filter(function (p) { return pf === 'All' || p.label === pf; })
        .sort(function (a, b) { return (rank[a.status] != null ? rank[a.status] : 4) - (rank[b.status] != null ? rank[b.status] : 4) || a.label.localeCompare(b.label); });
      return { school: s.school, prods: prods, worst: prods.length ? (rank[prods[0].status] != null ? rank[prods[0].status] : 4) : 9 };
    }).filter(function (s) { return s.prods.length; }).sort(function (a, b) { return a.worst - b.worst || a.school.localeCompare(b.school); });
    var rows = '';
    schools.forEach(function (s) {
      s.prods.forEach(function (p, i) {
        rows += '<tr' + (i === 0 ? ' class="grpstart"' : '') + '><td>' + (i === 0 ? '<a class="plain" href="' + schoolHref(s.school) + '"><b>' + esc(s.school) + '</b></a>' : '') + '</td>' +
          '<td>' + esc(p.label) + '</td><td>' + (p.ordered ? covBar(p.inStock, p.ordered, p.status) : '') + '</td>' +
          '<td style="text-align:right">' + (p.inStock == null ? '<span class="muted">-</span>' : fmtNum(p.inStock)) + '</td><td style="text-align:right">' + fmtNum(p.ordered || 0) + '</td>' +
          '<td>' + (p.status ? '<span class="badge sm ' + (STOCK_CLASS[p.status] || 'b-mute') + '">' + esc(p.status) + '</span>' : '') + '</td></tr>';
      });
    });
    return '<div class="row" style="justify-content:flex-end;margin-top:16px"><div class="field" style="width:260px"><label for="inv-rprod" class="sr-only">Product</label><select id="inv-rprod">' +
      ['All'].concat(Object.keys(names).sort()).map(function (n) { return '<option value="' + esc(n) + '"' + (n === pf ? ' selected' : '') + '>' + (n === 'All' ? 'All products' : esc(n)) + '</option>'; }).join('') + '</select></div></div>' +
      '<section class="tablecard" aria-label="Rental stock"><div class="scroll"><table><thead><tr><th>School</th><th>Product</th><th style="width:28%">Coverage</th><th style="text-align:right">In stock</th><th style="text-align:right">Ordered</th><th>Status</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6"><div class="empty">No rental stock found in the Inventory Dashboard sheet.</div></td></tr>') +
      '</tbody></table></div><div class="tfoot"><span>Rental (B2C) stock per school and product, read from the Inventory Dashboard sheet that syncs with WooCommerce. Worst status first.' + (state.data.inventoryDashboardUrl ? ' <a href="' + esc(safeUrl(state.data.inventoryDashboardUrl)) + '" target="_blank" rel="noopener">Open the dashboard</a>' : '') + '</span></div></section>';
  }

  function invProducts() {
    var v = state.inv;
    return '<div class="row" style="justify-content:flex-end;margin-top:16px">' + (v.canEdit ? '<button type="button" class="btn sm" data-action="add-product">' + icon('plus', 14, 2) + 'Add a product</button>' : '') + '</div>' +
      '<section class="tablecard" aria-label="Products"><div class="scroll"><table><thead><tr><th>Product</th><th>Category</th><th>Also called</th><th>Status</th></tr></thead><tbody>' +
      v.products.map(function (p) {
        return '<tr' + (v.canEdit ? ' class="clickrow" data-action="edit-product" data-id="' + esc(p.id) + '" tabindex="0"' : '') + '><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.category) + '</td><td class="small muted">' + esc(p.aliases.join(', ')) + '</td><td>' + (p.active ? '<span class="badge sm b-good">Active</span>' : '<span class="badge sm b-mute">Retired</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div><div class="tfoot"><span>"Also called" helps Pangia read notes like "3.2 CB" or "232 C" when importing.</span></div></section>';
  }

  function locOptions(selected, kinds) {
    var v = state.inv;
    var opt = function (val, label) { return '<option value="' + esc(val) + '"' + (val === selected ? ' selected' : '') + '>' + esc(label) + '</option>'; };
    var wh = v.locations.filter(function (l) { return l.kind === 'warehouse'; });
    var schools = v.schools.slice();
    v.locations.forEach(function (l) { if (l.school && l.kind !== 'warehouse' && schools.indexOf(l.school) === -1) schools.push(l.school); });
    schools.sort();
    var html = '<option value="">Pick a place</option>';
    if (kinds.indexOf('wh') !== -1) html += '<optgroup label="Warehouses and storage">' + wh.map(function (l) { return opt(l.loc, l.label); }).join('') + '</optgroup>';
    if (kinds.indexOf('school') !== -1) html += '<optgroup label="Schools (rental or lease, units we own)">' + schools.map(function (s) { return opt('school:' + s, s); }).join('') + '</optgroup>';
    if (kinds.indexOf('sold') !== -1) html += '<optgroup label="Sold to school">' + schools.map(function (s) { return opt('sold:' + s, s + ' (sold)'); }).join('') + '</optgroup>';
    var other = [];
    if (kinds.indexOf('supplier') !== -1) other.push(opt('supplier', 'Supplier'));
    if (kinds.indexOf('scrap') !== -1) other.push(opt('scrap', 'Written off'));
    if (other.length) html += '<optgroup label="Other">' + other.join('') + '</optgroup>';
    return html;
  }

  var SHIP_LOCS = {
    Shipment: [['wh'], ['school', 'sold']], Pickup: [['school', 'sold'], ['wh']], Transfer: [['wh', 'school'], ['wh', 'school']],
    Received: [['supplier'], ['wh']], Sale: [['wh', 'supplier'], ['sold']], Count: [[], ['wh', 'school', 'sold']], 'Write-off': [['wh', 'school'], ['scrap']]
  };

  function openShipmentModal(s, preset) {
    var v = state.inv;
    if (!v || !v.canEdit) return;
    closePalette();
    s = s || {};
    preset = preset || {};
    var type = s.type || preset.type || 'Shipment';
    var locs = SHIP_LOCS[type] || SHIP_LOCS.Shipment;
    var from = s.from || preset.from || (type === 'Received' ? 'supplier' : '');
    var to = s.to || preset.to || (type === 'Write-off' ? 'scrap' : '');
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="sh-h">' +
      '<div class="card-head"><h2 id="sh-h" style="font-family:var(--display);font-size:20px;font-weight:800">' + (s.id ? 'Edit ' + (type === 'Count' ? 'count' : 'shipment') : type === 'Count' ? 'Log a count' : 'Log a shipment') + '</h2>' +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<form class="form" id="shipment-form" data-id="' + esc(s.id || '') + '" novalidate><div class="fields">' +
      '<div class="field"><label for="sh-type">Type</label><select id="sh-type" name="type">' + v.options.types.map(function (x) { return '<option' + (x === type ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="sh-date">Date</label><input id="sh-date" name="date" type="date" value="' + esc(s.date || todayYmd()) + '"></div>' +
      '<p class="small muted" style="margin:-4px 0 0;grid-column:1/-1">' + esc(SHIP_HINTS[type]) + '</p>' +
      '<div class="field"><label for="sh-product">Product</label><select id="sh-product" name="product"><option value="">Pick a product</option>' + v.products.filter(function (p) { return p.active || p.id === s.product; }).map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === s.product ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="sh-qty">' + (type === 'Count' ? 'Counted' : 'Quantity') + '</label><input id="sh-qty" name="qty" type="number" min="0" step="1" inputmode="numeric" value="' + esc(s.qty != null ? s.qty : '') + '"></div>' +
      (type === 'Count' ? '' : '<div class="field full"><label for="sh-from">From</label><select id="sh-from" name="from">' + locOptions(from, locs[0]) + '</select></div>') +
      '<div class="field full"><label for="sh-to">' + (type === 'Count' ? 'Where you counted' : 'To') + '</label><select id="sh-to" name="to">' + locOptions(to, locs[1]) + '</select></div>' +
      '<div class="field"><label for="sh-ref">Reference <span class="muted" style="font-weight:400">(optional)</span></label><input id="sh-ref" name="ref" placeholder="PO, BOL or log row" value="' + esc(s.ref || '') + '"></div>' +
      '<div class="field"><label for="sh-notes">Notes <span class="muted" style="font-weight:400">(optional)</span></label><input id="sh-notes" name="notes" value="' + esc(s.notes || '') + '"></div>' +
      '</div><div class="formfoot" style="border:0;padding:0">' + (s.id ? '<button type="button" class="btn sm" data-action="del-shipment">Delete</button>' : '<span></span>') +
      '<button type="submit" class="btn primary">' + (s.id ? 'Save' : 'Log it') + '</button></div></form></div></div>';
  }

  function openProductModal(p) {
    var v = state.inv;
    if (!v || !v.canEdit) return;
    p = p || { category: 'Combo', active: true, aliases: [] };
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="pr-h">' +
      '<div class="card-head"><h2 id="pr-h" style="font-family:var(--display);font-size:20px;font-weight:800">' + (p.id ? 'Edit product' : 'Add a product') + '</h2>' +
      '<button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<form class="form" id="product-form" data-id="' + esc(p.id || '') + '" novalidate><div class="fields">' +
      '<div class="field"><label for="pr-name">Name</label><input id="pr-name" name="name" value="' + esc(p.name || '') + '"></div>' +
      '<div class="field"><label for="pr-cat">Category</label><select id="pr-cat" name="category">' + v.options.categories.map(function (c) { return '<option' + (c === p.category ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="field full"><label for="pr-al">Also called <span class="muted" style="font-weight:400">(comma separated)</span></label><input id="pr-al" name="aliases" value="' + esc((p.aliases || []).join(', ')) + '"></div>' +
      '<div class="field"><label for="pr-act">Status</label><select id="pr-act" name="active"><option value="Y"' + (p.active ? ' selected' : '') + '>Active</option><option value="N"' + (p.active ? '' : ' selected') + '>Retired</option></select></div>' +
      '</div><div class="formfoot" style="border:0;padding:0"><span></span><button type="submit" class="btn primary">Save product</button></div></form></div></div>';
    $('#pr-name').focus();
  }

  function invSave(action, payload, btn, msg) {
    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    return api(action, payload).then(function (r) {
      state.inv = r;
      closeModal();
      toast(msg);
      var rt = parseRoute();
      if (rt.name === 'inventory') paintInventory();
      else if (rt.name === 'school') { delete state.schoolCache[rt.school]; loadSchool(rt.school); }
      refreshInvSummary();
    }).catch(function (err) { if (btn) { btn.disabled = false; btn.textContent = label; } if (err.code !== 'auth_expired') toast(err.message, true); });
  }

  // Rebuild the per-location summary used by the map from the fresh inventory data.
  function refreshInvSummary() {
    var v = state.inv, out = {};
    if (!v) return;
    v.locations.forEach(function (l) {
      var key = l.kind === 'warehouse' ? 'wh:' + l.storageId : l.kind + ':' + schoolKey(l.school);
      var prev = out[key] || { units: 0, last: null };
      prev.units += l.total;
      if (l.last && (!prev.last || l.last.date > prev.last.date)) prev.last = l.last;
      out[key] = prev;
    });
    state.data.invSummary = out;
  }

  function exportShipmentsCsv() {
    var v = state.inv;
    var rows = [['Date', 'Type', 'Product', 'Qty', 'From', 'To', 'Reference', 'Notes', 'By']];
    v.shipments.forEach(function (s) { rows.push([s.date, s.type, productName(s.product), s.qty, s.type === 'Count' ? '' : s.fromLabel, s.toLabel, s.ref, s.notes, s.by]); });
    downloadCsv('pangia-shipments-' + todayYmd() + '.csv', rows);
  }

  function invSummaryLine(key) {
    var x = (state.data.invSummary || {})[key];
    if (!x) return '';
    return '<div style="display:flex;flex-direction:column;gap:2px"><b style="font-size:15px">' + fmtNum(x.units) + ' units</b>' +
      (x.last ? '<span class="small muted">Last: ' + esc(x.last.type) + ' of ' + fmtNum(x.last.qty) + ' on ' + esc(fmtYmd(x.last.date)) + '</span>' : '') + '</div>';
  }

  function inventoryCard(inv, schoolName) {
    if (!inv) return '';
    var list = function (arr) { return arr.map(function (x) { return '<span class="chip">' + fmtNum(x.qty) + ' ' + esc(x.product) + '</span>'; }).join(''); };
    var editable = state.inv ? state.inv.canEdit : can('inventory.edit');
    var has = inv.placed.length || inv.sold.length || inv.moves.length;
    return '<section class="card" aria-labelledby="ic-h"><div class="card-head"><h2 id="ic-h">Inventory</h2>' +
      '<a href="#/inventory?tab=stock&loc=' + encodeURIComponent(schoolName) + '">All inventory</a></div>' +
      (has ? (inv.placed.length ? '<div class="pblock"><span class="legend-title">Units we own here</span><div class="row" style="gap:6px">' + list(inv.placed) + '</div></div>' : '') +
        (inv.sold.length ? '<div class="pblock"><span class="legend-title">Sold to this school</span><div class="row" style="gap:6px">' + list(inv.sold) + '</div></div>' : '') +
        (inv.moves.length ? '<div class="pblock"><span class="legend-title">Recent movements</span>' + inv.moves.map(function (m) {
          return '<div class="row" style="justify-content:space-between;gap:8px"><span class="small"><span class="badge sm ' + (SHIP_CLASS[m.type] || 'b-mute') + '">' + esc(m.type) + '</span> ' + fmtNum(m.qty) + ' ' + esc(m.product) +
            (m.type === 'Count' ? '' : '<span class="muted">, ' + esc(m.from) + ' to ' + esc(m.to) + '</span>') + '</span><span class="small muted" style="white-space:nowrap">' + esc(fmtYmd(m.date)) + '</span></div>';
        }).join('') + '</div>' : '')
        : '<div class="empty">No shipments logged for this school yet.</div>') +
      (editable ? '<button type="button" class="btn" style="width:100%" data-action="log-shipment" data-school="' + esc(schoolName) + '">' + icon('plus', 16, 2) + 'Log a shipment</button>' : '') + '</section>';
  }

  /* ---------------------------------------------------------------- */
  /* Dynamic home: to-do strip, sparklines, count-up, auto refresh,   */
  /* clickable season timeline, mini map and home customization       */
  /* ---------------------------------------------------------------- */

  function todoStrip() {
    var t = state.data.todo;
    if (!t) return '';
    if (!t.length) return '<section class="todo calm" aria-label="Today"><span class="todo-h">' + icon('check', 16, 2.2) + 'Today</span><span class="muted small">Nothing needs you right now. Nice.</span></section>';
    return '<section class="todo" aria-label="Today"><span class="todo-h">' + icon('spark', 16, 2.2) + 'Today</span>' + t.map(function (x) {
      return '<a class="todo-item t-' + esc(x.tone) + '" href="' + esc(x.href) + '"><b data-count="' + x.count + '">' + fmtNum(x.count) + '</b><span>' + esc(x.label) + '</span>' + icon('chev', 14, 2) + '</a>';
    }).join('') + '</section>';
  }

  // A tiny 30-day trend line from Daily Stats. Up is good unless "lowerIsBetter".
  function sparkline(field, lowerIsBetter) {
    var pts = (state.data.trends || []).filter(function (r) { return r[field] != null; });
    if (pts.length < 2) return '<span class="spark-note">Trend line starts filling in tomorrow</span>';
    var vals = pts.map(function (r) { return r[field]; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), w = 120, h = 30;
    var span = max - min || 1;
    var xy = vals.map(function (v, i) { return [Math.round(i / (vals.length - 1) * w * 10) / 10, Math.round((h - 3 - (v - min) / span * (h - 6)) * 10) / 10]; });
    var first = vals[0], last = vals[vals.length - 1], diff = last - first;
    var good = diff === 0 ? null : (diff > 0) !== !!lowerIsBetter;
    var color = good == null ? 'var(--muted)' : good ? '#3F8F2E' : '#C2410C';
    var line = xy.map(function (p) { return p.join(','); }).join(' ');
    return '<span class="spark" title="' + esc(pts[0].d + ' to ' + pts[pts.length - 1].d) + '"><svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
      '<polyline points="0,' + h + ' ' + line + ' ' + w + ',' + h + '" fill="' + color + '" opacity=".1"/>' +
      '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + xy[xy.length - 1][0] + '" cy="' + xy[xy.length - 1][1] + '" r="2.6" fill="' + color + '"/></svg>' +
      '<small style="color:' + color + '">' + (diff === 0 ? 'No change' : (diff > 0 ? '+' : '') + fmtNum(Math.round(diff)) + ' in ' + (pts.length - 1) + ' days') + '</small></span>';
  }

  // Numbers marked data-count count up from 0 (or from their old value on refresh).
  function countUp(root, from) {
    if (calmMotion()) return;
    (root || document).querySelectorAll('[data-count]').forEach(function (el) {
      var to = Number(el.getAttribute('data-count'));
      if (!isFinite(to)) return;
      var start = from && from[el.getAttribute('data-key') || ''] != null ? from[el.getAttribute('data-key')] : 0;
      if (start === to) return;
      var t0 = performance.now(), dur = 700;
      var step = function (t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmtNum(Math.round(start + (to - start) * e));
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = fmtNum(start);
      requestAnimationFrame(step);
    });
  }

  // Refresh the data every 5 minutes while the home page is open and nobody is mid-task.
  var autoTimer = null;
  function startAutoRefresh() {
    clearInterval(autoTimer);
    autoTimer = setInterval(function () {
      var rt = parseRoute();
      if (!state.data || rt.name !== 'home' || state.modal || state.palette.open || document.hidden) return;
      var before = {};
      document.querySelectorAll('[data-count][data-key]').forEach(function (el) { before[el.getAttribute('data-key')] = Number(el.getAttribute('data-count')); });
      api('bootstrap').then(function (data) {
        if (parseRoute().name !== 'home' || state.modal || state.palette.open) return;
        var y = window.scrollY;
        state.data = data;
        renderRoute(true);
        window.scrollTo(0, y);
        countUp(document, before);
        var note = $('#home-updated'); if (note) note.textContent = 'Updated just now';
      }).catch(function () { /* try again next time */ });
    }, 5 * 60 * 1000);
  }

  // Season timeline: what happens in each month.
  var MONTH_NOTES = [
    'Spring term is starting. Lock in renewals and restock before spring orders open.',
    'Spring term. Stay on top of CM tasks.',
    'Spring term. Line up renewals before the May collection.',
    'Spring term. Spring collection prep: get Collection Logs ready.',
    'Spring collection. The big pickup of the year.',
    'Pre-season. Restock low schools and check contracts.',
    'Pre-season. Early bird ends July 31. Deliveries start next month.',
    'Delivery season. Move-in deliveries are underway.',
    'Fall term. Campuses are settled in.',
    'Off season. Renewals and restocking.',
    'Off season. Fall collection is next month.',
    'Fall collection. Fall rentals are picked up.'
  ];
  function monthDetail(i) {
    var names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var now = new Date();
    var year = i < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
    var ends = state.data.schools.filter(function (s) {
      if (!s.contract || !s.contract.end) return false;
      var e = toDate(s.contract.end);
      return e.getMonth() === i && e.getFullYear() === year;
    });
    return '<div class="mdetail" role="region" aria-live="polite"><div class="row" style="justify-content:space-between"><b>' + names[i] + ' ' + year + '</b><button type="button" class="copybtn light" data-action="month-close" aria-label="Close">' + icon('x', 14, 2) + '</button></div>' +
      '<span>' + esc(MONTH_NOTES[i]) + '</span>' +
      (ends.length ? '<span class="mlist"><b>' + ends.length + ' contract' + (ends.length === 1 ? '' : 's') + ' end:</b> ' + ends.slice(0, 6).map(function (s) { return '<a href="' + schoolHref(s.name) + '">' + esc(s.name) + '</a>'; }).join(', ') + (ends.length > 6 ? ' and ' + (ends.length - 6) + ' more' : '') + '</span>' : '<span class="mlist muted">No contracts end this month.</span>') + '</div>';
  }

  // Mini map on the home page: school pins colored by stock status.
  var HOME_PIN = { Critical: '#C2410C', Low: '#E0A42A', Healthy: '#3F8F2E', Check: '#8A94A6' };
  function homeMapCard() {
    if (!can('map') || !(state.data.locations || []).length) return '';
    return '<section class="card" aria-labelledby="hm-h" data-home="map"><div class="card-head"><h2 id="hm-h">Map</h2><a href="#/map">Open the map</a></div>' +
      '<div id="home-map" class="home-map" role="img" aria-label="Map of partner schools colored by stock status"></div>' +
      '<div class="row small muted" style="gap:12px">' + [['Critical', HOME_PIN.Critical], ['Low', HOME_PIN.Low], ['Healthy', HOME_PIN.Healthy], ['No rental stock', '#1F6FB5']].map(function (k) { return '<span class="row" style="gap:5px"><i class="dot" style="width:8px;height:8px;border-radius:50%;background:' + k[1] + '"></i>' + k[0] + '</span>'; }).join('') + '</div></section>';
  }
  function initHomeMap() {
    var el = $('#home-map');
    if (!el) return;
    loadLeaflet().then(function (L) {
      L = L || window.L;
      if (!$('#home-map') || !L) return;
      if (state.homeMap) { try { state.homeMap.remove(); } catch (e) { /* gone */ } }
      var m = L.map('home-map', { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false });
      state.homeMap = m;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'pangia-tiles' }).addTo(m);
      var byName = {};
      state.data.schools.forEach(function (s) { byName[norm(s.name)] = s; });
      var pts = [];
      state.data.locations.forEach(function (l) {
        if (l.lat == null || l.lng == null) return;
        var s = byName[norm(l.school)];
        var c = HOME_PIN[s && s.stockStatus] || '#1F6FB5';
        L.circleMarker([l.lat, l.lng], { radius: s && s.stockStatus === 'Critical' ? 6 : 4.5, color: '#fff', weight: 1.5, fillColor: c, fillOpacity: .95 }).addTo(m);
        pts.push([l.lat, l.lng]);
      });
      if (pts.length) m.fitBounds(pts, { padding: [14, 14] }); else m.setView([39.5, -96], 3);
      el.addEventListener('click', function () { location.hash = '#/map'; });
    }).catch(function () { el.innerHTML = '<div class="empty">The map could not load.</div>'; });
  }

  // Each person can hide or reorder the home cards. Saved in this browser.
  var HOME_CARDS = [['todo', 'Today'], ['kpis', 'Summary numbers'], ['attention', 'Schools needing attention'], ['renewals', 'Renewals'], ['map', 'Map'], ['activity', 'Activity']];
  function homePrefs() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem('pangia_home_' + state.data.user.email) || 'null'); } catch (e) { p = null; }
    var order = (p && p.order || []).filter(function (k) { return HOME_CARDS.some(function (c) { return c[0] === k; }); });
    HOME_CARDS.forEach(function (c) { if (order.indexOf(c[0]) === -1) order.push(c[0]); });
    return { order: order, hidden: (p && p.hidden) || [] };
  }
  function saveHomePrefs(p) { try { localStorage.setItem('pangia_home_' + state.data.user.email, JSON.stringify(p)); } catch (e) { /* private mode */ } }

  function openCustomizeHome() {
    var p = homePrefs();
    var label = {}; HOME_CARDS.forEach(function (c) { label[c[0]] = c[1]; });
    state.modal = true;
    $('#palette-root').innerHTML = '<div class="overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="ch-h">' +
      '<div class="card-head"><h2 id="ch-h" style="font-family:var(--display);font-size:20px;font-weight:800">Customize my home</h2><button type="button" class="copybtn" data-action="close-modal" aria-label="Close">' + icon('x', 18, 2) + '</button></div>' +
      '<p class="small muted" style="margin:0">Show, hide and reorder your home cards. This is saved in this browser only.</p>' +
      '<div class="stack" id="home-cards" style="gap:8px">' + p.order.map(function (k, i) {
        return '<div class="homecard-row" data-k="' + k + '"><label class="row" style="gap:10px;flex:1"><input type="checkbox"' + (p.hidden.indexOf(k) === -1 ? ' checked' : '') + '> <b>' + esc(label[k]) + '</b></label>' +
          '<button type="button" class="copybtn" data-action="home-up" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + icon('chev', 15, 2).replace('<svg', '<svg style="transform:rotate(-90deg)"') + '</button>' +
          '<button type="button" class="copybtn" data-action="home-down" aria-label="Move down"' + (i === p.order.length - 1 ? ' disabled' : '') + '>' + icon('chev', 15, 2).replace('<svg', '<svg style="transform:rotate(90deg)"') + '</button></div>';
      }).join('') + '</div>' +
      '<div class="formfoot" style="border:0;padding:0"><button type="button" class="btn sm" data-action="home-reset">Reset</button><button type="button" class="btn primary" data-action="home-save">Save</button></div></div></div>';
  }
  function readCustomizeHome() {
    var order = [], hidden = [];
    document.querySelectorAll('#home-cards .homecard-row').forEach(function (r) { var k = r.getAttribute('data-k'); order.push(k); if (!r.querySelector('input').checked) hidden.push(k); });
    return { order: order, hidden: hidden };
  }

  /* ---------------------------------------------------------------- */
  /* Notes: a quiet full-screen page whose words come from Apps Script */
  /* ---------------------------------------------------------------- */

  var KNOWN_ROUTES = ['', 'school', 'logs', 'schools', 'contracts', 'contacts', 'map', 'assets', 'finance', 'inventory'];
  function noteWord() {
    var h = location.hash.replace(/^#\/?/, '');
    return /^[a-z0-9]{4,40}$/i.test(h) && KNOWN_ROUTES.indexOf(h.toLowerCase()) === -1 ? h : '';
  }

  // Asks Apps Script about an unknown one-word link. Resolves true if it opened a note.
  function tryNote() {
    var w = noteWord();
    if (!w) return Promise.resolve(false);
    return fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify({ action: 'note', payload: { w: w } }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) return false; renderNote(j.data); return true; })
      .catch(function () { return false; });
  }

  var NOTE_HEART = '<svg width="96" height="96" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#054D80"/><path d="M17 26.5s-8.5-5.2-8.5-11a4.6 4.6 0 0 1 8.5-2.4 4.6 4.6 0 0 1 8.5 2.4c0 5.8-8.5 11-8.5 11z" fill="#F06A8B"/><circle cx="23.88" cy="7.17" r="2.2" fill="#80BC41"/></svg>';

  function renderNote(d) {
    hideSplash();
    closePalette(); closeModal();
    var stars = '';
    for (var i = 0; i < 90; i++) stars += '<i style="left:' + (Math.random() * 100).toFixed(2) + '%;top:' + (Math.random() * 100).toFixed(2) + '%;animation-delay:' + (Math.random() * 4).toFixed(2) + 's;width:' + (Math.random() < .15 ? 3 : 2) + 'px;height:' + (Math.random() < .15 ? 3 : 2) + 'px"></i>';
    $('#app').innerHTML = '<main class="sky" aria-live="polite"><div class="sky-stars" aria-hidden="true">' + stars + '</div><div class="sky-in" id="sky-in"></div></main>';
    var box = $('#sky-in');
    var e = function (s) { return esc(s); };
    var b = d.buttons || {};
    var lines = d.lines || [];
    var shown = 0;
    var next = function (label) { return '<button type="button" class="sky-btn ghost sky-next" data-skynext>' + e(label) + '</button>'; };
    var steps = [
      function () { return '<div class="sky-mark sky-morph"><span class="sky-a">' + logo(96) + '</span><span class="sky-b">' + NOTE_HEART + '</span></div><p class="sky-lead">' + e(d.intro) + '</p>' + next(b.first); },
      function () { return '<div class="sky-mark">' + NOTE_HEART + '</div><h1 class="sky-h">' + e(d.reveal) + '</h1>' + next(b.second); },
      function () {
        return '<section class="sky-card"><span class="sky-kicker">' + e(d.kicker) + '</span><b>' + e(d.toFull) + '</b><span class="sky-dim">' + e(d.subtitle) + '</span><ul id="sky-lines"></ul></section>' + next(lines.length ? b.read : b.last);
      },
      function () {
        return '<div class="sky-mark">' + NOTE_HEART + '</div><h2 class="sky-q">' + e(d.question) + '</h2>' +
          '<div class="sky-row" id="sky-act"><button type="button" class="sky-btn" data-sky="yes">' + e(b.yes) + '</button><button type="button" class="sky-btn ghost" data-sky="think">' + e(b.think) + '</button></div>' +
          '<p class="sky-dim">Love, ' + e(d.from) + '</p>';
      }
    ];
    var at = 0;
    var show = function () {
      box.classList.remove('sky-fade'); void box.offsetWidth;
      box.innerHTML = steps[at]();
      box.classList.add('sky-fade');
      var nb = box.querySelector('[data-skynext]');
      if (nb) setTimeout(function () { nb.focus(); }, 50);
    };
    if (calmMotion()) box.classList.add('calm');
    show();
    // The second answer button runs away from the pointer and from taps.
    var dodges = 0;
    var dodge = function (el) {
      dodges++;
      var w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
      if (el.style.position !== 'fixed') { var r = el.getBoundingClientRect(); var ph = document.createElement('span'); ph.style.cssText = 'display:inline-block;width:' + w + 'px;height:' + h + 'px'; el.parentNode.insertBefore(ph, el); $('.sky').appendChild(el); el.style.position = 'fixed'; el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.zIndex = 5; el.style.margin = 0; void el.offsetWidth; }
      el.style.transition = 'left .25s ease, top .25s ease';
      el.style.left = Math.round(16 + Math.random() * Math.max(0, vw - w - 32)) + 'px';
      el.style.top = Math.round(16 + Math.random() * Math.max(0, vh - h - 32)) + 'px';
      if (dodges === 6) el.textContent = 'Nope';
      if (dodges === 12) el.textContent = 'Nice try';
    };
    var skyRoot = $('.sky');
    skyRoot.addEventListener('pointerover', function (ev) { var t = ev.target.closest('[data-sky="think"]'); if (t && ev.pointerType === 'mouse') dodge(t); });
    skyRoot.addEventListener('pointerdown', function (ev) { var t = ev.target.closest('[data-sky="think"]'); if (t) { ev.preventDefault(); dodge(t); } });
    skyRoot.addEventListener('focusin', function (ev) { var t = ev.target.closest && ev.target.closest('[data-sky="think"]'); if (t) { t.blur(); dodge(t); } });
    box.addEventListener('click', function (ev) {
      var nx = ev.target.closest('[data-skynext]');
      if (nx) {
        if (at === 2 && shown < lines.length) {
          shown++;
          $('#sky-lines').insertAdjacentHTML('beforeend', '<li class="sky-new">' + e(lines[shown - 1]) + '</li>');
          nx.textContent = shown < lines.length ? b.more : b.last;
          return;
        }
        at = Math.min(at + 1, steps.length - 1);
        return show();
      }
      var btn = ev.target.closest('[data-sky]');
      if (!btn) return;
      if (btn.getAttribute('data-sky') === 'think') { dodge(btn); return; }
      var yes = btn.getAttribute('data-sky') === 'yes';
      var stray = $('.sky [data-sky="think"]'); if (stray) stray.remove();
      var msg = yes ? d.yes : d.think;
      $('#sky-act').outerHTML = '<div class="sky-yay"><h2 class="sky-q">' + e(msg[0]) + '</h2><p class="sky-dim">' + e(msg[1]) + '</p></div>';
      if (yes) { var mk = box.querySelector('.sky-mark'); if (mk) mk.classList.add('sky-beat'); skyCelebrate(); }
    });
  }

  function skyCelebrate() {
    if (calmMotion()) return;
    var root = $('.sky');
    var bits = [
      '<svg width="26" height="26" viewBox="0 0 24 24"><g fill="#F06A8B"><circle cx="12" cy="6" r="4"/><circle cx="18" cy="12" r="4"/><circle cx="12" cy="18" r="4"/><circle cx="6" cy="12" r="4"/></g><circle cx="12" cy="12" r="3" fill="#F5C542"/></svg>',
      '<svg width="26" height="26" viewBox="0 0 24 24"><g fill="#B05CC8"><circle cx="12" cy="6" r="4"/><circle cx="18" cy="12" r="4"/><circle cx="12" cy="18" r="4"/><circle cx="6" cy="12" r="4"/></g><circle cx="12" cy="12" r="3" fill="#FFF3C4"/></svg>',
      '<svg width="22" height="18" viewBox="0 0 16 13"><rect x="1" y="1" width="14" height="11" rx="1.5" fill="#80BC41"/><path d="M1 4.5h14M1 8.5h14" stroke="#fff" stroke-width="1"/></svg>',
      '<svg width="34" height="22" viewBox="0 0 46 30"><path d="M3 20c6-9 16-13 27-11 4 1 8 3 10 6l4-1-2 4c-2 3-6 4-10 4-3 0-5-1-7-1l-3 5-1-5c-6-1-12-1-18-1z" fill="#5BA8E6"/><path d="M19 9l4-6 2 7z" fill="#5BA8E6"/></svg>'
    ];
    for (var i = 0; i < 46; i++) {
      var s = document.createElement('span');
      s.className = 'sky-bit'; s.setAttribute('aria-hidden', 'true');
      s.innerHTML = bits[i % bits.length];
      s.style.left = (Math.random() * 100) + '%';
      s.style.animationDelay = (Math.random() * 2.4) + 's';
      s.style.animationDuration = (4 + Math.random() * 3) + 's';
      s.style.setProperty('--sway', (Math.random() * 80 - 40) + 'px');
      root.appendChild(s);
    }
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
    (d.assets || []).forEach(function (x) {
      if (x.status === 'Archived' || !safeUrl(x.url)) return;
      items.push({ group: 'Files', tag: esc(x.format || 'LINK'), label: x.title, sub: [x.category, x.audience, x.product].filter(Boolean).join(' · '), href: safeUrl(x.url), external: true, words: x.tags + ' ' + x.description, raw: true });
    });
    if (r !== 'School Admin') items.push({ group: 'Go to', tag: icon('home', 16), label: 'Home', sub: 'Your overview', href: '#/', raw: true });
    if (can('assets')) items.push({ group: 'Go to', tag: icon('library', 16), label: 'Asset Library', sub: 'Spec sheets, SOPs and marketing files', href: '#/assets', raw: true });
    if (can('assets.edit')) items.push({ group: 'Actions', tag: icon('plus', 16), label: 'Add a file to the library', sub: 'Asset Library', action: 'add-asset', raw: true });
    if (can('finance')) {
      items.push({ group: 'Go to', tag: icon('dollar', 16), label: 'Invoices and tax', sub: 'Finance', href: '#/finance', raw: true });
      items.push({ group: 'Go to', tag: icon('dollar', 16), label: 'Lease billing', sub: 'Finance', href: '#/finance?tab=leases', raw: true });
      items.push({ group: 'Go to', tag: icon('dollar', 16), label: 'Tax exemptions', sub: 'Finance', href: '#/finance?tab=exemptions', raw: true });
      items.push({ group: 'Go to', tag: icon('dollar', 16), label: 'Sales tax by state', sub: 'Finance', href: '#/finance?tab=tax', raw: true });
      items.push({ group: 'Go to', tag: icon('dollar', 16), label: 'Year-end summary', sub: 'Finance', href: '#/finance?tab=yearend', raw: true });
    }
    if (can('inventory')) {
      items.push({ group: 'Go to', tag: icon('layers', 16), label: 'Inventory', sub: 'Stock by location', href: '#/inventory', raw: true });
      items.push({ group: 'Go to', tag: icon('layers', 16), label: 'Shipments log', sub: 'Inventory', href: '#/inventory?tab=log', raw: true });
      if (can('inventory.edit')) items.push({ group: 'Actions', tag: icon('plus', 16), label: 'Log a shipment', sub: 'Inventory', action: 'log-shipment', raw: true });
      items.push({ group: 'Actions', tag: icon('plus', 16), label: 'New invoice', sub: 'Finance', action: 'new-invoice', raw: true });
    }
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
      if (!q) return it.group !== 'Logs' && it.group !== 'People' && it.group !== 'Storage' && it.group !== 'Files';
      var hay = (it.label + ' ' + (it.sub || '') + ' ' + (it.words || '')).toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    });
    var groups = ['Schools', 'People', 'Files', 'Storage', 'Go to', 'Logs', 'Actions'];
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
    if (!flat.length) html = '<div class="empty" style="margin:16px">Nothing here. Space is big. Really big. Try a school name or a log.</div>';
    if (/\b(drinks?|cocktails?|beers?|gargle|blaster|happy hour)\b/.test(q)) html = '<div class="egg">Pan Galactic Gargle Blaster? Maybe just water. It\'s a workday.</div>' + (flat.length ? html : '');
    if (/^(42|forty[ -]?two|(the )?meaning of life|(the )?answer to (life|everything).*|life,? the universe,? and everything)$/.test(q)) html = '<div class="egg">42. Now what was the question?</div>' + (flat.length ? html : '');
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
    if (name === 'add-asset') return openAssetModal(null);
    if (name === 'new-invoice') { var ps = (el && el.getAttribute('data-school')) || currentSchoolName(); return loadFinance(false).then(function () { openInvoiceModal(null, ps); }); }
    if (name === 'edit-invoice' && el) { var iv = (state.fin.invoices || []).filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; if (iv) openInvoiceModal(iv); return; }
    if (name === 'add-line') { var box = $('#inv-lines'); if (box) { box.insertAdjacentHTML('beforeend', lineRow(null, box.children.length)); updateInvoiceTotals(); } return; }
    if (name === 'remove-line' && el) { var ln = el.closest('.invline'); if (ln && document.querySelectorAll('.invline[data-line]').length > 1) ln.remove(); updateInvoiceTotals(); return; }
    if (name === 'copy-invoice') {
      var cid = $('#invoice-form').getAttribute('data-id');
      var ci = (state.fin.invoices || []).filter(function (x) { return x.id === cid; })[0];
      if (ci) { var txt = invoiceText(ci); if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('Invoice copied'); }, function () { toast(txt); }); }
      return;
    }
    if (name === 'export-qb') return exportQuickBooksCsv();
    if (name === 'inv-status' && el) {
      var si = (state.fin.invoices || []).filter(function (x) { return x.id === el.getAttribute('data-id'); })[0];
      if (!si) return;
      el.disabled = true;
      return api('saveInvoice', Object.assign({}, si, { status: el.getAttribute('data-status') })).then(function (f) { state.fin = f; paintFinance(); toast(si.ref + ' marked ' + el.getAttribute('data-status')); })
        .catch(function (err) { el.disabled = false; if (err.code !== 'auth_expired') toast(err.message, true); });
    }
    if (name === 'prepare-lease' && el) {
      el.disabled = true; el.textContent = 'Preparing...';
      return api('prepareLeaseInvoice', { termsId: el.getAttribute('data-terms'), period: el.getAttribute('data-period') }).then(function (f) {
        state.fin = f; state.finTab = 'invoices'; state.finStatus = 'Open'; paintFinance(); toast('Draft invoice created. Check it, then mark it Ready.');
      }).catch(function (err) { el.disabled = false; el.textContent = 'Prepare'; if (err.code !== 'auth_expired') toast(err.message, true); });
    }
    if (name === 'edit-terms' && el) return openTermsModal(el.getAttribute('data-key'));
    if (name === 'customize-home') return openCustomizeHome();
    if ((name === 'home-up' || name === 'home-down') && el) {
      var hr = el.closest('.homecard-row'), sib = name === 'home-up' ? hr.previousElementSibling : hr.nextElementSibling;
      if (sib) { if (name === 'home-up') hr.parentNode.insertBefore(hr, sib); else hr.parentNode.insertBefore(sib, hr); }
      var rows2 = document.querySelectorAll('#home-cards .homecard-row');
      rows2.forEach(function (r2, i2) { r2.querySelector('[data-action="home-up"]').disabled = i2 === 0; r2.querySelector('[data-action="home-down"]').disabled = i2 === rows2.length - 1; });
      return;
    }
    if (name === 'home-save') { saveHomePrefs(readCustomizeHome()); closeModal(); renderRoute(); toast('Home updated'); return; }
    if (name === 'home-reset') { try { localStorage.removeItem('pangia_home_' + state.data.user.email); } catch (e) { /* ignore */ } closeModal(); renderRoute(); toast('Home reset'); return; }
    if (name === 'month-close') { state.monthOpen = null; return renderRoute(true); }
    if (name === 'log-shipment') {
      var sch = el && el.getAttribute('data-school');
      return loadInventory().then(function () { openShipmentModal(null, sch ? { type: 'Shipment', to: 'school:' + sch } : null); }).catch(function (err) { if (err.code !== 'auth_expired') toast(err.message, true); });
    }
    if (name === 'edit-shipment' && el) { var es = state.inv.shipments.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]; return openShipmentModal(es); }
    if (name === 'del-shipment') {
      var dsf = $('#shipment-form');
      if (!window.confirm('Delete this shipment? Stock numbers will be recalculated.')) return;
      return invSave('saveShipment', { id: dsf.getAttribute('data-id'), remove: true }, el, 'Shipment deleted');
    }
    if (name === 'add-product') return openProductModal(null);
    if (name === 'edit-product' && el) return openProductModal(state.inv.products.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]);
    if (name === 'export-ship') return exportShipmentsCsv();
    if (name === 'sync-sales' && el) {
      el.disabled = true; el.textContent = 'Syncing...';
      toast('Reading WooCommerce orders. The first sync can take a few runs.');
      return api('syncSales', {}).then(function (r) { toast(r.message); state.ye = null; return loadTax(); }).then(paintFinance)
        .catch(function (err) { el.disabled = false; el.textContent = 'Sync WooCommerce'; if (err.code !== 'auth_expired') toast(err.message, true); });
    }
    if (name === 'export-tax') return exportTaxCsv();
    if (name === 'export-ye') return exportYearEndCsv();
    if (name === 'file-period' && el) return openFilingModal(el.getAttribute('data-state'), el.getAttribute('data-period'));
    if (name === 'unfile') {
      var uf = $('#filing-form');
      return api('logFiling', { state: uf.getAttribute('data-state'), period: uf.getAttribute('data-period'), undo: true, kind: state.taxKind }).then(function (t) { state.tax = t; closeModal(); paintFinance(); toast('Filing removed'); })
        .catch(function (err) { if (err.code !== 'auth_expired') toast(err.message, true); });
    }
    if (name === 'tax-states') return openTaxStatesModal();
    if (name === 'add-taxstate') { var ns = $('#ts-new').value; if (!ns) return toast('Pick a state.', true); return taxStateCall({ state: ns, frequency: $('#ts-freq').value, dueDay: $('#ts-day').value }); }
    if (name === 'save-taxstate' && el) { var rw = el.closest('.taxstate'); return taxStateCall({ state: rw.getAttribute('data-st'), frequency: rw.querySelector('[name="frequency"]').value, dueDay: rw.querySelector('[name="dueDay"]').value }); }
    if (name === 'remove-taxstate' && el) return taxStateCall({ state: el.closest('.taxstate').getAttribute('data-st'), remove: true });
    if (name === 'edit-exemption' && el) return openExemptionModal(el.getAttribute('data-school'));
    if (name === 'edit-asset' && el) {
      var aid = el.getAttribute('data-id');
      var av = assetList().filter(function (x) { return x.id === aid; })[0];
      if (av) openAssetModal(av);
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

  var logoClicks = [];
  document.addEventListener('click', function (e) {
    var brandMark = e.target.closest('.brand svg');
    if (brandMark) {
      var now = Date.now();
      logoClicks = logoClicks.filter(function (t) { return now - t < 4000; }).concat([now]);
      if (logoClicks.length >= 7) {
        logoClicks = [];
        brandMark.classList.remove('spin42'); void brandMark.getBoundingClientRect(); brandMark.classList.add('spin42');
        starBurst(brandMark);
        toast('Mostly harmless.');
      }
    }
    var pal = e.target.closest('[data-pal]');
    if (pal) { e.preventDefault(); return runPaletteItem(Number(pal.getAttribute('data-pal'))); }
    if (e.target.matches('[data-action="palette-bg"]')) return closePalette();
    if (e.target.matches('[data-action="modal-bg"]')) return closeModal();
    var act = e.target.closest('[data-action]');
    if (act && act.getAttribute('data-action') !== 'palette-bg' && act.getAttribute('data-action') !== 'modal-bg') {
      e.preventDefault();
      return doAction(act.getAttribute('data-action'), act);
    }
    var tk = e.target.closest('[data-taxkind]');
    if (tk) { state.taxKind = tk.getAttribute('data-taxkind'); state.taxPeriod = ''; state.tax = null; return paintFinance(); }
    var mo = e.target.closest('[data-month]');
    if (mo) { var mi = Number(mo.getAttribute('data-month')); state.monthOpen = state.monthOpen === mi ? null : mi; var yy = window.scrollY; renderRoute(true); window.scrollTo(0, yy); return; }
    var itb = e.target.closest('[data-invtab]');
    if (itb) { state.invTab = itb.getAttribute('data-invtab'); return paintInventory(); }
    var ikd = e.target.closest('[data-invkind]');
    if (ikd) { state.invKind = ikd.getAttribute('data-invkind'); return paintInventory(); }
    var ft = e.target.closest('[data-fintab]');
    if (ft) { state.finTab = ft.getAttribute('data-fintab'); return paintFinance(); }
    var ivf = e.target.closest('[data-invfilter]');
    if (ivf) { state.finStatus = ivf.getAttribute('data-invfilter'); return paintFinance(); }
    var exf = e.target.closest('[data-exfilter]');
    if (exf) { state.exFilter = exf.getAttribute('data-exfilter'); return paintFinance(); }
    var aa = e.target.closest('[data-assetaud]');
    if (aa) { state.assets.audience = aa.getAttribute('data-assetaud'); return repaintAssets(); }
    var ac = e.target.closest('[data-assetcat]');
    if (ac) { state.assets.category = ac.getAttribute('data-assetcat'); return repaintAssets(); }
    if (e.target.closest('[data-assetarch]')) { state.assets.archived = !state.assets.archived; return repaintAssets(); }
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
    } else if (e.target.closest && e.target.closest('#invoice-form')) {
      updateInvoiceTotals();
    } else if (e.target.id === 'asset-search') {
      state.assets.q = e.target.value;
      var ab = $('#asset-results');
      if (ab) ab.innerHTML = assetResults();
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
    } else if (e.target.id === 'inv-q' || e.target.id === 'inv-logq') {
      if (e.target.id === 'inv-q') state.invQ = e.target.value; else state.invLogQ = e.target.value;
      var pos = e.target.selectionStart, id0 = e.target.id;
      paintInventory();
      var el2 = $('#' + id0); if (el2) { el2.focus(); try { el2.setSelectionRange(pos, pos); } catch (er) {} }
    } else if (e.target.id === 'pal-q') {
      state.palette.query = e.target.value;
      state.palette.index = 0;
      paintPalette();
      babelFish(e.target.value);
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.closest && e.target.closest('#invoice-form')) updateInvoiceTotals();
    if (e.target.id === 'tax-period') { state.taxPeriod = e.target.value; return paintFinance(); }
    if (e.target.id === 'inv-type') { state.invType = e.target.value; return paintInventory(); }
    if (e.target.id === 'inv-rprod') { state.invRentalProduct = e.target.value; return paintInventory(); }
    if (e.target.id === 'sh-type') {
      var sf = $('#shipment-form');
      var keep = { id: sf.getAttribute('data-id'), type: e.target.value, date: sf.elements.date.value, product: sf.elements.product.value, qty: sf.elements.qty.value, ref: sf.elements.ref.value, notes: sf.elements.notes.value };
      return openShipmentModal(keep.id ? Object.assign({}, state.inv.shipments.filter(function (x) { return x.id === keep.id; })[0], keep, { from: '', to: '' }) : null, keep);
    }
    if (e.target.id === 'ye-year') { state.yeYear = e.target.value; state.ye = null; return paintFinance(); }
    if (e.target.id === 'i-school' && !$('#invoice-form').getAttribute('data-id')) {
      var cu = ((state.fin || {}).customers || []).filter(function (c) { return norm(c.school) === norm(e.target.value); })[0];
      if (cu) { if (cu.qbName) $('#i-customer').value = cu.qbName; if (cu.terms) $('#i-terms').value = cu.terms; }
    }
    if (e.target.id === 'contact-school') {
      state.contactSchool = e.target.value;
      repaintContacts();
    }
  });

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.id === 'invoice-form') {
      e.preventDefault();
      var iv2 = readInvoiceForm();
      if (!iv2.school) { toast('Pick the school or customer.', true); return; }
      if (!iv2.lines.some(function (l) { return l.qty > 0; })) { toast('Add at least one line with a quantity.', true); return; }
      if ((iv2.status === 'In QuickBooks' || iv2.status === 'Paid') && !iv2.qbNumber) toast('Tip: add the QuickBooks invoice number so it is easy to find later.');
      var ib = form.querySelector('[type="submit"]');
      return finSave('saveInvoice', iv2, ib, iv2.id ? 'Save invoice' : 'Create invoice', iv2.id ? 'Invoice saved' : 'Invoice created');
    }
    if (form.id === 'terms-form') {
      e.preventDefault();
      var te = form.elements;
      var tp = { contractKey: form.getAttribute('data-key'), amount: te.amount.value, frequency: te.frequency.value, firstBill: te.firstBill.value, terms: te.terms.value, item: te.item.value.trim(), po: te.po.value.trim(), memo: te.memo.value.trim() };
      if (!(Number(tp.amount) > 0)) { toast('Enter the amount billed each period.', true); return; }
      if (!tp.firstBill) { toast('Pick the first bill date.', true); return; }
      var tb = form.querySelector('[type="submit"]');
      var cust = { school: form.getAttribute('data-school'), qbName: te.qbName.value.trim(), billToEmail: te.billToEmail.value.trim(), terms: tp.terms };
      tb.disabled = true; tb.textContent = 'Saving...';
      return api('saveCustomer', cust).then(function () { tb.disabled = false; return finSave('saveBillingTerms', tp, tb, 'Save billing', 'Lease billing saved'); })
        .catch(function (err) { tb.disabled = false; tb.textContent = 'Save billing'; if (err.code !== 'auth_expired') toast(err.message, true); });
    }
    if (form.id === 'shipment-form') {
      e.preventDefault();
      var se = form.elements;
      return invSave('saveShipment', { id: form.getAttribute('data-id'), type: se.type.value, date: se.date.value, product: se.product.value, qty: se.qty.value,
        from: se.from ? se.from.value : '', to: se.to.value, ref: se.ref.value.trim(), notes: se.notes.value.trim() }, form.querySelector('[type="submit"]'), form.getAttribute('data-id') ? 'Shipment saved' : 'Shipment logged');
    }
    if (form.id === 'product-form') {
      e.preventDefault();
      var pe = form.elements;
      return invSave('saveProduct', { id: form.getAttribute('data-id'), name: pe.name.value.trim(), category: pe.category.value, aliases: pe.aliases.value, active: pe.active.value === 'Y' }, form.querySelector('[type="submit"]'), 'Product saved');
    }
    if (form.id === 'filing-form') {
      e.preventDefault();
      var fe2 = form.elements;
      var fb = form.querySelector('[type="submit"]');
      fb.disabled = true; fb.textContent = 'Saving...';
      return api('logFiling', { state: form.getAttribute('data-state'), period: form.getAttribute('data-period'), filedOn: fe2.filedOn.value, amount: fe2.amount.value, confirmation: fe2.confirmation.value.trim(), notes: fe2.notes.value.trim(), kind: state.taxKind })
        .then(function (t) { state.tax = t; closeModal(); paintFinance(); toast('Filing logged'); })
        .catch(function (err) { fb.disabled = false; fb.textContent = 'Mark as filed'; if (err.code !== 'auth_expired') toast(err.message, true); });
    }
    if (form.id === 'exemption-form') {
      e.preventDefault();
      var xe = form.elements;
      var xp = { id: form.getAttribute('data-id'), school: form.getAttribute('data-school'), status: xe.status.value, state: xe.state.value.trim(), link: xe.link.value.trim(), number: xe.number.value.trim(), expires: xe.expires.value, notes: xe.notes.value.trim() };
      if (xp.link && !/^https:\/\//i.test(xp.link)) { toast('The certificate link must start with https://', true); return; }
      return finSave('saveExemption', xp, form.querySelector('[type="submit"]'), 'Save', 'Exemption saved');
    }
    if (form.id === 'asset-modal-form') {
      e.preventDefault();
      var fe = form.elements;
      var ap = { id: form.getAttribute('data-id'), title: fe.title.value.trim(), url: fe.url.value.trim(), category: fe.category.value, audience: fe.audience.value,
        product: fe.product.value.trim(), tags: fe.tags.value.trim(), description: fe.description.value.trim(), status: fe.status ? fe.status.value : 'Active',
        access: Array.prototype.slice.call(form.querySelectorAll('input[name="access"]:checked')).map(function (i) { return i.value; }) };
      if (!ap.title) { toast('Give the file a title.', true); return; }
      if (!/^https:\/\//i.test(ap.url)) { toast('The link must start with https://', true); return; }
      var abtn = form.querySelector('[type="submit"]');
      abtn.disabled = true; abtn.textContent = 'Saving...';
      api('saveAsset', ap).then(function (res) {
        state.data.assets = res.assets;
        closeModal();
        toast(ap.id ? 'File saved' : 'File added to the library');
        renderRoute();
      }).catch(function (err) {
        abtn.disabled = false; abtn.textContent = ap.id ? 'Save file' : 'Add file';
        if (err.code !== 'auth_expired') toast(err.message, true);
      });
      return;
    }
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
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('clickrow')) { e.preventDefault(); return doAction(e.target.getAttribute('data-action'), e.target); }
    if (!state.palette.open) return;
    if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); state.palette.index = Math.min(state.palette.index + 1, state.palette.items.length - 1); paintPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); state.palette.index = Math.max(state.palette.index - 1, 0); paintPalette(); }
    else if (e.key === 'Enter' && e.target.id === 'pal-q') { e.preventDefault(); runPaletteItem(state.palette.index); }
  });

  window.addEventListener('hashchange', function () {
    tryNote().then(function (opened) { if (opened) return; if ($('.sky')) { document.title = 'Pangia | College Products'; return state.data ? renderRoute() : start(); } if (state.data) renderRoute(); });
  });

  /* ---------------------------------------------------------------- */
  /* Start                                                            */
  /* ---------------------------------------------------------------- */

  function start() {
    if ($('#splash')) showSplash();
    if (!CFG.API_URL || !/^https:\/\//.test(CFG.API_URL)) { renderSetupNeeded(); return; }
    if (noteWord() && !state.noteChecked) { state.noteChecked = true; tryNote().then(function (opened) { if (!opened) start(); }); return; }
    var saved = null;
    try { saved = sessionStorage.getItem('pangia_token'); } catch (e) { /* ignore */ }
    if (saved && tokenValid(saved)) { state.token = saved; boot(); }
    else renderSignIn();
    waitForGsi(initGsi);
  }

  start();
})();
