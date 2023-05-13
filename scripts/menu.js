'use strict';

const MF_GRAYED = 0x00000001;
const MF_STRING = 0x00000000;

class MenuManager {
	constructor(name, clearArr, baseMenu) {
		this.baseMenu = baseMenu || 'baseMenu';
		this.clearArr = clearArr;
		this.func = {};
		this.idx = 0;
		this.menu = {};
		this.menuItems = [];
		this.menuNames = [];
		this.name = name;
	}

	// Methods

	addItem(v) {
		if (v.separator && !v.str) {
			const separator = this.get(v.separator);
			if (separator) this.menu[v.menuName].AppendMenuSeparator();
		} else {
			const hide = this.get(v.hide);
			if (hide || !v.str) return;
			this.idx++;
			if (!this.clearArr) this.executeFunctions(v, ['checkItem', 'checkRadio', 'flags', 'menuName', 'separator', 'str']); // if clearArr, functions redundant & not supported
			const a = this.clearArr ? v : this;
			const menu = this.menu[a.menuName];
			menu.AppendMenuItem(a.flags, this.idx, a.str);
			if (a.checkItem) menu.CheckMenuItem(this.idx, a.checkItem);
			if (a.checkRadio) menu.CheckMenuRadioItem(this.idx, this.idx, this.idx);
			if (a.separator) menu.AppendMenuSeparator();
			this.func[this.idx] = v.func;
		}
	}

	addSeparator({menuName = this.baseMenu, separator = true}) {this.menuItems.push({ menuName: menuName || this.baseMenu, separator: separator});}

	appendMenu(v) {
		const a = this.clearArr ? v : this;
		if (!this.clearArr) this.executeFunctions(v, ['hide', 'menuName']);
		if (a.menuName == this.baseMenu || a.hide) return;
		if (!this.clearArr) this.executeFunctions(v, ['appendTo', 'flags', 'separator', 'str']);
		const menu = this.menu[a.appendTo || this.baseMenu];
		this.menu[a.menuName].AppendTo(menu, a.flags, a.str || a.menuName)
		if (a.separator) menu.AppendMenuSeparator();
	}

	clear() {
		this.menu = {}
		this.func = {}
		this.idx = 0;
		if (this.clearArr) {
			this.menuItems = [];
			this.menuNames = [];
		}
	}

	createMenu(menuName = this.baseMenu) {
		menuName = this.get(menuName);
		this.menu[menuName] = window.CreatePopupMenu();
	}

	executeFunctions(v, items) {
		let i = 0;
		let ln = items.length;
		while (i < ln) {
			const w = items[i];
			this[w] = this.get(v[w])
			i++;
		}
	}

	get(v) {
		if (v instanceof Function) return v(); 
		return v;
	}

	load(x, y) {
		if (!this.menuItems.length) men[this.name]();
		let i = 0;
		let ln = this.menuNames.length;
		while (i < ln) {
			this.createMenu(this.menuNames[i])
			i++;
		}

		i = 0;
		ln = this.menuItems.length;
		while (i < ln) {
			const v = this.menuItems[i];
			!v.appendMenu ? this.addItem(v) : this.appendMenu(v)
			i++;
		}
		const idx = this.menu[this.baseMenu].TrackPopupMenu(x, y);
		this.run(idx);

		this.clear();
	}

	newItem({str = null, func = null, menuName = this.baseMenu, flags = MF_STRING, checkItem = false, checkRadio = false, separator = false, hide = false}) {this.menuItems.push({str: str, func: func, menuName: menuName, flags: flags, checkItem: checkItem, checkRadio: checkRadio, separator: separator, hide: hide});}

	newMenu({menuName = this.baseMenu, str = '', appendTo = this.baseMenu, flags = MF_STRING, separator = false, hide = false}) {
		this.menuNames.push(menuName);
		if (menuName != this.baseMenu) this.menuItems.push({menuName: menuName, appendMenu: true, str: str, appendTo: appendTo, flags: flags, separator: separator, hide: hide});
	}

	run(idx) {
		const v = this.func[idx];
		if (v instanceof Function) v(); 
	}
}

const clearArr = true;
const menu = new MenuManager('mainMenu', clearArr);
const bMenu = new MenuManager('buttonMenu', clearArr);
const lMenu = new MenuManager('listenbrainzMenu', clearArr);
const pMenu = new MenuManager('playMenu', clearArr);
const rMenu = new MenuManager('recommendationMenu');
const tMenu = new MenuManager('tagMenu', clearArr);
const trMenu = new MenuManager('trackMenu', clearArr);
const yMenu = new MenuManager('yearMenu');
const mMenu = new MenuManager('monthMenu');
const dMenu = new MenuManager('dayMenu', clearArr);
const sMenu = new MenuManager('siteMenu');
const filterMenu = new MenuManager('filterMenu');
const searchMenu = new MenuManager('searchMenu');

class MenuItems {
	constructor() {
		const chartDate = ppt.chartDate.toString();
		this.artists = {};
		this.countries = {};
		this.decadeArr = [];
		this.demonyms = {};
		this.djOn = false;
		this.genreArr = [];
		this.genresMain = [];
		this.genresMore = [];
		this.handleList = new FbMetadbHandleList();
		this.isSoftMode = false;
		this.item = null;
		this.localeArr = [];
		this.moods = {}
		this.moodArr = [];
		this.right_up = false;
		this.songs = {}
		this.themes = {}
		this.themeArr = [];
		this.yearArr = [];

		this.chart = {
			day: parseInt(chartDate.slice(6)),
			month: parseInt(chartDate.slice(4, 6)),
			year: parseInt(chartDate.slice(0, 4))
		}

		this.collator = new Intl.Collator(undefined, {
			sensitivity: 'accent',
			numeric: true
		});

		this.flags = {
			load: [],
			loadTracks: [],
			mTags: [],
			save: []
		}

		this.img = {
			artist: '',
			artistClean: '',
			blacklist: [],
			blacklistStr: [],
			isLfm: true,
			list: [],
			name: ''
		}

		this.name = {
			art: '',
			artist: '',
			artis: '',
			artist_title: '',
			dj: [],
			str: []
		}

		this.path = {
			img: false,
			imgBlackList: '',
			vidBlackList: ''
		}

		this.str = {
			mTags: [],
			save: []
		}

		this.video = {
			blacklist: [],
			blacklistStr: [],
			id: '',
			list: [],
			title: ''
		}

		this.setStyles();
		
		setTimeout(() => {
			this.getMenuLists();
		}, 0);
	}

	// Methods

