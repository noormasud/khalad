/* Khalad: today's and this week's prayer times for one city, computed in the browser with adhan-js
   using the same method rules as the app. */
(function () {
  var el = document.getElementById('pt');
  if (!el || !window.adhan) return;
  var cfg = JSON.parse(el.getAttribute('data-cfg'));
  var A = window.adhan;
  var hanafi = cfg.hanafi;
  try { var saved = localStorage.getItem('khalad.asr'); if (saved) hanafi = saved === 'hanafi'; } catch (e) {}
  var NAMES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var fmtTime = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: cfg.tz });
  var fmtDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: cfg.tz });
  var fmtLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: cfg.tz });

  function ymdInTz(d) {
    var p = new Intl.DateTimeFormat('en-CA', { timeZone: cfg.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    var get = function (t) { return +p.filter(function (x) { return x.type === t; })[0].value; };
    return [get('year'), get('month'), get('day')];
  }
  function times(y, m, d) {
    var coords = new A.Coordinates(cfg.lat, cfg.lng);
    var params = A.CalculationMethod[cfg.method]();
    params.madhab = hanafi ? A.Madhab.Hanafi : A.Madhab.Shafi;
    params.highLatitudeRule = A.HighLatitudeRule.recommended(coords);
    return new A.PrayerTimes(coords, new Date(y, m - 1, d), params);
  }
  function t(x) { return fmtTime.format(x).replace(' ', ' '); }

  function render() {
    var now = new Date();
    var ymd = ymdInTz(now);
    var today = times(ymd[0], ymd[1], ymd[2]);
    var next = null;
    NAMES.forEach(function (n) { if (!next && n !== 'sunrise' && today[n] > now) next = n; });
    document.getElementById('pt-date').textContent = fmtLong.format(now);
    var lis = document.querySelectorAll('#pt-today li');
    NAMES.forEach(function (n, i) {
      lis[i].querySelector('b').textContent = t(today[n]);
      lis[i].classList.toggle('next', n === next);
      lis[i].setAttribute('aria-current', n === next ? 'time' : 'false');
    });
    var rows = '';
    for (var k = 0; k < 7; k++) {
      var base = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2] + k, 12));
      var p = ymdInTz(base);
      var pt = times(p[0], p[1], p[2]);
      rows += '<tr><th scope="row">' + fmtDay.format(base) + '</th>' + NAMES.map(function (n) { return '<td>' + t(pt[n]) + '</td>'; }).join('') + '</tr>';
    }
    document.querySelector('#pt-week tbody').innerHTML = rows;
    document.querySelectorAll('[data-asr]').forEach(function (b) {
      b.setAttribute('aria-pressed', String((b.getAttribute('data-asr') === 'hanafi') === hanafi));
    });
  }
  document.querySelectorAll('[data-asr]').forEach(function (b) {
    b.addEventListener('click', function () {
      hanafi = b.getAttribute('data-asr') === 'hanafi';
      try { localStorage.setItem('khalad.asr', hanafi ? 'hanafi' : 'standard'); } catch (e) {}
      render();
    });
  });
  render();
  setInterval(render, 60000);
})();
