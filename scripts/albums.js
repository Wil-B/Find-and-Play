'use strict';

class Albums {
	constructor() {
		this.ar_mbid = false;
		this.ar_mbid_done = false;
		this.artist = '';
		this.chartDate = '';
		this.cur = [];
		this.dld;
		this.expanded = 0;
		this.get = true;
		this.handleList = new FbMetadbHandleList();
		this.init = true;
		this.lastItemId = '';
		this.libHandleList = new FbMetadbHandleList();
		this.playlist = [];
		this.lfmTagType = ppt.lfmTagType;
		this.limit = 5;
		this.tag = {similar: '', song: '', genre: '', mood: '', theme: '', decade: '', year: '', locale: ''};
		this.topTracksAvailable = false;
		this.v2_init = fb.Version.startsWith('2') && fb.IsLibraryEnabled();
		this.x = 25;
		this.w = 100;

		this.art = {
			cur: '',
			cur_sim: '',
			libHandleList: new FbMetadbHandleList(),
			related: [],
			relatedCustom: `${panel.storageFolder}related_artists.json`,
			relatedCustomSort: true,
			search: false,
			sim_done: false,
			similar: []
		}

		this.artists = {
			cur_m_i: 0,
			drawn: 5,
			h: 100,
			item: {
				w: 30
			},
			length: 100,
			line: {
				y: 140
			},
			list: [],
			max: {
				y: 100
			},
			m_i: -1,
			name: {
				w: 70,
				track_w: 70
			},
			row_ix: {},
			rows: 5,
			y: 140
		}

		this.extra_sbar = {
			w: panel.sbar.show ? ppt.extra_sbar_w : false
		}

		this.img = {
			x: 0,
			y: 0,
			w: 0,
			source: [],
			sp: 0
		}

		this.loaded = {
			artists: [],
			tracks: []
		}

		this.names = {
			cur_m_i: 0,
			data: [],
			done: [false, false, false, false, false, false, false],
			drawn: 10,
			h: 100,
			item: {
				w: {}
			},
			lfm_alb: {
				w: 70
			},
			lfm_chart: {
				w: 80
			},
			list: [],
			line: {
				y: 40
			},
			lfm_track: {
				w: 60
			},
			max: {
				y: 100
			},
			mb_rel: {
				w: []
			},
			m_i: -1,
			minRows: 5,
			name: {
				x: 45,
				w: 100
			},
			pc: 'Last.fm playcount',
			rows: 10,
			row_ix: {},
			y: 40,
			validPrime: false
		}

		this.row = {
			h: 25
		}

		this.sel = {
			x: 25,
			w: 100
		}

		this.statistics = {
			h: 15,
			show: (mode) => !mode || mode == 1 && !ppt.lfmMixTrack || !ppt.lfmMixTag && mode == 2 && this.lfmTagType == 1 || mode == 4 && ppt.lfmUserType == 5 || mode == 6 && ppt.mbReleaseType == 5 && ppt.lbUserType > 4,
			sortable: !ppt.mb && (!ppt.lfmReleaseType || ppt.lfmReleaseType == 1 && ppt.lfmTopTrackSpan == 6 || ppt.lfmReleaseType == 2 && !ppt.lfmMixTag)
		}

		this.type = {
			lfm: ['Top Albums', 'Top Tracks', 'Top Songs', 'Top Tracks', 'Charts: Top Tracks & Most Loved', 'Recommendations'],
			mb: [ppt.showLive ? 'All Releases' : 'Releases', 'Albums', 'Compilations', 'Singles and EPs', 'Remixes', 'Recommendations'],
			active: 0
		}

		if (ppt.btn_mode) ppt.showAlb = false;
		$.create(dj.f2 + 'r');

		ppt.verticalPad = Math.round(ppt.verticalPad);
		if (isNaN(ppt.verticalPad)) ppt.verticalPad = 0;
		ppt.verticalPad = $.clamp(ppt.verticalPad, 0, 100);

		this.setSiteDefaults();

		this.focusServer = $.debounce(() => {
			if (!plman.PlaylistItemCount(plman.ActivePlaylist)) return;
			if (ppt.showAlb) this.on_playback_new_track();
			else if (!this.artist) this.clearAlbums();
		}, 1000, {
			'leading': true,
			'trailing': true
		});

		this.metadbServer = $.debounce((on_metadb_changed) => {
			this.on_playback_new_track(on_metadb_changed);
		}, 500);

		this.chooseArtist = $.debounce((ns) => {
			this.chooseItem(ns);
		}, 1500);
		
		this.clearAlb = $.debounce(() => {
			const mode = this.getMode();
			const recheck = this.getSearchItem(mode);
			if (!recheck) { // delay to stop unwanted refresh when transiently no handle
				this.clearAlbums();
			}
		}, 1000);

		this.tagSet = $.debounce((on_metadb_changed) => {
			this.setTags(on_metadb_changed); // delay to stop unwanted refresh when transiently no handle
		}, 1000);

		this.alb_id = 0;
	}

	// Methods

	activateTooltip(value, type) {
		if (tooltip.Text == value && [this.names.m_i == this.names.cur_m_i, this.artists.m_i == this.artists.cur_m_i][type]) return;
		this.checkTooltipFont('tree');
		tooltip.Text = value;
		tooltip.Activate();
	}

	albumInLibrary(artist, album, orig_alb, mtags_alb) {
		let albumDone = true;
		const continue_confirmation = (status, confirmed) => {
			if (confirmed) {
				if (artist + ' | ' + album != 'Artist | Album') albumDone = false;
			}
		}
		const caption = artist + ' | ' + album;
		const prompt = 'This Album Exists In Library As:' + (orig_alb ? '\n\nOriginal Library Album' : '') + (orig_alb && mtags_alb ? '\n\nAND' : '') + (mtags_alb ? '\n\nAlbum Built With m-TAGS' : '') + '\n\nContinue?';
		const wsh = popUpBox.isHtmlDialogSupported() ? popUpBox.confirm(caption, prompt, 'Yes', 'No', '', '', continue_confirmation) : true;
		if (wsh) continue_confirmation('ok', $.wshPopup(prompt, caption));		
		return albumDone;
	}

	analyse(list, mode) {
		let prime, extra;
		const a = this.artist.toLowerCase();
		const q = lib.partialMatch.artist && lib.partialMatch.type[1] != 0 ? ' HAS ' : ' IS ';
		const query = q == ' IS ' ? name.field.artist + q + a : $.queryArtist(a);
		this.art.libHandleList = $.query(lib.getLibItems(), query);
		this.art.plHandleList = $.query(lib.db.cache, 'artist IS ' + a);
		this.art.libHandleList.OrderByFormat(tf.albumSortOrder, 1);
		this.art.plHandleList.OrderByFormat(tf.albumSortOrder, 1);

		if (mode == 6) {
			if (ppt.mbReleaseType < 5) {
				if (!this.names.data.length) return this.names.validPrime = false;
				this.names.mb[ppt.mbReleaseType] = [];
				this.names.data.forEach(v => {
					prime = v['primary-type'];
					extra = v['secondary-types'].join('').toLowerCase();
					if (!this.names.validPrime) this.names.validPrime = prime ? true : false;
					const comp = extra.includes('compilation');
					const live = extra.includes('live');
					const primary = prime == 'Album' || prime == 'EP' || prime == 'Single';
					const remix = extra.includes('remix');
					let filter, type;
					switch (ppt.mbReleaseType) {
						case 0:
							filter = ppt.showLive ? (live || primary) : primary && !live;
							break;
						case 1:
							filter = prime == 'Album' && !live && !comp && !remix;
							break;
						case 2:
							filter = comp && !live && !remix;
							break;
						case 3:
							filter = (prime == 'EP' || prime == 'Single') && !live && !comp && !remix;
							break;
						case 4:
							filter = primary && remix;
							break;
					}
					if (filter) {
						switch (true) {
							case remix:
								type = 'Remix ' + prime;
								break;
							case comp:
								type = 'Compilation';
								break;
							case live:
								type = 'Live' + (prime ? (' ' + prime) : '');
								break;
							default:
								type = prime;
								break;
						}
					} else if (ppt.showLive && !ppt.mbReleaseType) {
						type = 'Other';
						filter = true;
					}

					if (filter) {
						this.names.mb[ppt.mbReleaseType].push({
							date: v['first-release-date'].substring(0, 4),
							name: v.title.replace(/’/g, "'"),
							artist: this.artist,
							title: v.title.replace(/’/g, "'").toLowerCase(),
							releaseType: type,
							rg_mbid: v.id,
							prime: prime,
							extra: extra,
							type: ppt.mbReleaseType,
							id: this.artist,
							alb_id: ++this.alb_id
						});
					}
				});
				this.names.mb[ppt.mbReleaseType].forEach((v, i) => this.getSource(v, i));
				this.mbSort();
				this.setNames(this.names.mb[ppt.mbReleaseType]);
			} else {
				this.names.mb[this.lbType() + ppt.lbUserMix] = list.map((v, i) => ({
					name: v.artist + ' - ' + v.title,
					artist: v.artist,
					title: v.title.replace(/’/g, "'"),
					releaseType: 'Single',
					playcount: v.playcount || '',
					rank: i,
					type: this.lbType(),
					id: this.lbType() + ppt.lbUserMix,
					alb_id: ++this.alb_id
				}));
				const artists = $.getArtists(this.names.mb[this.lbType() + ppt.lbUserMix], q, true);
				this.names.mb[this.lbType() + ppt.lbUserMix].forEach((v, i) => this.getSource(v, i, artists.libHandles, artists.plHandles));
				this.setNames(this.names.mb[this.lbType() + ppt.lbUserMix]);
				this.names.list.forEach(v => v.playcount = this.numFormat(v.playcount));
				
			}
		} else if (list.length) {
			switch (mode) {
				case 0:
					this.names.lfm.album = list.map((v, i) => ({
						name: v.name,
						artist: this.artist,
						title: v.name.toLowerCase(),
						releaseType: 'Album',
						rg_mbid: v.mbid,
						playcount: v.playcount,
						rank: i,
						type: 'album',
						id: this.artist,
						alb_id: ++this.alb_id
					}));
					this.names.lfm.album.forEach((v, i) => this.getSource(v, i));
					break;
				case 1:
					this.names.lfm[this.curTrackSpan()] = list.map((v, i) => ({
						name: v.title,
						artist: this.artist,
						title: v.title,
						releaseType: 'Single',
						playcount: v.playcount,
						rank: i,
						type: 'track',
						id: this.artist + this.curTrackSpan(),
						length: v.length,
						vid: v.vid,
						thumbnail: v.thumbnail,
						alb_id: ++this.alb_id
					}));
					this.names.lfm[this.curTrackSpan()].forEach((v, i) => this.getSource(v, i));
					break;
				case 2: {
					this.names.lfm[this.curTag() + ppt.lfmMixTag] = list.map((v, i) => ({
						name: v.artist + ' - ' + v.title,
						artist: v.artist,
						title: v.title,
						releaseType: 'Single',
						playcount: v.playcount || '', 
						rank: i,
						type: this.curTag(),
						id: this.tag[this.curTag()],
						length: v.length,
						vid: v.vid,
						thumbnail: v.thumbnail,
						alb_id: ++this.alb_id
					}));
					const artists = $.getArtists(this.names.lfm[this.curTag() + ppt.lfmMixTag], q, true);
					this.names.lfm[this.curTag() + ppt.lfmMixTag].forEach((v, i) => this.getSource(v, i, artists.libHandles, artists.plHandles));
					break;
				}
				case 3: {
					this.names.lfm.chart = list.map((v, i) => ({
						name: v.artist + ' - ' + v.title,
						artist: v.artist,
						title: v.title,
						releaseType: 'Single',
						rank: i,
						track: i < 20 ? '#' : '\u2665',
						type: 'chart',
						id: 'chart',
						length: v.length,
						vid: v.vid,
						thumbnail: v.thumbnail,
						alb_id: ++this.alb_id
					}));
					const artists = $.getArtists(this.names.lfm.chart, q, true);
					this.names.lfm.chart.forEach((v, i) => this.getSource(v, i, artists.libHandles, artists.plHandles));
					break;
				}
				case 4: {
					this.names.lfm[this.userType()] = list.map((v, i) => ({
						name: v.artist + ' - ' + v.title,
						artist: v.artist,
						title: v.title,
						releaseType: 'Single',
						playcount: v.playcount || '',
						rank: i,
						type: this.userType(),
						id: this.userType(),
						length: v.length,
						vid: v.vid,
						thumbnail: v.thumbnail,
						alb_id: ++this.alb_id
					}));
					const artists = $.getArtists(this.names.lfm[this.userType()], q, true);
					this.names.lfm[this.userType()].forEach((v, i) => this.getSource(v, i, artists.libHandles, artists.plHandles));
					break;
				}
				case 5: {
					this.names.chart = list.map((v, i) => ({
						name: v.artist + ' - ' + v.title.replace(/\{(19|20)\d{2}}/, '').trim(),
						artist: v.artist,
						title: v.title.replace(/\{(19|20)\d{2}}/, '').trim(),
						releaseType: 'Single',
						rank: i,
						type: 'officialChart',
						id: list[0].date ? `${list[0].date}` : '',
						alb_id: ++this.alb_id
					}));
					const artists = $.getArtists(this.names.chart, q, true);
					this.names.chart.forEach((v, i) => this.getSource(v, i, artists.libHandles, artists.plHandles));
					this.chartDate = list[0].date ? `${list[0].date}` : '';
					search.setText();
					break;
				}
			}
			const li = mode < 5 ? this.names.lfm[this.lfmType(mode)] : this.names.chart;
			
			if (li.length) {
				this.setNames(ppt.lfmSortPC && this.statistics.sortable ? $.sort(li, 'playcount', 'numRev') : li);
				if (this.statistics.show(mode)) this.names.list.forEach(v => v.playcount = this.numFormat(v.playcount));
			} else this.names.list = [];
		} else this.names.list = [];
	}

