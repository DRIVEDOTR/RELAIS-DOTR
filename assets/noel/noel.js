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
    lg("nlg-red", ["#FF5F6D", "#D0182B", "#8E0F1E"]) + lg("nlg-pearl", ["#FFFFFF", "#BCCBE4", "#6C84AA"]) + lg("nlg-lacque", ["#FF4458", "#C0102A", "#6E0818"]) + lg("nlg-gold", ["#FFF3B0", "#FFC93C", "#D98A00"]) +
    lg("nlg-green", ["#3FD07E", "#12874B", "#0A5A32"]) + lg("nlg-copper", ["#F4B987", "#C97B3E", "#8F4D22"]) +
    lg("nlg-skin", ["#FFE7D2", "#F5B993"]) + lg("nlg-white", ["#FFFFFF", "#D9E6F5"]) + lg("nlg-ice", ["#F2FBFF", "#9ADBFF", "#4DA3F0"]) +
    lg("nlg-trail", ["rgba(255,214,90,0)", "rgba(255,214,90,.55)", "rgba(255,244,190,.95)"], false) +
    '<radialGradient id="nlg-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".7"/><stop offset="1" stop-color="#FFE9A0" stop-opacity="0"/></radialGradient>' +
    rg("nlg-sR", "#E0262F", "#FF7B84", "#6E0A18") + rg("nlg-sG", "#FFC83D", "#FFF0A0", "#A86400") + rg("nlg-sI", "#5DB6FF", "#D6F0FF", "#1F5BB5") + rg("nlg-sE", "#1FA85F", "#8CF0B8", "#0A5A32") +
    '<filter id="nlg-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
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

  /* ---------- Sapin réaliste : branches en éventail, aiguilles, lumières, guirlande de perles (Noël) ---------- */
  function graine(n) { var x = n; return function () { x = (x * 16807) % 2147483647; return x / 2147483647; }; }
  function svgSapin() {
    var R = graine(7), s = '<svg viewBox="0 0 400 480" aria-hidden="true">';
    s += '<defs><linearGradient id="nlt-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FBF74"/><stop offset=".5" stop-color="#157F47"/><stop offset="1" stop-color="#0A4A2A"/></linearGradient>' +
      '<linearGradient id="nlt-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2AA05B"/><stop offset="1" stop-color="#083D22"/></linearGradient>' +
      '<radialGradient id="nlt-skirt" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9D8EC"/></radialGradient></defs>';
    s += '<circle class="nl-halo" cx="200" cy="245" r="215" fill="url(#nlg-halo)"/>';
    s += '<ellipse cx="205" cy="462" rx="175" ry="12" fill="#0B2A6E" opacity=".22"/>';
    s += '<rect x="186" y="380" width="28" height="56" rx="4" fill="#5E3A1B"/>';
    var tips = [];
    for (var t = 6; t >= 0; t--) { // du bas vers le haut : les étages hauts recouvrent les bas
      var yb = 104 + t * 49, w = 36 + t * 22, nb = 6;
      for (var side = -1; side <= 1; side += 2) {
        for (var j = 0; j < nb; j++) {
          var f = (j + 1) / nb, ys = yb - 58 + j * 7, len = w * (.34 + .66 * f), tx = 200 + side * len, ty = yb + 12 * f + 4 + (j % 2) * 5;
          var c1x = 200 + side * len * .5, c1y = ys - 4 + j, c2x = 200 + side * len * .6, c2y = ys + 14 + 6 * f;
          var th = 15 + 12 * (1 - Math.abs(f - .55)), shade = ["#0E6B3B", "#127A44", "#0C5A32", "#168A4C"][Math.floor(R() * 4)];
          s += '<path d="M200 ' + ys + " Q" + c1x.toFixed(1) + " " + (c1y - th * .4).toFixed(1) + " " + tx.toFixed(1) + " " + ty.toFixed(1) + " Q" + c2x.toFixed(1) + " " + (c2y + th).toFixed(1) + " 200 " + (ys + 18) + 'Z" fill="' + shade + '"/>';
          // aiguilles : un seul tracé par branche
          var d = "";
          for (var k = 0; k < 11; k++) {
            var u = .12 + k * .085, bx = 200 + side * len * u, by = ys + (ty - ys) * u * u * .9 + 7 * (1 - u) + 4, a = (R() - .5) * .7;
            d += "M" + bx.toFixed(1) + " " + by.toFixed(1) + " l" + (side * 7 + a * 4).toFixed(1) + " " + (11 + R() * 4).toFixed(1) + " M" + bx.toFixed(1) + " " + (by - 1).toFixed(1) + " l" + (side * 6).toFixed(1) + " " + (-5 - R() * 3).toFixed(1);
          }
          s += '<path d="' + d + '" stroke="' + (R() > .5 ? "#47D88A" : "#2FB36B") + '" stroke-opacity=".75" stroke-width="1.5" stroke-linecap="round" fill="none"/>';
          s += '<path d="M200 ' + (ys + 2) + " Q" + c1x.toFixed(1) + " " + (c1y - th * .4).toFixed(1) + " " + tx.toFixed(1) + " " + ty.toFixed(1) + '" stroke="#7CF0B0" stroke-opacity=".3" stroke-width="1.4" fill="none"/>';
          if (j >= nb - 3) tips.push([tx, ty + 6, t]);
          if (R() > .55) s += '<circle cx="' + (200 + side * len * (.4 + R() * .55)).toFixed(1) + '" cy="' + (ys + 6 + R() * 10).toFixed(1) + '" r="1.6" fill="#fff" opacity=".6"/>'; // poudre de neige
        }
      }
    }
    // guirlande de perles dorées en spirale
    var gb = "";
    for (var q = 0; q <= 46; q++) {
      var uu = q / 46, gy = 78 + uu * 330, gw = 22 + (gy - 70) * .5, gx = 200 + Math.sin(uu * 17) * gw * .82;
      gb += '<circle cx="' + gx.toFixed(1) + '" cy="' + (gy + Math.cos(uu * 17) * 6).toFixed(1) + '" r="3.4" fill="url(#nlg-sG)"/>';
    }
    s += gb;
    // lumières LED qui clignotent, boules suspendues
    tips.forEach(function (p, i) {
      var col = ["#FFF6C2", "#FF4D5A", "#FFC83D", "#8FD6FF"][i % 4];
      s += '<circle class="nl-l" style="--i:' + i + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.6" fill="' + col + '" filter="url(#nlg-glow)"/>';
      if (i % 3 === 0) s += '<line x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + p[0].toFixed(1) + '" y2="' + (p[1] + 8).toFixed(1) + '" stroke="#FFD870" stroke-width="1"/>' + boule(p[0], p[1] + 18, 8.5, ["nlg-sR", "nlg-sG", "nlg-sI"][(i / 3 | 0) % 3]);
    });
    [[200, 70, 9, "nlg-sR"], [176, 150, 9, "nlg-sG"], [226, 214, 10, "nlg-sI"], [170, 270, 10, "nlg-sR"], [238, 320, 10, "nlg-sG"]].forEach(function (b) { s += boule(b[0], b[1], b[2], b[3]); });
    [[84, 160], [330, 170], [56, 310], [352, 316], [116, 66], [290, 78]].forEach(function (p, i) {
      s += '<path class="nl-tw" style="--i:' + i + '" d="M' + p[0] + " " + (p[1] - 10) + " L" + (p[0] + 2.6) + " " + (p[1] - 2.6) + " L" + (p[0] + 10) + " " + p[1] + " L" + (p[0] + 2.6) + " " + (p[1] + 2.6) + " L" + p[0] + " " + (p[1] + 10) + " L" + (p[0] - 2.6) + " " + (p[1] + 2.6) + " L" + (p[0] - 10) + " " + p[1] + " L" + (p[0] - 2.6) + " " + (p[1] - 2.6) + 'Z" fill="#FFF6C2"/>';
    });
    s += '<g class="nl-star" filter="url(#nlg-glow)">' + etoileFacettes(200, 36, 28, 12, 5, "#FFE680", "#FFB81F") + "</g>";
    // jupe blanche + cadeaux
    s += '<ellipse cx="200" cy="440" rx="168" ry="24" fill="url(#nlt-skirt)"/><ellipse cx="200" cy="436" rx="150" ry="14" fill="#fff" opacity=".55"/>';
    s += cadeau(48, 404, 84, 56, 20, PAL.rouge) + cadeau(264, 414, 70, 46, 18, PAL.glace) + cadeau(160, 432, 54, 30, 14, PAL.or) + cadeau(112, 440, 34, 20, 9, PAL.vert);
    s += "</svg>";
    return '<div class="nl-tree">' + s + "</div>";
  }

  /* ---------- Traîneau et rennes : silhouettes élégantes, métal et laque, traînée lumineuse (Noël) ---------- */
  function renne(tx, ty, i, lead) {
    var pat = "M12 32 L-8 44 L-20 38 M20 35 L2 49 L-8 47 M68 35 L90 43 L104 38 M62 37 L82 48 L94 46";
    return '<g transform="translate(' + tx + " " + ty + ') scale(.96)"><g class="nl-rn" style="--i:' + i + '">' +
      '<path d="' + pat + '" stroke="#8CA0C0" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="M8 30 C10 22 26 18 44 20 C58 21 68 24 74 29 C72 36 62 40 48 40 C30 41 12 40 8 30Z" fill="url(#nlg-pearl)"/>' +
      '<path d="M66 25 C72 16 78 10 84 6 L96 8 C99 11 95 14 91 15 C87 19 84 26 80 33 C76 36 70 34 66 30Z" fill="url(#nlg-pearl)"/>' +
      '<path d="M14 30 C26 25 50 25 70 29 C56 28 30 31 14 30Z" fill="#fff" opacity=".55"/>' +
      '<path d="M84 7 L80 0 L90 5Z" fill="#9FB0C8"/><path d="M8 28 L0 24 L5 32Z" fill="#fff"/><circle cx="90" cy="11" r="1.2" fill="#2A3A52"/>' +
      '<path d="M68 22 L78 31" stroke="#FFC93C" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M86 6 C86 -4 80 -12 72 -16 M83 -3 C79 -4 75 -3 72 -6 M87 4 C92 -4 94 -10 100 -14 M91 -3 C94 -3 97 -5 100 -4 M80 -9 C77 -11 75 -15 74 -19" stroke="#FFD870" stroke-width="2.2" stroke-linecap="round" fill="none" filter="url(#nlg-glow)"/>' +
      (lead ? '<circle cx="97" cy="12" r="7" fill="#FF3B4A" opacity=".5" filter="url(#nlg-glow)"/><circle cx="97" cy="12" r="2.6" fill="#FF3B4A"/>' : '') +
      "</g></g>";
  }
  function svgTraineau() {
    var s = '<svg viewBox="0 0 560 190" aria-hidden="true">';
    s += '<path d="M24 120 L-210 132 L-210 148 L24 146Z" fill="url(#nlg-trail)" filter="url(#nlg-glow)" opacity=".9"/><path d="M24 128 L-120 134 L24 138Z" fill="#fff" opacity=".35"/>';
    [[-40, 122, 0], [-96, 138, 1], [-150, 128, 2], [-8, 154, 3], [-70, 150, 4], [-190, 140, 5]].forEach(function (p) { s += '<path class="nl-tw" style="--i:' + p[2] + '" d="M' + p[0] + " " + (p[1] - 6) + " L" + (p[0] + 1.6) + " " + (p[1] - 1.6) + " L" + (p[0] + 6) + " " + p[1] + " L" + (p[0] + 1.6) + " " + (p[1] + 1.6) + " L" + p[0] + " " + (p[1] + 6) + " L" + (p[0] - 1.6) + " " + (p[1] + 1.6) + " L" + (p[0] - 6) + " " + p[1] + " L" + (p[0] - 1.6) + " " + (p[1] - 1.6) + 'Z" fill="#FFF6C2"/>'; });
    s += '<path d="M150 112 C190 104 228 98 262 86 M150 116 C216 112 280 100 340 82 M150 120 C240 120 330 104 420 76" stroke="#FFD870" stroke-width="1.2" fill="none" opacity=".85"/>';
    s += renne(160, 70, 0, false) + renne(252, 58, 1, false) + renne(344, 46, 2, false) + renne(436, 34, 3, true);
    s += '<g transform="translate(8 22)">';
    s += '<path d="M-4 142 C40 154 106 154 152 134 C160 130 160 120 152 120" stroke="url(#nlg-gold)" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M42 134 V148 M100 134 V146" stroke="#E3A21A" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="M2 92 C30 86 90 86 130 92 C142 94 150 88 154 78 C158 96 150 116 130 124 C104 134 50 134 22 126 C8 120 2 108 2 92Z" fill="url(#nlg-lacque)"/>';
    s += '<path d="M10 98 C50 94 100 94 140 98" stroke="#FFD870" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M130 92 C148 92 156 80 152 70" stroke="url(#nlg-gold)" stroke-width="4" fill="none" stroke-linecap="round"/>';
    s += cadeau(10, 70, 24, 18, 8, PAL.or) + cadeau(34, 76, 20, 14, 7, PAL.glace);
    s += '<path d="M62 90 C60 68 78 58 94 62 C106 66 108 82 104 90Z" fill="url(#nlg-lacque)"/><rect x="64" y="78" width="42" height="4.5" rx="2" fill="#1B1B24"/><rect x="82" y="77" width="7" height="6.5" rx="1.5" fill="url(#nlg-gold)"/>';
    s += '<circle cx="92" cy="50" r="10.5" fill="url(#nlg-skin)"/><path d="M80 48 C82 30 100 26 108 38 L104 47 C98 41 88 41 82 48Z" fill="url(#nlg-lacque)"/><circle cx="108" cy="38" r="4.6" fill="url(#nlg-white)"/>';
    s += '<rect x="79" y="45" width="28" height="6.5" rx="3.2" fill="url(#nlg-white)"/><path d="M83 55 C85 72 101 72 103 55 C98 61 88 61 83 55Z" fill="url(#nlg-white)"/>';
    s += '<path d="M100 68 C112 70 122 74 134 76" stroke="#B0102A" stroke-width="5.4" stroke-linecap="round" fill="none"/><circle cx="135" cy="76" r="3.6" fill="url(#nlg-white)"/>';
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

  /* ---------- HAPPY NEW YEAR / 2027 : or à paillettes, extrusion 3D bleue vue légèrement de côté (canvas) ---------- */
  function texteNouvelAn() { return '<canvas class="nl-cv" aria-label="Happy New Year 2027" role="img"></canvas>'; }
  function lancerTexte(cv) {
    var LW = 420, LH = 250, g = cv.getContext("2d"), off = document.createElement("canvas"), og = off.getContext("2d"), DPR = 1;
    var L1 = "HAPPY NEW YEAR", L2 = "2027", fs1 = 30, fs2 = 150, base1 = 78, base2 = 206, grains = [], etoiles = [];
    function mesurer() {
      g.font = "800 100px Poppins,system-ui,sans-serif";
      fs1 = 100 * 318 / g.measureText(L1).width; fs2 = Math.min(168, 100 * 372 / g.measureText(L2).width);
    }
    function dim() { DPR = Math.min(2, window.devicePixelRatio || 1); cv.width = LW * DPR; cv.height = LH * DPR; off.width = cv.width; off.height = cv.height; mesurer(); }
    for (var i = 0; i < 700; i++) grains.push({ x: rnd(-210, 210), y: rnd(0, 1), l: i % 2, ph: rnd(0, 6.28), v: rnd(.0015, .005), r: rnd(.6, 1.7), o: i % 5 === 0 });
    for (var k = 0; k < 16; k++) etoiles.push({ x: rnd(8, LW - 8), y: rnd(6, LH - 10), ph: rnd(0, 6.28), v: rnd(.002, .005), z: rnd(4, 10) });
    function etoile4(c, x, y, r, a) { c.globalAlpha = a; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * .22, y - r * .22); c.lineTo(x + r, y); c.lineTo(x + r * .22, y + r * .22); c.lineTo(x, y + r); c.lineTo(x - r * .22, y + r * .22); c.lineTo(x - r, y); c.lineTo(x - r * .22, y - r * .22); c.closePath(); c.fill(); }
    function ligne(c, txt, fs, base, D, tt, cs, sn) {
      c.font = "800 " + fs.toFixed(1) + "px Poppins,system-ui,sans-serif"; c.textAlign = "center"; c.textBaseline = "alphabetic";
      for (var d = D; d >= 1; d--) { // extrusion bleue, du fond vers la face
        var f = d / D, r = Math.round(70 - 60 * f), gg = Math.round(150 - 108 * f), b = Math.round(255 - 110 * f);
        c.fillStyle = "rgb(" + r + "," + gg + "," + b + ")";
        c.fillText(txt, d * -sn * 1.05, base + d * .34);
      }
      return;
    }
    function face(c, txt, fs, base, tt, lg) {
      c.font = "800 " + fs.toFixed(1) + "px Poppins,system-ui,sans-serif"; c.textAlign = "center"; c.textBaseline = "alphabetic";
      var gr = c.createLinearGradient(0, base - fs * .76, 0, base); gr.addColorStop(0, "#FFF6B8"); gr.addColorStop(.38, "#FFD21F"); gr.addColorStop(.78, "#F2A100"); gr.addColorStop(1, "#C97A00");
      c.fillStyle = gr; c.fillText(txt, 0, base);
      c.lineWidth = 1.3; c.strokeStyle = "#A8620A"; c.strokeText(txt, 0, base);
      c.globalCompositeOperation = "source-atop";
      grains.forEach(function (p) {
        if (p.l !== lg) return;
        var y = base - fs * .8 + p.y * fs * .8, a = Math.pow(Math.max(0, Math.sin(tt * p.v + p.ph)), 8);
        if (p.o) { c.fillStyle = "rgba(120,70,0,.45)"; c.beginPath(); c.arc(p.x, y, p.r * .8, 0, 6.3); c.fill(); }
        else { c.fillStyle = "#FFFFFF"; c.globalAlpha = .25 + .75 * a; c.beginPath(); c.arc(p.x, y, p.r * (.7 + a), 0, 6.3); c.fill(); c.globalAlpha = 1; if (a > .7) { c.fillStyle = "#fff"; etoile4(c, p.x, y, 3.2 + a * 2.4, a); c.globalAlpha = 1; } }
      });
      var sw = ((tt * .00028 + lg * .35) % 1.5 - .25) * 520 - 260, sg = c.createLinearGradient(sw - 50, base - fs, sw + 50, base);
      sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(.5, "rgba(255,255,255,.75)"); sg.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = sg; c.fillRect(-260, base - fs, 520, fs * 1.2);
      c.globalCompositeOperation = "source-over";
    }
    var last = 0, vis = true;
    function draw(tt) {
      var yaw = -.46 + .08 * Math.sin(tt / 2300), cs = Math.cos(yaw), sn = Math.sin(yaw), sh = -sn * .1;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, off.width, off.height);
      var m = [DPR * cs, DPR * sh, 0, DPR, DPR * LW / 2, 0];
      g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      ligne(g, L1, fs1, base1, 12, tt, cs, sn); ligne(g, L2, fs2, base2, 26, tt, cs, sn);
      og.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      face(og, L1, fs1, base1, tt, 0); face(og, L2, fs2, base2, tt, 1);
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(off, 0, 0);
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = "#FFF3B0";
      etoiles.forEach(function (e) { var a = Math.pow(Math.max(0, Math.sin(tt * e.v + e.ph)), 6); if (a > .05) etoile4(g, e.x, e.y, e.z * (.5 + a), a); });
      g.globalAlpha = 1;
    }
    dim();
    function boucle(now) {
      requestAnimationFrame(boucle);
      if (now - last < 33 || document.hidden) return;
      last = now; draw(now);
    }
    var go = function () { dim(); if (reduce) draw(1000); else requestAnimationFrame(boucle); };
    if (document.fonts && document.fonts.load) document.fonts.load("800 40px Poppins").then(go, go); else go();
    window.addEventListener("resize", dim);
  }

  function creerCouche() {
    if (NOEL) {
      sky.insertAdjacentHTML("beforeend", '<div id="nl-sled">' + svgTraineau() + "</div>");
      bgfx.appendChild(hero(svgSapin()));
    } else {
      sky.insertAdjacentHTML("beforeend", '<canvas id="nl-fw"></canvas>');
      var hh = hero(texteNouvelAn(), "nl-hero-an");
      bgfx.appendChild(hh);
      lancerTexte(hh.querySelector("canvas"));
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
      } else if (taille < 58) {
        face = svg(ICONES.etoile()); verso = svg(ICONES.etoile());
      } else {
        var L = pick(LABELS_JAN), L2 = pick(LABELS_JAN), len = Math.max.apply(null, L.map(function (x) { return x.length; })), len2 = Math.max.apply(null, L2.map(function (x) { return x.length; }));
        var fit = function (l, n) { return Math.max(7, Math.min(taille * .185, taille * .58 / (Math.max(3, l) * .6))) * (n > 1 ? 1 : 1.25); };
        face = '<span class="nl-lbl" style="font-size:' + fit(len, L.length).toFixed(1) + 'px">' + L.join("<br>") + "</span>";
        verso = '<span class="nl-lbl" style="font-size:' + fit(len2, L2.length).toFixed(1) + 'px">' + L2.join("<br>") + "</span>";
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

  /* ---------- Feux d'artifice fluo : fusées, éclatements, traînées lumineuses (Nouvel An) ---------- */
  function feux() {
    var cv = document.getElementById("nl-fw");
    if (!cv || !cv.getContext || reduce) return;
    var g = cv.getContext("2d"), parts = [], fusees = [], W = 0, H = 0, DPR = 1, prochain = 0;
    var mobile = window.matchMedia && matchMedia("(max-width: 860px)").matches;
    var FLUO = ["#39FF14", "#FF1493", "#00F0FF", "#FFF200", "#FF2D2D", "#C400FF", "#FF6EC7", "#00FF9F", "#FF9100", "#2D5BFF"];
    function taille() { DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); }
    taille();
    window.addEventListener("resize", taille);
    function lancer() { fusees.push({ x: rnd(.08, .92) * W, y: H + 10, ty: rnd(.12, .5) * H, vy: rnd(9, 12.5), c: pick(FLUO) }); }
    function eclater(x, y, c1) {
      var c2 = pick(FLUO), forme = pick(["sphere", "sphere", "anneau", "saule", "double"]), n = mobile ? 70 : 130;
      if (parts.length > 2200) return;
      for (var i = 0; i < n; i++) {
        var a = rnd(0, Math.PI * 2), v = rnd(2.5, 8.5), col = i % 3 === 0 ? c2 : c1, life = rnd(60, 105), grav = .05;
        if (forme === "anneau") { v = 6.4 + rnd(-.3, .3); a = i / n * Math.PI * 2; }
        if (forme === "saule") { v *= .75; life += 40; grav = .09; }
        if (forme === "double") { v = i % 2 ? v * .5 : v; col = i % 2 ? c2 : c1; }
        parts.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: life, col: col, r: rnd(1.8, 3.4), g: grav });
      }
      for (var j = 0; j < 14; j++) parts.push({ x: x, y: y, px: x, py: y, vx: rnd(-1, 1), vy: rnd(-1, 1), life: 0, max: 14, col: "#FFFFFF", r: rnd(5, 9), g: 0 });
    }
    function frame(now) {
      requestAnimationFrame(frame);
      if (now > prochain) { lancer(); if (Math.random() < .5) lancer(); prochain = now + rnd(700, 1500); }
      g.globalCompositeOperation = "destination-out"; g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter"; g.lineCap = "round";
      for (var f = fusees.length - 1; f >= 0; f--) {
        var r = fusees[f]; r.y -= r.vy; r.vy *= .992;
        g.strokeStyle = r.c; g.globalAlpha = .9; g.lineWidth = 2.6; g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x, r.y + 16); g.stroke();
        g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x, r.y + 7); g.stroke();
        if (r.y <= r.ty || r.vy < 2.2) { eclater(r.x, r.y, r.c); fusees.splice(f, 1); }
      }
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life++;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        p.px = p.x; p.py = p.y; p.vx *= .984; p.vy = p.vy * .984 + p.g; p.x += p.vx; p.y += p.vy;
        var k = 1 - p.life / p.max;
        g.strokeStyle = p.col; g.fillStyle = p.col;
        g.globalAlpha = .22 * k; g.lineWidth = p.r * 5; g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke();
        g.globalAlpha = Math.min(1, k * 1.6); g.lineWidth = p.r * (.7 + .5 * k); g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke();
        g.globalAlpha = k; g.fillStyle = "#fff"; g.beginPath(); g.arc(p.x, p.y, p.r * .45 * k + .4, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
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
  if (window.NOEL_FORCE) window.__NL = { ICONES: ICONES };
  decorerBulles();
  if (NOEL) traineau(); else feux();
  fond();
  window.addEventListener("scroll", fond, { passive: true });
  window.addEventListener("hashchange", fond);
  // Les bulles peuvent être recréées par l'application : on décore les nouvelles
  new MutationObserver(decorerBulles).observe(bgfx, { childList: true, subtree: true });
})();
