(function (global) {
  'use strict';

  var programs = [];
  var selected = 1;

  function byId(id) { return document.getElementById(id); }

  function setVisible(id, visible) {
    var el = byId(id);
    if (!el) return;
    el.classList.toggle('preview-hidden', !visible);
  }

  function render(list) {
    var ul = byId('controller-list');
    if (!ul) return;
    ul.innerHTML = '';
    if (!list || !list.length) {
      var empty = document.createElement('li');
      empty.className = 'empty-item';
      empty.textContent = 'Данные отсутствуют';
      ul.appendChild(empty);
      return;
    }
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var li = document.createElement('li');
      if (i === selected) li.className = 'selected';
      li.innerHTML =
        '<span class="recycler-time">' + (p.time || '') + '</span>' +
        '<span class="recycler-name">' + (p.name || '') + '</span>' +
        (p.hasPlay || i === selected
          ? '<img class="recycler-play" src="../../assets/v4/icons/ic_play_program.svg" alt="">'
          : '');
      ul.appendChild(li);
    }
  }

  var SepgUI = {
    applyDemo: function () {
      var data = (global.mockData && global.mockData.sepg) || global.__PLAYER_MOCK_SEPG__ || null;
      programs = (data && data.programs) || [
        { time: '16:00', name: 'Футбол. Обзор недели' },
        { time: '18:55', name: 'Футбол. Winline Суперсерия. Зенит (Россия) - Нефтчи (Узбекистан)' },
        { time: '21:00', name: 'Смешанные единоборства. Бетсити Fight Nights. Трансляция из Каспийска', hasPlay: true, selected: true },
        { time: '23:30', name: 'Итоги дня' },
        { time: '00:00', name: 'Ночной эфир' }
      ];
      selected = 2;
      for (var i = 0; i < programs.length; i++) {
        if (programs[i].selected) selected = i;
      }
      setVisible('controller-recycler-wrap', true);
      setVisible('playing-error-bar-sepg', false);
      render(programs);
    },

    applyLoadingDemo: function () {
      setVisible('controller-recycler-wrap', true);
      setVisible('playing-error-bar-sepg', false);
      var ul = byId('controller-list');
      if (!ul) return;
      ul.innerHTML = '<li class="loading-item">Загрузка…</li>';
    },

    applyEmptyDemo: function () {
      setVisible('controller-recycler-wrap', true);
      setVisible('playing-error-bar-sepg', false);
      render([]);
    },

    applyStreamErrorDemo: function (msg) {
      this.applyDemo();
      var bar = byId('playing-error-bar-sepg');
      if (bar) {
        bar.textContent = msg || 'Ошибка открытия архива. Повторный запрос...';
        setVisible('playing-error-bar-sepg', true);
      }
    },

    hide: function () {
      setVisible('controller-recycler-wrap', false);
      setVisible('playing-error-bar-sepg', false);
    },

    shiftLeft: function () {
      if (!programs.length) return;
      selected = (selected - 1 + programs.length) % programs.length;
      render(programs);
    },

    shiftRight: function () {
      if (!programs.length) return;
      selected = (selected + 1) % programs.length;
      render(programs);
    },

    fillPrograms: function (list) {
      programs = list || [];
      selected = 0;
      render(programs);
    }
  };

  global.SepgUI = SepgUI;
})(typeof window !== 'undefined' ? window : this);
