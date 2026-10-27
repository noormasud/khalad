/* Khalad: tabular Hijri date (same algorithm as the app) for the Islamic date and white days pages. */
(function () {
  var MONTHS = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah'];
  var MONTHS_AR = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function toHijri(date) {
    var l0 = jdn(date.getFullYear(), date.getMonth() + 1, date.getDate()) - 1948440 + 10632;
    var n = Math.floor((l0 - 1) / 10631), l1 = l0 - 10631 * n + 354;
    var j = Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) + Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
    var l2 = l1 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var month = Math.floor((24 * l2) / 709);
    return { year: 30 * n + j - 30, month: month, day: l2 - Math.floor((709 * month) / 24) };
  }
  var fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  var now = new Date(); now.setHours(12, 0, 0, 0);

  var hd = document.getElementById('hijri-date');
  if (hd) {
    var h = toHijri(now);
    hd.textContent = h.day + ' ' + MONTHS[h.month - 1] + ' ' + h.year + ' AH';
    document.getElementById('hijri-ar').textContent = h.day + ' ' + MONTHS_AR[h.month - 1] + ' ' + h.year;
    document.getElementById('hijri-greg').textContent = fmt.format(now);
  }

  var wd = document.getElementById('wd');
  if (wd) {
    // Start two days back so white days happening right now are included.
    var out = [], d = new Date(now), guard = 0;
    d.setDate(d.getDate() - 2);
    while (out.length < 3 && guard++ < 130) {
      var x = toHijri(d);
      if (x.day === 13) {
        var days = [0, 1, 2].map(function (k) { var y = new Date(d); y.setDate(d.getDate() + k); return y; });
        var isNow = days[0] <= now && now <= days[2];
        var note = isNow ? 'These are the white days right now.' : x.month === 12 ? 'The 13th of Dhul Hijjah is a day of Tashriq: don’t fast it.' : x.month === 9 ? 'This is in Ramadan, when you are already fasting.' : '';
        out.push('<div class="wd-row"><b>' + MONTHS[x.month - 1] + ' ' + x.year + '</b><span>' + days.map(function (y) { return fmtShort.format(y); }).join(' · ') + '</span>' + (note ? '<em>' + note + '</em>' : '') + '</div>');
        d.setDate(d.getDate() + 20);
        continue;
      }
      d.setDate(d.getDate() + 1);
    }
    wd.innerHTML = out.join('');
  }
})();
