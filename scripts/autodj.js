﻿'use strict';

class Favourites {
	addCurrentStation(source, type, tag, query) {
		if (!source.length || source == 'N/A') return;
		let station_array = ppt.favourites;
		if (type == 4) type = 1;
		station_array = !station_array.includes('No Favourites') ? $.jsonParse(station_array, []) : [];
		if (type == 1 && tag == 'locale') {
			if (!men.localeArr.includes(source)) {
				source = men.getDemonym(source);
			}
		}
		if (station_array.length) station_array = station_array.filter(v => v.source != source + (!query ? '' : ' [Query]') || v.type != type || v.type == 1 && v.tag && v.tag != tag);
		station_array.push({
			'source': source + (!query ? '' : ' [Query]'),
			'tag': tag,
			'type': type,
			'query': query
		});

		if (station_array.length > 30) station_array.splice(0, 1);
		this.save(JSON.stringify(station_array));
		
		station_array.forEach(v  => {
			if (v.type == 0 || v.type == 2) {
				if (men.artistsArr.every(w => w.toLowerCase() !== v.source.toLowerCase())) men.bInsert(v.source, men.artistsArr);
			}
			if (v.type == 1 && v.tag && !v.query) {
				const arr = men[`${v.tag}Arr`];
				if (arr.every(w => w.toLowerCase() !== v.source.toLowerCase())) men.bInsert(v.source, arr);
			}
			if (v.type == 3) {
				if (men.songsArr.every(w => w.toLowerCase() !== v.source.toLowerCase())) men.bInsert(v.source, men.songsArr);
			}
		});
	}

	init() {
		if (this.save_fav_to_file()) {
			const n = `${panel.storageFolder}favourites.json`;
			if (!$.file(n)) $.save(n, 'No Favourites', true);
			ppt.favourites = $.open(n);
		}
		this.stations = ppt.favourites;
		this.stations = !this.stations.includes('No Favourites') ? $.jsonParse(this.stations, []) : [];
		if (this.stations.length) $.sort($.sort(this.stations, 'type', 'num'), 'source', 0);
	}

	removeCurrentStation(source_, type, tag, query) {
		let source;
		if (type == 4) type = 1;
		const on = dj.on() || ppt.autoRad && plman.PlayingPlaylist == pl.getDJ() || plman.ActivePlaylist == pl.getSoft() || plman.PlayingPlaylist == pl.getSoft();
		const found = this.stations.some(v => {
			if (on && source_ + (!query ? '' : ' [Query]') == v.source && type == v.type && tag == (v.tag || '')) {
				return source = v.source;
			}
		});
		if (!found) return;
		let station_array = ppt.favourites;
		station_array = !station_array.includes('No Favourites') ? $.jsonParse(station_array, []) : [];
		station_array = station_array.filter(v => v.source != source);
		this.save(station_array.length ? JSON.stringify(station_array) : 'No Favourites');
	}

	save(fv) {
		ppt.favourites = fv;
		this.stations = !fv.includes('No Favourites') ? $.jsonParse(fv, []) : [];
		if (this.stations.length) $.sort($.sort(this.stations, 'type', 'num'), 'source', 0);
		if (this.save_fav_to_file()) $.save(`${panel.storageFolder}favourites.json`, fv, true);
	}

	save_fav_to_file() {
		return panel.id.local ? true : false; // use return true for file save/load of favourites
	}

	toggle_auto(source, type, tag, query) {
		ppt.toggle('autoFav');
		if (ppt.autoFav) this.addCurrentStation(source, type, tag, query);
	}
}

class NewAutoDJ {
	constructor() {
		const djName = ppt.djName.split(',');

		this.cur_lfm_variety == ppt.cur_lfm_variety;
		this.cur_dj_mode = ppt.cur_dj_mode;
		this.cur_dj_query = ppt.cur_dj_query;
		this.cur_dj_range = ppt.cur_dj_range;
		this.cur_dj_source = ppt.cur_dj_source;
		this.cur_dj_tag = ppt.cur_dj_tag;
		this.cur_dj_type = ppt.cur_dj_type;

		if (![10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 200, 250].includes(this.cur_lfm_variety)) {
			ppt.cur_lfm_variety = this.cur_lfm_variety = 50;
		}

		if (this.cur_dj_type < 0 || this.cur_dj_type > 4) {
			this.cur_dj_type = $.clamp(this.cur_dj_type, 0, 4);
			ppt.cur_dj_type = this.cur_dj_type;
		}

		let presets = ppt.presets.replace(/^[,\s]+|[,\s]+$/g, '');
		let p_name = presets.split(',');

		if (p_name.length != 12) {
			const defPresets = 'Highly popular,25,Popular,50,Normal,75,Varied,100,Diverse,150,Highly diverse,200';
			ppt.presets = defPresets;
			p_name = defPresets;
		}

		this.counter = 0;
		this.cur_find = $.jsonParse(ppt.cur_find, {source: 'N/A'})
		this.lot = 0;
		this.playedArtists = $.jsonParse(ppt.playedArtists, false);
		this.playedTracks = $.jsonParse(ppt.playedTracks, false);
		this.pool = [];
		this.pop1 = 0.8;
		this.pop2 = 0.2;
		this.presets = [];
		this.djFound = false;
		this.weight = [
			[0.5, 0.9, 0.2],
			[0.9, 0.9, 0],
			[0.2, 0.2, 0],
			[0.5, 0.9, 0.9],
			[0.2, 0.2, 0],
			['N/A', 'N/A', 0]
		];
		this.yt_pref_kw = ppt.yt_pref_kw.replace(/\s+/g, '').split('//');
	
		this.feed = {
			song: $.split(ppt.songFeed, 0),
			tag: $.split(ppt.tagFeed, 0)
		}

		const wt = ['djBiasArtist', 'djBiasGenreTracks', 'djBiasSimilarArtists', 'djBiasSimilarSongs', 'djBiasGenreArtists', 'djBiasQuery'].map(v => $.split(ppt[v], 1))
		this.weight.forEach((v, i, arr) => {
			arr[i] = [this.calcBias(wt[i][1]), this.calcBias(wt[i][3]), this.calcBias(wt[i][5])];
		});

		for (let i = 0; i < p_name.length; i += 2) this.presets.push(p_name[i]);
		presets = presets.replace(/\s+/g, '').split(',');
		for (let i = 1; i < presets.length; i += 2) this.pool.push(Math.max(parseFloat(presets[i]), 5));
		if (!this.pool.length) this.pool.push(50)

		ppt.djMode = !ppt.djOwnData && ppt.libDj < 2 ? 1 : !ppt.djOwnData ? 2 : 3;
		ppt.djMode = Math.max(ppt.djMode, 1);

		this.n = ['', djName[0], djName[2], djName[4]];
		this.nm = ['', djName[1] || ' Auto DJ', djName[3] || ' Auto DJ', djName[5] || ' Auto DJ', djName[7] || ' \u2219 '];

		this.cur_dj_mode = Math.max(this.cur_dj_mode, 1);
		if (this.cur_dj_range > this.pool.length - 1 || this.cur_dj_range < 0) {
			ppt.cur_dj_range = this.cur_dj_range = 0;
		}

		if (ppt.djRange > this.pool.length - 1 || ppt.djRange < 0) ppt.djRange = 0;
		if (!this.feed.song.length) this.feed.song.push(250);
		if (!this.feed.tag.length) this.feed.tag.push(500);
	}

	// Methods

	artist(length) {
		if (!length) return 0;
		let a_ind = 0;
		if (this.playedArtists.length != 0 || this.cur_dj_type == 4) {
			const r = Math.random();
			if (ppt.randomArtist) a_ind = this.getIndex(0, '', length -= 1, 3, 0) + 1;
			else if (this.playedArtists.includes(0) || r > (this.cur_lfm_variety * -0.13 + 19.5) / 100) a_ind = this.getIndex(0, '', length -= 1, 2, 0) + 1;
		}
		this.playedArtists.push(a_ind);
		if (this.playedArtists.length > 6) this.playedArtists.splice(0, 1);
		ppt.playedArtists = JSON.stringify(this.playedArtists);
		return a_ind;
	}