	butTooltipFont() {
		return ['Segoe UI', 15 * $.scale * ppt.zoomTooltip / 100, 0];
	}

	calcRows(noResetAlb) {
		if (!ppt.showArtists && !this.expanded) this.artists.list = [];
		let ln_sp = 0;
		let tot_r = 0;
		search.y = ppt.bor * 0.625 + 19 * but.scale;
		ln_sp = this.row.h * 0.2;

		this.names.line.y = search.y + this.row.h + ln_sp;
		this.names.y = this.names.line.y + ln_sp; // temp values with min allowed ln_sp

		const sp1 = panel.h - search.y - this.row.h - (ppt.autoLayout ? Math.max(this.row.h, ppt.bor) : 1);
		const sp2 = sp1 - ln_sp * (ppt.showArtists ? 5 : 3);
		tot_r = Math.floor(sp2 / this.row.h);
		ln_sp = (sp1 - tot_r * this.row.h) / (ppt.showArtists ? 5 : 3);
		search.y = search.y + ln_sp;

		this.names.line.y = search.y + this.row.h + ln_sp;
		this.names.y = this.names.line.y + ln_sp; // recalc

		this.artists.rows = this.expanded ? Math.floor(tot_r / 2) : ppt.showArtists ? tot_r > 8 ? Math.max(Math.round(tot_r / 3), 5) : Math.floor(tot_r / 2) : 0;
		this.names.rows = tot_r - this.artists.rows;
		this.artists.h = this.artists.rows * this.row.h;
		this.names.h = this.names.rows * this.row.h;

		this.artists.line.y = Math.round(this.names.y + this.names.h + ln_sp);
		this.artists.y = this.artists.line.y + ln_sp;
		const top_corr = [panel.sbar.offset - (panel.but_h - panel.sbar.but_w) / 2, panel.sbar.offset, 0][panel.sbar.type];
		const bot_corr = [(panel.but_h - panel.sbar.but_w) - panel.sbar.offset * 2, -panel.sbar.offset, 0][panel.sbar.type];

		let sbar_alb_y = this.names.y + top_corr;
		let sbar_art_y = this.artists.y + top_corr;
		let sbar_alb_h = this.names.h + bot_corr;
		let sbar_art_h = this.artists.h + bot_corr;
		if (panel.sbar.type == 2) {
			sbar_alb_y += 1;
			sbar_art_y += 1;
			sbar_alb_h -= 2;
			sbar_art_h -= 2;
		}

		this.names.max.y = this.names.y + this.names.h - this.row.h * 0.9;
		this.artists.max.y = this.artists.h + this.artists.y - this.row.h * 0.9;
		this.names.minRows = tot_r - Math.floor(tot_r / 2);

		alb_scrollbar.metrics(panel.sbar.x, sbar_alb_y, panel.sbar.w, sbar_alb_h, this.names.rows, this.row.h, this.names.y, this.names.h);
		art_scrollbar.metrics(panel.sbar.x, sbar_art_y, panel.sbar.w, sbar_art_h, this.artists.rows, this.row.h, this.artists.y, this.artists.h);
		art_scrollbar.reset();
		art_scrollbar.setRows(this.artists.list.length);
		if (!noResetAlb) alb_scrollbar.reset();
		alb_scrollbar.setRows(this.names.list.length);
		but.refresh(true);
	}

	calcRowsArtists() {
		art_scrollbar.reset();
		art_scrollbar.setRows(this.artists.list.length);
	}

	calcRowsNames() {
		alb_scrollbar.reset();
		alb_scrollbar.setRows(this.names.list.length);
	}

	calcText() {
		if (!panel.w || !panel.h) return;
		const rel_name = ['Remix Album  ', 'Album ', 'Compilation ', 'Single ', 'Remix Album ',
		this.lbDisplay()
		
		];
		this.names.pc = !ppt.mb ? ppt.lfmReleaseType == 1 && ppt.lfmTopTrackSpan < 6 ? ui.font.main.Size / ui.font.playCount.Size > 2 ? 'Last.fm listeners ' : 'Last.fm listeners' :  ui.font.main.Size / ui.font.playCount.Size > 2 ? 'Last.fm playcount ' : 'Last.fm playcount' : ppt.mb == 1 && ppt.mbReleaseType == 5 && ppt.lbUserType > 2 ? 'ListenBrainz listens' : '';
		const sp_arr = ['0000  ', '  ', '00', ppt.lfmReleaseType != 3 ? ' 10,000,000' : '10', ' Score', `   ${this.names.pc}`, ppt.showSource ? '   Pos' : ''];
		let h;
		this.row.h = 0;
		ppt.bor = Math.max(ppt.bor, 0);
		this.x = panel.sbar.show && !this.extra_sbar.w ? Math.max(panel.sbar.sp + 10 * $.scale, ppt.bor) : Math.max([0, ui.sideMarker_w + ui.style.l_w * 2, 0, ui.style.l_w * 2][ppt.highLightRow], ppt.bor);
		$.gr(1, 1, false, g => {
			for (let j = 0; j < 2; j++) {
				h = g.CalcTextHeight('String', !j ? ui.font.main : ui.font.playCount);
				!j ? this.row.h = h + ppt.verticalPad : this.statistics.h = h;
			}
			['date', 'sp', 'rank', 'playcount', 'score', 'lfm', 'chart'].forEach((v, i) => this.names.item.w[v] = g.CalcTextWidth(sp_arr[i], i == 2 ? ui.font.small : i == 4 ? ui.font.head : i == 5 || i == 6 ? ui.font.playCount : ui.font.main));
			const getWidth = v => g.CalcTextWidth(v, ui.font.main);
			this.names.item.w.pos = this.names.item.w.rank + this.names.item.w.sp;
			this.type.lfm = ['Top Albums', ppt.lfmMixTrack ? 'Last.fm Mix' : 'Top Tracks' +  [' Last 7 Days', ' Last 30 Days', ' Last 90 Days', ' Last 180 Days', ' Last 365 Days', ' All Time', ' All Time'][ppt.lfmTopTrackSpan], !this.lfmTagType ? 'Last.fm Mix: Similar Artists: Seed' : this.lfmTagType == 1 ? (ppt.lfmMixTag ? 'Last.fm Mix: Sounds Like' : 'Top Songs Sounds Like') : (ppt.lfmMixTag ? 'Last.fm Mix' : 'Top Tracks'), 'Charts: Top Tracks & Most Loved', this.userDisplay()],
			this.type.mb[5] = this.lbDisplay();
			search.lfm_rel.w = this.type.lfm.map(getWidth);
			search.chart_rel_w = g.CalcTextWidth('Singles Chart', ui.font.main);
			search.mb_rel.w = this.type.mb.map(getWidth);
			this.names.mb_rel.w = rel_name.map(getWidth);
			this.statistics.sortable = !ppt.mb && (!ppt.lfmReleaseType || ppt.lfmReleaseType == 1 && ppt.lfmTopTrackSpan == 6 || ppt.lfmReleaseType == 2 && !ppt.lfmMixTag);
			this.fontawesome = gdi.Font('FontAwesome', ui.font.main.Size, 0);
			this.icon_w = g.CalcTextWidth('\uF105  ', this.fontawesome);
			this.fontAwe = gdi.Font('FontAwesome', Math.max(Math.round(this.row.h * 0.4), 9), 0);
			this.fontSeg6 = gdi.Font('Segoe UI Symbol', Math.max(Math.round((ui.font.main.Size * 0.6), 11)), 0);
			this.fontSeg8 = gdi.Font('Segoe UI Symbol', Math.max(Math.round((ui.font.main.Size * 0.8), 11)), 0);
			this.ft = [this.fontAwe, this.fontAwe, this.fontSeg6, this.fontSeg8, this.fontAwe];
			this.icon = ['\uF05E', '\uF144\uF202', '\uE142', '\u266B', '\uF05E'];
			this.icon_h = this.icon.map((v, i) => {return Math.ceil(g.MeasureString(v, this.ft[i], 0, 0, panel.w, this.row.h).Height) + (i < 2 || i == 4 ? 1 : 0)});
			this.icon_y = this.icon_h.map((v, i) => [(this.row.h - v) / 1.7, (this.row.h - v) / 1.7, (this.row.h - v) / 1.35, (this.row.h - v) / 2, (this.row.h - v) / 1.7][i]);
		});

		this.w = panel.w - this.x * 2 - (!this.extra_sbar.w ? 0 : panel.sbar.sp);
		search.w1 = this.w - this.row.h * 0.75;
		this.img.w = ppt.showSource ? Math.max(Math.round(this.row.h * 0.4), 10) : 0;
		this.img.sp = ppt.showSource ? this.img.w + this.names.item.w.sp : 0;
		this.artists.name.w = ppt.showSimilar ? this.w - this.names.item.w.score - this.names.item.w.sp : this.w * 2 / 3 - this.names.item.w.sp;
		this.artists.name.track_w = this.w - this.names.item.w.pos;
		this.artists.item.w = ppt.showSimilar ? this.names.item.w.score : this.w / 3;
		this.names.lfm_track.w = this.w - this.names.item.w.sp - (this.statistics.show(this.getMode()) || ppt.lfmReleaseType == 3 ? this.names.item.w.playcount : 0) - this.img.sp;
		this.names.lfm_chart.w = this.w - this.names.item.w.sp - this.img.sp;
		this.names.name.x = this.x + this.img.sp;
		this.names.name.w = this.siteNameWidth();
		search.metrics();
		this.createImages();
	}

	check_tooltip(ix, x, y) {
		const type = y < art_scrollbar.item_y ? 0 : 1;
		if (this.lbtnDn || [alb_scrollbar.draw_timer, art_scrollbar.draw_timer][type]) return;
		const item = [this.names.list[ix], this.artists.list[ix]][type];
		if (!item) return;
		const drawExpand = [this.isAlbum(), false][type];
		const trace1 = (type == 0 || alb.expanded && ix) && x > this.x + (drawExpand ? this.icon_w : 0) && x < this.names.name.x + (drawExpand ? this.icon_w : 0) && ppt.showSource;
		const trace2 = item.tt && item.tt.needed && x >= item.tt.x && x <= item.tt.x + item.tt.w && y >= item.tt.y && y <= item.tt.y + this.row.h;
		const text = trace1 ? this.tipText(item, type) : trace2 ? item.name : '';
		if (text != tooltip.Text && !(trace1 || trace2)) {
			this.deactivateTooltip();
			return;
		}
		this.activateTooltip(text, type);
		timer.tooltip();
	}

