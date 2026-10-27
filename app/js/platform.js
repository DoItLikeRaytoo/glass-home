/*
 * Glass Home – Plattform-Schicht
 * Kapselt alles, was nur auf dem Samsung-Fernseher existiert (tizen.*).
 * Im normalen Browser (Vorschau am Mac) wird eine Attrappe verwendet,
 * damit sich Oberfläche und Tastensteuerung trotzdem testen lassen.
 */
var GH_PLATFORM = (function () {
  var hasTizen = typeof window.tizen !== 'undefined' && !!window.tizen && !!window.tizen.application;

  var KEYS = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406 };

  function registerKeys() {
    if (!hasTizen || !window.tizen.tvinputdevice) return [];
    var ok = [];
    ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue'].forEach(function (k) {
      try { window.tizen.tvinputdevice.registerKey(k); ok.push(k); } catch (e) { /* Taste nicht verfügbar */ }
    });
    return ok;
  }

  // Liste der installierten Apps: [{ id, name, iconPath, show }]
  function listApps(done) {
    if (!hasTizen) {
      setTimeout(function () {
        done(null, [
          { id: 'demo.TizenBrew', name: 'TizenBrew', iconPath: '', show: true },
          { id: 'demo.Twitch', name: 'Twitch', iconPath: '', show: true },
          { id: 'demo.Joyn', name: 'Joyn', iconPath: '', show: true },
          { id: 'MCmYXNxgcu.DisneyPlus', name: 'Disney+', iconPath: '', show: true },
          { id: 'demo.RTL', name: 'RTL+', iconPath: '', show: true },
          { id: 'org.tizen.primevideo', name: 'Prime Video', iconPath: '', show: true },
          { id: 'org.tizen.netflix-app', name: 'Netflix', iconPath: '', show: true },
          { id: 'demo.TVPlus', name: 'Samsung TV Plus', iconPath: '', show: true },
          { id: '9Ur5IzDKqV.TizenYouTube', name: 'YouTube', iconPath: '', show: true }
          // HotIPTV fehlt absichtlich: so sieht man in der Vorschau, wie eine fehlende App aussieht
        ]);
      }, 50);
      return;
    }
    try {
      window.tizen.application.getAppsInfo(function (list) {
        done(null, list.map(function (a) {
          return { id: a.id, name: a.name, iconPath: a.iconPath, show: a.show };
        }));
      }, function (err) { done(err && (err.name + ': ' + err.message) || 'Fehler', []); });
    } catch (e) { done(String(e), []); }
  }

  function launch(id, done) {
    if (!hasTizen) { setTimeout(function () { done(null, 'Vorschau: würde ' + id + ' starten'); }, 300); return; }
    try {
      window.tizen.application.launch(id,
        function () { done(null); },
        function (err) { done((err && (err.name + ': ' + err.message)) || 'Start fehlgeschlagen'); });
    } catch (e) { done(String(e)); }
  }

  // Aktuelle Zeit des Fernsehers (berücksichtigt die am TV eingestellte Zeitzone)
  function now() {
    if (hasTizen && window.tizen.time) {
      try {
        var t = window.tizen.time.getCurrentDateTime();
        return { h: t.getHours(), m: t.getMinutes(), s: t.getSeconds(), wd: t.getDay(), d: t.getDate(), mo: t.getMonth(), src: 'tizen.time' };
      } catch (e) { /* weiter mit JavaScript-Zeit */ }
    }
    var n = new Date();
    return { h: n.getHours(), m: n.getMinutes(), s: n.getSeconds(), wd: n.getDay(), d: n.getDate(), mo: n.getMonth(), src: 'Date' };
  }

  function info() {
    var out = { tizen: hasTizen, ua: navigator.userAgent };
    if (hasTizen) {
      try { out.self = window.tizen.application.getCurrentApplication().appInfo.id; } catch (e) { out.self = '?'; }
      try { out.platform = window.tizen.systeminfo.getCapability('http://tizen.org/feature/platform.version'); } catch (e) { out.platform = '?'; }
    }
    return out;
  }

  function iconUrl(path) {
    if (!path) return '';
    if (/^(file|https?|data):/i.test(path)) return path;
    if (path.charAt(0) === '/') return 'file://' + path;
    return path;
  }

  function canWatch() { return hasTizen && typeof window.tizen.application.getAppsContext === 'function'; }
  function isRunning(appId, cb) {
    try {
      window.tizen.application.getAppsContext(function (ctx) {
        cb(ctx.some(function (c) { return c.appId === appId; }));
      }, function () { cb(true); });   // im Zweifel: läuft noch -> nichts tun
    } catch (e) { cb(true); }
  }
  function bringSelfToFront() {
    try {
      var self = window.tizen.application.getCurrentApplication().appInfo.id;
      window.tizen.application.launch(self, function () {}, function () {});
    } catch (e) { /* nicht möglich */ }
  }

  return { hasTizen: hasTizen, KEYS: KEYS, registerKeys: registerKeys, listApps: listApps, launch: launch, now: now, info: info, iconUrl: iconUrl, canWatch: canWatch, isRunning: isRunning, bringSelfToFront: bringSelfToFront };
})();
