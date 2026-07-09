(function (global) {
  'use strict';

  var ACTION_BUTTONS = [
    { id: 'program', label: 'Программа', icon: 'program' },
    { id: 'watch', label: 'Буду смотреть', icon: 'watch' },
    { id: 'favorite', label: 'Добавить в Избранное', icon: 'favorite' }
  ];

  var ICON_BASE = '../../assets/v4/icons/';

  function actionIcon(name, marked) {
    var file = name;
    if (name === 'favorite' && marked) file = 'ic_favorite_filled';
    else if (name === 'watch' && marked) file = 'ic_watch_filled';
    else file = 'ic_' + name;
    return '<img class="action-icon" src="' + ICON_BASE + file + '.svg" alt="">';
  }

  var aspectPadTimer = null;
  var clockTimer = null;
  var toastTimer = null;

  var PROGRAM_INFO_DEMO =
    'Союзники по НАТО поумерили ожидания от саммита после гневных тирад Трампа. ' +
    'Президент США выступил с резкой критикой партнёров по альянсу.';

  var ERROR_MSG_DEFAULT = 'Не удалось загрузить трансляцию. Попробуйте позже';

  var MODE_LABELS = {
    live: 'Прямой эфир',
    archive: 'Архив',
    video: 'Видео',
    onAir: 'Эфир'
  };

  var DEMO_CHANNEL = {
    name: 'Матч! ТВ HD',
    icon: '../../mocks/channel-poster-match.svg',
    program_name: 'Смешанные единоборства. Бетсити Fight Nights. Трансляция из Каспийска'
  };

  var state = {
    actionSelected: '',
    favoritesMarked: false,
    watchMarked: false,
    isLiveTv: true,
    showLiveBtn: false,
    isPaused: false,
    seekThumbPlay: false
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

  function formatSeconds(seconds, longFormat, compactHour) {
    seconds = parseInt(seconds, 10);
    if (isNaN(seconds)) seconds = 0;
    var timeHour = Math.floor(seconds / 3600);
    var timeMinute = Math.floor((seconds % 3600) / 60);
    var timeSecond = Math.floor(seconds % 60);
    var timeStr = '';

    if (longFormat) {
      if (compactHour && timeHour > 0) {
        timeStr += timeHour;
      } else if (timeHour === 0) {
        timeStr += '00';
      } else if (timeHour < 10) {
        timeStr += '0' + timeHour;
      } else {
        timeStr += timeHour;
      }
      timeStr += ':';
      if (timeMinute === 0) timeStr += '00';
      else if (timeMinute < 10) timeStr += '0' + timeMinute;
      else timeStr += timeMinute;
      timeStr += ':';
      if (timeSecond === 0) timeStr += '00';
      else if (timeSecond < 10) timeStr += '0' + timeSecond;
      else timeStr += timeSecond;
      return timeStr;
    }

    if (timeHour === 0) timeStr += '00';
    else if (timeHour < 10) timeStr += '0' + timeHour;
    else timeStr += timeHour;
    timeStr += ':';
    if (timeMinute === 0) timeStr += '00';
    else if (timeMinute < 10) timeStr += '0' + timeMinute;
    else timeStr += timeMinute;
    return timeStr;
  }

  function setProgramTag(kind) {
    var tagEl = byId('program-tag');
    if (!tagEl) return;
    tagEl.classList.remove('tag-live', 'tag-archive', 'tag-video');
    if (!kind) {
      tagEl.textContent = '';
      setVisible('program-tag', false);
      return;
    }
    if (kind === 'live') {
      tagEl.textContent = MODE_LABELS.live;
      tagEl.classList.add('tag-live');
    } else if (kind === 'archive') {
      tagEl.textContent = MODE_LABELS.archive;
      tagEl.classList.add('tag-archive');
    } else if (kind === 'video') {
      tagEl.textContent = MODE_LABELS.video;
      tagEl.classList.add('tag-video');
    }
    setVisible('program-tag', true);
  }

  function setSeekThumbPlay(playIcon) {
    state.seekThumbPlay = !!playIcon;
    var pin = byId('infobar-program-pin');
    var img = pin && pin.querySelector('img');
    if (!img) return;
    img.src = playIcon
      ? ICON_BASE + 'ic_play_program.svg'
      : ICON_BASE + 'ic_seekbar_thumb.svg';
  }

  function formatClock(d) {
    d = d || new Date();
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    var h = d.getHours();
    var m = d.getMinutes();
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' ' +
      (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function applyProgress(percent) {
    percent = Math.max(0, Math.min(100, percent));
    var pin = byId('infobar-program-pin');
    var progress = byId('infobar-program-progress');
    var container = byId('infobar-progress-info');
    if (!pin || !progress || !container) return;
    var pinWidth = (pin.querySelector('img') || pin).offsetWidth || 96;
    var totalWidth = Math.max(0, container.offsetWidth);
    var left = Math.floor(totalWidth * percent / 100);
    progress.style.width = left + 'px';
    pin.style.left = left + 'px';
  }

  function buildActions() {
    var wrap = byId('controller-actions');
    if (!wrap) return;
    wrap.innerHTML = '';

    var liveBtn = document.createElement('button');
    liveBtn.id = 'btn-live';
    liveBtn.className = 'btn-live';
    liveBtn.textContent = MODE_LABELS.onAir;
    liveBtn.type = 'button';
    if (!state.showLiveBtn) liveBtn.classList.add('preview-hidden');
    wrap.appendChild(liveBtn);

    for (var i = 0; i < ACTION_BUTTONS.length; i++) {
      var cfg = ACTION_BUTTONS[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'focus-switch';
      btn.setAttribute('data-action', cfg.id);
      var marked = (cfg.id === 'favorite' && state.favoritesMarked) ||
        (cfg.id === 'watch' && state.watchMarked);
      btn.innerHTML =
        '<span class="focus-switch-icon">' + actionIcon(cfg.icon, marked) + '</span>' +
        '<span class="focus-switch-label">' + cfg.label + '</span>';
      if (cfg.id === state.actionSelected) btn.classList.add('selected');
      if (marked) btn.classList.add('marked');
      wrap.appendChild(btn);
    }
  }

  function syncActionButtons() {
    var wrap = byId('controller-actions');
    if (!wrap) return;
    var liveBtn = byId('btn-live');
    if (liveBtn) liveBtn.classList.toggle('preview-hidden', !state.showLiveBtn);
    wrap.querySelectorAll('.focus-switch').forEach(function (btn) {
      var action = btn.getAttribute('data-action');
      var marked = (action === 'favorite' && state.favoritesMarked) ||
        (action === 'watch' && state.watchMarked);
      btn.classList.toggle('selected', action === state.actionSelected);
      btn.classList.toggle('marked', marked);
      var iconWrap = btn.querySelector('.focus-switch-icon');
      if (iconWrap && action) {
        iconWrap.innerHTML = actionIcon(action, marked);
      }
    });
  }

  function startClock() {
    var el = byId('footer-clock');
    if (!el) return;
    function tick() {
      el.textContent = formatClock();
    }
    tick();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tick, 30000);
  }

  var PlayerUI = {
    NAV_ACTIONS: ACTION_BUTTONS.map(function (a) { return a.id; }),
    ACTION_BUTTONS: ACTION_BUTTONS,

    buildNavigation: function () { this.buildActions(); },
    buildActions: buildActions,
    syncNavIcons: syncActionButtons,

    setNavSelected: function (index) {
      var action = ACTION_BUTTONS[index];
      if (action) this.setActionFocus(action.id);
    },

    setActionFocus: function (actionId) {
      state.actionSelected = actionId;
      syncActionButtons();
    },

    setDisabledIcons: function () {},
    setPlaying: function () {},
    setLiveTv: function (isLive) {
      state.isLiveTv = !!isLive;
      state.showLiveBtn = !state.isLiveTv;
      syncActionButtons();
    },

    setArchiveControls: function () {
      state.isLiveTv = false;
      state.showLiveBtn = true;
      state.isPaused = false;
      setProgramTag('archive');
      this.hideAspectPad();
      setSeekThumbPlay(false);
      syncActionButtons();
    },

    setProgramTag: setProgramTag,

    setFavoritesMarked: function (marked, silent) {
      state.favoritesMarked = !!marked;
      syncActionButtons();
      if (state.favoritesMarked && !silent) {
        this.showToast('Передача добавлена в папку «Избранное»');
      }
    },

    setWatchMarked: function (marked, silent) {
      state.watchMarked = !!marked;
      syncActionButtons();
      if (state.watchMarked && !silent) {
        this.showToast('Передача добавлена в папку «Буду смотреть»');
      }
    },

    showToast: function (message, ms) {
      var el = byId('player-toast');
      if (!el) return;
      if (!message) {
        setVisible('player-toast', false);
        return;
      }
      el.textContent = message;
      setVisible('player-toast', true);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () {
        setVisible('player-toast', false);
        toastTimer = null;
      }, ms || 4500);
    },

    showProgramInfo: function (text) {
      var box = byId('program-info-overlay');
      var p = byId('program-info-text');
      if (!box || !p) return;
      p.textContent = text || PROGRAM_INFO_DEMO;
      setVisible('program-info-overlay', true);
    },

    hideProgramInfo: function () {
      setVisible('program-info-overlay', false);
    },

    setChannel: function (channel) {
      channel = channel || {};
      var icon = byId('player-channel-icon');
      if (icon) icon.src = channel.icon || '../../assets/v4/img_default_channel.png';

      var nameEl = byId('infobar-channel-name');
      var programEl = byId('infobar-program-name');
      var tagEl = byId('program-tag');
      if (nameEl) nameEl.textContent = channel.name || '';
      if (programEl) programEl.textContent = channel.program_name || '';
      if (channel.tag) {
        if (channel.tag === MODE_LABELS.live) setProgramTag('live');
        else if (channel.tag === MODE_LABELS.archive) setProgramTag('archive');
        else if (channel.tag === MODE_LABELS.video) setProgramTag('video');
        else {
          tagEl.textContent = channel.tag;
          setVisible('program-tag', true);
        }
      }
    },

    setProgress: function (percent, currentSec, durationSec) {
      applyProgress(percent);
      var te = byId('infobar-program-time');
      var de = byId('infobar-program-duration');
      if (currentSec !== undefined && te) {
        te.textContent = formatSeconds(currentSec, true, true);
      }
      if (durationSec !== undefined && de) {
        de.textContent = formatSeconds(durationSec, true, true);
      }
    },

    setVodMode: function (vod) {
      var screen = byId('player-screen');
      if (screen) screen.classList.toggle('vod', !!vod);
    },

    showInfobar: function (show) {
      setVisible('player-controller', show !== false);
    },

    showFwdBar: function () {
      this.showInfobar(true);
    },

    showLoading: function (show) {
      setVisible('loading-bar', !!show);
    },

    showError: function (message) {
      var bar = byId('playing-error-bar');
      if (!bar) return;
      if (message) {
        bar.textContent = message;
        setVisible('playing-error-bar', true);
        setVisible('loading-bar', false);
        this.hideAspectPad();
        setProgramTag(null);
        state.showLiveBtn = true;
        state.isPaused = false;
        setSeekThumbPlay(true);
        this.setProgress(0, 0, 0);
        var te = byId('infobar-program-time');
        var de = byId('infobar-program-duration');
        if (te) te.textContent = '00:00';
        if (de) de.textContent = '00:00';
        syncActionButtons();
        this.showInfobar(true);
      } else {
        setVisible('playing-error-bar', false);
        setSeekThumbPlay(false);
      }
    },

    setPaused: function (paused) {
      state.isPaused = !!paused;
      var screen = byId('player-screen');
      if (screen) screen.classList.toggle('is-paused', state.isPaused);
      setSeekThumbPlay(false);
    },

    hideAspectPad: function () {
      if (aspectPadTimer) {
        clearTimeout(aspectPadTimer);
        aspectPadTimer = null;
      }
      var el = byId('aspect-bar');
      if (el) el.textContent = '';
      setVisible('aspect-bar', false);
    },

    showAspectPad: function (text) {
      var el = byId('aspect-bar');
      if (!el || !text) {
        this.hideAspectPad();
        return;
      }
      el.textContent = text;
      setVisible('aspect-bar', true);
      if (aspectPadTimer) clearTimeout(aspectPadTimer);
      aspectPadTimer = window.setTimeout(function () {
        PlayerUI.hideAspectPad();
      }, 7000);
    },

    applyLiveDemo: function () {
      state.favoritesMarked = false;
      state.watchMarked = false;
      state.actionSelected = '';
      state.isLiveTv = true;
      state.showLiveBtn = false;
      state.isPaused = false;
      this.buildActions();
      this.setChannel(DEMO_CHANNEL);
      this.setLiveTv(true);
      setProgramTag('live');
      this.setProgress(6.2, 671, 10800);
      this.hideAspectPad();
      this.hideProgramInfo();
      this.showToast(null);
      this.showError(null);
      this.setVodMode(false);
      this.showInfobar(true);
      this.showLoading(true);
      setSeekThumbPlay(false);
      startClock();
    },

    applyPausedDemo: function () {
      this.applyPlayingDemo();
      this.setPaused(true);
    },

    applyPlayingDemo: function () {
      state.favoritesMarked = false;
      state.watchMarked = false;
      state.actionSelected = '';
      state.isLiveTv = true;
      state.showLiveBtn = false;
      state.isPaused = false;
      this.buildActions();
      this.setChannel(DEMO_CHANNEL);
      this.setLiveTv(true);
      setProgramTag('live');
      this.setProgress(6.2, 671, 10800);
      this.hideAspectPad();
      this.hideProgramInfo();
      this.showToast(null);
      this.showError(null);
      this.setVodMode(false);
      this.showInfobar(true);
      this.showLoading(false);
      setSeekThumbPlay(false);
      startClock();
    },

    applyBufferingDemo: function () {
      this.applyLiveDemo();
    },

    applyRebufferDemo: function () {
      this.applyPlayingDemo();
      this.setProgress(35, 525, 1500);
      this.hideAspectPad();
      this.showLoading(true);
    }
  };

  PlayerUI.ERROR_MSG_DEFAULT = ERROR_MSG_DEFAULT;
  PlayerUI.DEMO_CHANNEL = DEMO_CHANNEL;
  PlayerUI.DEMO_CHANNEL_ICON = DEMO_CHANNEL.icon;
  PlayerUI.DEMO_COMPANY_LOGO = '../../assets/v4/img_logo_player.png';
  PlayerUI.MODE_LABELS = MODE_LABELS;

  global.PlayerUI = PlayerUI;
})(typeof window !== 'undefined' ? window : this);
