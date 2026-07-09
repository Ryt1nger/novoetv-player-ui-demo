/**
 * AppPreview — оркестратор демо: remote-пульт, debug, моки, audit presets.
 */
(function (global) {
  'use strict';

  var dom = global.DomUtils;
  var byId = dom.byId;
  var setVisible = dom.setVisible;

  var currentScreen = 'player';
  var currentPlayerState = 'live';
  var guideOverlay = false;
  var playerStateBeforeOverlay = 'live';
  var mockData = null;
  var layerTimers = {};
  var infobarVisible = true;
  var programInfoOpen = false;

  var STATE_ALIASES = {
    'channel-epg': 'channel-guide',
    'iptv-guide': 'epg',
    'iptv-dates': 'iptv-dates'
  };

  function isAnimated() {
    return document.documentElement.classList.contains('preview-animated') &&
      !document.documentElement.classList.contains('audit-mode');
  }

  function setLayerActive(id, active) {
    var el = byId(id);
    if (!el) return;

    if (layerTimers[id]) {
      clearTimeout(layerTimers[id]);
      layerTimers[id] = null;
    }

    if (!isAnimated()) {
      setVisible(id, active);
      el.classList.toggle('preview-active', active);
      return;
    }

    el.style.display = 'block';
    el.classList.remove('preview-hidden');
    el.classList.toggle('preview-active', active);

    if (!active) {
      layerTimers[id] = window.setTimeout(function () {
        layerTimers[id] = null;
        if (!el.classList.contains('preview-active')) {
          el.style.display = 'none';
        }
      }, 280);
    }
  }

  function setInfobarVisible(visible) {
    infobarVisible = visible !== false;
    if (!isAnimated()) {
      PlayerUI.showInfobar(infobarVisible);
      return;
    }
    var ib = byId('player-controller');
    if (!ib) return;
    ib.style.display = 'block';
    ib.classList.toggle('preview-hidden', !infobarVisible);
  }

  function setDimOverlay(screenName) {
    var dim = byId('preview-dim-overlay');
    if (!dim) return;
    dim.classList.remove('preview-active', 'dim-sepg', 'dim-epg');
    if (screenName === 'sepg') dim.classList.add('preview-active', 'dim-sepg');
    else if (screenName === 'epg') dim.classList.add('preview-active', 'dim-epg');
  }

  function setPanelSection(name) {
    document.querySelectorAll('[data-panel]').forEach(function (el) {
      el.classList.toggle('preview-hidden', el.getAttribute('data-panel') !== name);
    });
    document.querySelectorAll('[data-screen-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-screen-tab') === name);
    });
  }

  function setActiveButton(selector, activeBtn) {
    document.querySelectorAll(selector).forEach(function (btn) {
      btn.classList.toggle('active', btn === activeBtn);
    });
  }

  function resetVideoBg() {
    var stage = byId('tv-stage');
    if (stage) stage.classList.remove('player-error-bg', 'player-loading-bg');
  }

  function updateRemoteStatus() {
    var el = byId('remote-status');
    if (!el) return;
    var parts = [currentPlayerState];
    if (guideOverlay) parts.push('EPG');
    if (programInfoOpen) parts.push('Info');
    if (currentScreen === 'sepg' || currentPlayerState === 'mini-list') parts.push('Mini list');
    var ch = PlayerUI.DEMO_CHANNEL && PlayerUI.DEMO_CHANNEL.name;
    if (ch) parts.push(ch);
    el.textContent = parts.join(' · ');
  }

  function syncScenarioSelect() {
    var sel = byId('scenario-select');
    if (!sel) return;
    var map = { live: 'live', playing: 'live', archive: 'archive', future: 'future', error: 'error', loading: 'loading' };
    var val = map[currentPlayerState];
    if (val) sel.value = val;
  }

  function normalizeState(name) {
    return STATE_ALIASES[name] || name;
  }

  var PLAYER_STATES = {
    clean: function () {
      resetVideoBg();
      programInfoOpen = false;
      PlayerUI.applyCleanDemo();
      updateRemoteStatus();
    },
    live: function () {
      resetVideoBg();
      programInfoOpen = false;
      PlayerUI.applyLiveDemo();
      var ids = PlayerUI.getFocusableActions();
      if (ids.length) PlayerUI.setActionFocus(ids[0]);
      updateRemoteStatus();
    },
    playing: function () { PLAYER_STATES.live(); },
    future: function () {
      resetVideoBg();
      programInfoOpen = false;
      PlayerUI.applyFutureDemo();
      PlayerUI.setActionFocus('watch');
      updateRemoteStatus();
    },
    archive: function () {
      resetVideoBg();
      programInfoOpen = false;
      PlayerUI.applyArchiveDemo();
      updateRemoteStatus();
    },
    paused: function () {
      resetVideoBg();
      programInfoOpen = false;
      PlayerUI.applyPausedDemo();
      updateRemoteStatus();
    },
    loading: function () {
      programInfoOpen = false;
      PlayerUI.applyLoadingDemo();
      updateRemoteStatus();
    },
    error: function () {
      programInfoOpen = false;
      PlayerUI.showError(PlayerUI.ERROR_MSG_DEFAULT);
      updateRemoteStatus();
    },
    fav: function () {
      resetVideoBg();
      PlayerUI.applyLiveDemo();
      PlayerUI.setActionFocus('favorite');
      PlayerUI.setFavoritesMarked(true, true);
      updateRemoteStatus();
    },
    'program-info': function () {
      resetVideoBg();
      PlayerUI.applyProgramInfoDemo();
      programInfoOpen = true;
      updateRemoteStatus();
    },
    'mini-list': function () {
      guideOverlay = false;
      EpgUI.hide();
      resetVideoBg();
      programInfoOpen = false;
      PlayerUI.applyLiveDemo();
      PlayerUI.hideProgramInfo();
      SepgUI.applyDemo();
      setDimOverlay('sepg');
      updateRemoteStatus();
    },
    'channel-guide': function () {
      AppPreview.showGuideOverlay('channel-guide');
    },
    'channel-epg': function () {
      AppPreview.showGuideOverlay('channel-guide');
    },
    vod: function () {
      resetVideoBg();
      PlayerUI.applyLiveDemo();
      PlayerUI.setVodMode(true);
      PlayerUI.showAspectPad(PlayerUI.MODE_LABELS.video);
      updateRemoteStatus();
    },
    rebuffer: function () {
      resetVideoBg();
      PlayerUI.applyRebufferDemo();
      updateRemoteStatus();
    }
  };

  var SEPG_STATES = {
    demo: function () { SepgUI.applyDemo(); },
    loading: function () { SepgUI.applyLoadingDemo(); },
    empty: function () { SepgUI.applyEmptyDemo(); },
    error: function () {
      var msg = (mockData && mockData.sepg && mockData.sepg.streamError) ||
        'Ошибка открытия архива. Повторный запрос...';
      SepgUI.applyStreamErrorDemo(msg);
    }
  };

  var EPG_STATES = {
    demo: function () { EpgUI.applyDemo(); },
    'channel-guide': function () { EpgUI.applyChannelGuideDemo(); },
    loading: function () { EpgUI.applyLoadingDemo(); },
    'channel-loading': function () { EpgUI.applyChannelLoadingDemo(); },
    empty: function () { EpgUI.applyEmptyDemo(); }
  };

  var AppPreview = {
    currentScreen: function () { return currentScreen; },
    currentPlayerState: function () { return currentPlayerState; },

    loadMocks: function () {
      return fetch('../../mocks/player-mock.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          mockData = data;
          global.mockData = data;
          global.__EPG_MOCK__ = data.epg;
          global.__PLAYER_MOCK_SEPG__ = data.sepg;
          return data;
        })
        .catch(function () {
          global.__EPG_MOCK__ = null;
          return null;
        });
    },

    showScreen: function (name) {
      guideOverlay = false;
      currentScreen = name;

      var showVideo = name === 'player' || name === 'sepg' || name === 'epg';
      var showPlayerLayer = name === 'player' || name === 'sepg';
      var showGuide = name === 'epg';

      setLayerActive('mock-video-bg', showVideo);
      setDimOverlay(name === 'sepg' ? 'sepg' : (name === 'epg' ? 'epg' : null));
      setLayerActive('player-screen', showPlayerLayer);
      setVisible('iptv-guide', showGuide);
      setVisible('iptv-date-screen', false);
      setPanelSection(name);

      if (name !== 'player' && name !== 'sepg') {
        PlayerUI.hideAspectPad();
        PlayerUI.showLoading(false);
      }

      if (name === 'player') {
        SepgUI.hide();
        EpgUI.hide();
        AppPreview.applyPlayerState(currentPlayerState);
        if (currentPlayerState !== 'mini-list') setDimOverlay(null);
        if (currentPlayerState !== 'clean') setInfobarVisible(infobarVisible);
      } else if (name === 'sepg') {
        EpgUI.hide();
        PlayerUI.hideProgramInfo();
        resetVideoBg();
        PlayerUI.applyLiveDemo();
        PlayerUI.hideAspectPad();
        setInfobarVisible(true);
        PlayerUI.showError(null);
        SepgUI.applyDemo();
      } else if (name === 'epg') {
        SepgUI.hide();
        PlayerUI.showInfobar(false);
        PlayerUI.showLoading(false);
        PlayerUI.hideAspectPad();
        EpgUI.applyDemo();
      }
      updateRemoteStatus();
    },

    showGuideOverlay: function (epgState) {
      if (!guideOverlay) {
        playerStateBeforeOverlay = currentPlayerState === 'channel-guide'
          ? 'archive'
          : currentPlayerState;
      }
      guideOverlay = true;
      currentScreen = 'player';
      programInfoOpen = false;

      setLayerActive('mock-video-bg', true);
      setLayerActive('player-screen', true);
      setDimOverlay('epg');
      SepgUI.hide();
      PlayerUI.hideProgramInfo();
      PlayerUI.hideAspectPad();
      PlayerUI.showLoading(false);
      PlayerUI.showError(null);
      PlayerUI.showInfobar(false);
      setVisible('iptv-date-screen', false);
      setVisible('iptv-guide', true);
      setPanelSection('player');

      if (epgState === 'channel-guide') EpgUI.applyChannelGuideDemo();
      else EpgUI.applyDemo();
      updateRemoteStatus();
    },

    closeGuideOverlay: function () {
      if (!guideOverlay) return;
      guideOverlay = false;
      EpgUI.hide();
      setDimOverlay(null);
      setVisible('iptv-guide', false);
      setVisible('iptv-date-screen', false);

      currentPlayerState = playerStateBeforeOverlay;
      PLAYER_STATES[playerStateBeforeOverlay]();

      if (playerStateBeforeOverlay !== 'clean' && playerStateBeforeOverlay !== 'mini-list') {
        setInfobarVisible(infobarVisible);
      }
      updateRemoteStatus();
    },

    applyPlayerState: function (stateName) {
      stateName = normalizeState(stateName);
      if (stateName === 'iptv-dates') {
        AppPreview.showScreen('epg');
        EpgUI.showDateScreen();
        return;
      }
      if (stateName === 'epg' || stateName === 'iptv-guide') {
        AppPreview.showScreen('epg');
        return;
      }
      if (!PLAYER_STATES[stateName]) return;

      if (currentPlayerState === 'mini-list' && stateName !== 'mini-list') {
        SepgUI.hide();
        if (!guideOverlay) setDimOverlay(null);
      }

      currentScreen = 'player';
      currentPlayerState = stateName;
      PLAYER_STATES[stateName]();
      syncScenarioSelect();
    },

    applySepgState: function (stateName) {
      if (SEPG_STATES[stateName]) SEPG_STATES[stateName]();
    },

    applyEpgState: function (stateName) {
      if (EPG_STATES[stateName]) EPG_STATES[stateName]();
    },

    setActionFocus: function (actionId) {
      PlayerUI.setActionFocus(actionId);
      updateRemoteStatus();
    },

    setProgress: function (percent) {
      var mock = mockData && mockData.playerLive;
      var duration = (mock && mock.duration) || '59:30';
      var durationSec = (mock && mock.durationSec) || 3570;
      var currentSec = Math.floor(durationSec * percent / 100);
      PlayerUI.setProgress(percent, formatProgressTime(currentSec), duration);
    },

    fitPreviewScale: function () {
      var scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      document.documentElement.style.setProperty('--preview-scale', String(scale));
    },

    /* --- Remote control --- */

    remoteBack: function () {
      if (guideOverlay) {
        if (EpgUI.isDateScreenOpen && EpgUI.isDateScreenOpen()) {
          EpgUI.hideDateScreen();
          updateRemoteStatus();
          return;
        }
        AppPreview.closeGuideOverlay();
        return;
      }
      if (programInfoOpen) {
        programInfoOpen = false;
        PlayerUI.hideProgramInfo();
        setPlayerModeFromState(currentPlayerState);
        updateRemoteStatus();
        return;
      }
      if (currentPlayerState === 'mini-list') {
        SepgUI.hide();
        setDimOverlay(null);
        currentPlayerState = 'live';
        PLAYER_STATES.live();
        return;
      }
      if (currentScreen !== 'player') {
        AppPreview.showScreen('player');
      }
    },

    remoteGuide: function () {
      AppPreview.showScreen('player');
      AppPreview.showGuideOverlay('channel-guide');
    },

    remoteInfo: function () {
      AppPreview.showScreen('player');
      AppPreview.applyPlayerState('program-info');
    },

    remotePlayPause: function () {
      if (guideOverlay || currentPlayerState === 'error' || currentPlayerState === 'loading') return;
      PlayerUI.togglePause();
      if (PlayerUI.isPaused()) currentPlayerState = 'paused';
      else if (currentPlayerState === 'paused') currentPlayerState = 'archive';
      updateRemoteStatus();
    },

    remoteLive: function () {
      AppPreview.applyPlayerState('live');
      setInfobarVisible(true);
    },

    remoteFav: function () {
      var btn = document.querySelector('.focus-switch[data-action="favorite"]');
      var isMarked = btn && btn.classList.contains('marked');
      PlayerUI.setFavoritesMarked(!isMarked);
      PlayerUI.setActionFocus('favorite');
      updateRemoteStatus();
    },

    remoteWatch: function () {
      var btn = document.querySelector('.focus-switch[data-action="watch"]');
      var isMarked = btn && btn.classList.contains('marked');
      PlayerUI.setWatchMarked(!isMarked);
      PlayerUI.setActionFocus('watch');
    },

    remoteToggleUi: function () {
      if (currentPlayerState === 'clean') {
        setInfobarVisible(true);
        AppPreview.applyPlayerState('live');
        return;
      }
      if (infobarVisible) {
        setInfobarVisible(false);
        var btn = byId('remote-toggle-ui') || document.querySelector('[data-remote="toggle-ui"]');
        if (btn) btn.textContent = 'Show UI';
      } else {
        setInfobarVisible(true);
        var showBtn = document.querySelector('[data-remote="toggle-ui"]');
        if (showBtn) showBtn.textContent = 'Hide UI';
      }
    },

    remoteOk: function () {
      if (guideOverlay) {
        EpgUI.activateFocused && EpgUI.activateFocused();
        return;
      }
      if (currentPlayerState === 'mini-list' || currentScreen === 'sepg') {
        return;
      }
      var action = PlayerUI.activateFocusedAction();
      if (!action) {
        var ids = PlayerUI.getFocusableActions();
        if (ids.length) {
          PlayerUI.setActionFocus(ids[0]);
          action = ids[0];
        }
      }
      if (action === 'program') AppPreview.remoteGuide();
      else if (action === 'info') AppPreview.remoteInfo();
      else if (action === 'favorite') AppPreview.remoteFav();
      else if (action === 'watch') AppPreview.remoteWatch();
      else if (action === 'live') AppPreview.remoteLive();
    },

    remoteArrow: function (dir) {
      if (guideOverlay) {
        if (dir === 'up') EpgUI.shiftSelection(-1);
        else if (dir === 'down') EpgUI.shiftSelection(1);
        else if (dir === 'left') EpgUI.showDateScreen();
        else if (dir === 'right') EpgUI.hideDateScreen();
        return;
      }
      if (currentPlayerState === 'mini-list' || currentScreen === 'sepg') {
        if (dir === 'up') SepgUI.shiftLeft();
        else if (dir === 'down') SepgUI.shiftRight();
        return;
      }
      if (dir === 'left') PlayerUI.shiftActionFocus(-1);
      else if (dir === 'right') PlayerUI.shiftActionFocus(1);
      updateRemoteStatus();
    },

    handleRemote: function (action) {
      switch (action) {
        case 'up': AppPreview.remoteArrow('up'); break;
        case 'down': AppPreview.remoteArrow('down'); break;
        case 'left': AppPreview.remoteArrow('left'); break;
        case 'right': AppPreview.remoteArrow('right'); break;
        case 'ok': AppPreview.remoteOk(); break;
        case 'back': AppPreview.remoteBack(); break;
        case 'guide': AppPreview.remoteGuide(); break;
        case 'info': AppPreview.remoteInfo(); break;
        case 'playpause': AppPreview.remotePlayPause(); break;
        case 'live': AppPreview.remoteLive(); break;
        case 'fav': AppPreview.remoteFav(); break;
        case 'watch': AppPreview.remoteWatch(); break;
        case 'toggle-ui': AppPreview.remoteToggleUi(); break;
      }
    },

    initRemotePanel: function () {
      var panel = byId('remote-panel');
      if (!panel) return;

      panel.addEventListener('click', function (e) {
        var remoteBtn = e.target.closest('[data-remote]');
        if (remoteBtn) {
          AppPreview.handleRemote(remoteBtn.getAttribute('data-remote'));
          return;
        }

        if (e.target.id === 'remote-toggle-debug') {
          var dbg = byId('debug-panel');
          if (dbg) dbg.classList.toggle('preview-hidden');
          e.target.classList.toggle('active');
          return;
        }

        if (e.target.id === 'remote-collapse') {
          panel.classList.toggle('is-collapsed');
          e.target.textContent = panel.classList.contains('is-collapsed') ? '+' : '−';
          return;
        }

        var tab = e.target.closest('[data-screen-tab]');
        if (tab) {
          AppPreview.showScreen(tab.getAttribute('data-screen-tab'));
          return;
        }

        var playerState = e.target.closest('[data-player-state]');
        if (playerState) {
          AppPreview.applyPlayerState(playerState.getAttribute('data-player-state'));
          setActiveButton('[data-player-state]', playerState);
          return;
        }

        var sepgState = e.target.closest('[data-sepg-state]');
        if (sepgState) {
          AppPreview.applySepgState(sepgState.getAttribute('data-sepg-state'));
          return;
        }

        var epgState = e.target.closest('[data-epg-state]');
        if (epgState) {
          AppPreview.applyEpgState(epgState.getAttribute('data-epg-state'));
          return;
        }

        if (e.target.closest('[data-action="iptv-dates"]')) {
          AppPreview.applyPlayerState('iptv-dates');
        }

        if (e.target.id === 'iptv-date-back') EpgUI.hideDateScreen();
        if (e.target.closest('#iptv-inline-back')) AppPreview.closeGuideOverlay();
      });

      var scenario = byId('scenario-select');
      if (scenario) {
        scenario.addEventListener('change', function () {
          AppPreview.showScreen('player');
          AppPreview.applyPlayerState(scenario.value);
        });
      }

      var slider = byId('progress-slider');
      if (slider) {
        slider.addEventListener('input', function (ev) {
          AppPreview.setProgress(parseInt(ev.target.value, 10));
        });
      }

      document.addEventListener('keydown', function (e) {
        if (document.documentElement.classList.contains('audit-mode')) return;
        var map = {
          ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
          Enter: 'ok', Escape: 'back', Backspace: 'back'
        };
        if (map[e.key]) {
          e.preventDefault();
          AppPreview.handleRemote(map[e.key]);
        }
      });
    },

    initFromQuery: function () {
      var params = new URLSearchParams(location.search);
      var screen = params.get('screen') || 'player';
      var state = params.get('state');

      if (state) {
        state = normalizeState(state);
        if (state === 'epg' || state === 'iptv-guide') {
          AppPreview.showScreen('epg');
        } else if (state === 'iptv-dates') {
          AppPreview.showScreen('epg');
          EpgUI.showDateScreen();
        } else if (state === 'mini-list') {
          AppPreview.showScreen('player');
          AppPreview.applyPlayerState('mini-list');
        } else if (state === 'channel-epg' || state === 'channel-guide') {
          AppPreview.showScreen('player');
          AppPreview.applyPlayerState('channel-guide');
        } else {
          AppPreview.showScreen(screen);
          AppPreview.applyPlayerState(state);
        }
      } else {
        AppPreview.showScreen(screen);
        if (screen === 'player') AppPreview.applyPlayerState('live');
      }
    },

    init: function () {
      AppPreview.fitPreviewScale();
      window.addEventListener('resize', AppPreview.fitPreviewScale);
      AppPreview.initRemotePanel();

      return AppPreview.loadMocks().then(function () {
        AppPreview.initFromQuery();
        var slider = byId('progress-slider');
        if (slider) slider.value = 31;
      });
    }
  };

  function setPlayerModeFromState(state) {
    if (state === 'archive') PlayerUI.applyArchiveDemo();
    else if (state === 'future') PlayerUI.applyFutureDemo();
    else PlayerUI.applyLiveDemo();
  }

  function formatProgressTime(seconds) {
    seconds = parseInt(seconds, 10) || 0;
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  global.AppPreview = AppPreview;
})(typeof window !== 'undefined' ? window : this);
