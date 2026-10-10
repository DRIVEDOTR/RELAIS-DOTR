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
  function teamBtns() { var api = T(), app = A(); if (!api || !api.token || !api.token()) return ""; return '<button class="btn sm" data-cv="rep" type="button">' + app.ic("refresh") + 'Remplacer</button>' + (api.role() === "admin" ? '<button class="btn sm" data-cv="del" type="button">' + app.ic("trash") + 'Supprimer</button>' : ""); }
  function back() { var app = A(); if (app && app.back) app.back(); }
  function openView(it) {
    closeView(); var app = A();
    ov = document.createElement("div"); ov.id = "cview";
    ov.innerHTML = '<div class="cv-bar"><b>' + esc(it.t) + '</b><span class="cv-sp"></span><button class="btn sm" data-cv="dl" type="button">' + app.ic("download") + 'Télécharger</button><button class="btn sm" data-cv="x" type="button">' + app.ic("x") + 'Fermer</button></div><div class="cv-body"><div class="cv-load">Déchiffrement en cours…</div></div>';
    document.body.appendChild(ov); document.documentElement.style.overflow = "hidden";
    var blob = null, body = ov.querySelector(".cv-body");
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cv]"); if (!b) return;
      if (b.dataset.cv === "x") { closeView(); back(); }
      if (b.dataset.cv === "rep") T().need("contrib", function () { replaceDialog(it, function () { closeView(); back(); }); });
      if (b.dataset.cv === "del") T().need("admin", function () { deleteDialog(it, function () { closeView(); back(); }); });
      if (b.dataset.cv === "dl") { if (blob) save(blob, it.f); }
    });
    plain(it).then(function (bl) {
      if (!ov) return; blob = bl; ovUrl = URL.createObjectURL(bl); var x = it.x;
      if (x === "pdf") body.innerHTML = '<iframe title="' + esc(it.t) + '" src="' + ovUrl + '"></iframe>';
      else if (x === "png" || x === "jpg" || x === "jpeg") body.innerHTML = '<div class="cv-img"><img alt="' + esc(it.t) + '" src="' + ovUrl + '"></div>';
      else if (x === "mp4") body.innerHTML = '<video controls autoplay src="' + ovUrl + '"></video>';
      else if (window.HubPreview && HubPreview.can(x)) { body.innerHTML = '<div class="v-prev cv-prev"></div>'; bl.arrayBuffer().then(function (ab) { HubPreview.render(body.firstChild, { buffer: ab }, x); }); }
      else body.innerHTML = '<div class="cv-load"><b>Aperçu indisponible pour ce type de fichier.</b><br>Cliquez sur « Télécharger » pour l\'ouvrir dans son application (' + esc(x.toUpperCase()) + ').</div>';
    }).catch(function (e) { if (body) body.innerHTML = '<div class="cv-load err">' + esc(e && e.name === "OperationError" ? "Déchiffrement impossible : le fichier est corrompu ou le code ne correspond plus." : (e.message || e)) + "</div>"; });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov && !document.getElementById("modal")) { e.stopImmediatePropagation(); closeView(); back(); } }, true);

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
    var hasTh = 0;
    return ensureKey(code).then(function () { return readBuf(file); }).then(function (buf) { return encBytes(buf); }).then(function (bytes) {
      return api.putFile("coffre/" + id + ".enc", b64e(bytes), "Coffre : nouveau document chiffré (via Le Relais DOTR)");
    }).then(function () { return thumbOfImage(file); }).then(function (tb) {
      if (!tb) return; return encBytes(tb).then(function (tbe) { return api.putFile("coffre/" + id + "_t.enc", b64e(tbe), "Coffre : vignette chiffrée (via Le Relais DOTR)"); }).then(function () { hasTh = 1; }).catch(function () {});
    }).then(function () {
      return updateIndex(function (items) { items.push({ id: id, t: meta.title || api.prettyTitle(file.name), f: file.name, x: x, z: file.size, r: meta.rub, s: meta.sous, sl: meta.sousLabel || "", o: 900, th: hasTh, d: today, desc: meta.desc || "" }); return items; });
    }).then(function () { refresh(); return id; });
  }
  function replaceFile(it, file) {
    var api = T(); if (file.size > MAXB) return Promise.reject(new Error("Fichier trop volumineux (25 Mo maximum)."));
    var x = extOf(file.name); if (!TYP[x]) return Promise.reject(new Error("Ce type de fichier n'est pas accepté."));
    return readBuf(file).then(encBytes).then(function (bytes) {
      return api.getFile("coffre/" + it.id + ".enc").then(function (ex) { return api.putFile("coffre/" + it.id + ".enc", b64e(bytes), "Coffre : nouvelle version chiffrée (via Le Relais DOTR)", ex && ex.sha); });
    }).then(function () {
      return updateIndex(function (items) { items.forEach(function (i) { if (i.id === it.id) { i.f = file.name; i.x = x; i.z = file.size; i.d = new Date().toISOString().slice(0, 10); } }); return items; });
    }).then(refresh);
  }
  function removeFile(it) {
    var api = T();
    return api.getFile("coffre/" + it.id + ".enc").then(function (ex) { return ex ? api.delFile("coffre/" + it.id + ".enc", ex.sha, "Coffre : document supprimé (via Le Relais DOTR)") : null; })
      .then(function () { return api.getFile("coffre/" + it.id + "_t.enc").then(function (t) { return t ? api.delFile("coffre/" + it.id + "_t.enc", t.sha, "Coffre : vignette supprimée (via Le Relais DOTR)") : null; }).catch(function () {}); })
      .then(function () { return updateIndex(function (items) { return items.filter(function (i) { return i.id !== it.id; }); }); }).then(refresh);
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

  /* ---------- intégration au site : les documents chiffrés apparaissent dans leur onglet d'origine ---------- */
  function refresh() { var app = A(); if (app && app.setVault) app.setVault(isOpen() ? ITEMS : []); }
  function lockDialog() {
    var app = A(), api = T(); if (!api || !api.openModal) return;
    function body(msg) {
      if (isOpen()) return "<h2>Coffre déverrouillé</h2><p class=\"sub\">" + ITEMS.length + " document" + (ITEMS.length > 1 ? "s" : "") + " chiffré" + (ITEMS.length > 1 ? "s sont" : " est") + " affiché" + (ITEMS.length > 1 ? "s" : "") + " dans leurs onglets (repérés par un cadenas).</p><div class=\"acts\"><button class=\"btn\" data-mclose type=\"button\">Fermer</button><button class=\"btn pri\" id=\"mlock\" type=\"button\">" + app.ic("lock") + "Verrouiller</button></div>";
      return "<h2>Documents sécurisés</h2><p class=\"sub\">Saisissez le code pour déchiffrer les documents sensibles. Ils apparaîtront dans leurs onglets habituels.</p><form id=\"mf\" autocomplete=\"off\"><input type=\"password\" id=\"mcode\" placeholder=\"Code d'accès\" autocomplete=\"off\" spellcheck=\"false\"><div id=\"merr\">" + (msg ? "<div class=\"err\">" + esc(msg) + "</div>" : "") + "</div><div class=\"acts\"><button class=\"btn\" data-mclose type=\"button\">Annuler</button><button class=\"btn pri\" type=\"submit\" id=\"mgo\">" + app.ic("lock") + "Déverrouiller</button></div></form>";
    }
    var m = api.openModal(body());
    function wire() {
      var f = m.querySelector("#mf"), l = m.querySelector("#mlock");
      if (l) l.addEventListener("click", function () { lockVault(); refresh(); api.closeModal(); app.toast("Coffre verrouillé"); });
      if (f) {
        var inp = m.querySelector("#mcode"), go = m.querySelector("#mgo"); setTimeout(function () { try { inp.focus(); } catch (e) {} }, 40);
        f.addEventListener("submit", function (e) {
          e.preventDefault(); go.disabled = true; go.lastChild.textContent = "Vérification…"; m.querySelector("#merr").innerHTML = "";
          unlock(inp.value).then(function () { refresh(); api.closeModal(); app.toast("Documents déchiffrés : " + ITEMS.length); }).catch(function (er) {
            go.disabled = false; go.lastChild.textContent = "Déverrouiller";
            m.querySelector("#merr").innerHTML = '<div class="err">' + esc(er.wrong ? "Code incorrect." : er.novault ? "Aucun document sécurisé n'est encore en ligne." : (er.message || er)) + "</div>";
          });
        });
      }
    }
    wire();
  }
  /* vignettes chiffrées : déchiffrées à la demande puis posées à la place des pastilles de type */
  var THC = {};
  function applyThumb(el, url) {
    var im = new Image(); im.alt = ""; im.decoding = "async"; im.src = url;
    im.onload = function () { im.classList.add(im.naturalWidth / im.naturalHeight > 1.15 ? "ls" : "pt"); if (el.parentNode) el.replaceWith(im); };
  }
  function hydrate() {
    if (!isOpen()) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-vth]"), function (el) {
      var id = el.getAttribute("data-vth"); if (!id || el.__vth) return; el.__vth = 1;
      if (!THC[id]) THC[id] = fetchEnc(id + "_t").then(function (b) { return decBytes(new Uint8Array(b)); }).then(function (pt) { return URL.createObjectURL(new Blob([pt], { type: "image/jpeg" })); }).catch(function () { return null; });
      THC[id].then(function (u) { if (u) applyThumb(el, u); });
    });
  }
  var hTm = 0;
  try { new MutationObserver(function () { clearTimeout(hTm); hTm = setTimeout(hydrate, 60); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  function thumbOfImage(file) {
    return new Promise(function (ok) {
      if (!/^image\//.test(file.type) || !window.createImageBitmap) return ok(null);
      createImageBitmap(file).then(function (bm) {
        var k = Math.min(1, 440 / Math.max(bm.width, bm.height)), cv = document.createElement("canvas"); cv.width = Math.max(1, Math.round(bm.width * k)); cv.height = Math.max(1, Math.round(bm.height * k));
        var cx = cv.getContext("2d"); cx.fillStyle = "#E2E8F6"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bm, 0, 0, cv.width, cv.height);
        cv.toBlob(function (bl) { bl ? bl.arrayBuffer().then(ok, function () { ok(null); }) : ok(null); }, "image/jpeg", 0.8);
      }).catch(function () { ok(null); });
    });
  }
  function itemOf(d) { var id = d.vid; return (ITEMS || []).filter(function (i) { return i.id === id; })[0]; }
  function openDoc(d) { var it = itemOf(d); if (it) openView(it); }
  function autoUnlock() { var sv = ss("hub.cof"); if (sv && !isOpen()) unlock(sv).then(refresh).catch(function () { ss("hub.cof", null); }); }

  window.HubCoffre = {
    isOpen: isOpen, unlock: unlock, addFile: addFile, refresh: refresh, lockDialog: lockDialog, openDoc: openDoc, autoUnlock: autoUnlock, hydrate: hydrate, closeView: closeView,
    hasKeyOrSaved: function () { return isOpen() || !!ss("hub.cof"); }
  };
})();