	autoDjFound(p_q) {
		if (this.djFound) return;
		this.djFound = true;
		ppt.autoRad = true;
		window.NotifyOthers('fp_autoDj', true);
		this.counter = 0;
		if (dj.search) {
			this.playedArtists = [];
			const lfmRadio = ppt.lfmRadio && dj.mode < 2 && dj.type != 3;
			if (!lfmRadio) this.playedTracks = [];
			ppt.playedArtists = JSON.stringify(this.playedArtists);
			ppt.playedTracks = JSON.stringify(this.playedTracks);
		}
		this.lot = 0;
		dj.list.items = [];
		dj.param = false;

		ppt.cur_dj_source = this.cur_dj_source;
		ppt.cur_dj_tag = this.cur_dj_tag;
		ppt.cur_dj_type = this.cur_dj_type;
		ppt.cur_lfm_variety = this.cur_lfm_variety;
		ppt.cur_dj_mode = this.cur_dj_mode;
		ppt.cur_dj_query = p_q;
		ppt.cur_dj_range = this.cur_dj_range;
	}

	basePool(list, threshold, length) {
		let count = 0;
		length = Math.min(list.length, length);
		for (let i = 0; i < length; ++i)
			if (list[i].playcount > threshold) count++;
		return count;
	}

	calcBias(v) {
		if (isNaN(v)) return 0.2;
		else return v >= 10 ? 0 : Math.min(1 / Math.abs(v), 0.9)
	}

	curDefBias() {
		if (!ppt.autoRad || !fb.isPlaying || plman.PlayingPlaylist != pl.getDJ() || ppt.playTracks) return 0;
		return Math.min(Math.round(1 / this.pop2), 10);
	}

	filter_yt(title, descr) {
		try {
			if (title && RegExp(ppt.ytTitleFilter, 'i').test(title)) return true;
			if (descr && RegExp(ppt.ytDescrFilter, 'i').test(descr)) return true;
			return false;
		} catch (e) {
			$.trace("Syntax error in custom regular expression. Panel Property: YouTube 'Live' Filter...");
			return false;
		}
	}

	getAutoDj(djSource, djMode, djType, djVariety, djRange, djFavourite, djQuery, djTag) {
		dj.list.origCount = ppt.trackCount;
		dj.list.origItems = $.isArray(dj.list.items) ? dj.list.items.slice() : dj.list.items.Clone();
		dj.list.origIndex = dj.list.index;
		dj.list.origQuery = dj.list.query.Clone();
		ppt.playTracks = false;
		if (djQuery && djMode != 3) djMode = 3;
		if (djType == 3 && djMode == 3) {
			djMode = 2;
		}
		if (ppt.lfmRadio && (djMode == 2 || djMode == 3) && !ppt.playlistSoftMode) djMode = 1;
		dj.text = 'Searching...\n For Tracks';
		txt.repaint();
		this.djFound = false;
		dj.search = true;
		this.cur_dj_source = djSource;
		this.cur_dj_mode = djMode;
		dj.sync = false;
		this.cur_dj_query = djQuery;
		this.cur_dj_type = djType;
		this.cur_dj_tag = djTag;
		this.cur_dj_range = $.clamp(djRange, 0, this.pool.length - 1);
		this.cur_lfm_variety = djVariety;
		setTimeout(() => index.load(djSource, djMode, djType, djVariety, djRange, djFavourite, djQuery, djTag), 200);
		ppt.trackCount = 0;
	}

	getTrack(length, list, dj_lib) {
		if (!length) return;
		this.setBias();
		const lfmRadio = ppt.lfmRadio && dj.mode < 2 && dj.type != 3;
		const artistType = lfmRadio ? (dj.type ? 1 : 0) : 1;
		const t_ind = this.getIndex(dj_lib, list, length, artistType, 0);
		if (!lfmRadio) this.playedTracks.push(t_ind);
		if (this.playedTracks.length > length - 1) this.playedTracks.splice(0, 1);
		ppt.playedTracks = JSON.stringify(this.playedTracks);
		if (!dj_lib && artistType) {
			this.playedArtists.push($.strip(list[t_ind].artist));
			if (this.playedArtists.length > 6) this.playedArtists.splice(0, 1);
			ppt.playedArtists = JSON.stringify(this.playedArtists);
		}
		return t_ind;
	}

	getIndex(dj_lib, list, listLength, artistType, titleType) {
		const pp1 = dj_lib || artistType < 2 ? this.pop1 : 0.8;
		const pp2 = dj_lib || artistType < 2 ? this.pop2 : 0.2;
		let ind = Math.floor(listLength * Math.random());
		let j = 0;
		switch (dj_lib) {
			case 0:
				while (((pp1 > 0.1 && artistType != 3 ? ((((1 - ind / listLength) * pp1 + pp2) + Math.random()) <= 1) : false) || (artistType ? this.playedArtists.includes(artistType > 1 ? ind + 1 : $.strip(list[ind].artist)) : false) || (artistType < 2 ? this.xmasSong(list[ind].title) : false) || (artistType < 2 && titleType < 2 ? this.playedTracks.includes(titleType ? $.strip(list[ind].title) : ind) : false)) && j < listLength) {
					ind = Math.floor(listLength * Math.random());
					j++;
				}
				break;
			case 1:
				while (((pp1 > 0.1 ? ((((1 - ind / listLength) * pp1 + pp2) + Math.random()) <= 1) : false) || (artistType ? this.playedArtists.includes($.strip(list[ind].artist)) : false) || this.xmasSong(list[ind].title) || this.playedTracks.includes(titleType ? list[ind].title : ind)) && j < listLength) { // <-title already stripped
					ind = Math.floor(listLength * Math.random());
					j++;
				}
				break;
			case 2:
				while (((pp1 > 0.1 ? ((((1 - ind / listLength) * pp1 + pp2) + Math.random()) <= 1) : false) || (artistType ? this.playedArtists.includes($.strip(tf.artist0.EvalWithMetadb(list[ind]))) : false) || this.xmasSong(tf.title0.EvalWithMetadb(list[ind])) || this.playedTracks.includes($.strip(tf.title0.EvalWithMetadb(list[ind])))) && j < listLength) {
					ind = Math.floor(listLength * Math.random());
					j++;
				}
				break;
		}
		return ind;
	}

	getRange(djType, r, djMode) {
		if (djType == 3 && ppt.lfmRadio && djMode < 2) return 250;
		r = $.clamp(r, 0, this.pool.length - 1);
		let range = 50;
		if (djType != 1 && djType != 3) {
			range = djType ? this.pool[r] : Math.max(this.pool[r], 50);
			if (isNaN(range)) range = 50;
			range = Math.min(range, 1000);
		} else if (djType == 1) {
			range = this.pool[r] * this.feed.tag[1];
			range = $.clamp(range, 10, 1000);
			if (isNaN(range)) range = 500;
		} else {
			range = this.pool[r] * this.feed.song[1];
			range = $.clamp(range, 10, 250);
			if (isNaN(range)) range = 250;
		}
		return Math.floor(range);
	}

	load(djSource, djMode, djType, djVariety, djRange, djFavourite, djQuery, djTag) {
		// lfmRadio doesn't need info traces & they're not called: djMode always 1
		const logName = !ppt.playlistSoftMode ? this.n[djMode] + this.nm[djMode] + ': ' : '';
		if (djMode == 3 && ppt.autoDJFilter) $.trace(this.n[djMode] + this.nm[djMode] + (dj.filter.length ? ': ' + 'Library Tracks Skipped: ' + dj.filter : ''));
		if (djMode < 2 || (djType == 2 || djType == 4)) {
			dj.searchForArtist(djSource, djMode, djType, djVariety, djMode ? this.getRange(djType, djRange) : '', djType != 1 && djType != 3 && this.getRange(djType, djRange) < 101 && ppt.curPop ? true : false, djFavourite);
			if (djMode > 1 && djType == 4) $.trace(logName + (djMode == 2 ? 'Filtered Library for Tracks in Last.fm Top Tracks Lists for Top "' + djSource + '" Artists' : 'Last.fm Top "' + djSource + '" Artists: Pool: Matching Library Tracks') + '\nIndependent of Genre Tags in Music Files');
			if (djMode > 1 && djType == 2) $.trace(logName + (djMode == 2 ? 'Filtered Library for Tracks in Last.fm Top Tracks Lists for "' : 'Pool: Library Tracks for "') + djSource + ' and Similar Artists"');
		} else if (djType < 2 || djType == 3) {
			dj.medLib('', djSource, djMode, djType, 'N/A', djMode == 1 ? '' : this.getRange(djType, djRange), djQuery, djTag);
			let qAlt = '';
			if (djTag == 'locale') {
				const altSource = men.getDemonym(djSource);
				qAlt = ' OR ' + name.field[djTag].replace(/QuErY/g, ' IS ').replace(/nAmE/g, altSource);
			}
			$.trace(logName + (djMode == 2 ? 'Filtered Library for Tracks in Last.fm Top Track List for "' + djSource + '"' + (djType == 1 ? '\nIndependent of Genre Tags in Music Files' : '') : (!djQuery ? (djType == 0 ? name.field.artist : name.field[djTag].replace(/QuErY/g, ' IS ').replace(/nAmE/g, djSource) + qAlt) : 'Query: ' + djSource) + ': Pool: Matching Library Tracks'));
		}
	}

