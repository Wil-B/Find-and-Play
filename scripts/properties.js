'use strict';

class PanelProperty {
	constructor(name, default_value) {
		this.name = name;
		this.default_value = default_value;
		this.value = ppt.get(this.name, default_value);
	}

	// Methods

	get() {
		return this.value;
	}
	set(new_value) {
		if (this.value !== new_value) {
			ppt.set(this.name, new_value);
			this.value = new_value;
		}
	}
}

class PanelProperties {
	constructor() {
		// this.name_list = {}; debug
	}

	// Methods

	init(type, properties, thisArg) {
		switch (type) {
			case 'auto':
				properties.forEach(v => {
					// this.validate(v); debug
					this.add(v);
				});
				break;
			case 'manual':
				properties.forEach(v => thisArg[v[2]] = this.get(v[0], v[1]));
				break;
		}
	}

	validate(item) {
		if (!$.isArray(item) || item.length !== 3 || typeof item[2] !== 'string') {
			throw ('invalid property: requires array: [string, any, string]');
		}

		if (item[2] === 'add') {
			throw ('property_id: ' + item[2] + '\nThis id is reserved');
		}

		if (this[item[2]] != null || this[item[2] + '_internal'] != null) {
			throw ('property_id: ' + item[2] + '\nThis id is already occupied');
		}

		if (this.name_list[item[0]] != null) {
			throw ('property_name: ' + item[0] + '\nThis name is already occupied');
		}
	}

	add(item) {
		// this.name_list[item[0]] = 1; debug
		this[item[2] + '_internal'] = new PanelProperty(item[0], item[1]);

		Object.defineProperty(this, item[2], {
			get() {
				return this[item[2] + '_internal'].get();
			},
			set(new_value) {
				this[item[2] + '_internal'].set(new_value);
			}
		});
	}

	get(name, default_value) {
		return window.GetProperty(name, default_value);
	} // initialisation

	set(name, new_value) {
		return window.SetProperty(name, new_value);
	}

	toggle(name) {
		this[name] = !this[name];
	}
}

