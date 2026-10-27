/*
 * Glass Home – App-Liste
 * ----------------------
 * Reihenfolge = Reihenfolge im Dock.
 *
 * Felder:
 *   name   Anzeigename in der Karte
 *   word   großer Schriftzug im Hintergrund
 *   kind   kleine Zeile über dem Namen
 *   sub    Beschreibung unter dem Namen
 *   tint   Hauptfarbe (R,G,B)  – Schrift, Licht, Fokus
 *   tint2  Zweitfarbe (R,G,B)  – Verlauf
 *   glyph  Ersatzsymbol, falls das echte App-Symbol des Fernsehers nicht geladen werden kann
 *   ids    bekannte App-IDs (werden zuerst probiert; können je nach TV abweichen)
 *   match  Suchmuster für den App-Namen auf dem Fernseher (falls keine ID passt)
 *   avoid  Namen, die NICHT gemeint sind (z. B. "YouTube Kids")
 *   icon   optional: eigenes Logo im Ordner icons/ (hat Vorrang vor dem Symbol des Fernsehers)
 *   shape  true = Logo hat eigene Form (transparentes PNG) und wird ohne quadratische Kachel gezeigt
 *   cut    Rezept, um das Symbol des Fernsehers am TV freizustellen (siehe js/logocut.js)
 *
 * Wenn eine App auf deinem TV nicht gefunden wird: blaue Taste drücken
 * (Diagnose), dort steht die echte ID. Diese hier bei "ids" ganz vorne eintragen.
 */
var GH_APPS = [
  { key: 'tizenbrew', name: 'TizenBrew', word: 'TIZENBREW', kind: 'YouTube werbefrei', sub: 'YouTube ohne Werbung über TizenTube',
    tint: '20,184,166', tint2: '56,189,248', glyph: 'flask', icon: 'icons/tizenbrew.png', shape: true,
    ids: [], match: [/tizen\s*brew/i], avoid: [/installer/i] },

  { key: 'twitch', name: 'Twitch', word: 'TWITCH', kind: 'Live', sub: 'Livestreams und Chat',
    tint: '145,70,255', tint2: '191,148,255', glyph: 'live', cut: { mode: 'bg', tol: 60 },
    ids: [], match: [/^twitch$/i, /twitch/i], avoid: [] },

  { key: 'hotiptv', name: 'HotIPTV', word: 'HOTIPTV', kind: 'IPTV', sub: 'Deine Sender und Playlists',
    tint: '249,115,22', tint2: '250,204,21', glyph: 'dish', cut: { mode: 'bg', tol: 40, largest: true },
    ids: [], match: [/hot\s*iptv/i], avoid: [] },

  { key: 'joyn', name: 'Joyn', word: 'JOYN', kind: 'Live-TV', sub: 'Live-TV und Mediathek',
    tint: '236,72,153', tint2: '168,85,247', glyph: 'playcircle', cut: { mode: 'white' },
    ids: [], match: [/^joyn/i], avoid: [] },

  { key: 'disney', name: 'Disney+', word: 'DISNEY+', kind: 'Streaming', sub: 'Filme und Serien',
    tint: '0,99,229', tint2: '0,190,230', glyph: 'sparkle', icon: 'icons/disney.png', shape: true,
    ids: ['MCmYXNxgcu.DisneyPlus'], match: [/disney/i], avoid: [] },

  { key: 'rtl', name: 'RTL+', word: 'RTL+', kind: 'Streaming', sub: 'Serien, Shows und Live-TV',
    tint: '239,68,68', tint2: '249,115,22', glyph: 'episodes', cut: { mode: 'bg', tol: 50 },
    ids: [], match: [/^rtl\s*(\+|plus)/i, /rtl/i], avoid: [] },

  { key: 'prime', name: 'Prime Video', word: 'PRIME', kind: 'Streaming', sub: 'Filme und Serien',
    tint: '0,168,225', tint2: '45,212,191', glyph: 'clapper', icon: 'icons/prime.png', shape: true,
    ids: ['org.tizen.primevideo'], match: [/prime\s*video/i, /amazon/i], avoid: [] },

  { key: 'netflix', name: 'Netflix', word: 'NETFLIX', kind: 'Streaming', sub: 'Filme und Serien',
    tint: '229,9,20', tint2: '251,113,133', glyph: 'reel', cut: { mode: 'bgGlobal', tol: 45 },
    ids: ['org.tizen.netflix-app'], match: [/^netflix$/i, /netflix/i], avoid: [] },

  { key: 'tvplus', name: 'Samsung TV Plus', word: 'TV PLUS', kind: 'Free-TV', sub: 'Kostenlose Sender',
    tint: '59,130,246', tint2: '34,211,238', glyph: 'tvplus', icon: 'icons/tvplus.png', shape: true,
    ids: [], match: [/tv\s*plus/i], avoid: [] },

  { key: 'youtube', name: 'YouTube', word: 'YOUTUBE', kind: 'Original-App', sub: 'Mit Werbung',
    tint: '255,0,0', tint2: '255,96,96', glyph: 'camera', icon: 'icons/youtube.png', shape: true,
    ids: ['9Ur5IzDKqV.TizenYouTube'], match: [/^youtube$/i, /youtube/i], avoid: [/kids/i, /music/i, /\btv\b/i, /tizentube/i] }
];