	libDjLoad(items, djType, mode, list) {
		const handleList = new FbMetadbHandleList();
		const pn = pl.dj();
		const no = dj.get_no(dj.limit, plman.PlaylistItemCount(pn));
		let count, h_ind;
		this.setBias();
		switch (mode) {
			case 2: // lfmData
				count = items.length;
				if (count < this.limit + 2) return;
				for (let i = 0; i < no; i++) {
					h_ind = djType != 1 && djType != 3 ? this.getIndex(1, items, count, djType ? 1 : 0, 1) : this.getTrack(count, items, 1);
					if (!list || !list.Count) return;
					handleList.Add(list[items[h_ind].id]);
					if (count) {
						this.playedArtists.push($.strip(items[h_ind].artist));
						if (this.playedArtists.length > 6) this.playedArtists.splice(0, 1);
						ppt.playedArtists = JSON.stringify(this.playedArtists);
					}
					if (count && djType != 1 && djType != 3) {
						this.playedTracks.push(items[h_ind].title);
						if (this.playedTracks.length > Math.floor(count * 0.9)) this.playedTracks = [];
						ppt.playedTracks = JSON.stringify(this.playedTracks);
					}
				}
				break;
			case 3: // ownData
				count = items.Count;
				if (count < this.limit + 2) return;
				for (let i = 0; i < no; i++) {
					h_ind = this.getIndex(2, items, count, djType ? 1 : 0, 0);
					handleList.Add(items[h_ind]);
					if (count) {
						this.playedArtists.push($.strip(tf.artist0.EvalWithMetadb(items[h_ind])));
						this.playedTracks.push($.strip(tf.title0.EvalWithMetadb(items[h_ind])));
						if (this.playedArtists.length > 6) this.playedArtists.splice(0, 1);
						ppt.playedArtists = JSON.stringify(this.playedArtists);
						if (this.playedTracks.length > Math.floor(count * 0.9)) this.playedTracks = [];
						ppt.playedTracks = JSON.stringify(this.playedTracks);
					}
				}
				break;
		}
		if (handleList.Count) {
			panel.add_loc.timestamp = Date.now();
			plman.UndoBackup(pn);
			plman.InsertPlaylistItems(pn, plman.PlaylistItemCount(pn), handleList);
		}
	}

	pref_yt(kw, n) {
		try {
			if (n && RegExp(kw, 'i').test(n)) return true;
			return false;
		} catch (e) {
			$.trace("Syntax error in custom regular expression. Panel Property: YouTube 'Preference'...");
			return false;
		}
	}

	reset_add_loc() {
		panel.add_loc.std = [];
		yt_dj.added = 'init';
		yt_dj.received = 0;
		yt_dj.hl = new FbMetadbHandleList();
		yt_dj.searchParams = [];
	}

	setBias() {
		this.pop2 = !ppt.cusBestTracksBias ? this.weight[this.cur_dj_type][this.cur_dj_mode - 1] : this.calcBias(ppt.cusBestTracksBias);
		if (ppt.cur_dj_mode == 3) {
			if (ppt.sortAutoDJ != 2) {
				if (ppt.cur_dj_query) this.pop2 = !ppt.cusBestTracksBias ? this.weight[5][2] : this.calcBias(ppt.cusBestTracksBias);
			} else {
				this.pop2 = !ppt.cusBestTracksBias ? 0.9 : this.calcBias(ppt.cusBestTracksBias);
			}
		}
		if (dj.filter && dj.filterLevel && !ppt.cusBestTracksBias && (this.cur_dj_mode == 3 || this.cur_dj_mode == 2 && this.cur_dj_type == 2)) {
			this.pop2 = (1 - this.pop2) * dj.filterLevel + this.pop2
		}
		if (!dj.filter && !ppt.cusBestTracksBias && this.cur_dj_mode == 3 && this.cur_dj_type != 2 && this.cur_dj_type != 0 && dj.list.items.Count < 1000) {
			const level = 0.5 - (dj.list.items.Count - 50) / 950 * 0.4;
			this.pop2 = (1 - this.pop2) * level + this.pop2
		}
		this.pop1 = 1 - this.pop2;
	}

	track(list, artist, name, djMode, cur) {
		if (!list.length) return 0;
		const extend_pool = this.pool[this.cur_dj_range];
		const pc_adjust = cur ? ppt.pc_cur_adjust / 3334 : ppt.pc_at_adjust / 20000;
		const sw = extend_pool < 51 ? 0 : extend_pool < 100 ? 1 : 2
		let extend = false;
		let filter, h_ind = 0;
		let min_pool = extend_pool * (extend_pool < 251 ? 0.15 : 0.12);
		let pool = 0;
		let threshold = 1000 * pc_adjust / extend_pool * 1000 / 6;
		let min_filter = threshold * 0.3; /*calc before higher hot values*/
		if (extend_pool < 100) threshold = Math.min(threshold * 2.25 * (100 - extend_pool) / 25, 15000 * pc_adjust);
		min_pool = Math.floor(sw == 1 ? min_pool - 1 : extend_pool > 149 ? Math.max(min_pool, 25) : min_pool);
		const h_factor = Math.max(4 * min_pool / 7, 3); /*calc before min value set*/
		if (min_pool < 7) min_pool = Math.min(extend_pool, 7);
		const seed_pool = Math.floor(min_pool * (extend_pool < 126 ? 3 : 2.5));
		if (djMode != 2 || !artist) {
			if (sw) extend = Math.random() < 0.6 ? false : true;
		} else extend = true;
		const max_pool = Math.min(sw == 0 ? extend_pool : extend ? extend_pool : sw == 1 ? 50 : Math.round(extend_pool / 2), list.length);
		if (artist && this.playedTracks.length > Math.min(Math.floor(list.length * 0.9), 100)) {
			this.playedTracks = [];
			ppt.playedTracks = JSON.stringify(this.playedTracks);
		}
		this.setBias();
		if (djMode == 1 && ppt.refineLastfm || djMode == 2) {
			threshold += Math.floor(threshold * 2 / 3 * Math.random());
			if (!artist) threshold *= Math.min(1 / this.pop2, 5) / 5;
			if (extend) threshold /= sw == 1 ? 1.5 : 2;
			if (this.cur_dj_source == name) {
				min_pool = this.basePool(list, min_filter * (extend_pool < 101 ? 0.85 : 1), max_pool) > seed_pool ? Math.max(seed_pool, 50) : Math.min(seed_pool, 50);
				filter = Infinity;
			} else {
				filter = Math.max(list.length > 2 ? (parseFloat(list[0].playcount) + parseFloat(list[1].playcount) + parseFloat(list[2].playcount)) / (h_factor * 3) : parseFloat(list[0].playcount) / h_factor);
				filter = !artist ? Math.max(min_filter, filter) : Math.min(min_filter * (extend_pool < 101 ? 0.65 : 0.75), filter);
				if (artist && !ppt.trackCount && djMode == 1) ppt.trackCount = Math.max(this.basePool(list, filter, extend_pool), 50);
			}
			filter = Math.min(threshold, djMode == 2 && !artist && filter * h_factor < threshold ? Infinity : filter);
			pool = this.basePool(list, filter, max_pool);
			pool = $.clamp(min_pool, pool, list.length);
			if (artist) pool = Math.max(pool, 50);
			if (!artist && djMode == 1) {
				this.lot = pool + this.lot;
				this.counter++;
				if (!ppt.trackCount) ppt.trackCount = Math.round(extend_pool * this.cur_lfm_variety / 2);
				else if (!(this.counter % dj.limit) || !dj.limit && this.counter > 1) ppt.trackCount = Math.round(this.lot * this.cur_lfm_variety / this.counter);
				txt.repaint();
			}
		} else {
			pool = Math.min(max_pool, list.length);
			if (!ppt.trackCount && djMode == 1) ppt.trackCount = !artist ? Math.round(extend_pool * this.cur_lfm_variety) : Math.min(extend_pool, list.length);
		}
		if (djMode == 2) return pool;
		h_ind = this.getIndex(0, list, Math.min(list.length, pool), 0, 1);
		if (!artist && this.playedTracks.includes($.strip(list[h_ind].title)) || this.xmasSong(list[h_ind].title)) h_ind = this.getIndex(0, list, Math.min(list.length, max_pool), 0, 2);
		this.playedTracks.push($.strip(list[h_ind].title));
		if (this.playedTracks.length > 100) this.playedTracks.splice(0, 1);
		ppt.playedTracks = JSON.stringify(this.playedTracks);
		return h_ind;
	}