	mainMenu() {
		menu.newMenu({});
		const cur_tags = name.curTags();
		const decade = name.decade();

		if (ppt.djMode == 2 && (dj.search || timer.sim1.id || timer.sim2.id)) {
			menu.newItem({
				str: 'Cancel auto DJ search',
				func: () => dj.cancel(),
				separator: true
			});
		}

		if (!ppt.btn_mode) {
			menu.newItem({
				str: ppt.showAlb ? 'Show nowplaying' : 'Show albums && tracks',
				func: () => this.toggleNowplaying(),
				separator: true
			});
		}

		menu.newMenu({menuName: 'New autoDJ'});

		menu.newItem({
			menuName: 'New autoDJ',
			str: 'By...',
			flags: MF_GRAYED,
			separator: true
		});

		this.name.dj.forEach((v, i) => {
			menu.newItem({
				menuName: 'New autoDJ',
				str: v.name + '\t' + v.value,
			func: () => {this.loadAutoDJ(); this.setAutoDJ(v);},
			separator: i == this.name.dj.length - 1
			});
		});
		
		menu.newMenu({menuName: 'Favourites...', appendTo: 'New autoDJ'});
		
		if (!fav.stations.length) {
			menu.newItem({
				menuName: 'Favourites...',
				str: 'None'
			});
		} else {
			let djType = index.cur_dj_type;
			if (djType == 4) djType = 1;
			fav.stations.forEach((v, i) => menu.newItem({
				menuName: 'Favourites...',
				str: v.source.replace(/&/g, '&&') + (v.type == 2 ? ' and Similar Artists' : ''),
				func: () => {this.loadAutoDJ(); this.setFavourites(i, index.cur_dj_source, index.cur_dj_type, index.cur_dj_tag, index.cur_dj_query, ppt.lastDjOwnData);},
				checkRadio: this.djOn && index.cur_dj_source + (!index.cur_dj_query ? '' : ' [Query]') == v.source && djType == v.type && index.cur_dj_tag == (v.tag || ''),
				separator: i == fav.stations.length - 1
			}));
		}

		menu.newItem({
			menuName: 'Favourites...',
			str: 'Auto favourites',
			func: () => this.setFavourites(fav.stations.length + 1, index.cur_dj_source, index.cur_dj_type, index.cur_dj_tag, index.cur_dj_query, ppt.lastDjOwnData),
			checkItem: ppt.autoFav,
			separator: !ppt.autoFav
		});
		if (!ppt.autoFav) {
			['Add current', 'Remove current', 'Reset'].forEach((v, i) => menu.newItem({
				menuName: 'Favourites...',
				str: v,
				func: () => this.setFavourites(fav.stations.length + 2 + i, index.cur_dj_source, index.cur_dj_type, index.cur_dj_tag, index.cur_dj_query, ppt.lastDjOwnData)
			}));
		}

		menu.addSeparator({menuName: 'New autoDJ'});

		menu.newItem({
			menuName: 'New autoDJ',
			str: 'Further suggestions:',
			flags: MF_GRAYED
		});

		menu.newMenu({menuName: 'Artist...', appendTo: 'New autoDJ'});
		menu.newItem({
			menuName: 'Artist...',
			str: 'Pick artist:',
			flags: MF_GRAYED
		});
		
		menu.addSeparator({menuName: 'Artist...'});

		const similarArtists = name.similarArtists();
		menu.newMenu({menuName: 'curSimArtists', str: 'All current track artists', appendTo: 'Artist...', flags: similarArtists.length ? MF_STRING : MF_GRAYED});
		similarArtists.forEach(v => {
				menu.newItem({
					menuName: 'curSimArtists',
					str: v,
					func: () => {this.loadAutoDJ(); this.setArtist(v, 0);},
					flags: v == 'More tags:' || v == 'Similar:' ? MF_GRAYED : MF_STRING,
					separator: v == 'More tags:' ||  v == 'Similar:'
				});
		});

		menu.addSeparator({menuName: 'Artist...'});

		for (const [key, value] of Object.entries(this.artists)) {
			menu.newMenu({menuName: 'artist1_' + key, str: key, appendTo: 'Artist...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'artist1_' + key,
					str: w,
					func: () => {this.loadAutoDJ(); this.setArtist(w, 0);},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'Artist...'});
			menu.newItem({
				menuName: 'Artist...',
				str: 'More...',
				func: () => this.setAutoDJ(0)
			});
		}
		
		menu.newMenu({menuName: 'Similar artists...', appendTo: 'New autoDJ'});
		menu.newItem({
			menuName: 'Similar artists...',
			str: 'Pick seed:',
			flags: MF_GRAYED
		});
		
		menu.addSeparator({menuName: 'Similar artists...'});

		menu.newMenu({menuName: 'curSimilarArtists', str: 'All current track artists', appendTo: 'Similar artists...', flags: similarArtists.length ? MF_STRING : MF_GRAYED});

		similarArtists.forEach(v => {
				menu.newItem({
					menuName: 'curSimilarArtists',
					str: v,
					func: () => {this.loadAutoDJ(); this.setArtist(v, 2);},
					flags: v == 'More tags:' || v == 'Similar:' ? MF_GRAYED : MF_STRING,
					separator: v == 'More tags:' ||  v == 'Similar:'
				});
		});

		menu.addSeparator({menuName: 'Similar artists...'});

		for (const [key, value] of Object.entries(this.artists)) {
			menu.newMenu({menuName: 'artists1_' + key, str: key, appendTo: 'Similar artists...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'artists1_' + key,
					str: w,
					func: () => {this.loadAutoDJ(); this.setArtist(w, 2);},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'Similar artists...'});
			menu.newItem({
				menuName: 'Similar artists...',
				str: 'More...',
				func: () => {this.loadAutoDJ(); this.setAutoDJ(2);}
			});
		}

		menu.newMenu({menuName: 'Sounds like...', appendTo: 'New autoDJ'});
		menu.newItem({
			menuName: 'Sounds like...',
			str: 'Pick song:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'Sounds like...'});

		for (const [key, value] of Object.entries(this.songs)) {
			menu.newMenu({menuName: 'songs1_' + key, str: key, appendTo: 'Sounds like...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'songs1_' + key,
					str: w,
					func: () => {this.loadAutoDJ(); this.setArtist(w, 3);},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'Sounds like...'});
			menu.newItem({
				menuName: 'Sounds like...',
				str: 'More...',
				func: () => {this.loadAutoDJ(); this.setAutoDJ(3);}
			});
		}

		menu.newMenu({menuName: 'Genre...', appendTo: 'New autoDJ'});
		menu.newItem({
			menuName: 'Genre...',
			str: 'Pick genre:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'Genre...'});

		menu.newMenu({menuName: 'curGenre', str: 'All current track genres', appendTo: 'Genre...', flags: cur_tags.genre.length ? MF_STRING : MF_GRAYED});

		cur_tags.genre.forEach((v, i) => {
			menu.newItem({
				menuName: 'curGenre',
				str: v,
				func: () => {this.loadAutoDJ(); this.setTag(v, 'genre');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.addSeparator({menuName: 'Genre...'});

		for (const [key, value] of Object.entries(this.genres)) {
			menu.newMenu({menuName: 'genre1_' + key, str: key, appendTo: 'Genre...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'genre1_' + key,
					str: w,
					func: () => {this.loadAutoDJ(); this.setTag(w, 'genre');},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'Genre...'});
			menu.newItem({
				menuName: 'Genre...',
				str: 'More...',
				func: () => {this.loadAutoDJ(); this.setAutoDJ(1, 'genre');}
			});
		}

		menu.newMenu({menuName: 'Mood...', appendTo: 'New autoDJ'});
		menu.newItem({
			menuName: 'Mood...',
			str: 'Pick mood:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'Mood...'});
		
		menu.newMenu({menuName: 'curMood', str: 'All current track moods', appendTo: 'Mood...', flags: cur_tags.mood.length ? MF_STRING : MF_GRAYED});
		
		cur_tags.mood.forEach((v, i) => {
			menu.newItem({
				menuName: 'curMood',
				str: v,
				func: () => {this.loadAutoDJ(); this.setTag(v, 'mood');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.addSeparator({menuName: 'Mood...'});

		for (const [key, value] of Object.entries(this.moods)) {
			menu.newMenu({menuName: 'mood1_' + key, str: key, appendTo: 'Mood...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'mood1_' + key,
					str: w,
					func: () => {this.loadAutoDJ(); this.setTag(w, 'mood');},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});	
		}
	
		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'Mood...'});
			menu.newItem({
				menuName: 'Mood...',
				str: 'More...',
				func: () => {this.loadAutoDJ(); this.setAutoDJ(1, 'mood');}
			});
		}

		menu.newMenu({menuName: 'Theme...', appendTo: 'New autoDJ'});
		menu.newItem({
			menuName: 'Theme...',
			str: 'Pick theme:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'Theme...'});

		menu.newMenu({menuName: 'curTheme', str: 'All current track themes', appendTo: 'Theme...', flags: cur_tags.theme.length ? MF_STRING : MF_GRAYED});

		cur_tags.theme.forEach((v, i) => {
			menu.newItem({
				menuName: 'curTheme',
				str: v,
				func: () => {this.loadAutoDJ(); this.setTag(v, 'theme');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.addSeparator({menuName: 'Theme...'});

		for (const [key, value] of Object.entries(this.themes)) {
			menu.newMenu({menuName: 'theme1_' + key, str: key, appendTo: 'Theme...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'theme1_' + key,
					str: w,
					func: () => {this.loadAutoDJ(); this.setTag(w, 'theme');},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});	
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'Theme...'});
			menu.newItem({
				menuName: 'Theme...',
				str: 'More...',
				func: () => {this.loadAutoDJ(); this.setAutoDJ(1, 'theme');}
			});
		}

		menu.addSeparator({menuName: 'New autoDJ'});

		menu.newMenu({ menuName: 'Decade...', appendTo: 'New autoDJ'});
		txt.decadesMenu.forEach((v, i) => menu.newItem({
			menuName: 'Decade...',
			str: ppt.longDecadesFormat ? (v.tag2 != decade ? v.tag2 : `${v.tag2} [current]`) : (v.tag1 != decade ? v.tag1 : `${v.tag1} [current]`),
			func: () => {this.loadAutoDJ(); this.setDecade(i)},
			separator: i == txt.decadesMenu.length - 1
		}));

		['20s Style', '2020s style'].forEach((v, i) => menu.newItem({
			menuName: 'Decade...',
			str: v,
			func: () => {this.loadAutoDJ(); this.setDecade(txt.decadesMenu.length + i)},
			checkRadio: i == ppt.longDecadesFormat
		}));

		menu.newMenu({ menuName: 'Year...', appendTo: 'New autoDJ'});
		const year = name.year()

		this.yearArr.forEach((v, i) => {
			menu.newItem({
				menuName: 'Year...',
				str: v != year ? v : `${v} [current]`,
				func: () => {this.loadAutoDJ(); this.setTag(v, 'year');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.newMenu({menuName: 'Locale...', appendTo: 'New autoDJ'});
		menu.newItem({
			menuName: 'Locale...',
			str: 'Pick locale:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'Locale...'});

		menu.newMenu({menuName: 'curLocale', str: 'All current track locales', appendTo: 'Locale...', flags: cur_tags.locale.length ? MF_STRING : MF_GRAYED});

		cur_tags.locale.forEach((v, i) => {
			menu.newItem({
				menuName: 'curLocale',
				str: v,
				func: () => {this.loadAutoDJ(); this.setTag(v, 'locale', ppt.djOwnData);},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.addSeparator({menuName: 'Locale...'});

		for (const [key, value] of Object.entries(this.countries)) {
			menu.newMenu({menuName: 'locale1_' + key, str: key, appendTo: 'Locale...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'locale1_' + key,
					str: w,
					func: () => {this.loadAutoDJ(); this.setTag(w, 'locale', ppt.djOwnData);},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		menu.addSeparator({menuName: 'New autoDJ'});

		if (ppt.lastDjOwnData) {
			menu.newItem({
				menuName: 'New autoDJ',
				str: 'Enter query...',
				func: () => {this.loadAutoDJ(); this.setQuery();},
				separator: true
			});
		}

		if (popUpBox.isHtmlDialogSupported()) {
			menu.newItem({
				menuName: 'New autoDJ',
				str: 'Full browse && search...',
				func: () => {this.loadAutoDJ(); this.setAutoDJ('autocompleteType');},
				separator: true
			});
		}

		menu.newMenu({menuName: this.trackMenuName(false), appendTo: 'New autoDJ'});
		['Youtube tracks\tLast.fm data', 'Prefer library tracks\tLast.fm data', 'Library tracks\tLast.fm data', 'Library tracks\tOwn data', 'Popularity settings...'].forEach((v, i) => menu.newItem({
			menuName: this.trackMenuName(false),
			str: v,
			func: () => {if (i < 4) this.setDjMode(i, true); else {ppt.configOwnData = ppt.lastDjOwnData; panel.open('playlists');}},
			checkRadio: !ppt.lfmRadio ? i == ppt.lastLibDj + ppt.lastDjOwnData : i == Math.min(ppt.lastLibDj + ppt.lastDjOwnData, 2),
			flags: i != 3 || !ppt.lfmRadio ? MF_STRING : MF_GRAYED,
			separator: i == 2 || i == 3
		}));

		menu.addSeparator({});

		menu.newMenu({menuName: 'Generate library playlist', str: 'New library mix'});

		menu.newItem({
			menuName: 'Generate library playlist',
			str: 'By...',
			flags: MF_GRAYED,
			separator: true
		});

		this.name.dj.forEach((v, i) => {
			menu.newItem({
				menuName: 'Generate library playlist',
				str: v.name + '\t' + v.value,
				func: () => {this.loadFind(); this.setAutoDJ(v);},
				separator: i == this.name.dj.length - 1
			});
		});
		
		menu.newMenu({menuName: 'Favorites...', str: 'Favourites...', appendTo: 'Generate library playlist'});
		
		if (!fav.stations.length) {
			menu.newItem({
				menuName: 'Favorites...',
				str: 'None'
			});
		} else {
			let djType = index.cur_find.type;
			if (djType == 4) djType = 1;
			fav.stations.forEach((v, i) => menu.newItem({
				menuName: 'Favorites...',
				str: v.source.replace(/&/g, '&&') + (v.type == 2 ? ' and Similar Artists' : ''),
				func: () => {this.loadFind(); this.setFavourites(i, index.cur_find.source, index.cur_find.type, index.cur_find.tag, index.cur_find.query, ppt.findOwnData);},
				checkRadio: this.isSoftMode && index.cur_find.source + (!index.cur_find.query ? '' : ' [Query]') == v.source && djType == v.type && index.cur_find.tag == (v.tag || ''),
				separator: i == fav.stations.length - 1
			}));
		}

		menu.newItem({
			menuName: 'Favorites...',
			str: 'Auto favourites',
			func: () => this.setFavourites(fav.stations.length + 1, index.cur_find.source, index.cur_find.type, index.cur_find.tag, index.cur_find.query, ppt.findOwnData),
			checkItem: ppt.autoFav,
			separator: !ppt.autoFav
		});
		if (!ppt.autoFav) {
			['Add current', 'Remove current', 'Reset'].forEach((v, i) => menu.newItem({
				menuName: 'Favorites...',
				str: v,
				func: () => this.setFavourites(fav.stations.length + 2 + i, index.cur_find.source, index.cur_find.type, index.cur_find.tag, index.cur_find.query, ppt.findOwnData)
			}));
		}

		menu.addSeparator({menuName: 'Generate library playlist'});

		menu.newItem({
			menuName: 'Generate library playlist',
			str: 'Further suggestions:',
			flags: MF_GRAYED
		});

		menu.newMenu({menuName: 'By_artist...', str: 'Artist...', appendTo: 'Generate library playlist'});
		menu.newItem({
			menuName: 'By_artist...',
			str: 'Pick artist:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'By_artist...'});

		menu.newMenu({menuName: 'curSimilarArt', str: 'All current track artists', appendTo: 'By_artist...', flags: similarArtists.length ? MF_STRING : MF_GRAYED});

		similarArtists.forEach(v => {
			menu.newItem({
				menuName: 'curSimilarArt',
				str: v,
				func: () => {this.loadFind(); this.setArtist(v, 0);},
				flags: v == 'More tags:' || v == 'Similar:' ? MF_GRAYED : MF_STRING,
				separator: v == 'More tags:' ||  v == 'Similar:'
			});
		});

		menu.addSeparator({menuName: 'By_artist...'});

		for (const [key, value] of Object.entries(this.artists)) {
			menu.newMenu({menuName: 'artist2_' + key, str: key, appendTo: 'By_artist...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'artist2_' + key,
					str: w,
					func: () => {this.loadFind(); this.setArtist(w, 0);},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}
		
		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'By_artist...'});
			menu.newItem({
				menuName: 'By_artist...',
				str: 'More...',
				func: () => this.setAutoDJ(0)
			});
		}

		menu.newMenu({menuName: 'Similar_artists...', str: 'Similar artists...', appendTo: 'Generate library playlist'});
		menu.newItem({
			menuName: 'Similar_artists...',
			str: 'Pick seed:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'Similar_artists...'});

		menu.newMenu({menuName: 'cur_similar', str: 'All current track artists', appendTo: 'Similar_artists...', flags: similarArtists.length ? MF_STRING : MF_GRAYED});

		similarArtists.forEach(v => {
				menu.newItem({
					menuName: 'cur_similar',
					str: v,
					func: () => {this.loadFind(); this.setArtist(v, 2);},
					flags: v == 'More tags:' || v == 'Similar:' ? MF_GRAYED : MF_STRING,
					separator: v == 'More tags:' ||  v == 'Similar:'
				});
		});

		menu.addSeparator({menuName: 'Similar_artists...'});

		for (const [key, value] of Object.entries(this.artists)) {
			menu.newMenu({menuName: 'artists2_' + key, str: key, appendTo: 'Similar_artists...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'artists2_' + key,
					str: w,
					func: () => {this.loadFind(); this.setArtist(w, 2);},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}
		
		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'Similar_artists...'});
			menu.newItem({
				menuName: 'Similar_artists...',
				str: 'More...',
				func: () => {this.loadFind(); this.setAutoDJ(2);}
			});
		}

		menu.newMenu({menuName: 'Similar_songs...', str: 'Sounds like...', appendTo: 'Generate library playlist'});
		menu.newItem({
			menuName: 'Similar_songs...',
			str: 'Pick song:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'Similar_songs...'});

		for (const [key, value] of Object.entries(this.songs)) {
			menu.newMenu({menuName: 'songs2_' + key, str: key, appendTo: 'Similar_songs...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'songs2_' + key,
					str: w,
					func: () => {this.loadFind(); this.setArtist(w, 3);},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'Similar_songs...'});
			menu.newItem({
				menuName: 'Similar_songs...',
				str: 'More...',
				func: () => {this.loadFind(); this.setAutoDJ(3);}
			});
		}

		menu.newMenu({menuName: 'By_genre...', str: 'Genre...', appendTo: 'Generate library playlist'});
		menu.newItem({
			menuName: 'By_genre...',
			str: 'Pick genre:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'By_genre...'});

		menu.newMenu({menuName: 'cur_genre', str: 'All current track genres', appendTo: 'By_genre...', flags: cur_tags.genre.length ? MF_STRING : MF_GRAYED});
		
		cur_tags.genre.forEach((v, i) => {
			menu.newItem({
				menuName: 'cur_genre',
				str: v,
				func: () => {this.loadFind(); this.setTag(v, 'genre');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.addSeparator({menuName: 'By_genre...'});

		for (const [key, value] of Object.entries(this.genres)) {
			menu.newMenu({menuName: 'genre2_' + key, str: key, appendTo: 'By_genre...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'genre2_' + key,
					str: w,
					func: () => {this.loadFind(); this.setTag(w, 'genre');},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'By_genre...'});
			menu.newItem({
				menuName: 'By_genre...',
				str: 'More...',
				func: () => {this.loadFind(); this.setAutoDJ(1, 'genre');}
			});
		}

		menu.newMenu({menuName: 'By_mood...', str: 'Mood...', appendTo: 'Generate library playlist'});
		menu.newItem({
			menuName: 'By_mood...',
			str: 'Pick mood:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'By_mood...'});
		
		menu.newMenu({menuName: 'cur_mood', str: 'All current track moods', appendTo: 'By_mood...', flags: cur_tags.mood.length ? MF_STRING : MF_GRAYED});
		
		cur_tags.mood.forEach((v, i) => {
			menu.newItem({
				menuName: 'cur_mood',
				str: v,
				func: () => {this.loadFind(); this.setTag(v, 'mood');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.addSeparator({menuName: 'By_mood...'});

		for (const [key, value] of Object.entries(this.moods)) {
			menu.newMenu({menuName: 'mood2_' + key, str: key, appendTo: 'By_mood...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'mood2_' + key,
					str: w,
					func: () => {this.loadFind(); this.setTag(w, 'mood');},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});	
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'By_mood...'});
			menu.newItem({
				menuName: 'By_mood...',
				str: 'More...',
				func: () => {this.loadFind(); this.setAutoDJ(1, 'mood');}
			});
		}

		menu.newMenu({menuName: 'By_theme...', str: 'Theme...', appendTo: 'Generate library playlist'});
		menu.newItem({
			menuName: 'By_theme...',
			str: 'Pick theme:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'By_theme...'});

		menu.newMenu({menuName: 'cur_theme', str: 'All current track themes', appendTo: 'By_theme...', flags: cur_tags.theme.length ? MF_STRING : MF_GRAYED});
		
		cur_tags.theme.forEach((v, i) => {
			menu.newItem({
				menuName: 'cur_theme',
				str: v,
				func: () => {this.loadFind(); this.setTag(v, 'theme');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.addSeparator({menuName: 'By_theme...'});

		for (const [key, value] of Object.entries(this.themes)) {
			menu.newMenu({menuName: 'theme2_' + key, str: key, appendTo: 'By_theme...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'theme2_' + key,
					str: w,
					func: () => {this.loadFind(); this.setTag(w, 'theme');},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});	
		}

		if (!popUpBox.isHtmlDialogSupported()) {
			menu.addSeparator({menuName: 'By_theme...'});
			menu.newItem({
				menuName: 'By_theme...',
				str: 'More...',
				func: () => {this.loadFind(); this.setAutoDJ(1, 'theme');}
			});
		}
		
		menu.addSeparator({menuName: 'Generate library playlist'});

		menu.newMenu({menuName: 'By_decade...', str: 'Decade...', appendTo: 'Generate library playlist'});
		txt.decadesMenu.forEach((v, i) => menu.newItem({
			menuName: 'By_decade...',
			str: ppt.longDecadesFormat ? (v.tag2 != decade ? v.tag2 : `${v.tag2} [current]`) : (v.tag1 != decade ? v.tag1 : `${v.tag1} [current]`),
			func: () => {this.loadFind(); this.setDecade(i);},
			separator: i == txt.decadesMenu.length - 1
		}));

		['20s Style', '2020s style'].forEach((v, i) => menu.newItem({
			menuName: 'By_decade...',
			str: v,
			func: () => {this.loadFind(); this.setDecade(txt.decadesMenu.length + i);},
			checkRadio: i == ppt.longDecadesFormat
		}));

		menu.newMenu({ menuName: 'By_year...', str: 'Year...', appendTo: 'Generate library playlist'});

		this.yearArr.forEach((v, i) => {
			menu.newItem({
				menuName: 'By_year...',
				str: v != year ? v : `${v} [current]`,
				func: () => {this.loadFind(); this.setTag(v, 'year');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.newMenu({menuName: 'By_locale...', str: 'Locale...', appendTo: 'Generate library playlist'});
		menu.newItem({
			menuName: 'By_locale...',
			str: 'Pick locale:',
			flags: MF_GRAYED
		});

		menu.addSeparator({menuName: 'By_locale...'});
		
		menu.newMenu({menuName: 'cur_locale', str: 'All current track locales', appendTo: 'By_locale...', flags: cur_tags.locale.length ? MF_STRING : MF_GRAYED});
		
		cur_tags.locale.forEach((v, i) => {
			menu.newItem({
				menuName: 'cur_locale',
				str: v,
				func: () => {this.loadFind(); this.setTag(v, 'locale');},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});

		menu.addSeparator({menuName: 'By_locale...'});

		for (const [key, value] of Object.entries(!ppt.findOwnData ? this.demonyms : this.countries)) {
			menu.newMenu({menuName: 'locale2_' + key, str: key, appendTo: 'By_locale...'});
			value.forEach((w, i) => {
				menu.newItem({
					menuName: 'locale2_' + key,
					str: w,
					func: () => {this.loadFind(); this.setTag(w, 'locale', ppt.djOwnData);},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		menu.addSeparator({menuName: 'Generate library playlist'});

		if (ppt.findOwnData) { 
			menu.newItem({
				menuName: 'Generate library playlist',
				str: 'Enter query...',
				func: () => {this.loadFind(); this.setQuery();},
				separator: true
			});
		}

		if (popUpBox.isHtmlDialogSupported()) {
			menu.newItem({
				menuName: 'Generate library playlist',
				str: 'Full browse && search...',
				func: () => {this.loadFind(); this.setAutoDJ('autocompleteType');},
				separator: true
			});
		}

		menu.newMenu({menuName: this.trackMenuName(true), appendTo: 'Generate library playlist'});
		for (let i = 0; i < 2; i++) menu.newItem({
			menuName: this.trackMenuName(true),
			str: !i ? 'Last.fm data' : 'Own data',
			func: () => this.setDataType(i),
			checkRadio: i == ppt.findOwnData
		});

		menu.addSeparator({menuName: this.trackMenuName(true)});

		menu.newMenu({menuName: 'Load', appendTo: this.trackMenuName(true)});
		const ln = ppt.findOwnData ? 5 : 4;
		for (let i = 0; i < ln; i++) menu.newItem({
			menuName: 'Load',
			str: !ppt.findOwnData ? ['Smart mix', 'All tracks (sorted by last.fm playcount)', 'All tracks (randomized)', 'All tracks (sorted by album artist)'][i] : ['Smart mix', 'All tracks (sorted by playcount)', 'All tracks (sorted by rating)', 'All tracks (randomized)', 'All tracks (sorted by album artist)'][i],
			func: () => this.setDataType(i + 2),
			checkRadio: i == (!ppt.findOwnData ? ppt.findLfmDataSort : ppt.findOwnDataSort),
			separator: !i
		});

		menu.addSeparator({menuName: this.trackMenuName(true)});

		menu.newItem({
			menuName: this.trackMenuName(true),
			str: 'Settings...',
			func: () => {ppt.configOwnData = ppt.findOwnData; panel.open('playlists');}
		});

		menu.addSeparator({});

		menu.newMenu({menuName: 'Playlists'});
		pl.enabled.forEach((v, i) => menu.newItem({
			menuName: 'Playlists',
			str: v.name.replace(/&/g, '&&'),
			func: () => this.setPlaylistEnabled(i),
			checkRadio: plman.ActivePlaylist == pl.enabled[i].ix,
			separator: pl.enabled.length ? i == pl.enabled.length - 1 : false
		}));

		const pl_no = Math.ceil(pl.menu.length / 30);
		for (let j = 0; j < pl_no; j++) {
			const n = '# ' + (j * 30 + 1 + ' - ' + Math.min(pl.menu.length, 30 + j * 30) + (30 + j * 30 > plman.ActivePlaylist && ((j * 30) - 1) < plman.ActivePlaylist ? '  >>>' : ''));
			menu.newMenu({menuName: n, appendTo: 'Playlists'});
			for (let i = j * 30; i < Math.min(pl.menu.length, 30 + j * 30); i++) menu.newItem({
				menuName: n,
				str: pl.menu[i].name,
				func: () => this.setPlaylist(i),
				checkRadio: i == plman.ActivePlaylist
			});
		}

		menu.addSeparator({menuName: 'Playlists'});
		menu.newItem({
			menuName: 'Playlists',
			str: tag.timer ? `Tagger running ${tag.done}: click to cancel` : (!this.handleList.Count ? 'Tagger N/A: no playlist items selected' : 'Tag playlist items with last.fm track statistics...'),
			func: () => tag.timer ? tag.cancel() : tag.playlistItems(this.handleList.Clone()),
			flags: this.handleList.Count || tag.timer ? MF_STRING : MF_GRAYED,
		});

		if (panel.youTube.backUp) {
			menu.newItem({
				menuName: 'Playlists',
				separator: true
			});

			for (let i = 0; i < 7; i++) menu.newItem({
				menuName: 'Playlists',
				str: this.str.save[i],
				func: () => this.setSave(i),
				flags: this.flags.save[i] ? MF_STRING : MF_GRAYED,
				checkItem: i == 1 && sv.trk == 1 || i == 2 && sv.trk == 2,
				separator: !i || i == 2 || i == 3 || i == 5,
			});
		}

		menu.addSeparator({});

		['Send to playlist\tClick', 'Add to playlist\tMiddle click', 'Search for full album\tCtrl+click', 'Reload from youtube\tShift+click', 'Remove from cache\tAlt+click', ''].forEach((v, i) => menu.newItem({
			str: i < 5 ? v : ppt.mb ? `Open MusicBrainz: ${alb.artist}...` : `Open Last.fm: ${alb.artist}...`,
			func: () => this.loadItem(i, panel.m.x, panel.m.y, 2),
			flags: this.flags.load[i] ? MF_STRING : MF_GRAYED,
			separator: i == 1 || i == 2 || i == 4 || utils.IsKeyPressed(0x10) && i == 5 && ppt.mb != 2,
			hide: ppt.btn_mode || !ppt.showAlb || alb.type.active != 2 || i == 5 && (!utils.IsKeyPressed(0x10) || ppt.mb == 2) || !this.flags.load[i]
		}));

		['Send to playlist\tClick', 'Add to playlist\tMiddle click', 'Search for full album\tCtrl+click', 'Reload from youtube\tShift+click', 'Remove from cache\tAlt+click', ''].forEach((v, i) => menu.newItem({
			str: i < 5 ? v : ppt.mb ? `Open MusicBrainz: ${alb.artist}...` : `Open Last.fm: ${alb.artist}...`,
			func: () => this.loadItem(i, panel.m.x, panel.m.y, 1),
			flags: this.flags.loadTracks[i] ? MF_STRING : MF_GRAYED,
			separator: i == 1 || i == 2 || i == 4 || utils.IsKeyPressed(0x10) && i == 5 && ppt.mb != 2,
			hide: ppt.btn_mode || !ppt.showAlb || alb.type.active != 1 || !alb.expanded || i == 5 && (!utils.IsKeyPressed(0x10) || ppt.mb == 2) || !this.flags.loadTracks[i]
		}));

		menu.newMenu({menuName: 'Create m-Tags album...'});
		menu.newItem({separator: true});
		for (let i = 0; i < 2; i++) menu.newItem({
			menuName: 'Create m-Tags album...',
			str: this.str.mTags[i],
			func: () => this.createMtags(i),
			flags: this.flags.mTags[i] ? MF_STRING : MF_GRAYED,
			separator: !i && !ppt.btn_mode,
			hide: !i && ppt.btn_mode
		});

		menu.newMenu({menuName: 'Love / Black list'});

		for (let i = 0; i < 4; i++) menu.newItem({
			menuName: 'Love / Black list',
			str: this.video.blacklistStr[i],
			func: () => this.setVideoBlacklist(i),
			flags: i == 1 && !this.yt_video ? MF_GRAYED : MF_STRING,
			separator: !i || i == (blk.undo[0] != this.name.artis ? 2 : 3) && !this.video.blacklist.length && !ui.style.textOnly && !ppt.showAlb,
			hide: i == 3 && blk.undo[0] != this.name.artis
		});

		if (this.video.blacklist.length) {
			this.video.blacklist.forEach((v, i) => menu.newItem({
				menuName: 'Love / Black list',
				str: v.replace(/&/g, '&&'),
				func: () => this.setVideoBlacklist(i + (blk.undo[0] == this.name.artis ? 4 : 3)),
				separator: !ui.style.textOnly && !ppt.showAlb && i == this.video.blacklist.length - 1
			}));
		}

		for (let i = 0; i < 3; i++) menu.newItem({
			menuName: 'Love / Black list',
			str: this.img.blacklistStr[i],
			func: () => this.setImageBlacklist(i),
			flags: !i && this.img.isLfm || i == 2 ? MF_STRING : MF_GRAYED,
			hide: ui.style.textOnly || ppt.showAlb || i == 2 && img.blackList.undo[0] != this.img.artistClean
		});

		if (!ui.style.textOnly && !ppt.showAlb) {
			this.img.blacklist.forEach((v, i) => menu.newItem({
				menuName: 'Love / Black list',
				str: (this.img.artist + '_' + v).replace(/&/g, '&&'),
				func: () => this.setImageBlacklist(i + (img.blackList.undo[0] == this.img.artistClean ? 3 : 2))
			}));
		}

		menu.addSeparator({});
		menu.newMenu({menuName: 'Display'});

		if (!ppt.btn_mode) {
			['Album && tracks', 'Nowplaying'].forEach((v, i) => menu.newItem({
				menuName: 'Display',
				str: v,
				func: () => this.toggleNowplaying(),
				checkRadio: !i ? ppt.showAlb : !ppt.showAlb,
				separator: i
			}));

			menu.newItem({
				menuName: 'Display',
				str: 'Background image (current track)',
				func: () => {
					ppt.toggle('imgBg');
					if (ppt.imgBg) {
						img.clearCovCache();
						img.clearArtCache();
					}
					img.setBg();
				},
				checkItem: ppt.imgBg,
				hide: !ppt.showAlb || ui.style.textOnly
			});
			
			menu.newMenu({menuName: 'Opacity', appendTo: 'Display', hide: !ppt.showAlb || !ppt.imgBg || ui.style.textOnly});

			menu.newItem({
				menuName: 'Opacity',
				str: 'DIMMER',
				flags: MF_GRAYED,
				separator: true
			})

			const imgBgOpacity = $.range(0, 100, 5);
			imgBgOpacity.forEach((v, i) => menu.newItem({
				menuName: 'Opacity',
				str: v.toString(),
				func: () => {
					ppt.imgBgOpacity = v;
					img.imgBgOpacity = ppt.imgBgOpacity / 100 * 255;
					img.setBg();
				},
				checkRadio: imgBgOpacity[i] == ppt.imgBgOpacity,
				separator: i == imgBgOpacity.length - 1
			}));

			['BRIGHTER', 'Photo change: wheel at top of pane', 'Underlay: controlled by theme'].forEach((v, i) => menu.newItem({
				menuName: 'Opacity',
				str: v,
				flags: MF_GRAYED,
				separator: !i,
				hide: i == 1 && (!ppt.artistView || img.art.images.length < 2)
			}));

			if (ppt.showAlb && !ui.style.textOnly) menu.addSeparator({menuName: 'Display'});
			const suffix = !ppt.dblClickToggle ? '\tClick' + (ppt.showAlb ? ' top' : '') : '\tDouble click' + (ppt.showAlb ? ' top' : '')
			for (let i = 0; i < 3; i++) menu.newItem({
				menuName: 'Display',
				str: ['Album cover' + (ppt.artistView ? suffix : ''), 'Artist photo' + (!ppt.artistView ? suffix : ''), 'Auto-cycle'][i],
				func: () => {
					if (!i || i == 1) {
						ppt.toggle('artistView');
						img.setBg();
					} else if (i == 2) {
						ppt.toggle('cycPhoto');
						if (ppt.cycPhoto) {
							img.setBg();
							timer.image();
						}
						else timer.clear(timer.img);
					}
				},
				flags: i == 2 && !ppt.artistView ? MF_GRAYED : MF_STRING,
				checkItem: i == 2 && ppt.cycPhoto,
				checkRadio: !i && !ppt.artistView || i == 1 && ppt.artistView,
				separator: i == 1 || i == 2,
				hide: ppt.showAlb && !ppt.imgBg || ui.style.textOnly ? MF_GRAYED : MF_STRING
			});
		}

		for (let i = 0; i < 2; i++) menu.newItem({
			menuName: 'Display',
			str: ['Prefer playing track', 'Follow selected track (playlist)' + (panel.video.mode || alb.art.search ? ': N/A in video or search mode' : '')][i],
			func: () => {
				ppt.toggle('focus');
				on_item_focus_change()
			},
			flags: !i || !panel.video.mode && !alb.art.search ? MF_STRING : MF_GRAYED,
			checkRadio: i == !ppt.focus || panel.video.mode ? 0 : 1
		});

		menu.newItem({separator: true});
		for (let i = 0; i < 2; i++) menu.newItem({
			str: [popUpBox.ok ? 'Options...' : 'Options: see console', 'Configure...'][i],
			func: () => !i ? panel.open() : window.EditScript(),
			separator: !i && utils.IsKeyPressed(0x10),
			hide: i && !utils.IsKeyPressed(0x10)
		});
	}

	buttonMenu() {
		bMenu.newMenu({});

		bMenu.newMenu({menuName: 'Track source'});
		['Youtube', 'Prefer library', 'Library'].forEach((v, i) => bMenu.newItem({
			menuName: 'Track source',
			str: v,
			func: () => {
				ppt.libAlb = i;
				alb.setSiteDefaults();
				alb.reset(ppt.lock);
			},
			checkRadio: i == ppt.libAlb,
			separator: i == 2
		}));

		bMenu.newItem({
			menuName: 'Track source',
			str: 'Indicate source of youtube links (last.fm vs need to search youtube)',
			func: () => {
				ppt.toggle('showYouTubeLinkSource');
				if (!ppt.showSource && ppt.showYouTubeLinkSource) ppt.showSource = 4;
				alb.reset(ppt.lock);
			},
			checkItem: ppt.showYouTubeLinkSource,
		});

		bMenu.newItem({separator: true});

		bMenu.newMenu({menuName: 'Play button action'});
		bMenu.newMenu({menuName: 'Albums', appendTo: 'Play button action'});
		const numberTopTracks = [10, 20, 30, 40, 50, 75, 100][ppt.topTracksIX];
		const prefix = ppt.playButtonPlay ? 'Play:' : 'Send to playlist:';

		[`${prefix}`, `Library albums`, `Local albums (library or cached)`, `Click individual albums to add to cache`]
		.forEach((v, i) => bMenu.newItem({
			menuName: 'Albums',
			str: v,
			func: () => ppt.playbackOrderAlbums = i - 1,
			flags: i == 1 || i == 2 ? MF_STRING : MF_GRAYED,
			checkRadio: i - 1 == ppt.playbackOrderAlbums,
			separator: !i || i == 2
		}));

		bMenu.newMenu({menuName: 'Tracks', appendTo: 'Play button action'});
		[`${prefix}`, `All`, `Library tracks`, `Locale (library && cached)`, `Top ${numberTopTracks}`, `Top ${numberTopTracks}: reverse`, `Top ${numberTopTracks}: shuffle`].forEach((v, i) => bMenu.newItem({
			menuName: 'Tracks',
			str: v,
			func: () => ppt.playbackOrderTracks = i - 1,
			flags: i ? MF_STRING : MF_GRAYED,
			checkRadio: i - 1 == ppt.playbackOrderTracks,
			separator: !i || i == 1 || i == 2 || i == 3 || i == 6
		}));

		bMenu.newMenu({menuName: 'Change number of tracks', appendTo: 'Tracks'});
		for (let i = 0; i < 7; i++) bMenu.newItem({
			menuName: 'Change number of tracks',
			str: ['10', '20', '30', '40', '50', '75', '100'][i],
			func: () => ppt.topTracksIX = i,
			checkRadio: i == ppt.topTracksIX,
			separator: i == 3
		});

		bMenu.newItem({separator: true, menuName: 'Play button action'});

		['Play', 'Send to playlist', 'Why might load be less than expected?', 'Why might video errors occur?']
		.forEach((v, i) => bMenu.newItem({
			menuName: 'Play button action',
			str: v,
			func: () => {
				if (i < 2) {ppt.toggle('playButtonPlay'); but.refresh(true);}
				else if (i == 2) fb.ShowPopupMessage(`The initial load is limited to protect YouTube quota and stops after ${Math.max(ppt.djPlaylistLimit, 5)} YouTube searches.

Tracks in the library, cache or having last.fm YouTube links don't require searching YouTube and so normally the amount loaded will exceed that value.

The limit can be changed in options > playlist tab by altering the 'Maintain X tracks in playlist' value (also used by autoDJ) or panel property: Auto DJ Playlist Track Limit. Max 50.

Any remaining tracks are added as items are played.

To play or load just library tracks, check the corresponding play button action menu item.`, 'Find & Play: why might load be less than expected?');
else fb.ShowPopupMessage(`1. Make sure foo_youtube is up to date.

2. On the foo_youtube maintenance tab, consider enabling the "prefer youtube-dl over internal analyzer" option. Set the location to GitHub (yt-dlp) and use manage > download to install. yt-dlp is updated more frequently than youtube-dl itself.

• This may enable a more up to date analysis.
• It also seems to result in more robust display of provided thumbnails.

3. If last.fm YouTube links are being used, last.fm may have supplied a dead link or the link is not available in your country.

Normally such occurrences will be at an acceptable level. However, last.fm YouTube links can be checked.

For that, enter a YouTube API key AND your region code in Find & Play > options > maintenance tab. The check, which has a very low quota cost, will then be done automatically and dead links substituted.

Bad last.fm links can also be black listed or use of last.fm links disabled. In general though, using last.fm YouTube links is a good idea as they enable loading large playlists without the risk of rate limiting by YouTube.

4. If tracks are being loaded from the YouTube cache, it's posssible the links are no longer available. On the context menu choose: reload from YouTube, or remove from cache.

If they originated from last.fm you might need to load the item and black list it so it doesn't simply reload the same thing.

If a lot of dead links originate from the cache, cache can be cleared by deleting the 'Find & Play Cache' playlist or its content. Album & tracks pane would need refreshing to see the changes in the current list.

4. The video might be age restricted. See the foo_youtube help for how to allow such videos.

5. 403 server errors are foo_youtube issues.`, 'Find & Play: why might video errors occur?');
				
				},
			checkRadio: !i && ppt.playButtonPlay || i == 1 && !ppt.playButtonPlay,
			separator: i == 1
		}));

		bMenu.newItem({separator: true});
		bMenu.newMenu({menuName: 'Album track list'});
		['Prefer last.fm', 'Prefer musicbrainz', 'Library albums use library track list']
		.forEach((v, i) => bMenu.newItem({
			menuName: 'Album track list',
			str: v,
			func: () => {
				ppt.prefMbTracks = i;
				alb.changeTrackSource();
				txt.paint();
			},
			flags: i != 2 ? MF_STRING : MF_GRAYED,
			checkRadio:  i == ppt.prefMbTracks,
			separator: i == 1
		}));

		bMenu.newItem({separator: true});
		bMenu.newMenu({menuName: 'Sort'});
		for (let i = 0; i < 3; i++) bMenu.newItem({
			menuName: 'Sort',
			str: ['Musicbrainz "All" releases: include "Live" + "Other"', 'Musicbrainz "All" releases: group', 'Last.fm: sort by last.fm rank (listeners)'][i],
			func: () => alb.toggle(['showLive', 'mbGroup', 'lfmSortPC'][i]),
			flags: i == 2 && !alb.statistics.sortable ? MF_GRAYED : MF_STRING,
			checkItem: [ppt.showLive, ppt.mbGroup, !ppt.lfmSortPC][i],
			separator: i == 1
		});

		bMenu.addSeparator({});
		for (let i = 0; i < 3; i++) bMenu.newItem({
			str: [but.btns.mode.x + but.btns.mode.w + 14 * but.scale <= filter.bg.x ? 'Show list search' : 'Show list search (N/A: panel too narrow)', ppt.showArtists ? 'Hide artists' : 'Show artists', popUpBox.ok ? 'Options...' : 'Options: see console'][i],
			func: () => {
				switch (i) {
					case 0:
						ppt.toggle('searchShow');
						filter.clear();
						break;
					case 1:
						alb.toggle('showArtists');
						break;
					case 2:
						panel.open();
						break;
				}
			},
			checkItem: !i && ppt.searchShow,
			flags: i || but.btns.mode.x + but.btns.mode.w + 14 * but.scale <= filter.bg.x ? MF_STRING : MF_GRAYED,
			separator: true
		});

		bMenu.newMenu({
			menuName: 'Refresh'
		});
		['Reset zoom', 'Reload'].forEach((v, i) => bMenu.newItem({
			menuName: 'Refresh',
			str: v,
			func: () => {!i ? but.resetZoom() : window.Reload();},
		}));
	}

	dayMenu() {
		const days = this.daysInMonth(this.chart.month, this.chart.year);
		dMenu.newMenu({});
		for (let i = 0; i < days; i++) dMenu.newItem({
			str: $.padNumber(i + 1, 2),
			func: () => this.setDay(i),
			checkRadio: i == Math.min(days, this.chart.day) - 1
		});
	}

	filterMenu() {
		filterMenu.newMenu({});
		['Copy', 'Cut', 'Paste'].forEach((v, i) => filterMenu.newItem({
			str: v,
			func: () => this.setEdit(filter, i),
			flags: () => filter.start == filter.end && i < 2 || i == 2 && !filter.paste ? MF_GRAYED : MF_STRING,
			separator: i == 1
		}));
	}
	
	listenbrainzMenu() {
		lMenu.newMenu({});
		['Show top tracks', 'Show mix'].forEach((v, i) => lMenu.newItem({
			str: v,
			func: () => {
				ppt.lbUserMix = i,
				but.refresh(true);
				alb.calcText();
				alb.getReleases('mb', 5);
				txt.paint();
			},
			flags: MF_STRING,
			checkRadio: i == ppt.lbUserMix,
			separator: i
		}));

		if (ppt.lbUserName) {
			['ListenBrainz: tracks you may like:', 'Recommendations', 'Similar artists', 'Artists'].forEach((v, i) => lMenu.newItem({
				str: v,
				func: () => {
					ppt.lbUserType = i - 1;
					but.refresh(true);
					alb.calcText();
					alb.getReleases('mb', 5);
					txt.paint();
				},
				flags: i ? MF_STRING : MF_GRAYED,
				checkRadio: i - 1 == ppt.lbUserType,
				separator: i == 3
			}));

			['ListenBrainz: your taste:', 'Loved', 'Hated'].forEach((v, i) => lMenu.newItem({
				str: v,
				func: () => {
					ppt.lbUserType = i + 2;
					but.refresh(true);
					alb.calcText();
					alb.getReleases('mb', 5);
					txt.paint();
				},
				flags: i ? MF_STRING : MF_GRAYED,
				checkRadio: i + 2 == ppt.lbUserType,
				separator: i == 2
			}));

			['ListenBrainz: your listening activity:', 'This week', 'This month', 'This quarter', 'This year', 'All time'].forEach((v, i) => lMenu.newItem({
				str: v,
				func: () => {
					ppt.lbUserType = i + 4;
					but.refresh(true);
					alb.calcText();
					alb.getReleases('mb', 5);
					txt.paint();
				},
				flags: i ? MF_STRING : MF_GRAYED,
				checkRadio: i + 4 == ppt.lbUserType,
				separator: i == 5
			}));
			
		}
		
		['ListenBrainz: sitewide listening activity:', 'This week', 'This month', 'This quarter', 'This year', 'All time'].forEach((v, i) => lMenu.newItem({
			str: v,
			func: () => {
				ppt.lbUserType = i + 9;
				but.refresh(true);
				alb.calcText();
				alb.getReleases('mb', 5);
				txt.paint();
			},
			flags: i ? MF_STRING : MF_GRAYED,
			checkRadio: i + 9 == ppt.lbUserType
		}));
		
		
		if (!ppt.lbUserName) {
			lMenu.addSeparator({});
			lMenu.newItem({
				str: 'User data requires user name (maintenance tab)',
				flags: MF_GRAYED
			});
		}
	}

	monthMenu() {
		mMenu.newMenu({});
		for (let i = 0; i < 12; i++) mMenu.newItem({
			str: $.padNumber(i + 1, 2),
			func: () => this.setMonth(i),
			checkRadio: () => i == this.chart.month - 1
		});
	}

	playMenu() {
		pMenu.newMenu({});
		const numberTopTracks = [10, 20, 30, 40, 50, 75, 100][ppt.topTracksIX];

		['Play', 'Send to playlist'].forEach((v, i) => pMenu.newItem({
			str: v + (!i && ppt.playButtonPlay || i == 1 && !ppt.playButtonPlay ? '\tCLICK ITEM' : ''),
			func: () => {ppt.toggle('playButtonPlay'); but.refresh(true);},
			checkRadio: !i && ppt.playButtonPlay || i == 1 && !ppt.playButtonPlay,
			separator: i == 1
		}));

		if (alb.isAlbum()) {
			[`Library albums`, `Local albums (library or cached)`, `Click individual albums to add to cache`]
			.forEach((v, i) => pMenu.newItem({
				str: v,
				func: () => {
					ppt.playbackOrderAlbums = i;
					this.loadnPlay();
				},
				checkRadio: ppt.playbackOrderAlbums == i,
				flags: i != 2 ? MF_STRING : MF_GRAYED
			}));
		} else {
			[`All`, `Library tracks`, `Locale (library && cached)`, `Top ${numberTopTracks}`, `Top ${numberTopTracks}: reverse`, `Top ${numberTopTracks}: shuffle`].forEach((v, i) => pMenu.newItem({
				str: v,
				func: () => {
					ppt.playbackOrderTracks = i;
					this.loadnPlay();
				},
				checkRadio: ppt.playbackOrderTracks == i,
				separator: !i || i == 1 || i == 2 || i == 3 || i == 5
			}));

			pMenu.newMenu({menuName: 'Change number of tracks'});
			for (let i = 0; i < 7; i++) pMenu.newItem({
				menuName: 'Change number of tracks',
				str: ['10', '20', '30', '40', '50', '75', '100'][i],
				func: () => ppt.topTracksIX = i,
				checkRadio: i == ppt.topTracksIX,
				separator: i == 3
			});
		}
	}

	recommendationMenu() {
		rMenu.newMenu({});
		
		rMenu.newItem({
			str: 'User:',
			flags: MF_GRAYED,
			separator: true
		});

		['Mix (library + recommendations + loved)\tLast.fm mix', 'Recommendations\tLast.fm mix', 'Neighbours\tLast.fm mix', 'Library\tLast.fm mix', 'Loved'].forEach((v, i) => rMenu.newItem({
			str: v,
			func: () => {
				ppt.lfmUserType = i;
				but.refresh(true);
				alb.calcText();
				alb.getReleases('lfm', 4);
				txt.paint();
			},
			flags: MF_STRING,
			checkRadio: () => i == ppt.lfmUserType,
			separator: i == 4
		}));

		rMenu.newItem({
			str: 'User library: top tracks:',
			flags: MF_GRAYED,
		});

		['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 180 days', 'Last 365 days', 'All time'].forEach((v, i) => rMenu.newItem({
			str: v,
			func: () => {
				ppt.lfmUserType = 5;
				ppt.lfmUserLibSpan = i;
				but.refresh(true);
				alb.calcText();
				alb.getReleases('lfm', 4);
				txt.paint();
			},
			checkRadio: i == ppt.lfmUserLibSpan && ppt.lfmUserType == 5
		}));
	}

	searchMenu() {
		searchMenu.newMenu({});
		['Copy', 'Cut', 'Paste'].forEach((v, i) => searchMenu.newItem({
			str: v,
			func: () => this.setEdit(search, i),
			flags: () => search.start == search.end && i < 2 || i == 2 && !search.paste ? MF_GRAYED : MF_STRING,
			separator: i == 1
		}));
	}

	siteMenu() {
		sMenu.newMenu({});
		['Last.fm', !ppt.lbUserBtn ? 'MusicBrainz' : 'MusicBrainz / ListenBrainz', 'Official charts'].forEach((v, i) => sMenu.newItem({
			str: v,
			func: () => {
				ppt.mb = i;
				alb.toggle('mode');
				if (ppt.logoText) but.btns.mode.w = (!ui.style.isBlur ? 71 : ppt.mb ? 74 : 46) * but.scale;
				but.setBtnsHide();
				filter.metrics();
			},
			checkRadio: () => i == ppt.mb
		}));
	}

	trackMenu() {
		trMenu.newMenu({});

		trMenu.newItem({
			str: 'Artist tracks:',
			flags: MF_GRAYED,
			separator: true
		});

		['Show top tracks', 'Show last.fm mix']
		.forEach((v, i) => trMenu.newItem({
			str: v,
			func: () => {
				ppt.lfmReleaseType = 1;
				ppt.lfmMixTrack = i,
				but.refresh(true);
				alb.calcText();
				alb.getReleases('lfm', ppt.lfmReleaseType)
				txt.paint();
			},
			checkRadio: i == ppt.lfmMixTrack,
			separator: i == 1
		}));

		['Last 7 days\tWeb', 'Last 30 days\tWeb', 'Last 90 days\tWeb', 'Last 180 days\tWeb', 'Last 365 days\tWeb', 'All time\tWeb', 'All time\tAPI'].forEach((v, i) => trMenu.newItem({
			str: v,
			func: () => {
				ppt.lfmTopTrackSpan = i;
				ppt.lfmReleaseType = 1;
				alb.calcText();
				alb.getReleases('lfm', 1);
			},
			flags: !ppt.lfmMixTrack ? MF_STRING : MF_GRAYED,
			checkRadio: i == ppt.lfmTopTrackSpan,
			separator: i == 4 || i == 6
		}));

		trMenu.newMenu({menuName: 'Artist suggestions...'});
		trMenu.newItem({
			menuName: 'Artist suggestions...',
			str: 'Pick artist:',
			flags: MF_GRAYED
		});

		trMenu.addSeparator({menuName: 'Artist suggestions...'});
		for (const [key, value] of Object.entries(this.artists)) {
			trMenu.newMenu({menuName: 'artist1_' + key, str: key, appendTo: 'Artist suggestions...'});
			value.forEach((w, i) => {
				trMenu.newItem({
					menuName: 'artist1_' + key,
					str: w,
					func: () => {ppt.lfmReleaseType = ppt.lfmReleaseType < 2 ? ppt.lfmReleaseType : 1; but.refresh(true); alb.chooseItem(w)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}



		trMenu.addSeparator({});
		
		if (popUpBox.isHtmlDialogSupported()) {
			trMenu.newItem({
				str: 'Full browse && search...',
				func: () => {
					this.fullBrowseSearch('Any item can be selected: the correct album & tracks slot is automatically chosen');
				}
			});
		}
	
		trMenu.addSeparator({});

		trMenu.newItem({
			str: 'Tips and info...',
			func: () => this.tips()
		});
		
	}

	tagMenu() {
		tMenu.newMenu({});

		const tagSimilarArtists = alb.tagMode() && !alb.lfmTagType;
		['Show top tracks' + (!tagSimilarArtists ? '' : '\tN/A for similar artists'), 'Show last.fm mix'].forEach((v, i) => tMenu.newItem({
			str: v,
			func: () => {
				ppt.lfmReleaseType = 2;
				ppt.lfmMixTag = i,
				but.refresh(true);
				alb.calcText();
				alb.getReleases('lfm', ppt.lfmReleaseType)
				txt.paint();
			},
			flags: !i && tagSimilarArtists ? MF_GRAYED : MF_STRING,
			checkRadio: i == ppt.lfmMixTag
		}));

		tMenu.addSeparator({});

		const cur_tags = name.curTags();
		let tags = [{tag: 'Similar artists', value: alb.tag.similar, ix: 0}, {tag: 'Sounds like', value: alb.tag.song, ix: 1}, {tag: 'Genre', value: alb.tag.genre, ix: 2}, {tag: 'Mood', value: alb.tag.mood, ix: 3}, {tag: 'Theme', value: alb.tag.theme, ix: 4}, {tag: 'Decade', value: alb.tag.decade, ix: 5}, {tag: 'Year', value: alb.tag.year, ix: 6}, {tag: 'Locale', value: alb.tag.locale, ix: 7}]
		.filter(v => v.tag == 'Similar artists' || v.tag == 'Sounds like' ? true : v.value != 'N/A');

		tags.forEach((v, i) => tMenu.newItem({
			str: `${v.tag}\t${v.value.replace(/&/g, '&&')}`,
			func: () => {
				ppt.lfmReleaseType = 2;
				if (i < tags.length) alb.lfmTagType = ppt.lfmTagType = v.ix; else alb.checkLfmTagType();
				but.refresh(true);
				alb.calcText();
				alb.getReleases('lfm', 2)
				txt.paint();
			},
			checkItem: ppt.lfmTagType != alb.lfmTagType ? v.ix == alb.lfmTagType : false,
			checkRadio: v.ix == ppt.lfmTagType
		}));
	
		tMenu.addSeparator({});

		tMenu.newItem({
			str: 'Further suggestions:',
			flags: MF_GRAYED
		});

		tMenu.newMenu({menuName: 'Similar...', str: 'Similar artists...'});

		tMenu.newItem({
			menuName: 'Similar...',
			str: 'Pick seed:',
			flags: MF_GRAYED
		});

		tMenu.addSeparator({menuName: 'Similar...'});

		const similarArtists = name.similarArtists();
		tMenu.newMenu({menuName: 'cur_similarArtists', str: 'All current track artists', appendTo: 'Similar...', flags: similarArtists.length ? MF_STRING : MF_GRAYED});

		similarArtists.forEach(v => {
				tMenu.newItem({
					menuName: 'cur_similarArtists',
					str: v,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 0; but.refresh(true); alb.chooseItem(v)},
					flags: v == 'More tags:' || v == 'Similar:' ? MF_GRAYED : MF_STRING,
					separator: v == 'More tags:' ||  v == 'Similar:'
				});
		});

		tMenu.addSeparator({menuName: 'Similar...'});

		for (const [key, value] of Object.entries(this.artists)) {
			tMenu.newMenu({menuName: 'artists1_' + key, str: key, appendTo: 'Similar...'});
			value.forEach((w, i) => {
				tMenu.newItem({
					menuName: 'artists1_' + key,
					str: w,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 0; but.refresh(true); alb.chooseItem(w)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		tMenu.newMenu({menuName: 'Sounds like...'});
		tMenu.newItem({
			menuName: 'Sounds like...',
			str: 'Pick song:',
			flags: MF_GRAYED
		});

		tMenu.addSeparator({menuName: 'Sounds like...'});

		for (const [key, value] of Object.entries(this.songs)) {
			tMenu.newMenu({menuName: 'songs1_' + key, str: key, appendTo: 'Sounds like...'});
			value.forEach((w, i) => {
				tMenu.newItem({
					menuName: 'songs1_' + key,
					str: w,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 1; but.refresh(true); alb.chooseItem(w)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		tMenu.newMenu({menuName: 'Genre...'});
		tMenu.newItem({
			menuName: 'Genre...',
			str: 'Pick genre:',
			flags: MF_GRAYED
		});

		tMenu.addSeparator({menuName: 'Genre...'});

		tMenu.newMenu({menuName: 'cur_genre', str: 'All current track genres', appendTo: 'Genre...', flags: cur_tags.genre.length ? MF_STRING : MF_GRAYED});
		
		cur_tags.genre.forEach((v, i) => {
				tMenu.newItem({
					menuName: 'cur_genre',
					str: v,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 2; but.refresh(true); alb.chooseItem(v)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
		});
		
		tMenu.addSeparator({menuName: 'Genre...'});

		for (const [key, value] of Object.entries(this.genres)) {
			tMenu.newMenu({menuName: 'genre1_' + key, str: key, appendTo: 'Genre...'});
			value.forEach((w, i) => {
				tMenu.newItem({
					menuName: 'genre1_' + key,
					str: w,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 2; but.refresh(true); alb.chooseItem(w)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		tMenu.newMenu({menuName: 'Mood...'});
		tMenu.newItem({
			menuName: 'Mood...',
			str: 'Pick mood:',
			flags: MF_GRAYED
		});

		tMenu.addSeparator({menuName: 'Mood...'});
		
		tMenu.newMenu({menuName: 'cur_mood', str: 'All current track moods', appendTo: 'Mood...', flags: cur_tags.mood.length ? MF_STRING : MF_GRAYED});

		cur_tags.mood.forEach((v, i) => {
				tMenu.newItem({
					menuName: 'cur_mood',
					str: v,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 3; but.refresh(true); alb.chooseItem(v)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
		});
		
		tMenu.addSeparator({menuName: 'Mood...'});

		for (const [key, value] of Object.entries(this.moods)) {
			tMenu.newMenu({menuName: 'mood1_' + key, str: key, appendTo: 'Mood...'});
			value.forEach((w, i) => {
				tMenu.newItem({
					menuName: 'mood1_' + key,
					str: w,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 3; but.refresh(true); alb.chooseItem(w)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});	
		}

		tMenu.newMenu({menuName: 'Theme...'});
		tMenu.newItem({
			menuName: 'Theme...',
			str: 'Pick theme:',
			flags: MF_GRAYED
		});

		tMenu.addSeparator({menuName: 'Theme...'});
		
		tMenu.newMenu({menuName: 'cur_theme', str: 'All current track themes', appendTo: 'Theme...', flags: cur_tags.theme.length ? MF_STRING : MF_GRAYED});
		
		cur_tags.theme.forEach((v, i) => {
				tMenu.newItem({
					menuName: 'cur_theme',
					str: v,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 4; but.refresh(true); alb.chooseItem(v)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
		});
		
		tMenu.addSeparator({menuName: 'Theme...'});

		for (const [key, value] of Object.entries(this.themes)) {
			tMenu.newMenu({menuName: 'theme1_' + key, str: key, appendTo: 'Theme...'});
			value.forEach((w, i) => {
				tMenu.newItem({
					menuName: 'theme1_' + key,
					str: w,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 4; but.refresh(true); alb.chooseItem(w)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});	
		}
		
		tMenu.newMenu({ menuName: 'Decade...'});

		const decade = name.decade();

		txt.decadesMenu.forEach((v, i) => tMenu.newItem({
			menuName: 'Decade...',
			str: ppt.longDecadesFormat ? (v.tag2 != decade ? v.tag2 : `${v.tag2} [current]`) : (v.tag1 != decade ? v.tag1 : `${v.tag1} [current]`),
			func: () => {
				ppt.lfmReleaseType = 2;
				alb.lfmTagType = ppt.lfmTagType = 5;
				but.refresh(true); 
				alb.chooseItem(ppt.longDecadesFormat ? v.tag2 : v.tag1);
				},
			separator: i == txt.decadesMenu.length - 1
		}));

		['20s Style', '2020s style'].forEach((v, i) => tMenu.newItem({
			menuName: 'Decade...',
			str: v,
			func: () => {
				ppt.longDecadesFormat = ppt.longDecadesFormat == 0 ? 1 : 0;
			},
			checkRadio: i == ppt.longDecadesFormat
		}));

		tMenu.newMenu({menuName: 'Year...'});

		const year = name.year()

		this.yearArr.forEach((v, i) => {
			tMenu.newItem({
				menuName: 'Year...',
				str: v != year ? v : `${v} [current]`,
				func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 6; but.refresh(true); alb.chooseItem(v)},
				flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
			});
		});
		
		tMenu.newMenu({menuName: 'Locale...'});
		tMenu.newItem({
			menuName: 'Locale...',
			str: 'Pick locale:',
			flags: MF_GRAYED
		});
		
		tMenu.addSeparator({menuName: 'Locale...'});

		tMenu.newMenu({menuName: 'cur_locale', str: 'All current track locales', appendTo: 'Locale...', flags: cur_tags.locale.length ? MF_STRING : MF_GRAYED});
		
		cur_tags.locale.forEach((v, i) => {
				tMenu.newItem({
					menuName: 'cur_locale',
					str: v,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 7; but.refresh(true); alb.chooseItem(v)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
		});
		
		tMenu.addSeparator({menuName: 'Locale...'});

		for (const [key, value] of Object.entries(this.countries)) {
			tMenu.newMenu({menuName: 'locale1_' + key, str: key, appendTo: 'Locale...'});
			value.forEach((w, i) => {
				tMenu.newItem({
					menuName: 'locale1_' + key,
					str: w,
					func: () => {ppt.lfmReleaseType = 2; alb.lfmTagType = ppt.lfmTagType = 7; but.refresh(true); alb.chooseItem(w)},
					flags: i % 25 == 0 ? MF_STRING | 0x00000040 : MF_STRING
				});
			});
		}

		tMenu.addSeparator({});
		
		if (popUpBox.isHtmlDialogSupported()) {
			tMenu.newItem({
				str: 'Full browse && search...',
				func: () => {
					this.fullBrowseSearch('Any item can be selected: the correct album & tracks slot is automatically chosen');
					}
			});
		}
		
		tMenu.addSeparator({});

		tMenu.newItem({
			str: 'Tips and info...',
			func: () => this.tips()
		});
		
	}
	
	fullBrowseSearch(msg) {
		let source = '';
		ppt.autocompleteLastName = $.titlecase(search.text.replace(/&&/g, '&'));;
		ppt.autocompleteLastType = ppt.autocompleteType = ppt.lfmReleaseType < 2 ? 0 : [0, 1, 2, 3, 4, 5, 7][ppt.lfmTagType];

		const ok_callback = (status, input) => {
			if (status != 'cancel') {
				const inp = $.jsonParse(input, [null, null]);
				if (inp[0]) {
					ppt.lfmReleaseType = !ppt.autocompleteType ? (ppt.lfmReleaseType < 2 ? ppt.lfmReleaseType : 1) : 2;
					if (ppt.autocompleteType) alb.lfmTagType = ppt.lfmTagType = [0, 1, 2, 3, 4, 5, 7][ppt.autocompleteType - 1]
					source = inp[0];
					ppt.autocompleteLastName = source;
					ppt.autocompleteLastType = ppt.autocompleteType;
					but.refresh(true); alb.chooseItem(source);
				} else if (inp[1] !== null) {
					ppt.autocompleteType = inp[1];
					return;						
				}
			}
		}
		popUpBox.autocomplete(2, msg, ok_callback, ppt.autocompleteLastType, ppt.autocompleteLastName, JSON.stringify([this.artistsArr, this.artistsArr, this.songsArr, this.genreArr, this.moodArr, this.themeArr, this.decadeArr, this.localeArr, ppt.autocompleteType]), ppt.autocompleteType == 2);	
	}


	yearMenu() {
		const today = new Date();
		const year = today.getFullYear();
		const years = year - 1952 + 1;
		yMenu.newMenu({});
		for (let i = 0; i < years; i++) yMenu.newItem({
			str: i + 1952,
			func: () => this.setYear(i),
			flags: i == 25 || i == 50 ? MF_STRING | 0x00000040 : MF_STRING,
			checkRadio: () => i == this.chart.year - 1952
		});
	}

	bInsert(item, arr) { 
		let min = 0;
		let max = arr.length;
		let index = Math.floor((min + max) / 2);
		while (max > min) {
			let tmp = [item, arr[index]];
			tmp.sort((a, b) => this.collator.compare(a, b));
			if (item == tmp[0]) max = index;
			else min = index + 1;
			index = Math.floor((min + max) / 2);
		}
        arr.splice(index, 0, item);
	}
	
	createMenuList(name, arr) {
		let init = '';
		let cur = 'currentArr';
		this[name] = {}
		arr.forEach(v => {
			init = v.charAt().toUpperCase();
			if (cur != init) {
				this[name][init] = [v.replace(/&/g, '&&')];
				cur = init;
			} else {
				this[name][init].push(v.replace(/&/g, '&&'));
			}
		});
	}

	createMtags(i) {
		switch (i) {
			case 0:
				if (alb.libraryTest(this.item.artist, this.item.name)) return;
				alb.load(panel.m.x, panel.m.y, !utils.IsKeyPressed(0x11) ? 'mTagsAlbum' : 'mTagsFullAlbum', false, 2);
				break;
			case 1:
				mtags.createFromSelection(this.handleList, plman.ActivePlaylist);
				break;
		}
	}

	daysInMonth(month, year) {
		return new Date(year, month, 0).getDate();
	}

	getAutoDJItems() {
		this.name.art = name.art();
		this.name.artist_title = name.artist_title();
		this.name.artist = name.artist(); 
		this.djOn = dj.on() || ppt.autoRad && plman.PlayingPlaylist == pl.getDJ();
		this.isSoftMode = plman.ActivePlaylist == pl.getSoft() || plman.PlayingPlaylist == pl.getSoft(); 
		this.name.dj = [{name: 'Artist', tag: 'artist', value: this.name.artist, ix: 0, autocomplete: 0}, {name: 'Similar artists: seed', tag: 'similar artists', value: this.name.artist, ix: 2, autocomplete: 1}, {name: 'Sounds like', tag: 'similar songs', value: this.name.artist_title, ix: 3, autocomplete: 2}, 
		{name: 'Genre', tag: 'genre', value: name.genre(), ix: 1, autocomplete: 3}, {name: 'Mood', tag: 'mood', value: name.mood(), ix: 1, autocomplete: 4}, {name: 'Theme', tag: 'theme', value: name.theme(), ix: 1, autocomplete: 5}, {name: 'Decade', tag: 'decade', value: name.decade(), ix: 1, autocomplete: 6}, 
		{name: 'Year', tag: 'year', value: name.year(), ix: 1, autocomplete: null}, {name: 'Locale', tag: 'locale', value: name.locale(), ix: 1, autocomplete: 7}].filter(v => v.value != 'N/A');

		if (ppt.useSaved) {
			this.name.dj.filter(v => {
				const clean =  $.clean(v.value);
				const available =
					$.file(dj.f2 + clean.substr(0, 1).toLowerCase() + '\\' + clean + (v.ix < 2 ? '.json' : v.ix == 2 ? ' and Similar Artists.json' : v.ix == 3 ? ' [Similar Songs].json' : ' - Top Artists.json')) ||
					$.file(dj.f2 + clean.substr(0, 1).toLowerCase() + '\\' + clean + ' [curr]' + (v.ix < 2 ? '.json' : v.ix == 2 ? ' and Similar Artists.json' : v.ix == 3 ? ' [Similar Songs].json' : ' - Top Artists.json'));
					return available;
			});
		}
	}

	getBlacklistImageItems() {
		const imgInfo = img.pth();
		this.img.artist = imgInfo.artist;
		this.path.img = imgInfo.imgPth;
		this.img.isLfm = imgInfo.blk && this.path.img;
		this.img.name = this.img.isLfm ? this.path.img.slice(this.path.img.lastIndexOf('_') + 1) : this.path.img.slice(this.path.img.lastIndexOf('\\') + 1);
		this.img.blacklist = [];
		this.path.imgBlackList = `${panel.storageFolder}blacklist_image.json`;

		if (!$.file(this.path.imgBlackList)) $.save(this.path.imgBlackList, JSON.stringify({
			'blacklist': {}
		}), true);

		if ($.file(this.path.imgBlackList)) {
			this.img.artistClean = $.clean(this.img.artist).toLowerCase();
			this.img.list = $.jsonParse(this.path.imgBlackList, false, 'file');
			this.img.blacklist = this.img.list.blacklist[this.img.artistClean] || [];
		}

		this.img.blacklistStr = [this.img.isLfm ? '+ Add to image black List: ' + this.img.artist + '_' + this.img.name : '+ Add to image black List: ' + (this.img.name ? 'N/A - requires last.fm artist image. Selected image : ' + this.img.name : 'N/A - no image file'), this.img.blacklist.length ? ' - Remove from black List (click name): ' : 'No black listed images for current artist', 'Undo'];
	}

	getBlacklistVideoItems() {
		this.video.blacklist = [];
		const valid = plman.GetPlayingItemLocation().IsValid;
		const pl_loved = plman.FindPlaylist(ppt.playlistLoved) == (fb.IsPlaying && valid ? plman.PlayingPlaylist : plman.ActivePlaylist) ? true : false;

		this.yt_video = panel.isYtVideo(false);
		this.path.vidBlackList = `${panel.storageFolder}blacklist_video.json`;

		if (!$.file(this.path.vidBlackList)) $.save(this.path.vidBlackList, JSON.stringify({
			'blacklist': {}
		}), true);

		this.name.artist_title = name.artist_title();
		this.name.artist = name.artist(); // needed here on init

		if ($.file(this.path.vidBlackList)) {
			this.name.artis = $.tidy(this.name.artist);
			this.video.list = $.jsonParse(this.path.vidBlackList, false, 'file');
			if (this.video.list.blacklist[this.name.artis]) this.video.list.blacklist[this.name.artis].forEach(v => this.video.blacklist.push((v.title + ' [' + v.id.slice(2) + ']').replace(/&/g, '&&')));
		}

		if (this.yt_video) {
			if (!$.eval('%path%').includes('.tags')) {
				this.video.title = $.eval('[%fy_title%]');
				this.video.id = $.eval('[%path%]').slice(-13);
			} else {
				this.video.title = $.eval('[%youtube_title%]');
				const inf = $.eval('[$info(@REFERENCED_FILE)]');
				this.video.id = inf.indexOf('v=');
				this.video.id = inf.slice(this.video.id, this.video.id + 13);
			}
	
			if (!this.video.title) this.video.title = this.name.artist_title.replace(' | ', ' - ');
		}

		this.video.blacklistStr = [(pl_loved ? '\u2661 Unlove' : '\u2665 Add to loved playlist') + (panel.isRadio() ? '' : ': ' + ((name.artist(pl_loved ? !valid : false) ? name.artist(pl_loved ? !valid : false) + ' | ' : '') + name.title(pl_loved ? !valid : false)).replace(/&/g, '&&')), '+ Add to video black List: ' + (this.yt_video ? this.video.title ? this.video.title.replace(/&/g, '&&') + ' [' + this.video.id.slice(2) + ']' : 'N/A - youtube source: title missing' : 'N/A - track not a youtube video'), this.video.blacklist.length ? blk.remove ? ' - Remove from black list (click title  | click here to view): ' : 'View (click title | click here to remove): ' : 'No black listed videos for current artist', 'Undo'];
	}

	getDemonym(source) {
		return this.localeArr.find(key => this.locales[key] === source) || source;
	}

	getMTagsItems(x, y) {
		this.item = null;
		let valid = false;

		if (alb.isAlbum()) {
			const trace = x > alb.x + alb.icon_w;
			if (alb.type.active == 2) {
				const ix = alb.get_ix(x, y);
				valid = ix != -1 && ix < alb.names.list.length && trace;
				if (valid) this.item = alb.names.list[ix];
			}
		}

		const available = ppt.mtagsInstalled && this.handleList.Count;
		const ok = this.item && this.item.artist && this.item.title;
		this.flags.mTags = [ok, available];
		this.str.mTags = [ok ? this.item.artist + ' - ' + this.item.name + ' [' + ['Youtube tracks', 'Prefer library tracks', 'Library tracks'][ppt.libAlb] + (!utils.IsKeyPressed(0x11) ? ']' : '] (full album)') + '...' : 'N/A: no album selected', this.handleList.Count ? 'From playlist selection...' : 'N/A: no playlist items selected'];
	}

	getLoadItems(x, y) {
		const drawExpand = ppt.mb == 1 || !ppt.mb && !ppt.lfmReleaseType;
		const ix = alb.get_ix(x, y);

		const trace = x > alb.x + (drawExpand ? alb.icon_w : 0);
		const valid = ix != -1 && ix < alb.names.list.length && trace;
		const item = valid ? alb.names.list[ix] : null;

		this.flags.load = [false, false, false, false, false, false];

		let yt1 = '';
		let yt2 = '';
		let album = false;

		if (item) {
			yt1 = item.source == 2;
			yt2 = item.source == 1 || item.source == 2 || item.source == 3;
			album = !ppt.mb && ppt.lfmReleaseType == 0 || ppt.mb == 1 && (ppt.mbReleaseType == 1 || ppt.mbReleaseType == 2);

			this.flags.load = [valid, valid, valid && yt2 && album, valid && yt1, valid && yt1, ppt.mb ? (alb.ar_mbid ? true : false) : alb.artist ? true : false];
		}
	}

	getLoadTrackItems(x, y) {
		const ix = alb.get_ix(x, y);
		const valid = ix > 0 && alb.expanded && ix < alb.artists.list.length;
		const item = valid ? alb.artists.list[ix] : null;

		this.flags.loadTracks = [false, false, false, false, false, false];

		let yt1 = '';
		let yt2 = '';
		let album = false;

		if (item) {
			yt1 = item.source == 2;
			yt2 = item.source == 1 || item.source == 2;
			album = false;

			this.flags.loadTracks = [valid, valid, valid && yt2 && album, valid && yt1, valid && yt1, ppt.mb ? (alb.ar_mbid ? true : false) : alb.artist ? true : false];
		}
	}

	getMenuLists() {
		const artist = [];
		const o = {};
		const tf = FbTitleFormat('[$meta(' + name.field.artist + ',0) | $meta(' + name.field.title + ',0)]');
		const tfTitle = FbTitleFormat('[$meta(' + name.field.artist + ',0) | $meta(' + name.field.title + ',0) | ' + ml.playcount + ']');

		let cur = '';
		let db_artists = fb.GetLibraryItems();
		db_artists.OrderByFormat(tf, 1);
		const title = tfTitle.EvalWithMetadbs(db_artists);
		this.artistsArr = [];
		this.songsArr = [];

		for (let i = 0; i < title.length; i++) {
			let item = title[i].split(' | ');
			const art = item[0];
			const song = item[0] + ' | ' + item[1];
			artist.push(art);
			this.songsArr.push(song);
			const pc = item[2] === '' || item[2] === '?' ? 0 : parseInt(item[2]);
			if (song.length < 51) {
				if (!o[art]) o[art] = {name: song, playcount: pc}
				else if (pc > o[art].playcount) o[art] = {name: song, playcount: pc}
			}
		}

		let keys = Object.keys(o);
		let songs = [];
		if (keys.length > 350) {
			keys = $.shuffle(keys);
			keys.sort((a, b) => o[b].playcount - o[a].playcount);
			keys.length = 350;
			keys.sort((a, b) => this.collator.compare(a, b));
			songs = keys.map(v => o[v].name);
		} else songs = keys.map(v => o[v].name);

		const map = artist.reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map());
		let entries = [...map.entries()];
		this.artistsArr = entries.map(v => v[0]);

		fav.stations.forEach(v => {
			if (v.type == 0 || v.type == 2) {
				if (this.artistsArr.every(w => w.toLowerCase() !== v.source.toLowerCase())) this.bInsert(v.source, this.artistsArr);
			}
			if (v.type == 1 && v.tag && !v.query) {
				const arr = this[`${v.tag}Arr`];
				if (arr.every(w => w.toLowerCase() !== v.source.toLowerCase())) this.bInsert(v.source, arr);
			}
			if (v.type == 3) {
				if (this.songsArr.every(w => w.toLowerCase() !== v.source.toLowerCase())) this.bInsert(v.source, this.songsArr);
			}
		});
		this.artistsArr.sort((a, b) => this.collator.compare(a, b));
		const artistsArr = this.artistsArr.map(s => s.toLowerCase()).reduce((map, s, i) => map.get(s) ? map : map.set(s, this.artistsArr[i]), new Map);
		this.artistsArr = [...artistsArr.values()];
		const songsArr = this.songsArr.map(s => s.toLowerCase()).reduce((map, s, i) => map.get(s) ? map : map.set(s, this.songsArr[i]), new Map);
		this.songsArr = [...songsArr.values()];
		
		entries = entries.sort((a, b) => b[1] - a[1]);
		if (entries.length > 400) entries.length = 400;
		const artists = entries.map(v => v[0]);
		artists.sort((a, b) => this.collator.compare(a, b));
		let init = '';
		cur = 'currentArtist';
		this.artists = {}
		artists.forEach(v => {
			init = v.charAt().toUpperCase();
			if (cur != init) {
				let name = v.replace(/&/g, '&&');
				if (name.length > 23) name = name.slice(0, 20) + '...'; 
				this.artists[init] = [name];
				cur = init;
			} else {
				let name = v.replace(/&/g, '&&');
				if (name.length > 23) name = name.slice(0, 20) + '...';
				this.artists[init].push(name);
			}
		});
		this.artists = this.pickLongest(this.artists, 30);
		init = '';
		cur = 'currentSong';
		this.songs = {}
		songs.forEach(v => {
			init = v.charAt().toUpperCase();
			if (cur != init) {
				this.songs[init] = [v.replace(/&/g, '&&')];
				cur = init;
			} else {
				this.songs[init].push(v.replace(/&/g, '&&'));
			}
		});
		this.songs = this.pickLongest(this.songs, 30);
		this.createMenuList('countries', this.localeArr);
		this.createMenuList('genres', this.genresMain);
		this.createMenuList('demonyms', this.localeArr);
		this.createMenuList('moods', this.moodArr);
		this.createMenuList('themes', this.themeArr);
		this.genreArr = [...this.genresMain, ...this.genresMore];
		this.genreArr.sort((a, b) => this.collator.compare(a, b));
		this.decadeArr = txt.decadesMenu.map(v => v.tag1);
		txt.decadesMenu.forEach(v => this.decadeArr.push(v.tag2));
	}

	getNewSelectionMenu() {
		return !ppt.playlistSoftMode ? 'Auto DJ...' : 'Find tracks in library...';
	}

	loadAutoDJ() {
		ppt.playlistSoftMode = false;
		ppt.cur_dj_mode = ppt.last_cur_dj_mode;
		ppt.djOwnData = ppt.lastDjOwnData;
		ppt.djMode = ppt.lastDjMode;
		ppt.libDj = ppt.lastLibDj;
	}

	loadFind() {
		ppt.playlistSoftMode = true;
		ppt.cur_dj_mode = ppt.findOwnData + 2;
		ppt.djOwnData = ppt.findOwnData;
		ppt.djMode = ppt.findOwnData + 2;
		ppt.libDj = 2;
	}
	
	loadItem(i, x, y, type) {
		if (i == 3) {
			const j = alb.get_ix(x, y);
			if (j < alb.names.list.length) {
				if (alb.names.list[j].vid) alb.names.list[j].vid = '';
			}
		}
		i < 5 ? alb.load(x, y, i == 2 ? 0x0008 : i == 3 ? 0x0004 : i == 4 ? 'remove' : 0, i > 0 && i < 4, type) : alb.openSite();
	}

	loadnPlay() {
		if (yt_dj.timer) return;
		if (alb.isAlbum()) alb.loadHandleList(ppt.playbackOrderAlbums);
		else if (ppt.playbackOrderTracks == 1) alb.loadHandleList(true);
		else if (ppt.playbackOrderTracks == 2) alb.loadHandleList();
		else {
			const numberTopTracks = !ppt.playbackOrderTracks ? 100 : [10, 20, 30, 40, 50, 75, 100][ppt.topTracksIX];
			alb.playlist = [];
			let callsToYt = 0;
			let tmpLimit = 0;
			for (let j = 0; j < alb.names.list.length; j++) {
				const v = alb.names.list[j];
				if (v.source == 1 && !v.vid) callsToYt++;
				if (callsToYt > dj.limit) {
					tmpLimit = j;
					break;
				}
				tmpLimit = alb.names.list.length;
			}
			for (let j = 0; j < alb.names.list.length; j++) {
				const v = alb.names.list[j];
				alb.playlist.push({
					artist: v.artist,
					title: !ppt.mb && ppt.lfmReleaseType ? $.stripRemaster(v.title) : v.title,
					length: v.length,
					vid: v.vid,
					thumbnail: v.thumbnail,
				});
				if (alb.playlist.length == numberTopTracks) break;
			}
			alb.limit = Math.max(tmpLimit, dj.limit);

			if (ppt.playbackOrderTracks == 4) alb.playlist.reverse()
			if (ppt.playbackOrderTracks == 5) alb.playlist = !ppt.mb && ppt.lfmReleaseType == 1 ? $.shuffle(alb.playlist) : alb.getList(alb.playlist, []);

			if (alb.playlist.length) {
				pl.saveName = '';
				alb.playlist[0].executedPlay = false;
				ppt.playTracksList = JSON.stringify(alb.playlist);
				switch (ppt.mb) {
					case 0:
						switch(ppt.lfmReleaseType) {
							case 1:
								dj.source = `${search.text}\nLast.fm ${alb.type.lfm[ppt.lfmReleaseType]}`;
								pl.saveName = `${!ppt.lfmMixTrack ? 'Last.fm' : ''} ${alb.type.lfm[ppt.lfmReleaseType]}: ${search.text}`;
								break;
							case 2: {
								const prefix = !alb.lfmTagType ? 'Last.fm Mix' : (ppt.lfmMixTag ? 'Last.fm Mix' : 'Last.fm Top Tracks');
								const suffix = !alb.lfmTagType ? ' and Similar Artists' : '';
								dj.source = `${search.text}${suffix}\n${prefix}`;
								pl.saveName = `${prefix}: ${search.text}${suffix}`;
								break;
							}
							case 3: {
								const d = new Date();
								dj.source = `Last.fm ${alb.type.lfm[ppt.lfmReleaseType]}\nReal Time`;
								pl.saveName = `Last.fm ${alb.type.lfm[ppt.lfmReleaseType]}: Real Time: ${d.toLocaleDateString()}`;
								break;
							}
							case 4: {
								const suff = ppt.lfmUserType < 4 ? 'Radio' : '';
								dj.source = `${alb.type.lfm[ppt.lfmReleaseType]} ${suff}\nLast.fm`;
								pl.saveName = `Last.fm ${alb.type.lfm[ppt.lfmReleaseType]} ${suff} (${ppt.lfmUserName})`;
								break;
							}
						}
						dj.source += index.nm[4] + alb.playlist.length + ' track' + (alb.playlist.length > 1 ? 's' : '');
						dj.source += ['', '', '', '', ' (reverse order)', ' (shuffle)'][ppt.playbackOrderTracks];
						break;
					case 1:
						if (ppt.mbReleaseType != 5) break;
						dj.source = `${alb.lbDisplay()}\nListenBrainz`;
						pl.saveName = alb.lbPlName();
						dj.source += index.nm[4] + alb.playlist.length + ' track' + (alb.playlist.length > 1 ? 's' : '');
						dj.source += ['', '', '', '', ' (reverse order)', ' (shuffle)'][ppt.playbackOrderTracks];
						break;
					case 2:
						dj.source = `${search.text}\nOfficial Chart`;
						pl.saveName = `Official Chart: ${search.text}`;
						break
				}
				if (ppt.lfmReleaseType != 3) {
					const targetPlaylist = plman.FindPlaylist(pl.saveName);
					if (targetPlaylist != -1) plman.RemovePlaylistSwitch(targetPlaylist); // sites stats change: so refresh on reload
				}
				ppt.cur_dj_source = index.cur_dj_source = dj.source;
				dj.loadnPlay();
			}
		}
	}

	pickLongest(obj, num = 1) {
		const requiredObj = {};
		if (num > Object.keys(obj).length){
		return obj;
		}
		const keys = [];
		Object.keys(obj).sort((a, b) => obj[b].length - obj[a].length).forEach((key, ind) => {
			if (ind < num) keys.push(key);
		});
		keys.sort((a, b) => this.collator.compare(a, b));
		keys.forEach(key => requiredObj[key] = obj[key]);
		return requiredObj;
	}

	rbtn_up(x, y) {
		this.right_up = true;
		this.getAutoDJItems();
		this.getLoadItems(x, y);
		this.getLoadTrackItems(x, y);
		this.handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
		this.getMTagsItems(x, y)
		this.getBlacklistVideoItems();
		if (!ui.style.textOnly) this.getBlacklistImageItems();

		if (panel.youTube.backUp) {
			let ytTrack = false;
			const urls = tf.fy_url.EvalWithMetadbs(this.handleList);
			ytTrack = urls.some(v => v.replace(/[./\\]/g, '').includes('youtubecomwatch'));
			this.str.save = ['Auto save:', 'Youtube tracks: best audio', 'Youtube tracks: best video && audio', 'Selected:' + (!this.handleList.Count ? ' N/A: no playlist items selected' : ''), 'Youtube tracks: best audio...' + (!ytTrack && this.handleList.Count ? ' N/A: no youtube track selected' : ''), 'Youtube tracks: best video && audio...' + (!ytTrack && this.handleList.Count ? ' N/A: no youTube track selected' : ''), 'Youtube tracks: Cancel auto save'];
			this.flags.save = [false, true, true, false, ytTrack, ytTrack, sv.autoTimer || sv.audioTimer || sv.videoTimer];
		}

		menu.load(x, y);
		this.right_up = false;
	}

	removeFromCache(id) {
		alb.names.list.some(v => {
			if ('v=' + v.vid == id) {
				v.vid = '';
				txt.paint();
				return true;
			}
		});
		const handleList = $.query(lib.db.cache, 'NOT %path% HAS ' + id);
		const pn = pl.cache();
		pl.clear(pn);
		plman.InsertPlaylistItems(pn, 0, handleList);
	}

	setArtist(name, type) {
		ppt.autocompleteIsCaller = 0;
		ppt.autocompleteLastName = name;
		ppt.autocompleteLastType = ppt.autocompleteType = [0, 3, 1, 2][type];
		index.getAutoDj(name, ppt.djMode, type, ppt.lfm_variety, ppt.djRange);
	}

	setAutoDJ(v, tag, msg) {
		let query = false;
		if (v.tag) {
			ppt.autocompleteIsCaller = 0;
			if (v.autocomplete !== null) {
				ppt.autocompleteLastName = v.value;
				ppt.autocompleteLastType = ppt.autocompleteType = v.autocomplete;
			}
			index.getAutoDj(v.value, ppt.djMode, v.ix == 1 && !ppt.genre_tracks ? 4 : v.ix, ppt.lfm_variety, ppt.djRange, '', '', v.ix != 1 ? '' : v.tag);
		} else {
			let djType = 0;
			let djSource = '';
				const ok_callback = (status, input) => {
					if (status != 'cancel') {
						if (popUpBox.isHtmlDialogSupported()) {
							const inp = $.jsonParse(input, [null, null]);
							if (inp[0]) {
								djSource = inp[0];
								djType = [0, 2, 3, 1, 1, 1, 1, 1][ppt.autocompleteType];
								tag = ['', '', '', 'genre', 'mood', 'theme', 'decade', 'locale'][ppt.autocompleteType]
								ppt.autocompleteLastName = djSource;
								ppt.autocompleteLastType = ppt.autocompleteType;
								if (djType == 1 && tag == 'locale') djSource = this.locales[djSource];
								if (ppt.autocompleteType == 6 && ppt.djMode == 3) {
									let ix = this.decadeArr.indexOf(djSource);
									if (ix != -1) {
										if (ix < 8) djSource = txt.decadesMenu[ix].query;
										else if (ix < 16) djSource = txt.decadesMenu[ix - 8].query;
										query = true;
									}
								}
							} else if (inp[1] !== null) {
								ppt.autocompleteType = inp[1];
								return;						
							}
						} else {
							djSource = input;
							if (djType == 1 && tag == 'locale') djSource = this.locales[djSource];
						}
					}
				}
			if (v != 'autocompleteType' && !v.tag) {
				const ac = {
					genre: 3,
					mood: 4,
					theme: 5,
					decade: 6,
					locale: 7
				}
				ppt.autocompleteType = v == 0 ? 0 : v == 2 ? 1 : v == 3 ? 2  : ac[tag];
			}
			ppt.autocompleteIsCaller = popUpBox.isHtmlDialogSupported();
			const fallback = popUpBox.isHtmlDialogSupported() ? popUpBox.autocomplete(ppt.playlistSoftMode, msg, ok_callback, ppt.autocompleteLastType, ppt.autocompleteLastName, JSON.stringify([this.artistsArr, this.artistsArr, this.songsArr, this.genreArr, this.moodArr, this.themeArr, this.decadeArr, this.localeArr, ppt.autocompleteType]), ppt.autocompleteType == 2) : true;	
			if (fallback) {
				let ns = '';
				const caption = ['Enter artist', 'Enter seed artist for similar artists', 'Enter seed song (artist | title)', 'Enter genre', 'Enter mood', 'Enter theme', 'Enter decade', 'Enter locale'][ppt.autocompleteType];
				let status = 'ok';
				try {
					ns = utils.InputBox(0, '', caption, index.cur_dj_source, true);
				} catch(e) {
					status = 'cancel';
				}
				ok_callback(status, ns);
			}
			if (djSource) index.getAutoDj($.titlecase(djSource), ppt.djMode, djType == 1 && !ppt.genre_tracks ? 4 : djType, ppt.lfm_variety, ppt.djRange, false, query, tag);
		}
	}

	setBlacklistVideo() {
		if (this.video.list.blacklist[this.name.artis]) $.sort(this.video.list.blacklist[this.name.artis], 'title');
		blk.artist = '';
		$.save(this.path.vidBlackList, JSON.stringify({'blacklist': $.sortKeys(this.video.list.blacklist)}, null, 3), true);
	}

	setDataType(i) {
		if (i < 2) {
			ppt.findOwnData = i;
			this.setDjMode(i + 2, false);
		} else {
			if (ppt.findOwnData) {
				ppt.findOwnDataSort = i - 2;
			} else {
				ppt.findLfmDataSort = i - 2;
			}
		}
	}

	setDay(i) {
		this.chart.day = i + 1;
		ppt.chartDate = parseInt([this.chart.year, $.padNumber(this.chart.month, 2), $.padNumber(this.chart.day, 2)].join(''));
		but.btns.day.p2 = $.padNumber(this.chart.day, 2);
		panel.clampChartDate();
		alb.chartDate = '';
		alb.getReleases('chart', 5);
	}

	setDecade(i) {
		if (i < txt.decadesMenu.length) {
			let djSource = txt.decadesMenu[i];
			if (ppt.djMode == 3) djSource = txt.decadesMenu[i].query;
			else djSource = ppt.longDecadesFormat ? txt.decadesMenu[i].tag2 : txt.decadesMenu[i].tag1;
			if (djSource) {
				ppt.autocompleteIsCaller = 0;
				ppt.autocompleteLastName = $.titlecase(djSource);
				ppt.autocompleteLastType = ppt.autocompleteType = 6;
				index.getAutoDj($.titlecase(djSource), ppt.djMode, 1, ppt.lfm_variety, ppt.djRange, false, ppt.djMode == 3 ? true : false, 'decade');
			}
		} else ppt.longDecadesFormat = ppt.longDecadesFormat == 0 ? 1 : 0;
	}

	setDjMode(i, autoDJ) {
		if (i < 4 && autoDJ) {
			ppt.lastDjMode = [1, 1, 2, 3][i];
			ppt.lastLibDj = [0, 1, 2, 2][i];
			ppt.lastDjOwnData = i < 3 ? 0 : 1;
		}
		lib.update.artists = true;
		if (!ml.fooYouTubeInstalled && i < 2 && ppt.foo_youtubeNotInstalledMsg && popUpBox.isHtmlDialogSupported()) popUpBox.message();
	}

	setEdit(item, i) {
		switch (i) {
			case 0:
				item.on_char(vk.copy);
				break;
			case 1:
				item.on_char(vk.cut);
				break;
			case 2:
				item.on_char(vk.paste, true);
				break;
		}
	}

	setFavourites(i, source, type, tag, query, ownData) {
		if (type == 1 && tag == 'locale' && ownData) {
				source = this.locales[source];
			}
		if (fav.stations.length && i < fav.stations.length) {
			let checkedSource = fav.stations[i].source;
			if (type == 1 && tag == 'locale' && ownData) {
				checkedSource = this.locales[fav.stations[i].source];
			}
			if (checkedSource) {
				ppt.autocompleteIsCaller = 0;
				ppt.autocompleteLastName = checkedSource.replace(' [Query]', '');
				const t = fav.stations[i].type;
				const ac = {
					genre: 3,
					mood: 4,
					theme: 5,
					decade: 6,
					locale: 7
				}
				ppt.autocompleteLastType = ppt.autocompleteType = t == 0 ? 0 : t == 2 ? 1 : t == 3 ? 2 : ac[fav.stations[i].tag];
				index.getAutoDj(checkedSource.replace(' [Query]', ''), ppt.djMode, fav.stations[i].type == 1 && !ppt.genre_tracks && !fav.stations[i].query ? 4 : fav.stations[i].type, ppt.lfm_variety, ppt.djRange, true, fav.stations[i].query, fav.stations[i].type == 1 ? fav.stations[i].tag : '');
			}
		}
		if (i == fav.stations.length + 1) fav.toggle_auto(source, type, tag, query);
		if (!ppt.autoFav) {
			if (i == fav.stations.length + 2) {
				fav.addCurrentStation(source, type, tag, query);
				return;
			}
			if (i == fav.stations.length + 3) {
				fav.removeCurrentStation(source, type, tag, query);
				return;
			}
			if (i == fav.stations.length + 4) {
				const continue_confirmation = (status, confirmed) => {
					if (confirmed) {
						fav.save('No Favourites');
						return;
					}
				}
				const caption = 'Reset list';
				const prompt = 'This action removes all items from the list\n\nContinue?';
				const wsh = popUpBox.isHtmlDialogSupported() ? popUpBox.confirm(caption, prompt, 'Yes', 'No', '', '', continue_confirmation) : true;
				if (wsh) continue_confirmation('ok', $.wshPopup(prompt, caption));	
			}
		}
	}

	setImageBlacklist(i) {
		if (!i) {
			if (!this.img.list.blacklist[this.img.artistClean]) this.img.list.blacklist[this.img.artistClean] = [];
			this.img.list.blacklist[this.img.artistClean].push(this.img.name);
		} else if (img.blackList.undo[0] == this.img.artistClean && i == 2) {
			if (!this.img.list.blacklist[img.blackList.undo[0]]) this.img.list.blacklist[this.img.artistClean] = [];
			if (img.blackList.undo[1].length) this.img.list.blacklist[img.blackList.undo[0]].push(img.blackList.undo[1]);
			img.blackList.undo = [];
		} else {
			const bl_ind = i - (img.blackList.undo[0] == this.img.artistClean ? 3 : 2);
			img.blackList.undo = [this.img.artistClean, this.img.list.blacklist[this.img.artistClean][bl_ind]];
			this.img.list.blacklist[this.img.artistClean].splice(bl_ind, 1);
			$.removeNulls(this.img.list);
		}

		let bl = this.img.list.blacklist[this.img.artistClean];
		if (bl) this.img.list.blacklist[this.img.artistClean] = $.sort([...new Set(bl)]);
		img.blackList.artist = '';
		$.save(this.path.imgBlackList, JSON.stringify({'blacklist': $.sortKeys(this.img.list.blacklist)}, null, 3), true);

		img.chkArtImg();
		window.NotifyOthers('bio_blacklist', 'bio_blacklist');
	}

	setMonth(i) {
		this.chart.month = i + 1;
		ppt.chartDate = parseInt([this.chart.year, $.padNumber(this.chart.month, 2), $.padNumber(this.chart.day, 2)].join(''));
		but.btns.month.p2 = $.padNumber(this.chart.month, 2);
		panel.clampChartDate();
		alb.chartDate = '';
		alb.getReleases('chart', 5);
	}

	setPlaylist(i) {
		plman.ActivePlaylist = pl.menu[i].ix;
	}

	setPlaylistEnabled(i) {
		plman.ActivePlaylist = pl.enabled[i].ix;
	}

	setSave(i) {
		switch (i) {
			case 1:
				sv.set(sv.trk == 1 ? 0 : 1);
				break;
			case 2:
				sv.set(sv.trk == 2 ? 0 : 2);
				break;
			case 4:
				sv.audio();
				break;
			case 5:
				sv.video();
				break;
			case 6:
				sv.track(false);
				sv.audioHandles = new FbMetadbHandleList();
				clearTimeout(sv.audioTimer);
				sv.audioTimer = null;
				sv.videoHandles = new FbMetadbHandleList();
				clearTimeout(sv.videoTimer);
				sv.videoTimer = null;
				break;
		}
	}

	setStyles() {		
		this.genresMain =  [
			"2 Tone",
			"2-Step",
			"Acid Breaks",
			"Acid House",
			"Acid Jazz",
			"Acid Rock",
			"Acid Techno",
			"Acid Trance",
			"Acoustic Blues",
			"Acoustic Rock",
			"Afoxê",
			"African Blues",
			"Afro-Cuban Jazz",
			"Afrobeat",
			"Aggrotech",
			"Algorave",
			"Alternative Country",
			"Alternative Dance",
			"Alternative Folk",
			"Alternative Hip Hop",
			"Alternative Metal",
			"Alternative Pop",
			"Alternative Punk",
			"Alternative Rock",
			"Ambient",
			"Ambient Dub",
			"Ambient House",
			"Ambient Noise Wall",
			"Ambient Pop",
			"Ambient Techno",
			"Ambient Trance",
			"American Primitive Guitar",
			"Americana",
			"Anarcho-Punk",
			"Anatolian Rock",
			"Andalusian Classical",
			"Anti-Folk",
			"AOR",
			"Appalachian Folk",
			"Arena Rock",
			"Ars Antiqua",
			"Ars Nova",
			"Ars Subtilior",
			"Art Pop",
			"Art Punk",
			"Art Rock",
			"Atmospheric Black Metal",
			"Atmospheric Sludge Metal",
			"Avant-Folk",
			"Avant-Garde",
			"Avant-Garde Jazz",
			"Avant-Garde Metal",
			"Avant-Garde Pop",
			"Avant-Prog",
			"Axé",
			"Bachata",
			"Baião",
			"Balearic Beat",
			"Ballad",
			"Baltimore Club",
			"Barbershop",
			"Bardcore",
			"Baroque",
			"Baroque Pop",
			"Bass House",
			"Bassline",
			"Battle Rap",
			"Batucada",
			"Beat Music",
			"Bebop",
			"Beijing Opera",
			"Benga",
			"Berlin School",
			"Bhangra",
			"Big Band",
			"Big Beat",
			"Big Room House",
			"Black Ambient",
			"Black Metal",
			"Blackened Death Metal",
			"Blackgaze",
			"Bleep Techno",
			"Blue-Eyed Soul",
			"Bluegrass",
			"Bluegrass Gospel",
			"Blues",
			"Blues Rock",
			"Bolero",
			"Bolero Son",
			"Bongo Flava",
			"Boogie Rock",
			"Boogie-Woogie",
			"Boom Bap",
			"Bossa Nova",
			"Bounce",
			"Breakbeat",
			"Breakbeat Hardcore",
			"Breakcore",
			"Breaks",
			"Brega",
			"Brega Funk",
			"Brill Building",
			"Brit Funk",
			"Britcore",
			"Britpop",
			"Broken Beat",
			"Brostep",
			"Brutal Death Metal",
			"Brutal Prog",
			"Bubblegum Bass",
			"Bubblegum Pop",
			"Bytebeat",
			"Cabaret",
			"Cajun",
			"Calypso",
			"Campus Folk",
			"Canción Melódica",
			"Candombe",
			"Canterbury Scene",
			"Cantopop",
			"Canzone Napoletana",
			"Cape Jazz",
			"Carimbó",
			"Carnatic Classical",
			"Celtic",
			"Celtic Punk",
			"Celtic Rock",
			"Chacarera",
			"Chachachá",
			"Chalga",
			"Chamamé",
			"Chamber Folk",
			"Chamber Pop",
			"Champeta",
			"Changüí",
			"Chanson à Texte",
			"Chanson Française",
			"Chicago Blues",
			"Chicano Rap",
			"Children's",
			"Chillout",
			"Chillstep",
			"Chillsynth",
			"Chillwave",
			"Chimurenga",
			"Chinese Revolutionary Opera",
			"Chiptune",
			"Chopped And Screwed",
			"Choro",
			"Christian Metal",
			"Christian Rock",
			"Christmas Music",
			"Chutney",
			"City Pop",
			"Classic Blues",
			"Classic Country",
			"Classic Jazz",
			"Classic Rock",
			"Classical",
			"Classical Crossover",
			"Cloud Rap",
			"Club",
			"Coco",
			"Coladeira",
			"Coldwave",
			"Comedy",
			"Comedy Hip Hop",
			"Comedy Rock",
			"Comedy/Spoken",
			"Compas",
			"Complextro",
			"Conscious Hip Hop",
			"Contemporary Christian",
			"Contemporary Classical",
			"Contemporary Country",
			"Contemporary Folk",
			"Contemporary Gospel",
			"Contemporary Jazz",
			"Contemporary R&B",
			"Contra",
			"Cool Jazz",
			"Copla",
			"Corrido",
			"Country",
			"Country Blues",
			"Country Boogie",
			"Country Folk",
			"Country Pop",
			"Country Rap",
			"Country Rock",
			"Country Soul",
			"Coupé-Décalé",
			"Cowpunk",
			"Crossbreed",
			"Crossover Jazz",
			"Crossover Prog",
			"Crossover Thrash",
			"Crunk",
			"Crust Punk",
			"Cumbia",
			"Cumbia Villera",
			"Cuplé",
			"Cyber Metal",
			"Cybergrind",
			"Cyberpunk",
			"D-Beat",
			"Dance",
			"Dance-Pop",
			"Dance-Punk",
			"Dance-Rock",
			"Dancehall",
			"Dangdut",
			"Dansband",
			"Danzón",
			"Dark Ambient",
			"Dark Cabaret",
			"Dark Electro",
			"Dark Folk",
			"Dark Jazz",
			"Dark Psytrance",
			"Dark Wave",
			"Darkstep",
			"Darksynth",
			"Death 'n' Roll",
			"Death Industrial",
			"Death Metal",
			"Death-Doom Metal",
			"Deathcore",
			"Deathgrind",
			"Deathrock",
			"Deathstep",
			"Deconstructed Club",
			"Deep Funk",
			"Deep House",
			"Deep Techno",
			"Delta Blues",
			"Denpa",
			"Depressive Black Metal",
			"Descarga",
			"Desert Blues",
			"Desert Rock",
			"Detroit Techno",
			"Dhrupad",
			"Digicore",
			"Digital Hardcore",
			"Disco",
			"Disco Polo",
			"Dixieland",
			"Djent",
			"Doo-Wop",
			"Doom Metal",
			"Doomcore",
			"Downtempo",
			"Dream Pop",
			"Dream Trance",
			"Dreampunk",
			"Drill",
			"Drill And Bass",
			"Drone",
			"Drone Metal",
			"Drum And Bass",
			"Drumstep",
			"Dub",
			"Dub Poetry",
			"Dub Techno",
			"Dubstep",
			"Dungeon Synth",
			"Eai",
			"East Coast Hip Hop",
			"Easy Listening",
			"Easycore",
			"EBM",
			"EDM",
			"Electric Blues",
			"Electro",
			"Electro House",
			"Electro Swing",
			"Electro-Funk",
			"Electro-Industrial",
			"Electroclash",
			"Electronic",
			"Electronic Rock",
			"Electronica",
			"Electronicore",
			"Electropop",
			"Electropunk",
			"Electrotango",
			"Emo",
			"Emo Pop",
			"Emo Rap",
			"Emocore",
			"Enka",
			"éntekhno",
			"Epic Collage",
			"Ethereal Wave",
			"Euro House",
			"Euro-Disco",
			"Eurobeat",
			"Eurodance",
			"Europop",
			"Exotica",
			"Experimental",
			"Experimental Big Band",
			"Experimental Hip Hop",
			"Experimental Rock",
			"Extratone",
			"Fado",
			"Fandango",
			"Fidget House",
			"Filk",
			"Finnish Tango",
			"Flamenco",
			"Flamenco Jazz",
			"Flashcore",
			"Folk",
			"Folk Metal",
			"Folk Pop",
			"Folk Punk",
			"Folk Rock",
			"Folktronica",
			"Footwork",
			"Forró",
			"Forró Eletrônico",
			"Forró Universitário",
			"Freak Folk",
			"Freakbeat",
			"Free Folk",
			"Free Improvisation",
			"Free Jazz",
			"Free Tekno",
			"Freeform Hardcore",
			"French House",
			"Frenchcore",
			"Frevo",
			"Fuji",
			"Funaná",
			"Funeral Doom Metal",
			"Funk",
			"Funk Carioca",
			"Funk Metal",
			"Funk Rock",
			"Funk Soul",
			"Funkot",
			"Funktronica",
			"Funky House",
			"Future Bass",
			"Future Funk",
			"Future Garage",
			"Future House",
			"Future Jazz",
			"Futurepop",
			"G-Funk",
			"Gabber",
			"Gagaku",
			"Gangsta Rap",
			"Garage House",
			"Garage Punk",
			"Garage Rock",
			"Għana",
			"Ghazal",
			"Ghetto House",
			"Ghettotech",
			"Glam",
			"Glam Metal",
			"Glam Punk",
			"Glam Rock",
			"Glitch",
			"Glitch Hop",
			"Glitch Pop",
			"Go-Go",
			"Goa Trance",
			"Goregrind",
			"Gorenoise",
			"Gospel",
			"Gothic",
			"Gothic Country",
			"Gothic Metal",
			"Gothic Rock",
			"Grebo",
			"Gregorian Chant",
			"Grime",
			"Grindcore",
			"Groove Metal",
			"Group Sounds",
			"Grunge",
			"Guaguancó",
			"Guajira",
			"Guaracha",
			"Gypsy Jazz",
			"Gypsy Punk",
			"Happy Hardcore",
			"Hard Bop",
			"Hard House",
			"Hard Rock",
			"Hard Trance",
			"Hardbass",
			"Hardcore Hip Hop",
			"Hardcore Punk",
			"Hardcore Techno",
			"Hardstyle",
			"Hardvapour",
			"Harsh Noise",
			"Harsh Noise Wall",
			"Hauntology",
			"Heartland Rock",
			"Heavy Metal",
			"Heavy Psych",
			"Heavy Rock",
			"Hexd",
			"Hi-Nrg",
			"Highlife",
			"Hindustani Classical",
			"Hip Hop",
			"Hip House",
			"Hiplife",
			"Holiday",
			"Honky Tonk",
			"Hopepunk",
			"Horror Punk",
			"Horrorcore",
			"House",
			"Huapango",
			"Huayno",
			"Hyperpop",
			"Hyphy",
			"IDM",
			"Idol Kayō",
			"Illbient",
			"Impressionism",
			"Indian Pop",
			"Indie",
			"Indie Folk",
			"Indie Pop",
			"Indie Rock",
			"Indietronica",
			"Indorock",
			"Industrial",
			"Industrial Hardcore",
			"Industrial Hip Hop",
			"Industrial Metal",
			"Industrial Musical",
			"Industrial Rock",
			"Industrial Techno",
			"Instrumental",
			"Instrumental Hip Hop",
			"Instrumental Jazz",
			"Instrumental Rock",
			"International",
			"Irish Folk",
			"Italo Dance",
			"Italo-Disco",
			"J-Core",
			"J-Pop",
			"J-Rock",
			"Jaipongan",
			"Jangle Pop",
			"Jazz",
			"Jazz Blues",
			"Jazz Fusion",
			"Jazz Rap",
			"Jazz Rock",
			"Jazz-Funk",
			"Joik",
			"Jota",
			"Jùjú",
			"Juke",
			"Jump Blues",
			"Jump Up",
			"Jungle",
			"Jungle Terror",
			"K-Pop",
			"Kabarett",
			"Kaseko",
			"Kasékò",
			"Kawaii Future Bass",
			"Kawaii Metal",
			"Kayōkyoku",
			"Keroncong",
			"Khyal",
			"Kizomba",
			"Kleinkunst",
			"Klezmer",
			"Könsrock",
			"Korean Revolutionary Opera",
			"Krautrock",
			"Kuduro",
			"Kwaito",
			"Latin",
			"Latin Ballad",
			"Latin Jazz",
			"Latin Pop",
			"Latin Rock",
			"Latin Soul",
			"Leftfield",
			"Levenslied",
			"Line Dance",
			"Liquid Funk",
			"Lo-Fi",
			"Lo-Fi Hip Hop",
			"Lolicore",
			"Louisiana Blues",
			"Lounge",
			"Lovers Rock",
			"Lowercase",
			"Luk Krung",
			"Luk Thung",
			"Madchester",
			"Mainstream Rock",
			"Makina",
			"Makossa",
			"Maloya",
			"Mambo",
			"Mandopop",
			"Mangue Beat",
			"Manila Sound",
			"March",
			"Marchinha",
			"Mariachi",
			"Marrabenta",
			"Martial Industrial",
			"Mashcore",
			"Maskanda",
			"Math Rock",
			"Mathcore",
			"Mbalax",
			"Mbaqanga",
			"Mbube",
			"Medieval",
			"Melodic Black Metal",
			"Melodic Death Metal",
			"Melodic Dubstep",
			"Melodic Hardcore",
			"Melodic Metalcore",
			"Melodic Rock",
			"Melodic Techno",
			"Melodic Trance",
			"Mento",
			"Merengue",
			"Merequetengue",
			"Metal",
			"Metalcore",
			"Miami Bass",
			"Microhouse",
			"Microsound",
			"Midtempo Bass",
			"Milonga",
			"Min'yō",
			"Mincecore",
			"Minimal Drum And Bass",
			"Minimal Techno",
			"Minimal Wave",
			"Minimalism",
			"Mod",
			"Modal Jazz",
			"Modern Blues",
			"Modern Classical",
			"Modern Country",
			"Mood Kayō",
			"Moombahcore",
			"Moombahton",
			"Mor Lam",
			"Morna",
			"Motown",
			"Mpb",
			"Muiñeira",
			"Musical",
			"Musique Concrète",
			"Narcocorrido",
			"Nasheed",
			"Nashville Sound",
			"Nature Sounds",
			"Nederpop",
			"Neo Soul",
			"Neo-Progressive Rock",
			"Neo-Psychedelia",
			"Neo-Rockabilly",
			"Neo-Traditional Country",
			"Neoclassical Dark Wave",
			"Neoclassical Metal",
			"Neoclassicism",
			"Neofolk",
			"Nerdcore",
			"Neue Deutsche Härte",
			"Neue Deutsche Welle",
			"Neurofunk",
			"Neurohop",
			"New Age",
			"New Beat",
			"New Jack Swing",
			"New Romantic",
			"New Wave",
			"Ngoma",
			"Nightcore",
			"No Wave",
			"Noise",
			"Noise Pop",
			"Noise Rock",
			"Noisecore",
			"Non-Music",
			"Norteño",
			"Northern Soul",
			"Nova Cançó",
			"Nu Disco",
			"Nu Jazz",
			"Nu Metal",
			"Nu Skool Breaks",
			"Nueva Canción",
			"Nueva Trova",
			"Nuevo Flamenco",
			"Nuevo Tango",
			"Nyū Myūjikku",
			"Occult Rock",
			"Oi",
			"Old School Death Metal",
			"Old-Time",
			"Onkyo",
			"Opera",
			"Operatic Pop",
			"Orchestral",
			"Orchestral Jazz",
			"Outlaw Country",
			"Outsider House",
			"P-Funk",
			"Pachanga",
			"Pagodão",
			"Pagode",
			"Pagode Romântico",
			"Paisley Underground",
			"Palm-Wine",
			"Parang",
			"Partido Alto",
			"Pasodoble",
			"Peak Time Techno",
			"Philly Soul",
			"Phleng Phuea Chiwit",
			"Phonk",
			"Piano Blues",
			"Piano Rock",
			"Piedmont Blues",
			"Plainchant",
			"Plena",
			"Plunderphonics",
			"Political Hip Hop",
			"Polka",
			"Pop",
			"Pop Metal",
			"Pop Punk",
			"Pop Rap",
			"Pop Rock",
			"Pop Soul",
			"Pop Yeh-Yeh",
			"Pop/Rock",
			"Porn Groove",
			"Pornogrind",
			"Porro",
			"Post-Bop",
			"Post-Classical",
			"Post-Grunge",
			"Post-Hardcore",
			"Post-Industrial",
			"Post-Metal",
			"Post-Minimalism",
			"Post-Punk",
			"Post-Rock",
			"Power Electronics",
			"Power Metal",
			"Power Noise",
			"Power Pop",
			"Powerviolence",
			"Production Music",
			"Progressive",
			"Progressive Bluegrass",
			"Progressive Breaks",
			"Progressive Country",
			"Progressive Electronic",
			"Progressive Folk",
			"Progressive House",
			"Progressive Metal",
			"Progressive Pop",
			"Progressive Rock",
			"Progressive Trance",
			"Proto-Punk",
			"Psybient",
			"Psychedelic",
			"Psychedelic Folk",
			"Psychedelic Pop",
			"Psychedelic Rock",
			"Psychobilly",
			"Psytrance",
			"Pub Rock",
			"Punk",
			"Punk Blues",
			"Punk Rap",
			"Punk Rock",
			"Q-Pop",
			"Qaraami",
			"Qawwali",
			"Queercore",
			"Quiet Storm",
			"R&B",
			"Raga Rock",
			"Ragga",
			"Ragga Hip-Hop",
			"Ragga Jungle",
			"Ragtime",
			"Raï",
			"Ranchera",
			"Rap",
			"Rap Metal",
			"Rap Rock",
			"Rapcore",
			"Rautalanka",
			"Rave",
			"Rebetiko",
			"Red Dirt",
			"Red Song",
			"Reggae",
			"Reggae-Pop",
			"Reggaeton",
			"Religious",
			"Renaissance",
			"Rhumba",
			"Rhythmic Noise",
			"Riot Grrrl",
			"Ritual Ambient",
			"Rock",
			"Rock & Roll",
			"Rock And Roll",
			"Rock n Roll",
			"Rock Opera",
			"Rockabilly",
			"Rocksteady",
			"Romantic Classical",
			"Roots Reggae",
			"Roots Rock",
			"Rumba",
			"Rumba Catalana",
			"Rumba Cubana",
			"Rumba Flamenca",
			"Runo Song",
			"Ryūkōka",
			"Salegy",
			"Salsa",
			"Samba",
			"Samba-Canção",
			"Samba-Choro",
			"Samba-Exaltação",
			"Samba-Reggae",
			"Samba-Rock",
			"Sasscore",
			"Schlager",
			"Schranz",
			"Screamo",
			"Sea Shanty",
			"Seapunk",
			"Séga",
			"Seguidilla",
			"Semba",
			"Serialism",
			"Sertanejo",
			"Sertanejo Raiz",
			"Sertanejo Romântico",
			"Sertanejo Universitário",
			"Sevillanas",
			"Shibuya-Kei",
			"Shoegaze",
			"Sierreño",
			"Singer-Songwriter",
			"Ska",
			"Ska Punk",
			"Skacore",
			"Skate Punk",
			"Skiffle",
			"Skullstep",
			"Skweee",
			"Slam Death Metal",
			"Slow Waltz",
			"Slowcore",
			"Sludge Metal",
			"Smooth Jazz",
			"Smooth Soul",
			"Soca",
			"Soft Rock",
			"Son Cubano",
			"Son Montuno",
			"Songo",
			"Sophisti-Pop",
			"Soukous",
			"Soul",
			"Soul Blues",
			"Soul Jazz",
			"Sound Art",
			"Sound Collage",
			"Southern Gospel",
			"Southern Metal",
			"Southern Rock",
			"Southern Soul",
			"Sovietwave",
			"Space Age Pop",
			"Space Ambient",
			"Space Disco",
			"Space Rock",
			"Spectralism",
			"Speed Garage",
			"Speed Metal",
			"Speedcore",
			"Splittercore",
			"Spoken Word",
			"Stage & Screen",
			"Steampunk",
			"Stoner Metal",
			"Stoner Rock",
			"Street Punk",
			"Stride",
			"Surf Rock",
			"Swamp Pop",
			"Swamp Rock",
			"Swing",
			"Symphonic Black Metal",
			"Symphonic Metal",
			"Symphonic Prog",
			"Symphonic Rock",
			"Symphony",
			"Synth Funk",
			"Synth-Pop",
			"Synthwave",
			"Taarab",
			"Tajaraste",
			"Tango",
			"Tchinkoumé",
			"Tech House",
			"Tech Trance",
			"Technical Death Metal",
			"Techno",
			"Techno Bass",
			"Techno Kayō",
			"Techstep",
			"Tecnobrega",
			"Teen Pop",
			"Tejano",
			"Terrorcore",
			"Texas Blues",
			"Texas Country",
			"Third Stream",
			"Thrash Metal",
			"Thrashcore",
			"Thumri",
			"Tiento",
			"Timba",
			"Tizita",
			"Tonadilla",
			"Traditional Country",
			"Trance",
			"Trap",
			"Trap EDM",
			"Tribal Ambient",
			"Tribal House",
			"Trip Hop",
			"Tropical House",
			"Tropical Rock",
			"Tropicália",
			"Trot",
			"Trova",
			"Tsapiky",
			"Tsugaru-Jamisen",
			"Turbo-Folk",
			"Turntablism",
			"Twee Pop",
			"UK Drill",
			"UK Funky",
			"UK Garage",
			"UK Hardcore",
			"Underground Hip Hop",
			"Urban Cowboy",
			"Vallenato",
			"Vaportrap",
			"Vaporwave",
			"Vaudeville",
			"Viking Metal",
			"Visual Kei",
			"Vocal",
			"Vocal House",
			"Vocal Jazz",
			"Vocal Trance",
			"Waltz",
			"War Metal",
			"Wave",
			"West Coast Hip Hop",
			"West Coast Swing",
			"Western",
			"Western Swing",
			"Witch House",
			"Wonky",
			"Wonky Techno",
			"World Fusion",
			"Xote",
			"Yacht Rock",
			"Yé-Yé",
			"Zamba",
			"Zamrock",
			"Zarzuela",
			"Zeuhl",
			"Zinli",
			"Zolo",
			"Zouk",
			"Zydeco"
		];
			
		this.genresMore = [
			"AM Pop",
			"Aboriginal Rock",
			"Acid Folk",
			"Adult Alternative",
			"Adult Alternative Pop/Rock",
			"Adult Contemporary",
			"Adult Contemporary R&B",
			"African Psychedelia",
			"African Traditions",
			"Album Rock",
			"Alternative CCM",
			"Alternative Country-Rock",
			"Alternative Pop/Rock",
			"Alternative R&B",
			"Alternative Rap",
			"Alternative Singer/Songwriter",
			"Alternative/Indie Rock",
			"American Popular Song",
			"American Punk",
			"American Trad Rock",
			"American Underground",
			"Anarchist Punk",
			"Asian Pop",
			"Asian Psychedelia",
			"Asian Rock",
			"Aussie Rock",
			"AustroPop",
			"Avant-Garde Music",
			"Ballet",
			"Banda",
			"Bar Band",
			"Beach",
			"Bedroom Pop",
			"Black Gospel",
			"Blaxploitation",
			"Bluebeat",
			"Blues Revival",
			"Blues-Rock",
			"Brazilian Jazz",
			"Brazilian Pop",
			"Brazilian Traditions",
			"Brill Building Pop",
			"British Blues",
			"British Dance Bands",
			"British Folk",
			"British Folk-Rock",
			"British Invasion",
			"British Metal",
			"British Psychedelia",
			"British Punk",
			"British Rap",
			"British Trad Rock",
			"Bubblegum",
			"C-86",
			"C-Pop",
			"CCM",
			"Caribbean Traditions",
			"Cast Recordings",
			"Celebrity",
			"Celtic Folk",
			"Celtic Fusion",
			"Celtic New Age",
			"Celtic Pop",
			"Central European Traditions",
			"Chamber Jazz",
			"Chamber Music",
			"Chants",
			"Chicago Soul",
			"Children's Folk",
			"Chinese Classical",
			"Chinese Rock",
			"Chinese Traditions",
			"Choral",
			"Christmas",
			"Classical Pop",
			"Close Harmony",
			"Club/Dance",
			"Clubjazz",
			"Cocktail",
			"Cold Wave",
			"College Rock",
			"Comedy Rap",
			"Computer Music",
			"Concerto",
			"Contemporary Bluegrass",
			"Contemporary Celtic",
			"Contemporary Instrumental",
			"Contemporary Pop/Rock",
			"Contemporary Reggae",
			"Contemporary Singer/Songwriter",
			"Continental Jazz",
			"Cool",
			"Country Gospel",
			"Country-Folk",
			"Country-Pop",
			"Country-Rock",
			"Cowboy",
			"Cuban Traditions",
			"DJ/Toasting",
			"Darkwave",
			"Deep Soul",
			"Detroit Rock",
			"Doo Wop",
			"Downbeat",
			"Dutch Pop",
			"Early British Pop/Rock",
			"Early Jazz",
			"Early Pop/Rock",
			"Early R&B",
			"East Coast Rap",
			"Eastern European Pop",
			"Easy Pop",
			"Electric Chicago Blues",
			"Electric Harmonica Blues",
			"Emo-Pop",
			"Ethnic Fusion",
			"Euro-Dance",
			"Euro-Pop",
			"Euro-Rock",
			"European Folk",
			"European Psychedelia",
			"Exercise",
			"Experimental Electronic",
			"Film Music",
			"Film Score",
			"Folk Jazz",
			"Folk Revival",
			"Folk-Metal",
			"Folk-Pop",
			"Folk-Rock",
			"Foreign Language Rock",
			"Frat Rock",
			"Freestyle",
			"French",
			"French Pop",
			"French Rock",
			"Funky Breaks",
			"Fusion",
			"Garage",
			"Garage Rock Revival",
			"German",
			"Girl Groups",
			"Glitter",
			"Global Jazz",
			"Golden Age",
			"Goth Metal",
			"Goth Rock",
			"Grunge Revival",
			"Guitar Jazz",
			"Guitar Virtuoso",
			"Gypsy",
			"Hair Metal",
			"Hardcore Rap",
			"Harp/New Age",
			"Healing",
			"Hi-NRG",
			"Holidays",
			"Horror Rap",
			"Hot Rod",
			"Hot Rod Revival",
			"Hymns",
			"Indian",
			"Indian Subcontinent Traditions",
			"Indie Electronic",
			"Indipop",
			"Industrial Dance",
			"Instrumental Pop",
			"International Fusion",
			"International Pop",
			"Italian Music",
			"Italian Pop",
			"Jam Bands",
			"Japanese Rock",
			"Japanese Traditions",
			"Jazz Instrument",
			"Jazz-House",
			"Jazz-Pop",
			"Jazz-Rock",
			"Jesus Rock",
			"Jug Band",
			"Kayokyoku",
			"Keyboard",
			"Keyboard/Synthesizer/New Age",
			"Korean Rock",
			"Kraut Rock",
			"L.A. Punk",
			"Latin Dance",
			"Latin Freestyle",
			"Latin Psychedelia",
			"Left-Field House",
			"Left-Field Pop",
			"Left-Field Rap",
			"Liedermacher",
			"MPB",
			"Meditation/Relaxation",
			"Memphis Soul",
			"Merseybeat",
			"Mexican Traditions",
			"Midwest Rap",
			"Mixed Media",
			"Mod Revival",
			"Modal Music",
			"Modern Composition",
			"Modern Electric Blues",
			"Modern Electric Chicago Blues",
			"Mood Music",
			"Movie Themes",
			"Music Hall",
			"Musical Theater",
			"Musicals",
			"Nashville Sound/Countrypolitan",
			"Neo-Classical",
			"Neo-Classical Metal",
			"Neo-Disco",
			"Neo-Glam",
			"Neo-Prog",
			"Neo-Soul",
			"Neo-Traditionalist Country",
			"New Age Tone Poems",
			"New Orleans Jazz",
			"New Traditionalist",
			"New Wave of British Heavy Metal",
			"New Wave/Post-Punk Revival",
			"New York Punk",
			"New Zealand Rock",
			"Noise-Rock",
			"Nouvelle Chanson",
			"Novelty",
			"Nu Breaks",
			"Nü Metal",
			"Obscuro",
			"Observational Humor",
			"Oi!",
			"Okinawan Pop",
			"Orchestral/Easy Listening",
			"Organ/Easy Listening",
			"Original Score",
			"Panflute/Easy Listening",
			"Party Rap",
			"Party Soca",
			"Peruvian",
			"Piano Jazz",
			"Piano/New Age",
			"Polish",
			"Political Folk",
			"Political Rap",
			"Political Reggae",
			"Pop Idol",
			"Pop-Metal",
			"Pop-Rap",
			"Pop-Soul",
			"Post-Disco",
			"Praise & Worship",
			"Prog-Rock",
			"Progressive Jazz",
			"Protest Songs",
			"Psychedelic Soul",
			"Psychedelic/Garage",
			"Punk Metal",
			"Punk Revival",
			"Punk-Pop",
			"Punk/New Wave",
			"R&B Instrumental",
			"Rap-Metal",
			"Rap-Rock",
			"Regional Blues",
			"Relaxation",
			"Retro Swing",
			"Retro-Rock",
			"Retro-Soul",
			"Rock en Español",
			"Rockabilly Revival",
			"Sadcore",
			"Saxophone Jazz",
			"Scandinavian Metal",
			"Scandinavian Pop",
			"Scottish Folk",
			"Sea Shanties",
			"Show Tunes",
			"Show/Musical",
			"Singer/Songwriter",
			"Ska Revival",
			"Ska-Punk",
			"Skatepunk",
			"Slide Guitar Blues",
			"Smooth Reggae",
			"Social Media Pop",
			"Solo Instrumental",
			"Song Parody",
			"Soul-Blues",
			"Sound System",
			"Soundtracks",
			"South American Traditions",
			"South/Eastern European Traditions",
			"Southern Rap",
			"Space",
			"Speed/Thrash Metal",
			"Spiritual",
			"Spirituals",
			"Spy Music",
			"Standards",
			"Straight-Edge",
			"Sunshine Pop",
			"Surf",
			"Surf Revival",
			"Swedish Pop/Rock",
			"Synth Pop",
			"TV Music",
			"TV Soundtracks",
			"Techno-Tribal",
			"Teen Idols",
			"Tex-Mex",
			"Thai Pop",
			"Third Wave Ska Revival",
			"Tin Pan Alley Pop",
			"Torch Songs",
			"Traditional Bluegrass",
			"Traditional Celtic",
			"Traditional Folk",
			"Traditional Irish Folk",
			"Traditional Pop",
			"Tribute Albums",
			"Trip-Hop",
			"Tropical",
			"Trumpet Jazz",
			"Turkish Psychedelia",
			"Uptown Soul",
			"Urban",
			"Urban Blues",
			"Vocal Music",
			"Vocal Pop",
			"Western European Traditions",
			"Worldbeat"
		];
			

		this.moodArr = [
			'Acerbic',
			'Aggressive',
			'Agreeable',
			'Airy',
			'Ambitious',
			'Amiable/Good-Natured',
			'Angry',
			'Angst-Ridden',
			'Anguished/Distraught',
			'Angular',
			'Animated',
			'Anthemic',
			'Apocalyptic',
			'Arid',
			'Athletic',
			'Atmospheric',
			'Austere',
			'Autumnal',
			'Belligerent',
			'Benevolent',
			'Bitter',
			'Bittersweet',
			'Bleak',
			'Boisterous',
			'Bombastic',
			'Bouncy',
			'Brash',
			'Brassy',
			'Bravado',
			'Bright',
			'Brittle',
			'Brooding',
			'Calm/Peaceful',
			'Campy',
			'Capricious',
			'Carefree',
			'Cartoonish',
			'Cathartic',
			'Celebratory',
			'Cerebral',
			'Cheerful',
			'Child-like',
			'Chill',
			'Circular',
			'Clinical',
			'Cold',
			'Comic',
			'Complex',
			'Concise',
			'Confessional',
			'Confident',
			'Confrontational',
			'Cosmopolitan',
			'Crunchy',
			'Cute',
			'Cynical/Sarcastic',
			'Dark',
			'Declamatory',
			'Defiant',
			'Delicate',
			'Demonic',
			'Desperate',
			'Detached',
			'Devotional',
			'Difficult',
			'Dignified/Noble',
			'Dissonant',
			'Dramatic',
			'Dreamy',
			'Driving',
			'Druggy',
			'Earnest',
			'Earthy',
			'Ebullient',
			'Eccentric',
			'Ecstatic',
			'Eerie',
			'Effervescent',
			'Elaborate',
			'Elegant',
			'Elegiac',
			'Energetic',
			'Enigmatic',
			'Epic',
			'Erotic',
			'Ethereal',
			'Euphoric',
			'Exciting',
			'Exotic',
			'Exploratory',
			'Explosive',
			'Extroverted',
			'Exuberant',
			'Fantastic/Fantasy-like',
			'Feral',
			'Feverish',
			'Fierce',
			'Fiery',
			'Flashy',
			'Flowing',
			'Fractured',
			'Freewheeling',
			'Fun',
			'Funereal',
			'Gentle',
			'Giddy',
			'Gleeful',
			'Gloomy',
			'Graceful',
			'Greasy',
			'Grim',
			'Gritty',
			'Gutsy',
			'Happy',
			'Harsh',
			'Heavy',
			'Hedonistic',
			'Heroic',
			'Hostile',
			'Humorous',
			'Hungry',
			'Hymn-like',
			'Hyper',
			'Hypnotic',
			'Improvisatory',
			'Indulgent',
			'Innocent',
			'Insular',
			'Intense',
			'Intimate',
			'Introspective',
			'Ironic',
			'Irreverent',
			'Jovial',
			'Joyous',
			'Kinetic',
			'Knotty',
			'Laid-Back/Mellow',
			'Languid',
			'Lazy',
			'Light',
			'Literate',
			'Lively',
			'Lonely',
			'Loose',
			'Lush',
			'Lyrical',
			'Macabre',
			'Magical',
			'Majestic',
			'Malevolent',
			'Manic',
			'Marching',
			'Martial',
			'Meandering',
			'Mechanical',
			'Meditative',
			'Melancholy',
			'Melodic',
			'Menacing',
			'Messy',
			'Mighty',
			'Monastic',
			'Monumental',
			'Motoric',
			'Mysterious',
			'Mystical',
			'Naive',
			'Narcotic',
			'Narrative',
			'Negative',
			'Nervous/Jittery',
			'Nihilistic',
			'Nocturnal',
			'Nostalgic',
			'Ominous',
			'Optimistic',
			'Opulent',
			'Organic',
			'Ornate',
			'Outraged',
			'Outrageous',
			'Paranoid',
			'Passionate',
			'Pastoral',
			'Patriotic',
			'Perky',
			'Philosophical',
			'Plain',
			'Plaintive',
			'Playful',
			'Poetic',
			'Poignant',
			'Positive',
			'Powerful',
			'Precious',
			'Provocative',
			'Pulsing',
			'Pure',
			'Quaint',
			'Quirky',
			'Radiant',
			'Rambunctious',
			'Ramshackle',
			'Raucous',
			'Reassuring/Consoling',
			'Rebellious',
			'Reckless',
			'Refined',
			'Reflective',
			'Regretful',
			'Relaxed',
			'Reserved',
			'Resolute',
			'Restrained',
			'Reverent',
			'Rhapsodic',
			'Rollicking',
			'Romantic',
			'Rousing',
			'Rowdy',
			'Rustic',
			'Sacred',
			'Sad',
			'Sarcastic',
			'Sardonic',
			'Satirical',
			'Savage',
			'Scary',
			'Scattered',
			'Searching',
			'Seductive',
			'Self-Conscious',
			'Sensual',
			'Sentimental',
			'Serious',
			'Severe',
			'Sexual',
			'Sexy',
			'Shimmering',
			'Silly',
			'Sleazy',
			'Slick',
			'Smooth',
			'Snide',
			'Soft/Quiet',
			'Somber',
			'Soothing',
			'Sophisticated',
			'Spacey',
			'Spacious',
			'Sparkling',
			'Sparse',
			'Spicy',
			'Spiritual',
			'Spontaneous',
			'Spooky',
			'Sprawling',
			'Sprightly',
			'Springlike',
			'Stately',
			'Street-Smart',
			'Striding',
			'Strong',
			'Stylish',
			'Suffocating',
			'Sugary',
			'Summery',
			'Sunny',
			'Suspenseful',
			'Swaggering',
			'Sweet',
			'Swinging',
			'Technical',
			'Tender',
			'Tense/Anxious',
			'Theatrical',
			'Thoughtful',
			'Threatening',
			'Thrilling',
			'Tight',
			'Tough',
			'Tragic',
			'Transparent/Translucent',
			'Trashy',
			'Trippy',
			'Triumphant',
			'Turbulent',
			'Uncompromising',
			'Understated',
			'Unsettling',
			'Upbeat',
			'Uplifting',
			'Urgent',
			'Virile',
			'Visceral',
			'Volatile',
			'Vulgar',
			'Vulnerable',
			'Warm',
			'Weary',
			'Whimsical',
			'Wintry',
			'Wistful',
			'Witty',
			'Wry',
			'Yearning'
		];

		this.themeArr = [
			'Action',
			'Adventure',
			'Affection/Fondness',
			'Affirmation',
			'Anger/Hostility',
			'Animals',
			'Anniversary',
			'Argument',
			'At the Beach',
			'At the Office',
			'Autumn',
			'Award Winners',
			'Awareness',
			'Background Music',
			'Barbeque',
			'Biographical',
			'Birth',
			'Birthday',
			'Breakup',
			'Cars',
			'Catharsis',
			'Celebration',
			'Celebrities',
			'Children',
			'Christmas',
			'Christmas Party',
			'Church',
			'City Life',
			'Classy Gatherings',
			'Club',
			'Comfort',
			'Compassion',
			'Conflict',
			'Cool & Cocky',
			'Country Life',
			'Crime',
			'Dance Party',
			'Dancing',
			'Day Driving',
			'Daydreaming',
			'Death',
			'Desert',
			'Despair',
			'Destiny',
			'Dinner Ambiance',
			'Disappointment',
			'Divorce',
			'Doubt',
			'Dreaming',
			'Drinking',
			'Drugs',
			'Early Morning',
			'Easter',
			'Empowerment',
			'Escape',
			'Everyday Life',
			'Exercise/Workout',
			'Faith',
			'Fame',
			'Family',
			'Family Gatherings',
			'Fantasy',
			'Fear',
			'Feeling Blue',
			'Feminism',
			'Flying',
			'Food/Eating',
			'Forgiveness',
			'Fourth of July',
			'Freedom',
			'Friendship',
			'Funeral',
			'Futurism',
			'Girls Night Out',
			'Good Times',
			'Goodbyes',
			'Graduation',
			'Gratitude',
			'Guys Night Out',
			'Halloween',
			'Hanging Out',
			'Happiness',
			'Healing/Comfort',
			'Heartache',
			'Heartbreak',
			'High School',
			'History',
			'Holidays',
			'Home',
			'Homecoming',
			'Hope',
			'Housework',
			'Illness',
			'Imagination',
			'In Love',
			'Introspection',
			'Jealousy',
			'Joy',
			'Late Night',
			'LGBTQ',
			'Lifecycle',
			'Loneliness',
			'Long Walk',
			'Longing',
			'Loss/Grief',
			'Lying',
			'Magic',
			'Maverick',
			'Meditation',
			'Memorial',
			'Military',
			'Mischief',
			'Monday Morning',
			'Money',
			'Moon',
			'Morning',
			'Motivation',
			'Music',
			'Myths & Legends',
			'Nature',
			'New Love',
			'Night Driving',
			'Nighttime',
			'Nostalgia',
			'Open Road',
			'Other Times & Places',
			'Pain',
			'Parenthood',
			'Partying',
			'Passion',
			'Patriotism',
			'Peace',
			'Picnic',
			'Playful',
			'Poetry',
			'Politics/Society',
			'Pool Party',
			'Pride',
			'Prom',
			'Promises',
			'Protest',
			'Rainy Day',
			'Reflection',
			'Regret',
			'Relationships',
			'Relaxation',
			'Religion',
			'Reminiscing',
			'Reunion',
			'Revolution',
			'Road Trip',
			'Romance',
			'Romantic Evening',
			'Scary Music',
			'School',
			'Science',
			'SciFi',
			'Seduction',
			'Separation',
			'Sex',
			'Slow Dance',
			'Small Gathering',
			'Solitude',
			'Sorrow',
			'Space',
			'Sports',
			'Spring',
			'Starry Sky',
			'Starting Out',
			'Stay in Bed',
			'Storms',
			'Street Life',
			'Struggle',
			'Summer',
			'Sun',
			'Sunday Afternoon',
			'Sweet Dreams',
			'Technology',
			'Teenagers',
			'Temptation',
			'TGIF',
			'Thanksgiving',
			'The Great Outdoors',
			'Theme',
			'Tragedy',
			'Travel',
			'Truth',
			'Vacation',
			'Victory',
			'Violence',
			'Visions',
			'War',
			'Water',
			'Weather',
			'Wedding',
			'Winter',
			'Wisdom',
			'Word Play',
			'Work',
			'World View',
			'Yearning',
			'YOLO',
			'Youth',
			'Zeitgeist'
		];
		
		this.yearArr = [];
		const max = new Date().getFullYear()
		const min = 1900;
		for (let i = max; i >= min; i--) this.yearArr.push(i);
		this.yearArr = this.yearArr.map(v => v.toString());

		this.locales = {
		   "Afghan": "Afghanistan",
		   "Albanian": "Albania",
		   "Algerian": "Algeria",
		   "American": "United States",
		   "Angolan": "Angola",
		   "Argentine": "Argentina",
		   "Armenian": "Armenia",
		   "Australian": "Australia",
		   "Austrian": "Austria",
		   "Azerbaijani": "Azerbaijan",
		   "Barbadian": "Barbados",
		   "Belarusian": "Belarus",
		   "Belgian": "Belgium",
		   "Bermudian": "Bermuda",
		   "Bhutanese": "Bhutan",
		   "Bolivian": "Bolivia",
		   "Bosnian": "Bosnia and Herzegovina",
		   "Brazilian": "Brazil",
		   "British": "United Kingdom",
		   "Bruneian": "Brunei Darussalam",
		   "Bulgarian": "Bulgaria",
		   "Burmese": "Myanmar",
		   "Cambodian": "Cambodia",
		   "Cameroonian": "Cameroon",
		   "Canadian": "Canada",
		   "Cape Verdean": "Cape Verde",
		   "Chilean": "Chile",
		   "Chinese": "China",
		   "Colombian": "Colombia",
		   "Congolese": "Congo",
		   "Croatian": "Croatia",
		   "Cuban": "Cuba",
		   "Cypriot": "Cyprus",
		   "Czech": "Czech Republic",
		   "Danish": "Denmark",
		   "Dominican": "Dominican Republic",
		   "Dutch": "Netherlands",
		   "Egyptian": "Egypt",
		   "Emirati": "United Arab Emirates",
		   "English": "England",
		   "Estonian": "Estonia",
		   "Ethiopian": "Ethiopia",
		   "Faroese": "Faroe Islands",
		   "Filipino": "Philippines",
		   "Finnish": "Finland",
		   "French": "France",
		   "Georgian": "Georgia",
		   "German": "Germany",
		   "Ghanaian": "Ghana",
		   "Gibraltarian": "Gibraltar",
		   "Greek": "Greece",
		   "Greenlandic": "Greenland",
		   "Grenadian": "Grenada",
		   "Guinea-Bissau": "Guinea-Bissau",
		   "Guinean": "Guinea",
		   "Guyanese": "Guyana",
		   "Haitian": "Haiti",
		   "Hong Kong": "Hong Kong",
		   "Hungarian": "Hungary",
		   "Icelandic": "Iceland",
		   "Indian": "India",
		   "Indonesian": "Indonesia",
		   "Iranian": "Iran",
		   "Iraqi": "Iraq",
		   "Irish": "Ireland",
		   "Israeli": "Israel",
		   "Italian": "Italy",
		   "Ivorian": "Ivory Coast",
		   "Jamaican": "Jamaica",
		   "Japanese": "Japan",
		   "Jordanian": "Jordan",
		   "Kazakh": "Kazakhstan",
		   "Kenyan": "Kenya",
		   "Kuwaiti": "Kuwait",
		   "Kyrgyz": "Kyrgyzstan",
		   "Lao": "Laos",
		   "Latvian": "Latvia",
		   "Lebanese": "Lebanon",
		   "Lithuanian": "Lithuania",
		   "Luxembourg": "Luxembourg",
		   "Macedonian": "Macedonia",
		   "Malagasy": "Madagascar",
		   "Malaysian": "Malaysia",
		   "Malian": "Mali",
		   "Martinique": "Martinique",
		   "Mauritanian": "Mauritania",
		   "Mexican": "Mexico",
		   "Moldovan": "Moldova",
		   "Monegasque": "Monaco",
		   "Mongolian": "Mongolia",
		   "Montenegrin": "Montenegro",
		   "Montserrat": "Montserrat",
		   "Moroccan": "Morocco",
		   "New Zealander": "New Zealand",
		   "Nigerian": "Nigeria",
		   "North Korean": "North Korea",
		   "Northern Irish": "Northern Ireland",
		   "Norwegian": "Norway",
		   "Pakistani": "Pakistan",
		   "Palestinian": "Palestine, State of",
		   "Peruvian": "Peru",
		   "Polish": "Poland",
		   "Portuguese": "Portugal",
		   "Puerto Rican": "Puerto Rico",
		   "Romanian": "Romania",
		   "Russian": "Russia",
		   "Samoan": "Samoa",
		   "Sao Tomean": "Sao Tome and Principe",
		   "Saudi Arabian": "Saudi Arabia",
		   "Scottish": "Scotland",
		   "Senegalese": "Senegal",
		   "Serbian": "Serbia",
		   "Singaporean": "Singapore",
		   "Slovak": "Slovakia",
		   "Slovenian": "Slovenia",
		   "Somali": "Somalia",
		   "South African": "South Africa",
		   "South Korean": "South Korea",
		   "Spanish": "Spain",
		   "Sri Lankan": "Sri Lanka",
		   "Sammarinese": "San Marino",
		   "Sudanese": "Sudan",
		   "Swedish": "Sweden",
		   "Swiss": "Switzerland",
		   "Syrian": "Syria",
		   "Taiwanese": "Taiwan",
		   "Tajik": "Tajikistan",
		   "Tanzanian": "Tanzania",
		   "Thai": "Thailand",
		   "Tongan": "Tonga",
		   "Trinidadian": "Trinidad and Tobago",
		   "Tunisian": "Tunisia",
		   "Turkish": "Turkey",
		   "Turkmen": "Turkmenistan",
		   "Ugandan": "Uganda",
		   "Ukrainian": "Ukraine",
		   "Uruguayan": "Uruguay",
		   "Uzbek": "Uzbekistan",
		   "Venezuelan": "Venezuela",
		   "Vietnamese": "Vietnam",
		   "Welsh": "Wales",
		   "Yemeni": "Yemen",
		   "Zambian": "Zambia",
		   "Zimbabwean": "Zimbabwe"
		}
		this.localeArr = Object.keys(this.locales);
	}

	setQuery() {
		let djSource;
		const ok_callback = (status, input) => {
			if (status != 'cancel') {
				djSource = input;
			}
		}
		const caption = 'Query search';
		const prompt = 'Enter media library query. Examples:\nRock\nGenre HAS Rock\n%rating% GREATER 3\nGenre IS Rock AND %Date% AFTER 1979 AND %Date% BEFORE 1990';
		const fallback = popUpBox.isHtmlDialogSupported() ? popUpBox.query(caption, prompt, ok_callback, 'Query:', index.cur_dj_source ? index.cur_dj_source : 'Enter query') : true;
		if (fallback) {
			let ns = '';
			let status = 'ok';
			try {
				ns = utils.InputBox(0, prompt, caption, index.cur_dj_source ? index.cur_dj_source : 'Enter query', true);
			} catch(e) {
				status = 'cancel';
			}
			ok_callback(status, ns);
		}
		if (djSource) {
			ppt.autocompleteIsCaller = 0;
			index.getAutoDj($.titlecase(djSource), ppt.djMode, ppt.genre_tracks || ppt.djMode == 3 ? 1 : 4, ppt.lfm_variety, ppt.djRange, false, ppt.djMode == 3 ? true : false, 'genre');
		}
	}

	setTag(djSource, tag, owndata) {
		if (tag == 'locale' && owndata) djSource = this.locales[djSource];
		if (djSource) {
			const name = $.titlecase(djSource.replace(/&&/g, '&'));
			ppt.autocompleteIsCaller = 0;
			ppt.autocompleteLastName = name;
			const ac = {
				genre: 3,
				mood: 4,
				theme: 5,
				decade: 6,
				locale: 7
			}
			if (tag != 'year') ppt.autocompleteLastType = ppt.autocompleteType = ac[tag];
			index.getAutoDj(name, ppt.djMode, ppt.genre_tracks || 4, ppt.lfm_variety, ppt.djRange, false, false, tag);
		}
	}

	setVideoBlacklist(i) {
		if (!i) pl.love();

		else if (i == 1) {
			if (!this.video.list.blacklist[this.name.artis]) this.video.list.blacklist[this.name.artis] = [];
	
			if (this.video.title.length) this.video.list.blacklist[this.name.artis].push({
				'title': this.video.title,
				'id': this.video.id
			});

			this.removeFromCache(this.video.id);
			mtags.check(true);
			this.setBlacklistVideo();
			if (panel.youTube.backUp) sv.track(false);
		} else if (i == 2) blk.remove = !blk.remove;
		else if (blk.undo[0] == this.name.artis && i == 3) {
			if (!this.video.list.blacklist[blk.undo[0]]) this.video.list.blacklist[this.name.artis] = [];
			
			if (blk.undo[1].length) this.video.list.blacklist[blk.undo[0]].push({
				'title': blk.undo[1],
				'id': blk.undo[2]
			});

			this.setBlacklistVideo();
			blk.undo = [];
		} else {
			const bl_ind = i - (blk.undo[0] == this.name.artis ? 4 : 3);

			if (blk.remove) {
				blk.undo = [this.name.artis, this.video.list.blacklist[this.name.artis][bl_ind].title, this.video.list.blacklist[this.name.artis][bl_ind].id];
				this.video.list.blacklist[this.name.artis].splice(bl_ind, 1);
				$.removeNulls(this.video.list);
				this.setBlacklistVideo();
			} else $.browser(panel.url.yt_web2 + encodeURIComponent(this.video.list.blacklist[this.name.artis][bl_ind].id));
		}
	}

	setYear(i) {
		this.chart.year = i + 1952;
		ppt.chartDate = parseInt([this.chart.year, $.padNumber(this.chart.month, 2), $.padNumber(this.chart.day, 2)].join(''));
		but.btns.year.p2 = this.chart.year;
		panel.clampChartDate();
		alb.chartDate = '';
		alb.getReleases('chart', 5);
	}
	
	tips() {
		fb.ShowPopupMessage(`• Click button (upper right) to play items. Middle click to change what to play on the fly, e.g. limit to library tracks. Play options are also on the main drop down menu: play button action.

• Click refresh for new mixes.

• Click lock to stop track change updates.

• Use Ctrl + wheel over buttons to change BUTTON SIZE if required.

• List sizes provided by last.fm may vary according to request type.

• Ancillary tags on the tag menu automatically fallback if the tag is missing. The target is remembered and set on clicking a menu item. Searching or selecting a new item changes that item on the tag menu; others remain those of the current track.

• Display of last.fm statistics depends on what last.fm supplies. They can either be playcount, listeners or absent, and so the display will vary.

• Use of YouTube links obtained from last.fm is the default. Their availability depends on what last.fm supplies, e.g. they're absent from 'sounds like'.

• For info on getting the best out of last.fm YouTube links, see maintenance tab help > last.fm YouTube links. If preferred, direct searching of YouTube can be enabled there.

• Enable 'Indicate source...' on 'Track source' menu to see YouTube link sources.

• Load times depend on the method. All are asyncronous. Those using APIs should be fast, but don't have last.fm YouTube links. Web sources may take a few seconds, and have YouTube links if they're from last.fm.
`, 'Find & Play: tips');
	}

	toggleNowplaying() {
		alb.toggle('show');
		but.refresh(true);
		alb_scrollbar.resetAuto();
		art_scrollbar.resetAuto();
		if (ppt.showAlb || ui.style.textOnly && !ui.style.isBlur) txt.paint();
		else img.paint();
	}
	
	trackMenuName(playlistSoftMode) {
		return (!playlistSoftMode ? 'Type: ' + ['youtube', 'prefer library', 'library', 'library'][ppt.lastLibDj + ppt.lastDjOwnData] + ' tracks ' + ['', '', '', !ppt.lfmRadio ? ' [own data]' : ''][ppt.lastLibDj + ppt.lastDjOwnData] : 'Select tracks using: ' + ['last.fm data', 'own data'][ppt.findOwnData]);
	}
}