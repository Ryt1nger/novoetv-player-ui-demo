/**
 * EpgUI — IPTV TV Guide (категории, каналы, программы, даты).
 */
(function (global) {
  'use strict';

  var dom = global.DomUtils;
  var byId = dom.byId;
  var setVisible = dom.setVisible;

  var PLAY_ICON = '<img class="prog-play" src="../../assets/v4/icons/ic_play_program.svg" alt="">';

  var state = {
    categories: [],
    categoryIndex: 0,
    days: [],
    channels: [],
    programs: [],
    dayIndex: 0,
    channelIndex: 0,
    programIndex: 0,
    focus: 'programs',
    dateScreenOpen: false,
    guideMode: 'category',
    hidden: true
  };

  /* --- Демо-данные по умолчанию --- */

  function defaultChannels() {
    return [
      { number: '001', name: 'Первый', icon: '../../mocks/channel-poster-perviy.svg', epg: 'Время', time: '21:00' },
      { number: '277', name: 'Матч! ТВ HD', icon: '../../mocks/channel-poster-match.svg', epg: 'Fight Nights', time: '21:00' },
      { number: '002', name: 'Россия 1', icon: '../../assets/v4/img_default_channel.png', epg: 'Вечерний эфир', time: '20:30' }
    ];
  }

  function defaultChannelGuideDays() {
    return [
      'Чт, 2 июля', 'Пт, 3 июля', 'Сб, 4 июля', 'Вс, 5 июля',
      'Пн, 6 июля', 'Вт, 7 июля', 'Сегодня', 'Чт, 9 июля'
    ];
  }

  function defaultChannelGuidePrograms() {
    return [
      { time: '12:30', name: 'Новости', past: true },
      { time: '13:00', name: 'Футбол. Обзор', past: true, hasRecord: true },
      { time: '18:55', name: 'Футбол. Winline Суперсерия. Зенит (Россия) - Нефтчи (Узбекистан)...', past: true, hasRecord: true },
      {
        time: '21:00',
        name: 'Смешанные единоборства. Бетсити Fight Nights. Трансляция из Каспийска',
        hasRecord: true,
        activeRecord: true,
        details: {
          timestart: '21:00',
          name: 'Смешанные единоборства. Бетсити Fight Nights. Трансляция из Каспийска',
          description: 'Трансляция турнира смешанных единоборств из Каспийска.',
          rating: '6+',
          poster: '../../mocks/program-poster-fight-nights.svg'
        }
      },
      { time: '23:30', name: 'Итоги дня', future: true }
    ];
  }

  /* --- Синхронизация видимости --- */

  function syncGuideModeClass() {
    var guide = byId('iptv-guide');
    if (guide) guide.classList.toggle('channel-first', state.guideMode === 'channel');
  }

  function syncDetailVisibility() {
    var guide = byId('iptv-guide');
    var detail = document.querySelector('.iptv-detail-pane');
    var showDetail = state.focus === 'detail' && !state.dateScreenOpen;

    if (guide) guide.classList.toggle('has-detail', showDetail);
    if (detail) detail.classList.toggle('preview-hidden', !showDetail);
  }

  function syncGuideVisibility() {
    if (state.hidden) {
      setVisible('iptv-guide', false);
      setVisible('iptv-date-screen', false);
      return;
    }

    if (state.dateScreenOpen) {
      setVisible('iptv-guide', false);
      setVisible('iptv-date-screen', true);
    } else {
      setVisible('iptv-date-screen', false);
      setVisible('iptv-guide', true);
      syncDetailVisibility();
    }
  }

  function syncInlineChannelHeader() {
    var ch = state.channels[state.channelIndex] || state.channels[0] || {};
    var logo = byId('iptv-inline-channel-logo');
    var name = byId('iptv-inline-channel-name');

    if (logo) logo.src = ch.icon || '../../mocks/channel-poster-perviy.svg';
    if (name) name.textContent = ch.name || 'Первый';
  }

  function syncHeader() {
    var ch = state.channels[state.channelIndex] || {};
    var logo = byId('iptv-date-header-logo');
    var name = byId('iptv-date-header-channel');

    if (logo) logo.src = ch.icon || '../../assets/v4/img_default_channel.png';
    if (name) name.textContent = ch.name || 'Канал';
  }

  /* --- Рендер списков --- */

  function renderCategories() {
    var ul = byId('iptv-category-list');
    if (!ul) return;

    ul.innerHTML = '';
    state.categories.forEach(function (label, i) {
      var li = document.createElement('li');
      if (i === state.categoryIndex) li.classList.add('selected');
      if (state.focus === 'categories' && i === state.categoryIndex) li.classList.add('focused');
      li.textContent = label;
      ul.appendChild(li);
    });
  }

  function renderInlineDays() {
    var ul = byId('iptv-inline-date-list');
    if (!ul) return;

    ul.innerHTML = '';
    state.days.forEach(function (label, i) {
      var li = document.createElement('li');
      if (label.indexOf('Сегодня') === 0) li.classList.add('today');
      if (i === state.dayIndex) li.classList.add('selected');
      if (state.focus === 'days' && i === state.dayIndex && state.guideMode === 'channel') {
        li.classList.add('focused');
      }
      li.textContent = label.replace(/^Сегодня,\s*/, 'Сегодня');
      ul.appendChild(li);
    });

    var back = byId('iptv-inline-back');
    if (back) back.classList.toggle('focused', state.focus === 'days' && state.guideMode === 'channel');
  }

  function renderDays() {
    var ul = byId('iptv-date-list');
    if (!ul) return;

    ul.innerHTML = '';
    state.days.forEach(function (label, i) {
      var li = document.createElement('li');
      if (i === 0) li.classList.add('today');
      if (i === state.dayIndex) li.classList.add('selected');
      if (state.focus === 'days' && i === state.dayIndex) li.classList.add('focused');
      li.textContent = label;
      ul.appendChild(li);
    });

    var back = byId('iptv-date-back');
    if (back) back.classList.toggle('focused', state.focus === 'days' && state.dateScreenOpen);
  }

  function renderChannels() {
    var ul = byId('iptv-channel-list');
    if (!ul) return;

    ul.innerHTML = '';
    state.channels.forEach(function (ch, i) {
      var li = document.createElement('li');
      if (i === state.channelIndex) li.classList.add('selected');
      if (state.focus === 'channels' && i === state.channelIndex) li.classList.add('focused');

      li.innerHTML =
        '<span class="ch-num">' + (ch.number || '') + '</span>' +
        '<img src="' + (ch.icon || '../../assets/v4/img_default_channel.png') + '" alt="">' +
        '<div class="ch-meta">' +
          '<div class="ch-epg">' + (ch.epg || '') + '</div>' +
          (ch.time ? '<div class="ch-time">' + ch.time + '</div>' : '') +
        '</div>';

      ul.appendChild(li);
    });
  }

  function renderPrograms() {
    var ul = byId('iptv-program-list');
    if (!ul) return;

    ul.innerHTML = '';
    state.programs.forEach(function (p, i) {
      var li = document.createElement('li');
      if (i === state.programIndex) li.classList.add('selected');
      if (state.focus === 'programs' && i === state.programIndex) li.classList.add('focused');
      if (!p.past && !p.future) li.classList.add('current');

      var play = (p.hasRecord || p.activeRecord) ? PLAY_ICON : '<span class="prog-play"></span>';
      li.innerHTML =
        '<span class="prog-bar"></span>' +
        play +
        '<span class="prog-time">' + (p.time || '') + '</span>' +
        '<span class="prog-name">' + (p.name || '') + '</span>';

      ul.appendChild(li);
    });
  }

  function renderDetail() {
    var p = state.programs[state.programIndex] || {};
    var d = p.details || (global.__EPG_MOCK__ && global.__EPG_MOCK__.programDetails) || {};
    var ch = state.channels[state.channelIndex] || state.channels[0] || {};

    var title = byId('iptv-detail-title');
    var desc = byId('iptv-detail-description');
    var rating = byId('iptv-detail-rating');
    var time = byId('iptv-detail-time');
    var poster = byId('iptv-detail-poster');

    if (title) title.textContent = d.name || p.name || '';
    if (desc) desc.textContent = d.description || d.subtitle || '';
    if (rating) rating.textContent = d.rating || '';
    if (time) time.textContent = d.timestart || (p.time || '');
    if (poster) {
      poster.src = d.poster || ch.poster || ch.icon || '../../mocks/channel-poster-match.svg';
    }

    var stream = byId('iptv-detail-stream');
    var watch = byId('iptv-detail-watch');
    if (stream) stream.classList.toggle('focused', state.focus === 'detail');
    if (watch) watch.classList.toggle('focused', state.focus === 'detail');
  }

  function renderAll() {
    syncGuideVisibility();
    syncGuideModeClass();
    syncInlineChannelHeader();
    renderCategories();
    syncHeader();
    renderDays();
    renderInlineDays();
    renderChannels();
    renderPrograms();
    renderDetail();
    syncDetailVisibility();
  }

  function setPaneLoading(id, visible) {
    setVisible(id, visible);
  }

  /* --- Публичный API --- */

  var EpgUI = {
    applyDemo: function () {
      var mock = global.__EPG_MOCK__ || {};

      state.guideMode = 'category';
      state.categories = mock.categories || [
        'Все каналы', 'Избранное', 'Эфирные', 'Кино', 'Детские', 'Спорт', 'Музыка'
      ];
      state.categoryIndex = mock.selectedCategoryIndex || 0;
      state.days = mock.days || [
        'Сегодня, 7 июля', 'Завтра, 8 июля', 'Среда, 9 июля',
        'Четверг, 10 июля', 'Пятница, 11 июля'
      ];
      state.channels = mock.channels || defaultChannels();
      state.programs = mock.programs || [];
      state.dayIndex = mock.selectedDayIndex || 0;
      state.programIndex = mock.selectedProgramIndex || 0;
      state.channelIndex = 0;
      state.focus = mock.focusedColumn === 'days' ? 'days' : 'programs';
      state.dateScreenOpen = state.focus === 'days';
      state.hidden = false;

      setPaneLoading('iptv-program-loading', false);
      setPaneLoading('iptv-channel-loading', false);
      setVisible('iptv-program-empty', false);
      renderAll();
    },

    applyChannelGuideDemo: function () {
      var mock = (global.__EPG_MOCK__ && global.__EPG_MOCK__.channelGuide) || {};

      state.guideMode = 'channel';
      state.dateScreenOpen = false;
      state.hidden = false;
      state.channels = mock.channels || defaultChannels();
      state.channelIndex = mock.channelIndex || 0;
      state.days = mock.days || defaultChannelGuideDays();
      state.dayIndex = mock.selectedDayIndex != null ? mock.selectedDayIndex : 6;
      state.programs = mock.programs || defaultChannelGuidePrograms();
      state.programIndex = mock.selectedProgramIndex != null ? mock.selectedProgramIndex : 2;
      state.focus = mock.focusedColumn || 'programs';

      setPaneLoading('iptv-program-loading', false);
      setPaneLoading('iptv-channel-loading', false);
      setVisible('iptv-program-empty', false);
      renderAll();
    },

    applyLoadingDemo: function () {
      this.applyDemo();
      state.dateScreenOpen = false;
      state.focus = 'programs';
      setPaneLoading('iptv-program-loading', true);
      setPaneLoading('iptv-channel-loading', false);
      setVisible('iptv-program-empty', false);

      var ul = byId('iptv-program-list');
      if (ul) ul.innerHTML = '';
      renderAll();
    },

    applyChannelLoadingDemo: function () {
      this.applyDemo();
      state.dateScreenOpen = false;
      state.focus = 'channels';
      setPaneLoading('iptv-channel-loading', true);
      setPaneLoading('iptv-program-loading', false);
      setVisible('iptv-program-empty', false);

      var ul = byId('iptv-channel-list');
      if (ul) ul.innerHTML = '';
      renderAll();
    },

    applyEmptyDemo: function () {
      this.applyDemo();
      state.dateScreenOpen = false;
      state.focus = 'programs';
      state.programs = [];
      setPaneLoading('iptv-program-loading', false);
      setPaneLoading('iptv-channel-loading', false);
      setVisible('iptv-program-empty', true);
      renderAll();
    },

    showDateScreen: function () {
      state.dateScreenOpen = true;
      state.focus = 'days';
      state.hidden = false;
      renderAll();
    },

    hideDateScreen: function () {
      state.dateScreenOpen = false;
      if (state.focus === 'days') state.focus = 'programs';
      renderAll();
    },

    setFocusedColumn: function (column) {
      if (column === 'categories') {
        state.guideMode = 'category';
        state.dateScreenOpen = false;
        state.focus = 'categories';
      } else if (column === 'days') {
        if (state.guideMode === 'channel') {
          state.dateScreenOpen = false;
          state.focus = 'days';
        } else {
          state.dateScreenOpen = true;
          state.focus = 'days';
        }
      } else if (column === 'channels') {
        state.dateScreenOpen = false;
        state.focus = 'channels';
      } else if (column === 'programs') {
        state.dateScreenOpen = false;
        state.focus = 'programs';
      } else if (column === 'detail') {
        state.dateScreenOpen = false;
        state.focus = 'detail';
      }
      renderAll();
    },

    shiftSelection: function (delta) {
      if (state.focus === 'categories') {
        state.categoryIndex = Math.max(0, Math.min(state.categories.length - 1, state.categoryIndex + delta));
      } else if (state.focus === 'days') {
        state.dayIndex = Math.max(0, Math.min(state.days.length - 1, state.dayIndex + delta));
        if (state.guideMode === 'channel') syncInlineChannelHeader();
      } else if (state.focus === 'channels') {
        state.channelIndex = Math.max(0, Math.min(state.channels.length - 1, state.channelIndex + delta));
        syncHeader();
      } else if (state.focus === 'programs') {
        state.programIndex = Math.max(0, Math.min(state.programs.length - 1, state.programIndex + delta));
      }
      renderAll();
    },

    hide: function () {
      state.hidden = true;
      state.dateScreenOpen = false;
      setVisible('iptv-guide', false);
      setVisible('iptv-date-screen', false);
    },

    isDateScreenOpen: function () {
      return !!state.dateScreenOpen;
    }
  };

  global.EpgUI = EpgUI;
})(typeof window !== 'undefined' ? window : this);