	xmasSong(title) {
		const kw = "christmas|xmas|(?=.*herald)\\bhark|mary's\\s*boy|santa\\s*baby|santa\\s*claus";
		const d = new Date();
		const n = d.getMonth();
		if (n == 11 || RegExp(kw, 'i').test(this.cur_dj_source)) return false;
		else if (!RegExp(kw, 'i').test(title)) return false;
		else return true;
	}
}

class AutoDJ {
	constructor() {
		this.artists = {libHandles: new FbMetadbHandleList(), plHandles: new FbMetadbHandleList()}
		this.artVariety = index.cur_dj_type == 2 || index.cur_dj_type == 4 ? index.cur_lfm_variety : 'N/A';
		this.curPop = ppt.curPop;
		this.cur_text = '';
		this.fav;
		this.filter = '';
		this.filterLevel = 0;
		this.finished = false;
		this.force_refresh = 0;
		this.id = 0;
		this.mode = index.cur_dj_mode;
		this.param = false;
		this.partLoad = false;
		this.pss = !ui.dui && window.IsTransparent && utils.CheckComponent('foo_uie_panel_splitter', true);
		this.query = index.cur_dj_query;
		this.source = index.cur_dj_source;
		this.type = index.cur_dj_type;
		this.timer = null;
		this.search;
		this.sim1Set = false;
		this.songHot = index.getRange(this.type, index.cur_dj_range, this.mode);
		this.stndLmt = Math.min(this.stndLmt, 25);
		this.sync = false;
		this.text = '';
		this.updateFav = true;

		this.list = {
			items: [],
			index: 0,
			isCurPop: false,
			query: new FbMetadbHandleList(),
			origCount: 0,
			origItems: [],
			origIndex: 0,
			origQuery: new FbMetadbHandleList(),
		}

		this.txt = {
			h: 0,
			y: 0
		}

		if (!ppt.v) ppt.djPlaylistLimit = $.clamp(ppt.djPlaylistLimit, 2, 50);
		this.limit = ppt.djPlaylistLimit;
		if (!ppt.removePlayed) this.limit = 0;
		ppt.djSearchTimeout = Math.max(ppt.djSearchTimeout, 30000);
		if (ppt.nowPlayingStyle == 1) panel.image.size = 1;
		ppt.autoDJFilter = panel.id.local ? ppt.autoDJFilter.replace('%rating% IS 1', '%_autorating% LESS 20 AND NOT %_autorating% EQUAL 0').trim() : ppt.autoDJFilter.trim();
		if (ppt.autoDJFilterUse && ppt.autoDJFilter.length) this.filter = ppt.autoDJFilter;

		this.f2 = `${panel.cachePath}lastfm\\`;
		$.create(this.f2);
		
		this.getNextTrack = $.debounce(() => {
			this.dldNextTrack();
		}, 3000);
	}

	// Methods

	addLoc(p_rs, p_djMode, p_djType, sort, load, ended, p_tag) {
		if (sort) $.sort(panel.add_loc.std, 'playcount', 'numRev');
		const type = p_djType == 2 ? this.type : p_djType;
		if (!ppt.playlistSoftMode && panel.add_loc.std.length > this.limit + 1 || ppt.playlistSoftMode && panel.add_loc.std.length) {
			if (ended) this.on_dld_dj_tracks_done(true, p_djMode);
			if (load) {
				if (!ended) index.autoDjFound();
				this.list.items = panel.add_loc.std.slice(0);
				if (!ppt.playlistSoftMode) ppt.trackCount = this.list.items.length;
				txt.repaint();
				if (load == 2 || !this.partLoad) {
					const syn = this.sync && plman.PlayingPlaylist == pl.dj() && ppt.removePlayed;
					let np;
					if (syn) np = plman.GetPlayingItemLocation();
					if (syn && np.IsValid) {
						const affectedItems = [];
						const pid = np.PlaylistItemIndex;
						const pn = pl.dj();
						const handleList = plman.GetPlaylistItems(pn);
						for (let i = pid + 1; i < handleList.Count; i++)
							if (!fb.IsMetadbInMediaLibrary(handleList[i])) affectedItems.push(i);
						plman.ClearPlaylistSelection(pn);
						plman.SetPlaylistSelection(pn, affectedItems, true);
						plman.UndoBackup(pn);
						plman.RemovePlaylistSelection(pn, false);
					} else {
						plman.ActivePlaylist = pl.dj();
						if (ppt.removePlayed) {
							pl.clear(plman.ActivePlaylist);
						}
					}
					index.libDjLoad(this.list.items, p_djType, p_djMode, this.list.query);
					this.partLoad = true;
					this.sync = false;
				}
			}
			timer.clear(timer.sim1);
		} else if (ended) this.on_dld_dj_tracks_done(false);
		if (ended) this.sync = false;
		if (ppt.playlistSoftMode && ended && panel.add_loc.std.length) this.createSoftplaylist(panel.add_loc.std.slice(0), p_rs, p_djMode, type, p_tag, true, false);
	}

	calcText(f) {
		let font_h = 20;
		$.gr(1, 1, false, g => font_h = Math.round(g.CalcTextHeight('String', f)));
		return font_h;
	}

	cancel() {
		this.addLoc(this.mode, this.type, true, 1, false);
		this.finished = true;
		timer.clear(timer.sim1);
		timer.clear(timer.sim2);
		timer.clear(timer.yt);
		this.on_dld_dj_tracks_done(false, '', '', '', '', true);
	}

	createSoftplaylist(list, source, mode, type, tag, lfmData, query) {
		let handleList = new FbMetadbHandleList();
		const smartMix = type == 3 && ppt.findOwnData || !lfmData ? !ppt.findOwnDataSort : !ppt.findLfmDataSort;
		if (smartMix) {
			let count = 0;
			let h_ind;
			let no = 0;
			switch (true) {
				case lfmData: // lfmData
					count = !list ? 0 : list.length;
					no = Math.min(ppt.playlistSoftModeLimit, count);
					for (let i = 0; i < no; i++) {
						h_ind = type != 1 && type != 3 ? index.getIndex(1, list, count, type ? 1 : 0, 0) : index.getTrack(count, list, 0);
						if (!this.list.query || !this.list.query.Count) return;
						handleList.Add(this.list.query[list[h_ind].id]);
						if (count) {
							index.playedArtists.push($.strip(list[h_ind].artist));
							if (index.playedArtists.length > 6) index.playedArtists.splice(0, 1);
						}
						list.splice(h_ind, 1);
						count = list.length
					}
					break;
				case !lfmData: // ownData
					count = !list ? 0 : list.Count;
					no = Math.min(ppt.playlistSoftModeLimit, count);
					for (let i = 0; i < no; i++) {
						h_ind = index.getIndex(2, list, count, type ? 1 : 0, 0);
						handleList.Add(list[h_ind]);
						if (count) {
							index.playedArtists.push($.strip(tf.artist0.EvalWithMetadb(list[h_ind])));
							if (index.playedArtists.length > 6) index.playedArtists.splice(0, 1);
						}
						list.RemoveById(h_ind);
						count = list.Count;
					}
					break;
			}
			this.loadSoftplaylist(handleList, source, mode, type, tag, lfmData, query, smartMix);
			return;
		}

		if (lfmData) {
			list.forEach(v => handleList.Add(this.list.query[v.id]));
		}
		let li = lfmData ? handleList : list;
		if (lfmData && !smartMix) {
			if (ppt.findLfmDataSort == 2) li.OrderByFormat(tf.randomize, 1);
			if (ppt.findLfmDataSort == 3) li.OrderByFormat(tf.albumSortOrder, 1);
		}
		this.loadSoftplaylist(li, source, mode, type, tag, lfmData, query, smartMix);
	}

