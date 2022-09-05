﻿'use strict';

class Panel {
	constructor() {
		this.clicked = false;
		this.storageFolder = `${my_utils.packageInfo.Directories.Storage}\\`;
		this.h = 0;
		this.w = 0;
		this.showLogo = ppt.btn_mode ? false : ppt.showLogo;
		this.cachePath = `${this.storageFolder}find-&-play-cache\\`;

		ppt.get('Find & Play Dialog Box', JSON.stringify({
			w: 85,
			h: 60,
			def_w: 85,
			def_h: 60,
			page: 'display'
		}));

		if (!ppt.butCustIconFont.length) ppt.butCustIconFont = 'Segoe UI Symbol';
		ppt.sbarShow = $.value(ppt.sbarShow, 0, 2);

		this.add_loc = {
			alb: {},
			idx: 0,
			ix: 0,
			mtags: {},
			std: [],
			timestamp: 0
		}

		this.id = {
			last_pressed_coord: {
				x: -1,
				y: -1
			},
			local: $.file('C:\\check_local\\1450343922.txt')
		}

		this.image = {
			show: !ui.style.textOnly || ui.style.isBlur,
			size: 0.735
		}

		this.logo = {
			img: null
		}

		this.m = {
			x: -1,
			y: -1
		}

		this.sbar = {
			arrowPad: ppt.sbarPad,
			offset: 0,
			show: !ppt.btn_mode ? ppt.sbarShow : false,
			x: 0
		}

		this.url = {}

		this.video = {
			mode: !ui.style.textOnly && ppt.videoMode,
			show: !ui.style.textOnly && ppt.videoMode
		}

		this.youTube = {
			backUp: false,
			order: !ppt.yt_order ? 'relevance' : 'viewCount'
		}

		if (!ppt.imgArtPth) ppt.imgArtPth = `${this.cachePath}\\art_img\\$lower($cut($meta(artist,0),1))\\$meta(artist,0)`;
		ppt.vid_full_ctrl = $.value(ppt.vid_full_ctrl, 0, 1);

		ppt.lfmReleaseType = $.value(ppt.lfmReleaseType, 0, 2);
		ppt.mbReleaseType = $.clamp(ppt.mbReleaseType, 0, 4);
		if (!ppt.playlistSoftModeLimit || ppt.playlistSoftModeLimit < 1) ppt.playlistSoftModeLimit = 50;
		ppt.prefMbTracks = $.value(ppt.prefMbTracks, 1, 1);

		$.buildPth(this.storageFolder);
		$.create(this.cachePath);
		$.create(`${this.cachePath}albums\\`);
		this.clampChartDate();
		this.setUrl();
		this.setSbar();
	}

	// Methods

	addLoc(p_loc, p_pn, dj, p_alb_set, p_clear, p_noSelect) {
		p_loc = $.isArray(p_loc) ? p_loc : [p_loc];
		if (p_clear) plman.ClearPlaylistSelection(p_pn);
		const select = p_noSelect ? false : dj && !p_alb_set ? false : true;
		if (!select && !p_noSelect) this.add_loc.timestamp = Date.now();
		plman.AddLocations(p_pn, p_loc, select);
	}

	block() {
		return this.halt() || !window.IsVisible;
	}

	checkVideo() {
		if (!ui.style.textOnly && !ppt.showAlb && !panel.block() && this.video.mode) return;
		timer.clear(timer.vid);
		if (ppt.vid_full_ctrl && $.eval('%video_popup_status%') == 'visible') fb.RunMainMenuCommand('View/Visualizations/Video');
	}

	clampChartDate() {
		const today = new Date();
		const year = today.getFullYear();
		const month = $.padNumber(today.getMonth() + 1, 2);
		const day = $.padNumber(today.getDate(), 2);
		const now = parseInt([year, month, day].join(''));
		if (ppt.chartDate == 0) ppt.chartDate = now;
		else ppt.chartDate = $.clamp(ppt.chartDate, 19521114, now);
	}