	checkLfmTagType() {
		if (ppt.lfmTagType > 1/*disallow fallback to songs*/ && this.tag[this.defTag()] == 'N/A') {
			const arr = ['similar', 'song', 'genre', 'mood', 'theme', 'decade', 'year', 'locale'];
			this.lfmTagType = -1;
			for (let i = ppt.lfmTagType; i >= 0; --i) {
				if (this.tag[arr[i]] != 'N/A' && i !== 1) {
					this.lfmTagType = i;
					break;
				}
			}
			if (this.lfmTagType == -1) {
				for (let i = ppt.lfmTagType; i < arr.length; i++) {
					if (this.tag[arr[i]] != 'N/A' && i !== 1) {
						this.lfmTagType = i;
						break;
					}
				}
			}
			if (this.lfmTagType == -1) this.lfmTagType = ppt.lfmTagType;
			this.calcText();
			but.refresh(true);
		} else if (this.lfmTagType != ppt.lfmTagType) {
			this.lfmTagType = ppt.lfmTagType
			this.calcText();
			but.refresh(true);
		}
	}

	checkTooltip(item, x, y, txt_w, w) {
		item.tt = {
			needed: txt_w > w,
			x: x,
			y: y,
			w: w
		}
	}

	checkTooltipFont(type) {
		switch (type) {
			case 'btn': {
				const newTooltipFont = this.butTooltipFont();
				if ($.equal(this.cur, newTooltipFont)) return;
				this.cur = newTooltipFont;
				break;
			}
			case 'tree': {
				const newTooltipFont = this.treeTooltipFont();
				if ($.equal(this.cur, newTooltipFont)) return;
				this.cur = newTooltipFont;
				break;
			}
		}
		tooltip.SetFont(this.cur[0], this.cur[1], this.cur[2]);
	}

	checkTrackSources() {
		if (this.expanded) {
			this.names.list.some(v => {
				if (v.expanded) {
					if (v.source == 3) {
						if (v.handleList.Count) {
							this.artists.list = [];
							v.handleList.Convert().forEach(h => {
								this.artists.list.push({
									artist: v.artist,
									name: tf.title0.EvalWithMetadb(h),
									album: v.name.replace(/^(x |> |>> )/, ''),
									date: v.date,
									handleList: new FbMetadbHandleList([h]),
									source: 3
								});
							});
							if (this.artists.list.length) this.artists.list.unshift({
								name: v.artist + ' - ' + v.name.replace(/^(x |> |>> )/, '')
							});
							else this.artists.list[0] = {
								name: v.artist + ' - ' + v.name.replace(/^(x |> |>> )/, '') + ': ' + 'Nothing Found'
							}
							this.calcRowsArtists();
						}
						return true;
					}
				}
			});
		}
		this.artists.list.forEach((v, i) => {
			if (v.source == 1 || v.source == 2) {
				let handleList = lib.inPlaylist(v.artist, v.name.replace(/^(x |> |>> )/, ''), i, true, false, true);
				handleList = $.query(handleList, 'album IS ' + v.album.toLowerCase());
				v.handleList = handleList;
				v.source = handleList.Count ? 2 : 1;
			}
		});
		txt.paint();
	}

	changeTrackSource() {
		if (this.expanded) {
			this.names.list.some((v, i) => {
				if (v.expanded) {
					this.getTracks('track' + v.alb_id, i, false, false, false, true);
					return true;
				}
			});
		}
	}

	chooseItem(ns) {
		if (ppt.mb == 2) return;
			if (!ns) return;
			ns = $.titlecase(ns.replace(/&&/g, '&')); 
			ns = ns.trim();
			this.calcText();
			search.setText(ns);
			this.art.search = true;
			if (!this.tagMode()) this.tag.similar = this.artist = !this.songsMode() ? ns : ns.split('|')[0].trim();
			if (this.tagMode()) {
				this.tag[this.curTag()] = ns;
				this.artist = this.tag.similar
			}
			if (ppt.lock) {
				ppt.lockArtist = this.artist;
				ppt.lockDecade = this.tag.decade;
				ppt.lockGenre = this.tag.genre;
				ppt.lockLocale = this.tag.locale;
				ppt.lockMood = this.tag.mood;
				ppt.lockSong = this.tag.song;
				ppt.lockTheme = this.tag.theme;
				ppt.lockYear = this.tag.year;
			}
			if (ppt.showAlb) this.searchForAlbumNames(0, [ppt.lfmReleaseType, 6, 5][ppt.mb], ns);
	}

	clearAlbums() {
		this.names.list = [];
		this.handleList = new FbMetadbHandleList();
		this.libHandleList = new FbMetadbHandleList();
		this.setSiteDefaults();
		this.names.data = [];
		search.text = '';
		this.art.related = [];
		this.art.similar = [];
		this.art.cur_sim = '';
		this.artists.list = [];
		this.ar_mbid_done = this.ar_mbid = false;
		this.names.validPrime = false;
		this.calcRows();
		filter.text = '';
		if (ppt.showAlb) txt.paint();
	}

	clearIcon() {
		for (let i = 0; i < 4; i++) this.names.mb[i].forEach(v => v.expanded = '');
		this.names.lfm.album.forEach(v => v.expanded = '');
		this.names.list.forEach(v => v.expanded = '');
	}

	createImages() {
		if (!ppt.showSource || ppt.showSource == 4) return;
		const lightBg = ui.blur.dark ? false : ui.blur.light ? true : ui.isLightCol(ui.col.bg == 0 ? 0xff000000 : ui.col.bg);
		this.img.source = [
			ppt.showSource == 3 ? (lightBg ? 'Not available dark.png' : 'Not available light.png') : 'Not available.png',
			['', 'Source red.png', 'Source green.png', 'Source neutral.png'][ppt.showSource],
			ppt.showSource == 3 ? (lightBg ? 'Cache neutral [dark].png' : 'Cache neutral [light].png') : (lightBg ? 'Cache dark.png' : 'Cache light.png'),
			ppt.showSource == 3 ? 'Library neutral.png' : 'Library.png'
		]
		.map(v => my_utils.getImageAsset(v).Resize(this.img.w, this.img.w, 7));

		this.img.sourceLfm = [
			ppt.showSource == 3 ? (lightBg ? 'Not available dark.png' : 'Not available light.png') : 'Not available.png',
			['', 'Source green.png', 'Source red.png', 'Source green.png'][ppt.showSource],
			ppt.showSource == 3 ? (lightBg ? 'Cache neutral [dark].png' : 'Cache neutral [light].png') : (lightBg ? 'Cache dark.png' : 'Cache light.png'),
			ppt.showSource == 3 ? 'Library neutral.png' : 'Library.png'
		]
		.map(v => my_utils.getImageAsset(v).Resize(this.img.w, this.img.w, 7));

		this.img.y = Math.round((this.row.h - this.img.w) / 2);
		this.img.source[4] = this.img.source[0];
	}

	curTag() {
		return ['similar', 'song', 'genre', 'mood', 'theme', 'decade', 'year', 'locale'][this.lfmTagType];
	}

	curTrackSpan() {
		return ppt.lfmMixTrack ? 'mix' : ['7days', '30days', '90days', '180days', '365days', 'alltime', 'alltimeAPI'][ppt.lfmTopTrackSpan];
	}

	deactivateTooltip() {
		if (!tooltip.Text || but.trace) return;
		tooltip.Text = '';
		but.tooltip.delay = false;
		tooltip.Deactivate();
	}

	defTag() {
		return ['similar', 'song', 'genre', 'mood', 'theme', 'decade', 'year', 'locale'][ppt.lfmTagType];
	}

	do_youtube_search(p_alb_id, p_artist, p_title, p_date, p_add, p_mTags) {
		if (!p_add) pl.clear(pl.selection());
		const yt = new YoutubeSearch(() => yt.onStateChange(), this.on_youtube_search_done.bind(this));
		yt.search(p_alb_id, p_artist, p_title, '', '', '', p_mTags ? '' : '&fb2k_album=' + encodeURIComponent(p_title) + (p_date ? ('&fb2k_date=' + encodeURIComponent(p_date)) : ''), '', true, '', '', p_title, p_date, p_mTags);
	}

	do_youtube_track_search(p_alb_id, p_artist, p_title, p_ix, p_album, p_date, p_add) {
		if (!p_add) pl.clear(pl.selection());
		const yt = new YoutubeSearch(() => yt.onStateChange(), this.on_youtube_track_search_done.bind(this));
		yt.search(p_alb_id, p_artist, p_title, p_ix, '', '', 'fb2k_tracknumber=' + p_ix + '&fb2k_album=' + encodeURIComponent(p_album) + (p_date ? ('&fb2k_date=' + encodeURIComponent(p_date)) : ''), '', '', '', '', p_album, p_date);
	}

	done(new_artist, mode) {
		const newItem = [new_artist, new_artist + this.curTrackSpan(), this.tag[this.curTag()], 'chart', this.userType(), this.chartDate, ppt.mbReleaseType < 5 ? new_artist : this.lbType() + ppt.lbUserMix][mode];
		let curMb = 'Unknown';
		if (mode == 6) {
			if (ppt.mbReleaseType < 5) {
				for (let i = 0; i < 5; i++) {
					const prop = $.getProp(this.names.mb, `${i}.0.id`, '');
					if (prop) {
						curMb = prop;
						break;
					}
				}
			} else curMb = $.getProp(this.names.mb, `${this.lbType() + ppt.lbUserMix}.0.id`, 'N/A');
		}
		const existingItem = mode < 5 ? $.getProp(this.names.lfm, `${this.lfmType(mode)}.0.id`, 'N/A') : mode == 5 ? $.getProp(this.names.chart, `0.id`, 'N/A') : curMb;
		return newItem == existingItem;
	}

