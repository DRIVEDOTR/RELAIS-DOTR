/* Aperçu intégré des fichiers Excel (.xlsx, .xls, .xlsm, .csv) et Word (.docx), dans le navigateur.
   Les bibliothèques (SheetJS, Mammoth) sont hébergées dans assets/vendor et ne se chargent qu'à la première ouverture d'un tel document. */
(function () {
  "use strict";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var loaded = {};
  function lib(name, src) {
    if (loaded[name]) return loaded[name];
    return loaded[name] = new Promise(function (ok, ko) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function () { delete loaded[name]; ko(new Error("Bibliothèque d'aperçu indisponible")); }; document.head.appendChild(s); });
  }
  var XL = { xlsx: 1, xls: 1, xlsm: 1, csv: 1 }, WD = { docx: 1 }, PP = { pptx: 1 };
  function can(ext) { ext = String(ext || "").toLowerCase(); return !!(XL[ext] || WD[ext] || PP[ext]); }
  function buf(src) {
    if (src.buffer) return Promise.resolve(src.buffer);
    return fetch(src.url).then(function (r) { if (!r.ok) throw new Error("Fichier introuvable"); return r.arrayBuffer(); });
  }
  var MAXR = 400, MAXC = 40;
  function sheetHtml(XLSX, ws) {
    var ref = ws["!ref"]; if (!ref) return '<p class="pv-empty">Feuille vide.</p>';
    var rg = XLSX.utils.decode_range(ref), tr = rg.e.r - rg.s.r + 1, tc = rg.e.c - rg.s.c + 1, cut = false;
    if (tr > MAXR) { rg.e.r = rg.s.r + MAXR - 1; cut = true; } if (tc > MAXC) { rg.e.c = rg.s.c + MAXC - 1; cut = true; }
    var rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: rg, raw: false, defval: "", blankrows: true });
    var h = "<table>"; var merges = ws["!merges"] || [], skip = {}, span = {};
    merges.forEach(function (m) { span[(m.s.r - rg.s.r) + "," + (m.s.c - rg.s.c)] = [m.e.r - m.s.r + 1, m.e.c - m.s.c + 1]; for (var r = m.s.r; r <= m.e.r; r++) for (var c = m.s.c; c <= m.e.c; c++) if (r !== m.s.r || c !== m.s.c) skip[(r - rg.s.r) + "," + (c - rg.s.c)] = 1; });
    rows.forEach(function (row, i) {
      var any = row.some(function (v) { return v !== ""; }); if (!any && i > 0 && !rows[i + 1]) return;
      h += "<tr><th>" + (rg.s.r + i + 1) + "</th>";
      for (var j = 0; j < tc && j <= rg.e.c - rg.s.c; j++) { var k = i + "," + j; if (skip[k]) continue; var sp = span[k]; h += "<td" + (sp ? ' rowspan="' + sp[0] + '" colspan="' + sp[1] + '"' : "") + ">" + esc(row[j] == null ? "" : row[j]) + "</td>"; }
      h += "</tr>";
    });
    h += "</table>";
    return h + (cut ? '<p class="pv-cut">Aperçu limité aux ' + MAXR + " premières lignes et " + MAXC + " premières colonnes. Téléchargez le fichier pour le voir en entier.</p>" : "");
  }
  function renderExcel(box, src) {
    return Promise.all([lib("xlsx", "assets/vendor/xlsx.min.js"), buf(src)]).then(function (r) {
      var XLSX = window.XLSX, wb = XLSX.read(r[1], { type: "array", cellDates: true });
      var names = wb.SheetNames.filter(function (n) { var s = (wb.Workbook && wb.Workbook.Sheets || []).filter(function (x) { return x.name === n; })[0]; return !(s && s.Hidden); });
      if (!names.length) names = wb.SheetNames;
      box.innerHTML = '<div class="pv-xl"><div class="pv-tabs" role="tablist">' + names.map(function (n, i) { return '<button type="button" role="tab" data-s="' + i + '" aria-selected="' + (i === 0) + '">' + esc(n) + "</button>"; }).join("") + '</div><div class="pv-sheet"></div></div>';
      var sh = box.querySelector(".pv-sheet");
      function show(i) { sh.innerHTML = sheetHtml(XLSX, wb.Sheets[names[i]]); sh.scrollTop = 0; Array.prototype.forEach.call(box.querySelectorAll(".pv-tabs button"), function (b) { b.setAttribute("aria-selected", String(+b.dataset.s === i)); }); }
      box.querySelector(".pv-tabs").addEventListener("click", function (e) { var b = e.target.closest("button[data-s]"); if (b) show(+b.dataset.s); });
      show(0);
    });
  }
  function renderWord(box, src) {
    return Promise.all([lib("mammoth", "assets/vendor/mammoth.min.js"), buf(src)]).then(function (r) {
      return window.mammoth.convertToHtml({ arrayBuffer: r[1] });
    }).then(function (res) {
      var div = document.createElement("div"); div.innerHTML = res.value;
      Array.prototype.forEach.call(div.querySelectorAll("script,iframe,object,embed,style,link"), function (n) { n.remove(); });
      Array.prototype.forEach.call(div.querySelectorAll("*"), function (n) { Array.prototype.slice.call(n.attributes).forEach(function (a) { if (/^on/i.test(a.name) || (/^(href|src)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name); }); });
      Array.prototype.forEach.call(div.querySelectorAll("a[href]"), function (a) { a.target = "_blank"; a.rel = "noopener"; });
      box.innerHTML = '<div class="pv-doc"><div class="pv-page">' + (div.innerHTML || '<p class="pv-empty">Document vide.</p>') + '</div><p class="pv-cut">Aperçu simplifié (mise en page, en-têtes et pieds de page non reproduits). Téléchargez le fichier pour le voir à l\'identique.</p></div>';
    });
  }
  function renderPpt(box, src) {
    return Promise.all([lib("pptx", "assets/vendor/pptx-preview.min.js"), buf(src)]).then(function (r) {
      box.innerHTML = '<div class="pv-ppt"><div class="pv-slides"></div><p class="pv-cut">Aperçu simplifié (polices, animations et certains effets non reproduits). Téléchargez le fichier pour le voir à l\'identique.</p></div>';
      var w = Math.max(280, Math.min(960, (box.clientWidth || 800) - 28)), host = box.querySelector(".pv-slides");
      var pv = window.pptxPreview.init(host, { width: w, height: Math.max(320, (box.clientHeight || 600) - 70) });
      return pv.preview(r[1]);
    });
  }
  function render(box, src, ext) {
    ext = String(ext || "").toLowerCase();
    box.innerHTML = '<div class="v-na"><b>Chargement de l\'aperçu…</b></div>';
    var p = XL[ext] ? renderExcel(box, src) : WD[ext] ? renderWord(box, src) : PP[ext] ? renderPpt(box, src) : Promise.reject(new Error("Format non pris en charge"));
    return p.catch(function (e) { box.innerHTML = '<div class="v-na"><b>Aperçu impossible pour ce fichier</b><p>' + esc(e && e.message || e) + ". Utilisez « Télécharger » pour l'ouvrir dans son application.</p></div>"; });
  }
  window.HubPreview = { can: can, render: render };
})();
