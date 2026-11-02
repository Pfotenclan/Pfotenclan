/* PfotenClan web app – the same screens and logic as the iPhone app (v30). */
(function () {
  'use strict';
  var VERSION = '30-20261102105444';
  var C = null, FOCUS = {};
  var $main = document.getElementById('main');
  var $tabbar = document.getElementById('tabbar');
  var $overlay = document.getElementById('overlay');
  var $welcome = document.getElementById('welcome');
  var $update = document.getElementById('update');

  // ---------- storage (only on this device) ----------
  function load(key, fallback) { try { var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: keep in memory */ } }
  var store = {
    favorites: load('pfc.favs', []),
    result: load('pfc.result', null),
    progress: load('pfc.progress', {}),
    welcomed: load('pfc.welcomed', false)
  };
  var state = { tab: 'start', detailDepth: 0, internalNav: false, quiz: { step: -1, answers: [], busy: false },
    clanQuery: '', guideQuery: '', guideFilter: 'Alle', scroll: {} };

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rating(v) { return Math.round(v) === v ? String(v) : String(v).replace('.', ','); }
  function clanColor(h) { return 'hsl(' + h + ',56%,68%)'; }
  function clanLight(h) { return 'hsl(' + h + ',87%,78%)'; }
  function clanTint(h) { return 'hsla(' + h + ',56%,68%,.22)'; }
  var ICON = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    quiz: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 9l1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9.5h3M14 15.5h3"/>',
    seal: '<path d="M12 2l2.4 2.1 3.2-.4.9 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.9 3.1-3.2-.4L12 22l-2.4-2.1-3.2.4-.9-3.1-2.8-1.6 1.2-3-1.2-3 2.8-1.6.9-3.1 3.2.4z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
    heart: '<path d="M12 20s-7-4.4-9-8.6C1.6 8.4 3.6 5 7 5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.4 0 5.4 3.4 4 6.4-2 4.2-9 8.6-9 8.6z"/>',
    right: '<path d="M9 5l7 7-7 7"/>', left: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', next: '<circle cx="12" cy="12" r="9"/><path d="M10 8l4 4-4 4"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    circle: '<circle cx="12" cy="12" r="9"/>', done: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'
  };
  function icon(name, cls, style) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"' + (style ? ' style="' + style + '"' : '') + '>' + ICON[name] + '</svg>'; }
  function pm(style) { return '<span class="pm" aria-hidden="true"' + (style ? ' style="' + style + '"' : '') + '></span>'; }

  // ---------- content lookup ----------
  var KIND = { rasse: 'Clan', lifestyle: 'Lifestyle', bibliothek: 'Ratgeber', training: 'Trainingsplan' };
  var SLUG = { rasse: 'clan', lifestyle: 'lebensstil', bibliothek: 'ratgeber', training: 'training' };
  var TYPE = { clan: 'rasse', lebensstil: 'lifestyle', ratgeber: 'bibliothek', training: 'training' };
  function list(type) { return type === 'rasse' ? C.breeds : type === 'lifestyle' ? C.lifestyle : type === 'bibliothek' ? C.library : C.training; }
  function find(type, id) { var l = list(type) || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function titleOf(type, id) { var x = find(type, id); return x ? (x.name || x.title) : null; }
  function hueOf(type, id) { var x = type === 'rasse' && find(type, id); return x ? x.hue : 210; }
  function href(type, id) { return '#/' + SLUG[type] + '/' + encodeURIComponent(id); }
  function key(type, id) { return type + ':' + id; }

  // ---------- small components ----------
  function photo(name, focus, eager) {
    if (!name) return '';
    var f = focus || FOCUS[name] || [0.5, 0.5];
    return '<img src="img/' + esc(name) + '.jpg" alt="" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" style="object-position:' +
      Math.round(f[0] * 100) + '% ' + Math.round(f[1] * 100) + '%" onload="this.classList.add(\'loaded\')">';
  }
  function plate(name, o) {
    o = o || {}; var hue = o.hue == null ? 210 : o.hue;
    var cap = '';
    if (o.title) {
      cap = '<div class="shade"></div><div class="cap">' +
        (o.kicker ? '<div class="kicker" style="color:' + clanLight(hue) + '">' + esc(o.kicker) + '</div>' : '') +
        '<div class="ttl" style="font-size:' + ((o.size || 28) / 16) + 'rem">' + esc(o.title) + '</div></div>';
    }
    return '<div class="plate ' + (o.cls || '') + '" style="' + (o.aspect ? 'aspect-ratio:' + o.aspect + ';' : '') + 'background:' + clanTint(hue) + '">' +
      (name ? photo(name, null, o.eager) : '<div class="ph">' + pm() + '</div>') + cap + '</div>';
  }
  function eyebrow(text, color) { return '<p class="eyebrow"' + (color ? ' style="color:' + color + '"' : '') + '>' + esc(text) + '</p>'; }
  function sectionHeader(title, action, link) {
    return '<div class="sh"><h2 class="display d28">' + esc(title) + '</h2>' + (action ? '<a class="link-btn" href="' + link + '">' + esc(action) + '</a>' : '') + '</div>';
  }
  function screenTitle(eb, title, lede) { return '<header class="stack-xs">' + eyebrow(eb) + '<h1 class="display d52">' + esc(title) + '</h1><p class="lede">' + esc(lede) + '</p></header>'; }
  function dots(v, color) { var s = '<span class="dots" role="img" aria-label="' + rating(v) + ' von 5">'; for (var i = 1; i <= 5; i++) s += '<i' + (i <= v ? ' style="background:' + color + '"' : '') + '></i>'; return s + '</span>'; }
  function chipLink(type, id) {
    var t = titleOf(type, id); if (!t) return '';
    return '<a class="chip" href="' + href(type, id) + '" data-internal><span class="kind">' + KIND[type] + '</span>' + esc(t) + '</a>';
  }
  function crossLinks(links) {
    var chips = (links || []).map(function (l) { return chipLink(l.type, l.id); }).join('');
    return chips ? '<section class="stack-xs"><h2 class="display d24">Passt dazu</h2><div class="flow">' + chips + '</div></section>' : '';
  }
  function checklist(title, items, ic, color) {
    return '<section class="stack-xs"><h2 class="display d24">' + esc(title) + '</h2>' + items.map(function (t) {
      return '<div class="check">' + icon(ic, '', 'color:' + color) + '<span>' + esc(t) + '</span></div>';
    }).join('') + '</section>';
  }
  function note(text) { return '<p class="note">' + esc(text) + '</p>'; }
  var INDIVIDUAL = 'Ein Clan beschreibt Herkunft, Anlagen und typische Tendenzen. Er ist keine Schablone. Jeder Hund hat seinen eigenen Charakter, geprägt von seinen Genen, seiner Aufzucht, seinen Erfahrungen und dem Leben mit dir. Sogar Geschwister aus einem Wurf können ganz verschieden sein. Und genau das ist das Schöne.';
  function individualNote(text, color) {
    color = color || 'var(--brand)';
    return '<div class="indiv" style="border-color:color-mix(in srgb,' + color + ' 35%,transparent)">' + pm('color:' + color) +
      '<div class="stack-xs">' + eyebrow('Jeder Hund ist einzigartig', color) + '<p class="small para">' + esc(text || INDIVIDUAL) + '</p></div></div>';
  }
  function quoteBlock(text, sig, action) {
    var inner = '<span class="qbar"></span><span><span class="q">„' + esc(text) + '“</span><span class="sig">' + pm() + esc(sig) + '</span></span>';
    return action ? '<button type="button" class="quote" data-action="' + action + '" aria-label="Zitat: ' + esc(text) + '. Öffnet den Willkommensbrief.">' + inner + '</button>'
      : '<div class="quote">' + inner + '</div>';
  }
  function favButton(type, id) {
    var on = store.favorites.indexOf(key(type, id)) >= 0;
    return '<button type="button" class="fav" data-fav="' + key(type, id) + '" aria-pressed="' + on + '">' + icon('heart') + '<span>' + (on ? 'Gemerkt' : 'Merken') + '</span></button>';
  }
  function creditLine(credit) {
    if (!credit) return '';
    return '<p class="xsmall muted">Foto: ' + (credit.url ? '<a href="' + esc(credit.url) + '" target="_blank" rel="noopener" style="color:inherit">' + esc(credit.text) + '</a>' : esc(credit.text)) + '</p>';
  }

  // ---------- tab bar ----------
  var TABS = [
    { id: 'start', hash: '#/', label: 'Start', icon: function () { return icon('home'); } },
    { id: 'quiz', hash: '#/quiz', label: 'Quiz', icon: function () { return icon(store.result ? 'seal' : 'quiz'); } },
    { id: 'clans', hash: '#/clans', label: 'Clans', icon: function () { return pm(); } },
    { id: 'lifestyle', hash: '#/lifestyle', label: 'Lifestyle', icon: function () { return icon('compass'); } },
    { id: 'ratgeber', hash: '#/ratgeber', label: 'Ratgeber', icon: function () { return icon('book'); } }
  ];
  function renderTabbar() {
    $tabbar.innerHTML = '<div class="inner">' + TABS.map(function (t) {
      var label = t.id === 'quiz' && validResult() ? 'Ergebnis' : t.label;
      return '<a href="' + t.hash + '"' + (state.tab === t.id ? ' aria-current="page"' : '') + '>' + t.icon() + '<span>' + label + '</span></a>';
    }).join('') + '</div>';
  }

  // ---------- start ----------
  var FRESH = [['bibliothek', 'kind-und-hund'], ['bibliothek', 'guter-halter'], ['bibliothek', 'ruede-oder-huendin'], ['bibliothek', 'leinen-halsband'],
    ['training', 'leinenfuehrigkeit'], ['training', 'rueckruf'], ['bibliothek', 'vor-dem-hund'], ['bibliothek', 'herkunft'], ['bibliothek', 'erste-tage'],
    ['training', 'impulskontrolle'], ['training', 'stubenreinheit']];
  var CHANGES = [
    'Neu: PfotenClan im Browser, zum Installieren auf Handy und PC',
    'v30: Ratgeber in 4 Gruppen mit Suche, neuer Ratgeber „Kind und Hund“',
    'v30: Trainingspläne zum Abhaken: markiere jede geschaffte Stufe',
    'v30: „Das Wichtigste“ oben in langen Ratgebern, Quellen und Stand am Ende',
    'v29: Neuer Ratgeber „Ein guter Hundehalter sein“'
  ];
  function miniCard(type, id, label) {
    var x = find(type, id); if (!x) return '';
    return '<a class="mini" href="' + href(type, id) + '" data-internal>' + plate(x.photo, { hue: hueOf(type, id), title: label, size: 20 }) + '<span class="t">' + esc(x.name || x.title) + '</span></a>';
  }
  function guideTile(g) {
    return '<a class="card" href="' + href('bibliothek', g.id) + '" data-internal style="display:block;text-decoration:none;color:inherit">' + plate(g.photo, { title: g.title, aspect: '16/9', size: 26 }) +
      '<div class="pad stack-xs">' + eyebrow(g.tag) + '<p class="small muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(g.summary) + '</p></div></a>';
  }
  function credits() {
    var seen = {}, out = [];
    [C.hero].concat(C.breeds, C.lifestyle, C.library, C.training).forEach(function (x) {
      var c = x && x.credit; if (c && !seen[c.text]) { seen[c.text] = 1; out.push(c); }
    });
    return out;
  }
  function renderStart() {
    var r = validResult() ? store.result : null, top = r && find('rasse', r.top);
    var favs = store.favorites.map(function (k) { var p = k.split(':'); return find(p[0], p[1]) ? p : null; }).filter(Boolean);
    var rec = (r ? ['guter-halter', 'kommunikation'] : ['vor-dem-hund', 'kommunikation']).map(function (id) { return find('bibliothek', id); }).filter(Boolean);
    var wolf = find('bibliothek', 'wolf-hund');
    var h = '';
    h += '<div class="brandbar"><img src="logo.png" alt="" width="38" height="38"><span class="name">PFOTENCLAN</span>' +
      (store.favorites.length ? '<span class="favs">' + icon('heart', '', 'width:14px;height:14px;fill:currentColor') + store.favorites.length + '</span>' : '') + '</div>';
    // hero
    h += '<section><div class="hero-photo bleed" style="margin-top:-14px">' + photo(C.hero.photo, [0.56, 0.34], true) +
      '<div class="grad"></div>' + (C.hero.credit ? '<a class="credit" href="' + esc(C.hero.credit.url || '#') + '" target="_blank" rel="noopener">Foto: ' + esc(C.hero.credit.text) + '</a>' : '') +
      '<div class="head stack-xs">' + eyebrow('Im Herzen ein Wolf') + '<h1 class="display">Sei nicht nur<br>sein Besitzer.<br><span style="color:var(--brand)">Sei sein Rudel.</span></h1></div></div>' +
      '<div class="stack-sm" style="margin-top:6px">' + quoteBlock('Hunde sind die besseren Menschen.', 'HEIKO, GRÜNDER VON PFOTENCLAN', 'welcome') +
      '<p style="color:rgba(255,255,255,.82)">Finde heraus, welcher Hund wirklich zu deinem Leben passt, und warum.</p>' +
      '<div><a class="btn" href="#/quiz">' + (r ? 'Mein Ergebnis' : 'Finde deinen Clan') + '</a></div>' +
      '<div class="stats"><div><b>' + C.breeds.length + '</b><span>Clans</span></div><div><b>' + C.lifestyle.length + '</b><span>Lebensstile</span></div><div><b>' + C.library.length + '</b><span>Ratgeber</span></div></div></div></section>';
    if (top) {
      h += '<section class="stack-sm">' + sectionHeader('Dein Clan', 'Ergebnis', '#/quiz') + '<a class="card row" href="' + href('rasse', top.id) + '" data-internal style="text-decoration:none;color:inherit">' +
        plate(top.photo, { hue: top.hue, cls: 'thumb' }) + '<span class="txt">' + eyebrow(top.clan, clanLight(top.hue)) + '<span class="display d22">' + esc(top.name) + '</span><span class="small muted">' + r.pct + ' % Übereinstimmung</span></span>' + icon('right', 'chev') + '</a></section>';
    }
    h += '<section class="stack-sm">' + sectionHeader('Die Clans', 'Alle ' + C.breeds.length, '#/clans') + '<div class="hscroll bleed">' + C.breeds.map(function (c) {
      return '<a href="' + href('rasse', c.id) + '" data-internal aria-label="' + esc(c.clan + ': ' + c.name) + '" style="width:170px;border-radius:16px;overflow:hidden">' + plate(c.photo, { hue: c.hue, title: c.name, kicker: c.clan, aspect: '3/4', size: 22 }) + '</a>';
    }).join('') + '</div></section>';
    if (wolf) {
      h += '<a href="' + href('bibliothek', 'wolf-hund') + '" data-internal style="display:flex;gap:16px;align-items:center;padding:20px;border-radius:20px;text-decoration:none;color:inherit;background:radial-gradient(circle at top right,rgba(232,163,61,.16),transparent 70%),#12181C">' +
        '<span class="stack-xs" style="flex:1">' + eyebrow('Wissen') + '<span class="display d36 black" style="color:#fff">Vom Wolf<br>zum Hund</span><span class="small" style="color:rgba(255,255,255,.75)">' + esc(wolf.summary) + '</span></span>' +
        '<img src="logo.png" alt="" width="100" height="100" style="border-radius:24px;box-shadow:0 6px 12px rgba(0,0,0,.4)"></a>';
    }
    h += '<section class="stack-sm">' + sectionHeader('Gemerkt') + (favs.length ? '<div class="hscroll bleed">' + favs.map(function (p) { return miniCard(p[0], p[1]); }).join('') + '</div>' :
      '<p class="small muted" style="padding:18px;border:1.5px dashed var(--line);border-radius:20px">Tippe bei einem Clan, Lebensstil oder Ratgeber auf „Merken“. Deine Auswahl erscheint dann hier.</p>') + '</section>';
    if (rec.length) h += '<section class="stack-sm">' + sectionHeader('Empfohlen') + rec.map(guideTile).join('') + '</section>';
    h += '<section class="stack-sm">' + sectionHeader('Neu im Ratgeber', 'Alle', '#/ratgeber') + '<div class="hscroll bleed">' + FRESH.map(function (p) { return miniCard(p[0], p[1], KIND[p[0]]); }).join('') + '</div></section>';
    h += '<section class="stack-xs"><details class="acc"><summary><span class="display d19">Neu in Version ' + esc(C.version) + '</span>' + icon('right') + '</summary><div class="body small muted">' +
      CHANGES.map(function (c) { return '<p>• ' + esc(c) + '</p>'; }).join('') + '</div></details>' +
      '<details class="acc"><summary><span class="display d19">Bildnachweis</span>' + icon('right') + '</summary><div class="body small muted stack-xs">' +
      credits().map(function (c) { return c.url ? '<a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.text) + '</a>' : '<span>' + esc(c.text) + '</span>'; }).join('') + '</div></details></section>';
    h += '<footer class="footer">' + pm() + '<button type="button" class="link-btn" data-action="welcome">Über Heiko &amp; Loki</button>' +
      '<p>PfotenClan v' + esc(C.version) + ' · ' + esc(C.datum) + '</p><p>Allgemeine Informationen, ersetzen keine tierärztliche Beratung.</p>' +
      '<nav><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a></nav></footer>';
    return '<div class="stack">' + h + '</div>';
  }

  // ---------- quiz ----------
  function validResult() {
    var r = store.result;
    return !!(r && C && Array.isArray(r.answers) && r.answers.length === C.quiz.length && r.answers.every(Array.isArray) && find('rasse', r.top));
  }
  function renderQuiz() {
    var q = state.quiz, n = C.quiz.length;
    if (q.step === -1 && validResult()) { q.answers = store.result.answers.map(function (a) { return a.slice(); }); q.step = n; }
    if (q.step < 0) return quizIntro();
    if (q.step < n) return quizQuestion(C.quiz[q.step]);
    return quizResults();
  }
  function quizIntro() {
    var n = C.quiz.length;
    return '<div class="stack-sm">' + screenTitle(n + ' Fragen · 2 Minuten', 'Welcher Clan passt zu dir?', 'Wir vergleichen deine Antworten mit dem Profil jedes Clans und zeigen dir, was passt und worauf du achten solltest.') +
      '<div class="card pad-lg stack-sm"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">' +
      [[n, 'Fragen'], [2, 'Minuten'], [C.breeds.length, 'Clans']].map(function (s) { return '<div class="statbox"><b>' + s[0] + '</b><span class="small muted">' + s[1] + '</span></div>'; }).join('') +
      '</div><button type="button" class="btn full" data-action="quiz-start">Los geht’s</button></div>' +
      '<p class="soft small">Das Quiz zeigt, welche Hundefamilien zu deinem Leben passen. Über den einzelnen Hund sagt es nichts: Jeder Hund ist ein Individuum mit eigenem Charakter, und das ist das Schöne daran. Lerne deinen Hund vor dem Einzug gut kennen. Mischlinge aus dem Tierschutz können genauso gut passen.</p></div>';
  }
  function current() { var q = state.quiz; return q.answers[q.step] || []; }
  function quizQuestion(qq) {
    var q = state.quiz, n = C.quiz.length, cur = current(), multi = !!qq.multi;
    var h = '<div class="stack-sm fade-in" style="gap:22px">';
    h += '<div class="qtop"><button type="button" class="icon-btn" data-action="quiz-back" aria-label="Vorherige Frage">' + icon('left') + '</button>' +
      '<div class="prog"><span class="display d16 muted" style="letter-spacing:.1em">Frage ' + (q.step + 1) + ' / ' + n + '</span><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + q.step + '"><i style="width:' + Math.round(100 * q.step / n) + '%"></i></div></div></div>';
    h += '<h1 class="display d36" id="q-title" tabindex="-1">' + esc(qq.q) + '</h1>';
    if (qq.h) h += '<div class="coach stack-xs">' + eyebrow('Coach-Tipp') + '<p class="small muted">' + esc(qq.h) + '</p></div>';
    if (multi) h += '<p class="small" style="color:var(--brand);font-weight:600;display:flex;gap:8px;align-items:center">' + icon('list') + 'Mehrere Antworten möglich</p>';
    h += '<div class="stack-xs" role="group" aria-labelledby="q-title" style="gap:10px">' + qq.o.map(function (o, i) {
      return '<button type="button" class="opt' + (multi ? ' multi' : '') + '" data-answer="' + i + '" aria-pressed="' + (cur.indexOf(i) >= 0) + '"><span class="mark"></span><span>' + esc(o.text) + '</span></button>';
    }).join('') + '</div>';
    if (multi) h += '<button type="button" class="btn full" data-action="quiz-next"' + (cur.length ? '' : ' disabled') + '>' + (q.step === n - 1 ? 'Ergebnis zeigen' : 'Weiter') + '</button>';
    return h + '</div>';
  }
  function resultCard(rank, res, clan) {
    var h = '<article class="card"><a href="' + href('rasse', clan.id) + '" data-internal>' + plate(clan.photo, { hue: clan.hue, title: clan.name, kicker: rank + '. Platz · ' + clan.clan, aspect: '16/9', size: 30 }) + '</a>';
    h += '<div class="pad-lg stack-sm"><div style="display:flex;gap:14px;align-items:center"><span class="pct">' + res.pct + '<small> %</small></span><span class="stack-xs" style="flex:1">' +
      '<span class="display d19" style="color:' + clanLight(clan.hue) + ';font-weight:700;text-transform:none">' + esc(clan.motto) + '</span><span class="bar"><i style="width:' + res.pct + '%"></i></span></span></div>';
    h += '<div class="stack-xs">' + eyebrow('Warum passt das?') + res.goods.map(function (g) { return '<div class="check small">' + icon('check', '', 'color:var(--brand)') + '<span>' + esc(g) + '</span></div>'; }).join('') +
      (res.bad ? '<div class="check small" style="color:var(--warn)">' + icon('x') + '<span>Achte darauf: ' + esc(res.bad) + '</span></div>' : '') +
      (!res.goods.length && !res.bad ? '<div class="check small">' + icon('check') + '<span>Keine klaren Konflikte mit deinen Antworten</span></div>' : '') + '</div>';
    h += '<p class="xsmall muted">' + esc(clan.beispielrassen) + '</p><a class="btn-ghost" href="' + href('rasse', clan.id) + '" data-internal style="text-decoration:none;color:inherit">Clan ansehen</a></div></article>';
    return h;
  }
  function quizResults() {
    var q = state.quiz, ranked = QuizEngine.rank(q.answers, C.quiz, C.breeds), needs = QuizEngine.needs(q.answers, C.quiz);
    if (ranked[0]) {
      var top = ranked[0];
      if (!store.result || store.result.top !== top.id || JSON.stringify(store.result.answers) !== JSON.stringify(q.answers)) {
        store.result = { top: top.id, pct: top.pct, answers: q.answers }; save('pfc.result', store.result); renderTabbar();
      }
    }
    var h = '<div class="stack-sm" style="gap:20px"><header class="stack-xs">' + eyebrow('Dein Ergebnis') + '<h1 class="display d48">Diese Clans passen zu dir</h1></header>';
    ranked.slice(0, 3).forEach(function (r, i) { var c = find('rasse', r.id); if (c) h += resultCard(i + 1, r, c); });
    h += individualNote('Dein Ergebnis zeigt Clans, deren typische Anlagen zu deinem Alltag passen. Den passenden Hund findest du aber erst, wenn du ihn kennenlernst: Jeder Hund hat seinen eigenen Charakter. Triff ihn mehrmals, frag nach seinem Wesen und hör auf dein Bauchgefühl. Und genau das ist das Schöne.');
    QuizEngine.notes(needs).forEach(function (nt) {
      var p = nt.route.split(':'), type = p[0] === 'guide' ? 'bibliothek' : p[0];
      h += '<div class="soft stack-xs"><p class="small" style="font-weight:700">' + esc(nt.title) + '</p><p class="small">' + esc(nt.text) + '</p><div>' + chipLink(type, p[1]) + '</div></div>';
    });
    var topClan = ranked[0] && find('rasse', ranked[0].id);
    if (topClan) {
      var steps = [['Lerne deinen Clan kennen', topClan.name, href('rasse', topClan.id)],
        ['Ehrlicher Check: Bevor ein Hund einzieht', 'Für deinen Hund bist du die ganze Welt', href('bibliothek', 'vor-dem-hund')],
        ['Den richtigen Hund finden', 'Seriöse Herkunft statt Welpenhandel', href('bibliothek', 'herkunft')],
        ['Die ersten Tage planen', 'Ruhe, Routinen, kleine Schritte', href('bibliothek', 'erste-tage')],
        ['Hundeschule finden', 'Gute Trainer erkennen, zuhause mit den Trainingsplänen üben', href('bibliothek', 'erste-tage')]];
      h += '<section class="stack-xs">' + sectionHeader('Deine nächsten Schritte') + '<p class="small muted">Ein Hund ist eine Entscheidung für viele Jahre. Geh diese Schritte in Ruhe, einen nach dem anderen.</p>' +
        '<div class="card steps">' + steps.map(function (s, i) {
          return '<a class="step" href="' + s[2] + '" data-internal style="text-decoration:none;color:inherit"><span class="num">' + (i + 1) + '</span><span class="txt" style="flex:1;display:grid;gap:2px"><span style="font-weight:600">' + esc(s[0]) + '</span><span class="small muted">' + esc(s[1]) + '</span></span>' + icon('right', 'chev') + '</a>';
        }).join('') + '</div></section>';
    }
    h += '<section>' + sectionHeader('Alle Clans') + ranked.slice(3).map(function (r) {
      var c = find('rasse', r.id); if (!c) return '';
      return '<a class="result-line" href="' + href('rasse', c.id) + '" data-internal style="text-decoration:none;color:inherit"><span>' + esc(c.name) + '</span><span class="bar"><i style="width:' + r.pct + '%"></i></span><span class="muted" style="text-align:right;font-variant-numeric:tabular-nums">' + r.pct + ' %</span></a>';
    }).join('') + '</section>';
    h += '<button type="button" class="btn-ghost" data-action="quiz-start">Quiz neu starten</button><a class="btn-ghost" href="' + href('lifestyle', 'schutz-strassenhunde') + '" data-internal style="text-decoration:none;color:inherit">Hunde aus dem Tierschutz</a></div>';
    return h;
  }

  // ---------- clans ----------
  function clanCards() {
    var q = state.clanQuery.trim().toLowerCase();
    var l = C.breeds.filter(function (c) { return !q || (c.name + ' ' + c.clan + ' ' + c.beispielrassen).toLowerCase().indexOf(q) >= 0; });
    if (!l.length) return '<p class="small muted">Kein Clan gefunden für „' + esc(state.clanQuery) + '“. Versuch es mit einem anderen Rassenamen.</p>';
    return l.map(function (c) {
      function mini(label, v) { return '<span style="display:inline-flex;gap:5px;align-items:center"><span class="xsmall muted" style="font-weight:600">' + label + '</span>' + dots(v, clanColor(c.hue)) + '</span>'; }
      return '<a class="card" href="' + href('rasse', c.id) + '" data-internal style="display:block;text-decoration:none;color:inherit">' + plate(c.photo, { hue: c.hue, title: c.name, kicker: c.clan, aspect: '4/3', size: 32 }) +
        '<div class="pad stack-xs"><p class="display d20" style="font-weight:700;text-transform:none;color:' + clanLight(c.hue) + '">' + esc(c.motto) + '</p><p class="small muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(c.beispielrassen) + '</p>' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap">' + mini('Bewegung', c.profil.bewegungsbedarf) + mini('Erziehbar', c.profil.erziehbarkeit) + mini('Familie', c.profil.familientauglichkeit) + '</div></div></a>';
    }).join('');
  }
  function searchField(id, value, placeholder) {
    return '<label class="search">' + icon('search', 'muted') + '<input id="' + id + '" type="search" value="' + esc(value) + '" placeholder="' + esc(placeholder) + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="' + esc(placeholder) + '"></label>';
  }
  function renderClans() {
    return '<div class="stack-sm" style="gap:16px">' + screenTitle('Im Herzen ein Wolf', 'Die Clans', 'Es gibt Hunderte Hunderassen. Hier findest du ' + C.breeds.length + ' der bekanntesten Hundefamilien in Europa, jede mit gemeinsamer Herkunft und typischen Anlagen. Die Clans zeigen Tendenzen, keine Schablonen: Jeder Hund ist ein Individuum mit eigenem Charakter, und das ist das Schöne. Und das Rudel wächst weiter.') +
      searchField('clan-search', state.clanQuery, 'z.B. Labrador, Husky, Hovawart') + '<div id="clan-list" class="stack-sm" style="gap:16px">' + clanCards() + '</div></div>';
  }

  // ---------- lifestyle ----------
  function renderLifestyle() {
    return '<div class="stack-sm" style="gap:16px">' + screenTitle('Dein Alltag', 'Lifestyle', 'Nicht nach Herkunft sortiert, sondern danach, wie du lebst.') + C.lifestyle.map(function (l) {
      return '<a class="card" href="' + href('lifestyle', l.id) + '" data-internal style="display:block;text-decoration:none;color:inherit">' + plate(l.photo, { title: l.name, aspect: '4/3', size: 30 }) +
        '<p class="pad small muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(l.beschreibung) + '</p></a>';
    }).join('') + '</div>';
  }

  // ---------- ratgeber ----------
  function groups() { var seen = []; C.library.forEach(function (g) { if (seen.indexOf(g.tag) < 0) seen.push(g.tag); }); return seen; }
  function done(planId) { return (store.progress[planId] || []).length; }
  function row(link, photoName, eb, title, summary) {
    return '<a class="card row" href="' + link + '" data-internal style="text-decoration:none;color:inherit">' + plate(photoName, { cls: 'thumb' }) +
      '<span class="txt">' + eyebrow(eb) + '<span class="display d22">' + esc(title) + '</span><span class="sum">' + esc(summary) + '</span></span>' + icon('right', 'chev') + '</a>';
  }
  function guideRow(g) { return row(href('bibliothek', g.id), g.photo, g.tag, g.title, g.summary); }
  function guideBody() {
    var q = state.guideQuery.trim().toLowerCase();
    if (q) {
      var m = function (t) { return t.toLowerCase().indexOf(q) >= 0; };
      var plans = C.training.filter(function (p) { return m(p.title + ' ' + p.summary + ' ' + p.ziel + ' Training'); });
      var guides = C.library.filter(function (g) { return m(g.title + ' ' + g.summary + ' ' + g.tag + ' ' + g.ueberblick); });
      if (!plans.length && !guides.length) return '<p class="small muted">Nichts gefunden für „' + esc(state.guideQuery) + '“. Versuch ein anderes Wort.</p>';
      return plans.map(function (p) { return row(href('training', p.id), p.photo, 'Trainingsplan', p.title, p.summary); }).join('') + guides.map(guideRow).join('');
    }
    var h = '<section class="stack-xs">' + sectionHeader('Trainingspläne') + '<p class="small muted">Schritt für Schritt, belohnungsbasiert. Zum Üben zuhause, als Begleitung zur Hundeschule, nicht als Ersatz.</p><div class="hscroll bleed">' +
      C.training.map(function (p) {
        var d = done(p.id), kicker = d ? d + ' von ' + p.stufen.length + ' Stufen geschafft' : p.stufen.length + ' Stufen · ' + p.tag;
        return '<a class="card" href="' + href('training', p.id) + '" data-internal style="width:240px;text-decoration:none;color:inherit">' + plate(p.photo, { title: p.title, kicker: kicker, aspect: '4/3', size: 24 }) +
          '<p class="small muted" style="padding:12px;min-height:5.2em;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' + esc(p.summary) + '</p></a>';
      }).join('') + '</div></section>';
    h += sectionHeader('Alle Ratgeber');
    h += '<div class="hscroll bleed" role="group" aria-label="Bereiche">' + ['Alle'].concat(groups()).map(function (t) {
      return '<button type="button" class="chip" data-filter="' + esc(t) + '" aria-pressed="' + (state.guideFilter === t) + '">' + esc(t) + '</button>';
    }).join('') + '</div>';
    if (state.guideFilter === 'Alle') {
      groups().forEach(function (g) {
        h += '<h3 class="display d20 muted" style="margin:8px 0 0">' + esc(g) + '</h3>' + C.library.filter(function (x) { return x.tag === g; }).map(guideRow).join('');
      });
    } else {
      h += C.library.filter(function (x) { return x.tag === state.guideFilter; }).map(guideRow).join('');
    }
    return h;
  }
  function renderRatgeber() {
    return '<div class="stack-sm">' + screenTitle('Wissen', 'Ratgeber', 'Vor dem Hund, Training, Gesundheit und das Leben mit deinem Hund. Belohnungsbasiert und ehrlich.') +
      searchField('guide-search', state.guideQuery, 'Suchen, z.B. Leine, Welpe, Kastration') + '<div id="guide-body" class="stack-sm">' + guideBody() + '</div></div>';
  }

  // ---------- details ----------
  function detailHeader(type, x, o) {
    return plate(x.photo, { hue: o.hue, cls: 'detail-plate', eager: true }) + '<div class="inner" style="padding-top:14px;gap:8px">' + creditLine(x.credit) + eyebrow(o.eyebrow, o.color) +
      '<h1 class="display d44 black">' + esc(x.name || x.title) + '</h1>' + (o.subtitle ? '<p class="small muted" style="font-weight:600">' + esc(o.subtitle) + '</p>' : '') + favButton(type, x.id) + '</div>';
  }
  function acc(title, text, open) { return '<details class="acc"' + (open ? ' open' : '') + '><summary>' + esc(title) + icon('right') + '</summary><div class="body">' + esc(text) + '</div></details>'; }
  var TRAITS = [['bewegungsbedarf', 'Bewegung'], ['raumbedarf', 'Platzbedarf'], ['familientauglichkeit', 'Familie'], ['sozialvertraeglichkeit', 'Sozial'], ['erziehbarkeit', 'Erziehbarkeit'],
    ['selbststaendigkeit', 'Selbstständigkeit'], ['pflegeaufwand', 'Fellpflege'], ['jagdtrieb', 'Jagdtrieb'], ['haaren', 'Haaren'], ['anspruch', 'Anspruch an Halter']];
  function clanDetail(c) {
    var col = clanColor(c.hue), light = clanLight(c.hue);
    var traits = TRAITS.map(function (t) {
      var v = c.profil[t[0]], bars = ''; for (var i = 1; i <= 5; i++) bars += '<i' + (i <= v ? ' style="background:' + col + '"' : '') + '></i>';
      return '<div class="trait"><span>' + t[1] + '</span><span class="bars" role="img" aria-label="' + rating(v) + ' von 5">' + bars + '</span><span class="val">' + rating(v) + '/5</span></div>';
    }).join('');
    return detailHeader('rasse', c, { hue: c.hue, eyebrow: c.clan, color: light, subtitle: c.beispielrassen }) + '<div class="inner">' +
      '<p class="display d28" style="font-weight:700;text-transform:none;color:' + light + '">„' + esc(c.motto) + '“</p><p class="para">' + esc(c.beschreibung) + '</p>' +
      '<div class="erbe" style="background:radial-gradient(circle at top left,hsla(' + c.hue + ',56%,68%,.35),transparent 70%),#12181C">' + pm('color:' + light) + '<div class="stack-xs">' + eyebrow('Wolfserbe', light) + '<p class="small para" style="color:rgba(255,255,255,.88)">' + esc(c.erbe) + '</p></div></div>' +
      '<section class="stack-xs"><h2 class="display d24">Profil</h2><div class="card pad stack-xs" style="gap:10px">' + traits + '</div></section>' +
      individualNote(null, light) +
      '<div class="stack-xs">' + acc('Temperament', c.temperament, true) + acc('Haltung & Pflege', c.haltung_pflege) + acc('Training', c.training) + acc('Gesundheit', c.gesundheit) + acc('Geeignet für', c.geeignet_fuer) + acc('Häufige Herausforderungen', c.haeufige_probleme) + '</div>' +
      note('Gesundheitsangaben sind typische Tendenzen. Bei Symptomen oder Fragen zu Medikamenten immer den Tierarzt fragen.') + crossLinks(c.verwandte) + '</div>';
  }
  function lifestyleDetail(l) {
    return detailHeader('lifestyle', l, { hue: 160, eyebrow: 'Lifestyle', subtitle: l.typische_rassen }) + '<div class="inner"><p class="para">' + esc(l.beschreibung) + '</p><div class="stack-xs">' +
      acc('Warum diese Hunde passen', l.warum_passend, true) + acc('Tipps für die Haltung', l.haltung_tipps, true) + acc('Worauf du achten solltest', l.worauf_achten) + acc('Geeignet für', l.geeignet_fuer) + '</div>' + crossLinks(l.verwandte) + '</div>';
  }
  function keyPoints(points) {
    return '<div class="keypoints">' + eyebrow('Das Wichtigste') + points.map(function (p) { return '<div class="check">' + icon('check', '', 'color:var(--brand)') + '<span>' + esc(p) + '</span></div>'; }).join('') + '</div>';
  }
  function sources(quellen) {
    var h = '<footer class="stack-xs">';
    if (quellen && quellen.length) {
      h += '<h2 class="display d16 muted">Quellen</h2>' + quellen.map(function (q) {
        return '<a class="small" href="' + esc(q.url) + '" target="_blank" rel="noopener" style="display:flex;gap:6px;align-items:flex-start">' + icon('ext', '', 'width:16px;height:16px;margin-top:3px') + '<span>' + esc(q.title) + '</span></a>';
      }).join('');
    }
    return h + '<p class="xsmall muted">Stand: ' + esc(C.datum) + '. Regeln und Wissen können sich ändern.</p></footer>';
  }
  function guideDetail(g) {
    var h = detailHeader('bibliothek', g, { eyebrow: g.tag }) + '<div class="inner">';
    if (g.zitat) h += quoteBlock(g.zitat, 'HEIKO & LOKI');
    if (g.kurz && g.kurz.length) h += keyPoints(g.kurz);
    h += '<p class="para">' + esc(g.ueberblick) + '</p>';
    (g.abschnitte || []).forEach(function (a) {
      h += '<section class="stack-xs"><h2 class="display d24">' + esc(a.title) + '</h2><p class="para">' + esc(a.text) + '</p>' +
        (a.tipp ? '<div class="tipbox">' + pm() + '<div class="stack-xs">' + eyebrow('Tipp von Heiko & Loki') + '<p class="small para">' + esc(a.tipp) + '</p></div></div>' : '') + '</section>';
    });
    if (g.varianten && g.varianten.length) {
      h += '<section class="stack-xs"><h2 class="display d24">Möglichkeiten im Vergleich</h2>' + g.varianten.map(function (v) {
        return '<div class="card-sm pad stack-xs"><p style="font-weight:600">' + esc(v.name) + '</p><div class="check small muted">' + icon('plus') + '<span>' + esc(v.pro) + '</span></div><div class="check small muted">' + icon('minus') + '<span>' + esc(v.contra) + '</span></div></div>';
      }).join('') + '</section>';
    }
    h += checklist('So machst du es richtig', g.tipps, 'check', 'var(--brand)') + checklist('Häufige Fehler', g.fehler, 'x', 'var(--warn)');
    if (g.tag === 'Gesundheit') h += note('Dieser Ratgeber ersetzt keinen Tierarztbesuch. Bei Symptomen bitte immer tierärztlich abklären lassen.');
    return h + crossLinks(g.verwandte) + sources(g.quellen) + '</div>';
  }
  function planProgress(p) {
    var d = done(p.id), n = p.stufen.length;
    return '<div class="stack-xs" id="plan-progress"><p class="small" style="font-weight:600;color:' + (d ? 'var(--brand)' : 'var(--muted)') + '">' + (d === n && n ? 'Alle ' + n + ' Stufen geschafft. Stark!' : d + ' von ' + n + ' Stufen geschafft') +
      '</p><div class="bar"><i style="width:' + Math.round(100 * d / Math.max(n, 1)) + '%"></i></div></div>';
  }
  function stufeCard(p, s, i) {
    var isDone = (store.progress[p.id] || []).indexOf(i) >= 0;
    return '<article class="stufe' + (isDone ? ' done' : '') + '"><div class="head"><span class="num">' + (isDone ? icon('check', '', 'width:18px;height:18px;stroke-width:3') : (i + 1)) + '</span><span class="stack-xs" style="gap:0">' +
      eyebrow('Stufe ' + (i + 1)) + '<span class="display d22">' + esc(s.title) + '</span></span></div><ul>' + s.schritte.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="next check">' + icon('next', '', 'color:var(--brand)') + '<span><b>Weiter, wenn: </b>' + esc(s.weiter) + '</span></div>' +
      '<button type="button" class="tick" data-tick="' + esc(p.id) + ':' + i + '" aria-pressed="' + isDone + '" aria-label="' + (isDone ? 'Stufe ' + (i + 1) + ' geschafft. Tippen zum Zurücksetzen' : 'Stufe ' + (i + 1) + ' als geschafft markieren') + '">' +
      icon(isDone ? 'done' : 'circle') + (isDone ? 'Geschafft' : 'Stufe geschafft?') + '</button></article>';
  }
  function trainingDetail(p) {
    return detailHeader('training', p, { eyebrow: 'Trainingsplan · ' + p.tag, subtitle: p.summary }) + '<div class="inner">' +
      '<div class="soft stack-xs" style="padding:16px;border-radius:16px">' + eyebrow('Ziel') + '<p style="font-weight:600" class="para">' + esc(p.ziel) + '</p><p class="small muted check" style="margin-top:4px">' + icon('clock') + '<span>' + esc(p.dauer) + '</span></p></div>' +
      '<section class="stack-xs"><h2 class="display d24">Das brauchst du</h2><div class="flow">' + p.ausruestung.map(function (a) { return '<span class="chip" style="min-height:36px">' + esc(a) + '</span>'; }).join('') + '</div></section>' +
      '<section class="stack-sm"><h2 class="display d24">Schritt für Schritt</h2>' + planProgress(p) + '<p class="small muted">Bleib auf einer Stufe, bis das Ziel der Stufe klappt. Kurze Einheiten von 3–5 Minuten, lieber öfter am Tag.</p>' +
      p.stufen.map(function (s, i) { return stufeCard(p, s, i); }).join('') + '</section>' +
      checklist('Häufige Fehler', p.fehler, 'x', 'var(--warn)') + checklist('Wenn es nicht klappt', p.hilfe, 'bulb', 'var(--brand)') +
      note('Dieser Plan ersetzt keine Hundeschule. Er hilft dir beim Üben zuhause, zwischen den Trainerstunden. Ein guter Trainer sieht deinen Hund und dich und kann direkt helfen. Bei Angst, Aggression oder Schmerzen hol dir immer Hilfe bei einem Trainer mit belohnungsbasierten Methoden oder beim Tierarzt.') +
      crossLinks(p.verwandte) + sources([]) + '</div>';
  }
  function renderDetail(type, id) {
    var x = find(type, id);
    var body = !x ? '<div class="inner" style="padding-top:24px"><p>Diesen Eintrag gibt es nicht mehr.</p></div>' :
      type === 'rasse' ? clanDetail(x) : type === 'lifestyle' ? lifestyleDetail(x) : type === 'bibliothek' ? guideDetail(x) : trainingDetail(x);
    document.title = (x ? (x.name || x.title) + ' · ' : '') + 'PfotenClan';
    $overlay.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(KIND[type] + (x ? ': ' + (x.name || x.title) : '')) + '" tabindex="-1">' +
      '<div class="sheet-bar">' + (state.detailDepth > 1 ? '<button type="button" class="icon-btn" data-action="back" aria-label="Zurück">' + icon('left') + '</button>' : '<span style="width:44px"></span>') +
      '<span class="kind">' + KIND[type] + '</span><button type="button" class="icon-btn" data-action="close" aria-label="Schließen">' + icon('close') + '</button></div>' +
      '<div class="sheet-body stack" style="gap:22px">' + body + '</div></div>';
    $overlay.hidden = false; document.body.style.overflow = 'hidden';
    var sheet = $overlay.querySelector('.sheet'); sheet.scrollTop = 0; sheet.focus({ preventScroll: true });
  }
  function closeOverlay() { $overlay.hidden = true; $overlay.innerHTML = ''; document.body.style.overflow = ''; }

  // ---------- welcome ----------
  function renderWelcome() {
    $welcome.innerHTML = '<div class="inner"><article class="card" aria-labelledby="w-title"><div class="photo"><img src="img/heiko-loki.jpg" alt="Heiko mit seinem Hund Loki"><div class="grad"></div><div class="head">' +
      eyebrow('Willkommen im Rudel') + '<h1 class="display d44 black" id="w-title" style="color:#fff">Hi, ich bin Heiko.</h1></div></div><div class="text">' +
      '<p>Und das ist mein bester Kumpel Loki. Wir zwei haben PfotenClan gebaut, um dir zu helfen, deinen besten Freund auf vier Pfoten zu finden: einen Hund, der wirklich zu deinem Leben passt.</p>' +
      '<p>Die Suche ist aber erst der Anfang. Hier findest du auch ehrliches Wissen über die Clans, faires, belohnungsbasiertes Training und Tipps für euren gemeinsamen Alltag. Damit aus euch ein echtes Team wird.</p>' +
      '<p><b>Eins noch, ganz ehrlich:</b> PfotenClan ist eine App, kein Hundetrainer und kein Tierarzt. Das Wissen über Hunde wächst ständig, und Trainingsmethoden verändern sich. Auch wir lernen jeden Tag dazu und entwickeln die App weiter.</p>' +
      '<p class="display d30 black" style="color:var(--brand);text-transform:none;line-height:1.05;padding:6px 0">„Nur wer gemeinsam weitergeht, verdient sich das Vertrauen seines Hundes.“</p>' +
      '<p>Mit Geduld, Fairness und Zeit. Jeden Tag ein Stück.</p><p style="font-weight:600">Schön, dass du da bist!</p>' +
      '<div class="sig">' + pm() + '<span class="display d24 black" style="color:var(--brand);letter-spacing:.06em">Heiko &amp; Loki</span></div>' +
      '<button type="button" class="btn full" data-action="welcome-close" style="margin-top:6px">Los geht’s</button></div></article></div>';
    $welcome.hidden = false; document.body.style.overflow = 'hidden';
    var b = $welcome.querySelector('[data-action="welcome-close"]'); $welcome.scrollTop = 0; setTimeout(function () { $welcome.querySelector('h1').setAttribute('tabindex', '-1'); $welcome.querySelector('h1').focus({ preventScroll: true }); }, 30);
    return b;
  }
  function closeWelcome() {
    $welcome.hidden = true; $welcome.innerHTML = ''; if ($overlay.hidden) document.body.style.overflow = '';
    store.welcomed = true; save('pfc.welcomed', true);
  }

  // ---------- routing ----------
  var TAB_BY_HASH = { '': 'start', 'quiz': 'quiz', 'clans': 'clans', 'lifestyle': 'lifestyle', 'ratgeber': 'ratgeber' };
  function tabHash(tab) { for (var i = 0; i < TABS.length; i++) if (TABS[i].id === tab) return TABS[i].hash; return '#/'; }
  function renderTab(focus) {
    var html = state.tab === 'start' ? renderStart() : state.tab === 'quiz' ? renderQuiz() : state.tab === 'clans' ? renderClans() : state.tab === 'lifestyle' ? renderLifestyle() : renderRatgeber();
    $main.innerHTML = html; renderTabbar();
    document.title = (state.tab === 'start' ? '' : (TABS.filter(function (t) { return t.id === state.tab; })[0].label + ' · ')) + 'PfotenClan';
    if (focus) $main.focus({ preventScroll: true });
  }
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    if (parts.length >= 2 && TYPE[parts[0]]) {
      state.detailDepth = state.internalNav ? state.detailDepth + 1 : Math.max(1, state.detailDepth);
      state.internalNav = false;
      if (!$main.innerHTML) renderTab(false);
      renderDetail(TYPE[parts[0]], parts.slice(1).join('/'));
      return;
    }
    state.detailDepth = 0; state.internalNav = false;
    var wasOverlay = !$overlay.hidden; closeOverlay();
    var tab = TAB_BY_HASH[parts[0]] || 'start';
    if (tab !== state.tab || !$main.innerHTML) {
      state.scroll[state.tab] = window.scrollY;
      state.tab = tab;
      if (tab === 'quiz' && state.quiz.step >= C.quiz.length && !validResult()) state.quiz = { step: -1, answers: [], busy: false };
      renderTab(true); window.scrollTo(0, 0);
    } else if (wasOverlay) {
      renderTab(false); // refresh favourites, progress or result after a detail
    }
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-internal]');
    if (a) { state.internalNav = true; return; }
    var t = e.target.closest('[data-action],[data-fav],[data-answer],[data-filter],[data-tick]');
    if (!t) { if (e.target === $overlay) closeDetail(); return; }
    if (t.dataset.fav) {
      var k = t.dataset.fav, i = store.favorites.indexOf(k);
      if (i >= 0) store.favorites.splice(i, 1); else store.favorites.unshift(k);
      save('pfc.favs', store.favorites); t.outerHTML = favButton(k.split(':')[0], k.split(':').slice(1).join(':')); return;
    }
    if (t.dataset.tick) {
      var p = t.dataset.tick.split(':'), lvl = Number(p[1]), arr = store.progress[p[0]] || [], j = arr.indexOf(lvl);
      if (j >= 0) arr.splice(j, 1); else arr.push(lvl);
      store.progress[p[0]] = arr.sort(function (x, y) { return x - y; }); save('pfc.progress', store.progress);
      var plan = find('training', p[0]), card = t.closest('.stufe');
      card.outerHTML = stufeCard(plan, plan.stufen[lvl], lvl);
      var pr = document.getElementById('plan-progress'); if (pr) pr.outerHTML = planProgress(plan);
      var again = $overlay.querySelector('[data-tick="' + p[0] + ':' + lvl + '"]'); if (again) again.focus({ preventScroll: true });
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (err) { /* ignore */ }
      return;
    }
    if (t.dataset.filter) { state.guideFilter = t.dataset.filter; document.getElementById('guide-body').innerHTML = guideBody(); var f = document.querySelector('[data-filter="' + t.dataset.filter + '"]'); if (f) f.focus({ preventScroll: true }); return; }
    if (t.dataset.answer !== undefined) { answer(Number(t.dataset.answer)); return; }
    var act = t.dataset.action;
    if (act === 'welcome') renderWelcome();
    else if (act === 'welcome-close') closeWelcome();
    else if (act === 'close') closeDetail();
    else if (act === 'back') history.back();
    else if (act === 'quiz-start') { state.quiz = { step: 0, answers: [], busy: false }; rerenderQuiz(); }
    else if (act === 'quiz-back') { state.quiz.step -= 1; rerenderQuiz(); }
    else if (act === 'quiz-next') { if (current().length) { state.quiz.step += 1; rerenderQuiz(); } }
    else if (act === 'apply-update') applyUpdate();
  });
  function closeDetail() { location.hash = tabHash(state.tab); }
  function rerenderQuiz() { $main.innerHTML = renderQuiz(); renderTabbar(); window.scrollTo(0, 0); var tt = document.getElementById('q-title'); if (tt) tt.focus({ preventScroll: true }); }
  function answer(i) {
    var q = state.quiz, qq = C.quiz[q.step]; if (!qq) return;
    var cur = current().slice();
    if (qq.multi) {
      var at = cur.indexOf(i);
      if (at >= 0) cur.splice(at, 1);
      else if (qq.o[i].only) cur = [i];
      else { cur = cur.filter(function (x) { return !qq.o[x].only; }); cur.push(i); }
      q.answers[q.step] = cur.sort(function (a, b) { return a - b; });
      $main.innerHTML = renderQuiz();
      var b = $main.querySelector('[data-answer="' + i + '"]'); if (b) b.focus({ preventScroll: true });
      return;
    }
    if (q.busy) return; q.busy = true;
    q.answers[q.step] = [i];
    $main.querySelectorAll('.opt').forEach(function (o) { o.setAttribute('aria-pressed', String(Number(o.dataset.answer) === i)); });
    setTimeout(function () { q.busy = false; q.step += 1; rerenderQuiz(); }, 220);
  }
  document.addEventListener('input', function (e) {
    if (e.target.id === 'clan-search') { state.clanQuery = e.target.value; document.getElementById('clan-list').innerHTML = clanCards(); }
    if (e.target.id === 'guide-search') { state.guideQuery = e.target.value; document.getElementById('guide-body').innerHTML = guideBody(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$welcome.hidden) closeWelcome(); else if (!$overlay.hidden) closeDetail();
  });
  window.addEventListener('hashchange', route);

  // ---------- updates (service worker) ----------
  var reg = null;
  function showUpdate() { if (reg && reg.waiting && navigator.serviceWorker.controller) $update.hidden = false; }
  function applyUpdate() { if (reg && reg.waiting) reg.waiting.postMessage('skipWaiting'); else location.reload(); }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (r) {
        reg = r; showUpdate();
        r.addEventListener('updatefound', function () {
          var w = r.installing; if (w) w.addEventListener('statechange', function () { if (w.state === 'installed') showUpdate(); });
        });
        setInterval(function () { r.update(); }, 30 * 60 * 1000);
        document.addEventListener('visibilitychange', function () { if (!document.hidden) r.update(); });
      }).catch(function () { /* offline use not available */ });
      var refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () { if (refreshing) return; refreshing = true; location.reload(); });
    });
  }

  // ---------- start ----------
  function boot() {
    Promise.all([
      fetch('content.json?v=' + VERSION).then(function (r) { return r.json(); }),
      fetch('photo-focus.json?v=' + VERSION).then(function (r) { return r.json(); }).catch(function () { return {}; })
    ]).then(function (res) {
      C = res[0]; FOCUS = res[1] || {};
      if (!validResult()) store.result = null;
      route();
      if (!store.welcomed) renderWelcome();
    }).catch(function () {
      $main.innerHTML = '<div class="stack-sm" style="padding-top:40px"><h1 class="display d36">Keine Verbindung</h1><p class="muted">PfotenClan konnte nicht geladen werden. Prüf deine Internetverbindung und lade die Seite neu.</p><button type="button" class="btn" onclick="location.reload()">Neu laden</button></div>';
    });
  }
  boot();
})();
