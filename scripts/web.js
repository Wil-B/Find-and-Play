'use strict';

// web calls are async

class YoutubeSearch {
	constructor(state_callback, on_search_done_callback) {
		this.alb_set;
		this.album;
		this.channelTitle = [];
		this.date;
		this.description = [];
		this.done;
		this.fn = '';
		this.full_alb = false;
		this.func = null;
		this.get_length = false;
		this.ix;
		this.length = [];
		this.link = [];
		this.metadata;
		this.mTags = false;
		this.on_search_done_callback = on_search_done_callback;
		this.pn;
		this.ready_callback = state_callback;
		this.timer = null;
		this.title = [];
		this.type;
		this.url = '';
		this.v_length = 0;
		this.xmlhttp = null;
	
		this.bestThumbnail = [];
		this.viewCount = [];
		this.likeCount = [];
		this.dislikeCount = [];
		this.publishedAt = [];
		this.channelId = [];
	
		this.id = {
			alt: -1,
			first: -1
		}

		this.yt = {
			filt: ppt.yt_filter,
			title: ''
		}

		this.ytSearch = {
			feedback: false
		}
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) this.func();
				else {
					this.Null();
					$.trace('youtube N/A: ' + (this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status));
				}
			}
	}

	search(p_alb_id, p_artist, p_title, p_ix, p_done, p_pn, p_extra_metadata, p_alb_set, p_full_alb, p_fn, p_type, p_album, p_date, p_mTags) {
		let post = '';
		let URL = '';
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');

		if (!this.get_length) {
			this.id.alb = p_alb_id;
			this.ytSearch.artist = p_artist;
			this.ytSearch.origTitle = p_title;
			this.ytSearch.title = p_title;
			this.ix = p_ix;
			this.done = p_done;
			this.pn = p_pn;
			this.metadata = p_extra_metadata;
			this.alb_set = p_alb_set;
			this.full_alb = p_full_alb;
			this.fn = p_fn;
			this.type = p_type;
			this.album = p_album;
			this.date = p_date;
			this.mTags = p_mTags;

			if (!ml.fooYouTubeInstalled) {
				$.trace('youtube functionality N/A: foo_youtube not Installed');
				return this.Null();
			}

			if (!this.ytSearch.artist || !this.ytSearch.title) return this.Null();
			if (this.yt.filt) this.yt.filt = !index.filter_yt(this.ytSearch.title, '');
		}

		switch (ppt.ytDataSource) {
			case 0: // api
				URL = panel.url.yt_api;
				if (!this.get_length) URL += 'search?part=snippet&maxResults=25&q=' + encodeURIComponent(p_artist + ' ' + p_title) + '&order=' + panel.youTube.order + '&type=video' + panel.yt;
				else URL += 'videos?part=contentDetails,statistics&id=' + this.link + panel.yt;
				break;
			case 1: // web
				URL = panel.url.yt_web1;
				post = JSON.stringify({
					'context': {
						'client': {
							'clientName': 'WEB',
							'clientVersion': '2.20210224.06.00',
							'newVisitorCookie': true,
							'sp': panel.youTube.order == 'relevance' ? 'EgIQAQ%253D%253D' : 'CAMSAhAB'
						},
						'user': {
							'lockedSafetyMode': false
						}
					},
					'query': p_artist + ' ' + p_title
				});
				panel.logger();
				break;
			case 2: // web alternative: currently not working as yt web site no longer fully supports smp methods
				URL = panel.url.yt_web2 + encodeURIComponent(p_artist + ' ' + p_title) + (panel.youTube.order == 'relevance' ? '&sp=EgIQAQ%253D%253D' : '&sp=CAMSAhAB');
				panel.logger();
				break;
		}

		this.func = this.analyse;
		this.xmlhttp.open(ppt.ytDataSource != 1 ? 'GET' : 'POST', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		if (!this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => {
				a.abort();
				if (this.full_alb && !this.fn) {
					alb.setRow(this.id.alb, 0);
				}
				this.on_search_done_callback(this.id.alb, '', this.ytSearch.artist, '', '', 'force');
				this.timer = null;
			}, 30000);
		}
		ppt.ytDataSource != 1 ? this.xmlhttp.send() : this.xmlhttp.send(post);
	}

	analyse() {
		this.url = '';
		this.v_length = 0;
		switch (ppt.ytDataSource) {
			case 0: {
				const data = $.jsonParse(this.xmlhttp.responseText, false, 'get', 'items');
				if (data && !this.get_length) {
					data.forEach(v => {
						if (v.id && v.id.videoId) {
							this.description.push(v.snippet.description || '');
							this.channelTitle.push(v.snippet.channelTitle || '');
							this.link.push(v.id.videoId);
							this.title.push(v.snippet.title);
							this.bestThumbnail.push(ppt.ytSend ? this.parseImg(v.snippet.thumbnails, 'api') : '');
							this.channelId.push(ppt.ytSend ? 'https://www.youtube.com/channel/' + v.snippet.channelId : '');
							this.publishedAt.push(ppt.ytSend ? v.snippet.publishedAt.slice(0, 10) : '');
						}
					});
					this.get_length = true;
					return this.search();
				}
				if (data && this.get_length) {
					data.forEach((v, i) => {
						this.length[i] = $.secs(v.contentDetails.duration) || '';
						this.link[i] = 'v=' + this.link[i];

						this.dislikeCount[i] = ppt.ytSend ? v.statistics.dislikeCount : '';
						this.likeCount[i] = ppt.ytSend ? v.statistics.likeCount : '';
						this.viewCount[i] = ppt.ytSend ? v.statistics.viewCount : '';
					});
					const m = this.IsGoodMatch(this.title, this.link, this.yt.filt || ppt.ytPref ? this.description : '', ppt.ytPref ? this.channelTitle : '', this.length, data.length);
					if (m != -1) this.setUrl('matched', m);
				}
				if (!this.get_length) return;
				if (!this.url.length) {
					if (this.setUrl('fallback') == false) return this.Null();
				}
				break;
			}
			case 1: {
				this.processResponse(this.xmlhttp.responseText);
				break;
			}
			case 2: {
				let content = this.xmlhttp.responseText.match(/(window\["ytInitialData"]|var ytInitialData)\s*=\s*(.*)};/); // confirmed as working on dummy file; window\["ytInitialData"] is likely old format & if so can be removed
				content = content[0].trim();
				content = content.substring(content.indexOf('{'), content.length - 1);
				content = content.replace(/^\s*.*?{/, '{').replace(/};\s*$/, '}');
				this.processResponse(content);
				break;
			}
		}
		this.on_search_done_callback(this.id.alb, this.url, this.ytSearch.artist, this.ytSearch.title, this.ix, this.done, this.pn, this.alb_set, this.v_length, this.ytSearch.origTitle, this.yt.title, this.full_alb, this.fn, this.type, this.album, this.date, this.mTags);
	}

	cleanse(n) {
		return n.replace(/&amp(;|)/g, '&').replace(/&quot(;|)/g, '"').replace(/&#39(;|)/g, "'").replace(/&gt(;|)/g, '>').replace(/&nbsp(;|)/g, '').replace(/(\.mv4|1080p|1080i|1080|\d(\d|)(\.|\s-)|explicit( version|)|full HD|HD full|full HQ|full song|(high |HD - |HD-|HD )quality|(| |with |& |w( |)\/( |)|\+ )lyric(s(!|) on Screen|s|)|(official |)music video( |)|official (music|version|video)( |)|(song |official (fan |)|)audio( version| only| clean|)|(| |\+ )official( solo| |)|uncensored|vevo presents|video( |))|\.wmv/gi, '').replace(/(HD|HQ)(\s-\s|)/g, '').replace(/\((|\s+)\)/g, '').replace(/\[(|\s+)\]/g, '').replace(/\(\)/g, '').replace(/\[\]/g, '').replace(/\s+/g, ' ').replace(/[\s-/\\+]+$/g, '').trim();
	}

	extractData(primaryContents) {
		let data = [];
		if (primaryContents.sectionListRenderer) {
			//'itemSectionRenderer' isn't always first: all contents need to be looped
			let contents = $.getProp(primaryContents, 'sectionListRenderer.contents', []);
			let found = false;
			contents.some(v => {
				let item = $.getProp(v, 'itemSectionRenderer.contents', []);
				found = item.some(w => {
					if (w.videoRenderer) {
						data = item;
						return true;
					}
				});
				if (found) return true;
			});
			// rich
		} else if (primaryContents.richGridRenderer) {
			data = primaryContents.richGridRenderer.contents
				.filter(v => !Object.prototype.hasOwnProperty.call(v, 'continuationItemRenderer'))
				.map(v => (v.richItemRenderer || v.richSectionRenderer).content);
		}
		data.forEach(v => {
			const vr = $.getProp(v, 'videoRenderer', '');
			const id = vr.videoId;
			if (id) {
				this.getItems(vr, id);
			}
		});
	}

	extractVideoRenderer(responseJSON) {
		const data = [];
		const f=(o,s)=>!o|[o]==o||Object.keys(o).forEach(k=>f(o[k],k=s?s+[,k]:k, /videoRenderer$/.test(k) && !/shelfRenderer/i.test(k) ? data.push(k.replace(/,/g, '.')) : ''));
		f(responseJSON);
		data.forEach(v => {
			const vr = $.getProp(responseJSON, v, '');
			const id = vr.videoId;
			if (id) {
				this.getItems(vr, id);
			}
		});
	}

	getItems(vr, id) {
		this.channelTitle.push(this.parseText(vr.longBylineText, ''));
		this.description.push(this.parseDescription(vr));
		this.dislikeCount.push('');		
		this.length.push(this.seconds(this.parseText(vr.lengthText, '')));
		this.likeCount.push('');
		this.link.push('v=' + id);
		this.title.push(this.parseText(vr.title, ''));
		//this.bestThumbnail.push(ppt.ytSend ? this.parseImg(vr.thumbnail.thumbnails, 'web') : '');
		this.bestThumbnail.push(ppt.ytSend ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '')
		this.channelId.push(ppt.ytSend ? 'https://www.youtube.com/channel/' + this.parseChannelId(vr.longBylineText, '') : '');
		this.publishedAt.push(ppt.ytSend ? this.parseText(vr.publishedTimeText, '') : '');
		this.viewCount.push(ppt.ytSend ? this.parseText(vr.viewCountText, '').replace(/[^0-9]/g, '') : '');
	}

	IsGoodMatch(video_title, video_id, video_descr, video_uploader, video_len, p_done) {
		const base_OK = [];
		const bl_artist = $.tidy(this.ytSearch.artist);
		const clean_artist = $.strip(this.ytSearch.artist.replace(/&/g, '').replace(/\band\b/gi, ''));
		const clean_title = $.strip(this.ytSearch.title.replace(/&/g, '').replace(/\band\b/gi, ''));
		const mv = [];
		let i = 0;
		let j = 0;
		let k = 0;
		for (i = 0; i < p_done; i++) {
			const clean_vid_title = $.strip(video_title[i].replace(/&/g, '').replace(/\band\b/gi, ''));
			base_OK[i] = video_len[i] && (!this.full_alb ? video_len[i] < 1800 : video_len[i] > 1800) && !blk.blackListed(bl_artist, video_id[i]) && (!this.yt.filt ? true : !index.filter_yt(video_title[i], video_descr[i]));
			if (clean_vid_title.includes(clean_artist) && clean_vid_title.includes(clean_title) && base_OK[i]) {
				if (!ppt.ytPref) return i;
				else mv.push({
					ix: i,
					uploader: video_uploader[i],
					title: video_title[i],
					descr: video_descr[i]
				});
			}
		}
		if (mv.length) {
			if (ppt.ytPrefVerboseLog) $.trace('Match List. Search Artist: ' + this.ytSearch.artist + '; Search Title: ' + this.ytSearch.title + '\n' + JSON.stringify(mv, null, 3));
			for (k = 0; k < index.yt_pref_kw.length; k++) {
				for (j = 0; j < mv.length; j++)
					if (index.pref_yt(index.yt_pref_kw[k], (ppt.ytPref ? mv[j].uploader : '') + (ppt.ytPref ? mv[j].title : '') + (ppt.ytPref ? mv[j].descr : ''))) {
						if (ppt.ytPrefVerboseLog) $.trace('MATCHED: Artist - Title AND Preference Keyword: ' + index.yt_pref_kw[k] + ': Search Artist: ' + this.ytSearch.artist + '; Search Title: ' + this.ytSearch.title + '; Video Loaded: ix: ' + mv[j].ix + '; Video Title: ' + mv[j].title + '. Keywords checked vs' + (ppt.ytPref ? ' Uploader' : '') + (ppt.ytPref ? ' Title' : '') + (ppt.ytPref ? ' Descr' : ''));
						this.ytSearch.feedback = true;
						return mv[j].ix;
					} if (k == index.yt_pref_kw.length - 1) {
					if (ppt.ytPrefVerboseLog) $.trace('MATCHED: Artist - Title ONLY. NO preference keyword match.' + ' Search Artist: ' + this.ytSearch.artist + '; Search Title: ' + this.ytSearch.title + '; Video Loaded: ix: ' + mv[0].ix + '; Video Title: ' + mv[0].title + '. Keywords checked vs' + (ppt.ytPref ? ' Uploader' : '') + (ppt.ytPref ? ' Title' : '') + (ppt.ytPref ? ' Descr' : ''));
					this.ytSearch.feedback = true;
					return mv[0].ix;
				}
			}
		} else if (ppt.ytPrefVerboseLog && ppt.ytPref) $.trace('NO Artist - Title matches. Keyword preference N/A. Search Artist: ' + this.ytSearch.artist + '; Search Title: ' + this.ytSearch.title);
		for (i = 0; i < p_done; i++) {
			if (this.id.first == -1) this.id.first = i;
			if (this.id.alt == -1 && base_OK[i]) this.id.alt = i;
		}
		return -1;
	}

	Null() {
		if (this.full_alb && !this.fn) {
			alb.setRow(this.id.alb, 0);
		}
		this.on_search_done_callback(this.id.alb, '', this.ytSearch.artist, '', '', this.done, this.pn, this.alb_set);
	}

	parseChannelId(txt, def = null) {
		if (typeof txt !== 'object') return def;
		if ($.isArray(txt.runs)) {
			return txt.runs.map(a => $.getProp(a, 'navigationEndpoint.browseEndpoint.browseId', '')).join('');
		}
		return def;
	}

	parseDescription(vr) {
		return this.parseText(vr.detailedMetadataSnippets && vr.detailedMetadataSnippets[0] ? vr.detailedMetadataSnippets[0].snippetText : '');
	}

	parseImg(imgs, type) {
		switch (type) {
			case 'api': {
				const keys = Object.keys(imgs);
				const arr = keys.map(v => imgs[v]);
				$.sort(arr, 'width', 'numRev');
				return arr[0].url;
			}
			case 'web':
				$.sort(imgs, 'width', 'numRev');
				return imgs[0].url;
		}
	}

	parseText(txt, def = null) {
		if (typeof txt !== 'object') return def;
		if (Object.prototype.hasOwnProperty.call(txt, 'simpleText')) return txt.simpleText;
		if ($.isArray(txt.runs)) {
			return txt.runs.map(a => a.text).join('');
		}
		return def;
	}

	processResponse(response) {
		const primaryContents = $.jsonParse(response, [], 'get', `contents.twoColumnSearchResultsRenderer.primaryContents`);
		this.extractData(primaryContents); // orig parse
		if (!this.title.length || !this.link.length) { // fallback parse
			this.title = []; this.link = [];
			this.extractVideoRenderer($.jsonParse(this.xmlhttp.responseText, []));
		}
		if (this.title.length && this.link.length) {
			const m = this.IsGoodMatch(this.title, this.link, this.yt.filt || ppt.ytPref ? this.description : '', ppt.ytPref ? this.channelTitle : '', this.length, this.link.length);
			if (m != -1) this.setUrl('matched', m);
			if (!this.url.length) {
				if (this.setUrl('fallback') == false) return this.Null();
			}
		} else this.Null();
	}

	seconds(n) {
		const dur = n.split(':');
		let sec = 0;
		let min = 1;
		while (dur.length > 0) {
			sec += min * parseInt(dur.pop(), 10);
			min *= 60;
		}
		return sec || '';
	}

	setUrl(type, m) {
		switch (type) {
			case 'matched':
				this.ytSearch.title = this.stripTitle(this.cleanse(this.ytSearch.title), this.ytSearch.artist, true);
				this.v_length = this.length[m];
				this.url = 'fy+https://www.youtube.com/watch?' + 
				(!this.mTags ? (this.metadata ? this.metadata + '&' : '') + 
				'fb2k_title=' + encodeURIComponent(this.ytSearch.title + (!this.full_alb ? '' : ' (Full Album)')) + 
				'&fb2k_search_title=' + encodeURIComponent(this.ytSearch.origTitle) + 
				'&fb2kx_length=' + encodeURIComponent(this.v_length) + 
				'&fb2kx_title=' + encodeURIComponent(this.title[m]) + 
				'&fb2kx_description=' + encodeURIComponent(this.description[m]) + 
				'&fb2kx_channel_title=' + encodeURIComponent(this.channelTitle[m]) + 
				'&fb2kx_channel_url=' + encodeURIComponent(this.channelId[m]) + 
				'&fb2kx_upload_date=' + encodeURIComponent(this.publishedAt[m]) + 
				'&fb2kx_view_count=' + encodeURIComponent(this.viewCount[m]) + 
				'&fb2kx_thumbnail_url=' + encodeURIComponent(this.bestThumbnail[m]) + 
				'&fb2kx_like_count=' + encodeURIComponent(this.likeCount[m]) + 
				'&fb2kx_dislike_count=' + encodeURIComponent(this.dislikeCount[m]) + 
				'&fb2k_artist=' + encodeURIComponent(this.ytSearch.artist) + '&' : '') + 
				this.link[m];
				this.yt.title = this.title[m];
				if (ppt.ytPrefVerboseLog && !this.ytSearch.feedback) $.trace('MATCHED: Artist - Title: ' + 'Search Artist: ' + this.ytSearch.artist + '; Search Title: ' + this.ytSearch.title + '; Video Loaded: ix: ' + m + '; Video Title: ' + this.title[m]);
				break;
			case 'fallback': {
				if (this.full_alb) return false;
				const id = this.id.alt != -1 ? this.id.alt : this.id.first;
				if (id != -1) this.v_length = this.length[id];
				else return false;
				if (ppt.ytPrefVerboseLog) $.trace('IDEAL MATCH NOT FOUND. Search Artist: ' + this.ytSearch.artist + '; Search Title: ' + this.ytSearch.title + '; Video Loaded: ix: ' + id + '; Video Title: ' + this.title[id]);
				this.ytSearch.title = this.stripTitle(this.cleanse(this.title[id]), this.ytSearch.artist);
				this.url = 'fy+https://www.youtube.com/watch?' + 
				(!this.mTags ? (this.metadata ? this.metadata + '&' : '') + 
				'fb2k_title=' + encodeURIComponent(this.ytSearch.title) + 
				'&fb2k_search_title=' + encodeURIComponent(this.ytSearch.origTitle) + 
				'&fb2kx_length=' + encodeURIComponent(this.v_length) + 
				'&fb2kx_title=' + encodeURIComponent(this.title[id]) + 
				'&fb2kx_description=' + encodeURIComponent(this.description[id]) + 
				'&fb2kx_channel_title=' + encodeURIComponent(this.channelTitle[id]) + 
				'&fb2kx_channel_url=' + encodeURIComponent(this.channelId[id]) + 
				'&fb2kx_upload_date=' + encodeURIComponent(this.publishedAt[id]) + 
				'&fb2kx_view_count=' + encodeURIComponent(this.viewCount[id]) + 
				'&fb2kx_thumbnail_url=' + encodeURIComponent(this.bestThumbnail[id]) + 
				'&fb2kx_like_count=' + encodeURIComponent(this.likeCount[id]) + 
				'&fb2kx_dislike_count=' + encodeURIComponent(this.dislikeCount[id]) + 
				'&fb2k_artist=' + encodeURIComponent(this.ytSearch.artist) + '&' : '') + 
				this.link[id];
				this.yt.title = this.title[id];
				return true;
			}
		}
	}

	stripTitle(n1, n2, type) {
		if (n1 == n2) return n1;
		n2 = $.regexEscape(n2);
		if (type) {
			if (RegExp(n2 + ' - ', 'i').test(n1)) return n1.replace(RegExp(n2 + ' - ', 'i'), '');
			else return n1.replace(RegExp(' - ' + n2, 'i'), '');
		}
		const t1 = n2.replace(/^The /i, '');
		const w = "(( |)((and|&|featuring|of|with)|((feat|ft|vs)(.|)))|'s) ";
		if (RegExp(w, 'i').test(n1))
			if (RegExp(n2 + w, 'i').test(n1) || RegExp(w + n2, 'i').test(n1) || RegExp(t1 + w, 'i').test(n1) || RegExp(w + t1, 'i').test(n1))
				return n1;
		const a = '(( +)?([-;:, ~|/(\\[]+)( +)?|)';
		const b = '(the |by (the |)|by: |"|)';
		const c = '("|)';
		const d = '(( +)?([-;:, ~|/)\\]]+)( +)?|)';
		let t2 = '';
		if (!/^The /i.test(n2)) t2 = n1.replace(RegExp(a + b + n2 + c + d, 'i'), ' - ').replace(/^ - | - (.|)$/g, '');
		else t2 = n1.replace(RegExp(a + b + t1 + c + d, 'i'), ' - ').replace(/^ - | - (.|)$/g, '');
		return /\S/.test(t2) ? t2 : n1;
	}
}

