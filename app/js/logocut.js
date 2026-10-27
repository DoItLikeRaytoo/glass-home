/*
 * Glass Home – Logos freistellen (direkt am Fernseher)
 * Nimmt das App-Symbol, das der Fernseher liefert, entfernt dessen quadratischen Hintergrund
 * und gibt nur noch das eigentliche Logo als Bild (PNG mit Transparenz) zurück.
 *
 * Rezepte (in apps.js unter "cut"):
 *   mode 'bg'       Hintergrundfarbe vom Rand her entfernen (Innenflächen des Logos bleiben)
 *   mode 'bgGlobal' Hintergrundfarbe überall entfernen (auch in Buchstaben-Innenräumen)
 *   mode 'white'    nur helle/weiße Teile behalten (weißer Schriftzug auf buntem Grund)
 *   tol             Toleranz für "gleiche Farbe wie Hintergrund" (0–255)
 *   largest         nur das größte zusammenhängende Teil behalten (z. B. Flamme ohne Schrift)
 * Gelingt es nicht (z. B. weil der Fernseher das Auslesen sperrt), bleibt das normale Symbol.
 */
var GH_CUT = (function () {
  'use strict';

  function median(arr) { arr.sort(function (a, b) { return a - b; }); return arr[arr.length >> 1]; }

  function cut(img, rc) {
    var nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return null;
    var S = 256, k = S / Math.max(nw, nh), W = Math.round(nw * k), H = Math.round(nh * k);
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d');
    cx.drawImage(img, 0, 0, W, H);
    var id = cx.getImageData(0, 0, W, H);   // wirft SecurityError, falls gesperrt
    var d = id.data, N = W * H, i, x, y;
    var mode = rc.mode || 'bg', tol = rc.tol || 48;

    // Hintergrundfarbe = Median der (sichtbaren) Randpixel
    var rs = [], gs = [], bs = [];
    function pushB(p) { if (d[p * 4 + 3] > 128) { rs.push(d[p * 4]); gs.push(d[p * 4 + 1]); bs.push(d[p * 4 + 2]); } }
    for (x = 0; x < W; x++) { pushB(x); pushB((H - 1) * W + x); }
    for (y = 0; y < H; y++) { pushB(y * W); pushB(y * W + W - 1); }
    var hasB = rs.length > 8, B = hasB ? [median(rs), median(gs), median(bs)] : [0, 0, 0];
    function dist(p) { return Math.max(Math.abs(d[p * 4] - B[0]), Math.abs(d[p * 4 + 1] - B[1]), Math.abs(d[p * 4 + 2] - B[2])); }

    var bg = new Uint8Array(N), alpha = new Float32Array(N), col = new Float32Array(N * 3);
    for (i = 0; i < N; i++) { col[i * 3] = d[i * 4]; col[i * 3 + 1] = d[i * 4 + 1]; col[i * 3 + 2] = d[i * 4 + 2]; }

    if (mode === 'white') {
      for (i = 0; i < N; i++) {
        var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], mn = Math.min(r, g, b), mx = Math.max(r, g, b);
        var a = (mn - 150) / (235 - 150); if (mx - mn > 60) a = 0;       // bunte Pixel sind kein Weiß
        a = Math.max(0, Math.min(1, a)) * (d[i * 4 + 3] / 255);
        alpha[i] = a; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 255;
      }
    } else {
      var isBg = function (p) { return d[p * 4 + 3] < 20 || (hasB && dist(p) <= tol); };
      if (mode === 'bgGlobal') {
        for (i = 0; i < N; i++) bg[i] = isBg(i) ? 1 : 0;
      } else {
        var q = new Int32Array(N), qh = 0, qt = 0;
        var seed = function (p) { if (!bg[p] && isBg(p)) { bg[p] = 1; q[qt++] = p; } };
        for (x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
        for (y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
        while (qh < qt) {
          var p = q[qh++], px = p % W, py = (p / W) | 0;
          if (px > 0) seed(p - 1); if (px < W - 1) seed(p + 1);
          if (py > 0) seed(p - W); if (py < H - 1) seed(p + W);
        }
      }
      for (i = 0; i < N; i++) alpha[i] = bg[i] ? 0 : (d[i * 4 + 3] / 255);
      // Kanten: Mischfarbe aus Logo + Hintergrund entmischen (kein heller/dunkler Saum)
      if (hasB) for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
        i = y * W + x; if (bg[i]) continue;
        var nearBg = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W]);
        if (!nearBg) continue;
        var kr = 0, kg = 0, kb = 0, kn = 0;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
          var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          var j = yy * W + xx; if (bg[j] || dist(j) <= tol * 2) continue;
          kr += d[j * 4]; kg += d[j * 4 + 1]; kb += d[j * 4 + 2]; kn++;
        }
        if (!kn) continue;
        kr /= kn; kg /= kn; kb /= kn;
        var K = [kr, kg, kb], s = 0, c = 0;
        for (var ch = 0; ch < 3; ch++) { var den = K[ch] - B[ch]; if (Math.abs(den) > 25) { s += (d[i * 4 + ch] - B[ch]) / den; c++; } }
        if (c) { alpha[i] = Math.max(0, Math.min(1, s / c)) * (d[i * 4 + 3] / 255); col[i * 3] = kr; col[i * 3 + 1] = kg; col[i * 3 + 2] = kb; }
      }
    }

    // Optional: nur das größte zusammenhängende Teil behalten
    if (rc.largest) {
      var lab = new Int32Array(N), best = 0, bestN = 0, cur = 0, st = new Int32Array(N);
      for (i = 0; i < N; i++) {
        if (lab[i] || alpha[i] < 0.15) continue;
        cur++; var sp = 0, cnt = 0; st[sp++] = i; lab[i] = cur;
        while (sp) {
          var pp = st[--sp]; cnt++;
          var ppx = pp % W, ppy = (pp / W) | 0;
          for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
            var nx = ppx + ox, ny = ppy + oy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            var nn = ny * W + nx; if (!lab[nn] && alpha[nn] >= 0.15) { lab[nn] = cur; st[sp++] = nn; }
          }
        }
        if (cnt > bestN) { bestN = cnt; best = cur; }
      }
      for (i = 0; i < N; i++) if (lab[i] !== best) {
        // Kantenpixel direkt am größten Teil behalten (weicher Rand)
        var bx = i % W, by = (i / W) | 0, keep = false;
        if (alpha[i] > 0 && alpha[i] < 0.15) for (var ky = -1; ky <= 1 && !keep; ky++) for (var kx = -1; kx <= 1; kx++) {
          var mx2 = bx + kx, my2 = by + ky; if (mx2 >= 0 && my2 >= 0 && mx2 < W && my2 < H && lab[my2 * W + mx2] === best) { keep = true; break; }
        }
        if (!keep) alpha[i] = 0;
      }
    }

    // Zuschneiden + Plausibilität prüfen
    var x0 = W, y0 = H, x1 = -1, y1 = -1, opaque = 0;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x; if (alpha[i] > 0.08) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (alpha[i] > 0.5) opaque++;
    }
    var cover = opaque / N;
    if (x1 < 0 || cover < 0.02 || cover > 0.9) return null;   // kein klares Logo gefunden
    var ow = x1 - x0 + 1, oh = y1 - y0 + 1, pad = 2;
    var out = document.createElement('canvas'); out.width = ow + 2 * pad; out.height = oh + 2 * pad;
    var oc = out.getContext('2d'), od = oc.createImageData(out.width, out.height), o = od.data;
    for (y = 0; y < oh; y++) for (x = 0; x < ow; x++) {
      i = (y + y0) * W + (x + x0); var t = ((y + pad) * out.width + (x + pad)) * 4;
      o[t] = col[i * 3]; o[t + 1] = col[i * 3 + 1]; o[t + 2] = col[i * 3 + 2]; o[t + 3] = Math.round(alpha[i] * 255);
    }
    oc.putImageData(od, 0, 0);
    return out.toDataURL('image/png');
  }

  return { cut: cut };
})();
