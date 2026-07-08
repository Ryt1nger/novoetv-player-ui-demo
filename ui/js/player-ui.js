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

  var MODE_LABELS = {
    live: 'Прямой эфир',
    archive: 'Архив',
    video: 'Видео',
    onAir: 'Эфир'
  };

  var state = {
    actionSelected: 'watch',
    favoritesMarked: false,
    isLiveTv: true,
    showLiveBtn: false
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

  function formatSeconds(seconds, longFormat) {
    seconds = parseInt(seconds, 10);
    if (isNaN(seconds)) seconds = 0;
    var timeHour = Math.floor(seconds / 3600);
    var timeMinute = Math.floor((seconds % 3600) / 60);
    var timeSecond = Math.floor(seconds % 60);
    var timeStr = '';

    if (timeHour === 0) timeStr += '00';
    else if (timeHour < 10) timeStr += '0' + timeHour;
    else timeStr += timeHour;

    timeStr += ':';
    if (timeMinute === 0) timeStr += '00';
    else if (timeMinute < 10) timeStr += '0' + timeMinute;
    else timeStr += timeMinute;

    if (longFormat) {
      timeStr += ':';
      if (timeSecond === 0) timeStr += '00';
      else if (timeSecond < 10) timeStr += '0' + timeSecond;
      else timeStr += timeSecond;
    }

    return timeStr;
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
      var marked = cfg.id === 'favorite' && state.favoritesMarked;
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
      var marked = action === 'favorite' && state.favoritesMarked;
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
      syncActionButtons();
    },

    setFavoritesMarked: function (marked) {
      state.favoritesMarked = !!marked;
      syncActionButtons();
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
      if (tagEl) {
        if (channel.tag) {
          tagEl.textContent = channel.tag;
          setVisible('program-tag', true);
        } else {
          tagEl.textContent = '';
          setVisible('program-tag', false);
        }
      }
    },

    setProgress: function (percent, currentSec, durationSec) {
      applyProgress(percent);
      var te = byId('infobar-program-time');
      var de = byId('infobar-program-duration');
      if (currentSec !== undefined && te) {
        te.textContent = formatSeconds(currentSec, true);
      }
      if (durationSec !== undefined && de) {
        de.textContent = formatSeconds(durationSec, true);
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
        setVisible('player-controller', false);
        setVisible('loading-bar', false);
        this.hideAspectPad();
      } else {
        setVisible('playing-error-bar', false);
      }
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
      state.actionSelected = 'watch';
      state.isLiveTv = true;
      state.showLiveBtn = false;
      this.buildActions();
      this.setChannel({
        name: 'NTV',
        icon: PlayerUI.DEMO_CHANNEL_ICON,
        program_name: 'Сёстры, 1-2 серия'
      });
      this.setLiveTv(true);
      this.setProgress(0.07, 1, 1500);
      this.showAspectPad(MODE_LABELS.live);
      this.showError(null);
      this.setVodMode(false);
      this.showInfobar(true);
      this.showLoading(true);
      startClock();
    },

    applyPausedDemo: function () {
      this.applyLiveDemo();
      this.showLoading(false);
    },

    applyPlayingDemo: function () {
      this.applyLiveDemo();
      this.showLoading(false);
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

  PlayerUI.DEMO_CHANNEL_ICON = '../../mocks/channel-poster-ntv.png';
  PlayerUI.DEMO_COMPANY_LOGO = '../../assets/v4/img_logo_player.png';
  PlayerUI.MODE_LABELS = MODE_LABELS;

  global.PlayerUI = PlayerUI;
})(typeof window !== 'undefined' ? window : this);
