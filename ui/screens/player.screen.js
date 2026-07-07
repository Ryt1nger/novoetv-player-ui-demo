var tvInfoBarTimeout = null;
var tvRefreshInterval = null;
function PlayerScreen()
{
	// Private:

    var tvInfoBarId = 'tv-infobar';
    var tvFwdBarId = 'tv-fwdbar';

    var audioTrack = 0;
    var playingChannel = null;
    var playingChannelId = -1;

    var startTimeForInfo = 0;
    var currentProgram = null;

    var playerToLiveTimeout = null;

    var navigationMenu = new BaseMenu({
        menuId: 'navigation-list',
        menuTag: 'ul',
        itemIdPrefix: 'nav',
        itemTag: 'li',
        useFastRefresh: true,
        hideItemIfEmptyName: true,
        getItemNameFunc: function(realItemIndex, itemIndex) {
            var item = App.playerScreen.navigationData[realItemIndex];
            var additinalClass = '';
            if (item == 'favorites' && App.data.isChannelIdInFavorites(App.player.getPlayingChannelId()))
                additinalClass = 'marked';
            return "<div id='btn-"+item+"-div' class='"+item+" "+additinalClass+"'></div>";
        },
        onMenuItemsRedraw: function() { },
        onItemClick: function(index) {
        	App.playerScreen.key_enter();
        	return true;
		},
        onItemMouseOver: function(index) {
            App.playerScreen.showTvInfoBar();
            var item = App.playerScreen.navigationData[index];
            if (!App.playerScreen.disabledIcons[item])
                navigationMenu.setSelectedItem(index, index);
        }
    });

	// Public:
    this.disablePlayIcons = false;
    this.forceTvInfoShow = true;
    this.showBarAfterBuffering = true;
    this.disabledIcons = {'multiaudio' : true, 'fwd' : true }; // setted in setChannel
    this.navigationData = [/*'settings', */'favorites', 'mycontent', 'stop', 'multiaudio', /*'rew',*/ 'pause',
						   /*'fwd',*/ 'tvchannels', 'epg', 'mainmenu', 'info'];

    this.getMenu = function() {
        return navigationMenu;
    };

    this.getNavigationIndexByAction = function (action) {
    	for (var i in this.navigationData) {
    		if (this.navigationData[i] == action)
    			return parseInt(i);
		}
    	return 0;
    };

	this.show = function()
    {
        Helper.removeClass(tvInfoBarId, 'vod');
        Helper.removeClass(tvFwdBarId, 'vod');

        var n = this.navigationData.length;
        navigationMenu.clear();
        navigationMenu.setNumberOfRows(n);
        navigationMenu.setNumberOfDisplayItems(n);
        navigationMenu.setNumberOfSourceItems(n);

        this.refreshDisplayTime();

        var showInfoBar = App.player.getPlayingChannelId() != playingChannelId;

        playingChannelId = App.player.getPlayingChannelId();
        playingChannel = App.data.getChannelById(playingChannelId);

        try {
            this.disabledIcons['multiaudio'] = true;//App.device.getAudioTracksInfo().length <= 1;
        } catch (e) {
            this.disabledIcons['multiaudio'] = true;
        }
        audioTrack = 0;
        _PlayerScreen.show();
        this.blockMouseBackButton();

        this.setNavigationFocus();
        if (showInfoBar || this.forceTvInfoShow) {
            this.forceTvInfoShow = false;
            this.showTvInfoBar();
        }

        if (App.data.getNumberOfChannels() == 0)
            this.showPlayingErrorBar(App.lang.get('no-channels-in-tariff'));
        // else
        //     this.hidePlayingErrorBar();

        if (this.bufferingInProgress)
            this.bufferingStart();

        this.hideTvFwdBar();

        // if (window.mouseEnabled)
        //     App.display.clearLastHistory(1);
    };

	this.init = function() {
        this.showTvInfoBar();

        _PlayerScreen.init();
    };

    this.hide = function()
    {
        if (tvRefreshInterval)
            window.clearInterval(tvRefreshInterval);

        if (tvInfoBarTimeout) {
            window.clearTimeout(tvInfoBarTimeout);
        }

        this.hideTvInfoBar();

        _PlayerScreen.hide();
    };

	this.setNavigationFocus = function () {
	    var selectedItem = this.navigationData[navigationMenu.getSelectedSourceItem()];
	    var newIndex = this.getNavigationIndexByAction(this.disabledIcons[selectedItem] ? 'tvchannels' : selectedItem);
	    switch (selectedItem) {
	        case 'settings':
            case 'favorites':
            case 'multiaudio':
            case 'tvchannels':
            case 'epg':
            case 'mainmenu':
                newIndex = this.getNavigationIndexByAction(this.disabledIcons['pause'] ? 'tvchannels' : 'pause');
                break;

        }
        navigationMenu.setSelectedItem(newIndex, newIndex);
    };

	this.showTvInfoBar = function(force)
	{
	    if (Helper.isVisible(tvFwdBarId))
	        return;

	    if (tvRefreshInterval)
	        window.clearInterval(tvRefreshInterval);

        if (tvInfoBarTimeout) {
            window.clearTimeout(tvInfoBarTimeout);
        }

        force = typeof force == 'undefined' ? false : force;
        if (!force) {
            tvInfoBarTimeout = window.setTimeout(function(){
                App.playerScreen.hideTvInfoBar();
            }, 5000);
        }

        try {
            Helper.showById(tvInfoBarId);

            if (App.player.getMode() == App.player.MODE_LIVETV) {
                this.setChannel(playingChannel);
                if (playingChannel != null) {
                    var currentTime = App.data.getUtcTime();
                    if (playingChannel['program_end_time'] > 0 && Helper.toInt(currentTime) > Helper.toInt(playingChannel['program_end_time'])) {
                        Logger.log('Current program is outdated. Refreshing...');
                        App.data.requestCurrentProgramList({}, function () {
                            App.playerScreen.showTvInfoBar();
                        });
                    }
                }
                tvRefreshInterval = window.setInterval(function () {
                    App.playerScreen.setChannel(playingChannel);
                }, 1000);
            } else if (App.player.getMode() == App.player.MODE_TVARCHIVE) {
                App.playerScreen.setCurrentProgram(App.player.getCurrentTime());
                tvRefreshInterval = window.setInterval(function () {
                    App.playerScreen.setCurrentProgram(App.player.getCurrentTime());
                }, 1000);
            }

            if (App.display.getCurrentScreen().isAspectPadMode())
                App.display.getCurrentScreen().showAspectPad(App.lang.get('label-archive-' + App.player.getMode()));

            this.syncState();

            this.moveFocusToEnabledItem(navigationMenu.setNextItem);
        } catch (e) {
            Logger.log("ERROR #3405");
            Logger.log(e);
        }

	};

	this.hideTvInfoBar = function()
	{
        if (tvInfoBarTimeout) {
            window.clearTimeout(tvInfoBarTimeout);
		}
        if (tvRefreshInterval)
            window.clearInterval(tvRefreshInterval);

        Helper.hideById(tvInfoBarId);
        this.hideAspectPad();
		this.setNavigationFocus();
	};

    this.showTvFwdBar = function () {
        if (Helper.isVisible(tvInfoBarId))
            this.hideTvInfoBar();

        try {
            Helper.showById(tvFwdBarId);

            if (App.player.getMode() == App.player.MODE_TVARCHIVE) {
                App.playerScreen.setCurrentProgram(App.player.getCurrentTime());
            }

            // if (App.display.getCurrentScreen().isAspectPadMode())
            //     App.display.getCurrentScreen().showAspectPad(App.lang.get('label-archive-' + App.player.getMode()));

            this.syncState();

            if (tvInfoBarTimeout) {
                window.clearTimeout(tvInfoBarTimeout);
            }
            tvInfoBarTimeout = window.setTimeout(function(){
                App.playerScreen.hideTvFwdBar();
            }, 5000);

        } catch (e) {
            Logger.log("ERROR #3500");
            Logger.log(e);
        }
    };

	this.hideTvFwdBar = function () {
        if (tvInfoBarTimeout) {
            window.clearTimeout(tvInfoBarTimeout);
        }
        this.hideAspectPad();
        Helper.hideById(tvFwdBarId);
	};

    this.setChannel = function(value)
    {
        channel = value;
        if (!channel) {
            startTimeForInfo = 0;
            channel = {'has_record' : false, 'icon': 'no_logo.gif', 'number': '',
                       'name' : '', 'id' : 0};
        }
        playingChannel = channel;

        // set button markers
        if (channel['has_record'] && !channel['locked'] && !this.disablePlayIcons)
            this.disabledIcons = {'multiaudio':this.disabledIcons['multiaudio'], 'rew':false, 'pause':false, 'fwd':true, 'stop':false};
        else
            this.disabledIcons = {'multiaudio':this.disabledIcons['multiaudio'], 'rew':true, 'pause':true, 'fwd':true, 'stop':true};

        Helper.byId('player-channel-icon').src = channel['icon'];
        Helper.setHtml('infobar-channel-number', ('00' + channel['number']).substr(-3, 3));
        Helper.setHtml('infobar-channel-name', channel['name']);

        var programName = "";
        if (channel['program_name']) {
            programName = channel['program_name'];
            if (channel['program_begin_time'])
                programName = Helper.formatTime(channel['program_begin_time']) + ' ' + programName;
        }

        if (programName.length > 90 ) {
            programName = '<span>' + programName + '</span>';
        }

        if (programName != Helper.getHtml('infobar-program-name'))
            Helper.setHtml('infobar-program-name', programName);

        if (programName != Helper.getHtml('infobar-program-name-fwd'))
            Helper.setHtml('infobar-program-name-fwd', programName);

        var timeNotAvailable = '';

        var progress = App.player.getChannelProgress(channel);
        if (Helper.isVisible(tvInfoBarId) || Helper.isVisible(tvFwdBarId)) {
            var pinWidth = parseInt(Helper.byId('infobar-program-pin').clientWidth);
            var totalWidth = parseInt(Helper.byId('infobar-progress-info').clientWidth) - pinWidth;
            Helper.byId('infobar-program-progress').style.width = Math.floor(totalWidth * progress / 100 + pinWidth / 2) + 'px';
            Helper.byId('infobar-program-pin').style.left = Math.floor(totalWidth * progress / 100) + 'px';

            var pinWidthFwd = parseInt(Helper.byId('infobar-program-pin-fwd').clientWidth);
            var totalWidthFwd = parseInt(Helper.byId('infobar-progress-fwd').clientWidth) - pinWidthFwd;
            Helper.byId('infobar-program-progress-fwd').style.width = Math.floor(totalWidthFwd * progress / 100 + pinWidthFwd / 2) + 'px';
            Helper.byId('infobar-program-pin-fwd').style.left = Math.floor(totalWidthFwd * progress / 100) + 'px';
        }

        if (channel['program_end_time'] && channel['program_begin_time']) {
            var duration = Helper.toInt(channel['program_end_time']) - Helper.toInt(channel['program_begin_time']);
            var seconds = Math.round(duration * progress / 100);
            Helper.setHtml('infobar-program-time', Helper.formatSeconds(seconds, true));
            Helper.setHtml('infobar-program-time-fwd', Helper.formatSeconds(seconds, true));
            Helper.setHtml('infobar-program-duration', Helper.formatSeconds(duration, true));
            Helper.setHtml('infobar-program-duration-fwd', Helper.formatSeconds(duration, true));
            startTimeForInfo = channel['program_begin_time'];
        } else {
            Helper.setHtml('infobar-program-time', timeNotAvailable);
            Helper.setHtml('infobar-program-time-fwd', timeNotAvailable);
            Helper.setHtml('infobar-program-duration', timeNotAvailable);
            Helper.setHtml('infobar-program-duration-fwd', timeNotAvailable);
        }
        currentProgram = null;
    };

	this.setProgram = function(program)
	{
		if (!program) return;

        // set button markers
        this.disabledIcons = {'multiaudio':this.disabledIcons['multiaudio'], 'rew':false, 'pause':false, 'fwd':false, 'stop':false};

        Helper.byId('player-channel-icon').src = playingChannel['icon'];
		Helper.setHtml('infobar-channel-number', ('00' + playingChannel['number']).substr(-3, 3));
		Helper.setHtml('infobar-channel-name', playingChannel['name']);

		Helper.showById('infobar-actions-bg');
		Helper.hideById('infobar-live-actions');
		Helper.showById('infobar-archive-actions');

        var timeNotAvailable = '';

        var programName = '';
        if (program['program_name']) {
            programName = program['program_name'];
            if (program['begin_time']) {
                var d = Helper.getDateWithShift(program['begin_time'] * 1000);
                var dateStr = '';
                if (d.getDate() != Helper.getDateWithShift().getDate() || d.getMonth() != Helper.getDateWithShift().getMonth())
                    dateStr += ('0' + d.getDate()).substr(-2, 2) + ' ' + App.lang.get('label-month-' + d.getMonth()) + ' ';
                dateStr += Helper.formatTime(program['begin_time']);
                programName = dateStr + ' ' + programName;
            }
        }

        if (programName.length > 90 ) {
            programName = '<span>' + programName + '</span>';
        }

        if (programName != Helper.getHtml('infobar-program-name'))
            Helper.setHtml('infobar-program-name', programName);

        if (programName != Helper.getHtml('infobar-program-name-fwd'))
            Helper.setHtml('infobar-program-name-fwd', programName);

        var progress = App.player.getProgramProgress(program);
        if (Helper.isVisible(tvInfoBarId) || Helper.isVisible(tvFwdBarId)) {
            var pinWidth = parseInt(Helper.byId('infobar-program-pin').clientWidth);
            var totalWidth = parseInt(Helper.byId('infobar-progress-info').clientWidth) - pinWidth;
            Helper.byId('infobar-program-progress').style.width = Math.floor(totalWidth * progress / 100 + pinWidth / 2) + 'px';
            Helper.byId('infobar-program-pin').style.left = Math.floor(totalWidth * progress / 100) + 'px';

            var pinWidthFwd = parseInt(Helper.byId('infobar-program-pin-fwd').clientWidth);
            var totalWidthFwd = parseInt(Helper.byId('infobar-progress-fwd').clientWidth) - pinWidthFwd;
            Helper.byId('infobar-program-progress-fwd').style.width = Math.floor(totalWidthFwd * progress / 100 + pinWidthFwd / 2) + 'px';
            Helper.byId('infobar-program-pin-fwd').style.left = Math.floor(totalWidthFwd * progress / 100) + 'px';
        }

        if (program['end_time'] && program['begin_time']) {
            var duration = Helper.toInt(program['end_time']) - Helper.toInt(program['begin_time']);
            var seconds = Math.round(duration * progress / 100);
            Helper.setHtml('infobar-program-time', Helper.formatSeconds(seconds, true));
            Helper.setHtml('infobar-program-time-fwd', Helper.formatSeconds(seconds, true));
            Helper.setHtml('infobar-program-duration', Helper.formatSeconds(duration, true));
            Helper.setHtml('infobar-program-duration-fwd', Helper.formatSeconds(duration, true));
            startTimeForInfo = program['begin_time'];
        } else {
            Helper.setHtml('infobar-program-time', timeNotAvailable);
            Helper.setHtml('infobar-program-time-fwd', timeNotAvailable);
            Helper.setHtml('infobar-program-duration', timeNotAvailable);
            Helper.setHtml('infobar-program-duration-fwd', timeNotAvailable);
            startTimeForInfo = 0;
        }
    };

	this.listReloading = false;
	this.setCurrentProgram = function (time) {
        var pausedProgram = {};
        var d = Helper.getDateWithShift(time*1000);
        var programDay = ('0' + d.getDate()).substr(-2, 2) + '.' +
            ('0' + (d.getMonth() + 1)).substr(-2, 2) + '.' + d.getFullYear();

        if (!this.listReloading) {
            this.listReloading = true;
            App.data.requestProgramListAll({
                'cid': playingChannel['id'],
                // 'date': programDay
            }, function (error, programList) {
                for (var i = 0; i < programList.length; i++) {
                    pausedProgram = programList[i];
                    if (Helper.toInt(pausedProgram['begin_time']) <= time && Helper.toInt(pausedProgram['end_time']) > time) {
                        break;
                    }
                }
                currentProgram = pausedProgram;
                App.playerScreen.setProgram(pausedProgram);
                App.playerScreen.syncState();
                App.playerScreen.listReloading = false;
            });
        }
    };

    this.syncState = function () {
        this.disabledIcons['stop'] = App.player.getMode() == App.player.MODE_LIVETV;

        for (var i in this.disabledIcons) {
            var item = i;
            if (i == "pause" && App.player.getState() != App.player.STATE_PLAYING)
                item = "play";

            Helper.setClass('btn-'+i+'-div', item+(this.disabledIcons[i] ? '_disabled' : ''));
        }
	};

    this.bufferingStart = function () {
        this.showLoadingBar();
    };

    this.bufferingComplete = function () {
        Logger.log('bufferingComplete in tv player. state = ' + App.player.getState());
        this.hideLoadingBar();
        if (Helper.isVisible(tvInfoBarId) || App.playerScreen.showBarAfterBuffering) {
            App.playerScreen.showBarAfterBuffering = false;
            this.showTvInfoBar();
        }
        if (App.player.getState() == App.player.STATE_BACKWARD || App.player.getState() == App.player.STATE_FORWARD)
            this.showTvFwdBar();
    };

    this.enableMultiaudio = function() {
        this.disabledIcons['multiaudio'] = true;//App.device.getAudioTracksInfo().length > 1 ? false : true;
        audioTrack = 0;//parseInt(App.device.getSettingsValue('channel-'+playingChannelId+'-audio', 0));
        this.switchAudioTrack();
        // this.showTvInfoBar();
    };

    this.refreshInfoBar = function () {
        if (Helper.isVisible(tvInfoBarId))
            this.showTvInfoBar();
    };

    // this.disablePlayerControls = function() {
    //     this.disablePlayIcons = true;
    //     this.showTvInfoBar();
    // };
    //
    // this.enablePlayerControls = function() {
    //     this.disablePlayIcons = false;
    //     this.showTvInfoBar();
    // };

    this.switchAudioTrack = function()
    {
        if (this.disabledIcons['multiaudio'])
            return;

        var audioTracks = Device.getAudioTracksInfo();
        Logger.log('Multiaudio activated. Current tracks: '+JSON.stringify(audioTracks));
        try {
            if (typeof (audioTracks[audioTrack]) != 'undefined') {
                Logger.log('Should switch audio track to ' + JSON.stringify(audioTracks[audioTrack]));
            } else {
                audioTrack = 0;
            }

            Device.setSelectedAudioTrack(audioTracks[audioTrack]['index']);
            if (audioTracks[audioTrack]['language'] == '')
                this.showAspectPad(App.lang.get('language-track').replace('{NUMBER}', audioTrack+1));
            else
                this.showAspectPad(audioTracks[audioTrack]['language']);
        } catch (e) {
            audioTrack = 0;
            Logger.log(e);
        }
    };

    this.showInfo = function () {
        if (startTimeForInfo == 0)
            return;
        App.display.setScreenStartOption({'channel_id': playingChannelId, 'time_start': startTimeForInfo});
        App.display.showScreen('info')
    };

    this.showRewindBar = function (seconds) {
        App.display.getCurrentScreen().showAspectPad((seconds < 0 ? "-" : "") + Helper.formatSeconds(Math.abs(seconds), true));
    };

    this.showSepg = function () {
        this.showTvInfoBar();
    }

    this.key_back = function()
    {
        if (Helper.isVisible(tvInfoBarId))
            this.hideTvInfoBar();
        else {
            if (App.playerScreen.isTizenBack())
                App.playerScreen.tizenKeyBack();
            else
                App.display.showScreen('tvchannels');
        }
    };

	this.key_enter = function()
	{
        if (!Helper.isVisible(tvInfoBarId)) {
            this.showTvInfoBar();
            return;
        }

        var action = this.navigationData[navigationMenu.getSelectedSourceItem()];
        switch (action) {
            case 'multiaudio':
			case 'rew':
			case 'fwd':
			case 'pause':
            case 'stop':
            case 'epg':
                Helper.executeFunctionByName('key_' + action, this);
                break;
            case 'favorites':
                if (App.data.isChannelIdInFavorites(playingChannelId))
                    App.data.deleteChannelIdFromFavorites(playingChannelId, function (error) {
                        if (error == 0) {
                            App.playerScreen.showWideAspectPad(App.lang.get('channel-is-unfavorited'), 'favorite');
                            Helper.removeClass('btn-favorites-div', 'marked');
                            App.mycontentScreen.reset();

                            // set category "all" if current category is "favorites"
                            var curCat = App.data.getCurrentCategory();
                            if (curCat && curCat['kind'] == 'favorites') {
                                App.data.setCurrentCategoryId(-1);
                            }
                        } else {
                            App.playerScreen.showWideAspectPad(App.lang.get('favorited-delete-error'), 'favorite');
                        }

                        // set category "all" if current category is "favorites"
                        var curCat = App.data.getCurrentCategory();
                        if (curCat && curCat['kind'] == 'favorites') {
                            App.data.setCurrentCategoryId(-1);
                        }
                    });
                else
                    App.data.addChannelIdToFavorites(playingChannelId, function (error) {
                        if (error == 0) {
                            App.playerScreen.showWideAspectPad(App.lang.get('channel-is-favorited'), 'favorite');
                            Helper.addClass('btn-favorites-div', 'marked');
                            App.mycontentScreen.reset();
                        } else {
                            App.playerScreen.showWideAspectPad(App.lang.get('favorited-add-error'), 'favorite');
                        }
                    });
                break;
            case 'info':
                this.showInfo();
                break;
            case 'mycontent':
                App.playerScreen.saveProgramToMyContent();
                break;
            default:
                App.display.showScreen(action);
                break;
        }
	};

	this.key_info = function()
	{
		if (Helper.isVisible(tvInfoBarId)) {
			this.hideTvInfoBar();
		} else {
			this.showTvInfoBar();
		}
	};

	this.key_pause = function()
	{
        if (this.disabledIcons['pause'] || App.player.getPlayingChannel() == null)
            return;

        item = this.getNavigationIndexByAction('pause');
		navigationMenu.setSelectedItem(item, item);

        switch (App.player.getMode()) {
        	case App.player.MODE_LIVETV:
				if (App.player.getBufferingComplete() == false) {
					Logger.log('Skip pause proceed cuz buffering is not done');
					return;
				}

				if (playingChannel && playingChannel['has_record']) {
                    var pauseTime = App.data.getUtcTime();
					Logger.log("Debug pauseTime = " + pauseTime);
                    if ( (App.device.deviceKind == 'eltex') && (App.player.nowPlayingUrl.indexOf("udp:", 0) >= 0) ) {
                        Logger.log("Eltex UDP should be fake Paused!");
                        App.player.fakePause();
                    }
                    else
                        App.player.pause();

                    App.player.setMode(App.player.MODE_TVARCHIVE);
                    App.player.setCurrentTime(pauseTime);

                    // App.playerScreen.saveProgramToMyContent();

                    this.showTvInfoBar(true);
        		}
        		break;
            case App.player.MODE_TVARCHIVE:
                if (App.player.getState() != App.player.STATE_PLAYING) {
					App.player.requestActualStreamUrl(App.player.getCurrentTime());
                } else {
                    App.player.pause();
                    // App.playerScreen.saveProgramToMyContent();
                }
                this.showTvInfoBar();
                break;
        }
	};

    this.saveProgramToMyContent = function () {
        App.data.requestAddProgramPause({'channel_id': App.player.getPlayingChannelId(), 'pause_time': App.player.getCurrentTime()},
            function (error, result) {
                if (error == 0) {
                    App.playerScreen.showWideAspectPad(App.lang.get('label-program-pause-added'), 'pause_media');

                    // refresh App.data.pausedPrograms
                    App.data.requestProgramPausesList({}, function () {
                        App.mycontentScreen.reset();
                    });
                } else {
                    App.playerScreen.showWideAspectPad(App.lang.get('label-program-pause-error'), 'pause_media');
                }
            }
        )
    }

	this.key_play = function()
	{
		this.key_pause();
	};

	this.key_stop = function()
	{
        if (this.disabledIcons['stop'] || App.player.getPlayingChannel() == null)
            return;

        if (App.player.getMode() == App.player.MODE_TVARCHIVE) {
			if (App.device.deviceKind != 'eltex')
				App.player.stop();

            if (playingChannel) {
            	App.player.playChannel(playingChannel);
			}

			// надо сбросить текущее выделение т.к. кнопка становится неактивной
            this.setNavigationFocus();

            App.playerScreen.hideTvFwdBar();
        }
	};

	this.key_fwd = function()
	{
        if (this.disabledIcons['fwd'] || App.player.getPlayingChannel() == null)
            return;

        if (App.player.getCurrentTime() < App.data.getUtcTime()) {
            // item = this.getNavigationIndexByAction('fwd');
            // navigationMenu.setSelectedItem(item, item);

            if (App.player.getMode() == App.player.MODE_LIVETV) {
                App.player.setMode(App.player.MODE_TVARCHIVE);
                App.player.setCurrentTime(App.data.getUtcTime())
            }

            App.player.forward();
            this.showTvFwdBar();
        } else {
            window.clearTimeout(playerToLiveTimeout);
            playerToLiveTimeout = window.setTimeout(function () {
                App.playerScreen.key_stop();
            }, 500);
        }
	};

	this.key_rew = function()
	{
	    if (this.disabledIcons['rew'] || App.player.getPlayingChannel() == null)
	        return;

        // item = this.getNavigationIndexByAction('rew');
        // navigationMenu.setSelectedItem(item, item);

        if (App.player.getMode() == App.player.MODE_LIVETV) {
            App.player.setMode(App.player.MODE_TVARCHIVE);
            App.player.setCurrentTime(App.data.getUtcTime())
        }

        App.player.backward();
		this.showTvFwdBar();
	};

	this.key_next_program = function() {
        if (!playingChannel['has_record'] || playingChannel['locked'] || this.disablePlayIcons)
            return;

        if (App.player.getMode() == App.player.MODE_TVARCHIVE && currentProgram) {
            if (Helper.toInt(currentProgram['end_time']) > App.data.getUtcTime())
                App.player.playChannel(playingChannel);
            else {
                App.player.setCurrentTime(Helper.toInt(currentProgram['end_time']));
                App.playerScreen.forceTvInfoShow = true;
                App.playerScreen.showBarAfterBuffering = true;
                App.player.requestActualStreamUrl(App.player.getCurrentTime());
            }
        }
	};

	this.key_prev_program = function() {
        if (!playingChannel['has_record'] || playingChannel['locked'] || this.disablePlayIcons)
            return;

        if (App.player.getMode() == App.player.MODE_LIVETV) {
            if (playingChannel['program_begin_time'] == 0)
                return;
            App.player.playTimeshift(playingChannel, Helper.toInt(playingChannel['program_begin_time'])+1);
        } else if (App.player.getMode() == App.player.MODE_TVARCHIVE) {
            if (currentProgram)
                App.player.setCurrentTime(Helper.toInt(currentProgram['begin_time'])-60);

            if (!this.listReloading) {
                this.listReloading = true;
                App.data.requestProgramListAll({
                    'cid': playingChannel['id']
                }, function (error, programList) {
                    for (var i = 0; i < programList.length; i++) {
                        if (Helper.toInt(programList[i]['begin_time']) < App.player.getCurrentTime() &&
                            Helper.toInt(programList[i]['end_time']) >= App.player.getCurrentTime()) {
                            App.player.setCurrentTime(Helper.toInt(programList[i]['begin_time']));
                            App.playerScreen.forceTvInfoShow = true;
                            App.playerScreen.showBarAfterBuffering = true;
                            App.player.requestActualStreamUrl(App.player.getCurrentTime());
                            break;
                        }
                    }
                    App.playerScreen.listReloading = false;
                });
            }
        }
	};

    this.key_up = function(){
        if (App.player.getMode() == App.player.MODE_LIVETV) {
            App.playerScreen.key_ch_plus();
        } else {
            App.display.showScreen("search");
        }
    };

    this.key_down = function(){
        if (App.player.getMode() == App.player.MODE_LIVETV) {
            App.playerScreen.key_ch_minus();
        } else {
            App.display.showScreen('sepg');
        }
	};

	this.key_digit = function(digit)
	{
		// if (App.player.getMode() === App.player.MODE_LIVETV) {
			this.showChannelNumberPad(digit);
		// } else if (App.player.getMode() === App.player.MODE_TVARCHIVE) {
         //    App.playerScreen.showTextBar(App.lang.get('you-in-the-archive-mode-msg'));
        // }
	};


	this.key_ch_plus = function()
	{
        currentChannelId = App.player.getPlayingChannelId();
        nextChannel = App.data.getNextChannel(currentChannelId);
        playingChannel = nextChannel;
        App.player.playChannel(nextChannel);
	};

	this.key_ch_minus = function()
	{
        currentChannelId = App.player.getPlayingChannelId();
        previousChannel = App.data.getPreviousChannel(currentChannelId);
        playingChannel = previousChannel;
        App.player.playChannel(previousChannel);
	};

    this.key_right = function () {
        if (!Helper.isVisible(tvInfoBarId)) {
            if (this.disabledIcons['fwd'] || App.player.getPlayingChannel() == null)
                return;

            if (App.player.getCurrentTime() < App.data.getUtcTime()) {
                if (App.player.getMode() == App.player.MODE_LIVETV) {
                    App.player.setMode(App.player.MODE_TVARCHIVE);
                    App.player.setCurrentTime(App.data.getUtcTime())
                }
                App.player.forward();
            } else {
                window.clearTimeout(playerToLiveTimeout);
                playerToLiveTimeout = window.setTimeout(function () {
                    App.playerScreen.key_stop();
                }, 500);
            }
            this.showTvFwdBar();
            return;
        }

		navigationMenu.setNextItem();
        this.moveFocusToEnabledItem(navigationMenu.setNextItem);
        this.showTvInfoBar();
	};

    this.key_left = function () {
        if (!Helper.isVisible(tvInfoBarId)) {
            if (this.disabledIcons['rew'] || App.player.getPlayingChannel() == null)
                return;

            if (App.player.getMode() == App.player.MODE_LIVETV) {
                App.player.setMode(App.player.MODE_TVARCHIVE);
                App.player.setCurrentTime(App.data.getUtcTime())
            }

            App.player.backward();
            this.showTvFwdBar();
            return;
        }

        navigationMenu.setPreviousItem();
        this.moveFocusToEnabledItem(navigationMenu.setPreviousItem);
        this.showTvInfoBar();
    };

    this.moveFocusToEnabledItem = function (action) {
        var btnName = this.navigationData[navigationMenu.getSelectedSourceItem()];
        while (this.disabledIcons[btnName]) {
            action.call(navigationMenu);
            btnName = this.navigationData[navigationMenu.getSelectedSourceItem()];
        }
    }

    this.key_aspect = function()
    {
        if (App.player.getState() === App.player.STATE_PLAYING) {
            var newAspect = App.device.switchAspectRatio();
            this.showAspectPad(App.device.getAspectRatioName(newAspect));
            App.settingsScreen.setInited(false);
        }
    };

    this.key_play_pause = function() 
    {
		this.key_pause();
    };

	this.key_multiaudio = function()
	{
	    if (this.disabledIcons['multiaudio'])
	        return;

		audioTrack ++;
		this.switchAudioTrack();

        App.device.setSettingsValue('channel-'+playingChannelId+'-audio', audioTrack);
        App.device.saveSettings(App.clientSettings['settings_filename']);
	};

}
_PlayerScreen = new BaseScreen();
PlayerScreen.prototype = _PlayerScreen;