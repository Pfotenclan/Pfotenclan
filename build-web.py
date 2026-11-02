#!/usr/bin/env python3
"""Build the PfotenClan web app (PWA) into dist/ – ready for GitHub Pages on pfotenclan.de.

Every build gets a new version stamp. Installed apps notice the new service worker and show
"Neue Version von PfotenClan ist da – Neu laden".
"""
import json, os, shutil, datetime
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, DIST = os.path.join(ROOT, 'src'), os.path.join(ROOT, 'docs')   # GitHub Pages serves the docs/ folder
# Own domain (e.g. pfoten-clan.de). Leave empty until the domain is registered and points to GitHub.
DOMAIN = os.environ.get('PFOTENCLAN_DOMAIN', '').strip()

content = json.load(open(os.path.join(SRC, 'content.json'), encoding='utf-8'))
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d%H%M%S')
VERSION = f"{content['version']}-{stamp}"

shutil.rmtree(DIST, ignore_errors=True)
os.makedirs(os.path.join(DIST, 'img')); os.makedirs(os.path.join(DIST, 'icons'))

def copy_text(name, replace=True):
    s = open(os.path.join(SRC, name), encoding='utf-8').read()
    if replace: s = s.replace('__VERSION__', VERSION)
    open(os.path.join(DIST, name), 'w', encoding='utf-8').write(s)

for f in ('index.html', 'styles.css', 'app.js', 'quiz-engine.js'):
    copy_text(f)
for f in ('logo.png', 'pawmoon.png'):
    shutil.copy(os.path.join(SRC, f), os.path.join(DIST, f))
