# PfotenClan – Web-App

PfotenClan als Website, die man auf Handy und PC wie eine App installieren kann (PWA).
Gleiche Inhalte und gleiche Quiz-Auswertung wie die iPhone-App (Version 30).

## Ordner

| Ordner / Datei | Inhalt |
|---|---|
| `src/` | Die Bausteine: Seite, Design, App-Logik, Quiz-Auswertung, Inhalte (`content.json`), Fotos, Schrift |
| `build-web.py` | Baut aus `src/` die fertige Website in `docs/` |
| `docs/` | Die fertige Website. Diesen Ordner zeigt GitHub Pages an |

## Online stellen mit GitHub Pages (einmalig)

1. Kostenloses Konto auf github.com anlegen.
2. Neues Repository **pfotenclan** anlegen (öffentlich) und diesen Ordner hochladen.
3. Im Repository: **Settings → Pages → Build and deployment → Deploy from a branch**, Branch `main`, Ordner `/docs`, speichern.
4. Nach 1–2 Minuten läuft die App unter `https://<dein-name>.github.io/pfotenclan/`.

## Eigene Domain

1. Domain bei einem Anbieter registrieren (zum Beispiel pfoten-clan.de).
2. Beim Anbieter diese DNS-Einträge setzen:
   - 4 × **A**-Eintrag für die Domain: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **CNAME** für `www` → `<dein-name>.github.io`
3. Neu bauen mit Domain: `PFOTENCLAN_DOMAIN=pfoten-clan.de python3 build-web.py` (erzeugt die Datei `docs/CNAME`).
4. Bei GitHub unter **Settings → Pages** die Domain eintragen und **Enforce HTTPS** anhaken.

## Vor dem Start ausfüllen

In `build-web.py` stehen Impressum und Datenschutz mit Platzhaltern in eckigen Klammern:
`[Vor- und Nachname]`, `[Straße und Hausnummer]`, `[PLZ und Ort]`, `[E-Mail-Adresse]`.
Ohne vollständiges Impressum sollte die Seite nicht öffentlich gehen.

## Updates

1. Inhalte oder Code in `src/` ändern.
2. `python3 build-web.py` ausführen (braucht Python mit Pillow).
3. Den Ordner `docs/` hochladen (bei GitHub: committen und pushen).

Jeder Bau bekommt eine neue Versionsnummer. Wer die App installiert hat, sieht beim nächsten Öffnen
„Neue Version von PfotenClan ist da“ und bekommt mit einem Tipp auf **Neu laden** die neue Version.
Die App funktioniert auch offline.

## Installieren

- **iPhone/iPad:** in Safari öffnen → Teilen → **Zum Home-Bildschirm**
- **Android:** in Chrome öffnen → Menü → **App installieren**
- **PC/Mac:** in Chrome oder Edge öffnen → Installieren-Symbol in der Adressleiste

Gemerkte Inhalte, das Quiz-Ergebnis und der Trainingsfortschritt bleiben auf dem jeweiligen Gerät.
