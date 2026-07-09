/**
 * Общие DOM-утилиты для модулей превью.
 * SepgUI использует setClassVisible — без принудительного display,
 * чтобы CSS-анимации preview-animated работали корректно.
 */
(function (global) {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  /** Показать/скрыть элемент по id (display + класс preview-hidden). */
  function setVisible(id, visible) {
    var el = byId(id);
    if (!el) return;

    if (visible) {
      el.style.display = '';
      el.classList.remove('preview-hidden');
    } else {
      el.style.display = 'none';
      el.classList.add('preview-hidden');
    }
  }

  /** Только класс preview-hidden — для слоёв с CSS-переходами. */
  function setClassVisible(id, visible) {
    var el = byId(id);
    if (el) el.classList.toggle('preview-hidden', !visible);
  }

  global.DomUtils = {
    byId: byId,
    setVisible: setVisible,
    setClassVisible: setClassVisible
  };
})(typeof window !== 'undefined' ? window : this);
