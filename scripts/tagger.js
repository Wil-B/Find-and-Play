'use strict';

class Tagger {
	constructor() {
		this.done = '(0% done)';
		this.prog = 0;
		this.timer = null;

		this.score = { // excel generated values for full precision
			pc1: {
				baseLog: 1 / Math.log(2.65914794847249),
				scale: 1414.21356237312,
				threshold: 3179.11682664211
			},
			lis1: {
				baseLog: 1 / Math.log(2.23606797749979),
				scale: 799.999999999999,
				threshold: 1024
			},
			pc2: {
				baseLog: 1 / Math.log(2.75),
				scale: 1156.04248241531,
				threshold: 3179.11682664211
			},
			lis2: {
				baseLog: 1 / Math.log(2.5),
				scale: 409.6,
				threshold: 1024
			}
		}
	}

	cancel() {
		clearInterval(this.timer);
		this.timer = null;
		this.done = '(0% done)';
		this.repaint();
	}
	
	draw(gr) {
		if (!this.timer) return;
		const offset = ui.font.playCount.Size * 1.75 + 6 * $.scale;
		gr.FillSolidRect(0, panel.h - offset, panel.w, offset, ui.col.bg);
		gr.FillSolidRect(0, panel.h - 6 * $.scale, this.prog / 100 * panel.w, 5 * $.scale, ui.col.text_h);
		gr.GdiDrawText(` Tagger: ${this.done}`, ui.font.playCount, ui.col.text, 0, panel.h - offset, panel.w, ui.font.playCount.Size * 1.75);
	}

	playlistItems(list) {
		const continue_confirmation = (status, confirmed) => {
			if (confirmed && ppt.v) {
				this.tagFiles(list);
			}
		}
		const caption = 'Tag Files with Last.fm Track Statistics';
		const prompt = ppt.v ? `Update ${list.Count} ${list.Count > 1 ? 'tracks' : 'track'}.\n\nObtains top 1000 tracks per artist and tags matching tracks.\n\nWrites last.fm playcount, listeners & a combined score (1-100) as a multi-value tag.\n\nTag name: '${ppt.lfmTrackStatsTagName}' (change in panel properties 'Tagger...').\n\nRuns at 1 artist every 3 seconds to allow time for downloading & processing.\n\nContinue?` :
							`Update ${list.Count} ${list.Count > 1 ? 'tracks' : 'track'}.\n\nObtains top 1000 tracks per artist and tags matching tracks.\n\nWrites last.fm playcount, listeners & a combined score (1-100) as a multi-value tag.\n\nTHIS FEATURE REQUIRES YOUR OWN LAST.FM API KEY. PLEASE PASTE IN MAINTENANCE TAB AND TRY AGAIN.`
		const wsh = popUpBox.confirm(caption, prompt, 'OK', 'Cancel', continue_confirmation);
		if (wsh) continue_confirmation('ok', $.wshPopup(prompt, caption));
	}

	repaint() {
		window.RepaintRect(0, panel.h - ui.font.playCount.Size * 1.75 - 6 * $.scale, panel.w, panel.h - ui.font.playCount.Size * 1.75 - 6 * $.scale);
	}

	tagFiles(list) {
		list.OrderByFormat(tf.artist0, 1);
		const artists = [...new Set(tf.artist0.EvalWithMetadbs(list))];
		let j = 0;
		this.done = '(0% done)';
		this.prog = 0;
		this.timer = setInterval(() => {
			if (j < artists.length) {
				const handles = $.query(list, 'artist IS ' + artists[j]);
				const tagStatistics = new LastfmTrackStatistics(() => tagStatistics.onStateChange());
				tagStatistics.search(artists[j], handles);
				j++;
				this.prog = $.clamp(Math.round(j / artists.length * 100), 0 , 100);
				this.done = `(${this.prog}% done)`;
				this.repaint();
			} else {
				this.cancel();
			}
		}, 3000);
	}
}

class LastfmTrackStatistics {
	constructor(state_callback) {
		this.artist;
		this.data = [];
		this.func = null;
		this.handles = new FbMetadbHandleList();
		this.initial = true;
		this.lmt = 0;
		this.ready_callback = state_callback;
		this.retry = false;
		this.timer = null;
		this.xmlhttp = null;
	}