class YoutubeVideoAvailable {
	constructor(state_callback, on_search_done_callback) {
		this.alb_id;
		this.artist;
		this.done;
		this.fn;
		this.i;
		this.full_alb = false;
		this.func = null;
		this.on_search_done_callback = on_search_done_callback;
		this.ready_callback = state_callback;
		this.title;
		this.type;
		this.vid = '';
		this.xmlhttp = null;
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				if (this.xmlhttp.status == 200) this.func();
				else $.trace('youtube N/A: ' + (this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status) + '\n' + panel.yt);
			}
	}

	search(p_alb_id, p_artist, p_title, p_i, p_done, p_id, p_full_alb, p_fn, p_type) {
		this.alb_id = p_alb_id;
		this.artist = p_artist;
		this.done = p_done;
		this.fn = p_fn;
		this.i = p_i;
		this.full_alb = p_full_alb;
		this.title = p_title;
		this.type = p_type;
		this.vid = p_id;
		if (blk.blackListed($.tidy(this.artist), `v=${this.vid}`)) return this.on_search_done_callback(this.alb_id, this.artist, this.title, this.i, this.done, this.full_alb, this.fn, this.type, false);

		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		const URL = wb.vidCheck(1, 1, [this.vid]);

		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		this.xmlhttp.send();
	}

	analyse() {
		const data = wb.durations(this.xmlhttp.responseText);
		const available = data[this.vid] ? true : false;
		this.on_search_done_callback(this.alb_id, this.artist, this.title, this.i, this.done, this.full_alb, this.fn, this.type, available);
	}
}

class LfmSimilarArtists {
	constructor(state_callback, on_search_done_callback) {
		this.artVariety;
		this.fo;
		this.fln;
		this.func = null;
		this.lfmCacheFile;
		this.list = [];
		this.lmt = 0;
		this.on_search_done_callback = on_search_done_callback;
		this.pg = 0;
		this.ready_callback = state_callback;
		this.retry = false;
		this.source;
		this.timer = null;
		this.xmlhttp = null;
		this.dj = {}
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) this.func();
				else {
					if (this.artVariety && !this.retry) {
						if (this.dj.type != 4) this.retry = true;
						if ($.file(this.fln)) this.lfmCacheFile = true;
						return this.search();
					}
					this.on_search_done_callback('');
					if (this.artVariety && this.dj.mode > 1) dj.medLib('', this.source, this.dj.mode, this.dj.type, this.artVariety);
					$.trace('last.fm similar artists N/A: ' + this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
				}
			}
	}

	search(p_source, p_djMode, p_artVariety, p_djType) {
		if (!this.retry) {
			this.artVariety = p_artVariety;
			this.dj.mode = p_djMode;
			this.source = p_source;
			this.dj.type = p_djType;
			const djSource = $.clean(this.source);
			this.fo = dj.f2 + djSource.substr(0, 1).toLowerCase() + '\\';
			this.fln = this.fo + djSource + (this.dj.type == 4 ? ' - Top Artists.json' : ' and Similar Artists.json');
		}
		this.lfmCacheFile = !this.retry ? !panel.expired(this.fln, Thirty_Days) : $.file(this.fln);
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		let chk, len = 0;
		let URL;
		if (!this.artVariety && $.file(this.fln)) chk = $.jsonParse(this.fln, false, 'file');
		if (chk) len = chk.length;
		if (this.lfmCacheFile) {
			if (this.artVariety) {
				this.list = $.jsonParse(this.fln, false, 'file');
				if (!this.list) this.list = [];
				if (this.list.length > 219 && ($.objHasOwnProperty(this.list[0], 'name') || this.dj.type == 4)) {
					if (this.dj.mode > 1) {
						dj.medLib(this.list, this.source, this.dj.mode, this.dj.type, this.artVariety);
						return;
					}
					return this.on_search_done_callback(this.list, this.source, this.dj.mode);
				}
			} else {
				this.list = $.jsonParse(this.fln, false, 'file');
				if (!this.list) this.list = [];
				if (this.list.length > 99 && $.objHasOwnProperty(this.list[0], 'name')) return this.on_search_done_callback(this.list, this.source, this.dj.mode);
			}
		}
		this.lmt = !this.retry ? (this.artVariety || len > 115 ? 249 : 100) : (this.artVariety || len > 115 ? 235 + Math.floor(Math.random() * 14) : 105 + Math.floor(Math.random() * 10));
		if (this.dj.type != 4) {
			URL = panel.url.lfm + '&method=artist.getSimilar&artist=' + encodeURIComponent(this.source) + '&limit=' + this.lmt + '&autocorrect=1';
		} else {
			this.pg++;
			URL = 'https://www.last.fm/tag/' + encodeURIComponent(this.source) + '/artists?page=' + this.pg;
		}

		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		this.xmlhttp.setRequestHeader('User-Agent', 'foobar2000_script');
		if (this.retry || this.dj.type == 4) this.xmlhttp.setRequestHeader('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT');
		if (!this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => {
				a.abort();
				this.timer = null;
			}, 30000);
		}
		this.xmlhttp.send();
	}

	analyse() {
		const data = this.dj.type != 4 ? $.jsonParse(this.xmlhttp.responseText, [], 'get', 'similarartists.artist') : this.xmlhttp.responseText;
		if (!this.retry && this.dj.type != 4 && (!data || data.length < this.lmt)) {
			this.retry = true;
			return this.search();
		}
		if (data.length) {
			if (this.dj.type == 4) {
				doc.open();
				const div = doc.createElement('div');
				div.innerHTML = data;
				const link = div.getElementsByTagName('a');
				if (!link) return doc.close();
				$.htmlParse(link, false, false, v => {
					if (v.className.includes('link-block-target')) {
						const a = decodeURIComponent(v.href.replace('about:/music/', '').replace(/\+/g, '%20'));
						if (!a.includes('about:/tag/')) this.list.push(a);
					}
				});
				doc.close();
				if (this.pg < 13) return this.search(this.source, this.dj.mode, this.artVariety, this.dj.type);
				if (this.list.length) {
					$.create(this.fo);
					$.save(this.fln, JSON.stringify(this.list), true);
				}
				if (this.dj.mode > 1) return dj.medLib(this.list, this.source, this.dj.mode, this.dj.type, this.artVariety);
			} else {
				this.list = data.map(v => ({
					name: v.name,
					score: Math.round(v.match * 100)
				}));
				this.list.unshift({
					name: this.source,
					score: 100
				});
				$.create(this.fo);
				$.save(this.fln, JSON.stringify(this.list), true);
				if (this.dj.mode > 1) return dj.medLib(this.list, this.source, this.dj.mode, this.dj.type, this.artVariety);
			}
		}
		this.on_search_done_callback(this.list, this.source, this.dj.mode);
		if (!data && this.artVariety && this.dj.mode > 1) dj.medLib('', this.source, this.dj.mode, this.dj.type, this.artVariety);
	}
}

