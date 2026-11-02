// PfotenClan quiz scoring – same formulas as the iPhone app (QuizEngine.swift, v30).
// Answers: one array of option indexes per question. Within one question the most demanding
// value wins per axis; across questions values are averaged. A cat or small animals (jagd = 1)
// always make hunting tolerance strict.
(function (global) {
  'use strict';
  var axes = [
    { key: 'bewegung', w: 1.6, trait: 'bewegungsbedarf',
      pen: function (u, b) { return b > u ? (b - u) : (u - b) * 0.6; },
      relevant: function () { return true; },
      good: 'Bewegungsbedarf passt zu eurer gemeinsamen Zeit',
      bad: function (u, b) { return b > u ? 'Braucht mehr Zeit und Bewegung, als du einplanst' : 'Ist dir wahrscheinlich zu gemütlich'; } },
    { key: 'training', w: 0.9, trait: 'bewegungsbedarf',
      pen: function (u, b) { return Math.max(0, b - (u + 1.5)); },
      relevant: function (u) { return u >= 3; },
      good: 'Hat Freude an Training und Aufgaben, genau wie du',
      bad: function () { return 'Braucht eine Aufgabe und regelmäßiges Training'; } },
    { key: 'familie', w: 1.2, trait: 'familientauglichkeit',
      pen: function (u, b) { return Math.max(0, u - b); },
      relevant: function (u) { return u >= 3; },
      good: 'Geduldig und robust im Familientrubel',
      bad: function () { return 'Für einen Alltag mit kleinen Kindern weniger robust'; } },
    { key: 'sozial', w: 1.0, trait: 'sozialvertraeglichkeit',
      pen: function (u, b) { return Math.max(0, u - b); },
      relevant: function (u) { return u >= 3; },
      good: 'Meist offen gegenüber Menschen und Tieren',
      bad: function () { return 'Oft zurückhaltend mit Fremden und anderen Tieren'; } },
    { key: 'erfahrung', w: 1.6, trait: 'anspruch',
      pen: function (u, b) { var ok = u <= 1.5 ? 2 : (u <= 3.5 ? 3.5 : 5); return Math.max(0, b - ok) * 1.5; },
      relevant: function (u) { return u <= 3.5; },
      good: 'Kooperativ und gut zu führen für dein Erfahrungslevel',
      bad: function () { return 'Anspruchsvoll in der Führung, eher etwas für Erfahrene'; } },
    { key: 'allergie', w: 1.6, trait: 'haaren',
      pen: function (u, b) { return Math.max(0, b - 2) * 1.3; },
      relevant: function () { return true; },
      good: 'Haart wenig, gut bei Allergie (vorher testen)',
      bad: function () { return 'Haart stark, schwierig bei Hundehaar-Allergie'; } },
    { key: 'naehe', w: 0.6, trait: 'selbststaendigkeit',
      pen: function (u, b) { return Math.abs(u - b); },
      relevant: function () { return false; },
      good: '',
      bad: function (u, b) { return b > u ? 'Selbstständiger, als du es dir wünschst' : 'Anhänglicher, als du es dir wünschst'; } },
    { key: 'allein', w: 1.0, trait: 'selbststaendigkeit',
      pen: function (u, b) { var need = u <= 1.5 ? 0 : (u <= 3.5 ? 2 : 4); return Math.max(0, need - b); },
      relevant: function (u) { return u >= 3; },
      good: 'Kann Alleinsein meist gut lernen',
      bad: function () { return 'Bleibt ungern länger allein'; } },
    { key: 'pflege', w: 0.7, trait: 'pflegeaufwand',
      pen: function (u, b) { return Math.max(0, b - u); },
      relevant: function (u) { return u <= 3; },
      good: 'Fellpflege passt in deine Zeit',
      bad: function () { return 'Braucht mehr Fellpflege, als du investieren willst'; } },
    { key: 'jagd', w: 1.1, trait: 'jagdtrieb',
      pen: function (u, b) { var tol = u <= 1.5 ? 2 : (u <= 3.5 ? 3.5 : 5); return Math.max(0, b - tol); },
      relevant: function (u) { return u <= 3.5; },
      good: 'Jagdtrieb meist gut kontrollierbar',
      bad: function () { return 'Starker Jagdtrieb, Freilauf und Kleintiere brauchen viel Training'; } }
  ];
  var stricterLow = { jagd: 1, pflege: 1, erfahrung: 1, naehe: 1 };

  function needs(answers, questions) {
    var sum = {}, count = {}, strictHunt = false;
    answers.forEach(function (selection, qi) {
      if (qi >= questions.length) return;
      var per = {};
      [].concat(selection).forEach(function (oi) {
        var opt = questions[qi].o[oi]; if (!opt) return;
        Object.keys(opt.set).forEach(function (k) {
          var v = opt.set[k];
          if (k in per) per[k] = stricterLow[k] ? Math.min(per[k], v) : Math.max(per[k], v);
          else per[k] = v;
        });
      });
      Object.keys(per).forEach(function (k) { sum[k] = (sum[k] || 0) + per[k]; count[k] = (count[k] || 0) + 1; });
      if (per.jagd === 1) strictHunt = true;
    });
    var out = {};
    Object.keys(sum).forEach(function (k) { out[k] = sum[k] / count[k]; });
    if (strictHunt) out.jagd = 1;
    return out;
  }

  function score(n, profil, id) {
    var total = 0, maxTotal = 0, parts = [];
    axes.forEach(function (ax, i) {
      if (!(ax.key in n)) return;
      var u = n[ax.key], b = profil[ax.trait], p = Math.min(4, ax.pen(u, b));
      total += ax.w * p; maxTotal += ax.w * 4;
      parts.push({ i: i, ax: ax, u: u, b: b, p: p });
    });
    var share = maxTotal > 0 ? total / maxTotal : 0;
    var pct = Math.round(100 * (1 - Math.pow(share, 0.75)));
    var goods = parts.filter(function (x) { return x.p === 0 && x.ax.relevant(x.u); })
      .sort(function (a, b) { return (b.ax.w - a.ax.w) || (a.i - b.i); })
      .slice(0, 2).map(function (x) { return x.ax.good; });
    var worst = null;
    parts.forEach(function (x) { if (worst === null || x.p * x.ax.w > worst.p * worst.ax.w) worst = x; });
    var bad = worst && worst.p * worst.ax.w >= 1 ? worst.ax.bad(worst.u, worst.b) : null;
    return { id: id, pct: Math.min(100, Math.max(0, pct)), share: share, goods: goods, bad: bad };
  }

  function rank(answers, questions, clans) {
    var n = needs(answers, questions);
    return clans.map(function (c, i) { return [i, score(n, c.profil, c.id)]; })
      .sort(function (a, b) { return (a[1].share - b[1].share) || (a[0] - b[0]); })
      .map(function (x) { return x[1]; });
  }

  function notes(n) {
    var out = [];
    if ((n.bewegung !== undefined ? n.bewegung : 3) <= 2 && (n.allein !== undefined ? n.allein : 1) >= 4.5)
      out.push({ id: 'zeit', title: 'Ehrlich gesagt', text: 'Wenig gemeinsame Zeit und lange Alleinzeiten sind für jeden Hund schwer. Plane Hundesitter oder Huta fest ein, oder warte mit dem Hund, bis dein Alltag mehr Raum lässt.', route: 'guide:alleinbleiben' });
    else if (n.langeAllein !== undefined)
      out.push({ id: 'allein', title: 'Alleinsein will gelernt sein', text: 'Regelmäßig mehr als fünf Stunden allein ist für fast jeden Hund zu viel. Plane Betreuung ein und übe das Alleinbleiben Schritt für Schritt.', route: 'guide:alleinbleiben' });
    if (n.allergie !== undefined)
      out.push({ id: 'allergie', title: 'Allergie im Haushalt', text: 'Schau dir Hunde an, die kaum haaren, und teste vorher, ob ihr den Hund wirklich vertragt.', route: 'lifestyle:allergikerfreundlich' });
    else if (n.allergieTest !== undefined)
      out.push({ id: 'allergietest', title: 'Allergie vorher klären', text: 'Lass im Zweifel einen Allergietest machen und verbringt vor der Entscheidung mehrmals Zeit mit dem Hund.', route: 'lifestyle:allergikerfreundlich' });
    if ((n.familie !== undefined ? n.familie : 0) >= 4)
      out.push({ id: 'kinder', title: 'Kinder und Hund', text: 'Mit kleinen Kindern im Haus zählen Aufsicht, klare Regeln für alle und ein Rückzugsort für den Hund.', route: 'guide:kind-und-hund' });
    if ((n.erfahrung !== undefined ? n.erfahrung : 5) <= 1.5)
      out.push({ id: 'start', title: 'Dein erster Hund?', text: 'Eine Welpen- oder Hundeschule mit belohnungsbasiertem Training lohnt sich in jedem Fall.', route: 'lifestyle:anfaengerhunde' });
    return out;
  }

  var api = { needs: needs, score: score, rank: rank, notes: notes };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.QuizEngine = api;
})(this);