	onStateChange() {
		if (this.xmlhttp != null && this.func != null)
			if (this.xmlhttp.readyState == 4) {
				clearTimeout(this.timer);
				this.timer = null;
				if (this.xmlhttp.status == 200) {
					this.func();
				} else {
					$.trace('last.fm ' + 'top tracks N/A: ' + this.xmlhttp.responseText || 'Status error: ' + this.xmlhttp.status);
				}
			}
	}

	search(p_artist, p_handles) {
		if (this.initial) {
			this.artist = p_artist;
			this.handles = p_handles;
		}
		this.initial = false;
		this.func = null;
		this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		// workarounds applied as required to deal with occasional last.fm bug - list too short (doesn't start at beginning)
		let URL = panel.url.lfm;
		this.lmt = 980 + Math.floor(Math.random() * 5);
		if (this.retry) this.lmt += 5 + Math.floor(Math.random() * 10);
		URL += '&method=artist.getTopTracks&artist=' + encodeURIComponent(this.artist) + '&limit=' + this.lmt + '&autocorrect=1';

		this.func = this.analyse;
		this.xmlhttp.open('GET', URL);
		this.xmlhttp.onreadystatechange = this.ready_callback;
		this.xmlhttp.setRequestHeader('User-Agent', 'foobar2000_yttm (https://hydrogenaud.io/index.php/topic,111059.0.html)');
		if (this.retry) this.xmlhttp.setRequestHeader('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT');
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
		this.data = [];
			let list, tagList = [];
			let tracks;
					list = $.jsonParse(this.xmlhttp.responseText, [], 'get', 'toptracks.track');
					if (!this.retry && (list.length < this.lmt)) {
						this.retry = true;
						return this.search();
					}
					if (!list.length) return;
					tracks = v => ({
						title: v.name,
						playcount: v.playcount,
						listeners: v.listeners
					});
					tagList = list.map(tracks);
					this.write(this.artist, tagList, this.handles);
	}
	
	getScore(pc, lis) {
		const pcType = pc > 500000 ? 'pc1' : 'pc2';
		const lisType = lis > 100000 ? 'lis1' : 'lis2';
		const score = [pcType, lisType].map((v, i) => {
			const n = !i ? pc : lis;
			return n >= tag.score[v].threshold ? (Math.log(n / tag.score[v].scale) * tag.score[v].baseLog) * 10 : (n * 0.9 / tag.score[v].threshold + 0.1) * 10;
		});
		const pcScore = $.clamp(Math.floor(score[0]), 1, 105);
		const lisScore =  $.clamp(Math.floor(score[1]), 1, 105);
		return pcScore > 98 && pcScore < 105 ? 100 : $.clamp(Math.floor((pcScore + lisScore) / 2), 1, 100);
	}
	
	strip(n) {
		const stripped = n.replace(/[.\u2026,!?:;'\u2019"\-_\u2010\u007E/()[\]{}\s+]/g, '').toLowerCase();
		return stripped ? stripped : n;
	}

	write(artist, data, handles) {
		if (!artist || !data || !handles) return;
		const trackStatistics = [];
		const cue = [];
		const rem = [];
		const tags = [];
		const tf_cue = FbTitleFormat('$ext(%path%)');
		const cues = tf_cue.EvalWithMetadbs(handles);
		const titles = tf.title0.EvalWithMetadbs(handles);

		for (let i = 0; i < handles.Count; i++) {
			trackStatistics[i] = '';
			cue[i] = cues[i].toLowerCase() == 'cue';
			const title = this.strip(titles[i]);
			data.some(v => {
				if (title == this.strip(v.title)) {
					const pcNum = parseInt(v.playcount);
					const lisNum = parseInt(v.listeners);
					if (pcNum && lisNum) {
						trackStatistics[i] = ['Playcount', pcNum.toLocaleString(), 'Listeners', lisNum.toLocaleString(), 'Score', this.getScore(pcNum, lisNum)];
						return true;
					}
				}
			});
		}

		for (let i = 0; i < handles.Count; i++) {
			if (!cue[i] && trackStatistics[i]) {
				const tg = {};
				if (trackStatistics[i]) tg[ppt.lfmTrackStatsTagName] = trackStatistics[i];
				tags.push(tg);
			} else rem.push(i);
		}
		let i = rem.length;
		while (i--) handles.RemoveById(rem[i]);
		if (handles.Count) handles.UpdateFileInfoFromJSON(JSON.stringify(tags));
	}
}