	cleanPth(pth, handle) {
		pth = pth.trim().replace(/\//g, '\\').replace(/^%profile%\\?/i, $.tfEscape(fb.ProfilePath));
		pth = !handle ? $.eval(pth) : FbTitleFormat(pth).EvalWithMetadb(handle);
		if (!pth) return '';

		let UNC = pth.startsWith('\\\\');
		if (UNC) pth = pth.replace('\\\\', '');
		if (!pth.endsWith('\\')) pth += '\\';

		const c_pos = pth.indexOf(':');
		pth = pth.replace(/[/|:]/g, '-').replace(/\*/g, 'x').replace(/"/g, "''").replace(/[<>]/g, '_').replace(/\?/g, '').replace(/\\\./g, '\\_').replace(/\.+\\/, '\\').replace(/\s*\\\s*/g, '\\');
		if (c_pos < 3 && c_pos != -1) pth = this.replaceAt(pth, c_pos, ':');

		while (pth.includes('\\\\')) pth = pth.replace(/\\\\/g, '\\_\\');
		if (UNC) pth = `\\\\${pth}`;
		return pth.trim();
	}

	click(x, y, mask) {
		if (x < 0 || y < 0 || x > this.w || y > this.h) return;
		alb.load(x, y, mask);
		if (ppt.touchControl && !ppt.dblClickToggle && Math.sqrt((Math.pow(this.id.last_pressed_coord.x - x, 2) + Math.pow(this.id.last_pressed_coord.y - y, 2))) > 3 * $.scale && !ui.style.textOnly) return;
		if (txt.clickable(x, y)) {
			this.clicked = true;
			dj.toggleText(x, y);
			if (this.image.show) img.lbtn_up(x, y);
		}
	}

	displayLogo() {
		return this.showLogo && !panel.halt() && ppt.showLogo;
	}

	draw(gr) {
		if (!panel.displayLogo()) return;
		let font = ui.font.main;
		let str = 'POWERED by last.fm music discovery, musicbrainz, official charts, youtube and your own music.\nClick to continue. Middle click to not show again.';
		let textHeight2;
		
		const textHeight1 = Math.round(gr.MeasureString(str, font, 10, 0, this.w - 20, 1000, StringFormat(1, 1)).Height);
		const version = `  ${window.ScriptInfo.Name}: v${window.ScriptInfo.Version}`;
		const versionHeight = gr.CalcTextHeight(version, ui.font.small)
		const txtSp = this.h * 0.37;
		
		if (textHeight1 > txtSp) {
			str = str.replace('\n', ' ');
			textHeight2 = Math.round(gr.MeasureString(str, font, 10, 0, this.w - 20, 1000, StringFormat(1, 1)).Height);
			if (textHeight2 > txtSp) {
				font = ui.font.small;
			}
		}

		const textHeight3 = Math.round(gr.MeasureString(str, font, 10, 0, this.w - 20, 1000, StringFormat(1, 1)).Height);
		if (textHeight3 > txtSp) str = 'Click to continue. Middle click to not show again.';

		let textCol = ui.col.text;
		let textCol_h = ui.col.text_h;
		if (ppt.theme > 0) {
			textCol = ui.dui ? window.GetColourDUI(0) : window.GetColourCUI(0);
			textCol_h = ui.dui ? window.GetColourDUI(2) : window.GetColourCUI(2);
		}

		gr.SetInterpolationMode(7);
		if (this.logo.img) gr.DrawImage(this.logo.img, this.logo.x, Math.max(this.logo.y, versionHeight), this.logo.w, this.logo.h, 0, 0, this.logo.img.Width, this.logo.img.Height);
		gr.SetInterpolationMode(0);
		gr.GdiDrawText(version, ui.font.small, textCol_h, 0, 0, this.w, this.h, 0x00000800);
		gr.GdiDrawText(str, font, textCol, 10, this.h - txtSp, this.w - 20, txtSp, txt.ncc);
	}

	expired(f, exp) {
		if (!$.file(f)) return true;
		return Date.now() - $.lastModified(f) > exp;
	}

	getLogo() {
		if (!panel.displayLogo()) return;
		this.logo.img = my_utils.getImageAsset('Logo.png');
		if (!this.logo.img) return;
		let scale = this.getScale(this.logo.img, this.w * Math.min(this.h * 0.8 / this.w, 0.9), this.h * 0.66);
		this.logo.w = scale[0];
		this.logo.h = scale[1];
		this.logo.x = (this.w - this.logo.w) / 2;
		this.logo.y = this.h * 0.11 + (this.h * 0.55 - this.logo.h) / 2;
	}

	getScale(image, w, h) {
		const sc = Math.min(h / image.Height, w / image.Width);
		return [Math.round(image.Width * sc), Math.round(image.Height * sc)];
	}

	halt() {
		return this.w <= 10 || this.h <= 10 || ppt.btn_mode;
	}

	img_exp(img_folder, exp) {
		const f = img_folder + 'update.txt';
		if (!$.file(f)) return true;
		return (Date.now() - $.lastModified(f) > exp);
	}

	isRadio() {
		return fb.IsPlaying && fb.PlaybackLength <= 0;
	}

	isVideo() {
		if (!fb.IsPlaying || fb.PlaybackLength <= 0) return false;
		const fy = !$.eval('%path%', false).includes('.tags') ? $.eval('%_path_raw%', false) : $.eval('$info(@REFERENCED_FILE)', false);
		return fy.startsWith('fy+') || fy.startsWith('3dydfy:');
	}
	isYtVideo(n) {
		if (n && (!fb.IsPlaying || fb.PlaybackLength <= 0)) return false;
		return $.eval('%fy_url%', n ? false : ppt.focus).replace(/[./\\]/g, '').includes('youtubecomwatch');
	}

	logger() {
		let log = JSON.parse(ppt.ytWebCallLog);
		if (log.message === undefined || isNaN(log.message) || log.timestamps === undefined || !$.isArray(log.timestamps)) log = {
			message: 0,
			timestamps: []
		};
		let i = log.timestamps.length;
		while (i--)
			if (Date.now() - log.timestamps[i] > 86400000) log.timestamps.splice(i, 1);
		log.timestamps.push(Date.now());
		if (log.timestamps.length > 199 && Date.now() - log.message > 86400000 / 2) {
			log.message = Date.now();
			fb.ShowPopupMessage('ADVISORY\n\nThere appear to have been a lot of YouTube web searches in the last 24 hours (~200 by this instance of Find & Play).\n\nNote that YouTube may apply rate limiting per IP address per day.', 'Find & Play');
		}
		ppt.ytWebCallLog = JSON.stringify(log);
	}

	preview(tf, type) {
		switch (type) {
			case 'eval':
				return $.eval(tf);
			case 'pth':
				return this.cleanPth(tf);
		}
	}

	open(page) {
		const ok_callback = (new_ppt, type, new_dialogWindow) => {
			if (new_ppt) $.updateProp($.jsonParse(new_ppt, {}), 'value');
			if (new_dialogWindow) ppt.set('Find & Play Dialog Box', new_dialogWindow);
			if (type == 'reset') $.updateProp(ppt, 'default_value');
		}

		let dialogWindow = ppt.get('Find & Play Dialog Box');
		if (page !== undefined) {
			dialogWindow = $.jsonParse(dialogWindow);
			dialogWindow.page = page;
			dialogWindow = JSON.stringify(dialogWindow);
			ppt.set('Find & Play Dialog Box', dialogWindow);
		}
		
		if (popUpBox.isHtmlDialogSupported()) popUpBox.config(JSON.stringify(ppt), dialogWindow, ok_callback);
		else {
			popUpBox.ok = false;
			$.trace('options dialog isn\'t available with current operating system. All settings in options are available in panel properties. Common settings are on the menu.');
		}
	}

	on_size() {
		this.sbar.x = this.w - this.sbar.sp;
		this.getLogo();
	}

	replaceAt(str, pos, chr) {
		return str.substring(0, pos) + chr + str.substring(pos + 1);
	}

	setUrl() {
		this.yt = '';
		const q = n => n.split('').reverse().join('');
		if (ppt.userAPIKeyYouTube.length == 39) {
			this.yt = `&key=${ppt.userAPIKeyYouTube}`;
		} else ppt.ytDataSource = 1;
		
		ppt.userAPIKeyLastfm = ppt.userAPIKeyLastfm.trim();
		const lfm = '&api_key=' + (ppt.userAPIKeyLastfm.length == 32 ? ppt.userAPIKeyLastfm : q($.s));
		const yt = 'key=' + q($.k);
		ppt.v = ppt.userAPIKeyLastfm.length == 32 && ppt.userAPIKeyLastfm != q($.s);

		this.url.chart = `https://www.officialcharts.com/charts/singles-chart/`;
		this.url.lfm = `http://ws.audioscrobbler.com/2.0/?format=json${lfm}`;
		this.url.mb = `https://musicbrainz.org/ws/2/`;
		this.url.yt_api = `https://www.googleapis.com/youtube/v3/`;
		this.url.yt_web1 = `https://www.youtube.com/youtubei/v1/search?${yt}`;
		this.url.yt_web2 = `https://www.youtube.com/results?search_query=`;
	}

	setSbar() {
		ppt.durationTouchFlick = $.clamp($.value(ppt.durationTouchFlick, 3000, 0), 0, 5000);
		ppt.durationScroll = $.clamp($.value(ppt.durationScroll, 500, 0), 0, 5000);
		ppt.flickDistance = $.clamp(ppt.flickDistance, 0, 10);
		ppt.scrollStep = $.clamp(ppt.scrollStep, 0, 10);
		ppt.touchStep = $.clamp(ppt.touchStep, 1, 10);
		ppt.sbarType = $.value(ppt.sbarType, 0, 2);
		this.sbar.type = ppt.sbarType;
		if (this.sbar.type == 2) {
			this.theme = window.CreateThemeManager('scrollbar');
			$.gr(21, 21, false, g => {
				try {
					this.theme.SetPartAndStateID(6, 1);
					this.theme.DrawThemeBackground(g, 0, 0, 21, 50);
					for (let i = 0; i < 3; i++) {
						this.theme.SetPartAndStateID(3, i + 1);
						this.theme.DrawThemeBackground(g, 0, 0, 21, 50);
					}
					for (let i = 0; i < 3; i++) {
						this.theme.SetPartAndStateID(1, i + 1);
						this.theme.DrawThemeBackground(g, 0, 0, 21, 21);
					}
				} catch (e) {
					this.sbar.type = 1;
					ppt.sbarType = 1;
				}
			});
		}
		this.sbar.arrowPad = ppt.sbarPad;
		ppt.sbarWidth = $.clamp(ppt.sbarWidth, 0, 400);
		ppt.sbarBase_w = $.clamp(ppt.sbarBase_w, 0, 400);
		ppt.sbarButType = $.value(ppt.sbarButType, 0, 2);
		if (ppt.sbarWidth != ppt.sbarBase_w) {
			ppt.sbarArrowWidth = Math.min(ppt.sbarArrowWidth, ppt.sbarWidth, 400);
		} else {
			ppt.sbarArrowWidth = $.clamp(ppt.sbarArrowWidth, 0, 400);
			ppt.sbarWidth = $.clamp(ppt.sbarWidth, ppt.sbarArrowWidth, 400);
		}
		ppt.sbarBase_w = ppt.sbarWidth;
		this.sbar.w = ppt.sbarBase_w;
		this.sbar.but_w = ppt.sbarArrowWidth;
		let themed_w = 21;
		try {
			themed_w = utils.GetSystemMetrics(2);
		} catch (e) {}
		if (ppt.sbarWinMetrics) {
			this.sbar.w = themed_w;
			this.sbar.but_w = this.sbar.w;
		}
		if (!ppt.sbarWinMetrics && this.sbar.type == 2) this.sbar.w = Math.max(this.sbar.w, 12);
		if (!ppt.sbarShow) this.sbar.w = 0;
		this.but_h = this.sbar.w + (this.sbar.type != 2 ? 1 : 0);
		if (this.sbar.type != 2) {
			if (ppt.sbarButType || !this.sbar.type && this.sbar.but_w < Math.round(15 * $.scale)) this.sbar.but_w += 1;
			else if (this.sbar.type == 1 && this.sbar.but_w < Math.round(14 * $.scale)) this.sbar.arrowPad += 1;
		}
		ui.style.pad = this.sbar.w - this.sbar.but_w < 5 || this.sbar.type == 2 ? ui.style.l_w : 0;
		this.sbar.sp = this.sbar.w ? this.sbar.w + ui.style.pad : 0;
		this.sbar.arrowPad = $.clamp(-this.but_h / 5, this.sbar.arrowPad, this.but_h / 5);
		this.sbar.offset = [2 + this.sbar.arrowPad, Math.max(Math.floor(this.sbar.but_w * 0.2), 2) + this.sbar.arrowPad * 2, 0][this.sbar.type];
	}

	setVideo() {
		timer.clear(timer.vid);
		if (this.video.mode && this.isVideo()) {
			this.video.show = true;
			if (!ui.style.isBlur) this.image.show = false;
			if (!ppt.showAlb) timer.video();
		} else {
			this.video.show = false;
			this.image.show = true;
		}
		if ($.eval('%video_popup_status%') == 'hidden' && this.video.mode && this.isVideo()) fb.RunMainMenuCommand('View/Visualizations/Video');
		if ($.eval('%video_popup_status%') == 'visible' && (!this.video.mode || !this.isVideo())) fb.RunMainMenuCommand('View/Visualizations/Video');
	}
}