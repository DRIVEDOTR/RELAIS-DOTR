/* Calque saisonnier DOTR.
   - Noël : sapin 3D animé dans le rond rouge, traîneau et rennes qui traversent l'écran, pulls-motifs 3D dans les bulles d'air.
   - Nouvel An : 2027 et Happy New Year DOTR en 3D dans le rond rouge, feux d'artifice, « Bonne année » dans les bulles.
   Activé uniquement pendant les périodes ci-dessous (fuseau Europe/Paris). Hors période, rien n'est ajouté au site.
   Aucun élément interactif : pointer-events est désactivé et le contenu reste au-dessus (z-index 1). */
(function () {
  "use strict";

  var PERIODES = [
    { mode: "noel", debut: "2026-12-01", fin: "2026-12-31" },
    { mode: "nouvelan", debut: "2027-01-01", fin: "2027-01-31" }
  ];

  function modeActif() {
    // Réservé à l'aperçu local (fichier de prévisualisation hors dépôt) : jamais défini sur le site publié.
    if (window.NOEL_FORCE) return window.NOEL_FORCE;
    var jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    for (var i = 0; i < PERIODES.length; i++) if (jour >= PERIODES[i].debut && jour <= PERIODES[i].fin) return PERIODES[i].mode;
    return null;
  }

  var MODE = modeActif();
  if (!MODE) return;

  var NOEL = MODE === "noel";
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var bgfx = document.getElementById("bgfx");
  if (!bgfx) return;

  /* ---------- Couche plein écran (derrière la Terre et le contenu) ---------- */
  var sky = document.createElement("div");
  sky.id = "nl-sky";
  sky.setAttribute("aria-hidden", "true");
  document.body.insertBefore(sky, bgfx);

  /* ---------- Icônes 3D stylisées (viewBox 64) ---------- */
  function etoile(cx, cy, R, r, n) {
    var d = "";
    for (var i = 0; i < n * 2; i++) {
      var a = Math.PI / n * i - Math.PI / 2, k = i % 2 ? r : R;
      d += (i ? "L" : "M") + (cx + Math.cos(a) * k).toFixed(1) + " " + (cy + Math.sin(a) * k).toFixed(1);
    }
    return d + "Z";
  }
  var ICONES = {
    sapin: '<path d="M32 6 L49 28 H42 L55 46 H9 L22 28 H15 Z" fill="#1E9E4E"/><path d="M32 6 L49 28 H42 L55 46 H32 Z" fill="#0B6B35" opacity=".4"/><rect x="28" y="46" width="8" height="8" rx="1.5" fill="#7A4B22"/>' +
      '<circle cx="25" cy="36" r="3" fill="#E0262F"/><circle cx="40" cy="38" r="3" fill="#FFC83D"/><circle cx="32" cy="22" r="2.6" fill="#FFC83D"/><path d="' + etoile(32, 5, 5, 2, 5) + '" fill="#FFC83D"/>',
    cadeau: '<rect x="12" y="28" width="40" height="26" rx="3" fill="#E0262F"/><rect x="8" y="20" width="48" height="10" rx="3" fill="#B81C25"/><rect x="29" y="20" width="6" height="34" fill="#FFC83D"/>' +
      '<path d="M32 20 C22 4 12 12 26 20 Z M32 20 C42 4 52 12 38 20 Z" fill="#FFC83D"/><rect x="14" y="31" width="5" height="19" rx="2.5" fill="#fff" opacity=".2"/>',
    pere: '<path d="M13 26 C18 6 44 2 52 20 L42 24 C36 14 26 14 22 26 Z" fill="#E0262F"/><circle cx="52" cy="20" r="4" fill="#fff"/><rect x="10" y="23" width="44" height="8" rx="4" fill="#fff"/>' +
      '<circle cx="32" cy="38" r="12" fill="#FBD3B0"/><path d="M19 40 Q32 64 45 40 Q42 52 32 54 Q22 52 19 40Z" fill="#fff"/><circle cx="32" cy="41" r="3" fill="#E0262F"/><circle cx="27" cy="36" r="1.6" fill="#2B2B2B"/><circle cx="37" cy="36" r="1.6" fill="#2B2B2B"/>',
    renne: '<path d="M22 20 L14 6 M20 12 L12 12 M42 20 L50 6 M44 12 L52 12" stroke="#7A4B22" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="32" cy="36" rx="20" ry="18" fill="#C98A4B"/><ellipse cx="32" cy="44" rx="9" ry="7" fill="#F3D6B0"/><circle cx="32" cy="43" r="4" fill="#E0262F"/><circle cx="31" cy="42" r="1.2" fill="#fff" opacity=".8"/><circle cx="24" cy="32" r="2" fill="#2B2B2B"/><circle cx="40" cy="32" r="2" fill="#2B2B2B"/>',
    pain: '<circle cx="32" cy="16" r="10" fill="#B8703A"/><path d="M22 26 H42 Q48 32 46 40 L50 54 H38 L32 46 L26 54 H14 L18 40 Q16 32 22 26Z" fill="#B8703A"/>' +
      '<circle cx="28" cy="34" r="1.6" fill="#fff"/><circle cx="36" cy="34" r="1.6" fill="#fff"/><circle cx="32" cy="42" r="1.6" fill="#fff"/><circle cx="27" cy="14" r="1.6" fill="#3A2412"/><circle cx="37" cy="14" r="1.6" fill="#3A2412"/><path d="M27 19 Q32 23 37 19" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M32 22 L27 19 L27 25Z M32 22 L37 19 L37 25Z" fill="#E0262F"/>',
    lutin: '<path d="M14 30 L32 2 L50 30 Z" fill="#1E9E4E"/><rect x="12" y="28" width="40" height="7" rx="3.5" fill="#E0262F"/><circle cx="32" cy="3" r="4" fill="#fff"/>' +
      '<path d="M18 40 L7 35 L19 46 Z M46 40 L57 35 L45 46 Z" fill="#FBD3B0"/><circle cx="32" cy="42" r="12" fill="#FBD3B0"/><circle cx="27" cy="41" r="1.6" fill="#2B2B2B"/><circle cx="37" cy="41" r="1.6" fill="#2B2B2B"/><path d="M27 47 Q32 51 37 47" stroke="#E0262F" stroke-width="2" fill="none" stroke-linecap="round"/>',
    canne: '<path d="M24 58 V26 Q24 10 38 10 Q50 10 48 22" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M24 58 V26 Q24 10 38 10 Q50 10 48 22" fill="none" stroke="#E0262F" stroke-width="10" stroke-dasharray="5 5"/>',
    flocon: '<g stroke="#7FD0F5" stroke-width="3.6" stroke-linecap="round"><path d="M32 6 V58 M9.4 19 L54.6 45 M9.4 45 L54.6 19"/><path d="M32 14 l-6 -5 M32 14 l6 -5 M32 50 l-6 5 M32 50 l6 5 M16.4 22 l-7 -1 M16.4 22 l-2 6 M47.6 42 l7 1 M47.6 42 l2 -6 M16.4 42 l-7 1 M16.4 42 l-2 -6 M47.6 22 l7 -1 M47.6 22 l2 6"/></g><circle cx="32" cy="32" r="4" fill="#E9F9FF"/>',
    etoile: '<path d="' + etoile(32, 34, 28, 12, 5) + '" fill="#FFC83D"/><path d="' + etoile(32, 34, 28, 12, 5) + '" fill="#fff" opacity=".25" transform="translate(-2 -2) scale(.6) translate(20 20)"/>',
    boule: '<path d="M32 10 V4" stroke="#FFC83D" stroke-width="2"/><rect x="27" y="9" width="10" height="7" rx="2" fill="#FFC83D"/><circle cx="32" cy="36" r="20" fill="#E0262F"/><ellipse cx="25" cy="28" rx="6" ry="4" fill="#fff" opacity=".45" transform="rotate(-25 25 28)"/>'
  };
  var CLES_NOEL = Object.keys(ICONES);
  var LABELS_JAN = ["Bonne Année", "Happy New Year", "¡Feliz Año!", "Frohes Neues", "Felice Anno", "Gelukkig Nieuwjaar", "Feliz Ano Novo", "Gott nytt år", "Hyvää vuotta", "Godt nytår", "С Новым годом", "新年快乐", "あけましておめでとう", "سنة سعيدة", "2027"];

  function svg(inner) { return '<svg viewBox="0 0 64 64" aria-hidden="true">' + inner + "</svg>"; }

  /* ---------- Sapin 3D (Noël) ---------- */
  function hw(y) { // demi-largeur approximative de la silhouette du sapin à la hauteur y
    var pts = [[40, 0], [150, 68], [262, 104], [378, 142]];
    for (var i = 1; i < pts.length; i++) if (y <= pts[i][0]) { var t = (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]); }
    return 142;
  }
  function boite(x, y, w, h, d, c, rib) {
    var s = "";
    s += '<polygon points="' + x + "," + y + " " + (x + d) + "," + (y - d * .6) + " " + (x + w + d) + "," + (y - d * .6) + " " + (x + w) + "," + y + '" fill="' + c.l + '"/>';
    s += '<polygon points="' + (x + w) + "," + y + " " + (x + w + d) + "," + (y - d * .6) + " " + (x + w + d) + "," + (y + h - d * .6) + " " + (x + w) + "," + (y + h) + '" fill="' + c.d + '"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c.c + '"/>';
    s += '<rect x="' + (x + w / 2 - 4) + '" y="' + y + '" width="8" height="' + h + '" fill="' + rib + '"/>';
    s += '<rect x="' + x + '" y="' + (y + h * .42) + '" width="' + w + '" height="7" fill="' + rib + '"/>';
    s += '<ellipse cx="' + (x + w / 2 - 9) + '" cy="' + (y - 5) + '" rx="8" ry="5.5" fill="' + rib + '" transform="rotate(-20 ' + (x + w / 2 - 9) + " " + (y - 5) + ')"/>';
    s += '<ellipse cx="' + (x + w / 2 + 9) + '" cy="' + (y - 5) + '" rx="8" ry="5.5" fill="' + rib + '" transform="rotate(20 ' + (x + w / 2 + 9) + " " + (y - 5) + ')"/>';
    return s;
  }
  function svgSapin() {
    var R = { c: "#E0262F", d: "#9E1620", l: "#FF5A5F" }, V = { c: "#1E9E4E", d: "#0F6B33", l: "#3CC978" }, O = { c: "#FFC83D", d: "#B57A00", l: "#FFE38A" };
    var s = '<svg viewBox="0 0 400 460" aria-hidden="true"><defs>' +
      '<linearGradient id="nlV" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2FBF6B"/><stop offset=".55" stop-color="#138146"/><stop offset="1" stop-color="#0A5A2C"/></linearGradient>' +
      '<radialGradient id="nlR" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".2" stop-color="#FF6B6B"/><stop offset=".6" stop-color="#E0262F"/><stop offset="1" stop-color="#7A0F17"/></radialGradient>' +
      '<radialGradient id="nlO" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".25" stop-color="#FFE68A"/><stop offset=".65" stop-color="#FFC83D"/><stop offset="1" stop-color="#B57A00"/></radialGradient>' +
      '<radialGradient id="nlH" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".75"/><stop offset="1" stop-color="#FFE9A0" stop-opacity="0"/></radialGradient>' +
      '<filter id="nlG" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    s += '<circle class="nl-halo" cx="200" cy="230" r="200" fill="url(#nlH)"/>';
    s += '<ellipse cx="200" cy="440" rx="150" ry="13" fill="#0B3B20" opacity=".22"/>';
    s += '<rect x="186" y="372" width="28" height="30" rx="4" fill="#6B3E1B"/>';
    s += '<path d="M200 40 L268 150 Q236 158 200 150 Q164 158 132 150 Z" fill="url(#nlV)"/><path d="M200 118 L304 262 Q262 272 200 262 Q138 272 96 262 Z" fill="url(#nlV)"/><path d="M200 220 L342 376 Q276 388 200 378 Q124 388 58 376 Z" fill="url(#nlV)"/>';
    s += '<path d="M200 40 L268 150 Q236 158 200 150 Z" fill="#063D1E" opacity=".35"/><path d="M200 118 L304 262 Q262 272 200 262 Z" fill="#063D1E" opacity=".35"/><path d="M200 220 L342 376 Q276 388 200 378 Z" fill="#063D1E" opacity=".35"/>';
    // guirlande et lumières clignotantes
    var pts = [];
    for (var k = 0; k < 14; k++) {
      var y = 74 + k * 22, side = k % 2 ? 1 : -1, x = 200 + side * hw(y) * .78;
      pts.push([x, y]);
    }
    s += '<polyline points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1]; }).join(" ") + '" fill="none" stroke="#FFD870" stroke-width="2.6" stroke-linejoin="round" opacity=".9"/>';
    pts.forEach(function (p, i) {
      s += '<circle class="nl-l" style="--i:' + i + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1] + '" r="5.2" fill="' + (i % 3 === 0 ? "#FFF6C2" : i % 3 === 1 ? "#FF4D5A" : "#FFC83D") + '" filter="url(#nlG)"/>';
    });
    // boules 3D
    var boules = [[168, 112, "R"], [232, 126, "O"], [150, 204, "O"], [252, 200, "R"], [118, 262, "R"], [200, 240, "O"], [282, 252, "R"], [98, 336, "O"], [182, 306, "R"], [226, 336, "O"], [302, 344, "O"], [146, 356, "R"], [262, 372, "R"]];
    boules.forEach(function (b) { s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="7.5" fill="url(#' + (b[2] === "R" ? "nlR" : "nlO") + ')"/>'; });
    // étoiles scintillantes
    [[88, 150], [330, 150], [60, 300], [350, 300], [110, 60], [292, 70]].forEach(function (p, i) {
      s += '<path class="nl-tw" style="--i:' + i + '" d="M' + p[0] + " " + (p[1] - 9) + " L" + (p[0] + 2.5) + " " + (p[1] - 2.5) + " L" + (p[0] + 9) + " " + p[1] + " L" + (p[0] + 2.5) + " " + (p[1] + 2.5) + " L" + p[0] + " " + (p[1] + 9) + " L" + (p[0] - 2.5) + " " + (p[1] + 2.5) + " L" + (p[0] - 9) + " " + p[1] + " L" + (p[0] - 2.5) + " " + (p[1] - 2.5) + 'Z" fill="#FFF6C2"/>';
    });
    // étoile du sommet
    s += '<path class="nl-star" d="' + etoile(200, 26, 24, 10, 5) + '" fill="url(#nlO)" filter="url(#nlG)"/>';
    // cadeaux 3D au pied du sapin
    s += boite(60, 372, 74, 56, 14, R, O.c);
    s += boite(250, 380, 66, 48, 12, V, R.c);
    s += boite(166, 406, 52, 36, 10, O, R.c);
    s += "</svg>";
    return '<div class="nl-tree">' + s + "</div>";
  }

  /* ---------- Traîneau du Père Noël et ses rennes (Noël) ---------- */
  function renne(x, i) {
    return '<g class="nl-rn" style="--i:' + i + '">' +
      '<path d="M' + (x + 20) + " 56 l-4 -12 l-5 -2 M" + (x + 22) + " 56 l2 -12 l6 -2 M" + (x + 23) + " 57 l-1 -6" + '" stroke="#5C3A1C" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
      '<path d="M' + (x - 14) + " 88 l-6 14 M" + (x - 4) + " 88 l-2 14 M" + (x + 10) + " 88 l4 14" + '" stroke="#8A5526" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="' + x + '" cy="78" rx="24" ry="12" fill="#B9793F"/>' +
      '<circle cx="' + (x + 24) + '" cy="62" r="9" fill="#C98A4B"/><circle cx="' + (x + 31) + '" cy="63" r="2.6" fill="#E0262F"/>' +
      "</g>";
  }
  function svgTraineau() {
    var s = '<svg viewBox="0 0 340 170" aria-hidden="true">';
    [178, 222, 266, 310].forEach(function (x, i) {
      s += '<path d="M134 102 L' + (x + 22) + " 66" + '" stroke="rgba(90,50,20,.45)" stroke-width="1.4"/>';
      s += renne(x, i);
    });
    s += '<path d="M16 104 H132 Q140 104 136 116 Q126 132 98 132 H50 Q26 132 18 116 Z" fill="#E0262F"/>';
    s += '<path d="M16 104 H132" stroke="#FFC83D" stroke-width="4" stroke-linecap="round"/>';
    s += '<path d="M6 140 Q80 152 150 138" stroke="#FFC83D" stroke-width="5" fill="none" stroke-linecap="round"/>';
    s += '<rect x="36" y="94" width="22" height="16" rx="2" fill="#1E9E4E"/><rect x="45" y="94" width="4" height="16" fill="#FFC83D"/>';
    s += '<ellipse cx="74" cy="84" rx="22" ry="20" fill="#E0262F"/><rect x="56" y="92" width="36" height="5" rx="2" fill="#3A2412"/>';
    s += '<circle cx="90" cy="60" r="13" fill="#FBD3B0"/><path d="M77 54 Q84 30 108 44 L100 52 Z" fill="#E0262F"/><circle cx="106" cy="44" r="4" fill="#fff"/>';
    s += '<rect x="75" y="50" width="30" height="6" rx="3" fill="#fff"/><path d="M80 62 Q92 84 104 62 Q98 74 92 75 Q86 74 80 62Z" fill="#fff"/><circle cx="95" cy="57" r="1.6" fill="#2B2B2B"/><circle cx="90" cy="68" r="1.4" fill="#E0262F"/>';
    s += "</svg>";
    return s;
  }
  function creerCouche() {
    if (NOEL) {
      sky.innerHTML = '<div id="nl-sled">' + svgTraineau() + "</div>";
      bgfx.appendChild(hero(svgSapin()));
    } else {
      sky.innerHTML = '<canvas id="nl-fw"></canvas>';
      bgfx.appendChild(hero(texteNouvelAn()));
    }
  }
  function hero(inner) {
    var d = document.createElement("div");
    d.id = "nl-hero";
    if (!NOEL) d.className = "nl-hero-an";
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = inner;
    return d;
  }

  /* ---------- 2027 et Happy New Year DOTR en 3D (Nouvel An) ---------- */
  function stack(t) {
    var s = "";
    for (var d = 8; d >= 1; d--) s += '<span class="nl-ext" style="--d:' + d + '">' + t + "</span>";
    return '<span class="nl-stack" aria-hidden="true">' + s + '<span class="nl-front">' + t + "</span></span>";
  }
  function texteNouvelAn() {
    return '<div class="nl-scene" role="img" aria-label="2027, Happy New Year DOTR">' +
      '<div class="nl-3d nl-year">' + stack("2027") + "</div>" +
      '<div class="nl-3d nl-hny">' + stack("Happy New Year DOTR") + "</div>" +
      "</div>";
  }

  /* ---------- Bulles d'air dynamiques : motifs 3D (Noël) ou messages (Nouvel An) ---------- */
  function decorerBulles() {
    var bulles = document.querySelectorAll(".hero-bubbles i");
    Array.prototype.forEach.call(bulles, function (b) {
      if (b.querySelector(".nl-coin")) return;
      var taille = parseFloat(b.style.width) || 40;
      if (taille < 30) return;
      var c = document.createElement("span");
      c.className = "nl-coin";
      c.style.setProperty("--t", rnd(5, 9).toFixed(1) + "s");
      c.style.setProperty("--dl", (-rnd(0, 8)).toFixed(1) + "s");
      if (NOEL) {
        var a = pick(CLES_NOEL), z = pick(CLES_NOEL);
        while (z === a) z = pick(CLES_NOEL);
        c.innerHTML = '<span class="nl-face">' + svg(ICONES[a]) + '</span><span class="nl-face nl-b">' + svg(ICONES[z]) + "</span>";
      } else {
        var front = pick(LABELS_JAN), back = pick(["2027", "DOTR", "✦"]);
        var fs = Math.round(taille * (front.length > 12 ? .12 : .17));
        c.innerHTML = '<span class="nl-face"><span class="nl-lbl" style="font-size:' + fs + 'px">' + front + '</span></span><span class="nl-face nl-b"><span class="nl-lbl" style="font-size:' + fs + 'px">' + back + "</span></span>";
      }
      b.appendChild(c);
    });
  }

  /* ---------- Traîneau : passes alternées, courbe douce, 20 s par passage, 5 s de pause ---------- */
  function traineau() {
    var el = document.getElementById("nl-sled");
    if (!el || reduce) return;
    var etat = "attente", fin = performance.now() + 1200, debut = 0, duree = 20000, passe = 0, p0, c, p2;
    function nouvelle(now) {
      var W = innerWidth, H = innerHeight, gauche = passe % 2 === 0; // passe 1 : gauche→droite, bas→haut ; passe 2 : droite→gauche, haut→bas
      var yA = gauche ? rnd(.6, .9) : rnd(.1, .4), yB = gauche ? rnd(.1, .4) : rnd(.6, .9);
      p0 = gauche ? [-.08 * W, yA * H] : [1.08 * W, yA * H];
      p2 = gauche ? [1.08 * W, yB * H] : [-.08 * W, yB * H];
      c = [W * rnd(.4, .6), (yA + yB) / 2 * H + rnd(-.2, .2) * H];
      debut = now; duree = rnd(19000, 21000); passe++;
    }
    function frame(now) {
      requestAnimationFrame(frame);
      if (etat === "attente") {
        if (now >= fin) { nouvelle(now); etat = "vol"; }
        else { el.style.opacity = 0; return; }
      }
      var t = (now - debut) / duree;
      if (t >= 1) { el.style.opacity = 0; etat = "attente"; fin = now + 5000; return; }
      var a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t;
      var x = a * p0[0] + b * c[0] + d * p2[0], y = a * p0[1] + b * c[1] + d * p2[1];
      var dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p2[0] - c[0]), dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p2[1] - c[1]);
      var ang = Math.atan2(dy, dx) * 180 / Math.PI, f = 1;
      if (dx < 0) { ang -= 180; f = -1; }
      el.style.opacity = Math.min(1, t * 8, (1 - t) * 8).toFixed(2);
      el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(-50%,-50%) rotate(" + ang.toFixed(2) + "deg) scale(" + f + ",1)";
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Feux d'artifice de toutes les couleurs (Nouvel An) ---------- */
  function feux() {
    var cv = document.getElementById("nl-fw");
    if (!cv || !cv.getContext || reduce) return;
    var g = cv.getContext("2d"), parts = [], W = 0, H = 0, DPR = 1, prochain = 0;
    var mobile = window.matchMedia && matchMedia("(max-width: 860px)").matches;
    var COULEURS = ["#FFD21F", "#FFB800", "#1F6BFF", "#00D4FF", "#FF2D55", "#2BD96B", "#FF3DF2", "#FFFFFF", "#FF8A00", "#7C4DFF"];
    function taille() { DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); }
    taille();
    window.addEventListener("resize", taille);
    function feu() {
      var x = rnd(.12, .88) * W, y = rnd(.12, .5) * H, c1 = pick(COULEURS), c2 = pick(COULEURS), n = mobile ? 50 : 90;
      if (parts.length > 1400) return;
      for (var i = 0; i < n; i++) {
        var a = rnd(0, Math.PI * 2), v = rnd(2.2, 6.6);
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rnd(60, 100), col: i % 4 === 0 ? c2 : c1, r: rnd(1.6, 3.2) });
      }
    }
    function frame(now) {
      requestAnimationFrame(frame);
      if (now > prochain) { feu(); prochain = now + rnd(800, 1800); }
      g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life++;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        p.vx *= .985; p.vy = p.vy * .985 + .045; p.x += p.vx; p.y += p.vy;
        var k = 1 - p.life / p.max;
        g.fillStyle = p.col;
        g.globalAlpha = .16 * k; g.beginPath(); g.arc(p.x, p.y, p.r * 3.2, 0, 6.283); g.fill();
        g.globalAlpha = k; g.beginPath(); g.arc(p.x, p.y, p.r * (.4 + .6 * k), 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Fondu au scroll : même logique que la Terre (1 → 0,5 sur 520 px, 0,38 hors accueil) ---------- */
  function fond() {
    var h = document.body.classList.contains("home"), y = window.scrollY || 0;
    var o = h ? 1 - .5 * Math.min(1, y / 520) : .38;
    sky.style.opacity = o.toFixed(3);
  }

  /* ---------- Démarrage ---------- */
  creerCouche();
  decorerBulles();
  if (NOEL) traineau(); else feux();
  fond();
  window.addEventListener("scroll", fond, { passive: true });
  window.addEventListener("hashchange", fond);
  // Les bulles peuvent être recréées par l'application : on décore les nouvelles
  new MutationObserver(decorerBulles).observe(bgfx, { childList: true, subtree: true });
})();
