'use strict';
const advanced_radio_stream_parser = `${fb.ProfilePath}foo_spider_monkey_panel\\package_data\\{BA9557CE-7B4B-4E0E-9373-99F511E81252}\\advanced_radio_stream_parser.js`;
let isRadioStreamParser = false;
if ($.file(advanced_radio_stream_parser)) {
	include(advanced_radio_stream_parser);
	isRadioStreamParser = true;
}

class Names {
	constructor() {
		this.bioTags = {}
		this.cachedAlbumTags = {}
		this.cachedArtistTags = {}
		this.cur_artist = '';
		this.curAlbumId = '';
		this.curArtistId = '';
		this.genreTags = ['Album Genre AllMusic.1', 'Album Genre Lastfm.0', 'Album Genre Wikipedia.0', 'Artist Genre AllMusic.1', 'Artist Genre Lastfm.0', 'Artist Genre Wikipedia.0'];
		this.lfmUID = '_[a-f0-9]{32}\\.jpg$';
		this.field = {}
		this.tags = {}

		this.collator = new Intl.Collator('en', {sensitivity: 'base'});

		const fields = ['tfArtist', 'tfAlbum', 'tfTitle', 'tfGenre', 'tfLocale', 'tfMood', 'tfTheme'];
		const key = ['artist', 'album', 'title', 'genre', 'locale', 'mood', 'theme'];
		const getQueryFields = n => n.replace(/\$.*?\(/gi, '').replace(/(,(|\s+)\d+)/gi, '').replace(/[,()[\]%]/gi, '|').split('|');

		for (let i = 0; i < key.length; i++) {
			const n = getQueryFields(ppt[fields[i]]).filter(v => v.trim());
			if (i < 3) this.field[key[i]] = n[0] && n[0].trim() || key[i];
			else {
				const fields = n;
				this.tags[key[i]] = fields;
				this.field[key[i]] = '';
				fields.forEach((v, j) => {
					this.field[key[i]] += ((j ? ' OR ' : '') + v.trim() + 'QuErYnAmE');
				});
			}
		}
	}

	// Methods

	art() {
		return alb.artist ? alb.artist : this.artist();
	}
	
	getCachedTags() {
		const artist = this.artist().toUpperCase();
		const album = $.eval('[$meta(album,0)]').toUpperCase();
		let file;
		if (this.curArtistId != artist || this.curAlbumId != `${artist} - ${album}`) {
			const filePath = `${panel.cachePath}database.db`;
			file = $.jsonParse(filePath, {}, 'file');
		}
		if (this.curArtistId != artist) {
			this.cachedArtistTags = $.getProp(file, `${artist}.ARTIST TAGS`, {});
			this.curArtistId = artist;
		}
		if (this.curAlbumId != `${artist} - ${album}`) {
			this.cachedAlbumTags = $.getProp(file, `${artist}.ALBUM TAGS.${album}`, {});
			this.curAlbumId = `${artist} - ${album}`;
		}
	}

	artist(focus) {
		let artist = $.eval('$trim(' + ppt.tfArtist + ')', focus);
		const radioTrackArtist = !isRadioStreamParser || !panel.isRadio(focus) ? '' : radioStreamParser.getStreamInfo(focus).artist;
		return radioTrackArtist || artist;
	}

	artist_title() {
		return this.artist() && this.title() ? this.artist() + ' | ' + this.title() : 'N/A';
	}
	
	artists() {
		const curArtist = this.artist();
		let n = $.eval('$meta(artist),$meta(album artist),$meta(performer),$meta(composer)').split(',');
		n = [...new Set(n.map(v => v.replace(/&/g, '&&').trim()).filter(Boolean).filter(v => (v != curArtist) && (v.toLowerCase() != 'various artists')))].sort((a, b) => this.collator.compare(a, b));
		return n ? n : 'N/A';
	}

	similarArtists() {
		const seed = this.artist();
		const fo = dj.f2 + seed.charAt(0).toLowerCase() + '\\';
		const fln = fo + seed + ' and Similar Artists.json';
		let list = $.jsonParse(fln, [], 'file');
		list = list.map(v => v.name.replace(/&/g, '&&'));
		list.shift();
		if (!list.length) {
			this.getCachedTags();
			list = $.getProp(this.cachedArtistTags, 'Similar Artists Lastfm', []);
		}
		
		let relatedArtists = name.artists();
		$.take(relatedArtists, 10);
		if (relatedArtists.length) relatedArtists.unshift('More tags:')
		if (list.length) list.unshift('Similar:'),
		relatedArtists = relatedArtists.concat(list);
		$.take(relatedArtists, 25);
		return relatedArtists;
	}

	genre() {
		let g = $.eval('$trim(' + ppt.tfGenre + ')');
		if (!g) {
			this.getCachedTags();
			this.genreTags.some(v => g = $.getProp(this.cachedAlbumTags, v, ''));
			if (!g) this.genreTags.some(v => g = $.getProp(this.cachedArtistTags, v, ''));
		}
		return g ? g : 'N/A';
	}
	
	curTags() {
		const tagSet = {}
		for (const [key, value] of Object.entries(this.tags)) {
			tagSet[key] = [];
				value.forEach(v => { // generate object: each key has array of music file values
					tagSet[key] = [...tagSet[key], ...$.eval('$meta(' + v + ')').split(',')];
				});
		};

		for (const [key, value] of Object.entries(this.cachedAlbumTags)) {
			['genre', 'locale', 'mood', 'theme'].forEach(v => { // merge values in bioTags
				if (RegExp(v, 'i').test(key)) tagSet[v] = [...tagSet[v], ...value];
			});
		}
		
		for (const [key, value] of Object.entries(this.cachedArtistTags)) {
			['genre', 'locale', 'mood', 'theme'].forEach(v => { // merge values in bioTags
				if (RegExp(v, 'i').test(key)) tagSet[v] = [...tagSet[v], ...value];
			});
		}

		for (const [key, value] of Object.entries(tagSet)) {
			tagSet[key] = [...new Set(value.map(v => v.replace(/&/g, '&&').trim()).filter(Boolean))];
			if (key == 'genre') tagSet[key].sort((a, b) => this.collator.compare(a, b));
		}
		return tagSet;
	}

	isLfmImg(fn, artist) {
		if (artist) {
			if (artist != this.cur_artist) {
				artist = $.regexEscape($.clean(artist));
				this.cur_artist = artist;
			}
			return RegExp(`^${artist + this.lfmUID}`, 'i').test(fn);
		} else return RegExp(this.lfmUID, 'i').test(fn);
	}

	title(focus) {
		let title = $.eval('$trim(' + ppt.tfTitle + ')', focus);
		const radioTrackTitle = !isRadioStreamParser || !panel.isRadio(focus) ? '' : radioStreamParser.getStreamInfo(focus).title;
		return radioTrackTitle || title;
	}

	decade() {
		let n = $.eval('$trim(' + ppt.tfDate + ')');
		if (n) n = `${n.replace(/&/g, '&&').slice(ppt.longDecadesFormat ? 0 : 2, 3)}0s`;
		return n ? n : 'N/A';
	}

	locale() {
		let n = $.eval('$trim(' + ppt.tfLocale + ')');
		if (!n) {
			this.getCachedTags();
			n = $.getProp(this.cachedArtistTags, 'Locale Lastfm', []);
			n = n[n.length - 1] || '';
		}
		return n ? n : 'N/A';
	}

	mood() {
		let n = $.eval('$trim(' + ppt.tfMood + ')');
		if (!n) {
			this.getCachedTags();
			n = $.getProp(this.cachedAlbumTags, 'Album Mood AllMusic.0', '');
		}
		return n ? n : 'N/A';
	}

	theme() {
		let n = $.eval('$trim(' + ppt.tfTheme + ')');
		if (!n) {
			this.getCachedTags();
			n = $.getProp(this.cachedAlbumTags, 'Album Theme AllMusic.0', '');
		}
		return n ? n : 'N/A';
	}

	year() {
		const n = $.eval('$trim(' + ppt.tfDate + ')');
		return n ? n : 'N/A';
	}
}

class Titleformat {
	constructor() {
		this.artist = FbTitleFormat('%' + name.field.artist + '%');
		this.artist0 = FbTitleFormat('[$meta(' + name.field.artist + ',0)]');
		this.comment = FbTitleFormat('[%comment%]');
		this.length = FbTitleFormat('[%length_seconds_fp%]');
		this.fy_url = FbTitleFormat('[%fy_url%]');
		this.referencedFile = FbTitleFormat('$info(@REFERENCED_FILE)');
		this.album0 = FbTitleFormat('[$meta(' + name.field.album + ',0)]');
		this.albumSortOrder = FbTitleFormat(ppt.albumSortOrder);
		this.videoPopup = FbTitleFormat('[%video_popup_status%]');
		this.randomize = FbTitleFormat('$rand()');
		this.trackGain = FbTitleFormat('[%replaygain_track_gain%]');
		this.trackPeak = FbTitleFormat('[%replaygain_track_peak%]');
		this.title = FbTitleFormat('%' + name.field.title + '%');
		this.title0 = FbTitleFormat('[$meta(' + name.field.title + ',0)]');
		this.title_0 = FbTitleFormat('[$meta(title,0)]');
		this.searchTitle = FbTitleFormat('[$if2(%SEARCH_TITLE%,%YOUTUBE_TRACK_MANAGER_SEARCH_TITLE%)]');
	}
}

class Vkeys {
	constructor() {
		this.selAll = 1;
		this.copy = 3;
		this.ctrl = 17;
		this.ctrlBackspace = 127;
		this.back = 8;
		this.enter = 13;
		this.shift = 16;
		this.paste = 22;
		this.cut = 24;
		this.redo = 25;
		this.undo = 26;
		this.pgUp = 33;
		this.pgDn = 34;
		this.end = 35;
		this.home = 36;
		this.left = 37;
		this.right = 39;
		this.del = 46;
		this.refresh = 116;
	}
}