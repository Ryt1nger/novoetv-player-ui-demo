/**
 * SepgUI — mini-list программ на контроллере плеера (recycler).
 */
(function (global) {
  'use strict';

  var dom = global.DomUtils;
  var byId = dom.byId;
  var setClassVisible = dom.setClassVisible;

  var programs = [];
  var selected = 0;

  var PLAY_ICON = '../../assets/v4/icons/ic_play_program.svg';

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

    list.forEach(function (p, i) {
      var li = document.createElement('li');
      if (i === selected) li.className = 'selected';

      var showPlay = p.hasPlay || i === selected;
      li.innerHTML =
        '<span class="recycler-time">' + (p.time || '') + '</span>' +
        '<span class="recycler-name">' + (p.name || '') + '</span>' +
        (showPlay
          ? '<img class="recycler-play" src="' + PLAY_ICON + '" alt="">'
          : '');

      ul.appendChild(li);
    });
  }

  function resolveSelectedIndex(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].selected) return i;
    }
    return Math.min(2, list.length - 1);
  }

  function getSepgMock() {
    var data = global.mockData || null;
    if (data && data.sepg) return data.sepg;
    return global.__PLAYER_MOCK_SEPG__ || null;
  }

  var SepgUI = {
    applyDemo: function () {
      var data = getSepgMock();
      programs = (data && data.programs) || [
        { time: '16:00', name: 'Доброе утро. Часть 2' },
        { time: '18:40', name: 'Время. Часть 1' },
        { time: '21:00', name: 'Время', hasPlay: true, selected: true },
        { time: '23:30', name: 'Время. Часть 2' },
        { time: '00:40', name: 'Новости' }
      ];

      selected = resolveSelectedIndex(programs);
      setClassVisible('controller-recycler-wrap', true);
      setClassVisible('playing-error-bar-sepg', false);
      render(programs);
    },

    applyLoadingDemo: function () {
      setClassVisible('controller-recycler-wrap', true);
      setClassVisible('playing-error-bar-sepg', false);

      var ul = byId('controller-list');
      if (ul) ul.innerHTML = '<li class="loading-item">Загрузка…</li>';
    },

    applyEmptyDemo: function () {
      setClassVisible('controller-recycler-wrap', true);
      setClassVisible('playing-error-bar-sepg', false);
      render([]);
    },

    applyStreamErrorDemo: function (msg) {
      this.applyDemo();

      var bar = byId('playing-error-bar-sepg');
      if (bar) {
        bar.textContent = msg || 'Ошибка открытия архива. Повторный запрос...';
        setClassVisible('playing-error-bar-sepg', true);
      }
    },

    hide: function () {
      setClassVisible('controller-recycler-wrap', false);
      setClassVisible('playing-error-bar-sepg', false);
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
