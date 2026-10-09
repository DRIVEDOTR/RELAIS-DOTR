/* Illustration douce du Relais DOTR : une boussole entourée d'une orbite (clin d'œil au logo) et d'une route de relais. Pur SVG + CSS, aucune dépendance. */
window.HubCompass = {
  art: function () {
    var ticks = "";
    for (var i = 0; i < 72; i++) {
      var a = (i * 5) * Math.PI / 180, big = i % 6 === 0, r1 = 176, r2 = big ? 164 : 170;
      ticks += '<line x1="' + (200 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (200 - Math.cos(a) * r1).toFixed(1) + '" x2="' + (200 + Math.sin(a) * r2).toFixed(1) + '" y2="' + (200 - Math.cos(a) * r2).toFixed(1) + '" stroke="#2B47F6" stroke-opacity="' + (big ? ".35" : ".16") + '" stroke-width="' + (big ? 2 : 1.2) + '"/>';
    }
    var nodes = [[62, 292], [118, 352], [212, 372], [306, 340], [352, 262]], dots = "";
    nodes.forEach(function (n, k) { dots += '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="' + (k === 4 ? 9 : 6.5) + '" fill="#fff" stroke="' + (k === 4 ? "#FFD43D" : "#33D5FB") + '" stroke-width="3"/>'; });
    return '<svg class="compass" viewBox="0 0 400 400" fill="none" aria-hidden="true" focusable="false">' +
      '<defs><radialGradient id="cg" cx="50%" cy="46%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#CFDEF6" stop-opacity=".35"/></radialGradient>' +
      '<linearGradient id="cn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD43D"/><stop offset="1" stop-color="#FFB800"/></linearGradient>' +
      '<linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B47F6"/><stop offset="1" stop-color="#112A45"/></linearGradient></defs>' +
      '<circle cx="200" cy="200" r="186" fill="url(#cg)" stroke="#2B47F6" stroke-opacity=".14" stroke-width="2"/>' + ticks +
      '<circle class="c-slow" cx="200" cy="200" r="140" stroke="#33D5FB" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 11" stroke-linecap="round"/>' +
      '<circle cx="200" cy="200" r="104" stroke="#2B47F6" stroke-opacity=".12" stroke-width="1.5"/>' +
      '<g class="c-orbit"><ellipse cx="200" cy="200" rx="196" ry="70" transform="rotate(-24 200 200)" stroke="#33D5FB" stroke-opacity=".7" stroke-width="2.6"/><circle cx="391" cy="158" r="9" fill="#33D5FB"/></g>' +
      '<path d="M62 292 C 70 340, 130 380, 212 372 S 330 330, 352 262" stroke="#33D5FB" stroke-opacity=".7" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>' + dots +
      '<circle r="6.5" fill="#FFD43D"><animateMotion dur="9s" repeatCount="indefinite" path="M62 292 C 70 340, 130 380, 212 372 S 330 330, 352 262"/></circle>' +
      '<g class="c-rose" opacity=".55"><path d="M200 70 L214 186 L330 200 L214 214 L200 330 L186 214 L70 200 L186 186Z" fill="#CFDEF6" stroke="#2B47F6" stroke-opacity=".25" stroke-width="1.5"/><path d="M200 112 L208 192 L288 200 L208 208 L200 288 L192 208 L112 200 L192 192Z" fill="#fff" fill-opacity=".8"/></g>' +
      '<g class="c-needle"><path d="M200 58 L219 200 L200 188 L181 200Z" fill="url(#cn)"/><path d="M200 342 L219 200 L200 212 L181 200Z" fill="url(#cs)" opacity=".9"/><circle cx="200" cy="200" r="10" fill="#fff" stroke="#2B47F6" stroke-width="3"/></g>' +
      '<text x="200" y="42" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="700" font-size="24" fill="#2B47F6" fill-opacity=".75">N</text>' +
      '</svg>';
  }
};
