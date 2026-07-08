(function (global) {
  'use strict';

  var currentScreen = 'player';
  var currentPlayerState = 'playing';
  var mockData = null;
  var layerTimers = {};

  function byId(id) { return document.getElementById(id); }

  function isAnimated() {
    return document.documentElement.classList.contains('preview-animated') &&
      !document.documentElement.classList.contains('audit-mode');
  }

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
    if (!isAnimated()) {
      PlayerUI.showInfobar(visible);
      return;
    }
    var ib = byId('player-controller');
    if (!ib) return;
    ib.style.display = 'block';
    ib.classList.toggle('preview-hidden', !visible);
  }

  function setDimOverlay(screenName) {
    var dim = byId('preview-dim-overlay');
    if (!dim) return;
    dim.classList.remove('preview-active', 'dim-sepg', 'dim-epg');
    if (screenName === 'sepg') {
      dim.classList.add('preview-active', 'dim-sepg');
    } else if (screenName === 'epg') {
      dim.classList.add('preview-active', 'dim-epg');
    }
  }

  function pulseContentShift(listId) {
    if (!isAnimated()) return;
    var ul = byId(listId);
    if (!ul) return;
    ul.classList.remove('preview-content-shift');
    void ul.offsetWidth;
    ul.classList.add('preview-content-shift');
  }

  function setPanelSection(name) {
    document.querySelectorAll('[data-panel]').forEach(function (el) {
      el.classList.toggle('preview-hidden', el.getAttribute('data-panel') !== name);
    });
    document.querySelectorAll('[data-screen-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-screen-tab') === name);
    });
  }

  var PLAYER_STATES = {
    live: function () { PlayerUI.applyBufferingDemo(); },
    playing: function () { PlayerUI.applyPlayingDemo(); },
    paused: function () { PlayerUI.applyPausedDemo(); },
    loading: function () { PlayerUI.applyRebufferDemo(); },
    error: function () {
      PlayerUI.showError('Нет каналов в тарифе');
    },
    vod: function () {
      PlayerUI.applyPlayingDemo();
      PlayerUI.setVodMode(true);
      PlayerUI.showAspectPad(PlayerUI.MODE_LABELS.video);
    },
    fwd: function () {
      PlayerUI.applyPlayingDemo();
      PlayerUI.setProgress(50, 750, 1500);
    },
    fav: function () {
      PlayerUI.applyPlayingDemo();
      PlayerUI.setFavoritesMarked(true);
    },
    archive: function () {
      PlayerUI.applyPlayingDemo();
      PlayerUI.setArchiveControls();
      PlayerUI.setChannel({
        number: '013', name: 'NTV', icon: PlayerUI.DEMO_CHANNEL_ICON,
        program_name: 'Сёстры, 1-2 серия', has_record: true
      });
      PlayerUI.showAspectPad(PlayerUI.MODE_LABELS.archive);
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
    },
  };

  var EPG_STATES = {
    demo: function () { EpgUI.applyDemo(); },
    loading: function () { EpgUI.applyLoadingDemo(); },
    'channel-loading': function () { EpgUI.applyChannelLoadingDemo(); },
    empty: function () { EpgUI.applyEmptyDemo(); }
  };

  var AppPreview = {
    currentScreen: function () { return currentScreen; },

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
        setInfobarVisible(true);
      } else if (name === 'sepg') {
        EpgUI.hide();
        PlayerUI.applyPlayingDemo();
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
    },

    applyPlayerState: function (stateName) {
      if (!PLAYER_STATES[stateName]) return;
      currentPlayerState = stateName;
      PLAYER_STATES[stateName]();
    },

    applySepgState: function (stateName) {
      if (SEPG_STATES[stateName]) SEPG_STATES[stateName]();
    },

    applyEpgState: function (stateName) {
      if (EPG_STATES[stateName]) EPG_STATES[stateName]();
    },

    setPlayerNav: function (index) {
      PlayerUI.setNavSelected(index);
    },

    setActionFocus: function (actionId) {
      PlayerUI.setActionFocus(actionId);
    },

    setEpgFocus: function (column) {
      EpgUI.setFocusedColumn(column);
    },

    epgShift: function (delta) {
      EpgUI.shiftSelection(delta);
    },

    sepgShift: function (dir) {
      if (dir < 0) SepgUI.shiftLeft();
      else SepgUI.shiftRight();
    },

    setProgress: function (percent) {
      var dur = 1500;
      PlayerUI.setProgress(percent, Math.floor(dur * percent / 100), dur);
    },

    fitPreviewScale: function () {
      var devH = document.documentElement.classList.contains('audit-mode') ? 0 : 96;
      var scale = Math.min(window.innerWidth / 1920, (window.innerHeight - devH) / 1080);
      document.documentElement.style.setProperty('--preview-scale', String(scale));
    },

    initDevPanel: function () {
      var panel = byId('dev-panel');
      if (!panel) return;

      panel.addEventListener('click', function (e) {
        var tab = e.target.closest('[data-screen-tab]');
        if (tab) {
          AppPreview.showScreen(tab.getAttribute('data-screen-tab'));
          return;
        }

        var playerState = e.target.closest('[data-player-state]');
        if (playerState) {
          AppPreview.applyPlayerState(playerState.getAttribute('data-player-state'));
          panel.querySelectorAll('[data-player-state]').forEach(function (b) {
            b.classList.toggle('active', b === playerState);
          });
          return;
        }

        var sepgState = e.target.closest('[data-sepg-state]');
        if (sepgState) {
          AppPreview.applySepgState(sepgState.getAttribute('data-sepg-state'));
          panel.querySelectorAll('[data-sepg-state]').forEach(function (b) {
            b.classList.toggle('active', b === sepgState);
          });
          return;
        }

        var epgState = e.target.closest('[data-epg-state]');
        if (epgState) {
          AppPreview.applyEpgState(epgState.getAttribute('data-epg-state'));
          panel.querySelectorAll('[data-epg-state]').forEach(function (b) {
            b.classList.toggle('active', b === epgState);
          });
          return;
        }

        var actionFocus = e.target.closest('[data-action-focus]');
        if (actionFocus) {
          var actionId = actionFocus.getAttribute('data-action-focus');
          AppPreview.setActionFocus(actionId);
          if (actionId === 'program') AppPreview.showScreen('sepg');
          panel.querySelectorAll('[data-action-focus]').forEach(function (b) {
            b.classList.toggle('active', b === actionFocus);
          });
          return;
        }

        var navBtn = e.target.closest('[data-nav-index]');
        if (navBtn) {
          AppPreview.setPlayerNav(parseInt(navBtn.getAttribute('data-nav-index'), 10));
          return;
        }

        var epgFocus = e.target.closest('[data-epg-focus]');
        if (epgFocus) {
          AppPreview.setEpgFocus(epgFocus.getAttribute('data-epg-focus'));
          panel.querySelectorAll('[data-epg-focus]').forEach(function (b) {
            b.classList.toggle('active', b === epgFocus);
          });
          return;
        }

        if (e.target.closest('[data-action="epg-up"]')) AppPreview.epgShift(-1);
        if (e.target.closest('[data-action="epg-down"]')) AppPreview.epgShift(1);
        if (e.target.closest('[data-action="epg-left"]')) EpgUI.showDateScreen();
        if (e.target.closest('[data-action="epg-right"]')) EpgUI.hideDateScreen();
        if (e.target.closest('[data-action="sepg-left"]')) AppPreview.sepgShift(-1);
        if (e.target.closest('[data-action="sepg-right"]')) AppPreview.sepgShift(1);
        if (e.target.id === 'iptv-date-back') EpgUI.hideDateScreen();
      });

      var slider = byId('progress-slider');
      if (slider) {
        slider.addEventListener('input', function (ev) {
          AppPreview.setProgress(parseInt(ev.target.value, 10));
        });
      }
    },

    init: function () {
      AppPreview.fitPreviewScale();
      window.addEventListener('resize', AppPreview.fitPreviewScale);
      AppPreview.initDevPanel();
      return AppPreview.loadMocks().then(function () {
        var params = new URLSearchParams(location.search);
        var screen = params.get('screen') || 'player';
        AppPreview.showScreen(screen);
        var slider = byId('progress-slider');
        if (slider) slider.value = 0;
      });
    }
  };

  global.AppPreview = AppPreview;
})(typeof window !== 'undefined' ? window : this);
