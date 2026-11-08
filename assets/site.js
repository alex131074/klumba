/* Поведение страницы: живые часы Омска, дневная и ночная тема, колба, отзывы, форма. */
(function () {
  var TEL = '<a href="tel:+73812387148">+7 (3812) 38-71-48</a> или напишите в <a href="https://wa.me/79039277148" target="_blank" rel="noopener">WhatsApp</a>';
  var FORM_ENDPOINT = ''; /* {{адрес приёма заявок}} */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }
  function all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var root = document.documentElement, hero = $('hero'), bar = $('bar'), contacts = $('contacts');

  /* часы Омска (UTC+6) и самая близкая ситуация из блока «Когда» */
  var clock = $('clock'), times = all('#times li'), manual = false;
  function omsk() { var o = new Date(Date.now() + 6 * 3600000); return { h: o.getUTCHours(), m: o.getUTCMinutes() }; }
  function tick() {
    var t = omsk();
    clock.textContent = ('0' + t.h).slice(-2) + ':' + ('0' + t.m).slice(-2);
    var mins = t.h * 60 + t.m, best = null, bd = 1e9;
    times.forEach(function (li) {
      var p = li.querySelector('b').textContent.split(':'), x = +p[0] * 60 + +p[1], d = Math.abs(x - mins); d = Math.min(d, 1440 - d);
      if (d < bd) { bd = d; best = li; }
    });
    times.forEach(function (li) { li.classList.toggle('now', li === best); });
    if (!manual) setNight(t.h >= 21 || t.h < 6);
  }
  function setNight(v) {
    root.classList.toggle('night', v);
    var mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.content = v ? '#0e0e12' : '#faf7f2';
    if (window.KL) KL.night(v);
  }
  $('mode').addEventListener('click', function () { manual = true; setNight(!root.classList.contains('night')); });
  tick(); setInterval(tick, 15000);

  function update() {
    var H = innerHeight, hr = hero.getBoundingClientRect(), cr = contacts.getBoundingClientRect();
    if (window.KL) { KL.live(hr.bottom > 0); KL.scroll(-hr.top / Math.max(1, hr.height)); }
    bar.classList.toggle('on', hr.bottom < H * .3 && cr.top > H * .6);
  }
  var ticking = false;
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }, { passive: true });
  addEventListener('resize', update);
  update();

  if (!reduce && 'IntersectionObserver' in window) {
    var rise = all('.sec h2,.sec .sub,.times li,.bx,.price,.door-f,.steps li,.score,.rev,.maplink,.form');
    rise.forEach(function (el) { el.classList.add('rise'); });
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rise.forEach(function (el) { seen.observe(el); });
  }

  var more = $('revMore'), btn = $('revBtn');
  btn.addEventListener('click', function () {
    more.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); btn.hidden = true;
    all('.rise', more).forEach(function (el) { el.classList.add('in'); });
  });

  var form = $('form'), fm = $('formMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ph = form.elements.phone, ok = ph.value.replace(/\D/g, '').length >= 10;
    ph.classList.toggle('invalid', !ok);
    if (!ok) { fm.textContent = 'Укажите телефон, чтобы мы могли связаться.'; ph.focus(); return; }
    if (!FORM_ENDPOINT) { fm.innerHTML = 'Заявки с сайта пока не подключены, поэтому ваш номер не отправлен. Позвоните: ' + TEL; return; }
    fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form) })
      .then(function (r) { if (!r.ok) throw 0; fm.textContent = 'Заявка принята, свяжемся с вами.'; form.reset(); })
      .catch(function () { fm.innerHTML = 'Заявка не отправилась. Позвоните: ' + TEL; });
  });
})();
