/*
 * Glass Home – Oberfläche, Fernbedienung, Uhr, App-Start
 *
 * Fernbedienung:
 *   ◀ ▶        App wählen
 *   OK         App starten
 *   Zurück     schließt die Diagnose (der Launcher selbst bleibt offen)
 *   Blau       Diagnose ein/aus (gefundene Apps, IDs, Animations-FPS)
 *   Gelb       Glas-Qualität: voll / leicht (falls es am TV ruckelt)
 * Im Browser: Pfeiltasten, Enter, D = Diagnose, Q = Qualität, Esc = Zurück
 */
(function () {
  'use strict';

  var P = GH_PLATFORM, APPS = GH_APPS, K = P.KEYS;
  var stage = document.getElementById('stage');
  var state = { focus: 0, resolved: [], installed: [], listError: null, keys: [], fps: null, longest: null, lastLaunch: '—', lite: false, diag: false, iconStatus: {} };

  // ---------- Hilfsfunktionen ----------
  function el(tag, cls, parent, style) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) e.style.cssText = style;
    if (parent) parent.appendChild(e);
    return e;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); } catch (e) { return null; } return null; }

  var GLYPHS = {
    flask: '<path d="M9 3h6"/><path d="M10 3v6L5 18.6A1.6 1.6 0 0 0 6.4 21h11.2a1.6 1.6 0 0 0 1.4-2.4L14 9V3"/><path d="M7.4 15h9.2"/>',
    live: '<circle cx="12" cy="12" r="2.4"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M4.9 4.9a10 10 0 0 0 0 14.2"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2"/>',
    dish: '<path d="M4 10a8 8 0 0 0 10 10z"/><path d="M9 15l4-4"/><path d="M14 6.5a3.5 3.5 0 0 1 3.5 3.5"/><path d="M14 3a7 7 0 0 1 7 7"/>',
    playcircle: '<circle cx="12" cy="12" r="9"/><path d="M10.2 8.6v6.8l5.4-3.4z"/>',
    sparkle: '<path d="M11 3.5l1.7 4.8 4.8 1.7-4.8 1.7L11 16.5l-1.7-4.8L4.5 10l4.8-1.7z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
    episodes: '<rect x="3" y="8" width="14" height="12" rx="2.2"/><path d="M7 4.5h11.5A2.5 2.5 0 0 1 21 7v9"/>',
    clapper: '<rect x="3" y="9.5" width="18" height="11" rx="2"/><path d="M3.4 9.5L20.6 6.4 20 3.6 3 6.6z"/><path d="M8.2 5.7l1.6 3"/><path d="M13.4 4.8l1.6 3"/>',
    reel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.6" r="1.5"/><circle cx="12" cy="16.4" r="1.5"/><circle cx="7.6" cy="12" r="1.5"/><circle cx="16.4" cy="12" r="1.5"/>',
    tvplus: '<rect x="3" y="5" width="18" height="12.5" rx="2.2"/><path d="M8.5 21h7"/><path d="M12 8.2v6"/><path d="M9 11.2h6"/>',
    camera: '<rect x="2.5" y="6.5" width="13.5" height="11" rx="2.2"/><path d="M16 10.4l5.5-3v9.2l-5.5-3z"/>'
  };
  function glyphSvg(k, size, sw) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="#fff" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + (GLYPHS[k] || '') + '</svg>';
  }

  // ---------- Farben / Stile (identisch zur Designvorschau) ----------
  function fsOf(a) { return Math.min(300, Math.round(1440 / (0.6 * a.word.length))); }
  function wordGrad(a) { return 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(' + a.tint + ',1) 45%, rgba(' + a.tint2 + ',0.65) 100%)'; }
  function glowOf(a) {
    return 'radial-gradient(1300px 460px at 50% 27%, rgba(' + a.tint + ',0.16) 0%, rgba(' + a.tint + ',0.04) 45%, rgba(0,0,0,0) 72%), '
      + 'radial-gradient(490px 45px at 50% 77.3%, rgba(' + a.tint + ',0.08) 0%, rgba(0,0,0,0) 100%), '
      + 'radial-gradient(1000px 300px at 50% 96%, rgba(' + a.tint2 + ',0.09) 0%, rgba(0,0,0,0) 70%), '
      + 'radial-gradient(1100px 320px at 50% 54%, rgba(' + a.tint + ',0.10) 0%, rgba(0,0,0,0) 70%)';
  }
  function horizonCss(a) {
    return 'background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(' + a.tint + ',0.5) 18%, rgba(255,255,255,0.8) 50%, rgba(' + a.tint + ',0.5) 82%, rgba(0,0,0,0) 100%);'
      + ' box-shadow: 0 0 12px rgba(' + a.tint + ',0.35), 0 0 40px rgba(' + a.tint + ',0.15);';
  }

  // ---------- Szene aufbauen ----------
  // Dieselbe Hintergrund-Szene wird dreimal verwendet: sichtbar, unscharf hinter dem Glas, als Lichtkante.
  // Alle drei bekommen exakt dieselben Positionen und Übergänge, damit nichts versetzt oder doppelt wirkt.
  var layers = [];
  // Leistung: Jede App hat pro Szene eigene Ebenen. Nur die gerade aktive und die gerade ausblendende
  // App sind sichtbar (display), alle anderen ruhen komplett (kein Speicher, keine Rechenzeit).
  // In der Glas-Ansicht ist das Wort ein EINMAL vorberechnetes, unscharfes Bild (Canvas) – der Fernseher
  // muss die Unschärfe also nicht bei jedem Bild der Animation neu berechnen.
  var layers = [];
  function buildScene(parent, mode) {
    var L = { glows: [], words: [], horizons: [], mode: mode };
    if (mode !== 'rim') APPS.forEach(function (a) { L.glows.push(el('div', 'fill glow fade idle', parent, 'background:' + glowOf(a) + '; opacity:0')); });
    var w = el('div', 'abs words', parent);
    APPS.forEach(function (a) {
      var d;
      if (mode === 'main') {
        d = el('div', 'word fade idle', w, 'font-size:' + fsOf(a) + 'px; background-image:' + wordGrad(a) + '; opacity:0; transform: translate(-50%,-50%) translateX(40px)');
        d.textContent = a.word;
      } else {
        d = el('canvas', 'blurword fade idle', parent, 'opacity:0; transform: translateX(40px)');
      }
      L.words.push(d);
    });
    if (mode === 'main') APPS.forEach(function (a) { L.horizons.push(el('div', 'abs horizon fade idle', parent, horizonCss(a) + ' opacity:0')); });
    layers.push(L);
    return L;
  }

  // Unscharfes Wort vorberechnen (halbe Auflösung reicht, weil es ohnehin unscharf ist)
  var WORD_CY = 310; // Mitte des Schriftzugs auf dem Bildschirm (30 px + 560/2)
  function paintBlurWord(cv, a, mode) {
    var fs = fsOf(a), pad = 90, top = WORD_CY - fs / 2 - pad, h = 800 - top, k = 0.5; // bis unter den Horizont (y 720)
    cv.width = 1920 * k; cv.height = Math.ceil(h * k);
    cv.style.left = '0px'; cv.style.top = top + 'px'; cv.style.width = '1920px'; cv.style.height = h + 'px';
    var tmp = document.createElement('canvas'); tmp.width = cv.width; tmp.height = cv.height;
    var t = tmp.getContext('2d');
    t.scale(k, k);
    t.font = '900 ' + fs + 'px "GH Inter"';
    try { t.letterSpacing = (-0.06 * fs) + 'px'; } catch (e) {}
    var m = t.measureText(a.word);
    var asc = m.fontBoundingBoxAscent || fs * 0.97, desc = m.fontBoundingBoxDescent || fs * 0.24;
    var boxTop = pad, base = boxTop + (fs - (asc + desc)) / 2 + asc;
    var g = t.createLinearGradient(0, boxTop, 0, boxTop + fs);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.45, 'rgba(' + a.tint + ',1)'); g.addColorStop(1, 'rgba(' + a.tint2 + ',0.65)');
    t.fillStyle = g; t.textBaseline = 'alphabetic';
    t.fillText(a.word, 960 - m.width / 2, base);
    // Horizontlinie (wie .horizon: 2 px, Farbverlauf, Leuchten) – wird mit unscharf gerechnet
    var hy = 720 - top, hg = t.createLinearGradient(0, 0, 1920, 0);
    hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.18, 'rgba(' + a.tint + ',0.5)'); hg.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    hg.addColorStop(0.82, 'rgba(' + a.tint + ',0.5)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
    t.letterSpacing = '0px';
    t.shadowColor = 'rgba(' + a.tint + ',0.35)'; t.shadowBlur = 12; t.fillStyle = hg; t.fillRect(0, hy, 1920, 2);
    t.shadowColor = 'rgba(' + a.tint + ',0.15)'; t.shadowBlur = 40; t.fillRect(0, hy, 1920, 2);
    t.shadowBlur = 0;
    var c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    c.filter = mode === 'rim' ? 'blur(10px) brightness(1.7) saturate(1.2)' : 'blur(7.5px) saturate(1.12)';
    c.drawImage(tmp, 0, 0);
    cv.setAttribute('data-ready', '1');
  }
  function paintAllBlurWords() {
    var order = [state.focus].concat(APPS.map(function (_, i) { return i; }).filter(function (i) { return i !== state.focus; }));
    var n = 0;
    (function next() {
      if (n >= order.length) return;
      var i = order[n++];
      layers.forEach(function (L) { if (L.mode !== 'main') paintBlurWord(L.words[i], APPS[i], L.mode); });
      setTimeout(next, 30); // in kleinen Häppchen, damit die Bedienung nicht blockiert
    })();
  }

  buildScene(stage, 'main');

  var clock = el('div', 'abs clock', stage);
  var timeEl = el('div', 'time', clock), dateEl = el('div', 'date', clock);

  var card = el('div', 'abs card', stage);
  var clip = el('div', 'fill card-clip', card);
  var frost = el('div', 'abs view view-frost', clip);
  buildScene(el('div', 'abs view-inner', frost), 'frost');
  el('div', 'fill glass-tint', clip);
  var rimMask = el('div', 'fill rim-mask', clip);
  var rimView = el('div', 'abs view view-rim', rimMask);
  buildScene(el('div', 'abs view-inner', rimView), 'rim');
  ['veil1', 'veil2'].forEach(function (c) { el('div', 'fill ' + c, clip); });
  ['shimmer', 'sheen', 'specular', 'glint-tl'].forEach(function (c) { el('div', 'abs ' + c, clip); });
  el('div', 'fill bevel', card);
  el('div', 'fill rim', card);
  el('div', 'abs glint-br', card);

  var content = el('div', 'fill content', card);
  var bigIcon = el('div', 'big-icon', content);
  var bigImg = el('img', 'app-img', bigIcon);
  el('span', 'fill hl', bigIcon);
  el('span', 'fill bev', bigIcon);
  var bigGlyph = el('span', 'glyph', bigIcon, 'position:relative; display:flex');
  var texts = el('div', 'texts', content);
  var kindEl = el('div', 'kind', texts), nameEl = el('div', 'name', texts), subEl = el('div', 'sub', texts);
  var openBtn = el('div', 'open-btn', content);
  openBtn.innerHTML = '<span class="lbl">Öffnen</span><span class="ok">OK</span>';

  var dock = el('nav', 'abs dock', stage);
  var floorLight = el('div', 'abs floor-light lens', dock);
  var lens = el('div', 'abs lens', dock);
  lens.innerHTML = '<span class="l1"></span><span class="l2"></span><span class="l3"></span><span class="l4"></span>';
  var tiles = APPS.map(function (a, i) {
    var t = el('div', 'ic', dock, 'left:' + (i * 172) + 'px');
    t.style.background = 'linear-gradient(150deg, rgba(' + a.tint + ',0.30) 0%, rgba(' + a.tint2 + ',0.10) 100%), rgba(255,255,255,0.05)';
    el('span', 'fill on-layer', t, 'background: linear-gradient(150deg, rgba(' + a.tint + ',0.92) 0%, rgba(' + a.tint2 + ',0.5) 100%), rgba(255,255,255,0.04)');
    var img = el('img', 'app-img', t);
    el('span', 'fill hl', t);
    el('span', 'fill bev', t);
    var g = el('span', 'glyph', t);
    g.innerHTML = glyphSvg(a.glyph, 68, 1.45);
    return { el: t, img: img, glyph: g };
  });

  var toast = el('div', 'abs toast', stage);
  var diag = el('div', 'abs diag', stage);
  var diagBody = el('div', 'diag-body', diag);
  var diagScroll = 0;

  // Szene umschalten: neue App einblenden, alte ausblenden, danach alte ruhen lassen
  var sceneCurrent = -1, hideTimers = {};
  function sceneEls(j) {
    var out = [];
    layers.forEach(function (L) { if (L.glows[j]) out.push(L.glows[j]); out.push(L.words[j]); if (L.horizons[j]) out.push(L.horizons[j]); });
    return out;
  }
  function setOn(j, on) {
    layers.forEach(function (L) {
      if (L.glows[j]) L.glows[j].style.opacity = on ? '1' : '0';
      L.words[j].style.opacity = on ? '1' : '0';
      L.words[j].style.transform = (L.mode === 'main' ? 'translate(-50%,-50%) ' : '') + 'translateX(' + (on ? 0 : 40) + 'px)';
      if (L.horizons[j]) L.horizons[j].style.opacity = on ? '1' : '0';
    });
  }
  // Vorwärmen: die Nachbar-Apps links/rechts sind schon fertig gezeichnet (unsichtbar),
  // damit der nächste Wechsel sofort startet statt erst zeichnen zu müssen.
  function warmSet(i) {
    var w = {}; w[i] = 1; if (i > 0) w[i - 1] = 1; if (i < APPS.length - 1) w[i + 1] = 1; return w;
  }
  function applyWarm(i, keep) {
    var w = warmSet(i);
    if (keep >= 0) w[keep] = 1;
    APPS.forEach(function (_, j) {
      var on = !!w[j];
      sceneEls(j).forEach(function (e) { e.classList.toggle('idle', !on); e.classList.toggle('warm', on); });
    });
  }
  function setScene(i) {
    if (i === sceneCurrent) return;
    var prev = sceneCurrent;
    clearTimeout(hideTimers.t);
    applyWarm(i, prev);
    void stage.offsetWidth;            // Startzustand übernehmen, damit die Überblendung sicher läuft
    setOn(i, true);
    if (prev >= 0) setOn(prev, false);
    sceneCurrent = i;
    hideTimers.t = setTimeout(function () { applyWarm(sceneCurrent, -1); }, 1200);
  }

  // ---------- Fokus ----------
  var measuring = null;
  function render(i, animateContent) {
    var a = APPS[i];
    setScene(i);

    bigIcon.style.background = 'linear-gradient(150deg, rgba(' + a.tint + ',0.85) 0%, rgba(' + a.tint2 + ',0.45) 100%)';
    bigIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25), 0 26px 50px rgba(0,0,0,0.4), 0 0 50px rgba(' + a.tint + ',0.22)';
    bigGlyph.innerHTML = glyphSvg(a.glyph, 108, 1.3);
    setIcon(bigIcon, bigImg, i);
    kindEl.style.color = 'rgb(' + a.tint + ')';
    kindEl.textContent = a.kind;
    nameEl.textContent = a.name;
    subEl.textContent = a.sub;
    openBtn.className = 'open-btn' + (state.resolved[i] ? '' : ' missing');

    var x = i * 172 - 22;
    lens.style.transform = 'translateX(' + x + 'px)';
    lens.style.background = 'radial-gradient(90% 90% at 50% 40%, rgba(' + a.tint + ',0.22) 0%, rgba(' + a.tint + ',0.06) 70%)';
    lens.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3), 0 22px 44px rgba(0,0,0,0.45), 0 0 56px rgba(' + a.tint + ',0.28)';
    floorLight.style.transform = 'translateX(' + x + 'px)';
    floorLight.style.background = 'radial-gradient(50% 50% at 50% 30%, rgba(' + a.tint + ',0.30) 0%, rgba(0,0,0,0) 100%)';

    tiles.forEach(function (t, j) {
      var on = j === i;
      t.el.className = 'ic' + (on ? ' on' : '') + (state.resolved.length && !state.resolved[j] ? ' missing' : '') + (t.el.classList.contains('has-img') ? ' has-img' : '');
      t.el.style.transform = on ? 'translateY(-8px) scale(1.16)' : 'scale(1)';
      t.el.style.boxShadow = on ? '0 10px 24px rgba(0,0,0,0.45)' : '0 6px 14px rgba(0,0,0,0.3)';
      t.glyph.style.opacity = on ? '1' : '0.72';
      t.img.style.opacity = on ? '1' : '0.8';
    });

    if (animateContent) {
      content.classList.remove('swap');
      void content.offsetWidth;
      content.classList.add('swap');
      measureFrames();
    }
  }

  // Bildrate während eines App-Wechsels messen (wird in der Diagnose angezeigt)
  function measureFrames() {
    if (measuring) return;
    var start = performance.now(), last = start, frames = 0, longest = 0;
    measuring = true;
    function tick(t) {
      frames++;
      longest = Math.max(longest, t - last);
      last = t;
      if (t - start < 1000) { requestAnimationFrame(tick); return; }
      state.fps = Math.round(frames * 1000 / (t - start));
      state.longest = Math.round(longest);
      measuring = null;
      if (state.diag) drawDiag();
    }
    requestAnimationFrame(tick);
  }

  var lastMove = 0;
  function move(d) {
    var now = Date.now();
    if (now - lastMove < 130) return;
    var n = Math.max(0, Math.min(APPS.length - 1, state.focus + d));
    if (n === state.focus) return;
    lastMove = now;
    state.focus = n;
    store('gh.focus', String(n));
    render(n, true);
  }

  // ---------- App-Symbole vom Fernseher ----------
  // Reihenfolge: 1) eigenes Logo aus icons/ (falls in apps.js eingetragen), 2) Symbol vom Fernseher,
  // 3) gleicher Pfad ohne file://. Erst wenn alles scheitert, erscheint das Ersatzsymbol.
  function setIcon(box, img, i) {
    var a = APPS[i], r = state.resolved[i], list = [];
    if (a.icon) list.push(a.icon);
    if (r && r.app.iconPath) { list.push(P.iconUrl(r.app.iconPath)); if (P.iconUrl(r.app.iconPath) !== r.app.iconPath) list.push(r.app.iconPath); }
    var key = list.join('|');
    if (img.getAttribute('data-src') === key) return;
    img.setAttribute('data-src', key);
    box.classList.remove('has-img');
    if (!list.length) { img.removeAttribute('src'); return; }
    var n = 0;
    img.onload = function () { box.classList.add('has-img'); state.iconStatus[a.key] = (n === 0 && a.icon ? 'eigenes Logo ' : 'ok ') + img.naturalWidth + '×' + img.naturalHeight; };
    img.onerror = function () {
      n++;
      if (n < list.length) { img.src = list[n]; return; }
      box.classList.remove('has-img'); state.iconStatus[a.key] = 'nicht ladbar';
    };
    img.src = list[0];
  }

  // ---------- Installierte Apps zuordnen ----------
  function resolve(installed) {
    var byId = {}, used = {};
    installed.forEach(function (a) { byId[a.id] = a; });
    return APPS.map(function (app) {
      for (var c = 0; c < app.ids.length; c++) {
        if (byId[app.ids[c]]) { used[app.ids[c]] = 1; return { app: byId[app.ids[c]], how: 'bekannte ID' }; }
      }
      for (var p = 0; p < app.match.length; p++) {
        var hits = installed.filter(function (a) {
          return a.name && app.match[p].test(a.name) && !used[a.id] && !app.avoid.some(function (r) { return r.test(a.name); });
        });
        hits.sort(function (x, y) { return (y.show ? 1 : 0) - (x.show ? 1 : 0); });
        if (hits.length) { used[hits[0].id] = 1; return { app: hits[0], how: 'Name' }; }
      }
      return null;
    });
  }

  function scanApps() {
    P.listApps(function (err, list) {
      state.listError = err;
      state.installed = list || [];
      state.resolved = resolve(state.installed);
      tiles.forEach(function (t, i) { setIcon(t.el, t.img, i); });
      render(state.focus, false);
      if (state.diag) drawDiag();
    });
  }

  // ---------- Starten ----------
  var toastTimer = null;
  function showToast(text, ms) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, ms || 2600);
  }
  function openFocused() {
    var a = APPS[state.focus], r = state.resolved[state.focus];
    openBtn.classList.add('pressed');
    setTimeout(function () { openBtn.classList.remove('pressed'); }, 160);
    if (!r) { showToast(a.name + ' wurde auf diesem Fernseher nicht gefunden', 3200); state.lastLaunch = a.name + ': nicht gefunden'; return; }
    showToast('Starte ' + a.name + ' …', 2200);
    P.launch(r.app.id, function (err, note) {
      state.lastLaunch = a.name + ' (' + r.app.id + '): ' + (err ? 'FEHLER ' + err : (note || 'ok'));
      if (!err) watchReturn(r.app.id, a.name);
      if (err) showToast('Start fehlgeschlagen: ' + err, 4500);
      else if (note) showToast(note, 2600);
    });
  }

  // ---------- Rückkehr nach Glass Home ----------
  // Glass Home läuft im Hintergrund weiter (background-support) und prüft alle 0,3 s, ob die gestartete
  // App noch läuft. Wird sie beendet (z. B. "Beenden? Ja"), holt sich Glass Home wieder nach vorne.
  // Drückst du in der App Home, läuft sie weiter -> dann passiert nichts.
  var watchTimer = null;
  function stopWatch() { clearInterval(watchTimer); watchTimer = null; }
  function watchReturn(appId, name) {
    stopWatch();
    if (!P.canWatch()) { state.returnInfo = 'nicht verfügbar (kein getAppsContext)'; return; }
    var started = Date.now(), seen = false;
    state.returnInfo = 'beobachte ' + name;
    watchTimer = setInterval(function () {
      var age = Date.now() - started;
      if (!document.hidden && age > 5000) { stopWatch(); state.returnInfo = 'beendet (Glass Home wieder sichtbar)'; return; }
      if (age > 12 * 3600 * 1000) { stopWatch(); return; }
      P.isRunning(appId, function (running) {
        if (running) { seen = true; return; }
        if (seen || age > 20000) {
          stopWatch();
          state.returnInfo = name + ' wurde beendet → zurück zu Glass Home';
          P.bringSelfToFront();
        }
      });
    }, 300);
  }

  // ---------- Uhr ----------
  var WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var MO = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var clockTimer = null, timeSrc = '';
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tickClock() {
    var t = P.now();
    timeSrc = t.src;
    timeEl.textContent = pad(t.h) + ':' + pad(t.m);
    dateEl.textContent = WD[t.wd] + ', ' + t.d + '. ' + MO[t.mo];
    clearTimeout(clockTimer);
    clockTimer = setTimeout(tickClock, Math.max(1000, (60 - t.s) * 1000 + 50)); // genau zum Minutenwechsel
  }

  // ---------- Diagnose ----------
  function drawDiag() {
    var inf = P.info(), h = '<h2>Glass Home 0.1.4 – Diagnose</h2>';
    h += '<table>'
      + '<tr><td class="dim">Samsung-Plattform</td><td>' + (inf.tizen ? '<span class="ok">ja</span>' : '<span class="bad">nein (Browser-Vorschau)</span>') + '</td></tr>'
      + (inf.tizen ? '<tr><td class="dim">Tizen-Version</td><td>' + esc(inf.platform) + '</td></tr><tr><td class="dim">Eigene App-ID</td><td class="mono">' + esc(inf.self) + '</td></tr>' : '')
      + '<tr><td class="dim">Zeitquelle</td><td>' + esc(timeSrc) + '</td></tr>'
      + '<tr><td class="dim">Farbtasten</td><td>' + (state.keys.length ? esc(state.keys.join(', ')) : '<span class="dim">nicht registriert</span>') + '</td></tr>'
      + '<tr><td class="dim">Glas-Qualität</td><td>' + (state.lite ? 'leicht' : 'voll') + ' <span class="dim">(gelbe Taste)</span></td></tr>'
      + '<tr><td class="dim">Letzter App-Wechsel</td><td>' + (state.fps == null ? '<span class="dim">noch nicht gemessen</span>' : state.fps + ' fps, längster Frame ' + state.longest + ' ms') + '</td></tr>'
      + '<tr><td class="dim">Letzte Taste</td><td class="mono">' + esc(state.lastKey || '—') + '</td></tr>'
      + '<tr><td class="dim">Rückkehr</td><td>' + esc(state.returnInfo || '—') + '</td></tr>'
      + '<tr><td class="dim">Letzter Start</td><td class="mono">' + esc(state.lastLaunch) + '</td></tr>'
      + '<tr><td class="dim">App-Liste</td><td>' + (state.listError ? '<span class="bad">' + esc(state.listError) + '</span>' : state.installed.length + ' Einträge') + '</td></tr>'
      + '</table><h3>Zuordnung Dock</h3><table>';
    APPS.forEach(function (a, i) {
      var r = state.resolved[i];
      h += '<tr><td>' + esc(a.name) + '</td><td>' + (r ? '<span class="ok">✓</span> <span class="mono">' + esc(r.app.id) + '</span> <span class="dim">(' + esc(r.how) + ', Symbol: ' + esc(state.iconStatus[a.key] || (r.app.iconPath ? 'lädt' : 'keins')) + ')</span><br><span class="mono dim">' + esc(r.app.iconPath || '– kein Symbolpfad –') + '</span>' : '<span class="bad">nicht gefunden</span>') + '</td></tr>';
    });
    h += '</table><h3>Installierte Apps (sichtbare zuerst)</h3><table>';
    state.installed.slice().sort(function (x, y) { return (y.show ? 1 : 0) - (x.show ? 1 : 0) || String(x.name).localeCompare(String(y.name)); })
      .forEach(function (a) { h += '<tr><td' + (a.show ? '' : ' class="dim"') + '>' + esc(a.name) + '</td><td class="mono' + (a.show ? '' : ' dim') + '">' + esc(a.id) + '</td></tr>'; });
    h += '</table><p class="dim">▲▼ blättern · Zurück oder Blau schließt</p>';
    diagBody.innerHTML = h;
    diagBody.style.transform = 'translateY(' + (-diagScroll) + 'px)';
  }
  function toggleDiag(force) {
    state.diag = force === undefined ? !state.diag : force;
    diag.classList.toggle('show', state.diag);
    if (state.diag) { diagScroll = 0; drawDiag(); }
  }
  function scrollDiag(d) {
    var max = Math.max(0, diagBody.offsetHeight - 1000 + 40);
    diagScroll = Math.max(0, Math.min(max, diagScroll + d * 240));
    diagBody.style.transform = 'translateY(' + (-diagScroll) + 'px)';
  }
  function setLite(on) {
    state.lite = on;
    stage.classList.toggle('lite', on);
    store('gh.lite', on ? '1' : '0');
  }

  // ---------- Tasten ----------
  // Zurück-Taste: Je nach Fernbedienung/Firmware kommt sie mit unterschiedlichen Codes/Namen an.
  // Alle bekannten Varianten werden abgefangen, damit der Launcher nicht geschlossen wird.
  function isBack(e) {
    var k = e.keyCode, n = e.key || e.keyIdentifier || '';
    return k === K.BACK || k === 27 || k === 8 || k === 461 ||
      /^(XF86Back|GoBack|BrowserBack|Back|Escape|Esc|Backspace|XF86Exit)$/i.test(n);
  }
  function onKey(e) {
    var k = e.keyCode;
    state.lastKey = k + ' / ' + (e.key || e.keyIdentifier || '?') + (e.code ? ' / ' + e.code : '');
    if (isBack(e)) {
      e.preventDefault(); e.stopPropagation();
      if (state.diag) toggleDiag(false);
      return; // Launcher bleibt geöffnet
    }
    if (state.diag && (k === K.UP || k === K.DOWN)) { scrollDiag(k === K.UP ? -1 : 1); e.preventDefault(); return; }
    if (k === K.LEFT) move(-1);
    else if (k === K.RIGHT) move(1);
    else if (k === K.ENTER) { if (!e.repeat) openFocused(); }
    else if (k === K.BLUE || k === 68) toggleDiag();
    else if (k === K.YELLOW || k === 81) { setLite(!state.lite); showToast('Glas-Qualität: ' + (state.lite ? 'leicht' : 'voll'), 1800); }
    else return;
    e.preventDefault();
  }
  // Capture-Phase: wir sehen die Taste vor allem anderen
  window.addEventListener('keydown', onKey, true);

  // Tizen-Hardwaretasten-Ereignis (manche Geräte melden Zurück zusätzlich so)
  window.addEventListener('tizenhwkey', function (e) {
    state.lastKey = 'tizenhwkey / ' + (e.keyName || '?');
    if (e.keyName === 'back') { if (e.preventDefault) e.preventDefault(); if (state.diag) toggleDiag(false); }
  }, true);

  // Sicherheitsnetz: Ohne Verlauf beendet die Laufzeitumgebung die App bei "Zurück".
  // Ein künstlicher Verlaufseintrag fängt das ab und wird sofort erneuert.
  try {
    history.replaceState({ gh: 'base' }, '');
    history.pushState({ gh: 'guard' }, '');
    window.addEventListener('popstate', function () {
      state.lastKey = (state.lastKey || '') + ' (Verlauf abgefangen)';
      history.pushState({ gh: 'guard' }, '');
      if (state.diag) toggleDiag(false);
    });
  } catch (err) { /* nicht verfügbar */ }

  // Rückkehr aus einer anderen App: Uhr sofort aktualisieren, App-Liste neu einlesen
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { tickClock(); scanApps(); }
  });

  // ---------- Bildschirmgröße (am TV 1920×1080, im Browser verkleinert) ----------
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = Math.abs(s - 1) < 0.01 ? '' : 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);

  // ---------- Start ----------
  var savedFocus = parseInt(store('gh.focus'), 10);
  if (savedFocus >= 0 && savedFocus < APPS.length) state.focus = savedFocus;
  setLite(store('gh.lite') === '1');
  state.keys = P.registerKeys();
  fit();
  tickClock();
  render(state.focus, false);
  scanApps();
  (document.fonts && document.fonts.load ? document.fonts.load('900 300px "GH Inter"').then(paintAllBlurWords, paintAllBlurWords) : paintAllBlurWords());
  requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.add('ready'); }); });

  window.GH_DEBUG = { state: state, move: move, open: openFocused, diag: toggleDiag };
})();
