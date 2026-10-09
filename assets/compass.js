/* Boussole superposée à la Terre : graduations, points cardinaux et aiguille dont la pointe jaune indique le NORD, c'est-à-dire le haut de la Terre qui tourne dessous. */
window.HubCompass = {
  art: function () {
    var ticks = "";
    for (var i = 0; i < 72; i++) {
      var a = (i * 5) * Math.PI / 180, big = i % 6 === 0, r1 = 196, r2 = big ? 180 : 188;
      ticks += '<line x1="' + (200 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (200 - Math.cos(a) * r1).toFixed(1) + '" x2="' + (200 + Math.sin(a) * r2).toFixed(1) + '" y2="' + (200 - Math.cos(a) * r2).toFixed(1) + '" stroke="#2B47F6" stroke-opacity="' + (big ? ".55" : ".25") + '" stroke-width="' + (big ? 2.2 : 1.3) + '"/>';
    }
    var T = function (x, y, t, o) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="middle" font-family="Poppins,sans-serif" font-weight="600" font-size="15" fill="#2B47F6" fill-opacity="' + o + '">' + t + "</text>"; };
    return '<svg class="compass" viewBox="-20 -20 440 440" fill="none" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="cn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD43D"/><stop offset="1" stop-color="#FFB800"/></linearGradient>' +
      '<linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B47F6"/><stop offset="1" stop-color="#112A45"/></linearGradient></defs>' +
      '<circle cx="200" cy="200" r="198" stroke="#2B47F6" stroke-opacity=".28" stroke-width="2"/>' + ticks +
      '<circle class="c-slow" cx="200" cy="200" r="168" stroke="#33D5FB" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="2 10" stroke-linecap="round"/>' +
      '<text x="200" y="-4" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="700" font-size="26" fill="#2B47F6">N</text>' +
      T(200, 418, "S", ".6") + T(-4, 201, "O", ".6") + T(404, 201, "E", ".6") +
      '<g class="c-needle"><path d="M200 22 L216 200 L200 188 L184 200Z" fill="url(#cn)" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/><path d="M200 378 L216 200 L200 212 L184 200Z" fill="url(#cs)" opacity=".92" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/><circle cx="200" cy="200" r="10" fill="#fff" stroke="#2B47F6" stroke-width="3"/></g>' +
      '</svg>';
  }
};