	draw(gr) {
		if (panel.halt()) return;
		this.getAlbumsFallback();
		const drawExpand = this.isAlbum();
		let b = 0;
		let f = 0;
		let i = 0;
		let rank_w = ppt.mb == 1 && ppt.mbReleaseType != 5 || !ppt.showSource ? 0 : this.names.item.w.pos;
		let row_y = 0;
		let txt_col, x = this.names.name.x;
		let w1 = this.names.name.w - rank_w - (drawExpand ? this.icon_w : 0);
		let w2 = this.w - rank_w - this.img.sp;

		const statisticsShow = this.statistics.show(this.getMode());
		if (statisticsShow) gr.GdiDrawText(this.names.pc, ui.font.playCount, ui.col.head, this.x, Math.round(this.names.line.y - ui.font.playCount.Size + 1), this.w - rank_w, this.statistics.h, txt.r);
		if (ppt.mb != 1 || ppt.mbReleaseType == 5) gr.GdiDrawText(ppt.showSource ? 'Pos' : '', ui.font.playCount, ui.col.head, this.x, Math.round(this.names.line.y - ui.font.playCount.Size + 1), this.w, this.statistics.h, txt.r);

		this.names.drawn = 0;
		if (this.names.list.length) {
			b = Math.max(Math.round(alb_scrollbar.delta / this.row.h + 0.4), 0);
			f = Math.min(b + this.names.rows, this.names.list.length);
			for (i = b; i < f; i++) {
				row_y = i * this.row.h + this.names.y - alb_scrollbar.delta;
				if (row_y < this.names.max.y) {
					this.names.drawn++;
					if (this.names.list[i].name.startsWith('>>') && ui.col.bgSel != 0) {
						gr.FillSolidRect(this.sel.x, row_y, this.sel.w, this.row.h, ui.col.bgSel);
						gr.DrawRect(this.sel.x + Math.floor(ui.style.l_w / 2), row_y, this.sel.w, this.row.h, ui.style.l_w, ui.col.bgSelframe);
					}
					if (ppt.rowStripes) {
						if (i % 2 == 0) gr.FillSolidRect(this.sel.x, row_y + 1, this.sel.w, this.row.h - 2, ui.col.bg1);
						else gr.FillSolidRect(this.sel.x, row_y, this.sel.w, this.row.h, ui.col.bg2);
					}
				}
			}
			for (i = b; i < f; i++) {
				row_y = Math.round(i * this.row.h + this.names.y - alb_scrollbar.delta);
				if (row_y < this.names.max.y) {
					const item = this.names.list[i];
					const itemSel = item.name.startsWith('>>');
					const node_col = itemSel ? ui.col.textSel : this.names.m_i == i ? ui.col.text_h : ui.col.node_c;
					txt_col = itemSel ? ui.col.textSel : this.names.m_i == i && ppt.highLightText ? ui.col.text_h : ui.col.text;
					if (this.names.m_i == i) {
						if (ppt.highLightRow == 3) {
							gr.FillSolidRect(this.sel.x, row_y, this.sel.w, this.row.h, ui.col.bg_h);
							gr.DrawRect(this.sel.x + Math.floor(ui.style.l_w / 2), row_y, this.sel.w - ui.style.l_w, this.row.h, ui.style.l_w, ui.col.frame);
						}
						if (ppt.highLightRow == 2) gr.FillSolidRect(this.sel.x, row_y, this.sel.w + 1, this.row.h + (!itemSel ? 0 : 1), !itemSel ? ui.col.bg_h : ui.col.bgSel_h);
						if (ppt.highLightRow == 1) gr.FillSolidRect(ui.style.l_w, row_y, ui.sideMarker_w, this.row.h, ui.col.sideMarker);
					}
					gr.SetTextRenderingHint(5);
					if (item.expanded) {
						gr.DrawString(item.expanded, this.fontawesome, this.names.m_i == i ? ui.col.text_h : ui.col.node_e, this.x - this.icon_w * 0.2, row_y, w1, this.row.h, StringFormat(0, 1));
						gr.DrawString(item.expanded, this.fontawesome, this.names.m_i == i ? ui.col.text_h : ui.col.node_e, this.x - this.icon_w * 0.2, row_y + 1, w1, this.row.h, StringFormat(0, 1));
					} else if (drawExpand) {
						gr.DrawString('\uF105  ', this.fontawesome, node_col, this.x, row_y, w1, this.row.h, StringFormat(0, 1));
						if (!ppt.nodeStyle) gr.DrawString('\uF105  ', this.fontawesome, node_col, this.x + 1, row_y, w1, this.row.h, StringFormat(0, 1));
					}
					if (ppt.showSource) {
						if (ppt.showSource != 4) {
							const im = !item.vid || !ppt.showYouTubeLinkSource ? this.img.source[item.source] : this.img.sourceLfm[item.source];
							if (im) gr.DrawImage(im, this.x + (drawExpand ? this.icon_w : 0), row_y + this.img.y, im.Width, im.Height, 0, 0, im.Width, im.Height);
						} else {
							gr.GdiDrawText(['\uF05E', !item.vid || !ppt.showYouTubeLinkSource ? '\uF144' : '\uF202', '\uE142', '\u266B', '\uF05E'][item.source], this.ft[item.source], txt_col, this.x + [1, 1, -1, 0, 1][item.source] + (drawExpand ? this.icon_w : 0), row_y + this.icon_y[item.source], x - this.x, this.icon_h[item.source]);
						}
					}
					const nm = !ppt.showSource && !this.isAlbum() ? `${(i < 9 ? '0' : '') + (i + 1)}  ${item.name}` : item.name;
					const name_w = gr.CalcTextWidth(nm, ui.font.main);
					gr.GdiDrawText(nm, ui.font.main, txt_col, x + (drawExpand ? this.icon_w : 0), row_y, w1, this.row.h, txt.l);
					this.checkTooltip(item, x + (drawExpand ? this.icon_w : 0), row_y, name_w, w1);
					if (statisticsShow) gr.GdiDrawText(item.playcount, ui.font.main, txt_col, x + this.names.lfm_track.w - rank_w + this.names.item.w.sp, row_y, this.names.item.w.playcount, this.row.h, txt.r);
					if (ppt.mb == 1) {
						if (ppt.mbReleaseType != 5) {
							gr.GdiDrawText(item.releaseType, ui.font.main, txt_col, x + rank_w, row_y, w2 - this.names.item.w.date, this.row.h, txt.r);
							gr.GdiDrawText(item.date, ui.font.main, txt_col, x, row_y, w2, this.row.h, txt.r);
						} else {
							if (ppt.showSource) gr.GdiDrawText(i + 1, ui.font.small, ui.col.count, this.x + this.w - rank_w, row_y, rank_w, this.row.h, txt.r);
						}
					} else {
						if (ppt.mb != 2 && ppt.lfmReleaseType == 3) gr.GdiDrawText(item.track, ui.font.loved, txt_col, x + this.names.lfm_track.w - rank_w + this.names.item.w.sp, row_y, this.names.item.w.playcount, this.row.h, txt.r);
						const ix = ppt.lfmReleaseType == 3 && i > 19 ? i - 20 : i;
						if (ppt.showSource) gr.GdiDrawText(ix + 1, ui.font.small, ui.col.count, this.x + this.w - rank_w, row_y, rank_w, this.row.h, txt.r);
					}
				}
			}
		} else gr.GdiDrawText(this.itemRecognised(), ui.font.main, ui.col.text, this.x, Math.round(this.names.y), this.w, this.row.h * 2, txt.lm);
		if (panel.sbar.show && alb_scrollbar.scrollable_lines > 0) alb_scrollbar.draw(gr);
		this.artists.drawn = 0;
		if (this.artists.rows && this.artists.list.length) {
			b = Math.max(Math.round(art_scrollbar.delta / this.row.h + 0.4), 0);
			f = Math.min(b + this.artists.rows, this.artists.list.length);
			for (i = b; i < f; i++) {
				row_y = i * this.row.h + this.artists.y - art_scrollbar.delta;
				if (row_y < this.artists.max.y) {
					const item = this.artists.list[i];
					if (!item) return;
					if (item.name.startsWith('>>') && ui.col.bgSel != 0) {
						gr.FillSolidRect(this.sel.x, row_y, this.sel.w, this.row.h, ui.col.bgSel);
						gr.DrawRect(this.sel.x + Math.floor(ui.style.l_w / 2), row_y, this.sel.w, this.row.h, ui.style.l_w, ui.col.bgSelframe);
					}
					if (ppt.rowStripes) {
						if (i % 2 == 0) gr.FillSolidRect(this.sel.x, row_y + 1, this.sel.w, this.row.h - 2, ui.col.bg1);
						else gr.FillSolidRect(this.sel.x, row_y, this.sel.w, this.row.h, ui.col.bg2);
					}
				}
			}
			for (i = b; i < f; i++) {
				row_y = Math.round(i * this.row.h + this.artists.y - art_scrollbar.delta);
				if (row_y < this.artists.max.y) {
					this.artists.drawn++;
					const item = this.artists.list[i];
					if (!item) return;
					const font = i == 0 ? ui.font.head : ui.font.main;
					const itemSel = item.name.startsWith('>>');
					const hoverEffect = this.artists.m_i == i && (!this.expanded || i);
					txt_col = itemSel ? ui.col.textSel : hoverEffect && ppt.highLightText ? ui.col.text_h : ui.col.text;
					if (hoverEffect) {
						if (ppt.highLightRow == 3) {
							gr.FillSolidRect(this.sel.x, row_y, this.sel.w, this.row.h, ui.col.bg_h);
							gr.DrawRect(this.sel.x + Math.floor(ui.style.l_w / 2), row_y, this.sel.w - ui.style.l_w, this.row.h, ui.style.l_w, ui.col.frame);
						}
						if (ppt.highLightRow == 2) gr.FillSolidRect(this.sel.x, row_y, this.sel.w + 1, this.row.h + (!itemSel ? 0 : 1), !itemSel ? ui.col.bg_h : ui.col.bgSel_h);
						if (ppt.highLightRow == 1) gr.FillSolidRect(ui.style.l_w, row_y, ui.sideMarker_w, this.row.h, ui.col.sideMarker);
					}
					let im = null;
					if (ppt.showSource && item.source) {
						if (ppt.showSource != 4) {
							im = !item.vid || !ppt.showYouTubeLinkSource ? this.img.source[item.source] : this.img.sourceLfm[item.source];
							if (im) gr.DrawImage(im, this.x, row_y + this.img.y, im.Width, im.Height, 0, 0, im.Width, im.Height);
						} else {
							im = true;
							gr.GdiDrawText(['\uF05E', !item.vid || !ppt.showYouTubeLinkSource ? '\uF144' : '\uF202', '\uE142', '\u266B', '\uF05E'][item.source], this.ft[item.source], txt_col, this.x + [1, 1, -1, 0, 1][item.source], row_y + this.icon_y[item.source], x - this.x, this.icon_h[item.source]);
						}
					}
					const iw = !this.expanded ? this.artists.name.w : this.artists.name.track_w;
					const item_w = !im ? iw : iw - this.img.sp;
					const nm = !ppt.showSource && this.expanded && i ? `${(i < 9 ? '0' : '') + i}  ${item.name}` : item.name;
					const name_w = gr.CalcTextWidth(nm, font);
					this.checkTooltip(item, !im ? this.x : this.x + this.img.sp, row_y, name_w, item_w);
					gr.GdiDrawText(nm, font, txt_col, !im ? this.x : this.x + this.img.sp, row_y, item_w, this.row.h, txt.l);
					if (this.expanded) {
						if (i && ppt.showSource) gr.GdiDrawText(i, ui.font.small, ui.col.count, this.x + this.w - this.names.item.w.pos, row_y, this.names.item.w.pos, this.row.h, txt.r);
					} else if (ppt.showSimilar) gr.GdiDrawText(item.score, font, txt_col, this.x + this.w - this.artists.item.w, row_y, this.artists.item.w, this.row.h, txt.r);
					else if (i > 0) gr.GdiDrawText(item.disambiguation, ui.font.main, txt_col, this.x + this.w - this.artists.item.w, row_y, this.artists.item.w, this.row.h, txt.r);
				}
			}
			gr.DrawLine(this.x, this.artists.line.y, this.x + this.w - 1, this.artists.line.y, ui.style.l_w, ui.col.lineArt);
		}
		if (panel.sbar.show && art_scrollbar.scrollable_lines > 0) art_scrollbar.draw(gr);
	}

	get_ix(x, y) {
		let ix;
		if (y > art_scrollbar.item_y && y < art_scrollbar.item_y + this.artists.drawn * this.row.h && x >= this.sel.x && x < this.sel.x + this.sel.w) ix = Math.round((y + art_scrollbar.delta - this.artists.y - this.row.h * 0.5) / this.row.h);
		else if (y > alb_scrollbar.item_y && y < alb_scrollbar.item_y + this.names.drawn * this.row.h && x >= this.sel.x && x < this.sel.x + this.sel.w) ix = Math.round((y + alb_scrollbar.delta - this.names.y - this.row.h * 0.5) / this.row.h);
		else ix = -1;
		return ix;
	}

	getAlbumsFallback() {
		if (this.v2_init && !lib.getLibItems().Count) return;
		if (!this.get || (ppt.lock && this.artist && !this.init)) return;
		if (ppt.lock && this.init) {
			this.tag.similar = this.orig_artist = this.artist = ppt.lockArtist;
			this.tag.decade = ppt.lockDecade;
			this.tag.genre = ppt.lockGenre;
			this.tag.locale = ppt.lockLocale;
			this.tag.mood = ppt.lockMood;
			this.tag.song = ppt.lockSong;
			this.tag.theme = ppt.lockTheme;
			this.tag.year = ppt.lockYear;
		} else if (!ppt.lock) {
			this.setTags();
		}
		search.setText();
		if (dj.pss && !dj.force_refresh) dj.force_refresh = 2;
		filter.clearTimer(filter.timer);
		search.clearTimer(search.timer);
		const mode = this.getMode();
		this.searchForAlbumNames(0, mode, this.getSearchItem(mode));
		this.init = false;
	}

