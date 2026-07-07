(function (global) {
  'use strict';

  var state = {
    days: [],
    programs: [],
    selectedDayIndex: 0,
    selectedProgramIndex: 0,
    daysWindowStart: 0,
    programsWindowStart: 0,
    focusedColumn: 'programs',
    hasRecord: true
  };

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

  var DISPLAY_ROWS = 8;

  function visibleWindow(length, selectedIndex) {
    if (length <= DISPLAY_ROWS) {
      return { start: 0, count: length };
    }
    var start = selectedIndex - Math.floor(DISPLAY_ROWS / 2);
    if (start < 0) start = 0;
    if (start + DISPLAY_ROWS > length) start = length - DISPLAY_ROWS;
    return { start: start, count: DISPLAY_ROWS };
  }

  function buildRecordClass(program) {
    if (!program) return '';
    if (program.locked) return 'locked';
    var cls = '';
    if (program.activeRecord) cls = 'active-record';
    else if (program.hasRecord) cls = 'has-record';
    if (program.myrecord) cls += (cls ? ' ' : '') + 'myrecord';
    return cls;
  }

  function buildProgramHtml(program) {
    if (!program) return '';
    var recordClass = buildRecordClass(program);
    var timeClass = program.past ? 'epg-past' : (program.future ? 'epg-future' : '');
    var html = '';
    if (recordClass) {
      html += '<div class="epg-program-record ' + recordClass + '"></div>';
    }
    html += '<div class="epg-program-time ' + timeClass + '">' + (program.time || '') + '</div>';
    html += '<div class="epg-program-name ' + timeClass + '">' + (program.name || '') + '</div>';
    return html;
  }

  function buildDetailsHtml(details) {
    if (!details) return '';
    var html = "<div class='text-data' id='program-text-data'>";
    html += "<div class='program-image' id='program-image'></div>";
    if (details.timestart) {
      html += "<div class='program-timestart' id='program-timestart'>" + details.timestart + '</div>';
    }
    html += "<div class='program-name' id='program-name'>" + (details.name || '') + '</div>';
    if (details.subtitle) {
      html += "<div class='program-subtitle' id='program-subtitle'>" + details.subtitle + '</div>';
    }
    if (details.description) {
      html += "<div class='program-description' id='program-description'>" + details.description + '</div>';
    }
    html += '</div>';
    if (details.rating) {
      var rating = String(details.rating);
      if (rating.slice(-1) !== '+') rating += '+';
      html += "<div class='program-rating' id='program-rating'><span>Рейтинг</span>" + rating + '</div>';
    }
    return html;
  }

  function updateDaySelection() {
    var ul = byId('epg-days-list');
    if (!ul) return;
    ul.classList.toggle('selected', state.focusedColumn === 'days');
    var items = ul.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('selected', state.daysWindowStart + i === state.selectedDayIndex);
    }
  }

  function updateProgramSelection() {
    var ul = byId('epg-list');
    if (!ul) return;
    ul.classList.toggle('selected', state.focusedColumn === 'programs');
    var items = ul.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('selected', state.programsWindowStart + i === state.selectedProgramIndex);
    }
  }

  var EpgUI = {
    setHeaders: function (category, channelName, channelDescription) {
      var cat = byId('epg-category');
      var ch = byId('epg-channel-name');
      var desc = byId('epg-channel-description');
      if (cat) cat.textContent = category || '';
      if (ch) ch.textContent = channelName || '';
      if (desc) desc.textContent = channelDescription || '';
    },

    setHeaderClock: function (dateText, timeText) {
      var dateEl = document.querySelector('#epg-screen .header-date');
      var timeEl = document.querySelector('#epg-screen .header-time');
      if (dateEl) dateEl.textContent = dateText || '';
      if (timeEl) timeEl.textContent = timeText || '';
    },

    setHasRecord: function (hasRecord) {
      state.hasRecord = !!hasRecord;
    },

    fillDays: function (days, selectedIndex) {
      state.days = days || [];
      state.selectedDayIndex = selectedIndex || 0;
      var ul = byId('epg-days-list');
      if (!ul) return;
      ul.innerHTML = '';
      var win = visibleWindow(state.days.length, state.selectedDayIndex);
      state.daysWindowStart = win.start;
      for (var i = 0; i < win.count; i++) {
        var sourceIndex = win.start + i;
        var li = document.createElement('li');
        li.id = 'epgday' + sourceIndex;
        li.textContent = state.days[sourceIndex];
        ul.appendChild(li);
      }
      updateDaySelection();
    },

    fillPrograms: function (programs, selectedIndex) {
      state.programs = programs || [];
      state.selectedProgramIndex = typeof selectedIndex === 'number' ? selectedIndex : 0;
      var ul = byId('epg-list');
      if (!ul) return;
      ul.innerHTML = '';
      var win = visibleWindow(state.programs.length, state.selectedProgramIndex);
      state.programsWindowStart = win.start;
      for (var i = 0; i < win.count; i++) {
        var sourceIndex = win.start + i;
        var li = document.createElement('li');
        li.id = 'epg' + sourceIndex;
        li.innerHTML = buildProgramHtml(state.programs[sourceIndex]);
        ul.appendChild(li);
      }
      updateProgramSelection();
      var selected = state.programs[state.selectedProgramIndex];
      var mock = global.__EPG_MOCK__;
      if (selected && selected.details) {
        this.setProgramDetails(selected.details);
      } else if (mock && mock.programDetails && state.selectedProgramIndex === (mock.selectedProgramIndex || 0)) {
        this.setProgramDetails(mock.programDetails);
      }
    },

    setProgramDetails: function (details) {
      var el = byId('program-data');
      if (!el) return;
      el.innerHTML = buildDetailsHtml(details);
      el.style.visibility = '';
      setVisible('program-data', true);
      setVisible('program-data-loading', false);
    },

    setFocusedColumn: function (column) {
      state.focusedColumn = column === 'days' ? 'days' : 'programs';
      updateDaySelection();
      updateProgramSelection();
    },

    showProgramsLoading: function (show) {
      setVisible('epg-data-loading', show);
      setVisible('epg-list', !show);
      setVisible('no-epg-message', false);
    },

    showDetailsLoading: function (show) {
      setVisible('program-data-loading', show);
      if (show) {
        var data = byId('program-data');
        if (data) data.style.visibility = 'hidden';
      }
    },

    showEmpty: function (message) {
      this.showProgramsLoading(false);
      var msg = byId('no-epg-message');
      if (msg) msg.textContent = message || 'Программа передач недоступна';
      setVisible('no-epg-message', true);
      setVisible('epg-list', false);
      var data = byId('program-data');
      if (data) data.innerHTML = '';
      setVisible('program-data-loading', false);
    },

    shiftSelection: function (delta) {
      if (state.focusedColumn === 'days') {
        var nextDay = state.selectedDayIndex + delta;
        if (nextDay >= 0 && nextDay < state.days.length) {
          state.selectedDayIndex = nextDay;
          this.fillDays(state.days, state.selectedDayIndex);
        }
      } else {
        var nextProg = state.selectedProgramIndex + delta;
        if (nextProg >= 0 && nextProg < state.programs.length) {
          state.selectedProgramIndex = nextProg;
          this.fillPrograms(state.programs, state.selectedProgramIndex);
        }
      }
    },

    applyDemo: function () {
      var mock = global.__EPG_MOCK__;
      if (!mock) {
        this.applyDemoFallback();
        return;
      }
      this.showProgramsLoading(false);
      this.showDetailsLoading(false);
      this.setHeaders(mock.category, mock.channelName, mock.channelDescription);
      this.setHeaderClock(mock.headerDate, mock.headerTime);
      this.setHasRecord(mock.hasRecord !== false);
      this.fillDays(mock.days, mock.selectedDayIndex || 0);
      this.fillPrograms(mock.programs, mock.selectedProgramIndex || 0);
      this.setFocusedColumn(mock.focusedColumn || 'programs');
      if (mock.programDetails) {
        this.setProgramDetails(mock.programDetails);
      }
    },

    applyDemoFallback: function () {
      this.setHeaders('Все каналы', '013. NTV', 'Общероссийский телеканал');
      this.setHeaderClock('7 июля', '20:15');
      this.fillDays(['Сегодня, 7 июля', 'Завтра, 8 июля', 'Среда, 9 июля'], 0);
      this.fillPrograms([
        { time: '18:00', name: 'Утренний эфир', past: true },
        { time: '20:00', name: 'Сёстры, 1-2 серия', hasRecord: true, activeRecord: true,
          details: { timestart: '20:00 — 21:30', name: 'Сёстры, 1-2 серия', subtitle: 'Драма',
            description: 'История трёх сестёр.', rating: '12+' } },
        { time: '22:00', name: 'Вечерние новости', hasRecord: true, future: true }
      ], 1);
      this.setFocusedColumn('programs');
    },

    applyLoadingDemo: function () {
      this.applyDemo();
      this.showProgramsLoading(true);
      this.showDetailsLoading(true);
    },

    applyEmptyDemo: function () {
      this.setHeaders('Все каналы', '013. NTV', '');
      this.setHeaderClock('7 июля', '20:15');
      this.fillDays(['Сегодня, 7 июля'], 0);
      this.setFocusedColumn('days');
      this.showEmpty('Программа передач недоступна');
    }
  };

  global.EpgUI = EpgUI;
})(typeof window !== 'undefined' ? window : this);
