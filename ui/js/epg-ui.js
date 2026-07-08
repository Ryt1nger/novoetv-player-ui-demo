(function (global) {
  'use strict';

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
    hidden: true
  };

  var PLAY_ICON = '<img class="prog-play" src="../../assets/v4/icons/ic_play_program.svg" alt="">';

  function byId(id) { return document.getElementById(id); }

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

  function defaultChannels() {
    return [
      { number: '013', name: 'NTV', icon: '../../mocks/channel-poster-ntv.png', epg: 'Сёстры, 1-2 серия', time: '20:00' },
      { number: '001', name: 'Первый', icon: '../../assets/v4/img_default_channel.png', epg: 'Новости', time: '21:00' },
      { number: '002', name: 'Россия 1', icon: '../../assets/v4/img_default_channel.png', epg: 'Вечерний эфир', time: '20:30' },
      { number: '006', name: 'СТС', icon: '../../assets/v4/img_default_channel.png', epg: 'Шоу', time: '19:45' }
    ];
  }

  function setPaneLoading(id, visible) {
    setVisible(id, visible);
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

  function renderCategories() {
    var ul = byId('iptv-category-list');
    if (!ul) return;
    ul.innerHTML = '';
    for (var i = 0; i < state.categories.length; i++) {
      var li = document.createElement('li');
      if (i === state.categoryIndex) li.classList.add('selected');
      if (state.focus === 'categories' && i === state.categoryIndex) li.classList.add('focused');
      li.textContent = state.categories[i];
      ul.appendChild(li);
    }
  }

  function renderDays() {
    var ul = byId('iptv-date-list');
    if (!ul) return;
    ul.innerHTML = '';
    for (var i = 0; i < state.days.length; i++) {
      var li = document.createElement('li');
      if (i === 0) li.classList.add('today');
      if (i === state.dayIndex) li.classList.add('selected');
      if (state.focus === 'days' && i === state.dayIndex) li.classList.add('focused');
      li.textContent = state.days[i];
      ul.appendChild(li);
    }
    var back = byId('iptv-date-back');
    if (back) back.classList.toggle('focused', state.focus === 'days' && state.dateScreenOpen);
  }

  function renderChannels() {
    var ul = byId('iptv-channel-list');
    if (!ul) return;
    ul.innerHTML = '';
    for (var i = 0; i < state.channels.length; i++) {
      var ch = state.channels[i];
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
    }
  }

  function renderPrograms() {
    var ul = byId('iptv-program-list');
    if (!ul) return;
    ul.innerHTML = '';
    for (var i = 0; i < state.programs.length; i++) {
      var p = state.programs[i];
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
    }
  }

  function renderDetail() {
    var p = state.programs[state.programIndex] || {};
    var d = p.details || (global.__EPG_MOCK__ && global.__EPG_MOCK__.programDetails) || {};
    var title = byId('iptv-detail-title');
    var desc = byId('iptv-detail-description');
    var rating = byId('iptv-detail-rating');
    var time = byId('iptv-detail-time');
    var poster = byId('iptv-detail-poster');
    if (title) title.textContent = d.name || p.name || '';
    if (desc) desc.textContent = d.description || d.subtitle || '';
    if (rating) rating.textContent = d.rating || '';
    if (time) time.textContent = d.timestart || (p.time || '');
    if (poster) poster.src = '../../mocks/channel-poster-ntv.png';

    var stream = byId('iptv-detail-stream');
    var watch = byId('iptv-detail-watch');
    if (stream) stream.classList.toggle('focused', state.focus === 'detail');
    if (watch) watch.classList.toggle('focused', state.focus === 'detail');
  }

  function syncHeader() {
    var ch = state.channels[state.channelIndex] || {};
    var logo = byId('iptv-date-header-logo');
    var name = byId('iptv-date-header-channel');
    if (logo) logo.src = ch.icon || '../../assets/v4/img_default_channel.png';
    if (name) name.textContent = ch.name || 'Канал';
  }

  function renderAll() {
    syncGuideVisibility();
    renderCategories();
    syncHeader();
    renderDays();
    renderChannels();
    renderPrograms();
    renderDetail();
    syncDetailVisibility();
  }

  var EpgUI = {
    applyDemo: function () {
      var mock = global.__EPG_MOCK__ || {};
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
        state.dateScreenOpen = false;
        state.focus = 'categories';
      } else if (column === 'days') {
        state.dateScreenOpen = true;
        state.focus = 'days';
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
    }
  };

  global.EpgUI = EpgUI;
})(typeof window !== 'undefined' ? window : this);