shutil.copytree(os.path.join(SRC, 'fonts'), os.path.join(DIST, 'fonts'))
# compact JSON for the web
json.dump(content, open(os.path.join(DIST, 'content.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
shutil.copy(os.path.join(SRC, 'photo-focus.json'), os.path.join(DIST, 'photo-focus.json'))

# photos: max 1100 px wide, progressive JPEG
used = {content['hero']['photo'], 'heiko-loki'}
for k in ('breeds', 'lifestyle', 'library', 'training'):
    for x in content[k]:
        if x.get('photo'): used.add(x['photo'])
total = 0
for name in sorted(used):
    im = Image.open(os.path.join(SRC, 'img', name + '.jpg')).convert('RGB')
    if im.width > 1100: im = im.resize((1100, round(im.height * 1100 / im.width)), Image.LANCZOS)
    out = os.path.join(DIST, 'img', name + '.jpg')
    im.save(out, 'JPEG', quality=78, optimize=True, progressive=True)
    total += os.path.getsize(out)

# icons from the Pfotenmond app icon
icon = Image.open(os.path.join(SRC, 'icon-1024.png')).convert('RGB')
for size, name in ((512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png'), (32, 'favicon-32.png')):
    icon.resize((size, size), Image.LANCZOS).save(os.path.join(DIST, 'icons', name), optimize=True)

manifest = {
    'name': 'PfotenClan', 'short_name': 'PfotenClan', 'id': './', 'start_url': './', 'scope': './',
    'description': 'Finde den Hund, der wirklich zu deinem Leben passt. Quiz, Hunde-Clans, Ratgeber und Trainingspläne.',
    'lang': 'de', 'dir': 'ltr', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#0C1013', 'theme_color': '#0C1013', 'categories': ['lifestyle', 'education'],
    'icons': [
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}
    ]
}
json.dump(manifest, open(os.path.join(DIST, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

core = ['./', 'index.html', f'styles.css?v={VERSION}', f'app.js?v={VERSION}', f'quiz-engine.js?v={VERSION}',
        f'content.json?v={VERSION}', f'photo-focus.json?v={VERSION}', 'manifest.webmanifest', 'logo.png', 'pawmoon.png',
        'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
        'impressum.html', 'datenschutz.html'] + \
       [f'fonts/{f}' for f in sorted(os.listdir(os.path.join(SRC, 'fonts'))) if f.endswith('.woff2')] + \
       [f'img/{n}.jpg' for n in sorted(used)]
sw = """/* PfotenClan service worker – works offline and brings updates. Version: __V__ */
const CACHE = 'pfotenclan-__V__';
const CORE = __CORE__;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pfotenclan-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // pages: try the network first, so a fresh index.html arrives; offline: use the cached copy
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // files: cached first (they carry the version in their name), otherwise from the network
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
"""
open(os.path.join(DIST, 'sw.js'), 'w', encoding='utf-8').write(sw.replace('__V__', VERSION).replace('__CORE__', json.dumps(core, indent=2)))

# legal pages (placeholders in [brackets] must be filled in before going online)
page = """<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>__T__ · PfotenClan</title><meta name="theme-color" content="#0C1013"><link rel="icon" href="icons/favicon-32.png">
<style>
:root{--bg:#0C1013;--fg:#ECEEEB;--muted:#96A2A9;--brand:#E8A33D}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif}
main{max-width:680px;margin:0 auto;padding:32px 16px 64px}h1{font-size:2rem;line-height:1.1;margin:0 0 8px}
h2{font-size:1.25rem;margin:32px 0 8px;color:var(--brand)}a{color:var(--brand)}.muted{color:var(--muted)}
.back{display:inline-flex;min-height:44px;align-items:center;margin-bottom:16px}
</style></head><body><main><a class="back" href="./">← Zurück zu PfotenClan</a>
__B__
</main></body></html>
"""
impressum = """<h1>Impressum</h1><p class="muted">Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</p>
<h2>Anbieter</h2><p>[Vor- und Nachname]<br>[Straße und Hausnummer]<br>[PLZ und Ort]<br>Deutschland</p>
<h2>Kontakt</h2><p>E-Mail: <a href="mailto:[E-Mail-Adresse]">[E-Mail-Adresse]</a></p>
<h2>Verantwortlich für den Inhalt</h2><p>[Vor- und Nachname], Anschrift wie oben</p>
<h2>Hinweis</h2><p>PfotenClan gibt allgemeine Informationen über Hunde. Die Inhalte ersetzen keine tierärztliche Beratung und keine Hundeschule. Für die Inhalte verlinkter fremder Seiten sind deren Betreiber verantwortlich.</p>
<h2>Bildnachweise</h2><p>Die Urheber und Lizenzen der Fotos stehen in der App unter jedem Foto und auf der Startseite unter „Bildnachweis“.</p>"""
datenschutz = """<h1>Datenschutz</h1><p class="muted">Stand: __D__</p>
<h2>Kurz gesagt</h2><p>PfotenClan hat keine Anmeldung, keine Werbung, keine Cookies für Werbung oder Statistik und keine Analyse-Werkzeuge. Wir sammeln keine persönlichen Daten über dich.</p>
<h2>Verantwortlich</h2><p>[Vor- und Nachname]<br>[Straße und Hausnummer]<br>[PLZ und Ort]<br>E-Mail: <a href="mailto:[E-Mail-Adresse]">[E-Mail-Adresse]</a></p>
<h2>Hosting</h2><p>Diese Website wird über GitHub Pages bereitgestellt (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). Beim Aufruf verarbeitet GitHub technisch notwendige Daten wie deine IP-Adresse, Datum und Uhrzeit und die aufgerufene Seite, um die Website auszuliefern und vor Angriffen zu schützen. Dabei können Daten in die USA übertragen werden. Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren und zuverlässigen Bereitstellung (Art. 6 Abs. 1 lit. f DSGVO). Mehr dazu in der <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">Datenschutzerklärung von GitHub</a>.</p>
<h2>Was auf deinem Gerät gespeichert wird</h2><p>Damit PfotenClan sich an dich erinnert, speichert die App nur in deinem Browser auf deinem Gerät: deine gemerkten Inhalte, dein letztes Quiz-Ergebnis, deine abgehakten Trainingsstufen und ob du den Willkommensbrief schon gesehen hast. Außerdem werden die Inhalte der App für die Nutzung ohne Internet zwischengespeichert. Diese Daten werden nicht an uns gesendet. Du kannst sie jederzeit löschen, indem du die Website-Daten in deinem Browser löschst oder die App entfernst.</p>
<h2>Schriften und Bilder</h2><p>Schriften und Bilder werden direkt von dieser Website geladen, nicht von fremden Servern.</p>
<h2>Links zu anderen Seiten</h2><p>Einige Ratgeber verlinken auf Quellen wie Gesetzestexte, Studien oder Bildnachweise. Wenn du einen solchen Link öffnest, gelten die Datenschutzregeln der jeweiligen Website.</p>
<h2>Deine Rechte</h2><p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Für Fragen schreib uns an die oben genannte E-Mail-Adresse.</p>
<h2>Support</h2><p>Fragen, Ideen oder einen Fehler gefunden? Schreib uns an <a href="mailto:[E-Mail-Adresse]">[E-Mail-Adresse]</a>.</p>"""
for fname, title, body in (('impressum.html', 'Impressum', impressum), ('datenschutz.html', 'Datenschutz', datenschutz)):
    open(os.path.join(DIST, fname), 'w', encoding='utf-8').write(page.replace('__T__', title).replace('__B__', body.replace('__D__', content['datum'])))

# GitHub Pages extras
if DOMAIN: open(os.path.join(DIST, 'CNAME'), 'w').write(DOMAIN + '\n')
open(os.path.join(DIST, '.nojekyll'), 'w').write('')
open(os.path.join(DIST, '404.html'), 'w', encoding='utf-8').write('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./"><title>PfotenClan</title><a href="./">Zu PfotenClan</a>')
size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(DIST) for f in fs)
print(f'web build ok: version {VERSION}, {len(used)} photos ({total // 1024} KB), total {size // 1024} KB')
