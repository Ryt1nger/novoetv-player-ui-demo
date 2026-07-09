/**
 * PlayerUI — визуальный слой контроллера плеера NovoeTV 4.000.
 * DOM-контракт совместим с Samsung widget player.screen.js.
 */
(function (global) {
  'use strict';

  var dom = global.DomUtils;
  var byId = dom.byId;
  var setVisible = dom.setVisible;

  var ICON_BASE = '../../assets/v4/icons/';

  var ACTION_REGISTRY = {
    program: { id: 'program', label: 'Программа', icon: 'program' },
    info: { id: 'info', label: 'Инфо', icon: 'info' },
    watch: { id: 'watch', label: 'Буду смотреть', icon: 'watch' },
    favorite: { id: 'favorite', label: 'Добавить в Избранное', icon: 'favorite' }
  };

  var ACTION_PROFILES = {
    live: ['program', 'info', 'favorite'],
    future: ['program', 'watch', 'favorite'],
    archive: ['program', 'info', 'favorite'],
    paused: ['program', 'info', 'favorite'],
    error: ['program', 'info', 'favorite'],
    loading: ['program', 'info', 'favorite'],
    'program-info': []
  };

  var PROGRAM_INFO_ACTIONS = ['program', 'info', 'favorite'];

  var ERROR_MSG_DEFAULT = 'Не удалось загрузить трансляцию. Попробуйте позже';

  var MODE_LABELS = {
    live: 'Прямой эфир',
    archive: 'Архив',
    video: 'Видео',
    onAir: 'Эфир'
  };

  var FOOTER_CHANNEL_LIST = 'Список каналов';
  var FOOTER_WATCH = 'Просмотр';

  var PLAYER_MODES = [
    'live', 'archive', 'future', 'paused', 'error',
    'program-info', 'loading', 'clean', 'vod'
  ];

  var state = {
    actionSelected: '',
    actionProfile: 'live',
    favoritesMarked: false,
    watchMarked: false,
    isLiveTv: true,
    showLiveBtn: false,
    isPaused: false,
    seekThumbPlay: false,
    playerMode: 'live',
    footerHint: FOOTER_CHANNEL_LIST
  };

  var aspectPadTimer = null;
  var clockTimer = null;
  var toastTimer = null;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function getMockData() {
    return global.mockData || null;
  }

  function resolveChannel(ref) {
    var data = getMockData();
    if (!ref) return null;
    if (typeof ref === 'object') return ref;
    if (data && data.channels && data.channels[ref]) return data.channels[ref];
    return null;
  }

  function resolvePlayerMock(key) {
    var data = getMockData();
    var mock = data && data[key];
    if (!mock) return null;

    var channel = resolveChannel(mock.channel);
    return {
      channel: channel,
      tag: mock.tag,
      progress: mock.progress,
      current: mock.current,
      currentSec: mock.currentSec,
      duration: mock.duration,
      durationSec: mock.durationSec,
      footerHint: mock.footerHint,
      actionFocus: mock.actionFocus,
      description: mock.description,
      message: mock.message
    };
  }

  function actionIconName(actionId, marked) {
    if (actionId === 'favorite' && marked) return 'favorite_filled';
    if (actionId === 'watch' && marked) return 'watch_filled';
    if (actionId === 'info') return 'watch';
    return actionId;
  }

  function actionIcon(actionId, marked) {
    var file = 'ic_' + actionIconName(actionId, marked);
    return '<img class="action-icon" src="' + ICON_BASE + file + '.svg" alt="">';
  }

  function formatPlayerTime(seconds) {
    seconds = parseInt(seconds, 10);
    if (isNaN(seconds) || seconds < 0) seconds = 0;

    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);

    if (h > 0) return h + ':' + pad2(m) + ':' + pad2(s);
    return pad2(m) + ':' + pad2(s);
  }

  function formatSeconds(seconds, longFormat, compactHour) {
    if (typeof seconds === 'string' && /^\d{1,2}:\d{2}/.test(seconds)) {
      return seconds;
    }
    return formatPlayerTime(seconds);
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

    tagEl.textContent = MODE_LABELS[kind] || kind;
    tagEl.classList.add('tag-' + kind);
    setVisible('program-tag', true);
  }

  function setSeekThumbPlay(playIcon) {
    state.seekThumbPlay = !!playIcon;
    var pin = byId('infobar-program-pin');
    var img = pin && pin.querySelector('img');
    if (!img) return;

    img.src = playIcon
      ? ICON_BASE + 'ic_seekbar_thumb_play.svg'
      : ICON_BASE + 'ic_seekbar_thumb.svg';
  }

  function formatClock(d) {
    d = d || new Date();
    var months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' ' +
      pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function setPlayerMode(mode) {
    state.playerMode = mode || 'live';
    var screen = byId('player-screen');
    var stage = byId('tv-stage');

    if (screen) {
      PLAYER_MODES.forEach(function (cls) {
        screen.classList.remove('is-' + cls);
      });
      if (mode) screen.classList.add('is-' + mode);
    }

    if (stage) {
      stage.classList.toggle('player-error-bg', mode === 'error');
      stage.classList.toggle('player-loading-bg', mode === 'loading');
    }

    PlayerUI.setVideoBackground(mode);
  }

  function resolveBackground(mode) {
    var data = getMockData();
    var backgrounds = data && data.backgrounds;
    if (!backgrounds) return '../../assets/img/back.jpg';
    if (mode === 'error' || mode === 'loading') return null;
    return backgrounds[mode] || backgrounds.default || '../../assets/img/back.jpg';
  }

  function applyVideoBackground(url) {
    var bg = byId('mock-video-bg');
    if (!bg) return;

    bg.classList.remove('video-hidden');

    if (!url) {
      bg.style.backgroundImage = 'none';
      bg.style.backgroundColor = '#000';
      return;
    }

    bg.style.backgroundColor = '#000';
    bg.style.backgroundImage = 'url("' + url + '")';
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';
  }

  function setFooterHint(text) {
    state.footerHint = text || FOOTER_CHANNEL_LIST;
    var el = byId('footer-hint-text');
    if (el) el.textContent = state.footerHint;
  }

  function applyProgress(percent) {
    percent = Math.max(0, Math.min(100, percent));

    var pin = byId('infobar-program-pin');
    var progress = byId('infobar-program-progress');
    var container = byId('infobar-progress-info');
    if (!pin || !progress || !container) return;

    var totalWidth = Math.max(0, container.offsetWidth);
    var left = Math.floor(totalWidth * percent / 100);

    progress.style.width = left + 'px';
    pin.style.left = left + 'px';
  }

  function getActiveActionIds() {
    if (state.playerMode === 'program-info') return [];
    return ACTION_PROFILES[state.actionProfile] || ACTION_PROFILES.live;
  }

  function buildActionButton(cfg, marked) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'focus-switch';
    btn.setAttribute('data-action', cfg.id);
    btn.innerHTML =
      '<span class="focus-switch-icon">' + actionIcon(cfg.id, marked) + '</span>' +
      '<span class="focus-switch-label">' + cfg.label + '</span>';

    if (cfg.id === state.actionSelected) btn.classList.add('selected');
    if (marked) btn.classList.add('marked');
    return btn;
  }

  function buildActions() {
    var wrap = byId('controller-actions');
    if (!wrap) return;

    wrap.innerHTML = '';
    wrap.classList.toggle('preview-hidden', state.playerMode === 'program-info');

    var liveBtn = document.createElement('button');
    liveBtn.id = 'btn-live';
    liveBtn.className = 'btn-live';
    liveBtn.type = 'button';
    liveBtn.textContent = MODE_LABELS.onAir;
    if (!state.showLiveBtn) liveBtn.classList.add('preview-hidden');
    wrap.appendChild(liveBtn);

    getActiveActionIds().forEach(function (actionId) {
      var cfg = ACTION_REGISTRY[actionId];
      if (!cfg) return;
      var marked = (actionId === 'favorite' && state.favoritesMarked) ||
        (actionId === 'watch' && state.watchMarked);
      wrap.appendChild(buildActionButton(cfg, marked));
    });
  }

  function buildProgramInfoActions() {
    var wrap = byId('program-info-actions');
    if (!wrap) return;

    wrap.innerHTML = '';

    PROGRAM_INFO_ACTIONS.forEach(function (actionId) {
      var cfg = ACTION_REGISTRY[actionId];
      if (!cfg) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'program-info-action';
      btn.setAttribute('data-action', actionId);
      btn.innerHTML = actionIcon(actionId, false);
      wrap.appendChild(btn);
    });
  }

  function syncActionButtons() {
    var liveBtn = byId('btn-live');
    if (liveBtn) liveBtn.classList.toggle('preview-hidden', !state.showLiveBtn);

    var wrap = byId('controller-actions');
    if (!wrap) return;

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

  function setActionProfile(profile) {
    state.actionProfile = profile || 'live';
    buildActions();
    syncActionButtons();
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

  function resetDemoState() {
    state.favoritesMarked = false;
    state.watchMarked = false;
    state.actionSelected = '';
    state.isLiveTv = true;
    state.showLiveBtn = false;
    state.isPaused = false;
    state.actionProfile = 'live';
  }

  function applyMockProgress(mock) {
    if (!mock) return;
    if (mock.current !== undefined && mock.duration !== undefined) {
      PlayerUI.setProgress(mock.progress, mock.current, mock.duration);
      return;
    }
    PlayerUI.setProgress(mock.progress, mock.currentSec, mock.durationSec);
  }

  function applyCommonPlayerReset() {
    PlayerUI.hideAspectPad();
    PlayerUI.hideProgramInfo();
    PlayerUI.showToast(null);
    PlayerUI.showError(null);
    PlayerUI.setVodMode(false);
    PlayerUI.showInfobar(true);
    PlayerUI.showLoading(false);
    setVisible('player-controller', true);
    startClock();
  }

  function applyReferenceMock(key, mode, profile, options) {
    options = options || {};
    resetDemoState();

    var mock = resolvePlayerMock(key);
    if (!mock) return;

    setPlayerMode(mode);
    setActionProfile(profile || mode);
    setFooterHint(mock.footerHint || FOOTER_CHANNEL_LIST);

    if (mock.channel) PlayerUI.setChannel(mock.channel);
    if (mock.tag) setProgramTag(mock.tag);
    else if (options.clearTag) setProgramTag(null);

    applyMockProgress(mock);

    if (mock.actionFocus) {
      state.actionSelected = mock.actionFocus;
      syncActionButtons();
    }

    if (options.showLiveBtn !== undefined) {
      state.showLiveBtn = options.showLiveBtn;
      state.isLiveTv = !options.showLiveBtn;
      syncActionButtons();
    }

    if (options.seekThumbPlay !== undefined) {
      setSeekThumbPlay(options.seekThumbPlay);
    } else if (mode === 'live' || mode === 'future') {
      setSeekThumbPlay(false);
    } else if (mode === 'archive' || mode === 'paused' || mode === 'error') {
      setSeekThumbPlay(mode === 'error' || mode === 'archive');
    }

    applyCommonPlayerReset();

    if (options.loading) PlayerUI.showLoading(true);
    if (options.paused) PlayerUI.setPaused(true);
    if (options.description) PlayerUI.showProgramInfo(options.description);
  }

  var PlayerUI = {
    NAV_ACTIONS: ['program', 'info', 'watch', 'favorite'],
    ACTION_REGISTRY: ACTION_REGISTRY,
    ACTION_PROFILES: ACTION_PROFILES,

    buildNavigation: function () { buildActions(); },
    buildActions: buildActions,
    syncNavIcons: syncActionButtons,

    setNavSelected: function (index) {
      var ids = getActiveActionIds();
      if (ids[index]) this.setActionFocus(ids[index]);
    },

    setActionFocus: function (actionId) {
      state.actionSelected = actionId;
      syncActionButtons();
    },

    setActionProfile: setActionProfile,
    setPlayerMode: setPlayerMode,
    setFooterHint: setFooterHint,
    setVideoBackground: function (mode) {
      applyVideoBackground(resolveBackground(mode));
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
      setSeekThumbPlay(true);
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
      var mock = resolvePlayerMock('playerProgramInfo');
      var p = byId('program-info-text');
      if (p) p.textContent = text || (mock && mock.description) || '';
      buildProgramInfoActions();
      setVisible('program-info-overlay', true);
      var wrap = byId('controller-actions');
      if (wrap) wrap.classList.add('preview-hidden');
    },

    hideProgramInfo: function () {
      setVisible('program-info-overlay', false);
      var wrap = byId('controller-actions');
      if (wrap) wrap.classList.remove('preview-hidden');
    },

    setChannel: function (channel) {
      channel = channel || {};

      var icon = byId('player-channel-icon');
      if (icon) icon.src = channel.icon || '../../assets/v4/img_default_channel.png';

      var nameEl = byId('infobar-channel-name');
      var programEl = byId('infobar-program-name');
      if (nameEl) nameEl.textContent = channel.name || '';
      if (programEl) programEl.textContent = channel.program_name || '';

      if (channel.tag) {
        if (channel.tag === MODE_LABELS.live) setProgramTag('live');
        else if (channel.tag === MODE_LABELS.archive) setProgramTag('archive');
        else if (channel.tag === MODE_LABELS.video) setProgramTag('video');
        else {
          var tagEl = byId('program-tag');
          if (tagEl) {
            tagEl.textContent = channel.tag;
            setVisible('program-tag', true);
          }
        }
      }
    },

    setProgress: function (percent, currentVal, durationVal) {
      applyProgress(percent);

      var te = byId('infobar-program-time');
      var de = byId('infobar-program-duration');

      if (currentVal !== undefined && te) {
        te.textContent = typeof currentVal === 'string'
          ? currentVal
          : formatPlayerTime(currentVal);
      }
      if (durationVal !== undefined && de) {
        de.textContent = typeof durationVal === 'string'
          ? durationVal
          : formatPlayerTime(durationVal);
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

      if (!message) {
        setVisible('playing-error-bar', false);
        return;
      }

      resetDemoState();
      setPlayerMode('error');
      setActionProfile('error');
      setFooterHint(FOOTER_CHANNEL_LIST);

      var mock = resolvePlayerMock('playerError');
      if (mock && mock.channel) this.setChannel(mock.channel);

      bar.textContent = message;
      setVisible('playing-error-bar', true);
      setVisible('loading-bar', false);
      this.hideAspectPad();
      this.hideProgramInfo();
      this.showToast(null);
      setProgramTag(null);

      state.showLiveBtn = true;
      state.isPaused = false;
      setSeekThumbPlay(true);
      this.setProgress(0, '00:00', '00:00');

      buildActions();
      syncActionButtons();
      this.setVodMode(false);
      this.showInfobar(true);
      this.showLoading(false);
      startClock();
    },

    setPaused: function (paused) {
      state.isPaused = !!paused;
      var screen = byId('player-screen');
      if (screen) screen.classList.toggle('is-paused', state.isPaused);
      if (paused) {
        setPlayerMode('paused');
        setSeekThumbPlay(false);
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
      applyReferenceMock('playerLive', 'live', 'live');
    },

    applyPlayingDemo: function () {
      this.applyLiveDemo();
    },

    applyFutureDemo: function () {
      applyReferenceMock('playerFuture', 'future', 'future');
    },

    applyArchiveDemo: function () {
      applyReferenceMock('playerArchive', 'archive', 'archive', {
        showLiveBtn: true,
        seekThumbPlay: true
      });
      state.isLiveTv = false;
      setProgramTag('archive');
      syncActionButtons();
    },

    applyProgramInfoDemo: function () {
      var mock = resolvePlayerMock('playerProgramInfo');
      resetDemoState();
      setPlayerMode('program-info');
      setActionProfile('program-info');
      setFooterHint(FOOTER_CHANNEL_LIST);

      if (mock && mock.channel) this.setChannel(mock.channel);
      setProgramTag('live');
      applyMockProgress(mock);

      state.showLiveBtn = false;
      buildActions();

      this.hideAspectPad();
      this.showToast(null);
      this.showError(null);
      this.setVodMode(false);
      this.showInfobar(true);
      this.showLoading(false);
      setSeekThumbPlay(false);
      startClock();
      this.showProgramInfo(mock && mock.description);
    },

    applyPausedDemo: function () {
      applyReferenceMock('playerPaused', 'paused', 'paused', {
        seekThumbPlay: false,
        paused: true
      });
    },

    applyLoadingDemo: function () {
      applyReferenceMock('playerLoading', 'loading', 'loading', { loading: true });
    },

    applyRebufferDemo: function () {
      this.applyLiveDemo();
      this.setProgress(35, '09:18', '59:30');
      this.showLoading(true);
    },

    applyCleanDemo: function () {
      resetDemoState();
      setPlayerMode('clean');
      this.hideProgramInfo();
      this.hideAspectPad();
      this.showLoading(false);
      this.showError(null);
      this.showInfobar(false);
      setVisible('program-info-overlay', false);
      applyVideoBackground(resolveBackground('clean'));
      var stage = byId('tv-stage');
      if (stage) stage.classList.remove('player-error-bg', 'player-loading-bg');
    },

    togglePause: function () {
      if (state.playerMode === 'paused') {
        this.setPaused(false);
        setPlayerMode(state.isLiveTv ? 'live' : 'archive');
        setSeekThumbPlay(state.isLiveTv ? false : true);
      } else if (state.playerMode === 'live' || state.playerMode === 'archive') {
        this.setPaused(true);
      }
    },

    isPaused: function () {
      return state.isPaused;
    },

    getPlayerMode: function () {
      return state.playerMode;
    },

    getFocusedAction: function () {
      return state.actionSelected;
    },

    getFocusableActions: function () {
      var ids = getActiveActionIds().slice();
      if (state.showLiveBtn) ids.unshift('live');
      return ids;
    },

    shiftActionFocus: function (delta) {
      var ids = this.getFocusableActions();
      if (!ids.length) return '';
      var idx = ids.indexOf(state.actionSelected);
      if (idx < 0) idx = 0;
      idx = (idx + delta + ids.length) % ids.length;
      state.actionSelected = ids[idx];
      syncActionButtons();
      return state.actionSelected;
    },

    activateFocusedAction: function () {
      var action = state.actionSelected;
      if (!action && state.showLiveBtn) action = 'live';
      if (!action) {
        var ids = this.getFocusableActions();
        action = ids[0] || '';
      }
      return action;
    },

    applyBufferingDemo: function () {
      this.applyLoadingDemo();
    }
  };
  PlayerUI.DEMO_CHANNEL = resolveChannel('perviy') || {
    name: 'Первый',
    icon: '../../mocks/channel-poster-perviy.svg',
    program_name: 'Время'
  };
  PlayerUI.DEMO_CHANNEL_ICON = PlayerUI.DEMO_CHANNEL.icon;
  PlayerUI.DEMO_COMPANY_LOGO = '../../assets/v4/img_logo_player.png';
  PlayerUI.MODE_LABELS = MODE_LABELS;
  PlayerUI.FOOTER_CHANNEL_LIST = FOOTER_CHANNEL_LIST;
  PlayerUI.FOOTER_WATCH = FOOTER_WATCH;

  global.PlayerUI = PlayerUI;
})(typeof window !== 'undefined' ? window : this);