class LfmDjTracksSearch {
	constructor(state_callback, on_search_done_callback) {
		this.artist = [];
		this.artVariety;
		this.artistTopTracks = false;
		this.curPop;
		this.dj = {}
		this.done;
		this.duration = {};
		this.fo;
		this.fn;
		this.fnc;
		this.func = null;
		this.ix;
		this.json_data = [];
		this.lfmCurPopCacheFile;
		this.lfmCacheFile;
		this.lfmRadio;
		this.list = [];
		this.listeners = [];
		this.lmt = 0;
		this.on_search_done_callback = on_search_done_callback;
		this.page = 0;
		this.playcount = [];
		this.pg = 1;
		this.pn;
		this.ready_callback = state_callback;
		this.retry = false;
		this.songHot;
		this.tag;
		this.timer = null;
		this.title = [];
		this.vid = [];
		this.xmlhttp = null;
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) this.func();
				else if (!this.retry) {
					this.retry = true;
					if ($.file(this.fn)) this.lfmCacheFile = true;
					if ($.file(this.fnc)) this.lfmCurPopCacheFile = true;
					return this.search();
				} else if (this.dj.type != 2 || this.dj.mode == 2) {
					this.on_search_done_callback('', '', this.ix, this.done, this.pn, this.dj.mode, this.dj.type);
					$.trace('last.fm top tracks N/A: ' + this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
				}
			}
	}

	search(p_djSource, p_djMode, p_djType, p_artVariety, p_songHot, p_curPop, p_ix, p_done, p_pn, p_tag) {
		if (!this.retry) {
			this.dj.source = p_djSource;
			this.dj.mode = p_djMode;
			this.dj.type = p_djType;
			this.artVariety = p_artVariety;
			this.songHot = p_songHot;
			this.curPop = p_curPop;
			this.ix = p_ix;
			this.done = p_done;
			this.pn = p_pn;
			this.tag = p_tag;
			const sp = $.clean(this.dj.source);
			this.fo = dj.f2 + sp.substr(0, 1).toLowerCase() + '\\';
			this.fn = this.fo + sp + (this.dj.type != 3 ? '.json' : ' [Similar Songs].json');
			this.lfmCacheFile = !panel.expired(this.fn, TwentyEight_Days);
			if (this.dj.mode == 2 && ppt.useSaved) this.lfmCacheFile = true;
			if (this.curPop) {
				this.fnc = this.fo + sp + ' [curr].json';
				this.lfmCurPopCacheFile = !panel.expired(this.fnc, One_Week);
			}
			this.lfmRadio = ppt.lfmRadio && this.dj.mode < 2 && this.dj.type != 3;
		}

		if (!this.lfmRadio) {
			switch (this.dj.type) {
				case 1:
					if (this.lfmCacheFile) {
						this.list = $.jsonParse(this.fn, false, 'file');
						if (!this.list) break;
						$.take(this.list, this.songHot);
						if (this.dj.mode != 2) ppt.trackCount = this.list.length;
						if (this.list.length >= this.songHot || this.dj.mode == 2 && ppt.useSaved) {
							this.list.forEach(this.stripRemaster);
							return this.on_search_done_callback(this.list, '', this.ix, '', this.pn, this.dj.mode, 1, this.curPop, this.artVariety, this.tag);
						}
					}
					break;
				case 3:
					if (this.lfmCacheFile) {
						this.list = $.jsonParse(this.fn, false, 'file');
						const listOK = this.list && ($.objHasOwnProperty(this.list[0], 'playcount') && this.list.length >= this.songHot || this.dj.mode == 2 && ppt.useSaved);
						if (listOK) {
							if (ppt.lfmRadio && (ppt.djMode == 2 || ppt.djMode == 3)) { // force lfmRadio library
								const q = lib.partialMatch.artist && lib.partialMatch.type[3] != 0 ? ' HAS ' : ' IS ';
								const artists = $.getArtists(this.list, q);
								this.list = this.list.filter((v, i) => {
									return lib.inLibrary(v.artist, v.title, i, false, true, artists.libHandles);
								});
							}
							$.take(this.list, this.songHot);
							if (this.dj.mode != 2) ppt.trackCount = this.list.length;
							this.list.forEach(this.stripRemaster);
							return this.on_search_done_callback(this.list, '', this.ix, '', this.pn, this.dj.mode, 3, this.curPop, this.artVariety, this.tag);
						}
					}
					break;
				default:
					if (this.curPop && this.lfmCurPopCacheFile || !this.curPop && this.lfmCacheFile) {
						this.list = $.jsonParse(this.curPop ? this.fnc : this.fn, false, 'file');
						if (!this.list) break;
						if (this.curPop) {
							if (this.list.length >= this.songHot) {
								this.list.forEach(this.stripRemaster);
								const blackListedIds = blk.blackListedIds();
								this.list.forEach(v => {
									if (blackListedIds.includes(`v=${v.vid}`)) v.vid = '';
								});
								return this.on_search_done_callback(this.dj.source, this.list, this.ix, this.done, this.pn, this.dj.mode, this.dj.type, this.curPop, this.artVariety, this.tag);
							}
						} else {
							let newOK = false;
							if (this.list && $.objHasOwnProperty(this.list[0], 'artist')) {
								newOK = true;
								this.list.shift();
							}
							if (newOK && this.list.length >= this.songHot || this.dj.mode == 2 && ppt.useSaved) {
								this.list.forEach(this.stripRemaster);
								return this.on_search_done_callback(this.dj.source, this.list, this.ix, this.done, this.pn, this.dj.mode, this.dj.type, this.curPop, this.artVariety, this.tag);
							}
						}
					}
					break;
			}
		}

		if (this.dj.mode == 2 && ppt.useSaved) return this.on_search_done_callback('', '', this.ix, this.done, this.pn, this.dj.mode, this.dj.type, this.curPop, this.artVariety, this.tag);
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
	
		let URL;
		if (this.lfmRadio) {
			if (this.page < 5) {
				URL = panel.url.lfmPlayer + (
					this.dj.type == 0 ? `music/${encodeURIComponent(this.dj.source)}` : // artist
					this.dj.type == 1 ? `tag/${encodeURIComponent(this.dj.source)}` : // tag
					`music/${encodeURIComponent(this.dj.source)}/+similar` // similar artists
				);
			} else if (this.page == 5 || this.page == 6) URL = wb.vidCheck(5, this.page, this.vid);
		} else {
			URL = panel.url.lfm;
			if (this.dj.type == 0 || this.dj.type == 2) this.artistTopTracks = true;
			if (this.artistTopTracks) {
				this.lmt = this.curPop ? 100 : Math.max(200, this.songHot) + 1 + Math.floor(Math.random() * 10);
				if (!this.curPop) {
					if (this.retry) this.lmt += 5;
					URL += '&method=artist.getTopTracks&artist=' + encodeURIComponent(this.dj.source) + '&limit=' + this.lmt + '&autocorrect=1';
				} else {
					if (this.pg < 3) {
						URL =
						`https://www.last.fm/music/${encodeURIComponent(this.dj.source)}/+tracks?date_preset=LAST_30_DAYS&page=${this.pg}`;
					} else if (this.pg == 3 || this.pg == 4) URL = wb.vidCheck(3, this.pg, this.vid);
				}
			} else if (this.dj.type == 1) {
				this.lmt = !this.retry ? this.songHot : this.songHot != 1000 ? this.songHot + 5 + Math.floor(Math.random() * 10) : this.songHot - 5;
				URL += '&method=tag.getTopTracks&tag=' + encodeURIComponent(this.dj.source) + '&limit=' + this.lmt + '&autocorrect=1';
			} else {
				if (!this.dj.source.includes('|')) return this.on_search_done_callback('', '', this.ix, '', this.pn, this.dj.mode, this.dj.type, this.curPop, this.artVariety, this.tag);
				const dj_sourc = this.dj.source.split('|');
				this.lmt = !this.retry ? 250 : 240;
				URL += '&method=track.getSimilar&artist=' + encodeURIComponent(dj_sourc[0].trim()) + '&track=' + encodeURIComponent(dj_sourc[1].trim()) + '&limit=' + this.lmt + '&autocorrect=1';
			}
		}
		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		this.xmlhttp.setRequestHeader('User-Agent', 'foobar2000_script');
		if (this.retry || this.curPop) this.xmlhttp.setRequestHeader('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT');
		if (this.dj.mode != 2 && !this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => { // auto dj handles own timeout
				a.abort();
				this.timer = null;
			}, 30000);
		}
		this.xmlhttp.send();
	}

	analyse() {
		let data = false;
		let div, items = 0;
		this.list = [];
		if (this.lfmRadio) {
			const artistMix = !this.dj.type;
			const getList = false;
			this.retry = true;
			data = wb.processLfmPlayerResponse(this, this.xmlhttp.responseText, getList, artistMix);
			if (data === undefined) return; else this.list = data;
			return !this.dj.type ? this.on_search_done_callback(this.dj.source, this.list, this.ix, this.done, this.pn, this.dj.mode, this.dj.type, this.curPop, this.artVariety, this.tag) : this.on_search_done_callback(this.list, '', this.ix, '', this.pn, this.dj.mode, 1, this.curPop, this.artVariety, this.tag);	
		} else {
			switch (this.dj.type) {
				case 3:
					data = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'similartracks.track');
					break;
				default:
					if (!this.curPop) {
						if (this.dj.type != 1) data = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'toptracks.track');
						else data = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'tracks.track');
					}
					break;
			}
			items = data.length;
			if (!this.retry && !this.curPop && (!items || ((this.artistTopTracks || this.dj.type == 1 || this.dj.type == 3) && items < this.lmt))) {
				this.retry = true;
				if ($.file(this.fn)) this.lfmCacheFile = true;
				return this.search();
			}
			if (items || this.curPop) {
				$.create(this.fo);
				let save_list = [];
				switch (this.dj.type) {
					case 1:
						save_list = data.map(v => ({
							artist: v.artist.name,
							title: v.name
						}));
						this.list = $.take(data, this.songHot).map(this.tracks);
						if (this.dj.mode != 2) ppt.trackCount = data.length;
						this.on_search_done_callback(this.list, '', this.ix, '', this.pn, this.dj.mode, 1, this.curPop, this.artVariety, this.tag);
						if (save_list.length) $.save(this.fn, JSON.stringify(save_list), true);
						break;
					case 3:
						save_list = data.map(v => ({
							artist: v.artist.name,
							title: v.name,
							playcount: v.playcount
						}));
						this.list = data.map(this.tracks)
						if (ppt.lfmRadio && (ppt.djMode == 2 || ppt.djMode == 3)) { // force lfmRadio to run in library only mode
							const q = lib.partialMatch.artist && lib.partialMatch.type[3] != 0 ? ' HAS ' : ' IS ';
							const artists = $.getArtists(this.list, q);
							this.list = this.list.filter((v, i) => {
								return lib.inLibrary(v.artist, v.title, i, false, true, artists.libHandles);
							});
						}
						$.take(this.list, this.songHot);
						if (this.dj.mode != 2) ppt.trackCount = this.list.length;
						this.on_search_done_callback(this.list, '', this.ix, '', this.pn, this.dj.mode, 3, this.curPop, this.artVariety, this.tag);
						if (save_list.length) $.save(this.fn, JSON.stringify(save_list), true);
						break;
					default:
						if (this.curPop) {
							const getArtist = false;
							const getListeners = true;
							const getOnePage = this.songHot < 51;
							this.retry = true; // force bypass check
							data = wb.processLfmWebResponse(this, this.xmlhttp.responseText, getOnePage, getArtist, getListeners);
							if (data === undefined) return; else {
								this.list = data;
								this.list.forEach(v => v.playcount = parseInt(v.playcount) * 9);
								save_list = this.uniq(this.list);
								this.list.forEach(this.stripRemaster);
								this.list = this.uniq(this.list);
								if (save_list.length) $.save(this.fnc, JSON.stringify(save_list), true);
							}
						} else {
							this.list = data.map(v => ({
								title: $.stripRemaster(v.name),
								playcount: v.playcount
							}));
							save_list = data.map(v => ({
								title: v.name,
								playcount: v.playcount
							}));
							try {
								save_list.unshift({
									artist: data[0].artist.name,
									ar_mbid: data[0].artist.mbid
								});
							} catch (e) {
								save_list.unshift({
									artist: this.dj.source,
									ar_mbid: 'N/A'
								});
							}
							if (save_list.length) $.save(this.fn, JSON.stringify(save_list), true);
						}
						this.on_search_done_callback(this.dj.source, this.list, this.ix, this.done, this.pn, this.dj.mode, this.dj.type, this.curPop, this.artVariety, this.tag);
						break;
				}
			} else this.on_search_done_callback('', '', this.ix, this.done, this.pn, this.dj.mode, this.dj.type, this.curPop, this.artVariety, this.tag);
		}
	}

	stripRemaster(v) {
		v.title = $.stripRemaster(v.title);
	}

	tracks(v) {
		return ({
			artist: v.artist.name,
			title: $.stripRemaster(v.name)
		});
	}

	uniq(a) {
		const flags = [];
		const result = [];
		a.forEach(v => {
			if (flags[v.title + v.playcount]) return;
			result.push(v);
			flags[v.title + v.playcount] = true;
		});
		return result;
	}
}

class LfmAlbumCover {
	constructor(state_callback) {
		this.fo;
		this.func = null;
		this.ready_callback = state_callback;
		this.timer = null;
		this.xmlhttp = null;
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) this.func();
				else $.trace('last.fm album cover N/A: ' + this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
			}
	}

	search(p_artist, p_album, p_fo) {
		this.fo = p_fo;
		const URL = panel.url.lfm + '&method=album.getInfo&artist=' + encodeURIComponent(p_artist) + '&album=' + encodeURIComponent(p_album) + '&autocorrect=1';
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
	
		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		this.xmlhttp.setRequestHeader('User-Agent', 'foobar2000_script');
		if (!this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => {
				a.abort();
				this.timer = null;
			}, 30000);
		}
		this.xmlhttp.send();
	}

	analyse() {
		const data = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'album.image');
		if (data.length < 5) return $.trace('last.fm album cover N/A');
		let pth = data[4]['#text'];
		if (pth) {
			const pthSplit = pth.split('/');
			pthSplit.splice(pthSplit.length - 2, 1);
			pth = pthSplit.join('/');
		} else return $.trace('last.fm album cover N/A');
		$.run(`cscript //nologo "${panel.storageFolder}foo_lastfm_img.vbs" "${pth}" "${this.fo}cover${pth.slice(-4)}"`, 0);
	}
}

class MusicbrainzReleases {
	constructor(state_callback, on_search_done_callback) {
		this.add;
		this.alb_id;
		this.album;
		this.album_artist;
		this.attempt = 0;
		this.date;
		this.extra, this.func = null;
		this.initial = true;
		this.on_search_done_callback = on_search_done_callback;
		this.mTags;
		this.prime;
		this.ready_callback = state_callback;
		this.rg_mbid;
		this.timer = null;
		this.xmlhttp = null;
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) this.func();
				else if (this.xmlhttp.status == 503 && this.attempt < 5) {
					setTimeout(() => {
						this.attempt++;
						this.search();
					}, 450);
				} else {
					$.trace('musicbrainz releases N/A: ' + this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
					this.Null();
				}
			}
	}

	search(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags) {
		if (this.initial) {
			this.alb_id = p_alb_id;
			this.rg_mbid = p_rg_mbid;
			this.album_artist = p_album_artist;
			this.album = p_album;
			this.prime = p_prime;
			this.add = p_add;
			this.date = p_date;
			this.extra = p_extra;
			this.mTags = p_mTags;
		}
		this.initial = false;
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		let URL = panel.url.mb;
		if (ppt.mb == 1) URL += 'release-group/' + this.rg_mbid + '?inc=releases&fmt=json';
		else URL += 'release/?query="' + encodeURIComponent($.regexEscape(this.album.trim())) + '" AND artist:' + encodeURIComponent($.regexEscape(this.album_artist.trim())) + '&fmt=json';

		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		this.xmlhttp.setRequestHeader('User-Agent', 'foobar2000_yttm (https://hydrogenaud.io/index.php/topic,111059.0.html)');
		if (!this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => {
				a.abort();
				this.timer = null;
			}, 30000);
		}
		this.xmlhttp.send();
	}

	analyse() {
		const releases = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'releases');
		if (!releases.length) return this.Null();
		let re_mbid = '';
		if (!ppt.mb) {
			releases.some(v => {
				if (($.strip(v.title) == $.strip(this.album.replace(/\s\[(Single|EP|Remix|Live|Other).*?\]$/, ''))) && v.date && v.date.substring(0, 4)) {
					re_mbid = v.id;
					this.on_search_done_callback(this.alb_id, this.rg_mbid, this.album_artist, this.album, this.prime, this.extra, v.date.substring(0, 4), this.add, this.mTags, re_mbid);
					return true;
				}
			});
		} else {
			if (this.prime == $.jsonParse(this.xmlhttp.responseText, [])['primary-type']) {
				releases.some(v => {
					if (($.strip(v.title) == $.strip(this.album.replace(/\s\[(Single|EP|Remix|Live|Other).*?\]$/, '')))) {
						re_mbid = v.id;
						this.on_search_done_callback(this.alb_id, this.rg_mbid, this.album_artist, this.album, this.prime, this.extra, this.date, this.add, this.mTags, re_mbid);
						return true;
					}
				});
			}
		}
		if (!re_mbid) this.Null();
	}

	Null() {
		this.on_search_done_callback(this.alb_id, this.rg_mbid, this.album_artist, this.album, this.prime, this.extra, this.date, this.add, this.mTags);
	}
}