	dldNewTrack() {
		if (this.search) return;
		const ln = this.mode != 3 || ppt.playTracks ? this.list.items.length : this.list.items.Count;
		const get_list = !ln && this.get_no(!ppt.playTracks ? this.limit : false, plman.PlaylistItemCount(pl.dj()));
		if (this.mode == 2 && get_list && !ppt.playTracks) {
			this.search = true;
			this.text = index.n[2] + index.nm[2] + '\nRefreshing...';
			txt.repaint();
		}
		setTimeout(() => this.load(get_list), 300);
	}

	dldNextTrack() {
		if (!this.list.items.length) return;
		index.reset_add_loc();
		const mode = !ppt.playTracks ? this.mode : 0;
		switch (mode) {
			case 0: {
				const tracks = [];
				let playTracksLoaded = $.jsonParse(ppt.playTracksLoaded, false);
				this.list.items.some((v, i) => {
					if (!playTracksLoaded.includes(i)) {
						tracks.push(v);
						playTracksLoaded.push(i);
					}
					return tracks.length == this.get_no(false, plman.PlaylistItemCount(pl.dj()));
				});
				ppt.playTracksLoaded = JSON.stringify(playTracksLoaded);
				tracks.forEach((v, i) => yt_dj.do_youtube_search('playTracks', v.artist, v.title, i, tracks.length, pl.dj(), '', '', v.vid, v.length, v.thumbnail));
				break;
			}
			default: {
				const tracks = this.get_no(this.limit, plman.PlaylistItemCount(pl.dj()));
				const lfmRadio = ppt.lfmRadio && this.mode < 2 && this.type != 3;
				switch (this.type == 4 ? 2 : this.type) {
					case 0:
						for (let i = 0; i < tracks; i++) {
							if (this.list.items.length) {
								const t_ind = lfmRadio ? index.getTrack(this.list.items.length, this.list.items, 0) : index.track(this.list.items, true, '', this.mode, this.list.isCurPop);
								const v = this.list.items[t_ind];
								yt_dj.do_youtube_search('', this.param, v.title, i, tracks, pl.dj(), '', '', v.vid, v.length, v.thumbnail);
								if (lfmRadio) this.list.items.splice(t_ind, 1);
							}
						}
						break;
					case 1:
					case 3:
						for (let i = 0; i < tracks; i++) {
							if (this.list.items.length) {
								const g_ind = index.getTrack(this.list.items.length, this.list.items, 0);
								const v = this.list.items[g_ind];
								yt_dj.do_youtube_search('', v.artist, v.title, i, tracks, pl.dj(), '', '', v.vid, v.length, v.thumbnail);
								if (this.type == 1 && lfmRadio) this.list.items.splice(g_ind, 1);
							}
						}
						ppt.trackCount = this.list.items.length;
						break;
					case 2:
						if (!lfmRadio) {
							if (!ppt.useSaved)
								for (let i = 0; i < tracks; i++) {
									const s_ind = index.artist(this.list.items.length);
									yt_dj.do_lfm_dj_tracks_search(this.type != 4 ? this.list.items[s_ind].name : this.list.items[s_ind], this.mode, this.type == 4 ? 2 : this.type, this.artVariety, this.songHot, this.curPop, i, tracks, pl.dj());
								}
							else {
								let ft;
								for (let l = 0; l < tracks; l++) {
									this.list.items.some(() => {
										const s_ind = index.artist(this.list.items.length);
										const lp = this.type != 4 && $.objHasOwnProperty(this.list.items[0], 'name') ? $.clean(this.list.items[s_ind].name) : $.clean(this.list.items[s_ind]);
										ft = this.f2 + lp.substr(0, 1).toLowerCase() + '\\' + lp + (this.curPop ? ' [curr]' : '') + '.json';
										if (!$.file(ft)) ft = this.f2 + lp.substr(0, 1).toLowerCase() + '\\' + lp + (!this.curPop ? ' [curr]' : '') + '.json';
										return $.file(ft);
									});
									if (!$.file(ft)) return this.on_dld_dj_tracks_done(false);
									const data = $.jsonParse(ft, false, 'file');
									if (!data) return this.on_dld_dj_tracks_done(false);
									const cur = ft.includes(' [curr]');
									if ($.objHasOwnProperty(data[0], 'artist')) data.shift();
									const list = $.take(data, this.songHot).map(yt_dj.titles);
									const art_nm = fso.GetBaseName(ft).replace(' [curr]', '');
									if (list.length) {
										$.sort(list, 'playcount', 'numRev');
										const t_ind = index.track(list, false, art_nm, this.mode, cur);
										const v = list[t_ind];
										yt_dj.do_youtube_search('', art_nm, v.title, l, tracks, pl.dj(), '', '', v.vid, v.length, v.thumbnail);
									}
								}
							}
						} else {
							for (let i = 0; i < tracks; i++) {
								if (this.list.items.length) {
									const g_ind = index.getTrack(this.list.items.length, this.list.items, 0);
									const v = this.list.items[g_ind];
									yt_dj.do_youtube_search('', v.artist, v.title, i, tracks, pl.dj(), '', '', v.vid, v.length, v.thumbnail);
									this.list.items.splice(g_ind, 1);
								}
							}
						}
						break;
				}
				break;
			}
		}
	}

	do_lfm_lib_dj_tracks_search(p_artist, p_djMode, p_djType, p_artVariety, p_songHot, p_curPop, p_i, p_done, p_pn, p_tag) {
		const lfm_lib = new LfmDjTracksSearch(() => lfm_lib.onStateChange(), this.on_lfm_lib_dj_tracks_search_done.bind(this));
		lfm_lib.search(p_artist, p_djMode, p_djType, p_artVariety, p_songHot, p_curPop, p_i, p_done, p_pn, p_tag);
	}

	draw(gr) {
		if (panel.halt()) return;
		const isSoftMode = plman.ActivePlaylist == pl.getSoft();
		if ((!this.search) && (this.on() || isSoftMode)) {
			if (ppt.npTextInfo) {
				if (isSoftMode) {
					const count = plman.PlaylistItemCount(plman.ActivePlaylist);
					this.text = index.cur_find.str ? (plman.PlayingPlaylist == pl.getSoft() ? index.cur_find.str + '\n' : 'Active Playlist' + index.nm[4] + index.cur_find.str + '\n') + (ppt.playlistGenerator + (count ? index.nm[4] + count + ' Tracks' : '')) : $.eval(ppt.tfNowplaying);
					if (ppt.cur_dj_mode != 3 && !ppt.playTracks) {
						gr.GdiDrawText('\uF202', but.font.awesome, ui.col.lfmNowplaying, 3, 0, panel.w, panel.h);
					}
				} else {
					const source = index.cur_dj_tag != 'locale' ? this.source : men.getDemonym(this.source) +  ' Artists';
					const lfmRadio = ppt.lfmRadio && this.mode < 2;
					this.text = source ? 
					(
						!ppt.playTracks ? (
							plman.PlayingPlaylist == pl.getDJ() ? 
							source + (this.type == 2 ? ' and Similar Artists' : '') + '\n' : 
							'Active Playlist' + index.nm[4] + source + (this.type == 2 ? ' and Similar Artists' : '') + '\n'
						) + 
						(
						lfmRadio ? ppt.lfmRadioName : 
							(
								index.n[this.mode] + index.nm[this.mode] + 
								(ppt.trackCount ? index.nm[4] + 'Pool ' +  ppt.trackCount + ' Tracks' : '')
							)
						) :
					source /*<ppt.playTracks*/
					) : $.eval(ppt.tfNowplaying);
					if (ppt.cur_dj_mode != 3 && !ppt.playTracks) {
						gr.GdiDrawText('\uF202', but.font.awesome, ui.col.lfmNowplaying, 3, 0, panel.w, panel.h);
					}
				}
			} else {
				const origT = this.text;
				this.text = $.eval(ppt.tfNowplaying);
				if (!this.text && fb.IsPlaying) this.text = origT;
			}
		} else if (!this.search && ppt.npTextInfo) {
			const count = plman.PlaylistItemCount(plman.ActivePlaylist);
			let label = count != 1 ? ppt.playlistTracks : ppt.playlistTracks.slice(0, -1)
			this.text = `Active Playlist${index.nm[4]}${count} ${label}\n${plman.GetPlaylistName(plman.ActivePlaylist)}`;
		} else if (!this.search || !this.text) this.text = $.eval(ppt.tfNowplaying);
		if (ui.style.textOnly) gr.GdiDrawText(this.text, ui.font.nowPlayingLarge, ui.col.text, 10, 10, panel.w - 20, panel.h - 20, txt.cc);
		if (panel.image.size == 1 || ui.style.textOnly) return;
		if (ppt.npShadow && (!ui.style.isBlur || !timer.transition.id)) gr.GdiDrawText(this.text, ui.font.nowPlaying, ui.outline(ui.col.text), 10 + 1, this.txt.y + 1, panel.w - 20, this.txt.h, txt.cc);
		gr.GdiDrawText(this.text, ui.font.nowPlaying, ui.col.text, 10, this.txt.y, panel.w - 20, this.txt.h, txt.cc);
	}

