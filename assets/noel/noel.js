/* Calque saisonnier DOTR.
   - Noël : sapin 3D facetté animé dans le rond rouge, traîneau et rennes qui traversent l'écran, motifs 3D dans les bulles d'air.
   - Nouvel An : HAPPY NEW YEAR / 2027 en or à paillettes avec extrusion 3D bleue, feux d'artifice, « Bonne année » dans les bulles.
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

  var sky = document.createElement("div");
  sky.id = "nl-sky";
  sky.setAttribute("aria-hidden", "true");
  document.body.insertBefore(sky, bgfx);

  /* ---------- Dégradés et filtres partagés ---------- */
  function lg(id, stops, vert) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vert === false ? 1 : 0) + '" y2="' + (vert === false ? 0 : 1) + '">' +
      stops.map(function (s, i) { return '<stop offset="' + (i / (stops.length - 1)).toFixed(2) + '" stop-color="' + s + '"/>'; }).join("") + "</linearGradient>";
  }
  function rg(id, main, light, dark) {
    return '<radialGradient id="' + id + '" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".16" stop-color="' + light + '"/><stop offset=".55" stop-color="' + main + '"/><stop offset="1" stop-color="' + dark + '"/></radialGradient>';
  }
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    lg("nlg-red", ["#FF5F6D", "#D0182B", "#8E0F1E"]) + lg("nlg-gold", ["#FFF3B0", "#FFC93C", "#D98A00"]) +
    lg("nlg-green", ["#3FD07E", "#12874B", "#0A5A32"]) + lg("nlg-copper", ["#F4B987", "#C97B3E", "#8F4D22"]) +
    lg("nlg-skin", ["#FFE7D2", "#F5B993"]) + lg("nlg-white", ["#FFFFFF", "#D9E6F5"]) + lg("nlg-ice", ["#F2FBFF", "#9ADBFF", "#4DA3F0"]) +
    lg("nlg-trail", ["rgba(255,214,90,0)", "rgba(255,214,90,.55)", "rgba(255,244,190,.95)"], false) +
    '<radialGradient id="nlg-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".7"/><stop offset="1" stop-color="#FFE9A0" stop-opacity="0"/></radialGradient>' +
    rg("nlg-sR", "#E0262F", "#FF7B84", "#6E0A18") + rg("nlg-sG", "#FFC83D", "#FFF0A0", "#A86400") + rg("nlg-sI", "#5DB6FF", "#D6F0FF", "#1F5BB5") + rg("nlg-sE", "#1FA85F", "#8CF0B8", "#0A5A32") +
    '<filter id="nlg-neon" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="a"/><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feGaussianBlur in="SourceGraphic" stdDeviation="11" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="b"/><feMergeNode in="a"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="nlg-spec" cx=".34" cy=".28" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient><filter id="nlg-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    "</defs></svg>";
  sky.innerHTML = DEFS;

  /* ---------- Briques géométriques ---------- */
  function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }
  function etoileFacettes(cx, cy, R, r, n, c1, c2) { // étoile à facettes alternées (effet 3D)
    var o = [], s = "";
    for (var i = 0; i < n * 2; i++) { var a = Math.PI / n * i - Math.PI / 2, k = i % 2 ? r : R; o.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]); }
    for (var j = 0; j < o.length; j++) s += '<polygon points="' + pts([[cx, cy], o[j], o[(j + 1) % o.length]]) + '" fill="' + (j % 2 ? c1 : c2) + '"/>';
    return s;
  }
  function boule(x, y, r, g) { // boule brillante avec culot doré
    return '<rect x="' + (x - r * .32) + '" y="' + (y - r - r * .42) + '" width="' + (r * .64) + '" height="' + (r * .5) + '" rx="1" fill="url(#nlg-gold)"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#' + g + ')"/><ellipse cx="' + (x - r * .32) + '" cy="' + (y - r * .38) + '" rx="' + (r * .3) + '" ry="' + (r * .18) + '" fill="#fff" opacity=".75" transform="rotate(-30 ' + (x - r * .32) + " " + (y - r * .38) + ')"/>';
  }
  var PAL = {
    rouge: { f: "#E0262F", t: "#FF6B72", s: "#9E1620", r: "#FFD35A", rs: "#D99A00" },
    vert: { f: "#16A25A", t: "#47D98B", s: "#0B6B3A", r: "#F2F6FF", rs: "#B7C6DC" },
    glace: { f: "#EAF4FF", t: "#FFFFFF", s: "#A9C4E4", r: "#E0262F", rs: "#9E1620" },
    or: { f: "#FFC83D", t: "#FFE48A", s: "#C98A00", r: "#16A25A", rs: "#0B6B3A" }
  };
  function cadeau(x, y, w, h, d, c) { // coffret 3D en perspective avec ruban satiné et nœud
    var k = d * .5, rx = x + w / 2 - 5, bx = x + w / 2 + d / 2, by = y - k - 1, s = "";
    s += '<polygon points="' + pts([[x, y], [x + d, y - k], [x + w + d, y - k], [x + w, y]]) + '" fill="' + c.t + '"/>';
    s += '<polygon points="' + pts([[x + w, y], [x + w + d, y - k], [x + w + d, y + h - k], [x + w, y + h]]) + '" fill="' + c.s + '"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c.f + '"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="' + (w * .2) + '" height="' + h + '" fill="#fff" opacity=".2"/>';
    s += '<rect x="' + rx + '" y="' + y + '" width="10" height="' + h + '" fill="' + c.r + '"/>';
    s += '<polygon points="' + pts([[rx, y], [rx + d, y - k], [rx + 10 + d, y - k], [rx + 10, y]]) + '" fill="' + c.rs + '"/>';
    s += '<rect x="' + (x + w) + '" y="' + (y + h * .42) + '" width="1" height="1" fill="none"/>';
    s += '<ellipse cx="' + (bx - 9) + '" cy="' + (by - 5) + '" rx="10" ry="5.5" fill="' + c.r + '" stroke="' + c.rs + '" stroke-width="1.2" transform="rotate(-24 ' + (bx - 9) + " " + (by - 5) + ')"/>';
    s += '<ellipse cx="' + (bx + 9) + '" cy="' + (by - 5) + '" rx="10" ry="5.5" fill="' + c.r + '" stroke="' + c.rs + '" stroke-width="1.2" transform="rotate(24 ' + (bx + 9) + " " + (by - 5) + ')"/>';
    s += '<circle cx="' + bx + '" cy="' + (by - 2) + '" r="3.8" fill="' + c.rs + '"/>';
    return s;
  }
  function facette(A, L, R, C, cols) { // cône à facettes
    var ML = [(L[0] + C[0]) / 2, (L[1] + C[1]) / 2 - 2], MR = [(R[0] + C[0]) / 2, (R[1] + C[1]) / 2 - 2];
    return '<polygon points="' + pts([A, L, ML]) + '" fill="' + cols[0] + '"/><polygon points="' + pts([A, ML, C]) + '" fill="' + cols[1] + '"/>' +
      '<polygon points="' + pts([A, C, MR]) + '" fill="' + cols[2] + '"/><polygon points="' + pts([A, MR, R]) + '" fill="' + cols[3] + '"/>';
  }
  var VERTS = ["#34D17F", "#1FB067", "#0F8349", "#0A6338"];

  /* ---------- Icônes 3D pour les bulles (viewBox 64) ---------- */
  var ICONES = {
    sapin: function () {
      return facette([32, 30], [8, 54], [56, 54], [32, 58], VERTS) + facette([32, 18], [14, 40], [50, 40], [32, 43], VERTS) + facette([32, 8], [20, 26], [44, 26], [32, 28], VERTS) +
        '<rect x="29" y="56" width="6" height="6" rx="1" fill="#8A5A2B"/>' + boule(22, 47, 2.6, "nlg-sR") + boule(41, 49, 2.6, "nlg-sG") + boule(30, 33, 2.4, "nlg-sI") + boule(38, 20, 2.2, "nlg-sR") +
        etoileFacettes(32, 6, 6, 2.6, 5, "#FFE680", "#FFC02A");
    },
    cadeau: function () { var p = pick(Object.keys(PAL)); return cadeau(9, 28, 34, 27, 12, PAL[p]); },
    pere: function () {
      return '<path d="M13 30 C12 10 42 4 51 23 L47 31 L15 31Z" fill="url(#nlg-red)"/><circle cx="51" cy="22" r="5.5" fill="url(#nlg-white)"/>' +
        '<ellipse cx="32" cy="42" rx="12" ry="8" fill="url(#nlg-skin)"/>' +
        '<path d="M15 46 C14 60 24 63 32 63 C40 63 50 60 49 46 C44 53 20 53 15 46Z" fill="url(#nlg-white)"/>' +
        '<path d="M19 45 C24 38 30 42 32 45 C34 42 40 38 45 45 C40 51 24 51 19 45Z" fill="url(#nlg-white)"/>' +
        '<rect x="10" y="29" width="44" height="9" rx="4.5" fill="url(#nlg-white)"/><circle cx="32" cy="44" r="3" fill="#F26B6B"/>' +
        '<circle cx="26" cy="40" r="1.5" fill="#2B2B2B"/><circle cx="38" cy="40" r="1.5" fill="#2B2B2B"/>';
    },
    renne: function () {
      return '<path d="M23 17 C17 12 15 8 14 3 M19 11 L11 12 M18 8 L13 5 M41 17 C47 12 49 8 50 3 M45 11 L53 12 M46 8 L51 5" stroke="#F1D9A8" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
        '<ellipse cx="16" cy="25" rx="6" ry="4" fill="#A8612E" transform="rotate(-30 16 25)"/><ellipse cx="48" cy="25" rx="6" ry="4" fill="#A8612E" transform="rotate(30 48 25)"/>' +
        '<path d="M20 22 C20 14 44 14 44 22 C46 36 40 52 32 56 C24 52 18 36 20 22Z" fill="url(#nlg-copper)"/>' +
        '<ellipse cx="32" cy="47" rx="9" ry="7" fill="#F6DDBE"/><circle cx="26" cy="30" r="2" fill="#2B2B2B"/><circle cx="38" cy="30" r="2" fill="#2B2B2B"/>' +
        '<circle cx="32" cy="48" r="4.6" fill="url(#nlg-sR)"/><circle cx="32" cy="48" r="7" fill="#FF4D5A" opacity=".25"/>';
    },
    pain: function () {
      return '<path d="M32 6 a9 9 0 1 0 .01 0Z M22 25 L10 23 C5 22 4 31 10 32 L20 34 L16 52 C15 57 20 59 23 55 L32 46 L41 55 C44 59 49 57 48 52 L44 34 L54 32 C60 31 59 22 54 23 L42 25 Z" fill="url(#nlg-copper)"/>' +
        '<path d="M26 14 a1 1 0 1 0 .01 0 M38 14 a1 1 0 1 0 .01 0" stroke="#FFF" stroke-width="2.2" stroke-linecap="round"/><path d="M27 18 Q32 22 37 18" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<polygon points="32,25 25,21 25,29" fill="#E0262F"/><polygon points="32,25 39,21 39,29" fill="#E0262F"/><circle cx="32" cy="34" r="2.6" fill="#16A25A"/><circle cx="32" cy="42" r="2.6" fill="#E0262F"/>' +
        '<path d="M12 34 L20 35 M52 34 L44 35 M18 52 L22 50 M46 52 L42 50" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    },
    lutin: function () {
      return '<path d="M11 31 C16 16 30 8 36 4 C36 14 46 22 53 31Z" fill="url(#nlg-green)"/><rect x="9" y="29" width="46" height="8" rx="4" fill="url(#nlg-red)"/><circle cx="36" cy="5" r="4.5" fill="url(#nlg-sG)"/>' +
        '<path d="M15 42 L3 36 L16 48Z M49 42 L61 36 L48 48Z" fill="url(#nlg-skin)"/><circle cx="32" cy="44" r="14" fill="url(#nlg-skin)"/>' +
        '<circle cx="27" cy="42" r="1.7" fill="#2B2B2B"/><circle cx="37" cy="42" r="1.7" fill="#2B2B2B"/><circle cx="23" cy="48" r="3" fill="#FF9A9A" opacity=".6"/><circle cx="41" cy="48" r="3" fill="#FF9A9A" opacity=".6"/><path d="M27 49 Q32 54 37 49" stroke="#C0392B" stroke-width="2" fill="none" stroke-linecap="round"/>';
    },
    canne: function () {
      var d = "M22 59 V24 C22 10 30 6 38 6 C47 6 51 12 50 20";
      return '<path d="' + d + '" fill="none" stroke="url(#nlg-white)" stroke-width="12" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#E0262F" stroke-width="12" stroke-dasharray="6 7"/>' +
        '<path d="M18 56 V26" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>';
    },
    flocon: function () {
      return '<g stroke="#8FD6FF" stroke-width="4" stroke-linecap="round" filter="url(#nlg-glow)"><path d="M32 5 V59 M8.6 18.5 L55.4 45.5 M8.6 45.5 L55.4 18.5"/><path d="M32 13 l-6 -5 M32 13 l6 -5 M32 51 l-6 5 M32 51 l6 5 M15.5 22 l-7 -1 M15.5 22 l-2 6 M48.5 42 l7 1 M48.5 42 l2 -6 M15.5 42 l-7 1 M15.5 42 l-2 -6 M48.5 22 l7 -1 M48.5 22 l2 6"/></g><circle cx="32" cy="32" r="5" fill="#fff"/>';
    },
    etoile: function () { return etoileFacettes(32, 34, 28, 12, 5, "#FFE680", "#FFB81F"); },
    boule: function () { return boule(32, 38, 21, pick(["nlg-sR", "nlg-sG", "nlg-sI", "nlg-sE"])) + '<path d="M13 40 Q32 52 51 40" stroke="#FFD870" stroke-width="2.4" fill="none" opacity=".9"/>'; },
    cloche: function () {
      return '<path d="M32 8 C19 8 16 21 16 33 C16 43 12 47 9 51 H55 C52 47 48 43 48 33 C48 21 45 8 32 8Z" fill="url(#nlg-gold)"/><path d="M22 14 C18 20 18 30 18 38" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>' +
        '<circle cx="32" cy="55" r="5" fill="url(#nlg-sG)"/><path d="M32 8 C24 -2 16 6 26 8 M32 8 C40 -2 48 6 38 8" stroke="#E0262F" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    },
    houx: function () {
      return '<path d="M32 38 C20 20 8 22 6 30 C12 30 12 38 20 40 C22 46 28 44 32 38Z" fill="url(#nlg-green)"/><path d="M32 38 C44 20 56 22 58 30 C52 30 52 38 44 40 C42 46 36 44 32 38Z" fill="url(#nlg-green)"/>' +
        '<circle cx="26" cy="46" r="7" fill="url(#nlg-sR)"/><circle cx="38" cy="46" r="7" fill="url(#nlg-sR)"/><circle cx="32" cy="38" r="7" fill="url(#nlg-sR)"/>';
    }
  };
  var CLES_NOEL = Object.keys(ICONES);
  var LABELS_JAN = [["Bonne", "Année"], ["Happy", "New Year"], ["¡Feliz", "Año!"], ["Frohes", "Neues"], ["Felice", "Anno"], ["Gelukkig", "Nieuwjaar"], ["Feliz", "Ano Novo"], ["Gott", "nytt år"], ["Hyvää", "vuotta"], ["Godt", "nytår"], ["С Новым", "годом"], ["新年", "快乐"], ["あけまして", "おめでとう"], ["سنة", "سعيدة"], ["Happy", "2027"], ["Bonne", "2027"], ["2027"]];

  function svg(inner) { return '<svg viewBox="0 0 64 64" aria-hidden="true">' + inner + "</svg>"; }

  /* ---------- Sapin 3D facetté (Noël) ---------- */
  function svgSapin() {
    var s = '<svg viewBox="0 0 400 470" aria-hidden="true">';
    s += '<circle class="nl-halo" cx="200" cy="240" r="205" fill="url(#nlg-halo)"/>';
    s += '<ellipse cx="205" cy="452" rx="165" ry="12" fill="#0B2A6E" opacity=".2"/>';
    s += '<rect x="184" y="392" width="32" height="40" rx="4" fill="#7A4B22"/><rect x="184" y="392" width="12" height="40" rx="3" fill="#A8703A"/>';
    var tiers = [{ ay: 236, y: 402, w: 160 }, { ay: 168, y: 322, w: 128 }, { ay: 98, y: 238, w: 96 }, { ay: 44, y: 148, w: 64 }], lights = [], li = 0;
    tiers.forEach(function (t) {
      var L = [200 - t.w, t.y], R = [200 + t.w, t.y], C = [200, t.y + 16], ML = [200 - t.w / 2, t.y + 6], MR = [200 + t.w / 2, t.y + 6];
      s += facette([200, t.ay], L, R, C, VERTS);
      s += '<polyline points="' + pts([L, ML, C, MR, R]) + '" fill="none" stroke="#7CF0B0" stroke-opacity=".35" stroke-width="1.4"/>';
      var poly = [L, ML, C, MR, R], row = [];
      [.1, .27, .43, .57, .73, .9].forEach(function (u) {
        var f = u * 4, i = Math.min(3, Math.floor(f)), q = f - i, a = poly[i], b = poly[i + 1];
        row.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q - 6]);
      });
      lights.push(row);
    });
    // guirlandes lumineuses : arcs entre les ampoules, ampoules qui clignotent
    lights.forEach(function (row) {
      var d = "M" + row[0][0].toFixed(1) + " " + row[0][1].toFixed(1);
      for (var i = 1; i < row.length; i++) d += " Q" + ((row[i - 1][0] + row[i][0]) / 2).toFixed(1) + " " + (Math.max(row[i - 1][1], row[i][1]) + 9).toFixed(1) + " " + row[i][0].toFixed(1) + " " + row[i][1].toFixed(1);
      s += '<path d="' + d + '" fill="none" stroke="#FFE08A" stroke-width="1.8" opacity=".9" filter="url(#nlg-glow)"/><path class="nl-run" d="' + d + '" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" pathLength="100"/>';
    });
    var NEON = ["#FFF2A8", "#FF3B5C", "#FFC21A", "#2FD0FF", "#52FF9A", "#FF4DF0"], halos = "", leds = "";
    lights.forEach(function (row) {
      row.forEach(function (p) {
        var col = NEON[li % NEON.length], x = p[0].toFixed(1), y = p[1].toFixed(1);
        halos += '<circle class="nl-lh" style="--i:' + li + '" cx="' + x + '" cy="' + y + '" r="19" fill="' + col + '"/>';
        leds += '<g class="nl-l" style="--i:' + li + '"><circle cx="' + x + '" cy="' + y + '" r="5.4" fill="' + col + '" filter="url(#nlg-neon)"/><circle cx="' + x + '" cy="' + y + '" r="2.1" fill="#fff"/>' +
          '<path class="nl-fl" d="M' + x + " " + (p[1] - 11).toFixed(1) + " L" + (p[0] + 1.6).toFixed(1) + " " + (p[1] - 1.6).toFixed(1) + " L" + (p[0] + 11).toFixed(1) + " " + y + " L" + (p[0] + 1.6).toFixed(1) + " " + (p[1] + 1.6).toFixed(1) + " L" + x + " " + (p[1] + 11).toFixed(1) + " L" + (p[0] - 1.6).toFixed(1) + " " + (p[1] + 1.6).toFixed(1) + " L" + (p[0] - 11).toFixed(1) + " " + y + " L" + (p[0] - 1.6).toFixed(1) + " " + (p[1] - 1.6).toFixed(1) + 'Z" fill="#fff"/></g>';
        li++;
      });
    });
    s += '<g class="nl-halos">' + halos + "</g>" + leds;
    // reflet spéculaire doux (lumière en haut à gauche)
    s += '<ellipse cx="150" cy="170" rx="70" ry="120" fill="url(#nlg-spec)" opacity=".16" transform="rotate(-18 150 170)"/>';
    // boules brillantes
    [[172, 118, 8, "nlg-sR"], [236, 128, 7, "nlg-sG"], [150, 205, 9, "nlg-sG"], [252, 206, 9, "nlg-sR"], [200, 252, 9, "nlg-sI"], [118, 275, 9, "nlg-sR"], [284, 266, 8, "nlg-sI"], [96, 345, 10, "nlg-sG"], [186, 318, 9, "nlg-sR"], [230, 346, 9, "nlg-sG"], [306, 356, 10, "nlg-sR"], [148, 372, 8, "nlg-sI"], [262, 388, 8, "nlg-sG"]].forEach(function (b) { s += boule(b[0], b[1], b[2], b[3]); });
    // étincelles
    [[88, 150], [326, 160], [58, 300], [350, 304], [114, 62], [292, 74], [200, 30]].forEach(function (p, i) {
      s += '<path class="nl-tw" style="--i:' + i + '" d="M' + p[0] + " " + (p[1] - 10) + " L" + (p[0] + 2.6) + " " + (p[1] - 2.6) + " L" + (p[0] + 10) + " " + p[1] + " L" + (p[0] + 2.6) + " " + (p[1] + 2.6) + " L" + p[0] + " " + (p[1] + 10) + " L" + (p[0] - 2.6) + " " + (p[1] + 2.6) + " L" + (p[0] - 10) + " " + p[1] + " L" + (p[0] - 2.6) + " " + (p[1] - 2.6) + 'Z" fill="#FFF6C2"/>';
    });
    // étoile du sommet (facettes dorées, halo)
    s += '<g class="nl-star" filter="url(#nlg-glow)">' + etoileFacettes(200, 34, 27, 11.5, 5, "#FFE680", "#FFB81F") + "</g>";
    // cadeaux 3D
    s += cadeau(46, 400, 84, 58, 20, PAL.rouge) + cadeau(262, 410, 70, 48, 18, PAL.glace) + cadeau(160, 428, 54, 32, 14, PAL.or) + cadeau(112, 440, 34, 20, 9, PAL.vert);
    s += "</svg>";
    return '<div class="nl-tree">' + s + "</div>";
  }

  /* ---------- Traîneau et rennes (Noël) ---------- */
  function renne(tx, ty, i, lead) {
    var jambes = '<path d="M13 38 L3 53 L-2 53 M21 40 L12 55 L7 55 M47 40 L59 53 L64 53 M41 41 L50 55 L55 55" stroke="#7A4420" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    return '<g transform="translate(' + tx + " " + ty + ')"><g class="nl-rn" style="--i:' + i + '">' + jambes +
      '<path d="M5 33 C5 22 20 18 34 19 C46 19 54 22 56 28 C57 35 50 41 38 42 C24 43 5 43 5 33Z" fill="url(#nlg-copper)"/>' +
      '<path d="M12 37 C24 40 40 40 52 34 C50 40 40 43 28 43 C18 43 12 41 12 37Z" fill="#fff" opacity=".16"/>' +
      '<path d="M47 25 C51 15 54 10 60 8 L69 11 C72 14 69 18 64 19 C62 24 58 30 54 33Z" fill="url(#nlg-copper)"/>' +
      '<path d="M58 9 L52 3 L62 6Z" fill="#8F4D22"/><circle cx="62" cy="12" r="1.2" fill="#1B1B1B"/>' +
      '<path d="M50 23 L57 31" stroke="#FFC93C" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M60 8 C58 1 54 -3 50 -5 M57 2 C54 1 52 2 49 1 M62 6 C65 0 67 -4 71 -6 M65 0 C67 0 69 -1 71 0" stroke="#F1D9A8" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
      '<circle cx="5" cy="28" r="3.4" fill="#fff"/>' +
      (lead ? '<circle cx="70" cy="14" r="6" fill="#FF3B4A" opacity=".45" filter="url(#nlg-glow)"/><circle cx="70" cy="14" r="2.8" fill="#FF3B4A"/>' : '<circle cx="70" cy="14" r="2.2" fill="#4A2A12"/>') +
      "</g></g>";
  }
  function svgTraineau() {
    var s = '<svg viewBox="0 0 480 170" aria-hidden="true">';
    s += '<path d="M20 112 L-190 126 L-190 140 L20 138Z" fill="url(#nlg-trail)" filter="url(#nlg-glow)" opacity=".9"/>';
    // sparkles de la traînée
    [[-40, 112, 0], [-90, 130, 1], [-140, 120, 2], [-10, 146, 3], [-70, 142, 4]].forEach(function (p) { s += '<path class="nl-tw" style="--i:' + p[2] + '" d="M' + p[0] + " " + (p[1] - 6) + " L" + (p[0] + 1.6) + " " + (p[1] - 1.6) + " L" + (p[0] + 6) + " " + p[1] + " L" + (p[0] + 1.6) + " " + (p[1] + 1.6) + " L" + p[0] + " " + (p[1] + 6) + " L" + (p[0] - 1.6) + " " + (p[1] + 1.6) + " L" + (p[0] - 6) + " " + p[1] + " L" + (p[0] - 1.6) + " " + (p[1] - 1.6) + 'Z" fill="#FFF6C2"/>'; });
    // rênes
    s += '<path d="M138 112 C170 104 196 108 222 100 M138 114 C190 112 250 104 300 96 M138 116 C210 118 290 106 366 92" stroke="#F3C969" stroke-width="1.4" fill="none" opacity=".9"/>';
    s += renne(156, 62, 0, false) + renne(236, 54, 1, false) + renne(316, 46, 2, true);
    // traîneau
    s += '<g transform="translate(8 14)">';
    s += '<path d="M-6 142 C40 152 100 152 140 138 C148 134 148 126 140 128" stroke="url(#nlg-gold)" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M40 132 V146 M96 132 V145" stroke="#E3A21A" stroke-width="3.4" stroke-linecap="round"/>';
    s += '<path d="M6 92 H118 C128 92 132 100 128 110 C122 126 104 134 84 134 H40 C20 134 8 124 4 108 C2 100 3 94 6 92Z" fill="url(#nlg-red)"/>';
    s += '<path d="M12 100 H122" stroke="#FFD35A" stroke-width="3.4" stroke-linecap="round"/><path d="M118 92 C134 84 138 100 129 108" stroke="url(#nlg-gold)" stroke-width="4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M10 92 C0 68 22 56 42 62 C58 66 62 82 58 92Z" fill="url(#nlg-green)"/><circle cx="34" cy="64" r="5" fill="url(#nlg-sG)"/><path d="M26 66 L42 66" stroke="#FFC93C" stroke-width="2.4"/>';
    s += cadeau(18, 80, 18, 14, 6, PAL.glace);
    s += '<path d="M64 92 C64 70 80 60 96 64 C108 68 110 82 106 92Z" fill="url(#nlg-red)"/><rect x="66" y="80" width="40" height="5" rx="2" fill="#2B2B2B"/><rect x="82" y="79" width="7" height="7" rx="1.5" fill="url(#nlg-gold)"/>';
    s += '<circle cx="94" cy="52" r="11.5" fill="url(#nlg-skin)"/><path d="M80 50 C82 30 102 26 110 40 L106 49 C100 43 90 43 82 50Z" fill="url(#nlg-red)"/><circle cx="110" cy="40" r="5" fill="url(#nlg-white)"/>';
    s += '<rect x="79" y="47" width="30" height="7" rx="3.5" fill="url(#nlg-white)"/><path d="M83 57 C85 76 103 76 105 57 C100 64 88 64 83 57Z" fill="url(#nlg-white)"/><circle cx="98" cy="57" r="1.6" fill="#2B2B2B"/><circle cx="94" cy="66" r="1.8" fill="#F26B6B"/>';
    s += '<path d="M102 72 C112 74 120 78 130 80" stroke="#C8102E" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="131" cy="80" r="4" fill="url(#nlg-white)"/>';
    s += "</g></svg>";
    return s;
  }
  function hero(inner, cls) {
    var d = document.createElement("div");
    d.id = "nl-hero";
    if (cls) d.className = cls;
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = inner;
    return d;
  }

  /* ---------- HAPPY NEW YEAR / 2027 : or à paillettes, extrusion 3D bleue (Nouvel An) ---------- */
  function mix(a, b, t) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }); }
  function stack(t, depth) {
    var s = "", near = [58, 140, 255], far = [10, 36, 140];
    for (var d = depth; d >= 1; d--) {
      var c = mix(near, far, d / depth);
      s += '<span class="nl-ext" style="--dx:' + (d * .5).toFixed(2) + "px;--dy:" + (d * .85).toFixed(2) + "px;color:rgb(" + c.join(",") + ')">' + t + "</span>";
    }
    return '<span class="nl-stack" aria-hidden="true">' + s + '<span class="nl-front">' + t + '</span><span class="nl-sweep">' + t + "</span></span>";
  }
  function texteNouvelAn() {
    var sp = "";
    [[-4, 18], [12, -8], [38, 4], [66, -10], [92, 10], [104, 44], [84, 78], [52, 96], [20, 84], [-8, 56], [30, 40], [70, 52]].forEach(function (p, i) {
      sp += '<i class="nl-sp" style="left:' + p[0] + "%;top:" + p[1] + "%;--i:" + i + ";--z:" + (8 + (i % 4) * 4) + 'px"></i>';
    });
    return '<canvas class="nl-gl" aria-hidden="true"></canvas><div class="nl-scene nl-fb" role="img" aria-label="Happy New Year 2027">' +
      '<div class="nl-3d nl-hny">' + stack("HAPPY NEW YEAR", 6) + "</div>" +
      '<div class="nl-3d nl-year">' + stack("2027", 11) + "</div>" + sp + "</div>";
  }

  function texte3D() {
    var h = document.getElementById("nl-hero"), cv = h && h.querySelector(".nl-gl");
    if (!cv) return;
    function repli() { cv.remove(); h.classList.add("nl-fallback"); }
    try {
      var t = document.createElement("canvas"); if (!(t.getContext("webgl2") || t.getContext("webgl"))) return repli();
    } catch (e) { return repli(); }
    var sc = document.createElement("script");
    sc.src = (document.currentScript && document.currentScript.src ? document.currentScript.src : "assets/noel/noel.js").replace(/noel\.js(\?.*)?$/, "noel3d.js$1");
    sc.onload = function () { try { window.NoelText3D.mount(cv, { reduce: reduce }); h.classList.add("nl-ok"); } catch (e) { repli(); } };
    sc.onerror = repli;
    document.head.appendChild(sc);
  }
  function creerCouche() {
    if (NOEL) {
      sky.insertAdjacentHTML("beforeend", '<div id="nl-sled">' + svgTraineau() + "</div>");
      bgfx.appendChild(hero(svgSapin()));
    } else {
      sky.insertAdjacentHTML("beforeend", '<canvas id="nl-fw"></canvas>');
      bgfx.appendChild(hero(texteNouvelAn(), "nl-hero-an"));
    }
  }

  /* ---------- Bulles d'air dynamiques : motifs 3D (Noël) ou messages (Nouvel An) ----------
     Chaque bulle tourne au hasard : sur elle-même façon pièce (axe vertical), comme un disque dans le sens horaire, ou antihoraire. */
  var sac = [];
  function tirer() { // sac mélangé : chaque motif sort avant qu'un autre ne se répète ; le pain d'épice sort en premier
    if (!sac.length) { sac = CLES_NOEL.filter(function (k) { return k !== "pain"; }).sort(function () { return Math.random() - .5; }); sac.push("pain"); }
    return sac.pop();
  }
  function decorerBulles() {
    var bulles = document.querySelectorAll(".hero-bubbles i");
    Array.prototype.forEach.call(bulles, function (b) {
      if (b.querySelector(".nl-coin")) return;
      var taille = parseFloat(b.style.width) || 40;
      if (taille < 30) return;
      var mode = pick(["y", "cw", "ccw"]);
      var c = document.createElement("span");
      c.className = "nl-coin nl-m-" + mode;
      c.style.setProperty("--t", rnd(6, 11).toFixed(1) + "s");
      c.style.setProperty("--dl", (-rnd(0, 10)).toFixed(1) + "s");
      var dos = mode === "y" ? '<span class="nl-face nl-b">%B%</span>' : "";
      var face, verso;
      if (NOEL) {
        var a = tirer(), z = tirer();
        face = svg(ICONES[a]()); verso = svg(ICONES[z]());
      } else {
        // texte uniquement si la bulle est assez grosse pour qu'il soit lisible et ne déborde jamais ; sinon petite étoile dorée
        var pas = function (L) { var n = Math.max.apply(null, L.map(function (x) { return x.length; })); return Math.min(taille * .72 * .8 / (n * .66), taille * .2); };
        var ok = taille >= 84 ? LABELS_JAN.filter(function (L) { return pas(L) >= 10; }) : [];
        if (!ok.length) { face = svg(ICONES.etoile()); verso = svg(ICONES.etoile()); }
        else {
          var L = pick(ok), L2 = pick(ok);
          face = '<span class="nl-lbl" style="font-size:' + pas(L).toFixed(1) + 'px">' + L.join("<br>") + "</span>";
          verso = '<span class="nl-lbl" style="font-size:' + pas(L2).toFixed(1) + 'px">' + L2.join("<br>") + "</span>";
        }
      }
      c.innerHTML = '<span class="nl-face">' + face + "</span>" + dos.replace("%B%", verso);
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
      p0 = gauche ? [-.14 * W, yA * H] : [1.14 * W, yA * H];
      p2 = gauche ? [1.14 * W, yB * H] : [-.14 * W, yB * H];
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
      var x = rnd(.12, .88) * W, y = rnd(.12, .5) * H, c1 = pick(COULEURS), c2 = pick(COULEURS), n = mobile ? 40 : 70;
      if (parts.length > 1400) return;
      for (var i = 0; i < n; i++) {
        var a = rnd(0, Math.PI * 2), v = rnd(2.2, 6.6);
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rnd(60, 100), col: i % 4 === 0 ? c2 : c1, r: rnd(1.6, 3.2) });
      }
    }
    function frame(now) {
      requestAnimationFrame(frame);
      if (now > prochain) { feu(); prochain = now + rnd(2200, 4200); }
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
  if (NOEL) traineau(); else { feux(); texte3D(); }
  fond();
  window.addEventListener("scroll", fond, { passive: true });
  window.addEventListener("hashchange", fond);
  // Les bulles peuvent être recréées par l'application : on décore les nouvelles
  new MutationObserver(decorerBulles).observe(bgfx, { childList: true, subtree: true });
})();
