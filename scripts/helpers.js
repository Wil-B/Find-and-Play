﻿'use strict';

const requiredVersionStr = '1.5.2';

function is_compatible(requiredVersionStr) {
	const requiredVersion = requiredVersionStr.split('.');
	const currentVersion = utils.Version.split('.');
	if (currentVersion.length > 3) currentVersion.length = 3;
	for (let i = 0; i < currentVersion.length; ++i)
		if (currentVersion[i] != requiredVersion[i]) return currentVersion[i] > requiredVersion[i];
	return true;
}
if (!is_compatible(requiredVersionStr)) fb.ShowPopupMessage(`Find & Play requires v${requiredVersionStr}. Current component version is v${utils.Version}.`);

const doc = new ActiveXObject('htmlfile');
const fso = new ActiveXObject('Scripting.FileSystemObject');
const tooltip = window.Tooltip;
const WshShell = new ActiveXObject('WScript.Shell');

class Helpers {
	constructor() {
		this.diacriticsMap = {};
		this.scale = this.getDpi();
		this.playCountInstalled = utils.CheckComponent('foo_playcount', true);

		this.createDiacriticsMap();
	}

	average(arr) {
		return arr.reduce((a, b) => a + b, 0) / arr.length;
	}
	browser(c) {
		if (!this.run(c)) fb.ShowPopupMessage('Unable to launch your default browser.', 'Find & Play');
	}

	buildPth(pth) {
		let result, tmpFileLoc = '';
		let UNC = pth.startsWith('\\\\');
		if (UNC) pth = pth.replace('\\\\', '');
		const pattern = /(.*?)\\/gm;
		while ((result = pattern.exec(pth))) {
			tmpFileLoc = tmpFileLoc.concat(result[0]);
			if (UNC) {
				tmpFileLoc = `\\\\${tmpFileLoc}`;
				UNC = false;
			}
			this.create(tmpFileLoc);
		}
	}

	clamp(num, min, max) {
		num = num <= max ? num : max;
		num = num >= min ? num : min;
		return num;
	}