	feedback(noFav) {
		if (this.text == this.cur_text) return;
		txt.repaint();
		this.search = false;
		this.cur_text = this.text;
		if (noFav) return;
		if (ppt.autoFav && this.updateFav) fav.addCurrentStation(this.source, index.cur_dj_type, index.cur_dj_tag, index.cur_dj_query);
		this.updateFav = false;
	}

	get_no(dj_limit, dj_pl_count) {
		if (dj_limit && dj_pl_count >= dj_limit) return 0;
		else return dj_limit ? dj_limit - dj_pl_count : 1;
	}

	load(get_list) {
		if (get_list) this.sync = true;
		const mode = !ppt.playTracks ? this.mode : 0;

		if (mode > 1) {
			if (get_list) {
				if (this.type == 2 || this.type == 4) {
					return this.searchForArtist(this.source, mode, this.type, this.artVariety, this.songHot, this.type != 1 && this.type != 3 && this.songHot < 101 && this.curPop ? true : false);
				} else return this.medLib('', this.source, mode, this.type, 'N/A', this.songHot, this.query, index.cur_dj_tag);
			} else return mode == 2 ? index.libDjLoad(this.list.items, this.type, mode, this.list.query) : index.libDjLoad(this.list.items, this.type, mode);
		}
		if (get_list) {
			if (!mode) this.loadnPlay();
			else this.searchForArtist(this.source, mode, this.type, this.artVariety, this.songHot, this.type != 1 && this.type != 3 && this.songHot < 101 && this.curPop ? true : false);
		} else {
			if (mode || !timer.yt.id) this.getNextTrack();
		}
	}

	loadnPlay() {
		let type = 'new'
		if (!alb.playlist.length) {
			alb.playlist = $.jsonParse(ppt.playTracksList, []);
			type = 'reload';
		}
		ppt.playTracks = alb.playlist.length ? true : false;
		if (ppt.playTracks) {
			const q = lib.partialMatch.artist && lib.partialMatch.type[1] != 0 ? ' HAS ' : ' IS ';
			this.artists = $.getArtists(alb.playlist, q, true);
			yt_dj.execute(this.on_dld_dj_tracks_done.bind(this), '', 0, type, '', '', Math.max(alb.limit, 5), '', pl.dj());
			window.NotifyOthers('fp_playTracks', true);
		}
	}

	loadSoftplaylist(handleList, source, mode, type, tag, lfmData, query, smartMix) {
		let pln = pl.soft();
		pl.clear(pln);
		plman.InsertPlaylistItems(pln, 0, handleList, false);
		plman.ActivePlaylist = pln;
		if (ppt.findSavePlaylists) {
			pln = plman.FindOrCreatePlaylist(`${smartMix ? ppt.playlistSmartMix : ppt.playlistGenerator}: ${source + (type == 2 ? ' and Similar Artists' : '')}`, false);
			pl.clear(pln);
			plman.InsertPlaylistItems(pln, 0, handleList, false);	
		}
		source = tag != 'locale' ? source : men.getDemonym(source) + ' Artists';
		index.cur_find = {
			mode: mode,
			query: query,
			source: source,
			str: source + (type == 2 ? ' and Similar Artists' : ''),
			tag: tag,
			type: type
		}
		ppt.cur_find = JSON.stringify(index.cur_find);
		if (ppt.autoFav) fav.addCurrentStation(source, type, tag, query);
		this.list.query = this.list.origQuery.Clone();
	}

	mbtn_up(x, y) {
		if (ppt.showAlb || panel.halt() || ui.style.textOnly || x < 0 || y < 0 || x > panel.w || y > panel.h) return;
		ppt.nowPlayingStyle = ppt.nowPlayingStyle == 1 ? 0 : 1;
		const noLines = ppt.tfNowplaying.split('$crlf()').length; 
		const spacer = (ppt.bor * 0.625 + 16) * 2.67 + ui.font.nowPlaying.Size * noLines;
		panel.image.size = ppt.nowPlayingStyle == 1 ? 1 : 1 - spacer / panel.h;
		img.on_size();
		img.updSeeker();
		this.on_size();
		if (panel.video.mode && this.pss) {
			this.force_refresh = 2;
			this.refreshPSS();
		}
		but.refresh(true);
	}

