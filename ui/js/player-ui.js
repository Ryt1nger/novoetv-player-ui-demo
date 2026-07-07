(function (global) {
  'use strict';

  var NAV_ACTIONS = [
    'favorites', 'mycontent', 'stop', 'multiaudio', 'pause',
    'tvchannels', 'epg', 'mainmenu', 'info'
  ];

  var state = {
    disabledIcons: {
      multiaudio: true,
      rew: true,
      pause: false,
      play: false,
      fwd: true,
      stop: false
    },
    isPlaying: true,
    isLiveTv: true,
    favoritesMarked: false,
    navSelected: 4,
    vodMode: false
  };

  function byId(id) { return document.getElementById(id); }

  function setVisible(id, visible) {
    var el = byId(id);
    if (!el) return;
    if (visible) {
      el.style.display = 'block';
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

  function padChannelNumber(num) {
    if (num === '' || num === undefined || num === null) return '';
    return ('00' + num).slice(-3);
  }

  function applyProgress(isFwd, percent) {
    percent = Math.max(0, Math.min(100, percent));
    var pin = byId(isFwd ? 'infobar-program-pin-fwd' : 'infobar-program-pin');
    var progress = byId(isFwd ? 'infobar-program-progress-fwd' : 'infobar-program-progress');
    var container = byId(isFwd ? 'infobar-progress-fwd' : 'infobar-progress-info');
    if (!pin || !progress || !container) return;
    var pinWidth = pin.offsetWidth || 50;
    var totalWidth = Math.max(0, container.offsetWidth - pinWidth);
    var left = Math.floor(totalWidth * percent / 100);
    progress.style.width = (left + Math.floor(pinWidth / 2)) + 'px';
    pin.style.left = left + 'px';
  }

  function getNavButtonClass(action) {
    var item = action;
    if (action === 'pause' && !state.isPlaying) item = 'play';
    var disabled = state.disabledIcons[item] || state.disabledIcons[action];
    if (action === 'multiaudio' && state.disabledIcons.multiaudio) {
      return 'multiaudio multiaudio_disabled';
    }
    return item + (disabled ? '_disabled' : '');
  }

  var PlayerUI = {
    NAV_ACTIONS: NAV_ACTIONS,

    buildNavigation: function () {
      var ul = byId('navigation-list');
      if (!ul) return;
      ul.innerHTML = '';
      ul.className = 'selected';
      for (var i = 0; i < NAV_ACTIONS.length; i++) {
        var action = NAV_ACTIONS[i];
        var li = document.createElement('li');
        li.id = 'nav' + i;
        if (i === state.navSelected) li.className = 'selected';
        var div = document.createElement('div');
        div.id = 'btn-' + action + '-div';
        div.className = getNavButtonClass(action);
        if (action === 'favorites' && state.favoritesMarked) div.classList.add('marked');
        li.appendChild(div);
        ul.appendChild(li);
      }
    },

    syncNavIcons: function () {
      if (state.isLiveTv) state.disabledIcons.stop = true;
      for (var i = 0; i < NAV_ACTIONS.length; i++) {
        var action = NAV_ACTIONS[i];
        var div = byId('btn-' + action + '-div');
        if (!div) continue;
        div.className = getNavButtonClass(action);
        if (action === 'favorites' && state.favoritesMarked) div.classList.add('marked');
      }
    },

    setNavSelected: function (index) {
      state.navSelected = index;
      var ul = byId('navigation-list');
      if (!ul) return;
      var items = ul.querySelectorAll('li');
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('selected', i === index);
      }
    },

    setDisabledIcons: function (map) {
      for (var k in map) state.disabledIcons[k] = map[k];
      this.syncNavIcons();
    },

    setPlaying: function (isPlaying) {
      state.isPlaying = !!isPlaying;
      this.syncNavIcons();
    },

    setLiveTv: function (isLive) {
      state.isLiveTv = !!isLive;
      state.disabledIcons.stop = state.isLiveTv;
      this.syncNavIcons();
    },

    setArchiveControls: function () {
      state.isLiveTv = false;
      state.disabledIcons = {
        multiaudio: true,
        rew: false,
        pause: false,
        play: false,
        fwd: false,
        stop: false
      };
      this.syncNavIcons();
    },

    setFavoritesMarked: function (marked) {
      state.favoritesMarked = !!marked;
      var el = byId('btn-favorites-div');
      if (el) {
        el.classList.toggle('marked', state.favoritesMarked);
        if (state.favoritesMarked) {
          el.className = getNavButtonClass('favorites') + ' marked';
        }
      }
    },

    setChannel: function (channel) {
      channel = channel || {};
      var icon = byId('player-channel-icon');
      if (icon) icon.src = channel.icon || 'no_logo.gif';

      var numEl = byId('infobar-channel-number');
      var nameEl = byId('infobar-channel-name');
      if (numEl) numEl.textContent = padChannelNumber(channel.number);
      if (nameEl) nameEl.textContent = channel.name || '';

      var programName = channel.program_name || '';
      var programEl = byId('infobar-program-name');
      var programFwd = byId('infobar-program-name-fwd');
      if (programEl) programEl.textContent = programName;
      if (programFwd) programFwd.textContent = programName;

      if (channel.has_record && !channel.locked) {
        state.disabledIcons.rew = false;
        state.disabledIcons.pause = false;
        state.disabledIcons.fwd = true;
        state.disabledIcons.stop = false;
      } else {
        state.disabledIcons.rew = true;
        state.disabledIcons.pause = true;
        state.disabledIcons.fwd = true;
        state.disabledIcons.stop = true;
      }
      this.syncNavIcons();
    },

    setProgress: function (percent, currentSec, durationSec) {
      applyProgress(false, percent);
      applyProgress(true, percent);
      if (currentSec !== undefined) {
        var t = formatSeconds(currentSec, true);
        var te = byId('infobar-program-time');
        var tef = byId('infobar-program-time-fwd');
        if (te) te.textContent = t;
        if (tef) tef.textContent = t;
      }
      if (durationSec !== undefined) {
        var d = formatSeconds(durationSec, true);
        var de = byId('infobar-program-duration');
        var def = byId('infobar-program-duration-fwd');
        if (de) de.textContent = d;
        if (def) def.textContent = d;
      }
    },

    setVodMode: function (vod) {
      state.vodMode = !!vod;
      var screen = byId('player-screen');
      if (screen) screen.classList.toggle('vod', state.vodMode);
    },

    showInfobar: function (show) {
      setVisible('tv-infobar', show !== false);
    },

    showFwdBar: function (show) {
      var screen = byId('player-screen');
      if (screen) screen.classList.toggle('show-fwd', !!show);
      if (show) {
        setVisible('tv-infobar', false);
      } else {
        this.showInfobar(true);
      }
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
        setVisible('tv-infobar', false);
        setVisible('loading-bar', false);
        setVisible('aspect-bar', false);
      } else {
        setVisible('playing-error-bar', false);
      }
    },

    setAspectLabel: function (text) {
      var el = byId('aspect-bar');
      if (el) el.textContent = text || '';
      setVisible('aspect-bar', !!text);
    },

    applyLiveDemo: function () {
      state.isPlaying = false;
      state.isLiveTv = true;
      state.favoritesMarked = false;
      state.navSelected = 4;
      state.disabledIcons = {
        multiaudio: true, rew: false, pause: false, play: false, fwd: true, stop: false
      };
      this.buildNavigation();
      this.setChannel({
        number: '',
        name: 'NTV',
        icon: PlayerUI.DEMO_CHANNEL_ICON,
        program_name: 'Сёстры, 1-2 серия',
        has_record: true
      });
      this.setProgress(0.07, 1, 1500);
      this.setAspectLabel('Видео');
      this.showError(null);
      this.showFwdBar(false);
      this.setVodMode(false);
      this.showInfobar(true);
      this.showLoading(true);
    },

    applyPausedDemo: function () {
      this.applyLiveDemo();
      this.showLoading(false);
      this.setPlaying(false);
    },

    applyPlayingDemo: function () {
      this.applyLiveDemo();
      this.showLoading(false);
      this.setPlaying(true);
    }
  };

  /** Ассеты превью (в проде — с сервера / custom_css) */
  PlayerUI.DEMO_CHANNEL_ICON = '../../mocks/channel-poster-ntv.png';
  PlayerUI.DEMO_COMPANY_LOGO = '../../mocks/company-logo-novoetv.png';

  global.PlayerUI = PlayerUI;
})(typeof window !== 'undefined' ? window : this);