	clean(n) {
		return n.replace(/[/\\|:]/g, '-').replace(/\*/g, 'x').replace(/"/g, "''").replace(/[<>]/g, '_').replace(/\?/g, '').replace(/^\./, '_').replace(/\.+$/, '').trim();
	}

	create(fo) {
		try {
			if (!this.folder(fo)) fso.CreateFolder(fo);
		} catch (e) {}
	}

	createDiacriticsMap() {
		const defaultDiacriticsRemovalMap = [{'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'}, {'base':'AA','letters':'\uA732'}, {'base':'AE','letters':'\u00C6\u01FC\u01E2'}, {'base':'AO','letters':'\uA734'}, {'base':'AU','letters':'\uA736'}, {'base':'AV','letters':'\uA738\uA73A'}, {'base':'AY','letters':'\uA73C'}, {'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'}, {'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'}, {'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779'}, {'base':'DZ','letters':'\u01F1\u01C4'}, {'base':'Dz','letters':'\u01F2\u01C5'}, {'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'}, {'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'}, {'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'}, {'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'}, {'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'}, {'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'}, {'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'}, {'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'}, {'base':'LJ','letters':'\u01C7'}, {'base':'Lj','letters':'\u01C8'}, {'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'}, {'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'}, {'base':'NJ','letters':'\u01CA'}, {'base':'Nj','letters':'\u01CB'}, {'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'}, {'base':'OI','letters':'\u01A2'}, {'base':'OO','letters':'\uA74E'}, {'base':'OU','letters':'\u0222'}, {'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'}, {'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'}, {'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'}, {'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'}, {'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'}, {'base':'TZ','letters':'\uA728'}, {'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'}, {'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'}, {'base':'VY','letters':'\uA760'}, {'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'}, {'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'}, {'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'}, {'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'}, {'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'}, {'base':'aa','letters':'\uA733'}, {'base':'ae','letters':'\u00E6\u01FD\u01E3'}, {'base':'ao','letters':'\uA735'}, {'base':'au','letters':'\uA737'}, {'base':'av','letters':'\uA739\uA73B'}, {'base':'ay','letters':'\uA73D'}, {'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'}, {'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'}, {'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'}, {'base':'dz','letters':'\u01F3\u01C6'}, {'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'}, {'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'}, {'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'}, {'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'}, {'base':'hv','letters':'\u0195'}, {'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'}, {'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'}, {'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'}, {'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'}, {'base':'lj','letters':'\u01C9'}, {'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'}, {'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'}, {'base':'nj','letters':'\u01CC'}, {'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'}, {'base':'oi','letters':'\u01A3'}, {'base':'ou','letters':'\u0223'}, {'base':'oo','letters':'\uA74F'}, {'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'}, {'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'}, {'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'}, {'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'}, {'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'}, {'base':'tz','letters':'\uA729'}, {'base':'u','letters':'\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'}, {'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'}, {'base':'vy','letters':'\uA761'}, {'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'}, {'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'}, {'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'}, {'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}]; this.s = 'f50a8f9d80158a0fa0c673faec4584be'; this.k = '8Wcq11_9Y_wliCGLHETS4Q8UqlS2JF_OAySazIA';
		defaultDiacriticsRemovalMap.forEach(v => {
			for (let i = 0; i < v.letters.length; i++) this.diacriticsMap[v.letters[i]] = v.base;
		});
	}

	debounce(e,r,i) {
		var o,u,a,c,v,f,d=0,m=!1,j=!1,n=!0;if('function'!=typeof e)throw new TypeError('debounce: invalid function');function T(i){var n=o,t=u;return o=u=void 0,d=i,c=e.apply(t,n)}function b(i){var n=i-f;return void 0===f||r<=n||n<0||j&&a<=i-d}function l(){var i,n,t=Date.now();if(b(t))return w(t);v=setTimeout(l,(n=r-((i=t)-f),j?Math.min(n,a-(i-d)):n))}function w(i){return v=void 0,n&&o?T(i):(o=u=void 0,c)}function t(){var i,n=Date.now(),t=b(n);if(o=arguments,u=this,f=n,t){if(void 0===v)return d=i=f,v=setTimeout(l,r),m?T(i):c;if(j)return v=setTimeout(l,r),T(f)}return void 0===v&&(v=setTimeout(l,r)),c}return r=parseFloat(r)||0,this.isObject(i)&&(m=!!i.leading,a=((j='maxWait'in i))?Math.max(parseFloat(i.maxWait)||0,r):a,n='trailing'in i?!!i.trailing:n),t.cancel=function(){void 0!==v&&clearTimeout(v),o=f=u=v=void(d=0)},t.flush=function(){return void 0===v?c:w(Date.now())},t;
	}

	equal(arr1, arr2) {
		let i = arr1.length;
		if (i != arr2.length) return false;
		while (i--)
			if (arr1[i] !== arr2[i]) return false;
		return true;
	}

	eval(n, focus) {
		if (!n) return '';
		const tfo = FbTitleFormat(n);
		if (panel.isRadio()) return tfo.Eval();
		if (focus === undefined) focus = ppt.focus;
		const handle = $.handle(focus);
		return handle ? tfo.EvalWithMetadb(handle) : '';
	}

	file(f) {
		return fso.FileExists(f);
	}

	folder(fo) {
		return fso.FolderExists(fo);
	}

	getClipboardData() {
		try {
			return utils.GetClipboardText();
		} catch(e) {
			try {
				return doc.parentWindow.clipboardData.getData('Text');
			} catch (e) {
				return null;
			}
		}
	}

	getDpi() {
		let dpi = 120;
		try {
			dpi = WshShell.RegRead('HKCU\\Control Panel\\Desktop\\WindowMetrics\\AppliedDPI');
		} catch (e) {}
		return Math.max(dpi / 120, 1);
	}

	getProp(n, keys, defaultVal) {
		keys = $.isArray(keys) ? keys : keys.split('.');
		n = n[keys[0]];
		if (n && keys.length > 1) {
			return this.getProp(n, keys.slice(1), defaultVal);
		}
		return n === undefined ? defaultVal : n;
	}

	gr(w, h, im, func) {
		let i = gdi.CreateImage(Math.max(w, 2), Math.max(h, 2));
		let g = i.GetGraphics();
		func(g, i);
		i.ReleaseGraphics(g);
		g = null;
		if (im) return i;
		else i = null;
	}

	handle(focus) {
		return fb.IsPlaying && (!focus || panel.video.mode || alb.art.search) ? fb.GetNowPlaying() : fb.GetFocusItem();
	}

	htmlParse(n, prop, match, func) {
		const ln = n == null ? 0 : n.length;
		const sw = prop ? 0 : 1;
		let i = 0;
		switch (sw) {
			case 0:
				while (i < ln) {
					if (n[i][prop] == match)
						if (func(n[i]) === true) break;
					i++;
				}
				break;
			case 1:
				while (i < ln) {
					if (func(n[i]) === true) break;
					i++;
				}
				break;
		}
	}

	isArray(arr) {
		return Array.isArray(arr);
	}

	isObject(t) {
		const e = typeof t;
		return null != t && ('object' == e || 'function' == e);
	}

	jsonParse(n, defaultVal, type, keys) {
		switch (type) {
			case 'file':
				try {
					return JSON.parse(this.open(n));
				} catch (e) {
					return defaultVal;
				}
				case 'get': {
					let data;
					try {
						data = JSON.parse(n);
					} catch (e) {
						return defaultVal;
					}
					if (keys) return this.getProp(data, keys, defaultVal);
					return data;
				}
				default:
					try {
						return JSON.parse(n);
					} catch (e) {
						return defaultVal;
					}
		}
	}

	lastModified(file) {
		try {
			return Date.parse(fso.GetFile(file).DateLastModified);
		} catch (e) {}
	}

	objHasOwnProperty(obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}

	open(f) {
		return this.file(f) ? utils.ReadTextFile(f) : '';
	}

	padNumber(num, len, base) {
		if (!base) base = 10;
		return ('000000' + num.toString(base)).substr(-len);
	}

	query(h, q) {
		let l = new FbMetadbHandleList();
		try {
			l = fb.GetQueryItems(h, q);
		} catch (e) {}
		return l;
	}

	queryArtist(artist) {
		let names = [artist, artist.replace(/^(The\s|A\s)/i, ''), artist.replace(/^(The\s|A\s)/i, '').replace(/\sand\s/i, ' & '), artist.replace(/^(The\s|A\s)/i, '').replace(/\s&\s/i, ' and ')];
		let query = '';
		[...new Set(names)].forEach((v, i) => query += (i ? ' OR ' : '') + name.field.artist + ' HAS ' + v);
		return query;
	}

	regexEscape(n) {
		return n.replace(/([*+\-?^!:&"~${}()|[\]/\\])/g, '\\$1');
	}

	removeDiacritics(str) {
		return str.replace(/[^\u0000-\u007E]/g, n => $.diacriticsMap[n] || n);
	}

	removeNulls(o) {
		const isArray = $.isArray(o);
		Object.keys(o).forEach(v => {
			if (o[v].length == 0) isArray ? o.splice(v, 1) : delete o[v];
			else if (typeof o[v] == 'object') this.removeNulls(o[v]);
		});
	}

	RGBAtoRGB(c, bg) {
		c = this.toRGBA(c);
		bg = this.toRGB(bg);
		const r = c[0] / 255;
		const g = c[1] / 255;
		const b = c[2] / 255;
		const a = c[3] / 255;
		const bgr = bg[0] / 255;
		const bgg = bg[1] / 255;
		const bgb = bg[2] / 255;
		let nR = ((1 - a) * bgr) + (a * r);
		let nG = ((1 - a) * bgg) + (a * g);
		let nB = ((1 - a) * bgb) + (a * b);
		nR = this.clamp(Math.round(nR * 255), 0, 255);
		nG = this.clamp(Math.round(nG * 255), 0, 255);
		nB = this.clamp(Math.round(nB * 255), 0, 255);
		return RGB(nR, nG, nB);
	}

	run(c, w) {
		try {
			w === undefined ? WshShell.Run(c) : WshShell.Run(c, w);
			return true;
		} catch (e) {
			return false;
		}
	}

	save(fn, text, bom) {
		try {
			utils.WriteTextFile(fn, text, bom)
		} catch (e) {
			this.trace('Error saving: ' + fn);
		}
	}

	setClipboardData(n) {
		try {
			utils.SetClipboardText(n);
		} catch(e) {
			try {
				doc.parentWindow.clipboardData.setData('Text', n);
			} catch(e) {
				this.trace('unable to set clipboard text');
			}
		}
	}

	shuffle(arr) {
		for (let i = arr.length - 1; i >= 0; i--) {
			const randomIndex = Math.floor(Math.random() * (i + 1));
			const itemAtIndex = arr[randomIndex];
			arr[randomIndex] = arr[i];
			arr[i] = itemAtIndex;
		}
		return arr;
	}

	sort(data, prop, type) {
		switch (type) {
			case 'rev':
				data.sort((a, b) => a[prop] < b[prop] ? 1 : a[prop] > b[prop] ? -1 : 0);
				return data;
			case 'num':
				data.sort((a, b) => parseFloat(a[prop]) - parseFloat(b[prop]));
				return data;
			case 'numRev':
				data.sort((a, b) => parseFloat(b[prop]) - parseFloat(a[prop]));
				return data;
			default:
				data.sort((a, b) => a[prop] < b[prop] ? -1 : a[prop] > b[prop] ? 1 : 0);
				return data;
		}
	}

	sortKeys(o) {
		return Object.keys(o).sort().reduce((a, c) => (a[c] = o[c], a), {});
	}

	split(n, type) {
		switch (type) {
			case 0:
				return n.replace(/\s+|^,+|,+$/g, '').split(',');
			case 1:
				return n.replace(/^[,\s]+|[,\s]+$/g, '').split(',');
		}
	}

	strip(n) {
		return n.replace(/[.\u2026,!?:;'\u2019"\-_\u2010\s+]/g, '').toLowerCase();
	}

	stripRemaster(n) {
		const nm = n.toLowerCase();
		if (!nm.includes('remaster') && !nm.includes('re-master') && !nm.includes('re-recorded') && !nm.includes('rerecorded')) return n;
		const new_name = n.replace(/((19|20)\d\d(\s|\s-\s)|)(digital(ly|)\s|)(\d\d-bit\s|)(re(-|)master|re(-|)recorded).*/gi, '').replace(/\s[\W_]+$/g, '').replace(/[\s([-]+$/g, '');
		return new_name.length ? new_name : n;
	}

	take(arr, ln) {
		if (ln >= arr.length) return arr;
		else arr.length = ln > 0 ? ln : 0;
		return arr;
	}

	tfEscape(n) {
		let str = n.replace(/'/g, "''").replace(/[()[\],%]/g, "'$&'");
		if (str.indexOf('$') != -1) {
			const strSplit = str.split('$');
			str = strSplit.join("'$$'");
		}
		return str;
	}

	tidy(n) {
		return n.replace(/[.,!?:;'â€™"\-_]/g, '').toLowerCase();
	}

	titlecase(n) {
		return n.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-/]*/g, match => {
			if (match.substr(1).search(/[A-Z]|\../) > -1) return match;
			return match.charAt(0).toUpperCase() + match.substr(1);
		});
	}

	throttle(e,i,t) {
		var n=!0,r=!0;if('function'!=typeof e)throw new TypeError('throttle: invalid function');return this.isObject(t)&&(n='leading'in t?!!txt.leading:n,r='trailing'in t?!!txt.trailing:r),this.debounce(e,i,{leading:n,maxWait:i,trailing:r})
	}

	toRGB(c) {
		return [c >> 16 & 0xff, c >> 8 & 0xff, c & 0xff];
	}

	toRGBA(c) {
		return [c >> 16 & 0xff, c >> 8 & 0xff, c & 0xff, c >> 24 & 0xff];
	}

	trace(message) {
		console.log('Find & Play' + ': ' + message);
	}

	updateProp(prop, value) {
		Object.entries(prop).forEach(v => {
			ppt[v[0].replace('_internal', '')] = v[1][value]
		});

		ppt.lock = false;

		timer.clear(timer.vid);
		timer.clear(timer.img);
		
		const showLogo = panel.showLogo;

		ui = new UserInterface;
		name = new Names;
		tf = new Titleformat;
		panel = new Panel;
		ml = new MediaLibrary;
		txt = new Text;
		pl = new Playlists;
		alb_scrollbar = new Scrollbar;
		art_scrollbar = new Scrollbar;
		fav.init();
		index = new NewAutoDJ;
		dj = new AutoDJ;
		alb = new Albums;
		filter = new Search;
		search = new Search;
		but = new Buttons;
		lib = new Library;

		img = new Images;
		seeker = new Seeker;
		dl_art = new Dl_art_images;
		alb_scrollbar.type = 'alb';
		art_scrollbar.type = 'art';
		filter.type = 'filter';
		search.type = 'search';
		art = new ImageCache(true);
		cov = new ImageCache(false);
		
		panel.showLogo = showLogo;

		if (!ui.style.textOnly) {
			if (!ppt.showAlb) panel.setVideo();
		} else if ($.eval('%video_popup_status%') == 'visible') fb.RunMainMenuCommand('View/Visualizations/Video');
		if (ppt.btn_mode) {
			panel.image.show == false;
			panel.video.show = false;
		}

		if (ppt.mtagsInstalled) {
			lib.getArtistTracks(name.artist());
		}

		lib.getAlbumMetadb();

		txt.rp = false;
		panel.w = window.Width;
		panel.h = window.Height;
		if (!panel.w || !panel.h) return;
		panel.on_size();
		ui.getFont();
		but.refresh(true);
		img.on_size();
		dj.on_size();
		txt.rp = true;

		if (panel.pss) {
			panel.force_refresh = 2;
			panel.refreshPSS();
		}

		if (typeof sv !== 'undefined') panel.youTube.backUp = true;
		window.Repaint();
	}

	value(num, def, type) {
		num = parseFloat(num);
		if (isNaN(num)) return def;
		switch (type) {
			case 0:
				return num;
			case 1:
				if (num !== 1 && num !== 0) return def;
				break;
			case 2:
				if (num > 2 || num < 0) return def;
				break;
		}
		return num;
	}

	wshPopup(prompt, caption) {
		try {
			const ns = WshShell.Popup(prompt, 0, caption, 1);
			if (ns == 1) return true;
			return false;
		} catch (e) {
			return true;
		}
	}
}

const $ = new Helpers;

const One_Day = 86400000;
const One_Week = 604800000;
const TwentyEight_Days = 2419200000;
const Thirty_Days = 2592000000;

window.DlgCode = 0x004;


function RGB(r, g, b) {
	return 0xff000000 | r << 16 | g << 8 | b;
}

function RGBA(r, g, b, a) {
	return a << 24 | r << 16 | g << 8 | b;
}

function StringFormat() {
	const a = arguments;
	const flags = 0;
	let h_align = 0;
	let v_align = 0;
	let trimming = 0;
	switch (a.length) {
		case 3:
			trimming = a[2]; /*fall through*/
		case 2:
			v_align = a[1]; /*fall through*/
		case 1:
			h_align = a[0];
			break;
		default:
			return 0;
	}
	return (h_align << 28 | v_align << 24 | trimming << 20 | flags);
}

function Bezier(){const i=4,c=.001,o=1e-7,v=10,l=11,s=1/(l-1),n=typeof Float32Array==='function';function e(r,n){return 1-3*n+3*r}function u(r,n){return 3*n-6*r}function a(r){return 3*r}function w(r,n,t){return((e(n,t)*r+u(n,t))*r+a(n))*r}function y(r,n,t){return 3*e(n,t)*r*r+2*u(n,t)*r+a(n)}function h(r,n,t,e,u){let a,f,i=0;do{f=n+(t-n)/2;a=w(f,e,u)-r;if(a>0){t=f}else{n=f}}while(Math.abs(a)>o&&++i<v);return f}function A(r,n,t,e){for(let u=0;u<i;++u){const a=y(n,t,e);if(a===0){return n}const f=w(n,t,e)-r;n-=f/a}return n}function f(r){return r}function bezier(i,t,o,e){if(!(0<=i&&i<=1&&0<=o&&o<=1)){throw new Error('Bezier x values must be in [0, 1] range')}if(i===t&&o===e){return f}const v=n?new Float32Array(l):new Array(l);for(let r=0;r<l;++r){v[r]=w(r*s,i,o)}function u(r){const e=l-1;let n=0,t=1;for(;t!==e&&v[t]<=r;++t){n+=s}--t;const u=(r-v[t])/(v[t+1]-v[t]),a=n+u*s,f=y(a,i,o);if(f>=c){return A(r,a,i,o)}else if(f===0){return a}else{return h(r,n,n+s,i,o)}}return function r(n){if(n===0){return 0}if(n===1){return 1}return w(u(n),t,e)}} this.scroll = bezier(0.25, 0.1, 0.25, 1); this.full = this.scroll; this.step = this.scroll; this.bar = bezier(0.165,0.84,0.44,1); this.barFast = bezier(0.19, 1, 0.22, 1); this.inertia = bezier(0.23, 1, 0.32, 1);}
const ease = new Bezier;