class AlbumTracks {
	constructor(state_callback, on_search_done_callback) {
		this.add;
		this.alb_id;
		this.album;
		this.artist = [];
		this.album_artist;
		this.attempt = 0;
		this.cover = '';
		this.data = [];
		this.date;
		this.duration = {}
		this.extra;
		this.func = null;
		this.initial = true;
		this.mTags;
		this.mb;
		this.on_search_done_callback = on_search_done_callback;
		this.pg = 1;
		this.prime;
		this.re_mbid;
		this.rg_mbid;
		this.ready_callback = state_callback;
		this.timer = null;
		this.title = [];
		this.xmlhttp = null;
		this.vid = [];	
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) this.func();
				else if (this.mb && this.xmlhttp.status == 503 && this.attempt < 5) {
					setTimeout(() => {
						this.attempt++;
						this.search();
					}, 450);
				} else {
					$.trace((this.mb ? 'musicbrainz' : 'last.fm') + ' album tracks N/A: ' + this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
					this.mb ? this.mb_return() : this.lfm_return();
				}
			}
	}

	search(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid, p_mb) {
		if (this.initial) {
			this.add = p_add;
			this.alb_id = p_alb_id;
			this.re_mbid = p_re_mbid;
			this.rg_mbid = p_rg_mbid;
			this.album_artist = p_album_artist;
			this.album = p_album;
			this.date = p_date;
			this.extra = p_extra;
			this.prime = p_prime;
			this.mTags = p_mTags;
			this.mb = p_mb;
		}
		this.initial = false;
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		let URL;
		switch (this.mb) {
			case 0:
				if (this.pg < 3) {
					URL = `https://www.last.fm/music/${encodeURIComponent(this.album_artist)}/${encodeURIComponent(this.album)}`;
				} else if (this.pg == 3 || this.pg == 4) URL = wb.vidCheck(3, this.pg, this.vid);
				
				
				break;
			case 1:
				URL = panel.url.mb + 'release/' + this.re_mbid + '?inc=recordings&fmt=json';
				break;
		}

		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		this.xmlhttp.setRequestHeader('User-Agent', 'foobar2000_yttm (https://hydrogenaud.io/index.php/topic,111059.0.html)');
		if (!this.mb) this.xmlhttp.setRequestHeader('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT');
		if (!this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => {
				a.abort();
				this.timer = null;
			}, 7000);
		}
		this.xmlhttp.send();
	}

	analyse() {
		let data = [];
		let list = [];
		switch (this.mb) {
			case 0:
				const getArtist = true;
				const getListeners = false;
				const getChart = false;
				const getAlbumTracks = true;
				const getDate = true;
				const getMtags = true;
				const getOnePage = true;
				data = wb.processLfmWebResponse(this, this.xmlhttp.responseText, getOnePage, getArtist, getListeners, getChart, getAlbumTracks, getDate, getMtags);
				if (data === undefined) return; else this.data = data;
				if (this.data.length) {
					$.trace('album track list from last.fm');
					return this.on_search_done_callback(this.alb_id, this.data, this.album_artist, this.album, this.prime, this.extra, this.date, this.add, this.mTags);
				}
				this.lfm_return();
				break;
			case 1: {
				data = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'media');
				let items = [];
				data.forEach(v => items = [...items, ...v.tracks]);
				list = items.map(v => ({
					artist: this.album_artist.replace(/’/g, "'"),
					title: v.title.replace(/’/g, "'"),
					album: this.album,
					date: this.date,
					mTags: this.mTags
				}));
				if (list.length) {
					$.trace('album track list from musicbrainz');
					return this.on_search_done_callback(this.alb_id, list, this.album_artist, this.album, this.prime, this.extra, this.date, this.add, this.mTags);
				}
				this.mb_return();
				break;
			}
		}
	}

	lfm_return() {
		alb.dld.getMbTracks(this.alb_id, this.rg_mbid, this.album_artist, this.album, this.prime, this.extra, this.date, this.add, this.mTags, this.re_mbid);
	}

	mb_return() {
		alb.dld.getLfmTracks(this.alb_id, this.rg_mbid, this.album_artist, this.album, this.prime, this.extra, this.date, this.add, this.mTags, this.re_mbid);
	}

	Null() {
		alb.setRow(this.alb_id, 0);
		this.on_search_done_callback(this.alb_id, '', this.album_artist, this.album, this.prime, this.extra, this.date, this.add, this.mTags);
	}
}

class MusicbrainzArtistId {
	constructor(state_callback, on_search_done_callback) {
		this.ar_mbid = '';
		this.attempt = 0;
		this.dbl_load;
		this.func = null;
		this.list = [];
		this.initial = true;
		this.item;
		this.mbid_source = 1;
		this.mb_done = false;
		this.mode;
		this.on_search_done_callback = on_search_done_callback;
		this.only_mbid;
		this.ready_callback = state_callback;
		this.related_artists = $.file(alb.art.relatedCustom) ? $.jsonParse(alb.art.relatedCustom, {}, 'file') : {};
		this.search_param;
		this.tag_mbid = '';
		this.timer = null;
		this.xmlhttp = null;

		this.done = {
			lfm: false,
			mb: false
		}
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) this.func();
				else if (this.xmlhttp.status == 503 && this.attempt < 5) {
					setTimeout(() => {
						this.attempt++;
						this.search();
					}, 450);
				} else switch (this.mbid_source) {
					case 0:
						this.done.lfm = true;
						this.mbid_source = 1;
						$.trace('last.fm mbid N/A: ' + this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
						this.lfm_return();
						break;
					case 1:
						this.done.mb = true;
						this.mbid_source = 0;
						$.trace('musicbrainz mbid N/A: ' + this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
						this.mb_return();
						break;
				}
			}
	}

	search(p_album_artist, p_dbl_load, p_mode, p_item, p_only_mbid) {
		if (this.initial) {
			this.dbl_load = p_dbl_load;
			this.item = p_item;
			this.mode = p_mode;
			this.only_mbid = p_only_mbid;
			this.search_param = p_album_artist;
		}
		this.initial = false;
		this.tag_mbid = $.eval('$trim($if3(%musicbrainz_artistid%,%musicbrainz artist id%,))');
		if (!this.tag_mbid) this.tag_mbid = this.related_artists[this.search_param.toUpperCase()];
		if (!this.tag_mbid || this.tag_mbid.length != 36) this.tag_mbid = '';
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		let URL = panel.url.mb + 'artist/';
		switch (this.mbid_source) {
			case 0:
				URL = panel.url.lfm;
				URL += '&method=artist.getInfo&artist=' + encodeURIComponent(this.search_param) + '&autocorrect=1';
				break;
			case 1:
				URL += '?query=' + encodeURIComponent($.regexEscape(this.search_param.toLowerCase())) + '&fmt=json';
				break;
		}

		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		this.xmlhttp.setRequestHeader('User-Agent', 'foobar2000_yttm (https://hydrogenaud.io/index.php/topic,111059.0.html)');
		if (!this.mbid_source) this.xmlhttp.setRequestHeader('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT');
		if (!this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => {
				a.abort();
				this.timer = null;
			}, 7000);
		}
		this.xmlhttp.send();
	}

	analyse() {
		let data;
		switch (this.mbid_source) {
			case 0:
				this.done.lfm = true;
				this.mbid_source = 1;
				data = $.jsonParse(this.xmlhttp.responseText, false, 'get', 'artist.mbid');
				if (!data) return this.lfm_return();
				else this.ar_mbid = data;
				if (!this.ar_mbid && !this.list.length) this.lfm_return();
				break;
			case 1: {
				this.done.mb = true;
				this.mbid_source = 0;
				data = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'artists');
				this.list = data.map(v => ({
					name: v.name,
					id: v.id,
					disambiguation: v.disambiguation || ''
				}));
				if (!this.list.length) return this.mb_return();

				let artist = $.strip(this.search_param);
				let matchId = -1;
				const get_arid = data => {
					data.some((v, i) => {
						if (this.ar_mbid) return true;
						if (artist == $.strip(v.name)) {
							this.ar_mbid = v.id;
							matchId = i;
							return true;
						}
					});
					data.some((v, i) => {
						if (this.ar_mbid) return true;
						if (v.aliases) {
							v.aliases.some(w => {
								if (artist == $.strip(w.name)) {
									this.ar_mbid = v.id;
									matchId = i;
									return true;
								}
							});
						}
					});
				}
				get_arid(data);
				if (!this.ar_mbid) {
					this.list.unshift({
						name: alb.artist + ' [Related]:',
						id: ''
					});
				} else if (this.list.length == 1) this.list[0] = {
					name: alb.artist + ' [No Related Artists]',
					id: '',
					disambiguation: ''
				}
				else {
					if (matchId > 0) this.moveArrayItem(this.list, matchId, 0);
					this.list[0].name = alb.artist + ' [Related]:'
				}
				break;
			}
		}
		if (!this.dbl_load) alb.art.related = this.list;
		if (!ppt.showSimilar && !this.dbl_load) {
			alb.artists.list = alb.art.related;
			if (alb.expanded) {
				alb.expanded = 0;
				alb.calcRows();
			} else
				alb.calcRowsArtists();
			txt.paint();
		}
		this.on_search_done_callback(this.tag_mbid ? this.tag_mbid : this.ar_mbid, this.mode, this.item, this.only_mbid);
	}

	lfm_return() {
		if (this.done.mb) this.on_search_done_callback('', this.mode, this.item, this.only_mbid);
		else this.search(this.search_param, this.dbl_load, this.mode, this.item, this.only_mbid);
	}

	mb_return() {
		this.list[0] = {
			name: 'Related Artists N/A',
			id: '',
			disambiguation: ''
		};
		alb.art.related = this.list;
		if (!ppt.showSimilar && !this.dbl_load) {
			alb.artists.list = alb.art.related;
			if (alb.expanded) {
				alb.expanded = 0;
				alb.calcRows();
			} else
				alb.calcRowsArtists();
			txt.paint();
		}
		if (this.done.lfm) this.on_search_done_callback('', this.mode, this.item, this.only_mbid);
		else this.search(this.search_param, this.dbl_load, this.mode, this.item, this.only_mbid);
	}

	moveArrayItem(arr, fromIndex, toIndex) {
		arr.splice(toIndex, 0, ...arr.splice(fromIndex, 1));
	}
}