	medLib(data, p_djSource, p_djMode, p_djType, p_artVariety, p_songHot, p_query, p_tag) {
		let a = '';
		let i = 0;
		let j = 0;
		let q_t = lib.partialMatch.artist && lib.partialMatch.type[3] != 0 ? ' HAS ' : ' IS ';
		index.reset_add_loc();
		if (this.id == 19) this.id = 0;
		else this.id++;
		this.list.query = new FbMetadbHandleList();
		this.finished = true;
		this.partLoad = true;
		this.sim1Set = true;
		timer.clear(timer.sim1);
		timer.clear(timer.sim2);
		timer.clear(timer.yt);
		data = [...new Set(data)];
		if (!data && p_djMode == 2 && (p_djType == 2 || p_djType == 4)) return this.on_dld_dj_tracks_done(false, '', 0, true);
		this.finished = false;
		this.partLoad = false;
		this.sim1Set = false;
		this.source = p_djSource;
		this.mode = p_djMode;
		this.type = p_djType;
		this.artVariety = p_artVariety;
		if (p_songHot) this.songHot = p_songHot;
		this.query = p_query;
		switch (this.mode) {
			case 2:
				switch (this.type) {
					case 0:
						if (lib.inLibraryArt(this.source.toLowerCase())) {
							this.do_lfm_lib_dj_tracks_search(this.source, this.mode, this.type, this.artVariety, this.songHot, false, this.id, 0, 0, p_tag);
						} else return this.on_dld_dj_tracks_done(false);
						break;
					case 1:
					case 3:
						this.do_lfm_lib_dj_tracks_search(this.source, this.mode, this.type, this.artVariety, this.songHot, false, this.id, 0, 0, p_tag);
						break;
					default: {
						let done = 0;
						let q = '(NOT %path% HAS !!.tags) AND (';
						j = 0;
						data.some(v => {
							a = this.type != 4 && $.objHasOwnProperty(data[0], 'name') ? v.name : v;
							a = a.toLowerCase();
							const query = q_t == ' IS ' ? name.field.artist + q_t + a : $.queryArtist(a);
							if (lib.inLibraryArt(a)) {
								q += (j ? ' OR ' : '') + query;
								if (j == this.artVariety - 1) {
									done = j + 1;
									return true;
								} else {
									j++;
									done = j;
								}
							}
						});
						if (!done) return this.on_dld_dj_tracks_done(false);
						q += ')';
						this.list.query = $.query(lib.getLibItems(), q);
						lib.djRefine(this.list.query);
						j = 0;
						i = 0;
						timer.sim2.id = setTimeout(() => {
							this.finished = true;
							timer.clear(timer.sim1);
							timer.sim2.id = null;
							this.addLoc(this.source, this.mode, this.type, true, 1, true);
						}, ppt.djSearchTimeout);
						timer.yt.id = setInterval(() => {
							if (i < data.length && j < this.artVariety) {
								a = this.type != 4 && $.objHasOwnProperty(data[0], 'name') ? data[i].name : data[i];
								if (lib.inLibraryArt(a.toLowerCase())) {
									this.do_lfm_lib_dj_tracks_search(a, this.mode, this.type == 4 ? 2 : this.type, this.artVariety, this.songHot, false, this.id, done, 0, p_tag);
									j++;
								}
								i++;
							} else timer.clear(timer.yt);
						}, 20);
						break;
					}
				}
				break;
			case 3: {
				if (this.type > 1 && !data) return this.on_dld_dj_tracks_done(false, '', 0, true);
				let q = '';
				const source = this.source.toLowerCase();
				switch (this.type) {
					case 0:
						q += q_t == ' IS ' ? name.field.artist + q_t + source : $.queryArtist(source);
						break;
					case 1: {
						let qAlt = '';
						if (p_tag == 'locale') {
							const altSource = men.getDemonym(this.source).toLowerCase();
							qAlt = ' OR ' + name.field[p_tag].replace(/QuErY/g, ' IS ').replace(/nAmE/g, altSource)
						}
						q = !this.query ? name.field[p_tag].replace(/QuErY/g, ' IS ').replace(/nAmE/g, source) + qAlt : source;
						break;
					}
					default:
						j = 0;
						data.some(v => {
							a = this.type != 4 && $.objHasOwnProperty(data[0], 'name') ? v.name : v;
							a = a.toLowerCase();
							const query = q_t == ' IS ' ? name.field.artist + q_t + a : $.queryArtist(a);
							if (lib.inLibraryArt(a)) {
								q += (j ? ' OR ' : '') + query;
								if (j == this.artVariety - 1) return true;
								j++;
							}
						});
						break;
				}
				if (!j && this.type > 1) return this.on_dld_dj_tracks_done(false);
				this.list.query = $.query(lib.getLibItems(), q);
				if (this.filter) {
					let skipItems = $.query(this.list.query, this.filter);
					skipItems.Sort();
					this.list.query.Sort();
					const preFilterCount = this.list.query.Count;
					this.list.query.MakeDifference(skipItems);
					const postFilterCount = this.list.query.Count;
					this.filterLevel = (preFilterCount - postFilterCount) / preFilterCount;
					const min = this.limit * 2 > 30 ? 30 : Math.max(this.limit * 2, 10);
					if (this.list.query.Count < min) {
						this.list.query = $.query(lib.getLibItems(), q);
						this.list.query.RemoveRange(min, this.list.query.Count - 1);
					}
				}
				this.list.query.OrderByFormat(tf.randomize, 1);
				if (ppt.sortAutoDJ < 2) {
					this.list.query.OrderByFormat(FbTitleFormat([ml.playcount, ml.rating, ml.popularity][ppt.sortAutoDJ]), 0);
				}
				if (ppt.playlistSoftMode) {
					if (this.list.query.Count)  {
						if (ppt.findOwnDataSort < 3) this.list.query.OrderByFormat(FbTitleFormat([ml.playcount, ml.rating, ml.popularity][ppt.findOwnDataSort]), 0);
						else if (ppt.findOwnDataSort == 3) this.list.query.OrderByFormat(tf.randomize, 1);
						else this.list.query.OrderByFormat(tf.albumSortOrder, 1);
					}
				}
				if (!ppt.playlistSoftMode && this.list.query.Count > this.limit + 1 || ppt.playlistSoftMode && this.list.query.Count) {
					ppt.trackCount = this.list.query.Count;
					this.on_dld_dj_tracks_done(true, this.mode, false, false, false, false, this.query);
					this.list.items = this.list.query;
					index.libDjLoad(this.list.items, this.type, this.mode);
					if (ppt.playlistSoftMode) this.createSoftplaylist(this.list.query, p_djSource, p_djMode, p_djType, p_tag, false, p_query);
				} else this.on_dld_dj_tracks_done(false);
				break;
			}
		}
	}

	on() {
		return (ppt.autoRad || ppt.playTracks) && plman.ActivePlaylist == pl.getDJ();
	}

	on_dld_dj_tracks_done(found, p_djMode, p_pn, lfm_na, lib_na, cancel, p_q, type) {
		if (found && ppt.playTracks) {
			ppt.autocompleteIsCaller = 0;
			plman.ActivePlaylist = pl.dj();
			if (type == 'new') {
				if (ppt.removePlayed) pl.clear(plman.ActivePlaylist);
				ppt.playTracksLoaded = JSON.stringify([]);
			}
			this.cur_text = '';
			this.feedback(true);
		} else {
			switch (true) {
				case !ppt.playlistSoftMode:
					if (found) {
						ppt.autocompleteIsCaller = 0;
						if (p_djMode != 2 && !this.sync) {
							plman.ActivePlaylist = pl.dj();
							if (ppt.removePlayed) pl.clear(plman.ActivePlaylist);
						}
						if (type == 'new') ppt.playTracksLoaded = JSON.stringify([]);
						this.cur_text = '';
						this.updateFav = true;
						index.autoDjFound(p_q)
						this.feedback();
					} else {
						this.mode = index.cur_dj_mode = ppt.cur_dj_mode;
						this.artVariety = ppt.cur_lfm_variety;
						this.query = index.cur_dj_query = ppt.cur_dj_query;
						this.source = index.cur_dj_source = ppt.cur_dj_source;
						index.cur_dj_tag = ppt.cur_dj_tag;
						this.type = index.cur_dj_type = ppt.cur_dj_type;
						this.songHot = this.mode ? index.getRange(this.type, ppt.cur_dj_range, this.mode) : '';
						ppt.trackCount = this.list.origCount;
						this.text = cancel ? index.n[2] + '\nSearch Cancelled' : 'Unable To Open Auto DJ\n' + (lib_na ? 'Media Library N/A' : (p_djMode < 2 || lfm_na ? 'Unrecognised Source or Last.fm N/A' : 'Insufficient Matching Tracks In Library'));
						txt.repaint();
						if (!this.timer) {
							this.timer = setTimeout(() => {
								this.search = false;
								txt.repaint();
								this.timer = null;
							}, 5000);
						}
						
						if (ppt.autocompleteIsCaller) men.setAutoDJ('autocompleteType', '', this.text.replace(/\n/g, ': ') + ': Try another');
					}
					break;
				case ppt.playlistSoftMode:
					this.mode = index.cur_dj_mode = ppt.cur_dj_mode;
					this.artVariety = ppt.cur_lfm_variety;
					this.query = index.cur_dj_query = ppt.cur_dj_query;
					this.source = index.cur_dj_source = ppt.cur_dj_source;
					index.cur_dj_tag = ppt.cur_dj_tag;
					this.type = index.cur_dj_type = ppt.cur_dj_type;
					this.songHot = this.mode ? index.getRange(this.type, ppt.cur_dj_range, this.mode) : '';
					ppt.trackCount = this.list.origCount;
					this.list.items = $.isArray(this.list.origItems) ? this.list.origItems.slice() : this.list.origItems.Clone();
					this.list.index = this.list.origIndex;
					if (found) {
						ppt.autocompleteIsCaller = 0;
						this.cur_text = '';
						this.updateFav = false;
						this.feedback();
					} else {
						this.text = cancel ? index.n[2] + '\nSearch Cancelled' : 'Unable To Load Playlist\n' + (lib_na ? 'Media Library N/A' : (p_djMode < 2 || lfm_na ? 'Unrecognised Source or Last.fm N/A' : 'No Matching Tracks In Library'));
						txt.repaint();
						if (!this.timer) {
							this.timer = setTimeout(() => {
								this.search = false;
								txt.repaint();
								this.timer = null;
							}, 5000);
						}
						if (ppt.autocompleteIsCaller) men.setAutoDJ('autocompleteType', '', this.text.replace(/\n/g, ': ') + ': Try another');
					}
					break;
			}
		}
	}

