# Glass Home 0.1 – eigene Startseite für den Samsung S95F

Normale Tizen-Web-App (HTML/CSS/JavaScript), kein Root, keine Systemänderung.
Deinstallierbar wie jede andere App.

## Inhalt
- config.xml       App-Beschreibung für Tizen (ID GlsHome001.GlassHome, Rechte: Apps starten, App-Liste lesen, Farbtasten)
- index.html       Einstieg
- css/app.css      Darstellung, 1:1 aus der Designvorschau „Startseite“
- js/apps.js       Deine 10 Apps: Reihenfolge, Farben, Erkennung (hier anpassen)
- js/platform.js   Zugriff auf den Fernseher (tizen.*); im Browser eine Attrappe
- js/app.js        Oberfläche, Fernbedienung, Uhr, App-Start, Diagnose
- fonts/           Schrift Inter (Open Font License), offline
- icon.png         App-Symbol

## Bedienung
◀ ▶ App wählen · OK starten · Blau = Diagnose · Gelb = Glas voll/leicht · Zurück schließt die Diagnose

## Am Mac ansehen
index.html in Chrome öffnen (Pfeiltasten, Enter, D, Q). Dort gibt es keine echten Apps und keine echten Symbole.

## Bekannte Grenzen
- Kann die Samsung-Startseite nicht ersetzen. Mit „Autorun Last App“ startet sie nach dem Einschalten,
  wenn sie zuletzt offen war.
- Echte App-Symbole kommen vom Fernseher selbst (Diagnose zeigt, ob sie laden). Sonst eigenes Ersatzsymbol.
- App-IDs können je nach TV abweichen; die Diagnose zeigt die echten IDs.
