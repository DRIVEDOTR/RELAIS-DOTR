/* Globe DOTR : la Terre (vrais continents) tourne sur elle-même, axe vertical : le nord est en haut. Orbite en clin d'œil au logo. Canvas 2D, aucune dépendance. */
window.HubGlobe = {
  mount: function (cv) {
    if (!cv || !cv.getContext) return function () {};
    var MASK = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAfAP8HAAAAAAAAAAAAAAAAAAAAAADo//z//wcAAAAAAAACAAAAAAAAAAAAhvvw//8PAPABAAAAwAMAAAAAAAAAwADkw////wEABAAAAABgAAAAAAAAAADAUT8A/v8PAAAAAAwA/j8AuAEAAAAAcBHtDcD/fwAAAAAwAPz/fwMAABCAAQD5w/wD8P8FAAAcAIL7//9//xOAAP/ff0668QD/HwAA+A8At///////v3/w/////x8++B8AAOD/1//7////////jP////+/+AE/gAcAn9f//////////w/w/////wEs4AEAAHz+////////////gL////8HeAAcAADg5///////////9ADgAf7/f4AnAAAAAH78////////H0QAAAiA//8f8AcAAIBB4////////38ADwAQAOD//5//AQAAHAT/////////A3AAAAAA/v//+T8AAGDz//////////8DAQAAAMD/////AwAAsP//////////LwAAAAAA6P///2IAAAD+//////////8CAAAAAAD///8/CAAA4P//////////JwAAAAAA8P///wYAAAD+/unz/////z8AAAAAAAD///8HAAAA/pgPPP//////MQAAAAAA8P//PwAAAMBD9v7n/////wcBAAAAAAD///8AAAAAPkD7f/7///8hEAAAAAAA4P//DwAAAIDhAv/n////f8YAAAAAAAD8//8AAAAA+AdE//////8jDwAAAAAAgP//AwAAAMD/APD/////PxgAAAAAAADw/x8AAAAA/n/v//////8HAAAAAAAAAPwDAgAAAOD////7////fwAAAAAAAACgHyAAAACA//9/f/7///8DAAAAAAAAAPQBAAAAAPj//+cv+P//PwAAAAAAAAAAHjAAAADA/////g/+//8EAAAAAAAAAOBhCAAAAP7//99/4D//AAAAAAAAAAAAPAMEAADA////+Qf84BcAAAAAAAAAAAA/AAAAAPz//58fgAf+QAAAAAAAAAAAAA8AAADg////ewA4gA8EAAAAAAAAAADAAAAAAPz//38BgAP4QQAAAAAAAAAAAAgPAADA////zwAwgAwQAAAAAAAAAAAA9Q8AAPj///8HAAVIAAAAAAAAAAAAAID/AQAA////fwBAAAAQAAAAAAAAAAAA+P8AAGDh//8DAAA0GAAAAAAAAAAAAID/HwAAAPj/HwAAgMIBAAAAAAAAAAAA/P8BAACA//8AAAAYXgAAAAAAAAAAAMD/fwAAAPz/BwAAAOOBAQAAAAAAAAAA/P8/AACA/z8AAABgbtQBAAAAAAAAAOD//w8AAPD/AwAAAAQIeAAAAAAAAAAA/P//AQAA/z8AAACAA4APAQAAAAAAAID//w8AAPD/AwAAAAARsEAAAAAAAAAA+P9/AAAA/j8AAAAAAAAAAAAAAAAAAAD//wcAAPD/QwAAAACAIwAAAAAAAAAA8P9/AAAA/z8EAAAAAD8GIAAAAAAAAAD8/wMAAPD/cQAAAAD4ZwAAAAAAAAAAgP8/AAAA/w8HAAAAgP8HAAAAAAAAAAD4/wMAAOD/MAAAAAD//wEBAAAAAAAAgP8PAAAA/g8DAAAA+P8fAAAAAAAAAAD4PwAAAOB/EAAAAID//wMAAAAAAAAAgP8DAAAA/AMAAAAA+P9/AAAAAAAAAAD8HwAAAMA/AAAAAID//wcAAAAAAAAAwP8BAAAA+AEAAAAA8P9/AAAAAAAAAAD8DwAAAIAPAAAAAAAP/gMAAAAAAAAAwB8AAAAAAAAAAAAAEIAfAAEAAAAAAAD+AwAAAAAAAAAAAAAA8AEgAAAAAAAA4AcAAAAAAAAAAAAAAAAAAAYAAAAAAABeAAAAAAAAAAAAAAAAwAAwAAAAAAAAwAMAAAAAAAAAAAAAAAAIgAEAAAAAAAAeAAAAAAAAAAAAAAAAAAAMAAAAAAAA4AEAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAABAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAB4AEDwn/8HAAAAAAAAAAAwAAAAAACA/P/h/////w8AAAAAAAAAwAcAAAD4////z///////PwAAAAAAHALwAACA//////////////8HAADw/y///wMAAP7/////////////HwAA+P///38AAID///////////////8AAPL/////BwAO////////////////DwAA8P////8HEPD//////////////z8AAOD/////////////////////////H/AfwP//////////////////////////////////////////////////////////////////////////////////////", W0 = 180, H0 = 90, bin = atob(MASK), bits = new Uint8Array(bin.length);
    for (var q = 0; q < bin.length; q++) bits[q] = bin.charCodeAt(q);
    function isLand(lat, lon) {
      var c = Math.min(W0 - 1, Math.max(0, Math.floor((lon + 180) / 360 * W0))), r = Math.min(H0 - 1, Math.max(0, Math.floor((90 - lat) / 180 * H0))), i = r * W0 + c;
      return (bits[i >> 3] >> (i & 7)) & 1;
    }
    var ctx = cv.getContext("2d"), reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var W = 0, H = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now(), N = 4200, pts = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i, x = Math.cos(th) * r, z = Math.sin(th) * r;
      var lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(x, z) * 180 / Math.PI;
      pts.push({ x: x, y: y, z: z, land: isLand(lat, lon) });
    }
    var TILT = 0.22, CT = Math.cos(TILT), ST = Math.sin(TILT);
    function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function rot(p, a) { var ca = Math.cos(a), sa = Math.sin(a), x1 = p.x * ca + p.z * sa, z1 = -p.x * sa + p.z * ca; return { x: x1, y: p.y * CT - z1 * ST, z: p.y * ST + z1 * CT }; }
    function frame(now) {
      var t = reduce ? 6000 : now - t0, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.385, a = t * 0.00022, k = R / 190;
      ctx.clearRect(0, 0, W, H);
      var g = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.3);
      g.addColorStop(0, "rgba(51,213,251,.30)"); g.addColorStop(0.6, "rgba(43,71,246,.08)"); g.addColorStop(1, "rgba(43,71,246,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, 7); ctx.fill();
      var b = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .05, cx, cy, R * 1.02);
      b.addColorStop(0, "rgba(255,255,255,.98)"); b.addColorStop(0.7, "rgba(207,222,246,.75)"); b.addColorStop(1, "rgba(150,185,240,.65)");
      ctx.fillStyle = b; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ring(false);
      for (var i = 0; i < N; i++) {
        var q = rot(pts[i], a); if (q.z < 0) continue;
        var px = cx + q.x * R, py = cy - q.y * R, sh = 0.35 + 0.65 * q.z, L = pts[i].land;
        if (L) { ctx.fillStyle = "rgba(43,71,246," + (0.35 + 0.65 * sh).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(px, py, (1.5 + 1.6 * q.z) * k, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = "rgba(51,160,230," + (0.10 + 0.22 * sh).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(px, py, (0.8 + 0.5 * q.z) * k, 0, 7); ctx.fill(); }
      }
      ctx.strokeStyle = "rgba(43,71,246,.22)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ring(true);
      function ring(front) {
        var RR = R * 1.24, n = 140, prev = null, tilt = 0.5, rz = -0.42;
        for (var j = 0; j <= n; j++) {
          var ang = (j / n) * Math.PI * 2, ox = Math.cos(ang) * RR, oy = Math.sin(ang) * RR * Math.sin(tilt), oz = Math.sin(ang) * Math.cos(tilt);
          var p = { x: cx + ox * Math.cos(rz) - oy * Math.sin(rz), y: cy + ox * Math.sin(rz) + oy * Math.cos(rz), z: oz };
          if (prev && ((p.z >= 0) === front)) { ctx.strokeStyle = "rgba(51,213,251," + (front ? 0.9 : 0.3) + ")"; ctx.lineWidth = (front ? 3.2 : 1.6) * k; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
          prev = p;
        }
        var a2 = t * 0.00042, ox2 = Math.cos(a2) * RR, oy2 = Math.sin(a2) * RR * Math.sin(tilt), oz2 = Math.sin(a2) * Math.cos(tilt);
        if ((oz2 >= 0) === front) { ctx.fillStyle = "#FFD43D"; ctx.shadowColor = "#FFD43D"; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(cx + ox2 * Math.cos(rz) - oy2 * Math.sin(rz), cy + ox2 * Math.sin(rz) + oy2 * Math.cos(rz), 5.5 * k, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
      }
    }
    function loop(now) { raf = 0; if (!visible || document.hidden) return; frame(now); if (!reduce) raf = requestAnimationFrame(loop); }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { resize(); if (reduce) frame(0); }) : null;
    if (ro) ro.observe(cv); resize();
    var io = window.IntersectionObserver ? new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) kick(); }) : null;
    if (io) io.observe(cv);
    document.addEventListener("visibilitychange", kick); kick();
    return function () { if (raf) cancelAnimationFrame(raf); raf = 0; visible = false; if (ro) ro.disconnect(); if (io) io.disconnect(); document.removeEventListener("visibilitychange", kick); };
  }
};
