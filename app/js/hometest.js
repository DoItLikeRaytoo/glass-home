/*
 * Glass Home – Home-Test (nur Aufzeichnung, verändert nichts)
 *
 * Zeichnet auf, was der Fernseher meldet, während du die Home-Taste benutzt:
 *   - wann Glass Home verdeckt / wieder sichtbar wird
 *   - welche Apps gerade laufen (alle 0,25 s, solange Glass Home verdeckt ist)
 *   - Status-Meldungen "App aktiv / inaktiv", falls der Fernseher sie anbietet
 * Damit sehen wir, ob Glass Home erkennen kann, dass die Samsung-Startseite offen ist.
 *
 * Bedienung: grüne Taste = Aufzeichnung anzeigen/ausblenden, rote Taste = Aufzeichnung löschen.
 * Die Aufzeichnung bleibt gespeichert, auch wenn Glass Home neu startet (max. 300 Einträge).
 */
var GH_HOMETEST = (function () {
  'use strict';
  var KEY = 'gh.hometest', MAX = 300;
  var log = [], lastSet = null, poll = null, saveT = null, nameOf = function (id) { return id; };
  var hasTizen = typeof window.tizen !== 'undefined' && window.tizen && window.tizen.application;

  try { var s = window.localStorage.getItem(KEY); if (s) log = JSON.parse(s) || []; } catch (e) { log = []; }

  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () { try { window.localStorage.setItem(KEY, JSON.stringify(log)); } catch (e) {} }, 800);
  }
  function add(type, msg) {
    log.push({ t: Date.now(), type: type, msg: msg });
    if (log.length > MAX) log.splice(0, log.length - MAX);
    save();
  }
  function label(id) { var n = nameOf(id); return n && n !== id ? n + ' (' + id + ')' : id; }

  function snapshot(cb) {
    try {
      window.tizen.application.getAppsContext(function (ctx) {
        cb(ctx.map(function (c) { return c.appId; }));
      }, function (err) { cb(null, err); });
    } catch (e) { cb(null, e); }
  }
  function compare(set) {
    if (!lastSet) { lastSet = set; return; }
    set.forEach(function (id) { if (lastSet.indexOf(id) < 0) add('gestartet', label(id)); });
    lastSet.forEach(function (id) { if (set.indexOf(id) < 0) add('beendet', label(id)); });
    lastSet = set;
  }
  function setPolling(ms) {
    clearInterval(poll);
    poll = setInterval(function () { snapshot(function (set) { if (set) compare(set); }); }, ms);
  }

  function start(resolveName) {
    if (resolveName) nameOf = resolveName;
    add('start', 'Glass Home gestartet – Aufzeichnung läuft');
    if (!hasTizen) { add('info', 'Browser-Vorschau: kein Fernseher, keine echten Meldungen'); return; }

    snapshot(function (set, err) {
      if (!set) { add('info', 'Laufende Apps abfragen: nicht möglich (' + (err && (err.name || err.message) || '?') + ')'); return; }
      lastSet = set;
      add('läuft', set.length + ' Apps: ' + set.map(label).join(', '));
    });

    // Status-Meldungen "aktiv/inaktiv" (gibt es erst ab Tizen 5.5 und nicht auf jedem Gerät)
    try {
      if (typeof window.tizen.application.addAppStatusChangeListener === 'function') {
        window.tizen.application.addAppStatusChangeListener(function (appId, status) {
          add('status', label(appId) + ' → ' + status);
        });
        add('info', 'Status-Meldungen (aktiv/inaktiv): verfügbar');
      } else {
        add('info', 'Status-Meldungen (aktiv/inaktiv): gibt es auf diesem Gerät nicht');
      }
    } catch (e) {
      add('info', 'Status-Meldungen: gesperrt (' + (e.name || '') + ' ' + (e.message || '') + ')');
    }

    document.addEventListener('visibilitychange', function () {
      add('sichtbar', document.hidden ? 'Glass Home ist VERDECKT' : 'Glass Home ist wieder SICHTBAR');
      setPolling(document.hidden ? 250 : 2000);
    });
    setPolling(2000);
  }

  function clear() { log = []; lastSet = null; save(); add('info', 'Aufzeichnung gelöscht'); }

  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; }
  function stamp(t) { var d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + pad(d.getMilliseconds(), 3); }

  function html(esc) {
    var rows = log.slice().reverse().map(function (e) {
      var cls = e.type === 'sichtbar' ? 'ok' : (e.type === 'status' || e.type === 'gestartet' || e.type === 'beendet') ? '' : 'dim';
      return '<tr><td class="mono dim">' + stamp(e.t) + '</td><td class="' + cls + '">' + esc(e.type) + '</td><td class="mono">' + esc(e.msg) + '</td></tr>';
    }).join('');
    return '<h2>Home-Test – Aufzeichnung</h2>'
      + '<p class="dim">Neueste oben · Grün = schließen · Rot = löschen · ▲▼ blättern</p>'
      + '<table>' + rows + '</table>';
  }

  return { start: start, clear: clear, html: html, add: add };
})();
