/* Espace équipe du Relais DOTR : ajouter, remplacer et supprimer des documents depuis le site, sans passer par GitHub ni par Claude.
   Principe : le site parle directement à l'API de GitHub avec un jeton d'accès stocké CHIFFRÉ dans data/acces.json.
   Seule une personne qui connaît un code d'accès peut le déchiffrer (AES-GCM, clé dérivée par PBKDF2-SHA256). */
(function () {
  "use strict";
  var API = "https://api.github.com", CFG = null, TOKEN = null, ROLE = null, ready = false;
  var EXT = { pdf: "pdf", doc: "word", docx: "word", xls: "excel", xlsx: "excel", xlsm: "excel", csv: "excel", ppt: "ppt", pptx: "ppt", png: "image", jpg: "image", jpeg: "image", mp4: "video" };
  var MAX = 25 * 1024 * 1024;
  var A = function () { return window.HubApp; };
  var enc = new TextEncoder(), dec = new TextDecoder();
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function ls(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); v === null ? window.localStorage.removeItem(k) : window.localStorage.setItem(k, v); } catch (e) {} return null; }
  function ss(k, v) { try { if (v === undefined) return window.sessionStorage.getItem(k); v === null ? window.sessionStorage.removeItem(k) : window.sessionStorage.setItem(k, v); } catch (e) {} return null; }

  /* ---------- outils ---------- */
  function b64d(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function b64e(u) { var s = ""; for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function normCode(c) { return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function derive(code, salt, iter) {
    return crypto.subtle.importKey("raw", enc.encode(normCode(code)), "PBKDF2", false, ["deriveKey"]).then(function (km) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: iter, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["decrypt", "encrypt"]);
    });
  }
  function decryptBlob(blob, code) {
    return derive(code, b64d(blob.s), CFG.n).then(function (k) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(blob.iv) }, k, b64d(blob.c)); }).then(function (pt) { return dec.decode(pt); });
  }
  function gh(method, path, body) {
    var h = { Accept: "application/vnd.github+json", Authorization: "Bearer " + TOKEN, "X-GitHub-Api-Version": "2022-11-28" };
    if (body) h["Content-Type"] = "application/json";
    return fetch(API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok) { var e = new Error((j && j.message) || ("Erreur " + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  var cpath = function (p) { return p.split("/").map(encodeURIComponent).join("/"); };
  var BR = function () { return CFG.branch || "main"; };
  function getFile(path) { return gh("GET", "/repos/" + CFG.repo + "/contents/" + cpath(path) + "?ref=" + encodeURIComponent(BR())).catch(function (e) { if (e.status === 404) return null; throw e; }); }
  function putFile(path, b64, msg, sha) { var b = { message: msg, content: b64, branch: BR() }; if (sha) b.sha = sha; return gh("PUT", "/repos/" + CFG.repo + "/contents/" + cpath(path), b); }
  function delFile(path, sha, msg) { return gh("DELETE", "/repos/" + CFG.repo + "/contents/" + cpath(path), { message: msg, sha: sha, branch: BR() }); }
  function updateMeta(fn, n) {
    n = n || 0;
    return getFile("data/meta.json").then(function (f) {
      var obj = f && f.content ? JSON.parse(dec.decode(b64d(f.content.replace(/\s/g, "")))) : {};
      fn(obj);
      return putFile("data/meta.json", b64e(enc.encode(JSON.stringify(obj, null, 1))), "Fiche du document mise à jour (Le Relais DOTR)", f && f.sha);
    }).catch(function (e) { if ((e.status === 409 || e.status === 422) && n < 3) return updateMeta(fn, n + 1); throw e; });
  }
  function fileB64(file) { return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(",")[1] || ""); }; r.onerror = function () { ko(new Error("Lecture du fichier impossible")); }; r.readAsDataURL(file); }); }
  function safeName(n) {
    var m = /^(.*?)(\.[A-Za-z0-9]+)$/.exec(n) || [null, n, ""];
    var base = m[1].normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "").toLowerCase() || "document";
    return base + m[2].toLowerCase();
  }
  function slugDir(n) { return String(n).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function extOf(n) { var m = /\.([A-Za-z0-9]+)$/.exec(n || ""); return m ? m[1].toLowerCase() : ""; }
  function prettyTitle(n) { var s = n.replace(/\.[A-Za-z0-9]+$/, "").replace(/[-_]+/g, " ").trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
  function errMsg(e) {
    if (!e) return "Erreur inconnue";
    if (e.status === 401) return "Le jeton d'accès est expiré ou a été révoqué. Prévenez la personne qui administre le site.";
    if (e.status === 403) return "GitHub refuse l'opération (droits insuffisants ou trop de requêtes). Réessayez dans quelques minutes.";
    if (e.status === 404) return "Dépôt ou fichier introuvable pour ce jeton d'accès.";
    if (e.status === 409 || e.status === 422) return "Quelqu'un a modifié le dépôt en même temps. Réessayez.";
    if (e instanceof TypeError) return "Pas de connexion à GitHub. Vérifiez votre réseau.";
    return e.message || String(e);
  }

  /* ---------- état « en cours de publication » ---------- */
  function load() { try { var o = JSON.parse(ls("hub.pend") || "{}"); return { add: o.add || [], del: o.del || {} }; } catch (e) { return { add: [], del: {} }; } }
  function state() {
    var o = load(), now = Date.now(), app = A(), by = app ? app.byId : {}, ch = false;
    o.add = o.add.filter(function (x) { var keep = !by[x.path] && now - x.ts < 40 * 60000; if (!keep) ch = true; return keep; });
    Object.keys(o.del).forEach(function (p) { if (!by[p] || now - o.del[p] > 40 * 60000) { delete o.del[p]; ch = true; } });
    if (ch) ls("hub.pend", JSON.stringify(o));
    return o;
  }
  function save(o) { ls("hub.pend", JSON.stringify(o)); }
  function pendingDocs(rub) {
    var app = A();
    return state().add.filter(function (x) { return x.rub === rub; }).map(function (x) {
      var r = app.rubById[x.rub] || {};
      return { id: "pending:" + x.path, path: x.path, title: x.title, rub: x.rub, sous: x.sous, rubLabel: r.label || x.rub, sousLabel: ((r.sous || {})[x.sous]) || app.prettySous(x.sous), type: EXT[extOf(x.path)] || "autre", ext: extOf(x.path), size: x.size || 0, order: 0, date: "", thumb: "", tags: [], desc: "", pending: true, hay: x.title.toLowerCase() };
    });
  }

  /* ---------- fenêtre modale ---------- */
  var modal = null;
  function openModal(html) {
    closeModal();
    modal = document.createElement("div"); modal.id = "modal";
    modal.innerHTML = '<div class="m-back" data-mclose></div><div class="m-box" role="dialog" aria-modal="true">' + html + "</div>";
    document.body.appendChild(modal);
    modal.addEventListener("click", function (e) { if (e.target.hasAttribute("data-mclose")) closeModal(); });
    var f = modal.querySelector("input:not([type=file]),select,textarea,button.pri"); if (f) setTimeout(function () { try { f.focus(); } catch (e) {} }, 30);
    return modal;
  }
  function closeModal() { if (modal) { modal.remove(); modal = null; } }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal) { e.stopImmediatePropagation(); closeModal(); } }, true);

  /* ---------- déverrouillage ---------- */
  function restore() {
    var raw = ss("hub.tok") || ls("hub.tok");
    if (!raw) return;
    try { var o = JSON.parse(raw); if (o.repo === CFG.repo && o.t) { TOKEN = o.t; ROLE = o.role; } } catch (e) {}
  }
  function lock() { TOKEN = null; ROLE = null; ss("hub.tok", null); ls("hub.tok", null); decorate(); }
  function unlockDialog(after) {
    if (!CFG) return infoDialog();
    if (!(window.crypto && crypto.subtle)) { openModal("<h2>Connexion sécurisée requise</h2><p class=\"sub\">L'espace équipe fonctionne uniquement sur l'adresse officielle du site (https). Ouvrez le site depuis son adresse GitHub Pages.</p><div class=\"acts\"><button class=\"btn pri\" data-mclose>Compris</button></div>"); return; }
    var m = openModal('<h2>' + A().ic("lock") + ' Espace équipe</h2><p class="sub">Saisissez le code d\'accès que l\'on vous a remis. Il permet d\'ajouter et de remplacer des documents ; un code administrateur permet aussi d\'en supprimer.</p>' +
      '<label class="f" for="mcode">Code d\'accès</label><input type="password" id="mcode" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX">' +
      '<label class="f" style="display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" id="mkeep" style="width:auto"> Rester connecté sur cet ordinateur</label>' +
      '<div id="merr"></div><div class="acts"><button class="btn" data-mclose type="button">Annuler</button><button class="btn pri" id="mgo" type="button">Déverrouiller</button></div>');
    var go = m.querySelector("#mgo"), inp = m.querySelector("#mcode");
    function run() {
      var code = inp.value; if (normCode(code).length < 8) { m.querySelector("#merr").innerHTML = '<div class="err">Code trop court.</div>'; return; }
      go.disabled = true; go.textContent = "Vérification…"; m.querySelector("#merr").innerHTML = "";
      var role = "contrib", tried = decryptBlob(CFG.contrib, code).catch(function () { role = "admin"; return decryptBlob(CFG.admin, code); });
      tried.then(function (tok) {
        TOKEN = tok; ROLE = role;
        return gh("GET", "/repos/" + CFG.repo);
      }).then(function () {
        var o = JSON.stringify({ repo: CFG.repo, t: TOKEN, role: ROLE });
        if (m.querySelector("#mkeep").checked) ls("hub.tok", o); else ss("hub.tok", o);
        closeModal(); decorate(); A().toast(ROLE === "admin" ? "Espace équipe ouvert (administrateur)" : "Espace équipe ouvert");
        if (after) after();
      }).catch(function (e) {
        var wrong = !e || e.name === "OperationError" || e.name === "InvalidCharacterError";
        TOKEN = null; ROLE = null; go.disabled = false; go.textContent = "Déverrouiller";
        m.querySelector("#merr").innerHTML = '<div class="err">' + (wrong ? "Code incorrect." : esc(errMsg(e))) + "</div>";
      });
    }
    go.addEventListener("click", run); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
  }
  function infoDialog() {
    openModal("<h2>Espace équipe pas encore activé</h2><p class=\"sub\">Pour ajouter des documents directement depuis le site, il faut une dernière étape de réglage (une seule fois). Elle est expliquée pas à pas dans le <a href=\"#/guide\" data-mclose style=\"color:var(--blue);text-decoration:underline\">Guide</a>.</p><div class=\"acts\"><button class=\"btn pri\" data-mclose>Compris</button></div>");
  }
  function need(role, fn) {
    if (!CFG) return infoDialog();
    if (TOKEN && (role !== "admin" || ROLE === "admin")) return fn();
    unlockDialog(function () { if (role === "admin" && ROLE !== "admin") { A().toast("Ce code ne permet pas de supprimer"); return; } fn(); });
  }

  /* ---------- ajouter ---------- */
  function addDialog(rubId, sousPreset) {
    var app = A(), secureOnly = rubId === "__coffre", r = secureOnly ? { label: "Coffre sécurisé", sous: {} } : app.rubById[rubId]; if (!r) return;
    var sous = {}; Object.keys(r.sous || {}).forEach(function (k) { sous[k] = r.sous[k]; });
    if (!secureOnly) app.docs.forEach(function (d) { if (d.rub === rubId && d.sous && !sous[d.sous]) sous[d.sous] = d.sousLabel; });
    var cof = window.HubCoffre, cofOpen = !!(cof && cof.isOpen()), cofSaved = !!(cof && cof.hasKeyOrSaved()), gl = (cof && cof.groups ? cof.groups() : []);
    var gopts = gl.map(function (g) { return '<option value="' + esc(g) + '">'; }).join("");
    var opts = Object.keys(sous).map(function (k) { return '<option value="' + esc(k) + '"' + (k === sousPreset ? " selected" : "") + ">" + esc(sous[k]) + "</option>"; }).join("");
    var m = openModal("<h2>Ajouter un document</h2><p class=\"sub\" id=\"msub\">" + (secureOnly ? "Coffre sécurisé : le fichier sera chiffré avant l'envoi. Il ne sera lisible qu'avec le code du coffre." : "Onglet « " + esc(r.label) + " ». Le document sera visible par tout le monde d'ici 1 à 3 minutes.") + "</p>" +
      '<div class="drop" id="mdrop" tabindex="0">' + app.ic("upload") + '<b>Glissez le fichier ici ou cliquez pour le choisir</b>PDF, Word, Excel, PowerPoint, image ou vidéo MP4 · 25 Mo maximum</div><input type="file" id="mfile" hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.mp4"><div id="mfn"></div>' +
      '<label class="secsw" for="msec"><input type="checkbox" id="msec"' + (secureOnly ? " checked disabled" : "") + '><span><b>' + app.ic("lock") + 'Sécuriser (chiffrer) ce document</b><small>Coché : envoyé dans le coffre, illisible sans le code. Décoché : publié normalement, visible par tous.</small></span></label>' +
      '<div id="msecbox" hidden><label class="f" for="mgrp">Dossier dans le coffre</label><input type="text" id="mgrp" list="mgrpl" placeholder="Ex. Droit à l\'image" value="' + (gl[0] ? "" : "") + '"><datalist id="mgrpl">' + gopts + '</datalist>' +
      '<div id="mcodebox"' + (cofOpen || cofSaved ? " hidden" : "") + '><label class="f" for="mcc">Code du coffre</label><input type="password" id="mcc" autocomplete="off" spellcheck="false" placeholder="Code du coffre"></div></div>' +
      '<div id="mnormal"><label class="f" for="msous">Dossier</label><select id="msous">' + opts + '<option value="__new">+ Nouveau dossier…</option></select><input type="text" id="mnew" placeholder="Nom du nouveau dossier" hidden style="margin-top:8px"></div>' +
      '<label class="f" for="mtitle">Titre affiché</label><input type="text" id="mtitle" placeholder="Ex. Procédure de relance clients">' +
      '<label class="f" for="mdesc">Description (facultatif)</label><textarea id="mdesc" placeholder="À quoi sert ce document ?"></textarea>' +
      '<div id="merr"></div><div class="acts"><button class="btn" data-mclose type="button">Annuler</button><button class="btn pri" id="mgo" type="button">Ajouter</button></div>');
    var file = null, drop = m.querySelector("#mdrop"), inp = m.querySelector("#mfile"), ti = m.querySelector("#mtitle"), titleTouched = false, replaceOk = false;
    ti.addEventListener("input", function () { titleTouched = true; });
    var sec = m.querySelector("#msec");
    function syncSec() { var on = sec.checked; m.querySelector("#msecbox").hidden = !on; m.querySelector("#mnormal").hidden = on; if (!secureOnly) m.querySelector("#msub").textContent = on ? "Le fichier sera chiffré avant l'envoi et rangé dans le coffre. Il ne sera lisible qu'avec le code du coffre." : "Onglet « " + r.label + " ». Le document sera visible par tout le monde d'ici 1 à 3 minutes."; m.querySelector("#mgo").textContent = on ? "Chiffrer et ajouter" : "Ajouter"; }
    sec.addEventListener("change", syncSec); syncSec();
    m.querySelector("#msous").addEventListener("change", function (e) { m.querySelector("#mnew").hidden = e.target.value !== "__new"; });
    function pick(f) {
      var err = m.querySelector("#merr"); err.innerHTML = ""; replaceOk = false; syncSec();
      if (!f) return;
      if (!EXT[extOf(f.name)]) { err.innerHTML = '<div class="err">Ce type de fichier n\'est pas accepté (formats : PDF, Word, Excel, PowerPoint, images, MP4).</div>'; return; }
      if (f.size > MAX) { err.innerHTML = '<div class="err">Fichier trop volumineux (' + app.fmtSize(f.size) + '). Maximum : 25 Mo. Pour une vidéo longue, déposez-la sur YouTube (non répertoriée) et demandez l\'ajout du lien.</div>'; return; }
      file = f; m.querySelector("#mfn").innerHTML = '<div class="fname">' + app.ic("check") + esc(f.name) + " · " + app.fmtSize(f.size) + "</div>";
      if (!titleTouched) ti.value = prettyTitle(f.name);
    }
    drop.addEventListener("click", function () { inp.click(); });
    drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
    inp.addEventListener("change", function () { pick(inp.files[0]); });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
    var go = m.querySelector("#mgo"), err = m.querySelector("#merr");
    go.addEventListener("click", function () {
      err.innerHTML = "";
      if (!file) { err.innerHTML = '<div class="err">Choisissez d\'abord un fichier.</div>'; return; }
      if (sec.checked) {
        var grp = m.querySelector("#mgrp").value.trim() || "Divers", code = (m.querySelector("#mcc") || {}).value || "", ttl = ti.value.trim() || prettyTitle(file.name), dsc = m.querySelector("#mdesc").value.trim();
        if (!cofOpen && !code.trim() && !(cof && cof.hasKeyOrSaved())) { err.innerHTML = '<div class="err">Saisissez le code du coffre.</div>'; return; }
        go.disabled = true; go.textContent = "Chiffrement et envoi…";
        var saved = null; try { saved = window.sessionStorage.getItem("hub.cof"); } catch (x) {}
        cof.addFile(file, { title: ttl, group: grp, desc: dsc }, code.trim() || saved).then(function () {
          m.querySelector(".m-box").innerHTML = "<h2>Document chiffré et envoyé</h2><div class=\"okk\">« " + esc(ttl) + " » est dans le coffre (dossier « " + esc(grp) + " »). Il sera disponible pour tout le monde d'ici 1 à 3 minutes.</div><div class=\"acts\"><button class=\"btn pri\" id=\"mok\">Parfait</button></div>";
          m.querySelector("#mok").addEventListener("click", function () { closeModal(); if (location.hash === "#/coffre" && cof.redraw) cof.redraw(); });
        }).catch(function (e) { go.disabled = false; go.textContent = "Chiffrer et ajouter"; err.innerHTML = '<div class="err">' + esc(e && e.wrong ? "Code du coffre incorrect." : errMsg(e)) + "</div>"; });
        return;
      }
      var sv = m.querySelector("#msous").value, dir = sv;
      if (sv === "__new") { dir = slugDir(m.querySelector("#mnew").value); if (!dir) { err.innerHTML = '<div class="err">Donnez un nom au nouveau dossier.</div>'; return; } }
      var path = "documents/" + rubId + "/" + dir + "/" + safeName(file.name), title = ti.value.trim() || prettyTitle(file.name), desc = m.querySelector("#mdesc").value.trim();
      go.disabled = true; go.textContent = "Envoi en cours…";
      getFile(path).then(function (ex) {
        if (ex && !replaceOk) { replaceOk = true; go.disabled = false; go.textContent = "Oui, remplacer le fichier existant"; err.innerHTML = '<div class="err">Un fichier de ce nom existe déjà dans ce dossier. Voulez-vous le remplacer par cette version ?</div>'; return null; }
        return fileB64(file).then(function (b64) { return putFile(path, b64, "Ajout : " + safeName(file.name) + " (via Le Relais DOTR)", ex && ex.sha); }).then(function () {
          var o = state(); if (!o.add.some(function (x) { return x.path === path; })) o.add.push({ path: path, title: title, rub: rubId, sous: dir, size: file.size, ts: Date.now() }); save(o);
          return updateMeta(function (meta) { var e = meta[path] || {}; e.title = title; if (desc) e.desc = desc; meta[path] = e; }).then(function () { return true; }, function () { return "meta"; });
        }).then(function (res) {
          if (!res) return;
          m.querySelector(".m-box").innerHTML = "<h2>C'est envoyé</h2><div class=\"okk\">« " + esc(title) + " » apparaîtra dans l'onglet d'ici 1 à 3 minutes." + (res === "meta" ? " Le titre n'a pas pu être enregistré : le nom du fichier sera utilisé." : "") + "</div><div class=\"acts\"><button class=\"btn pri\" id=\"mok\">Parfait</button></div>";
          m.querySelector("#mok").addEventListener("click", function () { closeModal(); A().refreshView(); });
        });
      }).catch(function (e) { go.disabled = false; go.textContent = "Ajouter"; err.innerHTML = '<div class="err">' + esc(errMsg(e)) + "</div>"; });
    });
  }

  /* ---------- remplacer ---------- */
  function replaceDialog(d) {
    var app = A(), ext = extOf(d.path);
    var m = openModal("<h2>Remplacer par une nouvelle version</h2><p class=\"sub\">« " + esc(d.title) + " » gardera le même nom et le même emplacement. Tout le monde verra la nouvelle version d'ici 1 à 3 minutes. L'ancienne reste récupérable dans l'historique GitHub.</p>" +
      '<div class="drop" id="mdrop" tabindex="0">' + app.ic("upload") + '<b>Glissez la nouvelle version ici ou cliquez</b>Format attendu : .' + esc(ext) + ' · 25 Mo maximum</div><input type="file" id="mfile" hidden accept=".' + esc(ext) + '"><div id="mfn"></div><div id="merr"></div>' +
      '<div class="acts"><button class="btn" data-mclose type="button">Annuler</button><button class="btn pri" id="mgo" type="button">Remplacer</button></div>');
    var file = null, drop = m.querySelector("#mdrop"), inp = m.querySelector("#mfile"), err = m.querySelector("#merr"), go = m.querySelector("#mgo");
    function pick(f) {
      err.innerHTML = ""; if (!f) return;
      if (extOf(f.name) !== ext) { err.innerHTML = '<div class="err">La nouvelle version doit être un fichier .' + esc(ext) + ' (comme l\'original).</div>'; return; }
      if (f.size > MAX) { err.innerHTML = '<div class="err">Fichier trop volumineux (' + app.fmtSize(f.size) + '). Maximum : 25 Mo.</div>'; return; }
      file = f; m.querySelector("#mfn").innerHTML = '<div class="fname">' + app.ic("check") + esc(f.name) + " · " + app.fmtSize(f.size) + "</div>";
    }
    drop.addEventListener("click", function () { inp.click(); });
    inp.addEventListener("change", function () { pick(inp.files[0]); });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
    go.addEventListener("click", function () {
      if (!file) { err.innerHTML = '<div class="err">Choisissez d\'abord le fichier.</div>'; return; }
      go.disabled = true; go.textContent = "Envoi en cours…"; err.innerHTML = "";
      getFile(d.path).then(function (ex) {
        if (!ex) throw new Error("Le fichier n'existe plus dans le dépôt.");
        return fileB64(file).then(function (b64) { return putFile(d.path, b64, "Nouvelle version : " + d.path.split("/").pop() + " (via Le Relais DOTR)", ex.sha); });
      }).then(function () {
        m.querySelector(".m-box").innerHTML = "<h2>Nouvelle version envoyée</h2><div class=\"okk\">Elle remplacera l'ancienne d'ici 1 à 3 minutes. Pensez à actualiser la page ensuite (Ctrl + F5 si l'ancienne s'affiche encore).</div><div class=\"acts\"><button class=\"btn pri\" id=\"mok\">Parfait</button></div>";
        m.querySelector("#mok").addEventListener("click", closeModal);
      }).catch(function (e) { go.disabled = false; go.textContent = "Remplacer"; err.innerHTML = '<div class="err">' + esc(errMsg(e)) + "</div>"; });
    });
  }

  /* ---------- supprimer ---------- */
  function deleteDialog(d) {
    var m = openModal("<h2>Supprimer ce document ?</h2><p class=\"sub\">« " + esc(d.title) + " » disparaîtra du site pour tout le monde d'ici 1 à 3 minutes. Une copie reste récupérable dans l'historique GitHub.</p><div id=\"merr\"></div><div class=\"acts\"><button class=\"btn\" data-mclose type=\"button\">Annuler</button><button class=\"btn warn\" id=\"mgo\" type=\"button\">Oui, supprimer</button></div>");
    var go = m.querySelector("#mgo"), err = m.querySelector("#merr");
    go.addEventListener("click", function () {
      go.disabled = true; go.textContent = "Suppression…";
      getFile(d.path).then(function (ex) {
        if (!ex) return null;
        return delFile(d.path, ex.sha, "Suppression : " + d.path.split("/").pop() + " (via Le Relais DOTR)");
      }).then(function () {
        var o = state(); o.del[d.path] = Date.now(); save(o);
        return updateMeta(function (meta) { delete meta[d.path]; }).catch(function () {});
      }).then(function () { closeModal(); A().toast("Document supprimé"); A().closeViewer(); setTimeout(function () { A().refreshView(); }, 60); })
        .catch(function (e) { go.disabled = false; go.textContent = "Oui, supprimer"; err.innerHTML = '<div class="err">' + esc(errMsg(e)) + "</div>"; });
    });
  }

  /* ---------- décoration de l'interface ---------- */
  function roleLabel() { return ROLE === "admin" ? "Administrateur" : "Contributeur"; }
  function decorate() {
    var app = A(); if (!app || !ready) return;
    var bar = document.getElementById("teambar");
    if (bar) {
      bar.innerHTML = '<button class="btn ' + (TOKEN ? "pri " : "") + 'sm" type="button" data-team="add" data-rub="' + esc(bar.dataset.rub) + '">' + app.ic("plus") + " Ajouter un document</button>" +
        (TOKEN ? '<span class="who">' + app.ic("lock") + "Espace équipe · " + roleLabel() + '<button type="button" data-team="lock" title="Verrouiller" aria-label="Verrouiller">' + app.ic("x") + "</button></span>" : "");
    }
    Array.prototype.forEach.call(document.querySelectorAll(".grp[data-sous] h3"), function (h) {
      if (h.querySelector(".addhere")) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "addhere"; b.setAttribute("data-team", "addhere"); b.innerHTML = app.ic("plus") + "Ajouter ici"; h.appendChild(b);
    });
    var vt = document.getElementById("vteam");
    if (vt) {
      var d = app.byId[vt.dataset.id];
      if (!d || d.type === "lien") { vt.innerHTML = ""; return; }
      vt.innerHTML = TOKEN
        ? '<h5>Espace équipe</h5><div class="btns"><button class="btn sm" type="button" data-team="replace">' + app.ic("refresh") + " Remplacer par une nouvelle version</button>" + (ROLE === "admin" ? '<button class="btn sm warn" type="button" data-team="delete">' + app.ic("trash") + " Supprimer</button>" : "") + "</div>"
        : '<button class="btn sm" type="button" data-team="open">' + app.ic("lock") + " Espace équipe</button>";
    }
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-team]") : null; if (!t) return;
    var act = t.getAttribute("data-team"), app = A(), cur;
    if (act === "lock") return lock();
    if (act === "add") { var rub = t.dataset.rub; return need("contrib", function () { addDialog(rub); }); }
    if (act === "addhere") { var g = t.closest(".grp"), bar = document.getElementById("teambar"); var rb = bar && bar.dataset.rub, so = g && g.dataset.sous; return need("contrib", function () { addDialog(rb, so); }); }
    var vt = document.getElementById("vteam"); cur = vt && app.byId[vt.dataset.id];
    if (act === "open") return unlockDialog();
    if (!cur) return;
    if (act === "replace") return need("contrib", function () { replaceDialog(cur); });
    if (act === "delete") return need("admin", function () { deleteDialog(cur); });
  });

  /* ---------- démarrage ---------- */
  window.HubTeam = {
    state: function () { return ready ? state() : { add: [], del: {} }; },
    pendingDocs: function (r) { return ready ? pendingDocs(r) : []; },
    decorate: decorate,
    enabled: function () { return !!CFG; },
    api: { token: function () { return TOKEN; }, role: function () { return ROLE; }, need: need, getFile: getFile, putFile: putFile, delFile: delFile, repo: function () { return CFG && CFG.repo; }, branch: function () { return CFG ? BR() : "main"; }, openModal: openModal, closeModal: closeModal, errMsg: errMsg, prettyTitle: prettyTitle, addDialog: function (r, s) { return addDialog(r, s); } }
  };
  function start(cfg) {
    CFG = cfg && cfg.repo && cfg.contrib && cfg.admin && cfg.n ? cfg : null;
    if (CFG) restore();
    ready = true;
    decorate();
    var st = state(); if ((st.add.length || Object.keys(st.del).length) && window.HubApp && !document.getElementById("viewer").innerHTML) window.HubApp.refreshView();
  }
  if (location.protocol === "file:") { ready = true; }
  else fetch("data/acces.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(start);
})();
