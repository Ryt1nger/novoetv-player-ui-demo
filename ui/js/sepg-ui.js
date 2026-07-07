(function (global) {
  'use strict';

  var SLOT_IDS = ['sepg-channel-0', 'sepg-channel-1', 'sepg-channel-2'];
  var POSTER = '../../mocks/channel-poster-ntv.png';

  var state = {
    programs: [],
    selectedIndex: 1,
    hasRecord: true,
    showArrows: true
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

  function buildProgramHtml(program, selected) {
    if (!program) {
      return '<div style="text-align:center; margin-top:10px;">Данные отсутствуют</div>';
    }

    var progress = program.progress || 0;
    var showLine = progress > 0;
    var showPlay = !!(selected && program.hasPlay && state.hasRecord);

    var html = '<div class="sepg-image">' +
      '<img class="absolute_img" src="' + (program.poster || POSTER) + '" alt="">' +
      (showPlay ? '<img class="absolute_play" src="img/sepg_play.png" alt="">' : '') +
      '</div>';
    html += '<div class="sepg-name"><table width="100%" height="100%"><tr><td valign="center">' +
      (program.time ? program.time + ' ' : '') + (program.name || '') +
      '</td></tr></table></div>';
    html += '<div class="sepg-line" style="' + (showLine ? '' : 'display:none') + '">' +
      '<div class="sepg-line-inner" style="width:' + Math.round(progress) + '%;"></div></div>';
    return html;
  }

  function setArrowVisibility() {
    var left = byId('sepg-left-arrow');
    var right = byId('sepg-right-arrow');
    var show = state.showArrows;
    if (left) left.style.visibility = show ? 'visible' : 'hidden';
    if (right) right.style.visibility = show ? 'visible' : 'hidden';
  }

  var SepgUI = {
    SLOT_IDS: SLOT_IDS,

    setTitle: function (text) {
      var el = byId('sepg-block-title');
      if (el) el.textContent = text || '';
    },

    setHasRecord: function (hasRecord) {
      state.hasRecord = !!hasRecord;
    },

    setProgram: function (slotIndex, program, selected) {
      var id = SLOT_IDS[slotIndex];
      var li = byId(id);
      if (!li) return;
      li.classList.toggle('selected', !!selected);
      li.innerHTML = buildProgramHtml(program, selected);
    },

    fillPrograms: function (centerIndex, programs) {
      state.programs = programs || [];
      state.selectedIndex = centerIndex;
      var ul = byId('sepg-menu-list');
      if (ul) ul.className = 'bottom selected';

      this.setProgram(0, state.programs[centerIndex - 1], false);
      this.setProgram(1, state.programs[centerIndex], true);
      this.setProgram(2, state.programs[centerIndex + 1], false);
      setArrowVisibility();
    },

    showLoading: function (show) {
      var container = byId('sepg-container');
      var loading = byId('sepg-container-loading');
      if (show) {
        if (container) container.style.display = 'none';
        if (loading) {
          loading.style.display = '';
          loading.classList.remove('preview-hidden');
        }
        SLOT_IDS.forEach(function (id, i) {
          var li = byId(id);
          if (li && container && container.style.display === 'none') {
            li.classList.remove('selected');
            li.innerHTML = '<div class="loading"><img src="img/loading_data.gif" width="30" alt=""></div>';
          }
        });
      } else {
        if (loading) {
          loading.style.display = 'none';
          loading.classList.add('preview-hidden');
        }
        if (container) container.style.display = '';
      }
    },

    showEmpty: function () {
      this.setTitle('');
      state.showArrows = true;
      this.fillPrograms(0, [null, null, null]);
    },

    showStreamError: function (message) {
      var bar = byId('playing-error-bar-sepg');
      if (!bar) return;
      if (message) {
        bar.textContent = message;
        setVisible('playing-error-bar-sepg', true);
      } else {
        setVisible('playing-error-bar-sepg', false);
      }
    },

    shiftLeft: function () {
      if (state.selectedIndex > 1) {
        this.fillPrograms(state.selectedIndex - 1, state.programs);
      }
    },

    shiftRight: function () {
      if (state.selectedIndex < state.programs.length - 2) {
        this.fillPrograms(state.selectedIndex + 1, state.programs);
      }
    },

    applyDemo: function () {
      this.showStreamError(null);
      this.showLoading(false);
      this.setHasRecord(true);
      state.showArrows = true;
      this.setTitle('Программа передач — NTV');

      var programs = [
        { time: '18:00', name: 'Утренний эфир', poster: POSTER },
        { time: '20:00', name: 'Сёстры, 1-2 серия', poster: POSTER, progress: 35, hasPlay: true },
        { time: '22:00', name: 'Вечерние новости', poster: POSTER },
        { time: '23:30', name: 'Ночной эфир', poster: POSTER },
        { time: '00:15', name: 'Кино', poster: POSTER }
      ];
      this.fillPrograms(1, programs);
    },

    applyLoadingDemo: function () {
      this.showStreamError(null);
      this.setTitle('');
      state.showArrows = false;
      setArrowVisibility();
      var container = byId('sepg-container');
      if (container) container.style.display = '';
      var loading = byId('sepg-container-loading');
      if (loading) {
        loading.style.display = 'none';
        loading.classList.add('preview-hidden');
      }
      SLOT_IDS.forEach(function (id) {
        var li = byId(id);
        if (li) {
          li.classList.remove('selected');
          li.innerHTML = '<div class="loading"><img src="img/loading_data.gif" width="30" alt=""></div>';
        }
      });
    },

    applyEmptyDemo: function () {
      this.showLoading(false);
      this.showStreamError(null);
      this.showEmpty();
    },

    applyStreamErrorDemo: function (message) {
      this.applyDemo();
      this.showStreamError(
        message || 'Ошибка открытия архива. Повторный запрос...'
      );
    }
  };

  global.SepgUI = SepgUI;
})(typeof window !== 'undefined' ? window : this);
