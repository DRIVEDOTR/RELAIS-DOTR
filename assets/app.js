/* Le Relais DOTR — application (aucune dépendance, fonctionne sur GitHub Pages et en double-clic local) */
(function () {
  "use strict";
  var H = window.HUB || { config: {}, docs: [], liens: [] };
  var CFG = H.config || {}, SITE = CFG.site || {};
  var RUBS = CFG.rubriques || [], PROFILS = CFG.profils || [], PARCOURS = CFG.parcours || [];
  var ROUTE = (CFG.route || {}), RELAIS = ROUTE.relais || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var norm = function (s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
  var enc = encodeURIComponent;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- icônes ---------- */
  var P = {
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    "file-signature": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    stethoscope: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
    tools: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    "calendar-check": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4V8z"/>',
    presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
    "user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H16c3.3 0 6-2.7 6-6 0-4.9-4.5-8.4-10-8.4z"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>'
  };
  var ic = function (n, c) { return '<svg class="ic ' + (c || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.folder) + "</svg>"; };
  var TYPE = {
    pdf: { label: "PDF", icon: "file" }, word: { label: "Word", icon: "file" }, excel: { label: "Excel", icon: "sheet" },
    ppt: { label: "PowerPoint", icon: "presentation" }, video: { label: "Vidéo", icon: "play" }, image: { label: "Image", icon: "image" },
    lien: { label: "Lien", icon: "link" }, autre: { label: "Fichier", icon: "file" }, audio: { label: "Audio", icon: "play" }, zip: { label: "Archive", icon: "folder" }, texte: { label: "Texte", icon: "file" }
  };

  /* ---------- données ---------- */
  var rubById = {}; RUBS.forEach(function (r) { rubById[r.id] = r; });
  var docs = (H.docs || []).slice();
  (H.liens || []).forEach(function (l) {
    docs.push({ id: "lien:" + l.url, path: l.url, url: l.url, title: l.titre || l.title || l.url, desc: l.desc || "", when: l.quand || "", tags: l.tags || [], profils: l.profils || [], rub: l.rubrique || "", sous: l.sous || "", type: "lien", ext: "", size: 0, order: l.ordre || 100, date: l.date || "", thumb: "" });
  });
  var byId = {};
  docs.forEach(function (d) {
    var r = rubById[d.rub] || {};
    d.rubLabel = r.label || d.rub; d.sousLabel = ((r.sous || {})[d.sous]) || prettySous(d.sous);
    d.hay = norm([d.title, (d.tags || []).join(" "), d.desc, d.when, d.rubLabel, d.sousLabel, (d.path || "").split("/").pop()].join(" "));
    byId[d.id] = d;
  });
  function prettySous(s) { s = String(s || "").split("/").pop().replace(/^\d+[-_ ]+/, "").replace(/[-_]+/g, " "); return s.charAt(0).toUpperCase() + s.slice(1); }
  var cmp = function (a, b) { return (a.order - b.order) || a.title.localeCompare(b.title, "fr", { numeric: true, sensitivity: "base" }); };
  var inRub = function (id) { var pd = window.HubTeam ? window.HubTeam.state().del : {}; return docs.filter(function (d) { return d.rub === id && !pd[d.path]; }).sort(cmp); };
  var NOW = Date.now();
  var isNew = function (d) { if (!d.date) return false; var t = new Date(d.date).getTime(); return t && NOW - t < 10 * 864e5 && NOW - t > -864e5; };
  var fmtSize = function (n) { if (!n) return ""; return n < 1e6 ? Math.max(1, Math.round(n / 1e3)) + " Ko" : (n / 1e6).toFixed(n < 1e7 ? 1 : 0).replace(".", ",") + " Mo"; };
  var fmtDur = function (s) { if (!s) return ""; var m = Math.floor(s / 60), r = s % 60; return m + ":" + (r < 10 ? "0" : "") + r; };
  var fmtDate = function (d) { try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return d; } };
  var href = function (p) { return String(p).split("/").map(enc).join("/"); };
  var fileUrl = function (d) { return d.url || href(d.path); };
  var meta = function (d) {
    var m = [];
    if (d.pages) m.push(d.pages + " p.");
    if (d.duree) m.push(fmtDur(d.duree));
    if (d.size) m.push(fmtSize(d.size));
    return m.join(" · ");
  };

  /* ---------- composants ---------- */
  function media(d, big) {
    if (d.thumb) return '<img loading="lazy" decoding="async" src="' + esc(d.thumb) + '" alt="" onload="this.classList.add(this.naturalWidth/this.naturalHeight>1.15?\'ls\':\'pt\')">';
    var t = TYPE[d.type] || TYPE.autre;
    return '<div class="tile t-' + d.type + '">' + ic(t.icon) + "<b>" + esc(d.ext ? d.ext.toUpperCase() : t.label.toUpperCase()) + "</b></div>";
  }
  function card(d, o) {
    o = o || {}; var t = TYPE[d.type] || TYPE.autre;
    if (d.pending) return '<div class="card pending" title="' + esc(d.title) + '"><div class="thumb">' + media(d) + '<span class="pnd">En cours de publication</span></div><div class="cbody"><h4>' + esc(d.title) + '</h4><p class="cmeta"><span class="badge b-' + d.type + '">' + t.label + '</span><span>Visible d\'ici 1 à 3 minutes</span></p></div></div>';
    return '<a class="card" href="#/d/' + enc(d.id) + '" title="' + esc(d.title) + '"><div class="thumb">' + media(d) +
      (d.type === "video" ? '<span class="play">' + ic("play") + "</span>" + (d.duree ? '<em class="dur">' + fmtDur(d.duree) + "</em>" : "") : "") +
      (isNew(d) ? '<span class="new">Nouveau</span>' : "") + (d.essentiel && !o.noStar ? '<span class="star" title="Essentiel">' + ic("star") + "</span>" : "") +
      '</div><div class="cbody"><h4>' + (o.hl ? hl(d.title, o.hl) : esc(d.title)) + '</h4><p class="cmeta"><span class="badge b-' + d.type + '">' + t.label + "</span><span>" + esc(meta(d)) + "</span></p>" +
      (o.crumb ? '<p class="crumb">' + esc(d.rubLabel) + (d.sousLabel ? " › " + esc(d.sousLabel) : "") + "</p>" : "") + "</div></a>";
  }
  function row(d, q) {
    var t = TYPE[d.type] || TYPE.autre;
    return '<a class="row" href="#/d/' + enc(d.id) + '"><div class="st">' + media(d) + '</div><div style="min-width:0"><h4>' + hl(d.title, q) + '</h4><p>' + esc(d.rubLabel) + (d.sousLabel ? " › " + esc(d.sousLabel) : "") + ' · <span class="badge b-' + d.type + '">' + t.label + "</span> " + esc(meta(d)) + "</p>" + (d.desc ? '<p>' + esc(d.desc.length > 130 ? d.desc.slice(0, 128) + "…" : d.desc) + "</p>" : "") + '</div><span style="margin-left:auto;color:var(--blue)">' + ic("chevron") + "</span></a>";
  }
  function hl(text, q) {
    if (!q) return esc(text);
    var toks = tokens(q); if (!toks.length) return esc(text);
    var n = norm(text), mark = new Array(text.length + 1).join("0").split("");
    toks.forEach(function (tk) { var i = -1; while ((i = n.indexOf(tk, i + 1)) >= 0) { for (var k = i; k < i + tk.length && k < mark.length; k++) mark[k] = "1"; } });
    var out = "", on = false;
    for (var i2 = 0; i2 < text.length; i2++) { var m = mark[i2] === "1"; if (m && !on) out += "<mark>"; if (!m && on) out += "</mark>"; on = m; out += esc(text[i2]); }
    return out + (on ? "</mark>" : "");
  }
  var tokens = function (q) { return norm(q).split(/[\s,;]+/).filter(Boolean); };

  /* ---------- recherche ---------- */
  function search(q, limit) {
    var toks = tokens(q); if (!toks.length) return [];
    var res = [];
    docs.forEach(function (d) {
      var s = 0, nt = norm(d.title), ntag = norm((d.tags || []).join(" ")), nd = norm(d.desc + " " + d.when), np = norm(d.rubLabel + " " + d.sousLabel);
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i], sc = 0;
        if (nt.indexOf(t) >= 0) sc += nt.indexOf(t) === 0 ? 9 : 6;
        if (ntag.indexOf(t) >= 0) sc += 4;
        if (np.indexOf(t) >= 0) sc += 2.5;
        if (nd.indexOf(t) >= 0) sc += 1.5;
        if (!sc && d.hay.indexOf(t) >= 0) sc += 1;
        if (!sc) return;
        s += sc;
      }
      res.push({ d: d, s: s });
    });
    res.sort(function (a, b) { return (b.s - a.s) || cmp(a.d, b.d); });
    return (limit ? res.slice(0, limit) : res).map(function (x) { return x.d; });
  }
  function bindSearch(root, big) {
    var input = $("input", root), pop = $(".sx-pop", root), items = [], cur = -1;
    function close() { pop.hidden = true; cur = -1; }
    function render() {
      var q = input.value.trim();
      if (q.length < 2) return close();
      items = search(q, 7);
      var all = search(q).length;
      pop.innerHTML = items.length ? items.map(function (d, i) {
        var t = TYPE[d.type] || TYPE.autre;
        return '<a class="sx-it" data-i="' + i + '" href="#/d/' + enc(d.id) + '"><span class="ti">' + ic(t.icon) + '</span><span><b>' + hl(d.title, q) + "</b><span>" + esc(d.rubLabel) + (d.sousLabel ? " › " + esc(d.sousLabel) : "") + "</span></span></a>";
      }).join("") + '<a class="sx-all" href="#/recherche/' + enc(q) + '"><span>Voir les ' + all + " résultat" + (all > 1 ? "s" : "") + "</span>" + ic("arrow") + "</a>"
        : '<div class="sx-empty">Aucun document ne correspond à « ' + esc(q) + " ». Essayez un mot plus court (ex. « convention », « logo », « CRM »).</div>";
      pop.hidden = false; cur = -1;
    }
    function mark(n) { var els = $$(".sx-it", pop); els.forEach(function (e, i) { e.classList.toggle("on", i === n); }); cur = n; if (els[n]) els[n].scrollIntoView({ block: "nearest" }); }
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", function (e) {
      var els = $$(".sx-it", pop);
      if (e.key === "ArrowDown") { e.preventDefault(); mark(Math.min(els.length - 1, cur + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); mark(Math.max(0, cur - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); var q = input.value.trim(); if (cur >= 0 && els[cur]) location.hash = els[cur].getAttribute("href"); else if (q) location.hash = "#/recherche/" + enc(q); close(); input.blur(); }
      else if (e.key === "Escape") { close(); input.blur(); }
    });
    document.addEventListener("click", function (e) { if (!root.contains(e.target)) close(); });
    pop.addEventListener("click", function () { close(); });
    return { input: input, set: function (v) { input.value = v; } };
  }
  function searchBox(id, ph, kbd) {
    return '<div class="sx" id="' + id + '"><label class="sx-box">' + ic("search") + '<span class="sr">Rechercher</span><input type="search" autocomplete="off" placeholder="' + esc(ph) + '">' + (kbd ? "<kbd>/</kbd>" : "") + '</label><div class="sx-pop" hidden></div></div>';
  }

  /* ---------- structure fixe ---------- */
  var topSearch;
  function shell() {
    document.title = (SITE.name || "Hub") + " — Docs On The Road";
    $("#top").innerHTML = '<div class="wrap"><a class="brand" href="#/" aria-label="Accueil"><img class="b-light" src="assets/img/globe-blanc.png" alt=""><img class="b-dark" src="assets/img/favicon.png" alt=""><span>' + esc(SITE.name || "Hub") + "<small>Docs On The Road</small></span></a>" +
      searchBox("sx-top", "Rechercher un document…", false).replace('class="sx"', 'class="sx top-search"') +
      '<nav class="nav" aria-label="Navigation"><a href="#/">' + ic("home") + '<span>Accueil</span></a><a href="#/route">' + ic("compass") + '<span>La Route</span></a><a href="#/guide">' + ic("book") + "<span>Guide</span></a></nav></div>";
    topSearch = bindSearch($("#sx-top"));
    var repo = repoUrl();
    var ft = $("#foot"); if (ft) ft.remove();
    (function () { /* survol prolongé : la bulle grossit et dévoile son contenu */
      if (window.__bwHover) return; window.__bwHover = 1; var tm = 0, cur = null;
      document.addEventListener("mouseover", function (e) { var w = e.target.closest && e.target.closest(".bw"); if (w === cur) return; clearTimeout(tm); if (cur) cur.classList.remove("open"); cur = w; if (w) tm = setTimeout(function () { w.classList.add("open"); }, 450); });
      document.addEventListener("focusin", function (e) { var w = e.target.closest && e.target.closest(".bw"); if (w) { clearTimeout(tm); tm = setTimeout(function () { w.classList.add("open"); }, 450); } });
      document.addEventListener("focusout", function (e) { var w = e.target.closest && e.target.closest(".bw"); if (w) { clearTimeout(tm); w.classList.remove("open"); } });
    })();
    $(".brand").addEventListener("click", function () { if (location.hash === "#/" || !location.hash) window.scrollTo({ top: 0, behavior: "smooth" }); });
  }
  function repoUrl() {
    if (SITE.repo) return SITE.repo;
    var m = location.hostname.match(/^([^.]+)\.github\.io$/); if (!m) return "";
    var seg = location.pathname.split("/").filter(Boolean)[0]; return "https://github.com/" + m[1] + (seg ? "/" + seg : "");
  }
  function setMode(home) {
    document.body.classList.toggle("home", home);
    document.body.classList.toggle("solid", !home || window.scrollY > 24);
  }
  window.addEventListener("scroll", function () { if (document.body.classList.contains("home")) document.body.classList.toggle("solid", window.scrollY > 24); }, { passive: true });

  /* ---------- pages ---------- */
  var app = $("#app"), stopGlobe = null, lastRoute = null;
  function mount(html, home) {
    if (stopGlobe) { stopGlobe(); stopGlobe = null; }
    app.innerHTML = '<div class="page">' + html + "</div>"; setMode(!!home);
  }
  function profil() { return store.get("hub.profil") || ""; }


  /* ---------- La Route du Relais ---------- */
  var seen = {}; try { seen = JSON.parse(store.get("hub.seen") || "{}") || {}; } catch (e) { seen = {}; }
  function markSeen(id) { if (!seen[id]) { seen[id] = 1; store.set("hub.seen", JSON.stringify(seen)); } }
  function resolveStep(s) {
    if (s.path) return byId[s.path] ? [byId[s.path]] : [];
    if (s.dossier) return docs.filter(function (d) { return d.path.indexOf(s.dossier + "/") === 0; }).sort(cmp);
    return [];
  }
  function relaisDocs(r) {
    var out = [], ids = {};
    (r.moments || []).forEach(function (m) { (m.docs || []).forEach(function (s) { resolveStep(s).forEach(function (d) { if (!ids[d.id]) { ids[d.id] = 1; out.push(d); } }); }); });
    return out;
  }
  var docRel = {};
  RELAIS.forEach(function (r, i) { relaisDocs(r).forEach(function (d) { (docRel[d.id] = docRel[d.id] || []).push(i); }); });
  function routeStops() {
    return RELAIS.map(function (r) {
      var l = relaisDocs(r), n = l.length, v = l.filter(function (d) { return seen[d.id]; }).length;
      return '<a class="stop" href="#/relais/' + enc(r.id) + '"><div class="num bc-' + (r.color || "blue") + '">' + ic(r.icon || "compass") + "<sup>" + r.n + "</sup></div><b>" + esc(r.label) + "</b><p>" + esc(r.tagline || "") + '</p><span class="prog' + (n && v === n ? " done" : "") + '">' + (v ? v + " / " + n + " consultés" : n + " documents") + "</span></a>";
    }).join("");
  }
  function routePage() {
    mount('<header class="phead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a>' + ic("chevron") + "<span>La Route du Relais</span></div><h1><span class=\"hi bc-blue\">" + ic("compass") + "</span>" + esc(ROUTE.titre || "La Route du Relais") + "</h1><p>" + esc(ROUTE.intro || "") + '</p></div></header><div class="wrap"><section class="s"><div class="route">' + routeStops() + '</div><div class="route-cta"><a class="btn pri inline" href="#/relais/' + enc((RELAIS[0] || {}).id) + '">' + ic("arrow") + " Commencer par le relais 1</a></div></section></div>");
  }
  function relaisPage(id) {
    var idx = -1; RELAIS.forEach(function (r, i) { if (r.id === id) idx = i; });
    if (idx < 0) return notFound();
    var r = RELAIS[idx], all = relaisDocs(r), v = all.filter(function (d) { return seen[d.id]; }).length;
    var dots = RELAIS.map(function (x, i) { return '<a href="#/relais/' + enc(x.id) + '" class="' + (i === idx ? "on" : "") + '" title="' + esc(x.label) + '" aria-label="Relais ' + x.n + " : " + esc(x.label) + '">' + x.n + "</a>"; }).join("");
    var body = (r.moments || []).map(function (m, mi) {
      var items = (m.docs || []).map(function (st) {
        if (st.dossier) {
          var l = resolveStep(st); if (!l.length) return "";
          var parts = st.dossier.split("/"), rub = parts[1], sous = parts[2] || "";
          return '<li class="step"><span class="n">' + ic("folder") + '</span><a class="sc" href="#/r/' + enc(rub) + (sous ? "/" + enc(sous) : "") + '"><div style="min-width:0"><h4>Dossier « ' + esc(l[0].sousLabel || prettySous(sous)) + " » · " + l.length + " document" + (l.length > 1 ? "s" : "") + "</h4><p class=\"why\">" + esc(st.why || "") + '</p></div><span class="go">' + ic("chevron") + "</span></a></li>";
        }
        var d = byId[st.path]; if (!d) return "";
        var t = TYPE[d.type] || TYPE.autre;
        return '<li class="step' + (seen[d.id] ? " vu" : "") + '"><span class="n">' + ic("file") + '</span><a class="sc" href="#/d/' + enc(d.id) + '"><div class="st">' + media(d) + '</div><div style="min-width:0"><h4>' + esc(d.title) + '</h4><p class="why">' + esc(st.why || d.desc || "") + ' <span class="badge b-' + d.type + '">' + t.label + "</span> " + esc(meta(d)) + '</p></div><span class="go">' + ic("chevron") + '</span></a><span class="seen" title="Déjà consulté">' + ic("check") + "</span></li>";
      }).join("");
      return '<div class="moment"><h3><i>' + (mi + 1) + "</i>" + esc(m.titre) + '</h3><ol class="steps">' + items + "</ol></div>";
    }).join("");
    var prev = RELAIS[idx - 1], next = RELAIS[idx + 1];
    mount('<header class="phead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a>' + ic("chevron") + '<a href="#/route">La Route du Relais</a>' + ic("chevron") + "<span>Relais " + r.n + "</span></div><h1><span class=\"hi bc-" + (r.color || "blue") + '">' + ic(r.icon) + "</span>" + esc(r.n + ". " + r.label) + "</h1><p>" + esc(r.tagline || "") + " " + all.length + " document" + (all.length > 1 ? "s" : "") + (v ? " · " + v + " déjà consulté" + (v > 1 ? "s" : "") : "") + '.</p><div class="dots">' + dots + '</div></div></header><div class="wrap"><div class="story">' + esc(r.story || "") + "</div>" + body +
      '<nav class="relnav">' + (prev ? '<a href="#/relais/' + enc(prev.id) + '">' + ic("chevron", "flip") + '<span><small>Relais précédent</small>' + esc(prev.n + ". " + prev.label) + "</span></a>" : "") +
      (next ? '<a class="next" href="#/relais/' + enc(next.id) + '"><span><small>' + esc(r.question || "Relais suivant") + "</small>" + esc("Relais " + next.n + " · " + next.label) + "</span>" + ic("arrow") + "</a>" : '<a class="next" href="#/route"><span><small>Vous avez fait le tour</small>Revoir la route</span>' + ic("compass") + "</a>") + "</nav></div>");
  }

  function home() {
    var pf = profil();
    var bub = RUBS.map(function (r) {
      var n = docs.filter(function (d) { return d.rub === r.id; }).length; if (!n) return "";
      var dim = pf && (r.profils || []).length && r.profils.indexOf(pf) < 0;
      return '<a class="bw' + (dim ? " dim" : "") + '" href="#/r/' + enc(r.id) + '"><div class="bubble bc-' + (r.color || "blue") + '">' + ic(r.icon || "folder") + "<b>" + esc(r.label) + "</b><small class=\"bd\">" + esc(r.desc || "") + "</small><em>" + n + '</em></div><span class="sr">' + esc(r.desc || "") + "</span></a>";
    }).join("") + '<a class="bw" href="#/coffre"><div class="bubble bc-vault">' + ic("lock") + '<b>Coffre</b><small class="bd">Documents sensibles chiffrés : formulaires nominatifs, signatures, répertoires. Code d\'accès requis.</small><em>Code requis</em></div><span class="sr">Documents sensibles, accessibles avec un code.</span></a>';
    var pc = PARCOURS.map(function (p) {
      var n = parcoursDocs(p).length; if (!n) return "";
      return '<a class="pcard" href="#/p/' + enc(p.id) + '"><span class="pi">' + ic(p.icon || "arrow") + "</span><span><b>" + esc(p.label) + "</b><span>" + esc(p.desc || "") + "</span></span></a>";
    }).join("");
    var ess = docs.filter(function (d) { return d.essentiel; }); if (pf) { var f = ess.filter(function (d) { return (d.profils || []).indexOf(pf) >= 0; }); if (f.length >= 3) ess = f; }
    var last = docs.filter(function (d) { return d.date; }).sort(function (a, b) { return b.date.localeCompare(a.date) || cmp(a, b); }).slice(0, 8);
    var chips = PROFILS.map(function (p) { return '<button class="chip" type="button" data-p="' + esc(p.id) + '" aria-pressed="' + (pf === p.id) + '">' + esc(p.label) + "</button>"; }).join("");
    var rise = ""; for (var i = 0; i < 14; i++) { var s = 14 + Math.round(Math.random() * 70); rise += '<i style="left:' + Math.round(Math.random() * 100) + "%;width:" + s + "px;height:" + s + "px;animation-duration:" + (14 + Math.round(Math.random() * 22)) + "s;animation-delay:-" + Math.round(Math.random() * 30) + "s;--sx:" + (Math.round(Math.random() * 80) - 40) + 'px"></i>'; }
    var nm = esc(SITE.name || "Hub").replace(/(\S+)$/, "<span>$1</span>");
    mount('<header class="hero"><div class="hero-bubbles" aria-hidden="true">' + rise + '</div><div class="hero-art" aria-hidden="true"><canvas id="globe"></canvas>' + (window.HubCompass ? window.HubCompass.art() : "") + '<canvas id="globeF"></canvas></div><div class="wrap">' +
      '<h1>' + nm + '</h1><p class="slogan"><b>' + esc(SITE.slogan || "") + "</b><br>" + esc(SITE.baseline || "") + "</p>" +
      searchBox("sx-hero", window.innerWidth < 600 ? "Rechercher un document…" : "Que cherchez-vous ? convention, logo, CRM, tuto Healphi…", true) +
      '<div class="persona"><span>Je suis…</span>' + chips + "</div></div></header>" +
      '<div class="wrap"><nav class="bubbles" aria-label="Rubriques">' + bub + "</nav>" +
      (RELAIS.length ? '<section class="s route-sec"><div class="s-h"><div><h2>' + esc(ROUTE.titre || "La Route du Relais") + "</h2><p>Retrouvez le nord : de la découverte de DOTR au suivi des établissements, étape par étape</p></div></div><div class=\"route\">" + routeStops() + '</div><div class="route-cta"><a class="btn pri inline" href="#/relais/' + enc(RELAIS[0].id) + '">' + ic("arrow") + " Commencer la route</a></div></section>" : "") +
      '<section class="s"><div class="s-h"><div><h2>Je veux…</h2><p>Des parcours tout prêts pour une situation précise</p></div></div><div class="pgrid">' + pc + "</div></section>" +
      (ess.length ? '<section class="s"><div class="s-h"><div><h2>' + (pf ? "Les essentiels pour vous" : "Les essentiels") + "</h2><p>À connaître en priorité</p></div></div><div class=\"grid\">" + ess.slice(0, 8).map(function (d) { return card(d, { crumb: true, noStar: true }); }).join("") + "</div></section>" : "") +
      '<section class="s"><div class="s-h"><div><h2>Derniers documents</h2><p>Les plus récemment mis à jour</p></div></div><div class="grid">' + last.map(function (d) { return card(d, { crumb: true }); }).join("") + "</div></section></div>", true);
    stopGlobe = window.HubGlobe ? window.HubGlobe.mount($("#globe"), $("#globeF")) : null;
    var sb = bindSearch($("#sx-hero"), true);
    $$(".chip[data-p]").forEach(function (b) { b.addEventListener("click", function () { var v = b.dataset.p === profil() ? "" : b.dataset.p; store.set("hub.profil", v); home(); }); });
  }

  function rubric(id, focus) {
    var r = rubById[id]; if (!r) return notFound();
    var list = inRub(id).concat(window.HubTeam ? window.HubTeam.pendingDocs(id) : []), state = { type: "", q: "" };
    var types = {}; list.forEach(function (d) { types[d.type] = (types[d.type] || 0) + 1; });
    var order = Object.keys(r.sous || {});
    mount('<header class="phead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a>' + ic("chevron") + "<span>" + esc(r.label) + '</span></div><h1><span class="hi bc-' + (r.color || "blue") + '">' + ic(r.icon) + "</span>" + esc(r.label) + "</h1><p>" + esc(r.desc || "") + '</p><div class="team-bar" id="teambar" data-rub="' + esc(id) + '"></div></div></header>' +
      '<div class="wrap"><div class="tools" id="tools"><button class="fchip" data-t="" aria-pressed="true">Tout<small>' + list.length + "</small></button>" +
      Object.keys(types).map(function (t) { return '<button class="fchip" data-t="' + t + '" aria-pressed="false">' + (TYPE[t] || TYPE.autre).label + "<small>" + types[t] + "</small></button>"; }).join("") +
      '<label class="local">' + ic("search") + '<span class="sr">Filtrer</span><input id="lq" type="search" placeholder="Filtrer dans cette rubrique…"></label></div><div id="subnav"></div><div id="groups"></div></div>');
    function draw() {
      var q = state.q ? tokens(state.q) : [];
      var l = list.filter(function (d) { return (!state.type || d.type === state.type) && q.every(function (t) { return d.hay.indexOf(t) >= 0; }); });
      var gs = {}; l.forEach(function (d) { (gs[d.sous] = gs[d.sous] || []).push(d); });
      var keys = Object.keys(gs).sort(function (a, b) { var ia = order.indexOf(a), ib = order.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b); });
      $("#subnav").innerHTML = keys.length > 1 ? '<div class="subnav">' + keys.map(function (k) { return '<a href="#" data-g="' + esc(k) + '">' + esc((r.sous || {})[k] || prettySous(k)) + "</a>"; }).join("") + "</div>" : "";
      $("#groups").innerHTML = keys.length ? keys.map(function (k) {
        return '<section class="grp" id="g-' + esc(slug(k)) + '" data-sous="' + esc(k) + '"><h3>' + esc(k ? ((r.sous || {})[k] || prettySous(k)) : "Documents") + "<span>" + gs[k].length + '</span></h3><div class="grid">' + gs[k].map(function (d) { return card(d, { hl: state.q }); }).join("") + "</div></section>";
      }).join("") : '<div class="empty">Aucun document ne correspond à ce filtre.</div>';
      $$("#subnav a").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var el = document.getElementById("g-" + slug(a.dataset.g)); if (el) el.scrollIntoView({ behavior: "smooth" }); }); });
      if (window.HubTeam) window.HubTeam.decorate();
    }
    $$("#tools .fchip").forEach(function (b) { b.addEventListener("click", function () { state.type = b.dataset.t; $$("#tools .fchip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); draw(); }); });
    $("#lq").addEventListener("input", function (e) { state.q = e.target.value; draw(); });
    draw();
    if (focus) { var fe = document.getElementById("g-" + slug(focus)); if (fe) setTimeout(function () { fe.scrollIntoView({ behavior: "smooth" }); }, 60); }
  }
  var slug = function (s) { return norm(s).replace(/[^a-z0-9]+/g, "-"); };

  function parcoursDocs(p) {
    var out = [], seen = {};
    (p.steps || []).forEach(function (s) {
      if (s.path && byId[s.path] && !seen[s.path]) { seen[s.path] = 1; out.push(byId[s.path]); }
      else if (s.dossier) docs.filter(function (d) { return d.path.indexOf(s.dossier + "/") === 0 && !seen[d.id]; }).sort(cmp).forEach(function (d) { seen[d.id] = 1; out.push(d); });
    });
    return out;
  }
  function parcours(id) {
    var p = PARCOURS.filter(function (x) { return x.id === id; })[0]; if (!p) return notFound();
    var l = parcoursDocs(p);
    mount('<header class="phead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a>' + ic("chevron") + "<span>Parcours</span></div><h1><span class=\"hi bc-blue\">" + ic(p.icon) + "</span>" + esc(p.label) + "</h1><p>" + esc(p.desc || "") + " " + l.length + ' document' + (l.length > 1 ? "s" : "") + ' à suivre dans l\'ordre.</p></div></header><div class="wrap"><ol class="steps">' +
      l.map(function (d, i) {
        var t = TYPE[d.type] || TYPE.autre;
        return '<li class="step"><span class="n">' + (i + 1) + '</span><a class="sc" href="#/d/' + enc(d.id) + '"><div class="st">' + media(d) + '</div><div style="min-width:0"><h4>' + esc(d.title) + "</h4><p>" + (d.when ? esc(d.when) : esc(d.desc)) + ' <span class="badge b-' + d.type + '">' + t.label + "</span> " + esc(meta(d)) + '</p></div><span class="go">' + ic("chevron") + "</span></a></li>";
      }).join("") + "</ol></div>");
  }

  function results(q) {
    var l = search(q), by = {}; l.forEach(function (d) { by[d.rub] = (by[d.rub] || 0) + 1; });
    var f = "";
    mount('<header class="phead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a>' + ic("chevron") + "<span>Recherche</span></div><h1>" + l.length + " résultat" + (l.length > 1 ? "s" : "") + " pour « " + esc(q) + " »</h1></div></header><div class=\"wrap\"><div class=\"tools\" id=\"tools\"><button class=\"fchip\" data-r=\"\" aria-pressed=\"true\">Toutes les rubriques<small>" + l.length + "</small></button>" +
      RUBS.filter(function (r) { return by[r.id]; }).map(function (r) { return '<button class="fchip" data-r="' + r.id + '" aria-pressed="false">' + esc(r.label) + "<small>" + by[r.id] + "</small></button>"; }).join("") + '</div><div class="res" id="res"></div></div>');
    function draw() { var x = f ? l.filter(function (d) { return d.rub === f; }) : l; $("#res").innerHTML = x.length ? x.map(function (d) { return row(d, q); }).join("") : '<div class="empty"><p>Aucun résultat. Essayez un mot plus court ou un synonyme.</p><p style="margin-top:10px"><a class="fchip" href="#/">Retour à l\'accueil</a></p></div>'; }
    $$("#tools .fchip").forEach(function (b) { b.addEventListener("click", function () { f = b.dataset.r; $$("#tools .fchip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); draw(); }); });
    draw();
  }

  function notFound() { mount('<header class="phead"><div class="wrap"><h1>Page introuvable</h1><p>Ce lien ne mène à rien (le document a peut-être été déplacé).</p></div></header><div class="wrap"><p style="margin-top:30px"><a class="btn pri" style="display:inline-flex" href="#/">' + ic("home") + " Retour à l'accueil</a></p></div>"); }

  /* ---------- guide ---------- */
  function guide() {
    var repo = repoUrl();
    var lk = repo ? ` (<a href="${esc(repo)}" target="_blank" rel="noopener" style="color:var(--blue);text-decoration:underline">lien</a>)` : "";
    mount(`<header class="phead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a>${ic("chevron")}<span>Guide</span></div>
<h1><span class="hi bc-yellow">${ic("book")}</span>Mode d'emploi du Relais</h1><p>Retrouver, ajouter, remplacer ou supprimer un document, sans toucher au code.</p></div></header>
<div class="wrap"><div class="guide">

<div class="gcard"><h3><span class="gi">${ic("compass")}</span>Retrouver un document</h3>
<p>Trois façons, au choix : suivre <b>La Route du Relais</b> (huit étapes, de la découverte de DOTR au suivi des établissements, avec une courte explication pour chaque document), cliquer sur une <b>bulle</b> de rubrique, ou taper quelques lettres dans la <b>barre de recherche</b> (touche <code>/</code> ou <code>Ctrl</code>+<code>K</code>). Le document s'ouvre directement : aperçu à gauche, boutons <b>Télécharger</b> et <b>Copier le lien</b> à droite.</p></div>

<div class="gcard"><h3><span class="gi">${ic("upload")}</span>Ajouter un document</h3>
<ol><li>Ouvrez l'onglet (la bulle) où le document doit apparaître.</li>
<li>Cliquez sur <b>Ajouter un document</b> (ou sur <b>Ajouter ici</b> à côté d'un dossier précis).</li>
<li>Saisissez votre <b>code d'accès équipe</b> (une seule fois par visite ; case « rester connecté » possible sur votre ordinateur).</li>
<li>Glissez le fichier (PDF, Word, Excel, PowerPoint, image, MP4 ; 25 Mo maximum), vérifiez le titre, choisissez le dossier, validez.</li></ol>
<p>Le document apparaît pour tout le monde au bout de <b>1 à 3 minutes</b> ; en attendant, vous le voyez en pointillés dans l'onglet.</p></div>

<div class="gcard"><h3><span class="gi">${ic("refresh")}</span>Mettre à jour un document (tableaux Excel, Word modifiables)</h3>
<ol><li>Ouvrez le document et cliquez sur <b>Télécharger</b>.</li><li>Modifiez-le sur votre ordinateur, <b>sans changer son format</b> (un .xlsx reste un .xlsx).</li><li>Revenez sur le document, cliquez sur <b>Espace équipe ▸ Remplacer par une nouvelle version</b> et choisissez votre fichier.</li></ol>
<p>Le fichier garde son nom et sa place ; tout le monde voit la nouvelle version après 1 à 3 minutes. L'ancienne version reste dans l'historique et peut être restaurée.</p></div>

<div class="gcard"><h3><span class="gi">${ic("lock")}</span>Supprimer un document</h3>
<p>Le bouton <b>Supprimer</b> n'apparaît qu'avec le <b>code administrateur</b>. Le document disparaît du site après 1 à 3 minutes ; une copie reste récupérable dans l'historique GitHub.</p></div>

<div class="gcard"><h3><span class="gi">${ic("lock")}</span>Le coffre sécurisé</h3>
<p>La bulle <b>Coffre</b> regroupe les documents sensibles (formulaires nominatifs, signatures, répertoires). Ils sont <b>chiffrés</b> : sans le code du coffre, ils sont illisibles, même en ouvrant le dépôt GitHub. Avec le code, on peut les <b>ouvrir</b> et les <b>télécharger</b>. Pour <b>modifier</b> un document : le télécharger, le corriger sur son ordinateur, puis le <b>remplacer</b> (il est chiffré à nouveau automatiquement). Dans la fenêtre « Ajouter un document », la case <b>Sécuriser</b> envoie le fichier directement dans le coffre, chiffré ; décochée, il est publié normalement. Les documents du coffre n'apparaissent pas dans la recherche.</p></div>

<div class="gcard"><h3><span class="gi">${ic("folder")}</span>Un nouvel onglet, une nouvelle étape de la route</h3>
<p>Un nouveau dossier à l'intérieur d'un onglet se crée tout seul (« Nouveau dossier… » dans la fenêtre d'ajout). En revanche, <b>un nouvel onglet</b> (une nouvelle bulle) ou un <b>nouveau relais</b> sur la route se demande à Claude, qui adapte le site.</p></div>

<div class="gcard"><h3><span class="gi">${ic("tools")}</span>Première mise en place (administrateur, une seule fois)</h3>
<p>Les boutons « Ajouter / Remplacer / Supprimer » fonctionnent grâce à un <b>jeton d'accès GitHub</b> conservé chiffré dans le site et ouvert uniquement par les codes. Il faut le créer une fois :</p>
<ol><li>Sur GitHub${lk} : <i>Settings ▸ Developer settings ▸ Fine-grained tokens ▸ Generate new token</i>. Limitez-le à <b>ce dépôt uniquement</b>, droit <b>Contents : Read and write</b>, durée maximale.</li>
<li>Ouvrez le fichier <code>outils/configurer-acces.html</code> du dossier du site dans votre navigateur (double-clic), collez le jeton : la page génère deux codes (contributeur, administrateur) et le fichier <code>data/acces.json</code>.</li>
<li>Déposez ce fichier dans le dossier <code>data</code> du dépôt GitHub, remplacez l'ancien si besoin, puis communiquez les codes par un canal sûr.</li></ol>
<div class="note"><b>À savoir :</b> la séparation contributeur / administrateur est une protection d'usage (le bouton Supprimer n'est montré qu'avec le code administrateur). Ne donnez le code qu'à des personnes de confiance. En cas de départ, créez un nouveau jeton et de nouveaux codes : l'ancien jeton se révoque en un clic sur GitHub.</div></div>

<div class="gcard"><h3><span class="gi">${ic("edit")}</span>Autre méthode : directement dans GitHub</h3>
<p>Toujours possible : ouvrez le dépôt, entrez dans <code>documents</code> puis dans le bon dossier, <b>Add file ▸ Upload files</b>, <b>Commit changes</b>. Pour un fichier de plus de 25 Mo, utilisez GitHub Desktop. Un lien externe (YouTube, Google Sheets) s'ajoute dans <code>data/liens.json</code>.</p></div>

<div class="gcard"><h3><span class="gi">${ic("help")}</span>Bon à savoir</h3>
<ul><li>Le site n'est pas référencé par Google (balise « noindex »), mais toute personne qui connaît l'adresse peut le consulter tant qu'il est public.</li>
<li><b>Ne déposez jamais de données personnelles</b> (RPPS, adresses, dates de naissance, formulaires signés, dossiers patients) ni de <b>mots de passe</b> : n'importe quel visiteur pourrait les lire.</li>
<li>Les fichiers sont publiés tels quels : vérifiez la version avant de déposer.</li></ul></div>

</div></div>`);
  }

  /* ---------- visionneuse ---------- */
  var viewer = $("#viewer"), viewerOpen = false, lastFocus = null;
  function openViewer(d) {
    var t = TYPE[d.type] || TYPE.autre, r = rubById[d.rub] || {};
    var coarse = window.matchMedia && (matchMedia("(pointer:coarse)").matches || window.innerWidth < 860);
    var u = fileUrl(d), pv;
    if (d.type === "pdf" && !coarse) pv = '<iframe title="' + esc(d.title) + '" src="' + esc(u) + '#view=FitH&navpanes=0"></iframe>';
    else if (d.type === "video") pv = '<video controls preload="metadata" playsinline ' + (d.thumb ? 'poster="' + esc(d.thumb) + '" ' : "") + 'src="' + esc(u) + '"></video>';
    else if (d.type === "image") pv = '<img src="' + esc(u) + '" alt="' + esc(d.title) + '">';
    else pv = '<div class="v-na"><div class="big ' + (d.thumb ? "" : "tile t-" + d.type) + '">' + (d.thumb ? '<img src="' + esc(d.thumb) + '" alt="">' : ic(t.icon)) + "</div><b>" + (d.type === "lien" ? "Ce document est un lien externe" : (d.type === "pdf" ? "Aperçu intégré non disponible sur mobile" : "Aperçu non disponible pour ce format")) + "</b><p>" + (d.type === "lien" ? "Il s'ouvrira dans un nouvel onglet." : "Téléchargez-le pour l'ouvrir dans " + (d.type === "word" ? "Word" : d.type === "excel" ? "Excel" : d.type === "ppt" ? "PowerPoint" : "son application") + ".") + "</p></div>";
    var sib = docs.filter(function (x) { return x.rub === d.rub && x.sous === d.sous; }).sort(cmp);
    var link = location.href.split("#")[0] + "#/d/" + enc(d.id);
    markSeen(d.id);
    var ri = docRel[d.id] ? docRel[d.id][0] : -1, mm = /^#\/relais\/(.+)$/.exec(lastRoute || "");
    if (mm) RELAIS.forEach(function (x, i) { if (x.id === decodeURIComponent(mm[1]) && (docRel[d.id] || []).indexOf(i) >= 0) ri = i; });
    var relHtml = "";
    if (ri >= 0) {
      var rl = RELAIS[ri], rd = relaisDocs(rl), k = rd.indexOf(d), pv0 = rd[k - 1], nx0 = rd[k + 1];
      relHtml = '<a class="relchip" href="#/relais/' + enc(rl.id) + '"><em>' + rl.n + "</em>Relais " + rl.n + " · " + esc(rl.label) + "</a>" +
        ((pv0 || nx0) ? '<div class="vnav">' + (pv0 ? '<a href="#/d/' + enc(pv0.id) + '"><small>← Avant sur la route</small>' + esc(pv0.title) + "</a>" : "") + (nx0 ? '<a href="#/d/' + enc(nx0.id) + '"><small>Ensuite sur la route →</small>' + esc(nx0.title) + "</a>" : "") + "</div>" : "");
    }
    viewer.innerHTML = '<div class="v-back" data-close></div><div class="v-panel" role="dialog" aria-modal="true" aria-label="' + esc(d.title) + '"><button class="v-x" data-close aria-label="Fermer">' + ic("x") + '</button><div class="v-main">' + pv + '</div><aside class="v-side">' +
      '<div class="crumbs"><a href="#/r/' + enc(d.rub) + '">' + esc(d.rubLabel) + "</a>" + (d.sousLabel ? ic("chevron") + "<span>" + esc(d.sousLabel) + "</span>" : "") + "</div><h2>" + esc(d.title) + "</h2>" +
      '<div class="facts"><span class="badge b-' + d.type + '">' + t.label + "</span>" + (meta(d) ? "<span>" + esc(meta(d)) + "</span>" : "") + (d.date ? "<span>Mis à jour le " + esc(fmtDate(d.date)) + "</span>" : "") + "</div>" +
      (d.desc ? '<p class="desc">' + esc(d.desc) + "</p>" : "") + (d.when ? '<div class="when"><b>Quand l\'utiliser</b>' + esc(d.when) + "</div>" : "") +
      '<div class="btns">' + (d.type === "lien" ? '<a class="btn pri" href="' + esc(u) + '" target="_blank" rel="noopener">' + ic("external") + " Ouvrir le lien</a>" :
        '<a class="btn pri" href="' + esc(u) + '" download>' + ic("download") + " Télécharger</a><a class=\"btn\" href=\"" + esc(u) + '" target="_blank" rel="noopener">' + ic("external") + " Ouvrir dans un onglet</a>") +
      (d.edit ? '<a class="btn" href="' + esc(d.edit) + '" target="_blank" rel="noopener">' + ic("edit") + " Version modifiable en ligne</a>" : "") +
      '<button class="btn" type="button" data-copy="' + esc(link) + '">' + ic("link") + " Copier le lien</button></div>" +
      relHtml + '<div id="vteam" data-id="' + esc(d.id) + '"></div>' + ((d.tags || []).length ? '<div class="tags">' + d.tags.map(function (g) { return "<span>" + esc(g) + "</span>"; }).join("") + "</div>" : "") +
      (sib.length > 1 ? "<h5>Dans le même dossier</h5><div class=\"sib\">" + sib.slice(0, 14).map(function (x) { return '<a href="#/d/' + enc(x.id) + '" class="' + (x.id === d.id ? "cur" : "") + '">' + ic((TYPE[x.type] || TYPE.autre).icon) + "<span>" + esc(x.title) + "</span></a>"; }).join("") + (sib.length > 14 ? '<a href="#/r/' + enc(d.rub) + '"><span>+ ' + (sib.length - 14) + " autres…</span></a>" : "") + "</div>" : "") + "</aside></div>";
    viewer.hidden = false; viewerOpen = true; document.documentElement.style.overflow = "hidden";
    lastFocus = document.activeElement; var x = $(".v-x", viewer); if (x) x.focus();
    $$("[data-close]", viewer).forEach(function (e) { e.addEventListener("click", closeViaNav); });
    $$("[data-copy]", viewer).forEach(function (b) { b.addEventListener("click", function () { copy(b.dataset.copy); }); });
    if (window.HubTeam) window.HubTeam.decorate();
  }
  var suppress = false;
  function closeViewer() { if (!viewerOpen) return; viewer.hidden = true; viewer.innerHTML = ""; viewerOpen = false; document.documentElement.style.overflow = ""; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} }
  function closeViaNav() { location.hash = lastRoute || "#/"; }
  function copy(txt) {
    function done() { toast("Lien copié"); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
    function fallback() { var t = document.createElement("textarea"); t.value = txt; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("Copie impossible"); } t.remove(); }
  }
  var toastT; function toast(m) { var t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 1800); }

  /* ---------- routeur ---------- */
  function route() {
    var h = decodeURIComponent((location.hash || "#/").replace(/^#/, "")) || "/";
    if (h.indexOf("/d/") === 0) {
      var d = byId[h.slice(3)];
      if (d) { if (!lastRoute) { lastRoute = "#/r/" + enc(d.rub); rubric(d.rub); } openViewer(d); return; }
      h = "/";
    }
    closeViewer();
    var m;
    lastRoute = "#" + h;
    if (h === "/" || h === "") home();
    else if ((m = h.match(/^\/r\/([^/]+)(?:\/(.+))?$/))) rubric(m[1], m[2]);
    else if ((m = h.match(/^\/relais\/(.+)$/))) relaisPage(m[1]);
    else if (h === "/route") routePage();
    else if ((m = h.match(/^\/p\/(.+)$/))) parcours(m[1]);
    else if ((m = h.match(/^\/recherche\/(.*)$/))) results(m[1]);
    else if (h === "/guide") guide();
    else if (h === "/coffre") { if (window.HubCoffre) window.HubCoffre.page(); else notFound(); }
    else notFound();
    window.scrollTo(0, 0);
    if (m && h.indexOf("/recherche/") === 0 && topSearch) topSearch.set(m[1]);
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && viewerOpen) { closeViaNav(); return; }
    var tag = (e.target.tagName || "").toLowerCase(), typing = tag === "input" || tag === "textarea";
    if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault(); var i = $("#sx-hero input"); var hero = document.body.classList.contains("home") && window.scrollY < 300;
      (hero && i ? i : $("#sx-top input")).focus();
      if (!hero) { document.body.classList.add("solid"); }
    }
    if (viewerOpen && (e.key === "ArrowRight" || e.key === "ArrowLeft") && !typing) {
      var cur = $(".sib a.cur", viewer); if (!cur) return; var all = $$(".sib a[href^='#/d/']", viewer), i2 = all.indexOf(cur), n = all[i2 + (e.key === "ArrowRight" ? 1 : -1)];
      if (n) location.hash = n.getAttribute("href");
    }
  });
  window.HubApp = { mount: function (h) { mount(h, false); }, fmtDate: fmtDate, docs: docs, byId: byId, RUBS: RUBS, rubById: rubById, ic: ic, esc: esc, enc: enc, toast: toast, store: store, repoUrl: repoUrl, refreshView: function () { route(); }, generated: H.generated, TYPE: TYPE, prettySous: prettySous, slug: slug, fmtSize: fmtSize, closeViewer: function () { location.hash = lastRoute || "#/"; } };
  shell(); route();
})();