	getHandleList(items) {
		this.handleList = new FbMetadbHandleList();
		this.libHandleList = new FbMetadbHandleList();
		this.topTracksAvailable = false;
		if (!items || !items.length) return;
		items.forEach(v => {
			this.handleList.AddRange(v.handleList);
			if (v.source == 3) this.libHandleList.AddRange(v.handleList);
		});
		this.topTracksAvailable = this.isAlbum() ? false : items.some(v => v.source);
	}

	getId(mode, searchItem) {
		return `${mode}-${searchItem}-${this.artist}-${ppt.lbUserMix}-${ppt.lfmMixTag}-${ppt.lfmMixTrack }-${ppt.lfmUserLibSpan}-${ppt.lfmTopTrackSpan}-${this.chartDate}`;
	}

	getIndex(list, listLength) {
		let ind = Math.floor(listLength * Math.random());
		let j = 0;
		while ((this.loaded.artists.includes($.strip(list[ind].artist)) || this.loaded.tracks.includes($.strip(list[ind].title))) && j < listLength) {
			ind = Math.floor(listLength * Math.random());
			j++;
		}
		return ind;
	}

	getList(list, arr) {
		this.loaded.artists = [];
		this.loaded.tracks = [];
		list.some(() => {
			const t_ind = this.getIndex(list, list.length);
			arr.push(list[t_ind]);
			this.loaded.artists.push($.strip(list[t_ind].artist));
			this.loaded.tracks.push($.strip(list[t_ind].title));
			if (this.loaded.artists.length > 6) this.loaded.artists.splice(0, 1);
			return arr.length > 99;
		});
		return arr;
	}

	getMbReleases(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags) {
		const mb_releases = new MusicbrainzReleases(() => mb_releases.onStateChange(), this.on_mb_releases_search_done.bind(this));
		mb_releases.search(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags);
	}

	getMode() {
		return [ppt.lfmReleaseType, 6, 5][ppt.mb];
	}

	getReleases(m, r) {
		switch (m) {
			case 'lfm':
				ppt.lfmReleaseType = r;
				this.calcText();
				this.searchForAlbumNames(2, r, this.getSearchItem(r), this.ar_mbid);
				this.names.name.w = this.names.lfm_track.w;
				break;
			case 'mb':
				ppt.mbReleaseType = r;
				if (r < 5) {
					this.calcText();
					this.names.name.w = this.w - this.names.item.w.date - this.names.mb_rel.w[r] - this.img.sp;
					ppt.mbReleaseType == r;
					if (this.done(this.artist, 6)) {
						if (this.names.mb[r].length) {
							this.setNames(this.names.mb[r]);
						} else {
							this.analyse('', 6);
						}
					} else {
						search.setText();
						this.searchForAlbumNames(2, 6, this.getSearchItem(6), this.ar_mbid);
					}
					this.calcRowsNames();
					txt.paint();
				} else {
					this.calcText();
					this.searchForAlbumNames(2, 6, this.getSearchItem(6), this.ar_mbid);
					this.names.name.w = ppt.lbUserType > 4 ? this.names.lfm_track.w : this.names.lfm_chart.w;
				}
				break;
			case 'chart':
				this.searchForAlbumNames(2, r, 'chart', this.ar_mbid);
				this.names.name.w = this.names.lfm_chart.w;
				break;
		}
		search.setText();
	}

	getRowNumber(y) {
		return Math.round((y - this.names.y - this.row.h * 0.5) / this.row.h);
	}

	getSearchItem(mode) {
		return [this.artist, this.artist, this.tag[this.curTag()], 'chart', this.userType(), 'chart', ppt.mbReleaseType < 5 ? this.artist : this.lbType()][mode];
	}

	getTracks(alb_id, index, refresh, add, remove, showTracks, mTags) {
		let i_n = this.names.list[index].name.replace(/^(x |> |>> )/, '');
		if (ppt.mb == 1) {
			const relType = this.names.list[index].releaseType;
			if (relType != 'Album' && relType != 'Compilation' && relType != 'EP') {
				i_n += ' [' + relType + ']';
			}
		}
		if (!mTags) {
			if (this.loadExisting(this.names.list[index], true, refresh, add, remove, showTracks)) {
				if (!showTracks) this.setRow(alb_id, 2);
				return;
			}
			if (remove) {
				this.checkTrackSources();
				return;
			}
		}
		this.dld = new DldAlbumTracks;
		this.dld.execute(alb_id, this.names.list[index].rg_mbid, this.artist, i_n, this.names.list[index].prime, this.names.list[index].extra, this.names.list[index].date, add, mTags);
	}

	getSource(v, i, libHandles, plHandles) {
		let handleList = new FbMetadbHandleList();
		v.fullAlbum = false;
		switch (true) {
			case v.releaseType == 'Single' && (ppt.mb != 1 || ppt.mb == 1 && ppt.mbReleaseType == 5):
				if (ppt.libAlb) {
					handleList = lib.inLibrary(v.artist, v.title, i, true, true, libHandles);
					if (handleList.Count) {
						v.source = 3;
						v.handleList = handleList;
						v.fullAlbum = this.isFullAlbum(handleList[0]);
						return;
					}
				}
				if (ppt.libAlb == 2) {
					v.source = 0;
					v.handleList = new FbMetadbHandleList();
					return;
				} else {
					handleList = lib.inPlaylist(v.artist, v.title, i, false, false, false, plHandles);
					if (handleList.Count) {
						v.source = 2;
						v.handleList = handleList;
						v.fullAlbum = this.isFullAlbum(handleList[0]);
						return;
					}
				}
				v.source = (ml.fooYouTubeInstalled ? 1 : 4);
				v.handleList = new FbMetadbHandleList();
				return;
			default:
				if (v.releaseType != 'Album' && v.releaseType != 'Compilation' && v.releaseType != 'EP' && !v.title.endsWith(' [' + v.releaseType + ']')) {
					v.title += ' [' + v.releaseType + ']';
				}
				if (ppt.libAlb) {
					const q = lib.partialMatch.album ? ' HAS ' : ' IS ';
					handleList = $.query(this.art.libHandleList, name.field.album + q + v.title);
					if (handleList.Count) {
						v.source = 3;
						v.handleList = handleList;
						v.fullAlbum = this.isFullAlbum(handleList[0]);
						return;
					}
				}
				if (ppt.libAlb == 2) {
					v.source = 0;
					v.handleList = new FbMetadbHandleList();
					return;
				} else {
					handleList = $.query(this.art.plHandleList, 'album IS ' + v.title);
					if (handleList.Count) {
						v.source = 2;
						v.handleList = handleList;
						v.fullAlbum = this.isFullAlbum(handleList[0]);
						return;
					}
				}
				v.source = ml.fooYouTubeInstalled ? 1 : 4;
				v.handleList = new FbMetadbHandleList();
				break;
		}
	}

	isAlbum() {
		return (ppt.mb == 1 && ppt.mbReleaseType != 5) || !ppt.mb && !ppt.lfmReleaseType;
	}

	isFullAlbum(handle) {
		const track = tf.title_0.EvalWithMetadb(handle);
		if (track.includes('(Full Album)')) return true;
		return false;
	}

	itemRecognised() {
		switch (true) {
			case ppt.mb == 2:
				return this.artist && !this.names.done[5] ? 'Searching...' : (!filter.text ? 'Error retrieving this chart, please try again later.' : 'Search List: Nothing Found');
			case !ppt.mb && ppt.lfmReleaseType == 2:
				return this.tag[this.curTag()] && this.tag[this.curTag()] !== 'N/A' && !this.names.done[2] ? 'Searching...' : this.tag[this.curTag()] == 'N/A' ? 'Nothing Found: No Tag' : 'Nothing Found';
			case !ppt.mb && ppt.lfmReleaseType == 3:
				return !this.names.done[3] ? 'Searching...' : 'Nothing Found';
			case !ppt.mb && ppt.lfmReleaseType == 4 || ppt.mb == 1 && ppt.mbReleaseType == 5:
				return !this.names.done[4] ? 'Searching...' : 'Nothing Found';
			default:
				return this.artist && !this.names.done[ppt.mb ? 6 : ppt.lfmReleaseType] ? 'Searching...' : !filter.text ? !this.ar_mbid || this.songsMode() ? 'Unrecognised ' + (!this.songsMode() ? 'Artist' : 'Song') : ppt.mb == 1 && (ppt.showLive ? !this.names.data.length : !this.names.validPrime) || !ppt.mb ? 'Nothing Found' : 'Nothing Found For Release Type:\n' + this.type.mb[ppt.mbReleaseType] : 'Search List: Nothing Found';
		}
	}

	lbDisplay() {
		return [
			'Tracks You May Like: Recommendations',
			'Tracks You May Like: Similar Artists',
			'Tracks You May Like: Artists',
			'Loved',
			'Hated',
			'User Listens: This Week',
			'User Listens: This Month',
			'User Listens: This Quarter',
			'User Listens: This Year',
			'User Listens: All Time',
			'Site-Wide Listens: This Week',
			'Site-Wide Listens: This Month',
			'Site-Wide Listens: This Quarter',
			'Site-Wide Listens: This Year',
			'Site-Wide Listens: All Time'
		][ppt.lbUserType] + (ppt.lbUserMix ? ': Mix' : ppt.lbUserType > 2 ? ': Top Tracks' : '');
	}

	lbPlName() {
		return 'ListenBrainz' + (ppt.lbUserMix ? ' Mix: ' : ppt.lbUserType > 4 ? ' Top Tracks: ' : '') + [
			`Tracks You May Like: Recommendations`,
			`Tracks You May Like: Similar Artists`,
			`Tracks You May Like: Artists`,
			
			`Loved`,
			`Hated`,

			`Listens This Week (${ppt.lbUserName})`,
			`Listens This Month (${ppt.lbUserName})`,
			`Listens This Quarter (${ppt.lbUserName})`,
			`Listens This Year (${ppt.lbUserName})`,
			`Listens All Time (${ppt.lbUserName})`,
			
			`Listens This Week (Site-Wide)`,
			`Listens This Month (Site-Wide)`,
			`Listens This Quarter (Site-Wide)`,
			`Listens This Year (Site-Wide)`,
			`Listens All Time (Site-Wide)`
		][ppt.lbUserType];
	}

	lbType() {
		return [
			`cf/recommendation/user/${ppt.lbUserName}/recording?artist_type=raw`,
			`cf/recommendation/user/${ppt.lbUserName}/recording?artist_type=similar`,
			`cf/recommendation/user/${ppt.lbUserName}/recording?artist_type=top`,

			`feedback/user/${ppt.lbUserName}/get-feedback?score=1&metadata=true`,
			`feedback/user/${ppt.lbUserName}/get-feedback?score=-1&metadata=true`,

			`stats/user/${ppt.lbUserName}/recordings?range=this_week`,
			`stats/user/${ppt.lbUserName}/recordings?range=this_month`,
			`stats/user/${ppt.lbUserName}/recordings?range=quarter`,
			`stats/user/${ppt.lbUserName}/recordings?range=this_year`,
			`stats/user/${ppt.lbUserName}/recordings?range=all_time`,
			`stats/sitewide/recordings?range=this_week`,
			`stats/sitewide/recordings?range=this_month`,
			`stats/sitewide/recordings?range=quarter`,
			`stats/sitewide/recordings?range=this_year`,
			`stats/sitewide/recordings?range=all_time`
		][ppt.lbUserType];
	}

	lfmType(mode) {
		return ['album', this.curTrackSpan(), this.curTag() + ppt.lfmMixTag, 'chart', this.userType()][mode];
	}

