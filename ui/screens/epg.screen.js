function EPGScreen()
{
	// Private:
    var EPG_DAYS_COUNT = 26;
    var dayRows = 8;
    var EPG_DAYS_SHIFT = 20;
    var programRows = 8;

    var CURRENT_EPG = 'current';
    var FIRST_EPG = 'first';
    var LAST_EPG = 'last';

    var selectedChannel = null;
    var selectedProgram = null;
    var epgDaysData = [];

    var lastStartData = null;

    var epgDaysMenu = new BaseMenu({
        menuId: 'epg-days-list',
        menuTag: 'ul',
        itemIdPrefix: 'epgday',
        itemTag: 'li',
        useFastRefresh: true,
        hideItemIfEmptyName: true,
        allowMouseNavigation: true,
        onAfterItemSelect: function(realItemIndex, itemIndex) {
            // перезагружаем список программ только через 300 мс
            // для предотвращения зависания приставки если зажимают кнопку
            App.epgScreen.denyKeyRight = true;
            Helper.delayedCall(function () {
                App.epgScreen.loadEpgData();
            }, 300);
        },
        onItemClick: function(index) {
            var sourceItems = epgDaysMenu.getCurrentPage() * epgDaysMenu.getNumberOfDisplayItems() + index;
            epgDaysMenu.setSelectedItem(index, sourceItems);
        },
        getItemNameFunc: function(realItemIndex, itemIndex) {
            if (typeof epgDaysData[realItemIndex] == 'undefined')
                return '';

            var now = App.data.getUtcTime();
            now -= now % 86400;
            now += 12*60*60;

            if (epgDaysData[realItemIndex] == now)
                return App.lang.get('label-day-today');

            var d = Helper.getDateWithShift((epgDaysData[realItemIndex] + 100)*1000);
            var day = App.lang.get('label-day-' + d.getDay().toString());
            var date = ('0' + d.getDate()).substr(-2, 2) + ' ' + App.lang.get('label-month-' + d.getMonth());
            return day + ", " + date;
        },
        onMenuFocus: function() {
            // if (!App.display.getCurrentScreen().isTizenLegend()) {
                App.epgScreen.legendManager.setItems([
                    {"id": "left", "text": "tvchannels", "onclick": App.epgScreen.key_left}
                ]);
            // } else {
            //     App.epgScreen.legendManager.reset();
            // }
        },
        onItemMouseOver: function(index) {
            App.epgScreen.changeFocusedMenu(epgDaysMenu);
        }
    });

	var epgMenu = new BaseMenu({
		menuId: 'epg-list',
		menuTag: 'ul',
		itemIdPrefix: 'epg',
		itemTag: 'li',
		useFastRefresh: true,
		hideItemIfEmptyName: true,
        allowMouseNavigation: true,
		getItemNameFunc: function(realItemIndex, itemIndex) {
			var program = App.epgScreen.selectedPrograms[realItemIndex];
			if (program) {
                var timeClass = 'epg-future';
                if (program['end_time'] < App.data.getUtcTime())
                    timeClass = 'epg-past';

                var currentTime = App.data.getUtcTime();
                var recordClass = 'no-record';
                if (selectedChannel['has_record'] && program['begin_time'] <= currentTime)
                    recordClass = "has-record";

                if (currentTime > program['begin_time'] && currentTime < program['end_time'])
                    recordClass = "active-record";

                if (selectedChannel['locked_record'] && program['begin_time'] <= currentTime)
                    recordClass = "locked";

                // if (typeof program['pause_time'] != 'undefined' && program['pause_time'] > 0)
                //     recordClass += " myrecord";

                return '<div class="clickable_container">' +
                    '<div class="main_content" onclick="App.epgScreen.key_enter();">' +
                    '<div class="epg-program-record ' + recordClass + '"></div>' +
				    '<div class="epg-program-time ' + timeClass + '">' + Helper.formatTime(program['begin_time']) + '</div>' +
                    '<div class="epg-program-name ' + timeClass + '">' + program['name'] + '</div>' +
                    '</div>' +
                    '<div class="clickable_content" onclick="App.epgScreen.key_right();" ' +
                    'onmouseover="App.epgScreen.highlightArrowRight(this, true)" ' +
                    'onmouseout="App.epgScreen.highlightArrowRight(this, false)" ' +
                    '></div>' +
                    '</div>';
				return s;
			} else {
				return "";
			}
		},
        onAfterItemSelect: function(realItemIndex, itemIndex) {
            var program = App.epgScreen.selectedPrograms[realItemIndex];
            App.epgScreen.loadProgramData(program);
        },
        onSourceItemsEndReached: function (index) {
            App.epgScreen.setFocusAfterLoadEpg = true;
            App.epgScreen.loadingEpgBlock = true;
		    if (index == 0) {
                App.epgScreen.setFocusAfterLoadEpgOn = LAST_EPG;
		        epgDaysMenu.setPreviousItem();
            } else {
                App.epgScreen.setFocusAfterLoadEpgOn = FIRST_EPG;
                epgDaysMenu.setNextItem();
            }
        },
        onMenuFocus: function() {
            if (!App.display.getCurrentScreen().isTizenLegend()) {
                App.epgScreen.legendManager.setItems([
                    {"id": "ok", "text": "watch", "onclick": App.epgScreen.key_enter},
                    {"id": "right", "text": "info", "onclick": App.epgScreen.key_right}
                ]);
            } else {
                App.epgScreen.legendManager.setItems([
                    {"id": "tizen-ok", "text": "watch", "onclick": App.epgScreen.key_enter},
                    {"id": "right", "text": "info", "onclick": App.epgScreen.key_right},
                    {"id": "tizen-scroll", "text": "scroll", "onclick": App.epgScreen.focusedMenu.nextPage}
                ]);
            }
        },
        onItemClick: function(index) { },
		onItemMouseOver: function(index) {
		    App.epgScreen.changeFocusedMenu(epgMenu);
            var currentPage = epgMenu.getCurrentPage();
            var sourceItems = (currentPage == -1 ? 0 : currentPage) * epgMenu.getNumberOfDisplayItems() + index;
        	epgMenu.setSelectedItem(index, sourceItems);
		}
	});



	// Public:
    this.selectedPrograms = [];
    this.setFocusAfterLoadEpg = false;
    this.setFocusAfterLoadEpgOn = CURRENT_EPG;
    this.loadingEpgBlock = false;
    this.denyKeyRight = false;

    this.getEpgDaysShift = function() {
        return EPG_DAYS_SHIFT;
    };

    this.show = function()
    {
        _EPGScreen.show();

        Helper.hideById('no-epg-message');
        Helper.hideById('epg-list');
        Helper.hideById('program-data');
        Helper.showById('epg-data-loading');
        Helper.showById('program-data-loading');

        this.focusedMenu = epgDaysMenu;
        this.setFocusAfterLoadEpgOn = CURRENT_EPG;
        selectedProgram = null;

        this.refreshDisplayTime();

        dayRows = this.getMenuRowsCount("left", dayRows);
        programRows = this.getMenuRowsCount("right", programRows);
        this.fillEpgDaysData();
		epgDaysMenu.clear();
		epgDaysMenu.setNumberOfRows(dayRows);
    	epgDaysMenu.setNumberOfDisplayItems(dayRows);
    	epgDaysMenu.setNumberOfSourceItems(EPG_DAYS_COUNT);

    	var startData = App.display.getScreenStartOption();
        if (startData == null && lastStartData == null)
            startData = App.player.getCurrentTime();
        else if (startData == null && lastStartData != null)
            startData = lastStartData;
        else
            lastStartData = startData;

    	for (var index = 0; index < epgDaysData.length; index ++) {
            var epgDay = Helper.getDateWithShift(epgDaysData[index]*1000);
            var startDay = Helper.getDateWithShift((startData)*1000)
    	    if (epgDay.getMonth() == startDay.getMonth() && epgDay.getDate() == startDay.getDate())
    	        break;
        }
        epgDaysMenu.setSelectedItem(index % dayRows, index);

        this.focusedMenu.setMenuFocus();

        var selectedChannelId = App.data.getSelectedChannelId();
        selectedChannel = App.data.getChannelById(selectedChannelId);
        var cat = App.data.getCurrentCategory();
        Helper.setHtml('epg-category', cat['name']);
        if (selectedChannel != null)
            Helper.setHtml('epg-channel-name', selectedChannel['number']+". "+selectedChannel['name']);
        else
            Helper.setHtml('epg-channel-name', '');
        Helper.setHtml('epg-channel-description', '');

        this.hideLoadingBar();

        this.setFocusAfterLoadEpg = true;
    };

    this.fillEpgDaysData = function()
    {
		var now = App.data.getUtcTime();
        now -= now % 86400;
        now += 12*60*60;

    	epgDaysData = [];
    	for (var i = -1 * EPG_DAYS_SHIFT; i < EPG_DAYS_COUNT - EPG_DAYS_SHIFT; i++) {
    		epgDaysData.push(now + i*86400);
    	}
    };

    this.setChannel = function (channel) {
        selectedChannel = channel;
        App.data.setSelectedChannelId(channel['id']);
        App.epgScreen.show();
    };

	this.loadEpgData = function()
	{
        if (!selectedChannel) {
            App.epgScreen.showNoEpg();
            return;
        }

        var selectedDay = epgDaysMenu.getSelectedSourceItem();

        if (typeof epgDaysData[selectedDay] == 'undefined') {
            App.systemMessageScreen.setHeaderText('');
            App.systemMessageScreen.setMessageText(App.lang.get('epg-day-not-exist'));
            App.systemMessageScreen.setHideTimeout(3000);
            App.systemMessageScreen.setOkCallback(function () { App.display.back('player'); });
            App.display.showScreenAsPopup('system-message');
            return;
        }
        var d = Helper.getDateWithShift(epgDaysData[selectedDay]*1000);
        var formattedDay = ('0' + d.getDate()).substr(-2, 2) + '.' + ('0' + (d.getMonth() + 1)).substr(-2, 2) + '.' + d.getFullYear();
        App.epgScreen.loadingEpgBlock = true;
        App.epgScreen.denyKeyRight = false;
        App.data.requestProgramList({ 'cid': selectedChannel['id'], 'date': formattedDay }, function(error, programList){
            Helper.hideById('epg-data-loading');
            if (error === 0) {
			    App.epgScreen.selectedPrograms = programList;
			    App.epgScreen.matchProgramsWithMyPauses();

                var programCount = programList.length;

                epgMenu.resetSelection();
                epgMenu.unsetMenuFocus();
				epgMenu.clear();

                if (programCount === 0) {
                    App.epgScreen.showNoEpg();
                } else {
                    Helper.hideById('no-epg-message');
                    Helper.showById('epg-list');

                    var n = programCount < programRows ? programCount : programRows;

                    epgMenu.setNumberOfDisplayItems(n);
                    epgMenu.setNumberOfRows(n);
                    epgMenu.setNumberOfColumns(1);
                    epgMenu.setNumberOfSourceItems(programCount);

                    var epgRealIndex = App.epgScreen.getProgramByTime(programList, lastStartData);

                    var epgDisplayIndex = epgRealIndex % epgMenu.getNumberOfDisplayItems();
                    if (epgRealIndex <= 0 || epgRealIndex >= programCount) {
                        epgRealIndex = 0;
                        epgDisplayIndex = 0;
                    }

                    epgMenu.setSelectedItem(epgDisplayIndex, epgRealIndex);
                    // epgMenu.redrawMenuItems();

                    if (App.epgScreen.setFocusAfterLoadEpg) {
                        App.epgScreen.changeFocusedMenu(epgMenu);
                        epgMenu.setMenuFocus();
                    }
                    // window.setTimeout(function () {
                        if (App.epgScreen.focusedMenu != null)
                            App.epgScreen.focusedMenu.setMenuFocus();
                    // }, 0);
                }
			}
            App.epgScreen.setFocusAfterLoadEpg = false;
            App.epgScreen.loadingEpgBlock = false;
		}, true);
	};

    this.matchProgramsWithMyPauses = function () {
        for (var i in App.epgScreen.selectedPrograms) {
            if (typeof App.epgScreen.selectedPrograms[i]['pause_time'] != 'undefined')
                delete App.epgScreen.selectedPrograms[i]['pause_time'];
        }

        for (var i in App.data.pausedPrograms) {
            if (App.data.pausedPrograms[i]['channel_id'] == selectedChannel['id']) {
                var index = App.epgScreen.getProgramByTime(App.epgScreen.selectedPrograms, App.data.pausedPrograms[i]['pause_time']);
                if (typeof App.epgScreen.selectedPrograms[index] != 'undefined')
                    App.epgScreen.selectedPrograms[index]['pause_time'] = parseInt(App.data.pausedPrograms[i]['pause_time']);
            }
        }
    };


    this.showNoEpg = function () {
        Helper.showById('no-epg-message');
        Helper.hideById('epg-list');
        Helper.hideById('epg-data-loading');

        // и надо сбросить описание программы, чтобы не крутилось там лишнего...
        Helper.hideById('program-data-loading');
        Helper.showById('program-data');
        Helper.setHtml('program-data', '');
    };

	this.getProgramByTime = function (programList, time) {
        if (App.epgScreen.setFocusAfterLoadEpgOn == CURRENT_EPG) {
            for (var i = 0; i < programList.length; i++) {
                var p = programList[i];
                if (parseInt(p['begin_time']) <= time && parseInt(p['end_time']) > time) {
                    return i;
                }
            }
        } else if (App.epgScreen.setFocusAfterLoadEpgOn == LAST_EPG)
            return programList.length - 1;
        return -1;
    };

	this.clickOnInfo = function () {
	    if (typeof selectedChannel['id'] != 'undefined' && typeof selectedProgram['begin_time'] != 'undefined') {
            App.display.setScreenStartOption({
                'channel_id': selectedChannel['id'],
                'time_start': selectedProgram['begin_time']
            });
            App.display.showScreen('info')
        }
    };

	this.loadProgramData = function(program)
	{
        if (!selectedChannel || !program) return;
        if (selectedProgram == program) return;

        selectedProgram = program;

        Helper.showById('program-data-loading');
        Helper.showById('program-data');
        var programDataElement = Helper.byId('program-data');
        programDataElement.style.visibility = 'hidden';
        programDataElement.removeEventListener('click', App.epgScreen.clickOnInfo, false);
        programDataElement.style.cursor = '';

        // var d = Helper.getDateWithShift(program['begin_time']*1000);
        // var day = ('0' + d.getDate()).substr(-2, 2) + ' ' + App.lang.get('label-month-' + d.getMonth());
        // var time = ('0' + d.getHours()).substr(-2, 2) + ':' + ('0' + d.getMinutes()).substr(-2, 2);

        var descr = Helper.cutBySpace(selectedProgram['full_description'], 200);
        s = "<div class='text-data' id='program-text-data'>";
        s += "<div class='program-image' id='program-image'></div>";
        s += "<div class='program-name' id='program-name'>"+selectedProgram['name']+"</div>";
        s += "<div class='program-subtitle' id='program-subtitle'></div>";
        s += "<div class='program-description' id='program-description' "+(descr == '' ? "style='display:none;'" : '')+">"+descr+"</div>";
        s += "</div>";
        s += "<div class='program-rating' id='program-rating'></div>";
        Helper.setHtml('program-data', s);
        programDataElement.addEventListener('click', App.epgScreen.clickOnInfo, false);
        programDataElement.style.cursor = 'pointer';

        Helper.delayedCall(function () {
            var data = {'cid': selectedChannel['id'], 'starttime': selectedProgram['begin_time']};
            App.data.requestProgramFullInfo(data, function (error, info) {
                var label = '';
                label += info['season'] ? App.lang.get('label-season')+': '+info['season'] : '';
                label += (label == '' ? '' : ', ') + (info['episode'] ? App.lang.get('label-episode')+': '+info['episode'] : '');
                if ( label != '' )
                      Helper.setHtml('program-subtitle', label);
                if (typeof info['rating'] != 'undefined')
                    Helper.setHtml('program-rating', '<span>'+App.lang.get('label-rating')+'</span>'+info['rating']+'+');
                if (typeof info['images'] != 'undefined' && typeof info['images']['big'] != 'undefined') {
                    Helper.setHtml('program-image', '<img class="image" id="program-image-src" src="' + info['images']['big'] + (App.device.getDeviceKind() == 'mag' ? '?rand=' + Math.random() : '') + '">');
                    Helper.byId("program-image-src").onload = function () {
                        App.epgScreen.fixImageHeight();
                    };
                    Helper.byId("program-image-src").onerror = function () {
                        Helper.setHtml('program-image', '');
                        App.epgScreen.fixImageHeight();
                    };
                } else {
                    Helper.setHtml('program-image', '');
                    App.epgScreen.fixImageHeight();
                }

            })
        }, 400);
	};

	this.fixImageHeight = function () {
        var imgW = parseInt(Helper.byId("program-image-src").width);
        var imgH = parseInt(Helper.byId("program-image-src").height);
        var divW = parseInt(Helper.byId("program-image").clientWidth);

        // fix height
        var areaH = Helper.byId("program-text-data").offsetHeight -
            Helper.byId("program-name").offsetHeight - Helper.byId("program-subtitle").offsetHeight -
            Helper.byId("program-description").offsetHeight - Helper.byId("program-rating").offsetHeight;

        var scaleToArea = areaH / imgH;
        if (imgW*scaleToArea > divW) {
            scaleToArea = divW/imgW;
        }

        Helper.byId("program-image-src").width = parseInt(imgW*scaleToArea);
        Helper.byId("program-image-src").height = parseInt(imgH*scaleToArea);
        Helper.byId("program-image").style.height = Helper.byId("program-image-src").height + 'px';

        Helper.hideById('program-data-loading');
        Helper.showById('program-data');
        Helper.byId('program-data').style.visibility = '';
    };

	this.playSelectedProgram = function(skipParentControlCheck)
	{
        var selectedProgramIndex = epgMenu.getSelectedSourceItem();
        var selectedProgram = this.selectedPrograms[selectedProgramIndex];

        if (!selectedProgram || !selectedChannel)
            return;

        if (selectedChannel['locked_record'] || !selectedChannel['has_record']) {
            App.systemMessageScreen.setHeaderText('');
            App.systemMessageScreen.setMessageText(App.lang.get('label-no-timeshift'));
            App.systemMessageScreen.setHideTimeout(2000);
            App.display.showScreenAsPopup('system-message');
            return;
        }

        if (App.player.getMode() == App.player.MODE_TVARCHIVE &&
            selectedProgram['begin_time'] < App.player.getCurrentTime() &&
            selectedProgram['end_time'] > App.player.getCurrentTime()) {
            App.display.showScreen('player');
            return;
        }

        if (typeof selectedProgram['pause_time'] != 'undefined' && selectedProgram['pause_time'] > 0) {
            var label = App.lang.get('label-start-my-paused-record');
            var diff = selectedProgram['pause_time'] - selectedProgram['begin_time'];
            var sec = diff % 60;
            label = label.replace("{TIME}", Math.round((diff - sec) / 60)+':'+('00'+sec).substr(-2,2));
            App.systemConfirmScreen.setHeaderText('');
            App.systemConfirmScreen.setMessageText(label);
            App.systemConfirmScreen.setOkCallback(function () {
                App.epgScreen.startPlayingFromTime(selectedProgram['pause_time']);
            });
            App.systemConfirmScreen.setCancelCallback(function () {
                App.epgScreen.startPlayingFromTime(selectedProgram['begin_time']);
            });
            App.display.showScreenAsPopup('system-confirm');
        } else
            App.epgScreen.startPlayingFromTime(selectedProgram['begin_time']);
	};

	this.startPlayingFromTime = function(time) {
        App.player.playTimeshift(selectedChannel, time);
    };

    this.restorePlayingChannel = function () {
        // если выходим отсюда, то надо сбросить текущее выделение
        App.data.setCurrentCategoryId(App.player.getPlayingCategoryId());
        App.data.setSelectedChannelId(App.player.getPlayingChannelId());
        App.data.filterChannelListByCategory(App.player.getPlayingCategoryId());
        App.tvChannelsScreen.reset();
    };

	// key handlers

    this.key_mouseback = function() {
        if (App.epgScreen.isTizenBack() || !this.focusMoved) {
            App.display.showScreen('tvchannels');
        } else {
            App.epgScreen.key_back();
        }
    };

    this.key_back = function()
    {
        // if (App.epgScreen.isTizenBack()) {
        //     App.epgScreen.tizenKeyBack();
        //     return;
        // }

        if (App.player.getState() == App.player.STATE_STOPPED || !this.focusMoved) {
            App.tvChannelsScreen.reset();
            App.display.showScreen('tvchannels');
        } else {
            this.restorePlayingChannel();
            App.epgScreen.key_toplayer();
        }
	};

    this.key_up = function()
    {
        this.focusMoved = true;

        if (!App.epgScreen.loadingEpgBlock)
            this.focusedMenu.setPreviousItem();
    };

    this.key_down = function()
    {
        this.focusMoved = true;

        if (!App.epgScreen.loadingEpgBlock)
            this.focusedMenu.setNextItem();
    };

    this.key_left = function(param)
    {
        this.focusMoved = true;

        if (App.epgScreen.loadingEpgBlock)
            return;

        if (this.focusedMenu != null && this.focusedMenu.getMenuId() == epgMenu.getMenuId() &&  param != 'mouse') {
            this.changeFocusedMenu(epgDaysMenu);
        } else {
            App.tvChannelsScreen.reset();
            App.display.showScreen('tvchannels');
        }
    };

    this.key_right = function()
    {
        this.focusMoved = true;

        if (App.epgScreen.loadingEpgBlock || App.epgScreen.denyKeyRight)
            return;

        if (App.epgScreen.focusedMenu != null && App.epgScreen.focusedMenu.getMenuId() == epgDaysMenu.getMenuId()) {
            if (App.epgScreen.selectedPrograms.length > 0) {
                App.epgScreen.changeFocusedMenu(epgMenu);
            }
        } else {
            var programIndex = epgMenu.getSelectedSourceItem();
            var program = App.epgScreen.selectedPrograms[programIndex];
            if (!program || !selectedChannel) {
                return;
            }
            lastStartData = program['begin_time'];
            App.display.setScreenStartOption({'channel_id': selectedChannel['id'], 'time_start': program['begin_time']});
            App.display.showScreen('info')
        }
    };

	this.key_enter = function() {
	    if (App.epgScreen.focusedMenu != null && App.epgScreen.focusedMenu.getMenuId() == epgDaysMenu.getMenuId()) {
            App.epgScreen.key_right()
	    } else {
            var programIndex = epgMenu.getSelectedSourceItem();
            var program = App.epgScreen.selectedPrograms[programIndex];
            if (!program || !selectedChannel) {
                return;
            }

            if (program['begin_time'] < App.data.getUtcTime()) {
                App.epgScreen.playSelectedProgram();
            } else {
                App.player.playChannel(selectedChannel);
            }
        }
	};

    this.key_ch_plus = function() {
        nextChannel = App.data.getNextChannel(selectedChannel['id']);
        this.setChannel(nextChannel);
        this.focusMoved = true;
    };

    this.key_ch_minus = function() {
        previousChannel = App.data.getPreviousChannel(selectedChannel['id']);
        this.setChannel(previousChannel);
        this.focusMoved = true;
    };

    this.key_digit = function(digit) {
        this.showChannelNumberPad(digit);
    };

    // callback when number entered in channel pad
    this.channelNumberPadProcess = function(channel) {
        this.setChannel(channel);
    };

}

_EPGScreen = new BaseScreen();
EPGScreen.prototype = _EPGScreen;