	on_lfm_lib_dj_tracks_search_done(p_artist, p_title, p_i, p_done, p_pn, p_djMode, p_djType, p_curPop, p_songHot, p_tag) { 
		if (p_i != this.id) return;
		let q, q_t = lib.partialMatch.artist && lib.partialMatch.type[3] != 0 ? ' HAS ' : ' IS ';
		switch (p_djType) {
			case 0: {
				if (!p_artist.length || !p_title.length) return this.on_dld_dj_tracks_done(false, '', 0, true);
				$.sort(p_title, 'playcount', 'numRev');
				$.take(p_title, this.songHot);
				q = '(NOT %path% HAS !!.tags) AND (';
				const a = p_artist.toLowerCase();
				const query = q_t == ' IS ' ? name.field.artist + q_t + a : $.queryArtist(a);
				q += query + ')';
				if (ppt.refineLastfm) {
					const pool = index.track(p_title, true, '', 2, false);
					$.take(p_title, pool);
				}
				this.list.query = $.query(lib.getLibItems(), q);
				lib.djRefine(this.list.query);
				p_title.forEach(v => lib.djMatch(p_artist, v.title, v.playcount));
				this.addLoc(this.source, p_djMode, p_djType, false, 2, true, p_tag);
				break;
			}
			case 1:
			case 3: {
				if (!p_artist.length) return this.on_dld_dj_tracks_done(false, '', 0, true);
				const a_arr = [];
				let a = '';
				let a_o = '';
				let j = 0;
				q = '(NOT %path% HAS !!.tags) AND (';
				$.take(p_artist, this.songHot).forEach(v => {
					a = v.artist.toLowerCase();
					if (a != a_o) {
						a_arr.push(a);
						a_o = a;
					}
				});
				a_arr.forEach(v => {
					const query = q_t == ' IS ' ? name.field.artist + q_t + v : $.queryArtist(v);
					if (lib.inLibraryArt(v)) {
						q += (j ? ' OR ' : '') + query;
						j++;
					}
				});
				if (!j) return this.on_dld_dj_tracks_done(false);
				q += ')';
				this.list.query = $.query(lib.getLibItems(), q);
				lib.djRefine(this.list.query);
				p_artist.forEach(v => lib.djMatch(v.artist, v.title, 'N/A'));
				this.addLoc(this.source, p_djMode, p_djType, false, 2, true, p_tag);
				break;
			}
			case 2:
				if (this.finished) return;
				yt_dj.received++;
				if (p_artist.length && p_title.length) {
					$.sort(p_title, 'playcount', 'numRev');
					$.take(p_title, this.songHot);
					if (ppt.refineLastfm) {
						const pool = index.track(p_title, false, p_artist, 2, false);
						$.take(p_title, pool);
					}
					p_title.forEach(v => lib.djMatch(p_artist, v.title, v.playcount));
				}
				this.setText(p_done);
				if (!this.sim1Set && !timer.sim1.id) timer.sim1.id = setInterval(() => {
					this.addLoc(this.source, p_djMode, p_djType, true, 2, false, p_tag);
					this.setText(p_done);
				}, 10000);
				if (timer.sim1.id) this.sim1Set = true;
				timer.clear(timer.sim2);
				timer.sim2.id = setTimeout(() => {
					this.finished = true;
					timer.clear(timer.sim1);
					timer.sim2.id = null;
					this.addLoc(this.source, p_djMode, p_djType, true, 1, true, p_tag);
				}, ppt.djSearchTimeout);
				if (yt_dj.received == p_done) {
					timer.clear(timer.sim1);
					timer.clear(timer.sim2);
					this.addLoc(this.source, p_djMode, p_djType, true, 1, true, p_tag);
				}
				break;
		}
	}

	on_playback_new_track() {
		if ((!ppt.autoRad && !ppt.playTracks) || plman.PlayingPlaylist != pl.getDJ() || !this.source) return;
		this.dldNewTrack();
		timer.dj_chk = true;
	}

	on_size() {
		if (ui.style.textOnly) return;
		if (ppt.autoLayout) {
			this.txt.y = Math.min(panel.h * panel.image.size, panel.h - img.ny);
			this.txt.h = Math.max(img.ny, panel.h * (1 - panel.image.size));
		} else {
			this.txt.h = Math.max(this.calcText(ui.font.nowPlaying) * 2, 1);
			this.txt.y = Math.max(panel.h - this.txt.h, 0);
		}
	}

	refreshPSS() {
		if (this.force_refresh != 2 || !this.pss) return;
		if (fb.IsPlaying || fb.IsPaused) {
			fb.Pause();
			fb.Pause();
		} else {
			fb.Play();
			fb.Stop();
		}
		this.force_refresh = 0;
	}

	removePlayed() {
		const pn_dj = pl.getDJ();
		if (plman.PlayingPlaylist != pn_dj || ppt.playTracks) return;
		const np = plman.GetPlayingItemLocation();
		if (!ppt.autoRad || !this.limit || plman.PlayingPlaylist != pn_dj) return;
		if (plman.PlaylistItemCount(pn_dj) > this.limit - 1) {
			if (np.IsValid) {
				plman.ClearPlaylistSelection(pn_dj);
				for (let i = 0; i < np.PlaylistItemIndex; i++) plman.SetPlaylistSelectionSingle(pn_dj, i, true);
				plman.UndoBackup(pn_dj);
				plman.RemovePlaylistSelection(pn_dj, false);
			}
		}
	}

	searchForArtist(p_djSource, p_djMode, p_djType, p_artVariety, p_songHot, p_curPop, p_dj_fav) {
		this.source = p_djSource;
		this.mode = p_djMode;
		this.type = p_djType;
		this.artVariety = p_artVariety;
		this.songHot = p_songHot;
		this.fav = p_dj_fav;
		this.curPop = p_curPop;
		if (!this.source || this.source == 'N/A') return this.on_dld_dj_tracks_done(false);
		yt_dj.execute(this.on_dld_dj_tracks_done.bind(this), this.source, this.mode, this.type, this.artVariety, this.songHot, this.limit, this.curPop, pl.dj());
	}

	setDjSelection(pn) {
		const play = !alb.playlist.length ? false : ppt.playTracks && ppt.playButtonPlay && alb.playlist[0].executedPlay === false && this.on();
		if (Date.now() - panel.add_loc.timestamp > 5000 && !play) return;
		const np = plman.GetPlayingItemLocation();
		let pid = 0;
		if (plman.PlayingPlaylist == pn && np.IsValid) pid = np.PlaylistItemIndex;
		if (!this.limit) {
			if (!np.IsValid) pid = plman.PlaylistItemCount(pn) - 1;
			plman.EnsurePlaylistItemVisible(pn, plman.PlaylistItemCount(pn) - 1);
		}
		plman.SetPlaylistFocusItem(pn, pid);
		plman.ClearPlaylistSelection(pn);
		plman.SetPlaylistSelectionSingle(pn, pid, true);
		if (play) {
			plman.ExecutePlaylistDefaultAction(pn, 0);
			alb.playlist[0].executedPlay = true;
			ppt.playTracksList = JSON.stringify(alb.playlist);
		}
	}

	setText(p_done) {
		if (!this.partLoad) {
			ppt.trackCount = panel.add_loc.std.length;
			this.text = 'Analysing Library for Last.fm Top Tracks...\nFound ' + ppt.trackCount + ' Tracks' + ' (' + Math.round(yt_dj.received / p_done * 100) + '% Done)';
		} else if (ppt.playlistSoftMode) {
			ppt.trackCount = panel.add_loc.std.length;
			this.text = 'Auto DJ Loaded' + index.nm[4] + 'Playlist Pending...\nFound ' + ppt.trackCount + ' Tracks' + ' (' + Math.round(yt_dj.received / p_done * 100) + '% Done)';
		} else {
			ppt.trackCount = panel.add_loc.std.length;
			this.search = false;
		}
		txt.repaint();
	}

	toggleText(x, y) {
		if (!ui.style.textOnly && y <= Math.min(panel.h * panel.image.size, panel.h - img.ny)) return;
		ppt.toggle('npTextInfo');
		this.refreshPSS();
		txt.paint();
	}
}