	leave() {
		this.deactivateTooltip();
		if (!ppt.showAlb || panel.halt()) return;
		if (!men.right_up) {
			this.names.m_i = -1;
			this.artists.m_i = -1;
		}
		this.names.cur_m_i = 0;
		this.artists.cur_m_i = 0;
		txt.paint();
		this.type.active = 0;
	}

	libraryTest(p_album_artist, p_album) {
		lib.getArtistTracks(p_album_artist);
		let albums, orig_alb = false;
		let mtags_alb = false;
		albums = tf.album0.EvalWithMetadbs(lib.artist.tracks);
		if (lib.artist.tracks.Count) lib.artist.tracks.Convert().some((h, j) => {
			if ($.strip(albums[j]) == $.strip(p_album)) return orig_alb = true;
		});
		albums = tf.album0.EvalWithMetadbs(lib.artist.tracksTags);
		if (lib.artist.tracksTags.Count) lib.artist.tracksTags.Convert().some((h, j) => {
			if ($.strip(albums[j]) == $.strip(p_album)) return mtags_alb = true;
		});
		if ((orig_alb || mtags_alb) && this.albumInLibrary(p_album_artist, p_album, orig_alb, mtags_alb)) return true;
		return false;
	}

	load(x, y, mask, add, menu) {
		if (y < search.y || but.Dn) return;
		if (menu) this.type.active = menu;
		const refresh = mask == 0x0004 || mask == 0x0008; // shift or ctrl pressed (full_alb refreshes)
		let full_alb = mask == 0x0008 || mask == 0x0012; // ctrl or ctrl + shift pressed
		const mTagsAlbum = mask == 'mTagsAlbum';
		const mTagsFullAlbum = mask == 'mTagsFullAlbum';
		const remove = mask == 'remove';
		if (mTagsFullAlbum) full_alb = true;
		if (refresh) add = true; // refreshed items are always added so can compare with existing
		search.repaint();
		search.active = (y > search.y && y < search.y + this.row.h && x > this.x && x < this.x + search.w1);
		if (!ppt.showAlb || y <= search.y + this.row.h || x > panel.w - panel.sbar.sp) return;
		const i = this.get_ix(x, y);
		if (i == -1) {
			filter.clearTimer(filter.timer);
			search.clearTimer(search.timer);
			return;
		}
		if (ppt.touchControl && ui.touch_dn_id != i) return;
		switch (this.type.active) {
			case 1:
				switch (this.expanded) {
					case 0: {
						if (timer.artist.id || ppt.showSimilar && i >= this.art.similar.length || !ppt.showSimilar && i >= this.art.related.length) return;
						if (ppt.showSimilar) this.art.similar.forEach(v => v.name = v.name.replace(/^(x |>> )/, ''));
						else if (this.art.related.length) this.art.related.forEach(v => v.name = v.name.replace(/^(x |>> )/, ''));
						const item = this.artists.list[i];
						if ((ppt.mb == 2 || ppt.mb == 1 && ppt.mbReleaseType == 5 || !ppt.mb && ppt.lfmReleaseType > 1) && item) {
							const n = item.name;
							item.name = ppt.mb == 2 ? 'x N/A In Chart Mode' : ppt.mb == 1 && ppt.mbReleaseType == 5 ? 'x N/A In User Mode' : ['', '', 'x N/A In Tag Mode', 'x N/A In Chart Mode', 'x N/A In User Mode'][ppt.lfmReleaseType];
							txt.paint();
							if (!timer.artist.id)
								timer.artist.id = setTimeout(() => {
									if (item) item.name = n;
									txt.paint();
									timer.artist.id = null;
								}, 3000);
						} else {
							if (!item || this.artists.list.length == 1 && item.name.includes('Artists N/A')) return;
							this.artist = i == 0 ? item.name.replace(/( \[Similar\]:| \[Related\]:)/g, '') : item.name;
							search.setText();
							this.calcText();
							this.names.name.w = this.siteNameWidth();
							this.searchForAlbumNames(1, [ppt.lfmReleaseType, 6, 5][ppt.mb], ppt.mbReleaseType < 5 ? this.artist : this.lbType(), item.id ? item.id : '');
							const alb_artist = this.artists.list[0].name.replace(/( \[Related\]:)/g, '');
							if (!ppt.showSimilar && alb_artist.length) {
								const related_artists = $.file(this.art.relatedCustom) ? $.jsonParse(this.art.relatedCustom, {}, 'file') : {};
								this.artists.list[0].name.replace(/( \[Related\]:)/g, '');
								const key = alb_artist.toUpperCase();
								if (item.id) related_artists[key] = item.id; else delete related_artists[key];
								if (this.art.relatedCustomSort) {
									$.save(this.art.relatedCustom, JSON.stringify($.sortKeys(related_artists), null, 3), true);
									this.art.relatedCustomSort = false;
								} else $.save(this.art.relatedCustom, JSON.stringify(related_artists, null, 3), true);
							}
							if (i != 0) {
								item.name = '>> ' + item.name;
								txt.paint();
							}
						}
						break;
					}
					case 1: {
						if (i && this.artists.list.length) {
							this.deactivateTooltip();
							const item = this.artists.list[i];
							item.alb_id = 'track' + ++this.alb_id;
							if (!item.source) {
								this.setRow(item.alb_id, 0);
								return;
							}
							if (this.loadExisting(item, true, refresh, add, remove)) {
								this.setRow(item.alb_id, 2);
								return;
							}
							if (remove) return;
							const title = item.name;
							this.setRow(item.alb_id, 1);
							this.do_youtube_track_search(item.alb_id, this.artist, title, i, item.album, item.date, add)
						}
						break;
					}
				}
				break;
			case 2: {
				if (i >= this.names.list.length) return;
				this.deactivateTooltip();
				const item = this.names.list[i];
				if (ppt.mb == 1 && ppt.mbReleaseType != 5 || !ppt.mb && ppt.lfmReleaseType == 0) {
					this.setRow(item.alb_id, 4);
					if (x < this.x + this.icon_w) {
						if (item.expanded) {
							item.expanded = false;
							this.expanded = 0;
							if (timer.artist.id || ppt.showArtists && (ppt.showSimilar && !this.art.similar.length || !ppt.showSimilar && !this.art.related.length)) return;
							this.artists.list = ppt.showSimilar ? this.art.similar : this.art.related;
							this.calcRows(true);
							txt.paint();
						} else {
							this.expanded = 1;
							this.clearIcon();
							item.expanded = '\uF107  ';
							txt.paint();
							if (this.getRowNumber(y) + 1 > this.names.minRows) {
								this.calcRows(true);
								alb_scrollbar.checkScroll(Math.min(i * this.row.h, (i + 1 - this.names.minRows) * this.row.h));
							}
							this.getTracks('track' + item.alb_id, i, refresh, add, remove, x < this.x + this.icon_w);
						}
					} else {
						if (!item.source) {
							this.setRow(item.alb_id, 0);
							return;
						}
						if (!full_alb || (ppt.mb == 1 && !item.releaseType.includes('Album') && !item.releaseType.includes('Compilation'))) { // stndAlb
							if (!remove) this.setRow(item.alb_id, 1);
							this.getTracks(item.alb_id, i, refresh, add, remove, x < this.x + this.icon_w, mTagsAlbum);
						} else { // fullAlb
							if (!mTagsFullAlbum) {
								if (this.loadExisting(item, true, refresh, add, remove, x < this.x + this.icon_w)) {
									if (x >= this.x + this.icon_w) this.setRow(item.alb_id, 2);
									return;
								}
								if (remove) return;
							}
							const alb_n = item.name;
							this.setRow(item.alb_id, 1);
							if (ppt.mb == 1) this.on_mb_releases_search_done(item.alb_id, '', this.artist, alb_n, item.date, add, mTagsFullAlbum);
							else if (!ppt.mb) {
								this.getMbReleases(item.alb_id, '', this.artist, alb_n, '', '', '', add, mTagsFullAlbum);
							}
						}
						txt.paint();
					}
				} else if (!ppt.mb || ppt.mb == 1 && ppt.mbReleaseType == 5) {
					if (!item.source) {
						this.setRow(item.alb_id, 0);
						return;
					}
					this.setRow(item.alb_id, 4);
					if (this.loadExisting(item, false, refresh, add, remove)) {
						this.setRow(item.alb_id, 2)
						return;
					}
					if (remove) return;
					yt_dj.do_youtube_search(item.alb_id, ppt.lfmReleaseType == 1 && !ppt.mb ? this.artist : item.artist, ppt.lfmReleaseType == 1 && !ppt.mb ? $.stripRemaster(this.names.list[i].name) : ppt.lfmReleaseType > 1 && !ppt.mb ? $.stripRemaster(this.names.list[i].title) : this.names.list[i].title, item.alb_id, 1, pl.cache(), !add ? 1 : 2, true, item.vid, item.length, item.thumbnail);
				} else if (ppt.mb == 2) {
					if (!item.source) {
						this.setRow(item.alb_id, 0);
						return;
					}
					this.setRow(item.alb_id, 4);
					if (this.loadExisting(item, false, refresh, add, remove)) {
						this.setRow(item.alb_id, 2)
						return;
					}
					if (remove) return;
					yt_dj.do_youtube_search(item.alb_id, item.artist, item.title, item.alb_id, 1, pl.cache(), !add ? 1 : 2, true, item.vid, item.length, item.thumbnail);
				}
				break;
			}
		}
		search.cursor = false;
		search.offset = search.start = search.end = search.cx = 0;
		filter.clearTimer(filter.timer);
		search.clearTimer(search.timer);
	}

	loadExisting(v, p_alb, p_refresh, p_add, p_remove, p_showTracks) {
		const handles = p_alb || !p_refresh || v.source != 2 ? v.handleList : lib.inPlaylist(v.artist, v.title, 0, true);
		if (handles.Count) {
			if (p_alb && p_showTracks && v.source == 3) {
				const titles = tf.title0.EvalWithMetadbs(handles);
				this.artists.list = titles.map((w, i) => ({
					name: w,
					handleList: new FbMetadbHandleList([handles[i]]),
					source: 3
				}));
				this.artists.list.unshift({
					name: `${v.artist} - ${v.name}`
				});
				this.calcRows(true);
				txt.paint();
				return true;
			} else if (p_alb && p_showTracks) return false;

			if (!p_refresh && !p_remove) {
				const pn = pl.selection();
				if (!p_add) pl.clear(pn);
				const ix = !p_add ? 0 : plman.PlaylistItemCount(pn);
				if (p_add) plman.UndoBackup(pn);
				plman.InsertPlaylistItems(pn, ix, handles);
				plman.ActivePlaylist = pn;
				plman.SetPlaylistFocusItem(pn, ix);
				plman.ClearPlaylistSelection(pn);
				return true;
			} else {
				const pn = pl.cache();
				handles.Sort();
				lib.db.cache.Sort();
				lib.db.cache.MakeDifference(handles);
				pl.clear(pn);
				lib.db.cache.OrderByFormat(tf.albumSortOrder, 1);
				plman.InsertPlaylistItems(pn, 0, lib.db.cache);
				v.source = ppt.libAlb == 2 ? 0 : 1;
				v.handleList = new FbMetadbHandleList();
			}
		}
		return false;
	}

	loadHandleList(libraryOnly) {
		const list = !libraryOnly ? this.handleList : this.libHandleList;
		if (!list.Count) return;
		const pn = pl.selection();
		pl.clear(pn);
		plman.InsertPlaylistItems(pn, 0, list);
		plman.ActivePlaylist = pn;
		plman.SetPlaylistFocusItem(pn, 0);
		plman.ClearPlaylistSelection(pn);
	}

	lockArtist() {
		ppt.lock = !ppt.lock;
		ppt.lockArtist = this.artist;
		ppt.lockDecade = this.tag.decade;
		ppt.lockGenre = this.tag.genre;
		ppt.lockLocale = this.tag.locale;
		ppt.lockMood = this.tag.mood;
		ppt.lockSong = this.tag.song;
		ppt.lockTheme = this.tag.theme;
		ppt.lockYear = this.tag.year;
		if (ppt.lock) return;
		this.setTags();
		search.setText();
		const mode = this.getMode();
		this.searchForAlbumNames(0, mode, this.getSearchItem(mode));
	}

