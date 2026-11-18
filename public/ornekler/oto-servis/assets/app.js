/* SiteMix ortak site betiği: mobil menü, WhatsApp formları, sekmeler */
(function () {
  // Mobil menü
  var burger = document.querySelector('.burger');
  var menu = document.querySelector('.menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Formlar: doldurulan bilgileri hazır bir WhatsApp mesajına çevirir
  document.querySelectorAll('form[data-wa]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = [form.getAttribute('data-title') || 'Web sitesi talebi'];
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (!el.value || el.type === 'submit') return;
        var label = form.querySelector('label[for="' + el.id + '"]');
        lines.push('• ' + (label ? label.textContent.replace('*', '').trim() : el.name) + ': ' + el.value);
      });
      var url = 'https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(lines.join('\n'));
      var msg = form.querySelector('.form-msg');
      if (msg) msg.textContent = 'WhatsApp açılıyor… Mesajınız hazır, sadece gönder tuşuna basın.';
      var w = window.open(url, '_blank');
      if (!w) window.location.href = url;
    });
  });

  // Sekmeler
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var buttons = box.querySelectorAll('[role="tab"]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          b.setAttribute('aria-selected', 'false');
          var p = document.getElementById(b.getAttribute('aria-controls'));
          if (p) p.hidden = true;
        });
        btn.setAttribute('aria-selected', 'true');
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.hidden = false;
      });
    });
  });

  // Yıl
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
