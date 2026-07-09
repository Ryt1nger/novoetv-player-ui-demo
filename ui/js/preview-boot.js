/**
 * Ранний bootstrap превью: классы html до отрисовки страницы.
 * ?audit      — скрыть dev-panel, отключить анимации
 * ?noanimate  — без preview-animated
 * ?animate    — явно включить анимации
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var params = new URLSearchParams(location.search);

  root.classList.add('browser-preview');

  if (params.has('audit')) {
    root.classList.add('audit-mode');
  }

  if (params.has('animate') || (!params.has('audit') && !params.has('noanimate'))) {
    root.classList.add('preview-animated');
  }
})();