	mbSort() {
		if (ppt.mbReleaseType == 5) return;
		if (!ppt.mbReleaseType) {
			if (!ppt.mbGroup) {
				$.sort(this.names.mb[0], 'releaseType');
				$.sort(this.names.mb[0], 'date', 'rev')
			} else {
				$.sort(this.names.mb[0], 'date', 'rev');
				$.sort(this.names.mb[0], 'releaseType');
			}
		}
	}

	mbtn_dn(x, y) {
		if (!ppt.showAlb || panel.halt()) return;
		if (ppt.touchControl) ui.touch_dn_id = this.get_ix(x, y);
	}

	mbtn_up(x, y) {
		pMenu.load(x, y);
	}

	move(x, y) {
		if (!ppt.showAlb || panel.halt()) return;
		this.type.active = panel.m.y > this.artists.y ? 1 : panel.m.y > this.names.y && panel.m.y < this.names.y + this.names.h ? 2 : 0;
		if (but.Dn) return;
		if (y > search.y && y < search.y + this.row.h && x > this.x && x < this.x + search.w1 && ppt.mb != 2) {
			window.SetCursor(32513);
			search.edit = true;
		} else search.edit = false;
		if (y > filter.y && y < filter.y + filter.h && x >= filter.bg.x && x < filter.x + filter.w1 && !but.noShow) {
			window.SetCursor(32513);
			filter.edit = true;
		} else filter.edit = false;
		if (y > search.y && y < search.y + this.row.h && x < this.x + this.w && x > this.x + search.w1) {
			window.SetCursor(32649);
		}
		if (!this.artists.length && !this.names.list.length) return;

		this.names.m_i = -1;
		this.artists.m_i = -1;
		if (panel.m.y > art_scrollbar.item_y && panel.m.y < art_scrollbar.item_y + this.artists.drawn * this.row.h) this.artists.m_i = this.get_ix(x, y);
		else if (panel.m.y > alb_scrollbar.item_y && panel.m.y < alb_scrollbar.item_y + this.names.drawn * this.row.h) this.names.m_i = this.get_ix(x, y);

		if (this.names.m_i != -1) {
			this.check_tooltip(this.names.m_i, x, y);
		} else if (this.artists.m_i != -1) {
			this.check_tooltip(this.artists.m_i, x, y);
		} else this.deactivateTooltip();

		if (this.names.m_i == this.names.cur_m_i && this.artists.m_i == this.artists.cur_m_i) return;
		this.names.cur_m_i = this.names.m_i;
		this.artists.cur_m_i = this.artists.m_i;
		txt.paint();
	}

	numFormat(n) {
		if (!n) return '0';
		return parseInt(n).toLocaleString();
	}

	openSite() {
		switch (true) {
			case ppt.mb == 1:
				$.browser('https://musicbrainz.org/artist/' + this.ar_mbid);
				break;
			case !ppt.mb:
				$.browser('https://www.last.fm/music/' + encodeURIComponent(this.artist));
				break;
		}
	}

	on_albums_search_done(list, mbid, rec, mode, searchItem, lfmTopTrackSpan, lfmMixTrack, lfmMixTag) {
		this.ar_mbid = mbid;
		this.ar_mbid_done = this.artist;
		this.names.done[mode] = rec;
		if (searchItem === undefined) {
			/*only_mbid*/
			txt.paint();
			return;
		}

		const curMode = this.getMode();
		if (mode != curMode) return;

		if (mode == 1 && (ppt.lfmMixTrack != lfmMixTrack || ppt.lfmTopTrackSpan != lfmTopTrackSpan)) {txt.paint(); return;}
		if (mode == 2 && ppt.lfmMixTag != lfmMixTag) {txt.paint(); return;}
		if (searchItem.toLowerCase() != this.getSearchItem(mode).toLowerCase()) {txt.paint(); return;}

		if (mode == 6 && ppt.mbReleaseType != 5) this.names.data = list;
		this.analyse(list, mode);
		this.calcRowsNames();
		txt.paint();
	}

	on_key_down(vkey) {
		if (panel.halt()) return;
		if (vkey == vk.refresh) window.Reload(); 
		if (!ppt.showAlb) return;
		switch (vkey) {
			case vk.pgUp:
				if (!this.scrollbarType()) break;
				this.scrollbarType().pageThrottle(1);
				break;
			case vk.pgDn:
				if (!this.scrollbarType()) break;
				this.scrollbarType().pageThrottle(-1);
				break;
		}
	}

	on_mb_releases_search_done(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid) {
		this.do_youtube_search(p_alb_id, p_album_artist, p_album, p_date, p_add, p_mTags);
		txt.paint();
	}

	on_playback_new_track(on_metadb_changed) {
		if (dj.pss)
			if (window.IsVisible) dj.force_refresh = 1;
			else dj.force_refresh = 0;
		this.art.search = false;
		const mode = this.getMode();
		let searchItem = this.getSearchItem(mode); // initial check
		if (!ppt.showAlb || (ppt.lock && (searchItem || this.init)) || panel.block()) { // block
			this.get = true;
			txt.paint();
			return;
		}
		if (!$.handle(ppt.focus)) this.tagSet(on_metadb_changed);
		else {
			this.setTags(on_metadb_changed);
			this.tagSet.cancel();
		}
		searchItem = this.getSearchItem(mode);
		if (dj.pss) dj.force_refresh = 2;
		filter.clearTimer(filter.timer);
		search.clearTimer(search.timer);
		if (!searchItem) this.clearAlb();
		else {
			search.setText();
			this.clearAlb.cancel();
		}
		const newItemId = this.getId(mode, searchItem); // deals with unwanted refreshes caused by on_metadb_changed (mainly from foo_youtube) before done state set
		if (newItemId != this.lastItemId) {
			this.lastItemId = newItemId;
			this.searchForAlbumNames(0, mode, searchItem);
		}
	}

	on_similar_search_done(list, n) {
		if (!list.length) {
			list = [];
			list[0] = {
				name: 'Similar Artists N/A',
				score: ''
			}
		}
		this.art.similar = list.slice(0, 100);
		if (this.art.similar.length > 1) {
			this.art.similar[0] = {
				name: n + ' [Similar]:',
				score: 'Score'
			};
		}
		if (ppt.showSimilar) {
			this.artists.list = this.art.similar;
			this.calcRowsArtists();
		}
		txt.paint();
	}

	on_youtube_search_done(p_alb_id, link, p_artist, p_title, p_ix, p_done, p_pn, p_alb_set, p_length, p_orig_title, p_yt_title, p_full_alb, p_fn, p_type, p_album, p_date, p_mTags) {
		if (link && link.length) {
			this.setRow(p_alb_id, 2);
			txt.paint();
			if (!p_mTags) {
				panel.addLoc(link, pl.cache(), false, false, true, true);
				panel.addLoc(link, pl.selection(), false, false, true);
			} else {
				const type_arr = ['YouTube Track', 'Prefer Library Track', 'Library Track'];
				panel.add_loc.mtags[p_alb_id] = [];
				panel.add_loc.mtags[p_alb_id].push({
					'@': link,
					'ALBUM': p_title,
					'ARTIST': p_artist,
					'DATE': p_date,
					'DURATION': p_length.toString(),
					'TITLE': p_title + ' (Full Album)',
					'YOUTUBE_TITLE': p_yt_title,
					'SEARCH_TITLE': p_orig_title ? p_orig_title : [],
					'TRACK_TYPE': type_arr[ppt.libAlb]
				});
				mtags.save(p_alb_id, p_artist, true);
			}
		}
	}

	on_youtube_track_search_done(p_alb_id, link, p_artist, p_title, p_ix, p_done, p_pn, p_alb_set, p_length, p_orig_title, p_yt_title, p_full_alb, p_fn, p_type, p_album, p_date) {
		if (link && link.length) {
			this.setRow(p_alb_id, 2);
			txt.paint();
			panel.addLoc(link, pl.cache(), false, false, true, true);
			panel.addLoc(link, pl.selection(), false, false, true);
		}
	}

	reset(lock) {
		const mode = this.getMode();
		if (!lock) {
			search.offset = search.start = search.end = search.cx = 0;
			this.setTags();
			search.text = this.searchText();
			this.art.cur_sim = '';
		}
		this.searchForAlbumNames(0, mode, this.getSearchItem(mode));
	}

	resetAlbum(mode) {
		this.names.done[mode] = false;
		if (mode == 6) {
			if (ppt.mbReleaseType < 5) {
				for (let i = 0; i < 5; i++) {
					this.names.mb[i] = [];
					this.names.data = [];
				}
			} else {
				this.names.mb[this.lbType() + ppt.lbUserMix] = [];
			}
		} else this.names.lfm[this.lfmType(mode)] = [];
		this.names.list = [];
	}

	resetAlbums(mode, bypass) {
		this.names.list = [];
		this.handleList = new FbMetadbHandleList();
		this.libHandleList = new FbMetadbHandleList();
		this.topTracksAvailable = false;
		this.resetAlbum(mode);
		if (ppt.showAlb) window.Repaint(true);
		if (!bypass) {
			this.ar_mbid_done = this.ar_mbid = false;
		}
		this.names.validPrime = false;
	}

	scrollbarType() {
		return this.type.active == 1 ? art_scrollbar : this.type.active == 2 ? alb_scrollbar : 0;
	}

	searchForAlbumNames(type, mode, item, ar_id) {
		switch (type) {
			case 0: { // new track or reset
				this.get = false;
				if (!item) return;
				this.art.sim_done = true;
				const albums = new DldAlbumNames(this.on_albums_search_done.bind(this));
				if (ppt.showArtists && ppt.showSimilar && this.art.cur_sim != this.artist || !this.artist) {
					if (this.expanded) {
						this.expanded = 0;
						this.calcRows();
						
					}
					this.searchForSimilarArtists(this.artist);
				}

				const done = this.done(item, mode); // item is the search item & used for done check
				const only_mbid = done && this.artist != this.ar_mbid_done && (mode == 3 || mode == 4 || mode == 5 || mode == 6 && ppt.mbReleaseType == 5);
				
				if (only_mbid) this.ar_mbid_done = this.artist;
				if (done && !only_mbid) return; 
				if (!ppt.showSimilar) {
					this.artists.list = [];
					this.art.related = [];
					this.artists.list[0] = {
						name: 'Searching...',
						id: ''
					};
					this.calcRowsArtists();
				}
				if (!only_mbid) this.resetAlbums(mode);
				albums.execute(this.artist, '', mode, item, only_mbid);
				break;
			}
			case 1: // mouse click similar or related artist
				if (ppt.showSimilar) this.art.related = [];
				else this.art.similar = [];
				this.resetAlbums(mode);
				if (ar_id) { // get album names
					const albums = new DldMoreAlbumNames(this.on_albums_search_done.bind(this));
					albums.execute(ar_id, mode, item);
				}
				else { // get / check mbid then album names
					const albums = new DldAlbumNames(this.on_albums_search_done.bind(this));
					albums.execute(item, ppt.showSimilar ? false : true, mode, item);
				}
				if (ppt.showArtists && !ppt.showSimilar) {
					this.art.similar[0] = {
						name: 'Searching...',
						score: ''
					};
					this.art.cur_sim = '';
					this.art.sim_done = false;
				}
				this.art.cur = item;
				break;
			case 2: // but actions mostly
				timer.clear(timer.artist);
				if (this.ar_mbid_done != this.artist) {
					this.resetAlbum(mode);
					txt.paint(); /*immediate reset*/
					return timer.artist.id = setTimeout(() => {
						this.reset();
						timer.artist.id = null;
					}, 1500);
				}
				if (this.done(item, mode)) {
					this.setNames([this.names.lfm[this.lfmType(mode)], ppt.mbReleaseType < 5 ? this.names.mb[ppt.mbReleaseType] : this.names.mb[this.lbType() + ppt.lbUserMix], this.names.chart][ppt.mb]);
					this.calcRowsNames();
					txt.paint();
					return;
				} else { // get album names if no data
					const albums = new DldMoreAlbumNames(this.on_albums_search_done.bind(this));
					this.resetAlbums(mode, true);
					albums.execute(ar_id, mode, item);
				}
				break;
		}
	}