class AlbumNames {
	constructor(state_callback, on_search_done_callback) {
		this.ar_mbid = false;
		this.artist = [];
		this.attempt = 0;
		this.check = ['loved', '7day', '1month', '3month', '6month', '12month', 'overall'];
		this.data = [];
		this.duration = {}
		this.fo;
		this.fn;
		this.func = null;
		this.initial = true;
		this.item;
		this.json_data = [];
		this.lfmCacheFile;
		this.lfmMixTrack;
		this.lfmMixTag;
		this.lfmPlayer = false;
		this.lfmTopTrackSpan = ppt.lfmTopTrackSpan;
		this.lfmUserLibSpan = ppt.lfmUserLibSpan;
		this.lfmWeb = false;
		this.listeners = [];
		this.lmt = 0;
		this.mode;
		this.offset = 0;
		this.on_search_done_callback = on_search_done_callback;
		this.page = 0;
		this.pg = 1;
		this.getArtistTitles = false;
		this.processMbids = [];
		this.ready_callback = state_callback;
		this.releases = 0;
		this.retry = false;
		this.sp = '';
		this.timeSpan = ['LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'LAST_180_DAYS', 'LAST_365_DAYS', 'ALL']
		this.span = this.timeSpan[this.lfmTopTrackSpan];
		this.spanLibrary = this.timeSpan[this.lfmUserLibSpan];
		this.timer = null;
		this.title = [];
		this.useLbToken = ppt.mb == 1 && ppt.mbReleaseType == 5 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ppt.userAPITokenListenBrainz);
		this.vid = [];
		this.xmlhttp = null;
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) {
					if (ppt.mb == 1) this.offset += 100;
					this.func();
				} else if (ppt.mb == 1 && this.xmlhttp.status == 503 && this.attempt < 5) {
					setTimeout(() => {
						this.attempt++;
						this.search();
					}, 450);
				} else {
					$.trace(
						['last.fm ' + (!this.mode ? 'top albums N/A: ' : this.mode == 1 ? 'top tracks N/A: ' : 'similar songs N/A: '), 'musicbrainz album names N/A: ', 'official charts album names N/A: '][ppt.mb] +
						this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
					this.on_search_done_callback([], this.ar_mbid, this.mode, this.item, this.lfmTopTrackSpan, this.lfmMixTrack, this.lfmMixTag);
				}
			}
	}

	search(p_ar_mbid, p_mode, p_item) {
		if (this.initial) {
			this.ar_mbid = p_ar_mbid;
			this.mode = p_mode;
			this.item = p_item;
			this.lfmMixTrack = ppt.lfmMixTrack;
			this.lfmMixTag = ppt.lfmMixTag;
			if (!ppt.mb) {
				this.lfmPlayer = Boolean(Number(
					this.mode == 1 ? this.lfmMixTrack : 
					this.mode == 2 ? (alb.lfmTagType > 1 && this.lfmMixTag || !alb.lfmTagType) : 
					this.mode == 4 && !this.check.includes(this.item)
				));
				if (!this.lfmPlayer) this.lfmWeb = Boolean(Number(
					this.mode == 1 ? this.lfmTopTrackSpan != 6 && !this.lfmMixTrack : 
					this.mode == 2 ? alb.lfmTagType != 1 : 
					this.mode == 4 ? !this.check.includes(this.item) : this.mode == 3
				));
			}
		}
		this.initial = false;
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		let chk, post, URL;

		if (ppt.mb == 1) {
			if (ppt.mbReleaseType < 5) {
				URL = panel.url.mb + 'release-group?artist=' + this.ar_mbid + '&limit=100&offset=' + this.offset + '&fmt=json';
			} else {
				if (!this.getArtistTitles) {
					if (ppt.lbUserMix && !this.retry) {
						this.offset = Math.floor(Math.random() * 901);
					}
					URL = `https://api.listenbrainz.org/1/${this.item}&count=100&offset=${this.offset}`;
				} else {
					URL = `https://labs.api.listenbrainz.org/recording-mbid-lookup/json`;
					post = JSON.stringify(this.processMbids);
				}
				
			}
		}
		else if (!ppt.mb) {
			switch (true) {
				case this.lfmPlayer:
					if (this.page < 5) {
						URL = panel.url.lfmPlayer + (
							this.mode == 1 && this.lfmMixTrack ? `music/${encodeURIComponent(this.item)}` : // last.fm mix artist
							this.mode == 2 && alb.lfmTagType > 1 && this.lfmMixTag ? `tag/${encodeURIComponent(this.item)}` : // last.fm mix tag
							this.mode == 2 && !alb.lfmTagType ? `music/${encodeURIComponent(this.item)}/+similar` : // last.fm mix similar artists
							`user/${ppt.lfmUserName}/${this.item}` // last.fm user mix recommendations neighbours library
						);
					} else if (this.page == 5 || this.page == 6) URL = wb.vidCheck(5, this.page, this.vid);
					break;
				case this.lfmWeb:
					if (this.pg < 3) {
						URL =
							this.mode == 1 && this.lfmTopTrackSpan != 6 ? `https://www.last.fm/music/${encodeURIComponent(this.item)}/+tracks?date_preset=${this.span}&page=${this.pg}` : // artist top tracks web
							this.mode == 2 && alb.lfmTagType ? `https://www.last.fm/tag/${encodeURIComponent(this.item)}/tracks?page=${this.pg}` : // tag top tracks web
							`https://www.last.fm/${this.item}s` // chart
					} else if (this.pg == 3 || this.pg == 4) URL = wb.vidCheck(3, this.pg, this.vid);
					break;
				default:
					URL = panel.url.lfm;
					switch (this.mode) {
						case 0:
							this.lmt = !this.retry ? 100 : 105 + Math.floor(Math.random() * 10);
							URL += '&method=artist.getTopAlbums&artist=' + encodeURIComponent(this.item) + '&limit=' + this.lmt + '&autocorrect=1';
							break;
						case 1:
							this.sp = $.clean(alb.artist);
							this.fo = dj.f2 + this.sp.substr(0, 1).toLowerCase() + '\\';
							this.fn = this.fo + this.sp + '.json';
							this.lfmCacheFile = !this.retry ? !panel.expired(this.fn, TwentyEight_Days) : $.file(this.fn);
							if (this.lfmCacheFile) {
								this.data = $.jsonParse(this.fn, false, 'file');
								if (this.data && $.objHasOwnProperty(this.data[0], 'artist')) this.data.shift();
								if (this.data.length > 199) return this.on_search_done_callback($.take(this.data, 100), this.ar_mbid, this.mode, this.item, this.lfmTopTrackSpan, this.lfmMixTrack, this.lfmMixTag);
							}
							this.lmt = 0;
							if ($.file(this.fn)) chk = $.jsonParse(this.fn, false, 'file');
							if (chk) this.lmt = chk.length - 1;
							this.lmt = Math.max(201 + Math.floor(Math.random() * 5), this.lmt);
							if (this.retry) this.lmt += 5 + Math.floor(Math.random() * 10);
							URL += '&method=artist.getTopTracks&artist=' + encodeURIComponent(this.item) + '&limit=' + this.lmt + '&autocorrect=1';
							break;
						case 2: {
							const ar_ti = this.item.split('|');
							const ar = !ar_ti[0] ? '' : ar_ti[0].trim();
							const ti = !ar_ti[1] ? '' : ar_ti[1].trim();
							this.sp = ar + ' - ' + ti;
							this.sp = $.clean(this.sp);
							this.fo = dj.f2 + this.sp.substr(0, 1).toLowerCase() + '\\';
							this.fn = this.fo + this.sp + ' [Similar Songs].json';
							this.lfmCacheFile = !this.retry ? !panel.expired(this.fn, TwentyEight_Days) : $.file(this.fn);
							if (this.lfmCacheFile) {
								let list = $.jsonParse(this.fn, [], 'file');
								if (list.length > 124) {
									if (this.lfmMixTag) {
										list.forEach(v => v.title = $.stripRemaster(v.title));
										list = Object.values(list.reduce((a, c) => (a[`${c.artist}${c.title}`] = c, a), {}));
										$.take(list, 125);
										alb.getList(list, this.data);
									} else this.data = $.take(list, 100);
									return this.on_search_done_callback(this.data, this.ar_mbid, this.mode, this.item, this.lfmTopTrackSpan, this.lfmMixTrack, this.lfmMixTag);
								}
							}
							this.lmt = 0;
							if ($.file(this.fn)) chk = $.jsonParse(this.fn, false, 'file');
							if (chk) this.lmt = chk.length;
							this.lmt = Math.max(125, this.lmt);
							if (this.retry) this.lmt = this.lmt != 250 ? this.lmt + 5 + Math.floor(Math.random() * 10) : this.lmt - 5;
							URL += '&method=track.getSimilar&artist=' + encodeURIComponent(ar) + '&track=' + encodeURIComponent(ti) + '&limit=' + this.lmt + '&autocorrect=1';
							break;
						}
						case 4:
							this.lmt = 980 + Math.floor(Math.random() * 5);
							if (this.retry) this.lmt += 5 + Math.floor(Math.random() * 10);
							this.item == 'loved' ? 
							URL += '&method=user.getlovedtracks&user=' + encodeURIComponent(ppt.lfmUserName) + '&limit=' + this.lmt + '&autocorrect=1' :
							URL += '&method=user.gettoptracks&user=' + encodeURIComponent(ppt.lfmUserName) + '&period=' + this.item + '&limit=' + this.lmt + '&autocorrect=1';
							break;
					}
					break;
			}
		} else {
			this.fo = dj.f2 + 's\\';
			this.fn = this.fo + 'Singles Charts.json';
			let content = [];
			this.chartData = $.jsonParse(this.fn, [], 'file');
			if (this.chartData.length) {
				const chartDate = ppt.chartDate.toString();
				const chartStamp = Date.parse([chartDate.slice(0, 4), chartDate.slice(4, 6), chartDate.slice(6, 8)].join('-'))
				this.chartData.some(v => {
					if (chartStamp >= v.from && chartStamp < v.to + One_Day) {
						content = v.chart;
						return true;
					}
				});
			}
			if (content.length) return this.on_search_done_callback(content, this.ar_mbid, this.mode, this.item, this.lfmTopTrackSpan, this.lfmMixTrack, this.lfmMixTag);
			URL = panel.url.chart + ppt.chartDate + '/7501/';
		}
		this.func = this.analyse;
		this.xmlhttp.open(!this.getArtistTitles ? 'GET' : 'POST', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		if (this.getArtistTitles) this.xmlhttp.setRequestHeader('Content-Type', 'application/json');
		if (this.useLbToken) this.xmlhttp.setRequestHeader('Authorization', 'Token ' + ppt.userAPITokenListenBrainz);
		this.xmlhttp.setRequestHeader('User-Agent', 'foobar2000_yttm (https://hydrogenaud.io/index.php/topic,111059.0.html)');
		if (!ppt.mb && this.retry) this.xmlhttp.setRequestHeader('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT');
		// if lb needs cache control can use old method previously used: URL + (/\?/.test(URL) ? '&' : '?') + new Date().getTime() [above method didn't seem to work here] // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#bypassing_the_cache
		// but normally albumNames works best using auto-caching & it's not been needed with mb
		if (!this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => {
				a.abort();
				this.timer = null;
			}, ppt.mb != 2 ? 7000 : 30000);
		}
		!this.getArtistTitles ? this.xmlhttp.send() : this.xmlhttp.send(post);
	}

	analyse() {
		let data;
		this.data = [];
		if (ppt.mb == 1) { // mb
			if (ppt.mbReleaseType < 5) {
				const response = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'release-groups');
				if (!response.length) return this.on_search_done_callback('', this.ar_mbid, this.mode, this.item, this.lfmTopTrackSpan, this.lfmMixTrack, this.lfmMixTag);
				this.json_data = [...this.json_data, ...response];
				if (this.offset == 100) this.releases = $.jsonParse(this.xmlhttp.responseText, 0, 'get', 'release-group-count');
				if (!this.releases) return this.on_search_done_callback('', this.ar_mbid, this.mode, this.item, this.lfmTopTrackSpan, this.lfmMixTrack, this.lfmMixTag);

				if (this.releases < this.offset || this.offset == 600) {
					this.data = $.sort(this.json_data, 'first-release-date', 'rev');
					this.on_search_done_callback(this.data, this.ar_mbid, this.mode, this.item, this.lfmTopTrackSpan, this.lfmMixTrack, this.lfmMixTag);
				} else {
					this.attempt = 0;
					this.search();
				}
				return;
			} else {
				let list = [];
				if (!this.getArtistTitles ) {
					const isRecommendation = this.item.includes('recommendation/');
					const isFeedback = this.item.includes('feedback/');
					const isStats = this.item.includes('stats/');
					if (isFeedback) {
						list = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'feedback');
						if (!list.length && this.offset != 0 && !this.retry) {
							this.offset = 0;
							this.retry = true;
							this.search();
							return;
						}
						const tracks = v => ({
							artist: $.getProp(v, 'track_metadata.artist_name', ''),
							title: $.getProp(v, 'track_metadata.track_name', '')
						});
						list = list.map(tracks);
					} else if (isStats) {
						list = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'payload.recordings');
						if (!list.length && this.offset != 0 && !this.retry) {
							this.offset = 0;
							this.retry = true;
							this.search();
							return;
						}
						const tracks = v => ({
							artist: v.artist_name,
							title: v.track_name,
							playcount: v.listen_count 
						});
						
						list = list.map(tracks);
					} else if (isRecommendation) {
						const list = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'payload.mbids');
						if (!list.length && this.offset != 0 && !this.retry) {
							this.offset = 0;
							this.retry = true;
							this.search();
							return;
						}
						this.processMbids = list.map(v => ({'[recording_mbid]': v.recording_mbid}));
						if (!this.getArtistTitles) {
							this.getArtistTitles = true;
							this.search();
							return;
						}
					}
				} else {
					list = $.jsonParse(this.xmlhttp.responseText, []);
					const tracks = v => ({
						artist: v.artist_credit_name,
						title: v.recording_name
					});
					list = list.map(tracks);
				}

				if (ppt.lbExcludeCJKCyrillic) list = list.filter(v => !/([^\u0000-\u05C0\u2100-\u214F]|[\u0400-\u04FF])/.test((v.artist + ' ' + v.title).replace(/[.\u2026,!?:;'\u2019"\-_\u2010\s+]/g, '')));
				list = Object.values(list.reduce((a, c) => (a[`${c.artist}${c.title}`] = c, a), {}));
				if (ppt.lbUserMix) alb.getList(list, this.data);
				else this.data = list;
				
			}
		} else if (!ppt.mb) { // lfm
			let list, save_list = [];
			let tracks;
			switch (true) {
				case this.lfmPlayer:
					const artistMix = this.mode == 1;
					const getList = this.mode == 2 || this.mode == 4;
					data = wb.processLfmPlayerResponse(this, this.xmlhttp.responseText, getList, artistMix);
					if (data === undefined) return; else this.data = data;
					break;
				case this.lfmWeb:
					const getArtist = this.mode == 2 && alb.lfmTagType || this.mode == 3 || this.mode == 4;
					const getListeners = this.mode == 1 && this.lfmTopTrackSpan != 6 || this.mode == 4 && this.item == 'library';
					const getChart = this.mode == 3;
					const getAlbumTracks = false;
					const getDate = false;
					const getMtags = false;
					const getOnePage = false;
					const getUser = this.mode == 4;;
					data = wb.processLfmWebResponse(this, this.xmlhttp.responseText, getOnePage, getArtist, getListeners, getChart, getAlbumTracks, getDate, getMtags, getUser);
					if (data === undefined) return; else this.data = data;
					if (!this.retry && !this.data.length) {
						this.retry = true;
						this.page = 0;
						setTimeout(() => {
							this.search();
						}, 5000);
						return;
					}
					break;
				default:
					switch (this.mode) {
						case 0:
							this.data = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'topalbums.album'); // lfm top albums
							if (!this.retry && (this.data.length < this.lmt)) {
								this.retry = true;
								return this.search();
							}
							if (!this.data.length) break;
							$.take(this.data, 100);
							break;
						case 1:
							list = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'toptracks.track');  // lfm top tracks api
							if (!this.retry && (list.length < this.lmt)) {
								this.retry = true;
								return this.search();
							}
							if (!list.length) break;
							tracks = v => ({
								title: v.name,
								playcount: v.playcount
							});
							save_list = list.map(tracks);
							this.data = $.take(list, 100).map(tracks);
							if (save_list.length) {
								$.create(this.fo);
								$.save(this.fn, JSON.stringify(save_list), true);
							}
							break;
						case 2:
							if (alb.lfmTagType == 1) { // lfm similar songs
								this.data = [];
								list = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'similartracks.track');
								if (!this.retry && (list.length < this.lmt)) {
									this.retry = true;
									return this.search();
								}
								if (!list.length) break;
								tracks = v => ({ // lfm top songs
									artist: v.artist.name,
									title: this.lfmMixTag ? $.stripRemaster(v.name) : v.name,
									playcount: v.playcount
								});

								list = list.map(tracks);
								save_list = list.map(v => v);
								if (this.lfmMixTag) { // lfmMix songs
									list = Object.values(list.reduce((a, c) => (a[`${c.artist}${c.title}`] = c, a), {}));
									$.take(list, 125);
									alb.getList(list, this.data);
								} else this.data = $.take(list, 100);
								if (save_list.length) {
									$.create(this.fo);
									$.save(this.fn, JSON.stringify(save_list), true);
								}
							}
							break;
						case 4: // lfm user
							list = $.jsonParse(this.xmlhttp.responseText, [], 'get', this.item == 'loved' ? 'lovedtracks.track' : 'toptracks.track');
							if (!this.retry && (list.length < this.lmt)) {
								this.retry = true;
								return this.search();
							}
							if (!list.length) break;
							tracks = v => ({ // lfm top songs
								artist: v.artist.name,
								title: v.name,
								playcount: v.playcount
							});
							list = list.map(tracks);
							this.data = $.take(list, 100);
							break;
					}
					break;
			}
		} else {
			let list = [];
			doc.open();
			const div = doc.createElement('div');
			div.innerHTML = this.xmlhttp.responseText;
			this.data = div.getElementsByTagName('div');
			let i = 0;
			$.htmlParse(this.data, 'className', 'artist', v => {
				const a = v.getElementsByTagName('a');
				list[i] = {
					artist: a.length && a[0].innerText ? $.titlecase(a[0].innerText.replace(/&amp(;|)/g, '&').replace(/&quot(;|)/g, '"').toLowerCase()) : ''
				};
				i++;
			});
			i = 0;
			$.htmlParse(this.data, 'className', 'title', v => {
				const a = v.getElementsByTagName('a');
				list[i].title = a.length && a[0].innerText ? $.titlecase(a[0].innerText.replace(/&amp(;|)/g, '&').replace(/&quot(;|)/g, '"').toLowerCase()) : ''
				i++;
			});
			$.htmlParse(div.getElementsByTagName('p'), 'className', 'article-date', v => {
				if (list.length) list[0].date = v.innerHTML.trim();
				return true;
			});
			if (!this.retry && list.length < 40) {
				this.retry = true;
				return this.search();
			}
			this.data = $.take(list, 100);
			if (this.data.length && list[0].date && list[0].date.includes('-')) {
				const dates = list[0].date.split('-');
				const item = {
					from: Date.parse(dates[0].trim()),
					to: Date.parse(dates[1].trim()),
					span: list[0].date,
					chart: this.data
				}
				if (this.fn && $.isArray(this.chartData)) {
					this.chartData.push(item);
				} else {
					this.chartData = [item];
				}
				$.create(this.fo);
				$.save(this.fn, JSON.stringify(this.chartData), true);
			}
			doc.close();
		}
		this.on_search_done_callback(this.data, this.ar_mbid, this.mode, this.item, this.lfmTopTrackSpan, this.lfmMixTrack, this.lfmMixTag);
	}

	getIndex(list, listLength) {
		let ind = Math.floor(listLength * Math.random());
		let j = 0;
		while ((this.loadedArtists.includes($.strip(list[ind].artist)) || this.playedTracks.includes($.strip(list[ind].title))) && j < listLength) {
			ind = Math.floor(listLength * Math.random());
			j++;
		}
		return ind;
	}

	getList(list, arr) {
		this.loadedArtists = [];
		this.playedTracks = [];
		list.some(v => {
			const t_ind = this.getIndex(list, list.length);
			arr.push(list[t_ind]);
			this.loadedArtists.push($.strip(list[t_ind].artist));
			this.playedTracks.push($.strip(list[t_ind].title));
			if (this.loadedArtists.length > 6) this.loadedArtists.splice(0, 1);
			return arr.length > 99;
		});
		return arr;
	}

	tidy(n) {
        return n.replace(/&#39;/g, "'")
            .replace(/&#38;/g, "&")
            .replace(/&#34;/g, "\"")
            .replace(/&#60;/g, "<")
            .replace(/&#62;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, "\"")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .trim();
    }
}

class AutoDjTracks {
	constructor() {
		this.added = 'init';
		this.addToCache = [];
		this.artVariety;
		this.curPop;
		this.dj = {};
		this.handles = [];
		this.lastRun = Date.now();
		this.limit;
		this.list = [];
		this.on_search_done_callback;
		this.paths = [];
		this.rec = [];
		this.songHot;
		this.loadTime = [];
		this.received = 0;
		this.searchParams = [];
		this.timer = null;
	}

	execute(p_search_finish_callback, p_djSource, p_djMode, p_djType, p_artVariety, p_songHot, p_limit, p_curPop, p_pn) {
		this.list = [];
		this.on_search_done_callback = p_search_finish_callback;
		this.dj.source = p_djSource;
		this.dj.mode = p_djMode;
		this.dj.type = p_djType;
		this.lfmRadio = ppt.lfmRadio && this.dj.mode < 2 && this.dj.type != 3;
		this.artVariety = p_artVariety;
		this.songHot = p_songHot;
		this.limit = p_limit;
		this.curPop = p_curPop;
		index.reset_add_loc();
		if (!ppt.useSaved && !this.lfmRadio && (this.dj.type == 2 || this.dj.type == 4)) {
			const lfm_similar = new LfmSimilarArtists(() => lfm_similar.onStateChange(), this.lfm_similar_search_done.bind(this));
			lfm_similar.search(this.dj.source, this.dj.mode, this.artVariety, this.dj.type);
		} else if (!this.dj.mode) {
			if (alb.playlist.length) {
				this.on_search_done_callback(true, 0, '', '', '', '', '', this.dj.type);
				dj.list.items = alb.playlist;
				const plDjCount = plman.PlaylistItemCount(pl.dj());
				let playTracksLoaded = $.jsonParse(ppt.playTracksLoaded, false);
				let tracks = [];
				if (this.dj.type == 'new') {
					const no = dj.get_no(this.limit, plDjCount);
					tracks = alb.playlist.slice(0, no);
					playTracksLoaded = Array.from(Array(no).keys());
				} else {
					alb.playlist.some((v, i) => {
						if (!playTracksLoaded.includes(i)) {
							tracks.push(v);
							playTracksLoaded.push(i)
						}
						return tracks.length == dj.get_no(false, plDjCount);
					});
				}
				ppt.playTracksLoaded = JSON.stringify(playTracksLoaded);
				tracks.forEach((v, i) => {
					this.do_youtube_search('playTracks', v.artist, v.title, i, tracks.length, p_pn, '', '', v.vid, v.length, v.thumbnail)
				});
			}
		} else if (!ppt.useSaved || this.lfmRadio) this.do_lfm_dj_tracks_search(this.dj.source, this.dj.mode, this.dj.type, this.artVariety, this.songHot, this.curPop, '', '', p_pn);
		else {
			const djSource = $.clean(this.dj.source);
			let cur, data, fn, i, tracks;
			switch (this.dj.type == 4 ? 2 : this.dj.type) {
				case 0:
					fn = dj.f2 + djSource.substr(0, 1).toLowerCase() + '\\' + djSource + (this.curPop ? ' [curr]' : '') + '.json';
					if (!$.file(fn)) fn = dj.f2 + djSource.substr(0, 1).toLowerCase() + '\\' + djSource + (!this.curPop ? ' [curr]' : '') + '.json';
					if (!$.file(fn)) return this.on_search_done_callback(false, this.dj.mode);
					data = $.jsonParse(fn, false, 'file');
					if (!data) return this.on_search_done_callback(false, this.dj.mode);
					this.on_search_done_callback(true, this.dj.mode);
					cur = fn.includes(' [curr]');
					if ($.objHasOwnProperty(data[0], 'artist')) data.shift();
					this.list = $.take(data, this.songHot).map(this.titles);
					$.sort(this.list, 'playcount', 'numRev');
					dj.list.items = this.list;
					dj.list.isCurPop = cur;
					dj.param = this.dj.source;
					if (this.list.length) {
						tracks = dj.get_no(this.limit, plman.PlaylistItemCount(pl.dj()));
						for (i = 0; i < tracks; i++) {
							const t_ind = index.track(this.list, true, '', this.dj.mode, cur);
							const v = this.list[t_ind];
							this.do_youtube_search('', this.dj.source, v.title, i, tracks, p_pn, '', '', v.vid, v.length, v.thumbnail);
						}
					}
					break;
				case 1:
				case 3:
					fn = dj.f2 + djSource.substr(0, 1).toLowerCase() + '\\' + djSource + (this.dj.type == 1 ? '.json' : ' [Similar Songs].json');
					if (!$.file(fn)) return this.on_search_done_callback(false, this.dj.mode);
					data = $.jsonParse(fn, false, 'file');
					if (!data) return this.on_search_done_callback(false, this.dj.mode);
					this.on_search_done_callback(true, this.dj.mode);
					this.list = $.take(data, this.songHot).map(v => ({
						artist: v.artist,
						title: $.stripRemaster(v.title)
					}));
					dj.list.items = this.list;
					ppt.trackCount = data.length;
					if (this.list.length) {
						tracks = dj.get_no(this.limit, plman.PlaylistItemCount(pl.dj()));
						for (i = 0; i < tracks; i++) {
							const g_ind = index.getTrack(this.list.length, this.list, 0);
							const v = this.list[g_ind];
							this.do_youtube_search('', v.artist, v.title, i, tracks, p_pn, '', '', v.vid, v.length, v.thumbnail);
						}
					}
					break;
				case 2: {
					fn = dj.f2 + djSource.substr(0, 1).toLowerCase() + '\\' + djSource + (this.dj.type == 4 ? ' - Top Artists.json' : ' and Similar Artists.json');
					let ft;
					if (!$.file(fn)) {
						if (this.dj.mode > 1) dj.medLib('', this.dj.source, this.dj.mode, this.dj.type, this.artVariety);
						return this.on_search_done_callback(false, this.dj.mode);
					}
					data = $.jsonParse(fn, false, 'file');
					if (!data) {
						if (this.dj.mode > 1) dj.medLib('', this.dj.source, this.dj.mode, this.dj.type, this.artVariety);
						return this.on_search_done_callback(false, this.dj.mode);
					}
					if (this.dj.mode > 1) {
						dj.medLib(data, this.dj.source, this.dj.mode, this.dj.type, this.artVariety);
						return;
					}
					this.on_search_done_callback(true, this.dj.mode);
					dj.list.items = data.slice(0, this.artVariety);
					tracks = dj.get_no(this.limit, plman.PlaylistItemCount(pl.dj()));
					for (i = 0; i < tracks; i++) {
						dj.list.items.some(() => {
							const s_ind = index.artist(dj.list.items.length);
							const lp = this.dj.type != 4 && $.objHasOwnProperty(dj.list.items[0], 'name') ? $.clean(dj.list.items[s_ind].name) : $.clean(dj.list.items[s_ind]);
							ft = dj.f2 + lp.substr(0, 1).toLowerCase() + '\\' + lp + (this.curPop ? ' [curr]' : '') + '.json';
							if (!$.file(ft)) ft = dj.f2 + lp.substr(0, 1).toLowerCase() + '\\' + lp + (!this.curPop ? ' [curr]' : '') + '.json';
							return $.file(ft);
						});
						data = $.jsonParse(ft, false, 'file');
						if (data && $.objHasOwnProperty(data[0], 'artist')) data.shift();
						cur = ft.includes(' [curr]');
						this.list = $.take(data, this.songHot).map(this.titles);
						const art_nm = fso.GetBaseName(ft).replace(' [curr]', '');
						if (this.list.length) {
							$.sort(this.list, 'playcount', 'numRev');
							const t_ind = index.track(this.list, false, art_nm, this.dj.mode, cur);
							const v = this.list[t_ind];
							this.do_youtube_search('', art_nm, v.title, i, tracks, p_pn, '', '', v.vid, v.length, v.thumbnail);
						}
					}
					break;
				}
			}
		}
	}

	do_lfm_dj_tracks_search(p_artist, p_djMode, p_djType, p_artVariety, p_songHot, p_curPop, p_i, p_done, p_pn) {
		const lfm = new LfmDjTracksSearch(() => lfm.onStateChange(), this.on_lfm_dj_tracks_search_done.bind(this));
		lfm.search(p_artist, p_djMode, p_djType, p_artVariety, p_songHot, p_curPop, p_i, p_done, p_pn);
	}

	do_youtube_search(...args) {
		this.searchParams.push(args);
		if (!timer.yt.id) timer.yt.id = setInterval(() => {
			if (this.searchParams.length) {
				const [p_alb_id, p_artist, p_title, p_i, p_done, p_pn, p_alb_set, p_lib_checked, p_vid, p_length, p_thumbnail] = this.searchParams[0];
				if (!p_lib_checked && this.libUsed(p_alb_id, p_alb_set)) {
					const inLib = lib.inLibrary(p_artist, p_title, p_i, p_alb_id == 'playTracks' ? true : p_alb_set, false, p_alb_id == 'playTracks' ? dj.artists.libHandles : false);
					if (inLib || p_alb_id == 'playTracks' && ppt.libAlb == 2) {
						if (p_alb_set) {
							alb.setRow(p_alb_id, 1);
						}
						this.searchParams.shift();
						return this.on_youtube_search_done(p_alb_id, '', p_artist, p_title, p_i, p_done, p_pn, p_alb_set, inLib);
					}
				}
				if (p_alb_id == 'playTracks') {
					if (lib.inPlaylist(p_artist, p_title, p_i, false, true, false, dj.artists.plHandles)) {
						this.searchParams.shift();
						return this.on_youtube_search_done(p_alb_id, '', p_artist, p_title, p_i, p_done, p_pn, p_alb_set);
					}
				}
				if (p_vid) {
					const url = 'fy+https://www.youtube.com/watch?' +  'fb2k_title=' + encodeURIComponent(p_title) + '&fb2k_search_title=' + encodeURIComponent(p_title) + '&fb2kx_length=' + encodeURIComponent(p_length) + (ppt.ytSend ? '&fb2kx_thumbnail_url=' + encodeURIComponent(p_thumbnail || `https://i.ytimg.com/vi/${p_vid}/hqdefault.jpg`) : '') + '&fb2k_artist=' + encodeURIComponent(p_artist) + '&v=' + p_vid;
					this.searchParams.shift();
					return this.on_youtube_search_done(p_alb_id, url, p_artist, p_title, p_i, p_done, p_pn, p_alb_set);
				}
				const yt = new YoutubeSearch(() => yt.onStateChange(), this.on_youtube_search_done.bind(this));
				if (p_alb_set) {
					alb.setRow(p_alb_id, 1);
					this.rec[p_alb_id] = 0;
				}
				yt.search(p_alb_id, p_artist, p_title, p_i, p_done, p_pn, '', p_alb_set);
				this.searchParams.shift();
			} else timer.clear(timer.yt);
		}, 110);
	}

	lfm_similar_search_done(res, source, p_djMode) {
		if (p_djMode > 1) return;
		if (!res.length) return this.on_search_done_callback(false, p_djMode, 0);
		this.on_search_done_callback(true, p_djMode, 0);
		dj.list.items = res.slice(0, this.artVariety);
		const tracks = dj.get_no(this.limit, plman.PlaylistItemCount(pl.dj()));
		for (let i = 0; i < tracks; i++) {
			const s_ind = index.artist(dj.list.items.length);
			this.do_lfm_dj_tracks_search(this.dj.type != 4 && $.objHasOwnProperty(dj.list.items[0], 'name') ? dj.list.items[s_ind].name : dj.list.items[s_ind], p_djMode, this.dj.type == 4 ? 2 : this.dj.type, this.artVariety, this.songHot, this.curPop, i, tracks, pl.dj());
		}
	}

	libUsed(p_alb_id, p_alb_set) {
		return (p_alb_set || p_alb_id == 'playTracks') ? ppt.libAlb : ppt.libDj;
	}

	syncLoad(p_alb_id, p_alb_set) {
		return p_alb_id == 'playTracks' || (p_alb_set ? ppt.libAlb : ppt.libDj);
	}

	on_lfm_dj_tracks_search_done(p_artist, p_title, p_i, p_done, p_pn, p_djMode, p_djType, p_cur, p_tcount) {
		let t_ind, tracks;
		switch (p_djType) {
			case 0:
				if (!p_title.length) return this.on_search_done_callback(false, p_djMode, p_pn);
				this.on_search_done_callback(true, p_djMode);
				this.list = p_title;
				if (!this.lfmRadio) $.sort(p_title, 'playcount', 'numRev');
				dj.list.items = p_title;
				dj.list.isCurPop = p_cur;
				dj.param = p_artist;
				tracks = dj.get_no(this.limit, plman.PlaylistItemCount(pl.dj()));
				for (let i = 0; i < tracks; i++) {
					if (p_title.length) {
						t_ind = this.lfmRadio ? index.getTrack(p_title.length, p_title, 0) : index.track(p_title, true, '', p_djMode, p_cur);
						const v = p_title[t_ind];
						this.do_youtube_search('', p_artist, v.title, i, tracks, p_pn, '', '', v.vid, v.length, v.thumbnail);
						if (this.lfmRadio) p_title.splice(t_ind, 1);
					}
				}
				break;
			case 1:
			case 3:
				if (!p_artist.length) return this.on_search_done_callback(false, p_djMode, p_pn);
				this.on_search_done_callback(true, p_djMode);
				this.list = p_artist;
				dj.list.items = p_artist;
				tracks = dj.get_no(this.limit, plman.PlaylistItemCount(pl.dj()));
				for (let i = 0; i < tracks; i++) {
					if (p_artist.length) {
						const g_ind = index.getTrack(p_artist.length, p_artist, 0);
						const v = p_artist[g_ind];
						this.do_youtube_search('', v.artist, v.title, i, tracks, p_pn, '', '', v.vid, v.length, v.thumbnail);
						if (p_djType == 1 && this.lfmRadio) p_artist.splice(g_ind, 1);
					}
				}
				ppt.trackCount = p_artist.length;
				break;
			case 2:
				if (!this.lfmRadio) {
					if (!p_artist.length || !p_title.length) return this.on_youtube_search_done();
					$.sort(p_title, 'playcount', 'numRev');
					t_ind = index.track(p_title, false, p_artist, p_djMode, p_cur);
					const v = p_title[t_ind];
					this.do_youtube_search('', p_artist, v.title, p_i, p_done, p_pn, '', '', v.vid, v.length, v.thumbnail);
				} else {
					if (!p_artist.length) return this.on_search_done_callback(false, p_djMode, p_pn);
					this.on_search_done_callback(true, p_djMode);
					this.list = p_artist;
					dj.list.items = p_artist;
					tracks = dj.get_no(this.limit, plman.PlaylistItemCount(pl.dj()));
					for (let i = 0; i < tracks; i++) {
						if (p_artist.length) {
							const g_ind = index.getTrack(p_artist.length, p_artist, 0);
							const v = p_artist[g_ind];
							this.do_youtube_search('', v.artist, v.title, i, tracks, p_pn, '', '', v.vid, v.length, v.thumbnail);
							p_artist.splice(g_ind, 1);
						}
					}
				}
				break;
		}
	}

	on_youtube_search_done(p_alb_id, link, p_artist, p_title, p_i, p_done, p_pn, p_alb_set, p_inLib) {
		const exists = panel.add_loc.std.some(v => {
			if (v.id == (!p_alb_set ? p_i : p_alb_id)) {
				v.alb_id = p_alb_id;
				v.done = p_done;
				v.pn = p_pn;
				v.alb_set = p_alb_set;
				return true;
			}
		});
		if (!exists) {
			panel.add_loc.std.push({
				alb_id: p_alb_id,
				path: link,
				id: p_i,
				done: p_done,
				pn: p_pn,
				alb_set: p_alb_set
			});
		}
		if (!this.timer) this.runAddLoc(panel.add_loc.std);
		if (p_alb_set) alb.setRow(p_alb_id, link && link.length || p_inLib ? 2 : 0);
	}

	runAddLoc(p_loc) { // async addLocations
		this.timer = setInterval(() => {
			let ix = 0;
			const done = p_loc.every(v => v.id == 'x');
			if (!done) p_loc.forEach(v => {
				if (v.id == 'x') ix++;
			});

			const run = this.added == 'init' || this.added || done/*clears timer*/; // p_alb_set: single items (don't reset addLoc, simple handling)
			if (!run) return;
			this.lastRun = Date.now();
			if (p_loc.length && !done) {
				if (p_loc[0].alb_set) { // should only be one item so can clear here
					if (p_loc[0].alb_set !== 2) {
						pl.clear(pl.selection());
					}
				}
				let last = '';
				p_loc.some((v, i) => {
					if (v.id == (!v.alb_set ? ix : v.alb_id)) {
						const finalise = v.id == v.done - 1 || v.alb_set;
						v.id = 'x';
						if (v.path) {
							if (last != '' && last != 'path') return true;
							this.paths.push(v);
							if (v.alb_id == 'playTracks' || v.alb_set) this.addToCache.push(v.path);
							last = 'path';
						} else if (v.handle) {
							if (last != '' && last != 'handle') return true;
							this.handles.push(v);
							last = 'handle';
						}
						if (finalise && this.addToCache.length) setTimeout(() => {
							// addLoc seems inefficient on large pl
							let query = ''
							this.addToCache.forEach((v, i) => {
								query += (i ? ' OR ' : '') + '%path% HAS ' + v.slice(-13);
							});
							const handleList = $.query(plman.GetPlaylistItems(v.alb_set ? pl.selection() : v.pn), query);
							if (handleList.Count) {
								const plId = pl.cache();
								plman.InsertPlaylistItems(pl.cache(), plman.PlaylistItemCount(plId), handleList);
							}
						}, 1500);
					}
				});
				if (this.paths.length) {
					const paths = this.paths.map(p => p.path);
					const v = this.paths[0];
					if (!v.alb_set) panel.addLoc(paths, v.pn, true, v.alb_set, v.alb_set, true);
					else panel.addLoc(paths, pl.selection(), true, v.alb_set, v.alb_set);
					this.added = false;
					this.paths = [];
				} else if (this.handles.length) {
					const hl = new FbMetadbHandleList();
					this.handles.forEach(h => hl.Add(h.handle));
					const v = this.handles[0];
						const pn = pl.selection()
						if (v.alb_set) plman.ClearPlaylistSelection(pn);
						panel.add_loc.timestamp = Date.now();
						if (!v.alb_set || v.alb_set === 2) plman.UndoBackup(pn);
						const playlistItemIndex = plman.PlaylistItemCount(v.alb_set ? pn : v.pn);
						if (v.alb_set) plman.InsertPlaylistItems(pn, playlistItemIndex, hl, v.alb_set);
						else plman.InsertPlaylistItems(v.pn, playlistItemIndex, hl, v.alb_set);
						if (v.alb_set) {
							plman.EnsurePlaylistItemVisible(pn, plman.PlaylistItemCount(pn) - 1);
							plman.SetPlaylistFocusItem(pn, playlistItemIndex);
						}
						this.added = false;
						this.handles = [];
				}
			} else {
				clearInterval(this.timer);
				this.timer = null;
				but.animation('play');
				setTimeout(() => {
					if (!done) {
						this.added = true;
						this.runAddLoc(panel.add_loc.std);
					}
				}, 5000);
			}
		}, 110);
		but.animation('play');
	}

	titles(v) {
		return {
			title: $.stripRemaster(v.title),
			playcount: v.playcount,
			length: v.length,
			vid: v.vid,
			thumbnail: v.thumbnail
		};
	}
}

class DldAlbumTracks {
	constructor() {
		this.cancelledByUser = false;
		this.done = {}
		this.rec = {}

		this.tracks_done = {
			lfm: false,
			mb: false
		}

		this.yt = {
			i: {},
			timer: {}
		}
	}

	execute(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags) {
		this.getMbReleases(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags); // always try mb for date even if source called is lfm
	}

	do_youtube_search(p_alb_id, p_artist, p_title, p_index, p_album, p_date, p_mTags, p_vid, p_length, p_thumbnail) {
		if (p_mTags && (ppt.libAlb && lib.inLibraryAlb(p_alb_id, p_artist, p_title, p_album, p_date, p_index, '', false) || ppt.libAlb == 2)) {
			return this.on_youtube_search_done(p_alb_id, '', p_artist, p_title, p_index, '', '', '', '', '', '', '', '', '', p_album, p_date, p_mTags);
		}	
		if (p_vid) {
			const bl_artist = $.tidy(p_artist);
			const url = 'fy+https://www.youtube.com/watch?' +  
			'fb2k_title=' + encodeURIComponent(p_title) + 
			'&fb2k_search_title=' + encodeURIComponent(p_title) + 
			(p_mTags ? '' : 
				'&fb2k_tracknumber=' + p_index + 
				'&fb2k_album=' + encodeURIComponent(p_album) + 
				(p_date.length ? ('&fb2k_date=' + encodeURIComponent(p_date)) : '')
			) +
			'&fb2kx_length=' + encodeURIComponent(p_length) + 
			(ppt.ytSend ? '&fb2kx_thumbnail_url=' + encodeURIComponent(p_thumbnail || `https://i.ytimg.com/vi/${p_vid}/hqdefault.jpg`) : '') + 
			'&fb2k_artist=' + encodeURIComponent(p_artist) + 
			'&v=' + p_vid;
			return this.on_youtube_search_done(p_alb_id, url, p_artist, p_title, p_index, '', '', '', p_length, p_title, p_title, '', '', '', p_album, p_date, p_mTags);
		}
		
		const yt = new YoutubeSearch(() => yt.onStateChange(), this.on_youtube_search_done.bind(this));
		yt.search(p_alb_id, p_artist, p_title, p_index, '', '', p_mTags ? '' : 'fb2k_tracknumber=' + p_index + '&fb2k_album=' + encodeURIComponent(p_album) + (p_date.length ? ('&fb2k_date=' + encodeURIComponent(p_date)) : '') , '', '', '', '', p_album, p_date, p_mTags);
	}

	getLfmTracks(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid) {
		if (this.tracks_done.lfm) {
			alb.setRow(p_alb_id, 0);
			return this.on_tracks_search_done(p_alb_id, [], p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid);
		}
		const lfm_tracks = new AlbumTracks(() => lfm_tracks.onStateChange(), this.on_tracks_search_done.bind(this));
		lfm_tracks.search(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid, 0);
		this.tracks_done.lfm = true;
	}

	getMbTracks(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid) {
		if (this.tracks_done.mb) {
			alb.setRow(p_alb_id, 0);
			return this.on_tracks_search_done(p_alb_id, [], p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid);
		}
		const mb_tracks = new AlbumTracks(() => mb_tracks.onStateChange(), this.on_tracks_search_done.bind(this));
		mb_tracks.search(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date || '', p_add, p_mTags, p_re_mbid, 1);
		this.tracks_done.mb = true;
	}

	getMbReleases(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags) {
		const mb_releases = new MusicbrainzReleases(() => mb_releases.onStateChange(), this.on_mb_releases_search_done.bind(this));
		mb_releases.search(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags);
	}

	requireConfirmation(length, artist, album) {
		this.cancelledByUser = false
		const continue_confirmation = (status, confirmed) => {
			if (confirmed) {
				if (artist + ' | ' + album == 'Artist | Album') {
					this.cancelledByUser = true;
					return;
				}
				this.cancelledByUser = false;
				return;
			}
			this.cancelledByUser = true;
		}
		const caption = artist + ' | ' + album;
		const prompt = `This Album Has A Lot of Tracks: ${length}\n\nRequires ${(ppt.libAlb ? 'up to ' : '') + length} YouTube Searches\n\nContinue?`;
		const wsh = popUpBox.isHtmlDialogSupported() ? popUpBox.confirm(caption, prompt, 'Yes', 'No', '', '', continue_confirmation) : true;
		if (wsh) continue_confirmation('ok', $.wshPopup(prompt, caption));
	}

	on_mb_releases_search_done(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid) {
		if (ppt.prefMbTracks && p_re_mbid) this.getMbTracks(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date || '', p_add, p_mTags, p_re_mbid);
		else this.getLfmTracks(p_alb_id, p_rg_mbid, p_album_artist, p_album, p_prime, p_extra, p_date || '', p_add, p_mTags, p_re_mbid);
	}

	on_tracks_search_done(p_alb_id, list, p_album_artist, p_album, p_prime, p_extra, p_date, p_add, p_mTags, p_re_mbid) {
		const trackListOnly = typeof p_alb_id == 'string';
		if (trackListOnly) {
			alb.artists.list = [];
			if (!list || !list.length) {
				alb.artists.list[0] = {
					name: p_album_artist + ' - ' + p_album + ': ' + 'Nothing Found'
				};
				alb.calcRows(true);
				return;
			}

			for (let i = 0; i < list.length; i++) {
				const v = list[i];
				if (v.artist && v.title) {
					if (ppt.libAlb == 2) {
						alb.artists.list.push({
							name: v.title,
							handleList: new FbMetadbHandleList(),
							source: 0
						});
					} else {
						let handleList = lib.inPlaylist(v.artist, v.title, i, true, false, true);
						handleList = $.query(handleList, 'album IS ' + p_album.toLowerCase());
						alb.artists.list.push({
							artist: p_album_artist,
							name: v.title,
							album: p_album,
							date: p_date,
							vid: v.vid,
							length: v.length,
							thumbnail: v.thumbnail,
							handleList: handleList,
							source: handleList.Count ? 2 : 1
						});
					}
				}
			}

			if (alb.artists.list.length) alb.artists.list.unshift({
				name: p_album_artist + ' - ' + p_album
			});
			else alb.artists.list[0] = {
				name: p_album_artist + ' - ' + p_album + ': ' + 'Nothing Found'
			};

			alb.calcRows(true);
			txt.paint();
		} else {
			if (ppt.libAlb != 2 && list.length > 20) this.requireConfirmation(list.length, list[0].artist, p_album)
			if (this.cancelledByUser) return;
			this.done[p_alb_id] = list.length;
			this.rec[p_alb_id] = 0;
			this.yt.i[p_alb_id] = 0;
			this.resetYtTimer(p_alb_id);
			if (!p_add) pl.clear(pl.selection());

			panel.add_loc.mtags[p_alb_id] = [];
			panel.add_loc.alb[p_alb_id] = [];

			this.yt.timer[p_alb_id] = setInterval(() => {
				if (this.yt.i[p_alb_id] < list.length) {
					const item = list[this.yt.i[p_alb_id]];
					this.do_youtube_search(p_alb_id, item.artist, item.title, this.yt.i[p_alb_id] + 1, item.album, item.date, item.mTags, item.vid, item.length, item.thumbnail, item.albumartist);
					this.yt.i[p_alb_id]++;
				} else this.resetYtTimer(p_alb_id);
			}, 110);
		}
	}

	on_youtube_search_done(p_alb_id, link, p_artist, p_title, p_ix, p_done, p_pn, p_alb_set, p_length, p_orig_title, p_yt_title, p_full_alb, p_fn, p_type, p_album, p_date, p_mTags) {
		// async addLocations
		this.rec[p_alb_id]++;
		if (link && link.length) {
			if (p_mTags) {
				const type_arr = ['YouTube Track', 'Prefer Library Track', 'Library Track'];
				panel.add_loc.mtags[p_alb_id].push({
					'@': link,
					'ALBUM': p_album,
					'ARTIST': p_artist,
					'DATE': p_date,
					'DURATION': p_length.toString(),
					'REPLAYGAIN_TRACK_GAIN': [],
					'REPLAYGAIN_TRACK_PEAK': [],
					'TITLE': p_title,
					'TRACKNUMBER': p_ix.toString(),
					'YOUTUBE_TITLE': p_yt_title ? p_yt_title : [],
					'SEARCH_TITLE': p_orig_title ? p_orig_title : [],
					'TRACK_TYPE': type_arr[ppt.libAlb]
				});
			} else panel.add_loc.alb[p_alb_id].push({
				'path': link,
				'id': p_ix
			});
		}
		if ((this.rec[p_alb_id] == this.done[p_alb_id] || p_done == 'force') && this.done[p_alb_id] != 'done')
			if (panel.add_loc.mtags[p_alb_id].length || panel.add_loc.alb[p_alb_id].length) {
				alb.setRow(p_alb_id, 2);
				if (p_mTags) mtags.save(p_alb_id, p_artist);
				else this.runAddLoc(p_alb_id);
				this.done[p_alb_id] = 'done';
			} else {
				alb.setRow(p_alb_id, 0, p_artist);
				if (ppt.libAlb == 2) console.log('Request Made: Load Album Using Only Library Tracks\n\nResult: No Matching Tracks Found', 'Find & Play');
			}
	}

	resetYtTimer(p_alb_id) {
		if (this.yt.timer[p_alb_id]) clearTimeout(this.yt.timer[p_alb_id]);
		this.yt.timer[p_alb_id] = null;
	}

	runAddLoc(p_alb_id) {
		const add_loc_arr = {};
		$.sort(panel.add_loc.alb[p_alb_id], 'id');
		add_loc_arr[p_alb_id] = [];
		panel.add_loc.alb[p_alb_id].forEach(v => {
			add_loc_arr[p_alb_id].push(v.path);
		});
		panel.addLoc(add_loc_arr[p_alb_id], pl.cache(), false, false, true, true);
		panel.addLoc(add_loc_arr[p_alb_id], pl.selection(), false, false, true);
	}
}

class DldAlbumNames {
	constructor(p_callback) {
		this.on_finish_callback = p_callback;
	}

	execute(p_album_artist, p_dbl_load, p_mode, p_item, p_only_mbid) {
		const mb_artist_id = new MusicbrainzArtistId(() => mb_artist_id.onStateChange(), this.on_mb_artist_id_search_done.bind(this));
		mb_artist_id.search(p_album_artist, p_dbl_load, p_mode, p_item, p_only_mbid)
	}

	on_album_names_search_done(data, ar_mbid, mode, item, lfmTopTrackSpan, lfmMixTrack, lfmMixTag) {
		this.on_finish_callback(data, ar_mbid, true, mode, item, lfmTopTrackSpan, lfmMixTrack, lfmMixTag);
	}

	on_mb_artist_id_search_done(ar_mbid, mode, item, only_mbid) {
		const mb_lfm_albums = new AlbumNames(() => mb_lfm_albums.onStateChange(), this.on_album_names_search_done.bind(this));
		if (!ar_mbid.length && ppt.mb == 1 && !ppt.mbReleaseType == 5 || only_mbid) {
			return this.on_album_names_search_done([], ar_mbid, mode); // don't send item so !ar_mbid.length && ppt.mb == 1 recognisable
		}
		mb_lfm_albums.search(ar_mbid, mode, item);
	}
}

class DldMoreAlbumNames {
	constructor(p_callback) {
		this.on_finish_callback = p_callback;
	}

	execute(ar_mbid, mode, item) {
		const mb_lfm_albums = new AlbumNames(() => mb_lfm_albums.onStateChange(), this.on_album_names_search_done.bind(this));
		if (!ar_mbid.length && ppt.mb == 1 && !ppt.mbReleaseType == 5) return this.on_album_names_search_done([], ar_mbid, mode);
		mb_lfm_albums.search(ar_mbid, mode, item);
	}

	on_album_names_search_done(data, ar_mbid, mode, item, lfmTopTrackSpan, lfmMixTrack, lfmMixTag) {
		this.on_finish_callback(data, ar_mbid, true, mode, item, lfmTopTrackSpan, lfmMixTrack, lfmMixTag);
	}
}

class Dl_art_images {
	constructor() {
		if (!ppt.dl_art_img) return;
		this.dl_ar = '';
	}

	run() {
		if (!$.file(`${panel.storageFolder}foo_lastfm_img.vbs`)) return;
		let n_artist = name.artist();
		if (n_artist == this.dl_ar || n_artist == '') return;
		this.dl_ar = n_artist;
		const img_folder = panel.cleanPth(ppt.imgArtPth);
		if (!panel.img_exp(img_folder, Thirty_Days)) return;
		const lfm_art = new Lfm_art_img(() => lfm_art.onStateChange());
		lfm_art.search(this.dl_ar, img_folder);
	}
}

class Lfm_art_img {
	constructor(state_callback) {
		this.dl_ar;
		this.func = null;
		this.img_folder;
		this.ready_callback = state_callback;
		this.timer = null;
		this.xmlhttp = null;
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) this.func();
				else $.trace('download artist images N/A: ' + this.dl_ar + ': none found' + ' Status error: ' + this.xmlhttp.status);
			}
	}

	search(p_dl_ar, p_img_folder) {
		this.dl_ar = p_dl_ar;
		this.img_folder = p_img_folder;
		if (!ui.style.textOnly || ui.style.isBlur) timer.decelerating();
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		const URL = 'https://www.last.fm/music/' + encodeURIComponent(this.dl_ar) + '/+images'; // <- edit to use custom local lastfm domain

		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		if (!this.timer) {
			const a = this.xmlhttp;
			this.timer = setTimeout(() => {
				a.abort();
				this.timer = null;
			}, 30000);
		}
		this.xmlhttp.send();
	}

	analyse() {
		const artist = $.clean(this.dl_ar);
		doc.open();
		const div = doc.createElement('div');
		div.innerHTML = this.xmlhttp.responseText;
		const list = div.getElementsByTagName('img');
		let links = [];
		if (!list) return doc.close();
		$.htmlParse(list, false, false, v => {
			const attr = v.src || '';
			if (attr.includes('avatar170s/')) links.push(attr.replace('avatar170s/', ''));
		});
		doc.close();
		const blacklist = img.blacklist(artist.toLowerCase());
		links = links.filter(v => !blacklist.includes(v.substring(v.lastIndexOf('/') + 1) + '.jpg'));
		if (links.length) {
			$.buildPth(this.img_folder);
			if ($.folder(this.img_folder)) {
				$.save(this.img_folder + 'update.txt', '', true);
				$.take(links, 5).forEach(v => $.run(`cscript //nologo "${panel.storageFolder}foo_lastfm_img.vbs" "${v}" "${this.img_folder + artist}_${v.substring(v.lastIndexOf('/') + 1)}.jpg"`, 0));
			}
		}
	}
}

class wb {
	static durations(responseText) {
		const blackListedIds = blk.blackListedIds();
		const duration = {};
		const items = $.jsonParse(responseText, [], 'get', 'items');
		const regionCode = ppt.ytRegionCode.toUpperCase();
		let isBlocked = false;
		items.forEach(v => {
			if (regionCode) {
				const allowed = $.getProp(v, 'contentDetails.regionRestriction.allowed', '');
				const isAllowedArr = $.isArray(allowed);
				isBlocked = isAllowedArr && !allowed.length || isAllowedArr && !allowed.includes(regionCode);
				if (isBlocked) {
					duration[v.id] = '';
				} else {
					const blocked = $.getProp(v, 'contentDetails.regionRestriction.blocked', []);
					isBlocked = blocked.includes(regionCode);
					if (isBlocked) {
						duration[v.id] = '';
					}
				}
			}
			if (!isBlocked) {
				isBlocked = blackListedIds.includes(`v=${v.id}`);
				if (isBlocked) {
					duration[v.id] = '';
				}
			}
			if (!isBlocked) {
				v.status.privacyStatus != 'private' ? duration[v.id] = ($.secs(v.contentDetails.duration) || '') : '';
			}
		});
		return duration;
	}

	static processLfmPlayerResponse(that, responseText, getList, artistMix) { // that = this.Arg
		if (that.page < 4) {
			let data = $.jsonParse(responseText, [], 'get', 'playlist');
			data = data.map(v => {
				const vid = ppt.lfmYouTubeLinks ? $.getProp(v, 'playlinks.0.id', '') : '';
				return {
					...!artistMix && {artist: $.getProp(v, 'artists.0.name', '')},
					title: $.stripRemaster(v.name),
					length: v.duration || '',
					vid: vid
				}
			});
			that.json_data = [...that.json_data, ...data];
			if (!that.json_data.length) return [];
		}
		if (that.page < 4 && that.json_data.length < 125 && !artistMix) {
			that.page++;
			that.search();
			return;
		} else if (that.page < 5) {
			if (!artistMix) {
				that.json_data = Object.values(that.json_data.reduce((a, c) => (a[`${c.artist}${c.title}`] = c, a), {}));
				if (getList) that.json_data = alb.getList(that.json_data, []);
				else $.take(that.json_data, 100);
			} else {
				that.json_data = Object.values(that.json_data.reduce((a, c) => (a[`${c.title}`] = c, a), {}));
				that.json_data = $.shuffle(that.json_data); // lfmPlayer artistMix is same as top 30 last 7 days, so shuffle so different
			}
			
			if (that.lfmRadio && (ppt.djMode == 2 || ppt.djMode == 3)) { // force lfmRadio library only
				that.json_data = that.json_data.filter((v, i) => {
					return lib.inLibrary(!artistMix ? v.artist : that.dj.source, v.title, i, false, true, false);
				});
				return that.json_data;
			}

			if (panel.yt) {
				that.vid = that.json_data.map(v => v.vid);
				that.page = 5;
				return that.search();
			}
		}
		
		if (panel.yt && (that.page == 5 || that.page == 6) && ppt.lfmYouTubeLinks) {
			Object.assign(that.duration, this.durations(responseText))
			if (that.page == 5 && that.vid.length > 50 && !artistMix) {
				that.page = 6;
				return that.search();
			}
			that.json_data.forEach((v, i) => {
				const length = that.duration[that.vid[i]] || '';
				v.length = length;
				if (!length) {
					v.vid = '';
					v.thumbnail = '';
				}
			});
		}
		return that.json_data;
	}

	static processLfmWebResponse(that, responseText, getOnePage, getArtist, getListeners, getChart, getAlbumTracks, getDate, getMtags, getUser) {
		if (that.pg == 1 || that.pg == 2) {
			if (!getChart) {
				doc.open();
				let div = doc.createElement('div');
				div.innerHTML = responseText;
				const data = div.getElementsByTagName('td');
				if (ppt.lfmYouTubeLinks) {
					$.htmlParse(data, 'className', 'chartlist-play', v => {
						const a = v.getElementsByTagName('a');
						let found = false;
						for (let i = 0; i < a.length; i++) {
							const attr = a[i].getAttribute('data-youtube-id');				
							if (attr) {
								found = true;
								that.vid.push((attr).trim())
							}
						}
						if (!found) that.vid.push('');
					});
				}
				$.htmlParse(data, 'className', 'chartlist-name', v => {
					const a = v.getElementsByTagName('a');
					if (a.length && a[0].innerText) that.title.push(v.innerText.trim());
				});
				if (getArtist) {
					$.htmlParse(data, 'className', 'chartlist-artist', v => {
						if (!getAlbumTracks || getAlbumTracks && that.album_artist.toLowerCase() == 'various artists') {
							const a = v.getElementsByTagName('a');
							if (a.length && a[0].innerText) {
								that.artist.push(v.innerText.trim()); // various artists albums have artist
							}
						}
						else that.artist.push(that.album_artist.replace(/’/g, "'")); // main albums don't have artist
							// alt is regex method
					});
				}

				that.cover = [...responseText.matchAll(/"cover-art">\s*<img\s+src="([^"]+)/gi)];
				that.cover = that.cover[0] ? that.cover[0][1] : '';
				if (getListeners) $.htmlParse(div.getElementsByTagName('span'), 'className', 'chartlist-count-bar-value', v => that.listeners.push(v.innerText.replace(/[,\D]/g, '')));
				doc.close();
			} else {
				const data = that.xmlhttp.responseText;
				that.title = [...data.matchAll(/data-track-name="([^"]+)/gi)];
				that.artist = [...data.matchAll(/data-artist-name="([^"]+)/gi)];
				
				that.title = that.title.map(v => that.tidy(v[1]));
				that.artist = that.artist.map(v => that.tidy(v[1]));

				if (ppt.lfmYouTubeLinks) {
					that.vid = [...data.matchAll(/data-youtube-id="([^"]+)/gi)];
					that.vid = that.vid.map(v => v[1] || '');
				}
			}
		}

		if (!that.title.length || getArtist && (!that.artist.length || that.title.length != that.artist.length)) return [];

		if (that.pg == 1) {
			that.pg++;
			if (!getOnePage) return that.search();
		}
		if (that.pg == 2) {
			that.pg++;
			if (that.vid.length && panel.yt && ppt.lfmYouTubeLinks) return that.search();
		}
		if ((that.pg == 3 || that.pg == 4) && panel.yt && ppt.lfmYouTubeLinks) {
			Object.assign(that.duration, this.durations(responseText));
			if (that.pg == 3 && that.vid.length > 50 && ppt.lfmYouTubeLinks) {
				that.pg++;
				return that.search();
			}
		}

		let data = [];
		that.title.forEach((v, i) => {
			const length = that.duration[that.vid[i]] || '';
			data.push({
				...getArtist && {artist: that.artist[i]},
				...getAlbumTracks && {album: that.album},
				...getDate && {date: that.date},
				title: !getAlbumTracks ? v : $.stripRemaster(v),
				...getListeners && {playcount: that.listeners[i]},
				length: length,
				...getMtags && {mTags: that.mTags},
				vid: length || !panel.yt ? that.vid[i] : ''
			});
		});
		if (getUser) data = Object.values(data.reduce((a, c) => (a[`${c.artist}${c.title}`] = c, a), {}));
		if (getAlbumTracks && that.cover) data[0].thumbnail = that.cover;
		return data;
	}

	static vidCheck(first, cur, vid) {
		vid = cur == first ? vid.slice(0, 50) : vid.slice(50);
		return `${panel.url.yt_api}videos?part=contentDetails,status&id=${vid + panel.yt}`;
	}
}