/* Khalad: online tasbih counter. 33 / 33 / 34, then round again. */
(function () {
  var PHRASES = [['SubhanAllah', 33], ['Alhamdulillah', 33], ['Allahu Akbar', 34]];
  var i = 0, count = 0, total = 0;
  var key = 'khalad.tasbih.' + new Date().toISOString().slice(0, 10);
  try { total = +(localStorage.getItem(key) || 0); } catch (e) {}
  var countEl = document.getElementById('tb-count'), ofEl = document.getElementById('tb-of'), totalEl = document.getElementById('tb-total');
  var btns = document.querySelectorAll('#tb [data-i]');
  if (!countEl) return;
  function show() {
    countEl.textContent = count;
    ofEl.textContent = PHRASES[i][0] + ' · of ' + PHRASES[i][1];
    totalEl.textContent = total ? 'Today on this device: ' + total : '';
    btns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-i') === i)); });
  }
  function tap() {
    count++; total++;
    try { localStorage.setItem(key, String(total)); } catch (e) {}
    if (count >= PHRASES[i][1]) {
      if (navigator.vibrate) { try { navigator.vibrate([30, 60, 30]); } catch (e) {} }
      i = (i + 1) % PHRASES.length; count = 0;
    } else if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
    show();
  }
  document.getElementById('tb-tap').addEventListener('click', tap);
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); tap(); }
  });
  btns.forEach(function (b) { b.addEventListener('click', function () { i = +b.getAttribute('data-i'); count = 0; show(); }); });
  document.getElementById('tb-reset').addEventListener('click', function () { i = 0; count = 0; show(); });
  show();
})();
