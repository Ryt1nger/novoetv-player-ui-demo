function SepgScreen()
{
	// Private:

	var sepgSlots = 3;

    this.epgList = [];
    this.selectedIndex = 1;

	this.show = function()
    {
        _SepgScreen.show();
        this.blockMouseBackButton();
        this.epgList = [];

        Helper.setHtml("sepg-block-title", '');
        var loadingHtml = '<div class="loading"><img src="img/loading_data.gif"></div>';
        Helper.setHtml('sepg-channel-0', loadingHtml);
        Helper.setHtml('sepg-channel-1', loadingHtml);
        Helper.setHtml('sepg-channel-2', loadingHtml);

        App.data.requestProgramListAll({'cid': App.player.getPlayingChannelId(), 'poster': 1}, function (error, programList) {
            if (programList.length == 0) {
                App.sepgScreen.setProgram(0, 'sepg-channel-0', false);
                App.sepgScreen.setProgram(0, 'sepg-channel-1', true);
                App.sepgScreen.setProgram(0, 'sepg-channel-2', false);
            } else {
                var time = App.player.getCurrentTime();
                App.sepgScreen.epgList = programList;
                for (var i in App.sepgScreen.epgList)
                    App.sepgScreen.epgList[i]['pause_time'] = App.data.isProgramInPaused(App.player.getPlayingChannelId(), App.sepgScreen.epgList[i]['begin_time']);

                for (var i = 0; i < programList.length; i++) {
                    if (Helper.toInt(programList[i]['begin_time']) <= time && Helper.toInt(programList[i]['end_time']) > time) {
                        break;
                    }
                }
                App.sepgScreen.fillPrograms(i);
            }
        });
    };

    this.fillPrograms = function (index) {
        this.selectedIndex = index;
        Helper.showVisibilityById('sepg-left-arrow');
        Helper.showVisibilityById('sepg-right-arrow');
        this.setProgram(index - 1, 'sepg-channel-0', false);
        this.setProgram(index, 'sepg-channel-1', true);
        this.setProgram(index + 1, 'sepg-channel-2', false);
    };

	this.setProgram = function (index, elementId, selected) {
	    if (selected)
	        Helper.addClass(elementId, 'selected');
        else
            Helper.removeClass(elementId, 'selected');

        if (typeof this.epgList[index] == 'undefined')
            Helper.setHtml(elementId, '<div style="text-align:center; margin-top:10px;">Данные отсутствуют</div>');
        else {
            var width = 0;
            if (App.data.getUtcTime() > this.epgList[index]['begin_time'] && App.data.getUtcTime() < this.epgList[index]['end_time'])
                width = 100 * (App.data.getUtcTime() - this.epgList[index]['begin_time']) / (this.epgList[index]['end_time'] - this.epgList[index]['begin_time'])

            var str = '<div class="sepg-image">' +
                '<img class="absolute_img" src="' + this.epgList[index]['poster'] + '">' +
                (selected && App.data.getUtcTime() > this.epgList[index]['begin_time']
                && App.player.getPlayingChannel().has_record ? '<img class="absolute_play" src="img/sepg_play.png">' : '') +
                '</div>';
            str += '<div class="sepg-name"><table width="100%" height="100%"><tr><td valign="center">' + Helper.formatTime(this.epgList[index]['begin_time']) + ' ';
            str += this.epgList[index]['program_name'] + '</td></tr></table></div></div>';
            str += '<div class="sepg-line" style="' + (width == 0 ? 'visibility:hidden' : '') + '">' +
                '<div class="sepg-line-inner" ' + 'style="width:' + Math.round(width) + '%;"></div></div>';

            Helper.setHtml(elementId, str);
        }
    };

    this.hide = function()
    {
        _SepgScreen.hide();
    };


    this.key_back = function()
	{
		App.display.back('player');
	};

	this.key_enter = function()
	{
        if (typeof this.epgList[this.selectedIndex] != 'undefined') {
            var program = this.epgList[this.selectedIndex];
            if (program['begin_time'] > App.data.getUtcTime() || !App.player.getPlayingChannel().has_record)
                App.player.playChannel(App.player.getPlayingChannel());
            else {
                if (program['pause_time'] > 0) {
                    var label = App.lang.get('label-start-my-paused-record');
                    var diff = program['pause_time'] - program['begin_time'];
                    var sec = diff % 60;
                    label = label.replace("{TIME}", Math.round((diff - sec) / 60) + ':' + ('00' + sec).substr(-2, 2));
                    App.systemConfirmScreen.setHeaderText('');
                    App.systemConfirmScreen.setMessageText(label);
                    App.systemConfirmScreen.setOkCallback(function () {
                        App.sepgScreen.startPlayingFromTime(program['pause_time']);
                    });
                    App.systemConfirmScreen.setCancelCallback(function () {
                        App.sepgScreen.startPlayingFromTime(program['begin_time']);
                    });
                    App.display.showScreenAsPopup('system-confirm');
                } else
                    App.sepgScreen.startPlayingFromTime(program['begin_time']);
            }
        }
	};

    this.startPlayingFromTime = function(time) {
        App.player.playTimeshift(App.player.getPlayingChannel(), time);
    };

	this.key_info = function()
	{
        App.display.showScreen('player');
	};

	this.key_pause = function()
	{
        App.display.showScreen('player');
        App.playerScreen.key_pause();
	};

	this.key_play = function()
	{
        App.display.showScreen('player');
        App.playerScreen.key_play();
	};

	this.key_stop = function()
	{
        App.display.showScreen('player');
        App.playerScreen.key_stop();
	};

	this.key_fwd = function()
	{
        App.display.showScreen('player');
        App.playerScreen.key_fwd();

	};

	this.key_rew = function()
	{
        App.display.showScreen('player');
        App.playerScreen.key_rew();
	};

    this.key_up = function(){
        App.display.showScreen('player');
    };

    this.key_down = function(){
        // ???
	};

	this.key_digit = function(digit)
	{
        this.showChannelNumberPad(digit);
	};


	this.key_ch_plus = function()
	{
        this.key_left();
	};

	this.key_ch_minus = function()
	{
        this.key_right();
	};

    this.key_right = function () {
        if (typeof this.epgList[this.selectedIndex+2] != 'undefined') {
            this.selectedIndex ++;
            this.fillPrograms(this.selectedIndex);
        }
	};

    this.key_left = function () {
        if (typeof this.epgList[this.selectedIndex-2] != 'undefined') {
            this.selectedIndex --;
            this.fillPrograms(this.selectedIndex);
        }
    };

    this.key_aspect = function()
    {
        App.display.showScreen('player');
        App.playerScreen.key_aspect();
    };

    this.key_play_pause = function()
    {
        App.display.showScreen('player');
        App.playerScreen.key_play_pause();
    };

	this.key_multiaudio = function()
	{
	    App.display.showScreen('player');
	    App.playerScreen.key_multiaudio();
	};

}
_SepgScreen = new BaseScreen();
SepgScreen.prototype = _SepgScreen;