	searchForSimilarArtists(n) {
		if (!n && !this.art.similar.length) { // !this.art.similar.length stops dropping similarArtists when empty playlist & play recommendations
			this.artists.list = [];
			this.art.similar = [];
			return this.on_similar_search_done([], '');
		}
		if (n == this.art.cur_sim) return;
		this.art.cur_sim = n;
		this.artists.list = [];
		this.art.sim_done = true;
		this.art.similar = [];
		this.artists.list[0] = {
			name: 'Searching...',
			id: '',
			score: ''
		};
		this.calcRowsArtists();
		const similar = new LfmSimilarArtists(() => similar.onStateChange(), this.on_similar_search_done.bind(this));
		similar.search(n);
	}

	searchText() {
		return [this.artist, this.artist, this.tag[this.curTag()], 'Real Time', '', this.chartDate, ppt.mbReleaseType != 5 ? this.artist : ''][this.getMode()];
	}

	setFilter(ns) {
		filter.text = ns || '';
		if (!ppt.mb) this.sortLfm();
		if (ppt.showAlb) this.setNames([this.names.lfm[this.lfmType(ppt.lfmReleaseType)], this.names.mb[ppt.mbReleaseType], this.names.chart][ppt.mb]);
		if (this.statistics.show(ppt.lfmReleaseType)) this.names.list.forEach(v => v.playcount = this.numFormat(v.playcount));
	}

	setNames(li) {
		if (!li) return;
		this.names.list = li.map(v => v);
		this.names.list = this.names.list.filter(v => {
			let str = ppt.mb == 1 ? `${v.artist} ${v.title} ${v.date}` : `${v.artist} ${v.title}`;
			return str.toLowerCase().includes(filter.text.toLowerCase());
		});
		this.getHandleList(this.names.list);
		this.calcRowsNames();
		txt.paint();
	}

	setRow(alb_id, style) {
		const pane = typeof alb_id == 'number' ? 'upper' : 'lower';
		let name = '';
		const list = pane == 'upper' ? this.names.list : this.artists.list;
		const ix = list.findIndex(v => {
			if (!v.alb_id || !alb_id) return false;
			return v.alb_id == alb_id
		});
		if (ix != -1) { // set display item
			const o = list[ix];
			name = o.name = o.name.replace(/^(x |> |>> )/, '');
			if (style == 4) {
				txt.paint();
				return;
			}
			switch (style) {
				case 0:
					name = 'x ' + name;
					break;
				case 1:
					name = '> ' + name;
					break;
				case 2:
					name = '>> ' + name;
					break;
				case 3:
					name = (panel.add_loc.alb[alb_id].length ? '>> ' : 'x ') + name;
					break;
			}
			o.name = name;
			if (pane == 'lower') {
				txt.paint();
				return;
			}
			const mb = Number(o.type) ? 1 : o.type == 'officialChart' ? 2 : 0;
			const base = [this.names.lfm[o.type] || [], this.names.mb[o.type] || [], this.names.chart || []][mb];
			const index = base.findIndex(v => v.alb_id == alb_id);
			if (index != -1) base[index].name = name;
			txt.paint();
		}
	}

	setSimilar() { // get similar artists after mouse click trigger if needed
		if (!this.art.sim_done) {
			this.searchForSimilarArtists(this.art.cur);
			this.art.sim_done = true;
		}
		else {
			this.artists.name.w = this.w - this.names.item.w.score;
			this.artists.item.w = this.names.item.w.score;
			if (ppt.showSimilar) {
				if (this.art.cur_sim == this.artist) {
					this.artists.list = this.art.similar;
					this.calcRowsArtists();
				} else {
					this.searchForSimilarArtists(this.artist);
				}
			} else {
				this.artists.name.w = this.w * 2 / 3 - this.names.item.w.sp;
				this.artists.item.w = this.w / 3;
				this.artists.list = this.art.related;
				this.calcRowsArtists();
				txt.paint();
			}
		}
	}

	setSiteDefaults() {
		this.names.chart = [];
		this.names.lfm = {
			album: [],
			track0: [], // 0 top tracks; 1 last.fm mix
			track1: [],
			similar0: [],
			similar1: [],
			song0: [],
			song1: [],
			genre0: [],
			genre1: [],
			mood0: [],
			mood1: [],
			theme0: [],
			theme1: [],
			decade0: [],
			decade1: [],
			year0: [],
			year1: [],
			locale0: [],
			locale1: [],
			chart: [],
			mix: [],
			recommendations: [],
			neighbours: [],
			library: [],
			loved: [],
			topTracks: []
		};

		this.names.mb = [
			[],
			[],
			[],
			[],
			[],
			{
			raw0: [],
			raw1: [],
			similar0: [],
			similar1: [],
			top0: [],
			top1: [],
			loved0: [],
			loved1: [],
			hated0: [],
			hated1: [],
			userweek0: [],
			userweek1: [],
			usermonth0: [],
			usermonth1: [],
			userquarter0: [],
			userquarter1: [],
			useryear0: [],
			useryear1: [],
			useralltime0: [],
			useralltime1: [],

			siteweek0: [],
			siteweek1: [],
			sitemonth0: [],
			sitemonth1: [],
			sitequarter0: [],
			sitequarter1: [],
			siteyear0: [],
			siteyear1: [],
			sitealltime0: [],
			sitealltime1: []
			}
		];
	}

	setTags(on_metadb_changed) {
		if (!on_metadb_changed) {
			name.curAlbumId = ''; // reset so update on track change, but block on_metadb_changed here else unwanted change part-way through track
			name.curArtistId = '';
			if (ppt.integrateBio) window.NotifyOthers('bio_syncTags', ppt.focus); // call bio with current focus: bio will ignore if item done
		}
		this.tag.similar = this.orig_artist = this.artist = name.artist();
		this.tag.decade = name.decade();
		this.tag.genre = name.genre();
		this.tag.locale = name.locale();
		this.tag.mood = name.mood();
		this.tag.song = name.artist_title();
		this.tag.theme = name.theme();
		this.tag.year = name.year();
		this.checkLfmTagType();
	}

	siteNameWidth() {
		return [this.names.lfm_track.w, ppt.mbReleaseType != 5 ? this.w - (this.names.item.w.date + this.names.mb_rel.w[ppt.mbReleaseType] + this.img.sp) : (ppt.lbUserType > 4 ? this.names.lfm_track.w : this.names.lfm_chart.w), this.names.lfm_chart.w][ppt.mb];
	}

	songsMode() {
		return !ppt.mb && ppt.lfmReleaseType == 2 && this.lfmTagType == 1;
	}

	sortLfm() {
		const type = this.lfmType(ppt.lfmReleaseType);
		if (!this.names.lfm[type].length) return;
		this.names.lfm[type].forEach(v => {
			v.playcount = String(v.playcount).replace(/,/g, '');
		});
		if (ppt.lfmSortPC) {
			$.sort(this.names.lfm[type], 'playcount', 'numRev');
		} else {
			$.sort(this.names.lfm[type], 'rank', 'num');
		}
	}

	tagMode() {
		return !ppt.mb && ppt.lfmReleaseType == 2;
	}

	tipText(item, lowerPane) {
		const tipTxt = ['Not Found in Library', !ppt.showYouTubeLinkSource ? 'Load from Youtube' : item.releaseType !=  'Album' || lowerPane ? (!item.vid ? 'Load from Youtube (search youtube for link)' : 'Load from Youtube (last.fm link)') : 'Load from Youtube (expand for link source)', 
		(!ppt.mb && !ppt.lfmReleaseType || ppt.mb == 1) && !item.fullAlbum && !lowerPane ? 'Load Cached Tracks' : 'Load from Youtube Cache', 'Load from Library', 'Not Available [foo_youtube not Installed]'][item.source];
		if (lowerPane) return tipTxt;
		else return tipTxt + (item.fullAlbum ? ' (Full Album)' : '');
	}

	toggle(n) {
		switch (n) {
			case 'lfmSortPC': {
				ppt.toggle('lfmSortPC');
				const type = this.lfmType(ppt.lfmReleaseType);
				if (!this.names.lfm[type].length) return;
				this.sortLfm();
				if (ppt.mb == 1) return;
				this.setNames(this.names.lfm[type]);
				this.names.list.forEach(v => v.playcount = this.numFormat(v.playcount)); // should only be called if sortable
				break;
			}
			case 'mbGroup':
				if (ppt.mbReleaseType == 5) break;
				ppt.toggle('mbGroup');
				if (!this.names.mb[0].length) return;
				this.mbSort();
				if (!ppt.mb || ppt.mbReleaseType) return;
				this.setNames(this.names.mb[0]);
				break;
			case 'mode': {
				this.calcText();
				this.names.name.w = this.siteNameWidth();
				but.refresh(true);
				search.metrics();
				search.setText();
				const mode = this.getMode();
				this.searchForAlbumNames(2, mode, this.getSearchItem(mode), this.ar_mbid);
				break;
			}
			case 'showArtists':
				ppt.toggle('showArtists');
				if (ppt.showArtists) this.setSimilar();
				this.expanded = 0;
				this.calcRows();
				break;
			case 'show':
				ppt.toggle('showAlb');
				if (panel.video.mode && !ppt.showAlb) panel.setVideo();
				if (!ui.style.textOnly) img.updSeeker();
				but.setSearchBtnsHide();
				if (panel.video.mode) {
					if (ppt.showAlb && $.eval('%video_popup_status%') == 'visible') fb.RunMainMenuCommand('View/Visualizations/Video');
					if (!ppt.showAlb && $.eval('%video_popup_status%') == 'hidden' && panel.video.show) fb.RunMainMenuCommand('View/Visualizations/Video');
				}
				if (panel.video.mode && dj.pss) {
					dj.force_refresh = 2;
					dj.refreshPSS();
				}
				if (!ppt.showAlb || ppt.mb == 2) {
					search.cursor = false;
					search.offset = search.start = search.end = search.cx = 0;
					filter.clearTimer(filter.timer);
					search.clearTimer(search.timer);
				}
				if (ppt.showAlb && !panel.halt()) this.getAlbumsFallback();
				if (!panel.image.show) return;
				if (!fb.IsPlaying || ppt.focus && !panel.video.mode) on_item_focus_change();
				if ((!ppt.showAlb || ppt.imgBg) && ppt.artistView && ppt.cycPhoto) timer.image();
				else timer.clear(timer.img);
				break;
			case 'showLive':
				if (ppt.mbReleaseType == 5) break;
				ppt.toggle('showLive');
				this.type.mb[0] = (ppt.showLive ? 'All Releases' : 'Releases');
				alb.calcText();
				if (!this.names.mb[0].length) {
					txt.paint();
					return;
				}
				this.names.mb[0] = [];
				if (!ppt.mb || ppt.mbReleaseType) return;
				this.analyse('', 4);
				this.calcRowsNames();
				txt.paint();
				break;
		}
	}

	treeTooltipFont() {
		return [ui.font.main.Name, ui.font.main.Size, ui.font.main.Style];
	}
	
	userDisplay() {
		return ['Mix', 'Recommendations', 'Neighbours', 'Library', 'Loved', 'Top Tracks: Library: ' + [' Last 7 Days', ' Last 30 Days', ' Last 90 Days', ' Last 180 Days', ' Last 365 Days', ' All Time'][ppt.lfmUserLibSpan]][ppt.lfmUserType];
	}
	
	userType() {
		return ['mix', 'recommended', 'neighbours', 'library', 'loved', [
			'7day',
			'1month',
			'3month',
			'6month',
			'12month',
			'overall'
		][ppt.lfmUserLibSpan]][ppt.lfmUserType];
	}

	wheel() {
		this.names.m_i = -1;
		this.names.cur_m_i = 0;
		this.artists.m_i = -1;
		this.artists.cur_m_i = 0;
	}
}