let properties = [
	['- Show Html Dialog Unsupported-0 Supported-1 Autocheck-2', 2, 'isHtmlDialogSupported'],
	['Album Manager Chart Date', 0, 'chartDate'],

	['Album Manager LB Exclude CJK & Cyrillic Tracks', 0, 'lbExcludeCJKCyrillic'],
	['Album Manager LB User Name', 'rob', 'lbUserName'],
	['Album Manager LB User Mix', 0, 'lbUserMix'], 
	['Album Manager LB User Enable', false, 'lbUserBtn'],
	['Album Manager LB User Type', 0, 'lbUserType'],
	
	['Album Manager Lfm Mix Tag', 1, 'lfmMixTag'],
	['Album Manager Lfm Mix Track', 0, 'lfmMixTrack'],
	['Album Manager Lfm Release Type', 1, 'lfmReleaseType'],
	['Album Manager Lfm SortBy Playcount', false, 'lfmSortPC'],
	['Album Manager Lfm Top Tracks TimeSpan', 6, 'lfmTopTrackSpan'],
	['Album Manager Lfm Tag Type', 1, 'lfmTagType'],
	['Album Manager Lfm User Show Recommendations', true, 'lfmUserBtn'],
	['Album Manager Lfm User Name', '', 'lfmUserName'],
	['Album Manager Lfm User Type', 1, 'lfmUserType'],
	['Album Manager Lfm User Library Time Span', 0, 'lfmUserLibSpan'],
	['Album Manager Load List', '', 'playTracksList'],
	['Album Manager Loaded Items', JSON.stringify([]), 'playTracksLoaded'],
	['Album Manager MB Group', false, 'mbGroup'],
	['Album Manager MB Release Type', 0, 'mbReleaseType'],
	['Album Manager MB Show Live Releases', false, 'showLive'],

	['Album Manager Play Button Play', true, 'playButtonPlay'],
	['Album Manager Play Tracks', false, 'playTracks'],
	['Album Manager Playback Order Albums', 0, 'playbackOrderAlbums'],
	['Album Manager Playback Order Tracks', 0, 'playbackOrderTracks'],
	['Album Manager Node Style', 0, 'nodeStyle'],
	['Album Manager Save Playlists', false, 'albSavePlaylists'],
	['Album Manager Show', true, 'showAlb'],
	['Album Manager Show MB', 0, 'mb'],
	['Album Manager Show Artists Pane', true, 'showArtists'],
	['Album Manager Show Similar Artists', true, 'showSimilar'],
	['Album Manager Show Source', 2, 'showSource'],
	['Album Manager YouTube Show Link Source', true, 'showYouTubeLinkSource'],
	['Albums Pref MB Tracks', 0, 'prefMbTracks'],

	['API Key Last.fm', '', 'userAPIKeyLastfm'],
	['API Key YouTube', '', 'userAPIKeyYouTube'],
	['API Token ListenBrainz', '', 'userAPITokenListenBrainz'],
	['Artist View', false, 'artistView'],

	['Auto DJ Artist Variety Lfm', 80, 'lfm_variety'],
	['Auto DJ Artists: Random Pick', 0, 'randomArtist'],
	['Auto DJ Auto Enable', true, 'autoRad'],
	['Auto DJ BestTracks Bias 1-10 Artist', 'Lfm,2,libLfm,1,libOwn,5', 'djBiasArtist'],
	['Auto DJ BestTracks Bias 1-10 Genre.TopTracks', 'Lfm,1,libLfm,1,libOwn,10', 'djBiasGenreTracks'],
	['Auto DJ BestTracks Bias 1-10 Similar Artists', 'Lfm,5,libLfm,5,libOwn,10', 'djBiasSimilarArtists'],
	['Auto DJ BestTracks Bias 1-10 Similar Songs', 'Lfm,2,libLfm,1,libOwn,1', 'djBiasSimilarSongs'],
	['Auto DJ BestTracks Bias 1-10 Genre.TopArtists', 'Lfm,5,libLfm,5,libOwn,10', 'djBiasGenreArtists'],
	['Auto DJ BestTracks Bias 1-10 Query', 'Lfm,N/A,libLfm,N/A,libOwn,10', 'djBiasQuery'],
	['Auto DJ BestTracks Bias Auto-0 Custom 1-10', 0, 'cusBestTracksBias'],
	['Auto DJ Current Artist Variety Lfm', 80, 'cur_lfm_variety'],
	['Auto DJ Current Mode', 1, 'cur_dj_mode'],
	['Auto DJ Current Query', false, 'cur_dj_query'],
	['Auto DJ Current Range', 1, 'cur_dj_range'],
	['Auto DJ Current Source', 'N/A', 'cur_dj_source'],
	['Auto DJ Current Tag', 'genre', 'cur_dj_tag'],
	['Auto DJ Current Type', 2, 'cur_dj_type'],
	['Auto DJ Data Source Last.fm-0 Own-1', 0, 'djOwnData'],	
	['Auto DJ Decades Menu', JSON.stringify([{
		tag1: '50s',
		tag2: '1950s',
		query: '%Date% AFTER 1949 AND %Date% BEFORE 1960'
	}, {
		tag1: '60s',
		tag2: '1960s',
		query: '%Date% AFTER 1959 AND %Date% BEFORE 1970'
	}, {
		tag1: '70s',
		tag2: '1970s',
		query: '%Date% AFTER 1969 AND %Date% BEFORE 1980'
	}, {
		tag1: '80s',
		tag2: '1980s',
		query: '%Date% AFTER 1979 AND %Date% BEFORE 1990'
	}, {
		tag1: '90s',
		tag2: '1990s',
		query: '%Date% AFTER 1989 AND %Date% BEFORE 2000'
	}, {
		tag1: '00s',
		tag2: '2000s',
		query: '%Date% AFTER 1999 AND %Date% BEFORE 2010'
	}, {
		tag1: '10s',
		tag2: '2010s',
		query: '%Date% AFTER 2009 AND %Date% BEFORE 2020'
	}, {
		tag1: '20s',
		tag2: '2020s',
		query: '%Date% AFTER 2019 AND %Date% BEFORE 2030'
	}]), 'decadesMenu'],
	['Auto DJ Decades Short Format', 0, 'longDecadesFormat'],
	['Auto DJ Favourites', 'No Favourites', 'favourites'],
	['Auto DJ Last Current Mode', 1, 'last_cur_dj_mode'],
	['Auto DJ Last Data Source Last.fm-0 Own-1', 0, 'lastDjOwnData'],
	['Auto DJ Last Library', 1, 'lastLibDj'],
	['Auto DJ Last Mode', 1, 'lastDjMode'],
	['Auto DJ Last.fm Radio', false, 'lfmRadio'],
	['Auto DJ Mode', 1, 'djMode'],
	['Auto DJ Name: Last.fm Radio', 'Last.fm Radio', 'lfmRadioName'],
	['Auto DJ Names: Pairs + Separator', ', Auto DJ,Library, Auto DJ,Library, Auto DJ,Separator, \u2219 ', 'djName'],
	['Auto DJ Normalise Last.fm Multi-Artist Feeds', true, 'refineLastfm'],
	['Auto DJ Play From Saved Last.fm Data', false, 'useSaved'],
	['Auto DJ Played Artists', JSON.stringify([]), 'playedArtists'],
	['Auto DJ Played Tracks', JSON.stringify([]), 'playedTracks'],
	['Auto DJ Playlist Track Limit', 15, 'djPlaylistLimit'],
	['Auto DJ PopularTrack [AllTime] LfmPlaycount', 500000, 'pc_at_adjust'],
	['Auto DJ PopularTrack [Current] LfmPlaycount (30 days)', 1667, 'pc_cur_adjust'],
	['Auto DJ Range', 1, 'djRange'],
	['Auto DJ Remove Played', true, 'removePlayed'],
	['Auto DJ Save Tracks', false, 'djSaveTracks'],
	['Auto DJ Search Timeout (msec min 30000)', 120000, 'djSearchTimeout'],
	["Auto DJ TopTracks Feed Size: Artist 5'Hot'-1000", 'Highly popular,25,Popular,50,Normal,75,Varied,100,Diverse,150,Highly diverse,200', 'presets'],
	['Auto DJ TopTracks Feed Size: Genre/Tag', 'Artist Values Multiplied By,10', 'tagFeed'],
	['Auto DJ TopTracks Feed Size: Similar Songs', 'Artist Values Multiplied By,2.5', 'songFeed'],
	['Auto DJ Track Count Log', 0, 'trackCount'],
	['Auto DJ Tracks [Lfm] Curr Popularity', 1, 'curPop'],

	['Autocomplete Last Name', 'N/A', 'autocompleteLastName'],
	['Autocomplete Last Type', 3, 'autocompleteLastType'],
	['Autocomplete IsCaller', 0, 'autocompleteIsCaller'],
	['Autocomplete Type', 3, 'autocompleteType'],

	['Border Increase Right Margin By Scrollbar Width', false, 'extra_sbar_w'],
	['Border', 25, 'bor'],

	['Button Logo Text', 0, 'logoText'],
	['Button Mode', false, 'btn_mode'],
	['Click Action: Use Double Click', false, 'dblClickToggle'],
	['Colour Swap', false, 'swapCol'],
	['Config Data Source Last.fm-0 Own-1', 0, 'configOwnData'],
	['Custom Font', 'Segoe UI,16,0', 'custFont'],
	['Custom Font Nowplaying', 'Calibri,20,1', 'custFontNowplaying'],
	['Custom Colour Text', '171,171,190', 'text'],
	['Custom Colour Text Highlight', '121,194,255', 'text_h'],
	['Custom Colour Text Selected', '255,255,255', 'textSel'],
	['Custom Colour Background', '4,39,68', 'bg'],
	['Custom Colour Background Accent', '18,52,85', 'bg_h'],
	['Custom Colour Background Selected', '37,71,108', 'bgSel'],
	['Custom Colour Frame Hover', '35,132,182', 'frame'],
	['Custom Colour Side Marker', '121,194,255', 'sideMarker'],
	['Custom Colour Transparent Fill', '0,0,0,0.06', 'bgTrans'],

	['Custom Font Use', false, 'custFontUse'],
	['Custom Font Nowplaying Use', false, 'custFontNowplayingUse'],
	['Custom Colour Text Use', false, 'textUse'],
	['Custom Colour Text Highlight Use', false, 'text_hUse'],
	['Custom Colour Text Selected Use', false, 'textSelUse'],
	['Custom Colour Background Use', false, 'bgUse'],
	['Custom Colour Background Accent Use', false, 'bg_hUse'],
	['Custom Colour Background Selected Use', false, 'bgSelUse'],
	['Custom Colour Frame Hover Use', false, 'frameUse'],
	['Custom Colour Side Marker Use', false, 'sideMarkerUse'],
	['Custom Colour Transparent Fill Use', false, 'bgTransUse'],
	['Custom Font Scroll Icon', 'Segoe UI Symbol,0', 'butCustIconFont'],

	['Favourites Auto ', true, 'autoFav'],
	['Find Current', JSON.stringify({source: 'N/A'}), 'cur_find'],
	['Find Data Source Last.fm-0 Own-1', 0, 'findOwnData'],
	['Find Save Top Tracks Playlists', false, 'findSavePlaylists'],
	['Find Sort', 0, 'findLfmDataSort'],
	['Font Size Base', 16, 'baseFontSize'],
	['Genre Tracks', 1, 'genre_tracks'],
	['Heading Highlight ', true, 'headHighlight'],
	['Highlight Row', 3, 'highLightRow'],
	['Highlight Text', true, 'highLightText'],

	['Image [Artist] Auto-Download', false, 'dl_art_img'],
	['Image [Artist] Cycle Time (seconds)', 15, 'cycleTime'],
	['Image [Artist] Cycle', true, 'cycPhoto'],
	['Image [Artist] Folder Location', '%profile%\\foo_spider_monkey_panel\\package_data\\{BA9557CE-7B4B-4E0E-9373-99F511E81252}\\biography-cache\\art_img\\$lower($cut($meta(artist,0),1))\\$meta(artist,0)', 'imgArtPth'],
	['Image Background', false, 'imgBg'],
	['Image Background Opacity', 50, 'imgBgOpacity'],
	['Image Blur Background Always Use Front Cover', false, 'covBlur'],
	['Image Blur Background Auto-Fill', false, 'blurAutofill'],
	['Image Blur Background Level (%)', 90, 'blurTemp'],
	['Image Blur Background Opacity (%)', 30, 'blurAlpha'],
	['Image Border', false, 'imgBorder'],
	['Image Border Highlight', false, 'highlightImgBor'],
	['Image Circular Cover', false, 'covCirc'],
	['Image Circular Photo', false, 'artCirc'],
	['Image Counter', false, 'imgCounter'],
	['Image Reflection', false, 'imgReflection'],
	['Image Reflection Gradient (%)', 10, 'reflGradient'],
	['Image Reflection Size (%)', 100, 'reflSize'],
	['Image Reflection Strength (%)', 14.5, 'reflStrength'],
	['Image Seeker', true, 'imgSeeker'],
	['Image Seeker Show', 0, 'imgSeekerShow'],
	['Image Seeker Dot Style', 1, 'imgSeekerDots'],	
	['Image Shadow', false, 'imgShadow'],
	['Image Size 0-1000 (0 = Auto)', 0, 'imgSize'],
	['Image Smooth Transition', false, 'imgSmoothTrans'],
	['Image Smooth Transition Level (%)', 92, 'transLevel'],
	['Layout Auto Adjust', true, 'autoLayout'],

	['Library: Include Partial Matches', false, 'partialMatch'],
	['Library Album', 1, 'libAlb'],
	['Library Auto DJ', 1, 'libDj'],
	['Library Filter All Uses', '', 'libFilter'],
	['Library Filter Auto DJ', '%rating% IS 1', 'autoDJFilter'],
	['Library Filter Auto DJ Use', true, 'autoDJFilterUse'],
	['Library Filter All Uses Use', false, 'libFilterUse'],
	['Library Sort', 0, 'sortType'],
	['Library Sort Auto DJ', 0, 'sortAutoDJ'],
	['Library Sort Find', 2, 'findOwnDataSort'],
	['Line Style', 0, 'lineStyle'],
	['Line Padding', 0, 'verticalPad'],
	['Lock', false, 'lock'],
	['Lock Artist', '', 'lockArtist'],
	['Lock Decade', '', 'lockDecade'],
	['Lock Genre', '', 'lockGenre'],
	['Lock Locale', '', 'lockLocale'],
	['Lock Mood', '', 'lockMood'],
	['Lock Similar', '', 'lockSimilar'],
	['Lock Song', '', 'lockSong'],
	['Lock Theme', '', 'lockTheme'],
	['Lock Year', '', 'lockYear'],
	['Logo Show', true, 'showLogo'],

	['m-TAGS Auto Replace Dead Items 0 or 1', 'YouTube,1,Library,0', 'mtagsSync'],
	['m-TAGS Create: Write Absolute Paths', true, 'mtagsAbsPath'],
	['m-TAGS Installed', false, 'mtagsInstalled'],
	['m-TAGS Save Folder No Titleformat (Empty = Default)', '', 'mtagsSaveFolder'],
	['m-TAGS Show Update Message', false, 'mtagsUpdMsg'],
	['No Limits', false, 'v'],

	['Nowplaying Style', 0, 'nowPlayingStyle'],
	['Nowplaying Text Height (%)', 26.5, 'nowPlayingTextHeight'],
	['Nowplaying Text Info', true, 'npTextInfo'],
	['Nowplaying Text Shadow Effect', true, 'npShadow'],
	['Partial Match Configuration', 'FuzzyMatch%,80,RegEx,\\(|\\[|feat,Console,false', 'partialMatchConfig'],
	['Partial Match: 0 Fuzzy-1 RegEx-2 Either-3', 'AlbumTrack,1,AutoDJTrack,3,TopTrack,1', 'partialMatchType'],

	['Playlist Label Library Smart Mix', 'Library Smart Mix', 'playlistSmartMix'],
	['Playlist Label Tracks', 'Tracks', 'playlistTracks'],
	['Playlist Name Selection', 'Find & Play Selection', 'playlistSelection'],
	['Playlist Name Library Mix', 'Library Mix', 'playlistGenerator'],
	['Playlist Name Cache', 'Find & Play Cache', 'playlistCache'],
	['Playlist Name Loved', 'Loved', 'playlistLoved'],
	['Playlist Name Auto DJ', 'Auto DJ', 'playlistDj'],
	['Playlist Soft Mode', false, 'playlistSoftMode'],
	['Playlist Soft Mode Limit', 50, 'playlistSoftModeLimit'],
	['Playlist Sort', '%album artist% | %date% | %album% | [[%discnumber%.]%tracknumber%. ][%track artist% - ]%title%', 'albumSortOrder'],
	['Prefer Focus', false, 'focus'],

	['Query Artist Field', 'Artist', 'queryArtistField'],
	['Query Album Field', 'Album', 'queryAlbumField'],
	['Query Genre Field', 'Genre|Style|Artist Genre Last.fm|Artist Genre AllMusic', 'queryGenreField'],
	['Query Locale Field', 'Locale|Locale Last.fm|Artistcountry', 'queryLocaleField'],
	['Query Mood Field', 'Mood|Album Mood AllMusic', 'queryMoodField'],
	['Query Theme Field', 'Theme|Album Theme AllMusic', 'queryThemeField'],
	['Query Title Field', 'Title', 'queryTitleField'],
	['Row Stripes', false, 'rowStripes'],

	['Scroll: Smooth Scroll', true, 'smooth'],
	['Scroll Step 0-10 (0 = Page)', 3, 'scrollStep'],
	['Scroll Smooth Duration 0-5000 msec (Max)', 500, 'durationScroll'],
	['Scroll Touch Flick Distance 0-10', 0.8, 'flickDistance'],
	['Scroll Touch Flick Duration 0-5000 msec (Max)', 3000, 'durationTouchFlick'],
	['Scrollbar Arrow Custom Icon', '\uE0A0', 'arrowSymbol'],
	['Scrollbar Arrow Custom Icon: Vertical Offset (%)', -24, 'sbarButPad'],
	['Scrollbar Arrow Width', Math.round(11 * $.scale), 'sbarArrowWidth'],
	['Scrollbar Button Type', 0, 'sbarButType'],
	['Scrollbar Colour Grey-0 Blend-1', 1, 'sbarCol'],
	['Scrollbar Grip MinHeight', Math.round(20 * $.scale), 'sbarGripHeight'],
	['Scrollbar Padding', 0, 'sbarPad'],
	['Scrollbar Narrow Bar Width (0 = Auto)', 0, 'narrowSbarWidth'],
	['Scrollbar Show', 1, 'sbarShow'],
	['Scrollbar Type Default-0 Styled-1 Windows-2', 0, 'sbarType'],
	['Scrollbar Width', Math.round(11 * $.scale), 'sbarWidth'],
	['Scrollbar Width Bar', 11, 'sbarBase_w'],
	['Scrollbar Windows Metrics', false, 'sbarWinMetrics'],

	['Search Show', true, 'searchShow'],
	['Show foo_youtube Message', true, 'foo_youtubeNotInstalledMsg'],
	['Side Marker Width (0 = Auto)', 0, 'sideMarkerWidth'],
	['Style Image Path', '', 'styleImages'],

	['Tagger: Tag Name: Track Statistics Last.fm', 'Track Statistics Last.fm', 'lfmTrackStatsTagName'],
	['Theme', 0, 'theme'],
	['Theme Background Image', false, 'themeBgImage'],
	['Theme Colour', 3, 'themeColour'],
	['Theme Light', false, 'themeLight'],
	['Themed', false, 'themed'], // reserved: don't enable

	['Titleformat (Web Search) Artist', '[$if3($meta(artist,0),$meta(album artist,0),$meta(composer,0),$meta(performer,0))]', 'tfArtist'],
	['Titleformat (Web Search) Album', '[$meta(album,0)]', 'tfAlbum'],
	['Titleformat (Web Search) Genre', '[$if3($meta(genre,1),$meta(style,0),$meta(artist genre last.fm,0),$meta(artist genre allmusic,1),$meta(genre,0),$meta(album genre last.fm,0),$meta(album genre allmusic,1))]', 'tfGenre'],
	['Titleformat (Web Search) Title', '[$meta(title,0)]', 'tfTitle'],
	['Titleformat (Web Search) Locale', '[$if3($meta(locale,0),$meta(locale last.fm,$sub($meta_num(locale last.fm),1)),$meta(artistcountry,0))]', 'tfLocale'],
	['Titleformat (Web Search) Mood', '[$if2($meta(mood,0),$meta(album mood allmusic,0))]', 'tfMood'],
	['Titleformat (Web Search) Theme', '[$if2($meta(theme,0),$meta(album theme allmusic,0))]', 'tfTheme'],
	['Titleformat (Web Search) Year', '[$year(%date%)]', 'tfDate'],
	['Titleformat Obtain Extra Tags from Biography', true, 'integrateBio'],

	['Titleformat Nowplaying', '[%artist%]$crlf()[%title%]', 'tfNowplaying'],
	['Titleformat Play Count', '%play_count%', 'tfPlaycount'],
	['Titleformat Popularity', '$meta(Track Statistics Last.fm,5[score])', 'tfPopularity'],
	['Titleformat Rating', '$if2(%rating%,$meta(rating))', 'tfRating'],

	['Top Tracks Number to Play', 4, 'topTracksIX'],
	['Touch Control', false, 'touchControl'],
	['Touch Step 1-10', 1, 'touchStep'],
	['Video Mode', false, 'videoMode'],
	['Video Popup Control Default-0 Full-1', 0, 'vid_full_ctrl'],

	["YouTube 'Live' Filter", true, 'yt_filter'],
	["YouTube 'Live' Filter Description (| separator or regex)", 'awards|bootleg|\\bclip\\b|concert\\b|grammy|interview|jools|karaoke|(- |\\/ |\\/|\\| |\\(|\\[|{|\\")live|live at|mtv|o2|parody|preview|sample|\\bsession|teaser|\\btour\\b|tutorial|unplugged|(?=.*\\blive\\b)(19|20)\\d\\d|(?=.*(19|20)\\d\\d)\\blive\\b', 'ytDescrFilter'], /*intentionally different*/
	["YouTube 'Live' Filter Title (| separator or regex)", 'awards|bootleg|\\bclip\\b|concert\\b|grammy|interview|jools|karaoke|(- |\\/ |\\/|\\| |\\(|\\[|{|\\")live|live at|mtv|o2|parody|perform|preview|sample|\\bsession|teaser|\\btour\\b|tutorial|unplugged|\\d/\\d|\\d-\\d|(?=.*\\blive\\b)(19|20)\\d\\d|(?=.*(19|20)\\d\\d)\\blive\\b|(?:[^n]).\\breaction\\b', 'ytTitleFilter'],
	["YouTube 'Preference' Keywords (| separator or regex)", 'vevo|warner', 'yt_pref_kw'],
	["YouTube 'Preference' Verbose Log (Console)", false, 'ytPrefVerboseLog'],
	['YouTube Obtain Thumbnails & Details', true, 'ytSend'],
	['YouTube Prefer Most: Relevant-0 Views-1', 0, 'yt_order'],
	['YouTube Preference Filter', false, 'ytPref'],
	['YouTube Region Code', '', 'ytRegionCode'],
	['YouTube Search API-0 Web-1', 1, 'ytDataSource'],
	['YouTube Use Last.fm Links', true, 'lfmYouTubeLinks'],
	['YouTube Web Call Log', JSON.stringify({
		message: 0,
		timestamps: []
	}), 'ytWebCallLog'],

	['Zoom Button Size (%)', 100, 'zoomBut'],
	['Zoom Font Size (%)', 100, 'zoomFont'],
	['Zoom Tooltip (%)', 100, 'zoomTooltip']
];

const ppt = new PanelProperties;
ppt.init('auto', properties);
properties = undefined;

if (ppt.get('Update Properties', true)) {
	ppt.queryGenreField = 'Genre|Style|Artist Genre Last.fm|Artist Genre AllMusic';
	ppt.tfGenre = '[$if3($meta(genre,1),$meta(style,0),$meta(artist genre last.fm,0),$meta(artist genre allmusic,1),$meta(genre,0))]';
	ppt.tfRating = '$if2(%rating%,$meta(rating))';
	window.SetProperty('Auto DJ Genre Menu', null);
	window.SetProperty('Find Current Mode', null);
	window.SetProperty('Find Mode', null);
	window.SetProperty('Find Randomize', null);
	window.SetProperty('Playlist Label Top', null);
	window.SetProperty('Titleformat (Web Search) Album', null);
	ppt.set('Update Properties', false);
}

window.SetProperty('Lines Embolden', null);
window.SetProperty('YouTube Send Thumbnails & Details To foo_youtube', null);
if (!ppt.lbUserBtn) ppt.userAPITokenListenBrainz = null;