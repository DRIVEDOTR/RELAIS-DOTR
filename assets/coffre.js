/* Coffre sécurisé du Relais DOTR : documents sensibles chiffrés (AES-256-GCM, clé dérivée du code par PBKDF2-SHA256, 600 000 itérations).
   Dans le dépôt GitHub, il n'y a que des fichiers chiffrés (coffre/xxxx.enc) et un index chiffré (data/coffre.json) : sans le code, rien n'est lisible,
   ni les titres, ni les contenus. Le déchiffrement se fait dans le navigateur de la personne qui saisit le code. */
(function () {
  "use strict";
  var API = "https://api.github.com";
  var A = function () { return window.HubApp; }, T = function () { return window.HubTeam && window.HubTeam.api; };
  var enc = new TextEncoder(), dec = new TextDecoder();
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function ss(k, v) { try { if (v === undefined) return window.sessionStorage.getItem(k); v === null ? window.sessionStorage.removeItem(k) : window.sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function b64d(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function b64e(u) { var s = ""; for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function hex(n) { var u = crypto.getRandomValues(new Uint8Array(n)), s = ""; for (var i = 0; i < n; i++) s += ("0" + u[i].toString(16)).slice(-2); return s; }

  var CF = null, KEY = null, ITEMS = null, ITER = 600000, MAXB = 25 * 1024 * 1024;
  var MIME = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", mp4: "video/mp4", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12", csv: "text/csv", ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
  var TYP = { pdf: "pdf", doc: "word", docx: "word", xls: "excel", xlsx: "excel", xlsm: "excel", csv: "excel", ppt: "ppt", pptx: "ppt", png: "image", jpg: "image", jpeg: "image", mp4: "video" };
  var extOf = function (n) { var m = /\.([A-Za-z0-9]+)$/.exec(n || ""); return m ? m[1].toLowerCase() : ""; };

  /* ---------- cryptographie ---------- */
  function derive(code, salt, n) {
    return crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveKey"]).then(function (km) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: n, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }
  function encBytes(buf) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, KEY, buf).then(function (ct) { var o = new Uint8Array(12 + ct.byteLength); o.set(iv, 0); o.set(new Uint8Array(ct), 12); return o; });
  }
  function decBytes(u8) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: u8.slice(0, 12) }, KEY, u8.slice(12)); }
  function encIndex(items) { return encBytes(enc.encode(JSON.stringify({ items: items }))).then(function (o) { return { iv: b64e(o.slice(0, 12)), c: b64e(o.slice(12)) }; }); }
  function decIndex(idx) {
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(idx.iv) }, KEY, b64d(idx.c)).then(function (pt) { return JSON.parse(dec.decode(pt)).items || []; });
  }

  /* ---------- lecture de l'index et des fichiers ---------- */
  function fetchIndex() {
    var api = T();
    if (api && api.token()) {
      return api.getFile("data/coffre.json").then(function (f) { return f && f.content ? JSON.parse(dec.decode(b64d(f.content.replace(/\s/g, "")))) : null; }).catch(function () { return pagesIndex(); });
    }
    return pagesIndex();
  }
  function pagesIndex() { return fetch("data/coffre.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function fetchEnc(id) {
    var api = T();
    return fetch("coffre/" + id + ".enc", { cache: "no-store" }).then(function (r) {
      if (r.ok) return r.arrayBuffer();
      if (api && api.token()) {
        return fetch(API + "/repos/" + api.repo() + "/contents/coffre/" + id + ".enc?ref=" + encodeURIComponent(api.branch()), { headers: { Accept: "application/vnd.github.raw", Authorization: "Bearer " + api.token() } }).then(function (r2) { if (!r2.ok) throw new Error("Fichier introuvable (il est peut-être encore en cours de publication : réessayez dans 1 à 3 minutes)."); return r2.arrayBuffer(); });
      }
      throw new Error("Fichier introuvable (il est peut-être encore en cours de publication : réessayez dans 1 à 3 minutes).");
    });
  }

  /* ---------- déverrouillage ---------- */
  function unlock(code) {
    code = String(code || "").trim();
    if (!code) return Promise.reject(new Error("Saisissez le code du coffre."));
    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error("Ce navigateur ne permet pas le déchiffrement : utilisez l'adresse officielle du site (https)."));
    return fetchIndex().then(function (cf) {
      if (!cf) { var e = new Error("Le coffre n'a pas encore été créé."); e.novault = true; throw e; }
      CF = cf; ITER = cf.n || 600000;
      return derive(code, b64d(cf.s), ITER);
    }).then(function (k) {
      KEY = k;
      return decIndex(CF.idx).catch(function () { KEY = null; var e = new Error("Code incorrect."); e.wrong = true; throw e; });
    }).then(function (items) { ITEMS = items; ss("hub.cof", code); return items; });
  }
  function lockVault() { KEY = null; ITEMS = null; ss("hub.cof", null); }
  function isOpen() { return !!(KEY && ITEMS); }

  /* ---------- aperçu / téléchargement ---------- */
  function plain(it) { return fetchEnc(it.id).then(function (buf) { return decBytes(new Uint8Array(buf)); }).then(function (pt) { return new Blob([pt], { type: MIME[it.x] || "application/octet-stream" }); }); }
  function save(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  var ov = null, ovUrl = null;
  function closeView() { if (ov) { ov.remove(); ov = null; } if (ovUrl) { URL.revokeObjectURL(ovUrl); ovUrl = null; } document.documentElement.style.overflow = ""; }
  function openView(it) {
    closeView(); var app = A();
    ov = document.createElement("div"); ov.id = "cview";
    ov.innerHTML = '<div class="cv-bar"><b>' + esc(it.t) + '</b><span class="cv-sp"></span><button class="btn sm" data-cv="dl" type="button">' + app.ic("download") + 'Télécharger</button><button class="btn sm" data-cv="x" type="button">' + app.ic("x") + 'Fermer</button></div><div class="cv-body"><div class="cv-load">Déchiffrement en cours…</div></div>';
    document.body.appendChild(ov); document.documentElement.style.overflow = "hidden";
    var blob = null, body = ov.querySelector(".cv-body");
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cv]"); if (!b) return;
      if (b.dataset.cv === "x") closeView();
      if (b.dataset.cv === "dl") { if (blob) save(blob, it.f); }
    });
    plain(it).then(function (bl) {
      if (!ov) return; blob = bl; ovUrl = URL.createObjectURL(bl); var x = it.x;
      if (x === "pdf") body.innerHTML = '<iframe title="' + esc(it.t) + '" src="' + ovUrl + '"></iframe>';
      else if (x === "png" || x === "jpg" || x === "jpeg") body.innerHTML = '<div class="cv-img"><img alt="' + esc(it.t) + '" src="' + ovUrl + '"></div>';
      else if (x === "mp4") body.innerHTML = '<video controls autoplay src="' + ovUrl + '"></video>';
      else body.innerHTML = '<div class="cv-load"><b>Aperçu indisponible pour ce type de fichier.</b><br>Cliquez sur « Télécharger » pour l\'ouvrir dans son application (' + esc(x.toUpperCase()) + ').</div>';
    }).catch(function (e) { if (body) body.innerHTML = '<div class="cv-load err">' + esc(e && e.name === "OperationError" ? "Déchiffrement impossible : le fichier est corrompu ou le code ne correspond plus." : (e.message || e)) + "</div>"; });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov) { e.stopImmediatePropagation(); closeView(); } }, true);

  /* ---------- écriture (équipe) ---------- */
  function readBuf(file) { return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = function () { ko(new Error("Lecture du fichier impossible")); }; r.readAsArrayBuffer(file); }); }
  function updateIndex(fn, n) {
    var api = T(); n = n || 0;
    return api.getFile("data/coffre.json").then(function (f) {
      var cur = f && f.content ? JSON.parse(dec.decode(b64d(f.content.replace(/\s/g, "")))) : null, base;
      if (cur) { CF = cur; base = decIndex(cur.idx).catch(function () { var e = new Error("Le code saisi ne correspond pas à celui du coffre."); e.wrong = true; throw e; }); }
      else base = Promise.resolve([]);
      return base.then(function (items) {
        var out = fn(items) || items; ITEMS = out;
        return encIndex(out).then(function (idx) {
          var o = { v: 1, n: ITER, s: CF && CF.s ? CF.s : b64e(crypto.getRandomValues(new Uint8Array(16))), idx: idx }; CF = o;
          return api.putFile("data/coffre.json", b64e(enc.encode(JSON.stringify(o))), "Coffre : index mis à jour (via Le Relais DOTR)", f && f.sha);
        });
      });
    }).catch(function (e) { if ((e.status === 409 || e.status === 422) && n < 3) return updateIndex(fn, n + 1); throw e; });
  }
  /* crée le coffre au tout premier ajout si nécessaire (le code saisi devient alors le code du coffre) */
  function ensureKey(code) {
    if (isOpen()) return Promise.resolve();
    return unlock(code).catch(function (e) {
      if (!e.novault) throw e;
      var salt = crypto.getRandomValues(new Uint8Array(16)); CF = { v: 1, n: ITER, s: b64e(salt), idx: null };
      return derive(String(code).trim(), salt, ITER).then(function (k) { KEY = k; ITEMS = []; ss("hub.cof", String(code).trim()); });
    });
  }
  function addFile(file, meta, code) {
    var api = T(); if (!api || !api.token()) return Promise.reject(new Error("Espace équipe non déverrouillé."));
    if (file.size > MAXB) return Promise.reject(new Error("Fichier trop volumineux (25 Mo maximum)."));
    var x = extOf(file.name); if (!TYP[x]) return Promise.reject(new Error("Ce type de fichier n'est pas accepté."));
    var id = hex(6), today = new Date().toISOString().slice(0, 10);
    return ensureKey(code).then(function () { return readBuf(file); }).then(function (buf) { return encBytes(buf); }).then(function (bytes) {
      return api.putFile("coffre/" + id + ".enc", b64e(bytes), "Coffre : nouveau document chiffré (via Le Relais DOTR)");
    }).then(function () {
      return updateIndex(function (items) { items.push({ id: id, t: meta.title || api.prettyTitle(file.name), f: file.name, x: x, z: file.size, g: meta.group || "Divers", d: today, desc: meta.desc || "" }); return items; });
    }).then(function () { return id; });
  }
  function replaceFile(it, file) {
    var api = T(); if (file.size > MAXB) return Promise.reject(new Error("Fichier trop volumineux (25 Mo maximum)."));
    var x = extOf(file.name); if (!TYP[x]) return Promise.reject(new Error("Ce type de fichier n'est pas accepté."));
    return readBuf(file).then(encBytes).then(function (bytes) {
      return api.getFile("coffre/" + it.id + ".enc").then(function (ex) { return api.putFile("coffre/" + it.id + ".enc", b64e(bytes), "Coffre : nouvelle version chiffrée (via Le Relais DOTR)", ex && ex.sha); });
    }).then(function () {
      return updateIndex(function (items) { items.forEach(function (i) { if (i.id === it.id) { i.f = file.name; i.x = x; i.z = file.size; i.d = new Date().toISOString().slice(0, 10); } }); return items; });
    });
  }
  function removeFile(it) {
    var api = T();
    return api.getFile("coffre/" + it.id + ".enc").then(function (ex) { return ex ? api.delFile("coffre/" + it.id + ".enc", ex.sha, "Coffre : document supprimé (via Le Relais DOTR)") : null; })
      .then(function () { return updateIndex(function (items) { return items.filter(function (i) { return i.id !== it.id; }); }); });
  }

  /* ---------- boîtes de dialogue ---------- */
  function replaceDialog(it, redraw) {
    var api = T(), app = A();
    var m = api.openModal("<h2>Remplacer par une nouvelle version</h2><p class=\"sub\">« " + esc(it.t) + " » sera chiffré à nouveau et remplacera l'ancienne version, au même endroit du coffre. Astuce : téléchargez-le d'abord, modifiez-le sur votre ordinateur, puis déposez-le ici.</p>" +
      '<div class="drop" id="mdrop" tabindex="0">' + app.ic("upload") + '<b>Glissez la nouvelle version ici ou cliquez</b>25 Mo maximum · chiffrement automatique</div><input type="file" id="mfile" hidden><div id="mfn"></div><div id="merr"></div>' +
      '<div class="acts"><button class="btn" data-mclose type="button">Annuler</button><button class="btn pri" id="mgo" type="button">Chiffrer et remplacer</button></div>');
    var file = null, drop = m.querySelector("#mdrop"), inp = m.querySelector("#mfile"), err = m.querySelector("#merr"), go = m.querySelector("#mgo");
    function pick(f) { if (!f) return; file = f; err.innerHTML = ""; m.querySelector("#mfn").innerHTML = '<div class="fname">' + app.ic("check") + esc(f.name) + " · " + app.fmtSize(f.size) + "</div>"; }
    drop.addEventListener("click", function () { inp.click(); });
    inp.addEventListener("change", function () { pick(inp.files[0]); });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { pick(e.dataTransfer.files[0]); });
    go.addEventListener("click", function () {
      if (!file) { err.innerHTML = '<div class="err">Choisissez d\'abord le fichier.</div>'; return; }
      go.disabled = true; go.textContent = "Chiffrement et envoi…"; err.innerHTML = "";
      replaceFile(it, file).then(function () { api.closeModal(); app.toast("Nouvelle version chiffrée envoyée"); redraw(); })
        .catch(function (e) { go.disabled = false; go.textContent = "Chiffrer et remplacer"; err.innerHTML = '<div class="err">' + esc(api.errMsg(e)) + "</div>"; });
    });
  }
  function deleteDialog(it, redraw) {
    var api = T();
    var m = api.openModal("<h2>Supprimer ce document ?</h2><p class=\"sub\">« " + esc(it.t) + " » sera retiré du coffre pour tout le monde. Une copie chiffrée reste dans l'historique GitHub.</p><div id=\"merr\"></div><div class=\"acts\"><button class=\"btn\" data-mclose type=\"button\">Annuler</button><button class=\"btn pri warnb\" id=\"mgo\" type=\"button\">Oui, supprimer</button></div>");
    var go = m.querySelector("#mgo"), err = m.querySelector("#merr");
    go.addEventListener("click", function () {
      go.disabled = true; go.textContent = "Suppression…";
      removeFile(it).then(function () { api.closeModal(); A().toast("Document supprimé du coffre"); redraw(); })
        .catch(function (e) { go.disabled = false; go.textContent = "Oui, supprimer"; err.innerHTML = '<div class="err">' + esc(api.errMsg(e)) + "</div>"; });
    });
  }

  /* ---------- page « Coffre » ---------- */
  function groups() { var g = {}; (ITEMS || []).forEach(function (i) { g[i.g || "Divers"] = 1; }); return Object.keys(g).sort(function (a, b) { return a.localeCompare(b, "fr"); }); }
  function page() {
    var app = A(), api = T(), q = "";
    app.mount('<header class="phead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a>' + app.ic("chevron") + '<span>Coffre</span></div><h1><span class="hi bc-night">' + app.ic("lock") + '</span>Coffre sécurisé</h1><p>Documents sensibles (formulaires nominatifs, signatures, répertoires…). Ils sont chiffrés : sans le code, ils sont illisibles, même depuis GitHub.</p></div></header><div class="wrap" id="cof"></div>');
    var root = document.getElementById("cof");
    function locked(msg) {
      root.innerHTML = '<div class="cof-gate"><div class="cg-ic">' + app.ic("lock") + '</div><h2>Accès protégé</h2><p>Saisissez le code du coffre pour afficher et déchiffrer les documents.</p>' +
        '<form id="cgf" autocomplete="off"><input type="password" id="cgc" placeholder="Code du coffre" autocomplete="off" spellcheck="false"><button class="btn pri" type="submit">' + app.ic("lock") + 'Déverrouiller</button></form><div id="cge">' + (msg ? '<div class="err">' + esc(msg) + "</div>" : "") + '</div></div>';
      var f = document.getElementById("cgf"), inp = document.getElementById("cgc"), btn = f.querySelector("button");
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 40);
      f.addEventListener("submit", function (e) {
        e.preventDefault(); btn.disabled = true; btn.lastChild.textContent = "Vérification…"; document.getElementById("cge").innerHTML = "";
        unlock(inp.value).then(draw).catch(function (er) { btn.disabled = false; btn.lastChild.textContent = "Déverrouiller"; document.getElementById("cge").innerHTML = '<div class="err">' + esc(er.wrong ? "Code incorrect." : er.novault ? "Le coffre n'est pas encore en ligne. Il apparaîtra quelques minutes après sa mise en ligne." : (er.message || er)) + "</div>"; });
      });
    }
    function draw() {
      if (!isOpen()) return locked();
      var team = api && api.token(), items = ITEMS.slice();
      var qq = q ? q.toLowerCase() : "";
      var l = items.filter(function (i) { return !qq || (i.t + " " + i.f + " " + (i.g || "") + " " + (i.desc || "")).toLowerCase().indexOf(qq) >= 0; });
      var gs = {}; l.forEach(function (i) { (gs[i.g || "Divers"] = gs[i.g || "Divers"] || []).push(i); });
      var keys = Object.keys(gs).sort(function (a, b) { return a.localeCompare(b, "fr"); });
      root.innerHTML = '<div class="cof-tools"><label class="local">' + app.ic("search") + '<span class="sr">Filtrer</span><input id="cq" type="search" placeholder="Filtrer dans le coffre…" value="' + esc(q) + '"></label><span class="cv-sp"></span>' +
        '<button class="btn sm' + (team ? " pri" : "") + '" id="cadd" type="button">' + app.ic("plus") + 'Ajouter un document</button><button class="btn sm" id="clock" type="button">' + app.ic("lock") + 'Verrouiller le coffre</button></div>' +
        '<p class="cof-help">' + items.length + ' document' + (items.length > 1 ? "s" : "") + ' · <b>Modifier un document</b> : téléchargez-le, modifiez-le sur votre ordinateur, puis utilisez « Remplacer » pour le chiffrer à nouveau.</p>' +
        (keys.length ? keys.map(function (k) {
          return '<section class="grp"><h3>' + esc(k) + "<span>" + gs[k].length + '</span></h3><div class="cof-list">' + gs[k].map(function (i) {
            var tp = TYP[i.x] || "autre", t = (app.TYPE[tp] || app.TYPE.autre);
            return '<div class="crow" data-id="' + esc(i.id) + '"><div class="tile t-' + tp + ' sm">' + app.ic(t.icon) + '</div><div class="cr-m"><h4>' + esc(i.t) + '</h4><p><span class="badge b-' + tp + '">' + esc(i.x.toUpperCase()) + "</span> " + esc(app.fmtSize(i.z)) + (i.d ? " · " + esc(app.fmtDate(i.d)) : "") + (i.desc ? " · " + esc(i.desc) : "") + '</p></div><div class="cr-a">' +
              '<button class="btn sm" data-a="open" type="button">' + app.ic("eye") + 'Ouvrir</button><button class="btn sm" data-a="dl" type="button">' + app.ic("download") + 'Télécharger</button>' +
              (team ? '<button class="btn sm" data-a="rep" type="button">' + app.ic("refresh") + 'Remplacer</button>' : "") + (team && api.role() === "admin" ? '<button class="btn sm warn" data-a="del" type="button">' + app.ic("trash") + "Supprimer</button>" : "") + "</div></div>";
          }).join("") + "</div></section>";
        }).join("") : '<div class="empty">' + (items.length ? "Aucun document ne correspond à ce filtre." : "Le coffre est vide pour l'instant.") + "</div>");
      document.getElementById("cq").addEventListener("input", function (e) { q = e.target.value; var pos = e.target.selectionStart; draw(); var n = document.getElementById("cq"); n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} });
      document.getElementById("clock").addEventListener("click", function () { lockVault(); q = ""; locked(); });
      document.getElementById("cadd").addEventListener("click", function () { api && api.need("contrib", function () { api.addDialog("__coffre"); }); if (!api) app.toast("Espace équipe indisponible"); });
      root.querySelector(".cof-list") && root.addEventListener("click", rowClick);
    }
    function rowClick(e) {
      var b = e.target.closest("[data-a]"); if (!b) return; var row = b.closest(".crow"), it = ITEMS.filter(function (i) { return i.id === row.dataset.id; })[0]; if (!it) return;
      var a = b.dataset.a;
      if (a === "open") return openView(it);
      if (a === "dl") { b.disabled = true; return plain(it).then(function (bl) { save(bl, it.f); b.disabled = false; }).catch(function (er) { b.disabled = false; app.toast(er.message || "Téléchargement impossible"); }); }
      if (a === "rep") return api.need("contrib", function () { replaceDialog(it, draw); });
      if (a === "del") return api.need("admin", function () { deleteDialog(it, draw); });
    }
    window.HubCoffre.redraw = draw;
    var saved = ss("hub.cof");
    if (isOpen()) draw();
    else if (saved) { root.innerHTML = '<div class="cof-gate"><p>Déverrouillage…</p></div>'; unlock(saved).then(draw).catch(function () { ss("hub.cof", null); locked(); }); }
    else locked();
  }

  window.HubCoffre = {
    page: page, isOpen: isOpen, unlock: unlock, groups: groups, addFile: addFile, redraw: function () {},
    hasKeyOrSaved: function () { return isOpen() || !!ss("hub.cof"); }
  };
})();
