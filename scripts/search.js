﻿'use strict';

class Search {
	constructor() {
		this.active = false;
		this.edit = false;
		this.end = 0;
		this.font = gdi.Font('Segoe UI', 16, 0);
		this.lg = [];
		this.ctrl = false;
		this.cursor = false;
		this.cx = 0;
		this.lbtnDn = false;
		this.log = [];
		this.offset = 0;
		this.paste = false;
		this.text = '';
		this.shift = false;
		this.shift_x = 0;
		this.start = 0;
		this.x = 200;
		this.y = ppt.bor * 0.625 + 8;
		this.w1 = 75;
		this.w2 = 75;
		this.w3 = 75;
		this.h = 16;

		this.bg = {
			x: this.x,
			y: this.y - 1,
			w: this.w1,
			arc: 6
		}

		this.lfm_rel = {
			w: []
		}

		this.mb_rel = {
			w: []
		}

		this.timer = null;
	}

	// Methods

	clear() {
		switch (this.type) {
			case 'filter':
				but.setSearchBtnsHide();
				if (!this.text) return;
				this.offset = this.start = this.end = this.cx = 0;
				this.text = '';
				if (!ppt.mb) alb.sortLfm();
				alb.setNames([alb.names.lfm[alb.lfmType(ppt.lfmReleaseType)], alb.names.mb[ppt.mbReleaseType], alb.names.chart, alb.names.lfm[alb.lfmType(ppt.lfmReleaseType)]][ppt.mb]);
				if (!ppt.mb && (ppt.lfmReleaseType < 2 || ppt.lfmReleaseType == 3 && alb.lfmTagType == 5)) alb.names.list.forEach(v => v.playcount = alb.numFormat(v.playcount));
				break;
			case 'search':
				if (ppt.mb == 2) return;
				alb.lastItemId = '';
				if (this.text) {
					alb.art.search = false;
					this.offset = this.start = this.end = this.cx = 0;
					this.active = true;
					this.cursorTimer(true);
					this.text = '';
				} else {
					this.text = this.setText();
					alb.clearAlbums()
					alb.on_playback_new_track();
				}
				break;
		}
		but.setSearchBtnsHide()
		this.repaint();
	}

	drawFilter(gr) {
		if (panel.halt() || !ppt.searchShow || but.noShow) return;
		this.start = $.clamp(this.start, 0, this.text.length);
		this.end = $.clamp(this.end, 0, this.text.length);
		this.cx = $.clamp(this.cx, 0, this.text.length);
		gr.SetSmoothingMode(2);
		gr.DrawRoundRect(this.bg.x, this.bg.y, this.bg.w, this.h + 1, this.bg.arc, this.bg.arc, ui.style.l_w, ui.col.bg4);

		if (this.text) {
			this.drawsel(gr);
			this.getOffset(gr);
			gr.GdiDrawText(this.text.substr(this.offset), this.font, ui.col.blend, this.x, this.y, this.w1, this.h, txt.ls);
		} else gr.GdiDrawText('Search list', ui.font.filterBI, ui.col.text, this.x, this.y, this.w1, this.h, txt.ls);

		this.drawcursor(gr);
	}

	drawSearch(gr) {
		if (panel.halt()) return;
		this.text = this.text || '';
		this.start = $.clamp(this.start, 0, this.text.length);
		this.end = $.clamp(this.end, 0, this.text.length);
		this.cx = $.clamp(this.cx, 0, this.text.length);
		let font_y = Math.round(this.y);
		gr.GdiDrawText(this.releaseType(), this.font, ui.col.head, this.x, font_y, this.w1, alb.row.h, txt.ls);

		this.drawsel(gr);
		this.getOffset(gr);
		gr.GdiDrawText(this.text.substr(this.offset), this.font, ui.col.head, this.x + this.releaseWidth(), font_y, this.w1 - this.releaseWidth(), alb.row.h, ppt.mb == 2 ? txt.l : txt.ls);
		this.drawcursor(gr);
		gr.DrawLine(this.x, alb.names.line.y, this.x + this.w3, alb.names.line.y, ui.style.l_w, ui.col.lineAlb);
	}

	drawcursor(gr) {
		if (ppt.mb == 2 && this.type == 'search') return;
		if (this.active && this.cursor && this.start == this.end && this.cx >= this.offset) {
			const lx = Math.round(this.x) + this.releaseWidth() + this.get_cursor_x(this.cx);
			gr.DrawLine(lx, this.y, lx, this.y + this.h - 1, ui.style.l_w, ui.col.text);
		}
	}

	drawsel(gr) {
		if (this.start == this.end) return;
		const clamp = this.x + this.releaseWidth() + (this.w1 - this.releaseWidth());
		gr.DrawLine(Math.min(this.x + this.releaseWidth() + this.get_cursor_x(this.start), clamp), this.y + this.h / 2, Math.min(this.x + this.releaseWidth() + this.get_cursor_x(this.end), clamp), this.y + this.h / 2, this.h - 1, ui.col.searchSel);
	}

	get_cursor_x(pos) {
		let x = 0;
		$.gr(1, 1, false, g => {
			if (pos >= this.offset) x = g.CalcTextWidth(this.text.substr(this.offset, pos - this.offset), this.font, true);
		});
		return x;
	}

	getCursorChrPos(x) {
		const nx = x - this.x - this.releaseWidth();
		let i = this.offset;
		let pos = 0;
		$.gr(1, 1, false, g => {
			for (i = this.offset; i < this.text.length; i++) {
				pos += g.CalcTextWidth(this.text.substr(i, 1), this.font, true);
				if (pos >= nx + 3) break;
			}
		});
		return i;
	}

	getOffset(gr) {
		let j = 0;
		let tx = gr.CalcTextWidth(this.text.substr(this.offset, this.cx - this.offset), this.font, true);
		while (tx >= this.w1 - this.releaseWidth() && j < 500) {
			j++;
			this.offset++;
			tx = gr.CalcTextWidth(this.text.substr(this.offset, this.cx - this.offset), this.font, true);
		}
	}

	lbtn_dblclk(x, y) {
		if (y > this.y && y < this.y + this.h && x > this.x && x < this.x + this.w1 && this.text) {
			this.cursor = false;
			this.start = 0;
			this.end = this.text.length;
			this.repaint();
		}
	}

	lbtn_dn(x, y) {
		if (!ppt.showAlb || panel.halt() || ppt.mb == 2 && this.type == 'search' || !ppt.mb && ppt.lfmReleaseType > 3 && this.type == 'search') return;
		this.repaint();
		this.active = this.lbtnDn = (y > this.y && y < this.y + this.h && x >= this.bg.x && x < this.bg.x + this.bg.w);
		if (ppt.touchControl) ui.touch_dn_id = alb.get_ix(x, y);
		if (y > this.y + this.h) return;
		if (!this.lbtnDn) {
			this.offset = this.start = this.end = this.cx = 0;
			this.clearTimer(this.timer);
			return;
		} else if (x >= this.bg.x && x < this.x + this.bg.w) {
			if (this.shift) {
				this.start = this.cx;
				this.end = this.cx = this.getCursorChrPos(x);
			} else {
				this.cx = this.getCursorChrPos(x);
				this.start = this.end = this.cx;
			}
			this.cursorTimer(true);
		}
		this.repaint();
	}

	lbtn_up() {
		if (this.start != this.end) this.clearTimer(this.timer);
		this.lbtnDn = false;
	}

	move(x, y) {
		if (y > this.y && y < this.y + this.h && x >= this.bg.x && x < this.x + this.bg.w && this.lbtnDn) {
			const n_x = this.x + this.releaseWidth();
			const n_w = this.w1 - this.releaseWidth();
			const cursorChrPos = this.getCursorChrPos(x);
			const c_x = this.get_cursor_x(cursorChrPos);
			if (cursorChrPos < this.start) {
				if (cursorChrPos < this.end) {
					if (c_x < n_x)
						if (this.offset > 0) this.offset--;
				} else if (cursorChrPos > this.end) {
					if (c_x + n_x > n_x + n_w) {
						let l = this.w2 > n_w ? this.w2 - n_w : 0;
						if (l > 0) this.offset++;
					}
				}
				this.end = cursorChrPos;
			} else if (cursorChrPos > this.start) {
				if (c_x + n_x > n_x + n_w) {
					let l = this.w2 > n_w ? this.w2 - n_w : 0;
					if (l > 0) this.offset++;
				}
				this.end = cursorChrPos;
			}
			this.cx = cursorChrPos;
			this.repaint();
		}
	}

	on_char(code, force) {
		if (!ppt.showAlb || panel.halt() || ppt.mb == 2 && this.type == 'search' || but.noShow && this.type == 'filter') return;
		if (force) this.active = true;
		if (this.active) {
			let input = String.fromCharCode(code);
			this.cursor = true;
			switch (code) {
				case vk.enter:
					this.active = false;
					this.offset = this.start = this.end = this.cx = 0;
					break;
				case vk.redo:
					this.lg.push(this.text);
					if (this.lg.length > 30) this.lg.shift();
					if (this.log.length > 0) this.text = this.log.pop() + '';
					break;
				case vk.undo:
					this.log.push(this.text);
					if (this.log.length > 30) this.lg.shift();
					if (this.lg.length > 0) this.text = this.lg.pop() + '';
					break;
				case vk.selAll:
					this.start = 0;
					this.end = this.text.length;
					break;
				case vk.copy:
					if (this.start != this.end) $.setClipboardData(this.text.substring(this.start, this.end))
					break;
				case vk.cut:
					if (this.start != this.end) $.setClipboardData(this.text.substring(this.start, this.end)); // fall through
				case vk.back:
					this.record();
					if (this.start == this.end) {
						if (this.cx > 0) {
							this.text = this.text.substr(0, this.cx - 1) + this.text.substr(this.cx, this.text.length - this.cx);
							if (this.offset > 0) this.offset--;
							this.cx--;
						}
					} else {
						if (this.end - this.start == this.text.length) {
							this.text = '';
							this.cx = 0;
						} else {
							if (this.start > 0) {
								const st = this.start;
								const en = this.end;
								this.start = Math.min(st, en);
								this.end = Math.max(st, en);
								this.text = this.text.substring(0, this.start) + this.text.substring(this.end, this.text.length);
								this.cx = this.start;
							} else {
								this.text = this.text.substring(this.end, this.text.length);
								this.cx = this.start;
							}
						}
					}
					this.offset = this.offset >= this.end - this.start ? this.offset - this.end + this.start : 0;
					this.start = this.cx;
					this.end = this.start;
					break;
				case vk.ctrlBackspace:
					this.record();
					if (this.start != this.end) this.cx = this.end = this.start;
					if (this.cx > 0) {
						const initial = this.text.length;
						const leftSide = this.text.slice(0, this.cx).trimEnd();
						let boundary = 0;
						for (let k = 0; k < leftSide.length; k++) {
							if (this.text[k] == ' ' && this.text[k + 1] != ' ') boundary = k + 1;
						}
						this.text = leftSide.slice(0, boundary) + this.text.slice(this.cx).trimStart()
						this.cx = boundary;
						
						if (this.offset > 0) {
							this.offset -= initial - this.text.length;
						}
					}
					this.offset = this.offset >= this.end - this.start ? this.offset - this.end + this.start : 0;
					this.start = this.cx;
					this.end = this.start;
					break;
				case 'delete':
					this.record();
					if (this.start == this.end) {
						if (this.cx < this.text.length) {
							this.text = this.text.substr(0, this.cx) + this.text.substr(this.cx + 1, this.text.length - this.cx - 1);
						}
					} else {
						if (this.end - this.start == this.text.length) {
							this.text = '';
							this.cx = 0;
						} else {
							if (this.start > 0) {
								const st = this.start;
								const en = this.end;
								this.start = Math.min(st, en);
								this.end = Math.max(st, en);
								this.text = this.text.substring(0, this.start) + this.text.substring(this.end, this.text.length);
								this.cx = this.start;
							} else {
								this.text = this.text.substring(this.end, this.text.length);
								this.cx = this.start;
							}
						}
					}
					this.offset = this.offset >= this.end - this.start ? this.offset - this.end + this.start : 0;
					this.start = this.cx;
					this.end = this.start;
					break;
				case vk.paste:
					input = $.getClipboardData() || '';
					input = input.replace(/(\r\n|\n|\r)/gm, ' '); // fall through
				default:
					if (!input) break;
					this.record();
					if (this.start == this.end) {
						this.text = this.text.substring(0, this.cx) + input + this.text.substring(this.cx);
						this.cx += input.length;
						this.end = this.start = this.cx;
					} else if (this.end > this.start) {
						this.text = this.text.substring(0, this.start) + input + this.text.substring(this.end);
						this.offset = this.offset >= this.end - this.start ? this.offset - this.end + this.start : 0;
						this.cx = this.start + input.length;
						this.end = this.start = this.cx;
					} else {
						this.text = this.text.substring(0, this.end) + input + this.text.substring(this.start);
						this.offset = this.offset < this.end - this.start ? this.offset - this.end + this.start : 0;
						this.cx = this.end + input.length;
						this.end = this.start = this.cx;
					}
					break;
			}
			if (this.type == 'search') {
				if (ppt.mb == 3) ppt.lfmUserName = this.text;
				alb.chooseArtist(this.text);
			} else {
				but.setSearchBtnsHide();
				alb.setFilter(this.text);
			}
			if (!this.timer) this.cursorTimer();
			this.repaint();
		}
	}

	on_key_down(vkey) {
		if (!ppt.showAlb || panel.halt() || ppt.mb == 2 && this.type == 'search') return;
		switch (vkey) {
			case vk.shift:
				this.shift = true;
				this.shift_x = this.cx;
				break;
			case vk.ctrl:	
				this.ctrl = true;
				break;
			case vk.left:
			case vk.right:
				if (!this.active) break;
				if (vkey == vk.left) {
					if (!this.ctrl) {
						if (this.offset > 0) {
							if (this.cx <= this.offset) {
								this.offset--;
								this.cx--;
							} else this.cx--;
						} else if (this.cx > 0) this.cx--;
					} else {
						let boundary = 0;
						for (let k = this.cx - 1; k > 0; k--) {
							if (this.text[k] != ' ' && this.text[k - 1] == ' ') {
								boundary = k;
								break;
							}
						}
						if (this.offset > 0) {
							this.offset -= (this.cx - boundary);
						}
						this.cx = boundary;
						this.offset = this.offset >= this.end - this.start ? this.offset - this.end + this.start : 0;
					}
				}
				if (vkey == vk.right && this.cx < this.text.length) {
					if (!this.ctrl) this.cx++;
					else {
						let boundary = this.text.length;
						for (let k = this.cx; k < this.text.length; k++) {
							if (this.text[k] == ' ' && this.text[k + 1] != ' ') {
								boundary = k + 1;
								break;
							}
						}
						this.cx = boundary;
					}
				}
				this.start = this.end = this.cx;
				if (this.shift) {
					this.start = Math.min(this.cx, this.shift_x);
					this.end = Math.max(this.cx, this.shift_x);
				}
				this.cursor = true;
				this.cursorTimer(true);
				break;
			case vk.home:
			case vk.end:
				if (this.active) {
					if (vkey == vk.home) this.offset = this.start = this.end = this.cx = 0;
					else this.start = this.end = this.cx = this.text.length;
					if (this.shift) {
						this.start = Math.min(this.cx, this.shift_x);
						this.end = Math.max(this.cx, this.shift_x);
					}
					this.cursor = true;
					this.cursorTimer(true);
				} else if (alb.scrollbarType()) {
					vkey == vk.home ? alb.scrollbarType().checkScroll(0, 'full') : alb.scrollbarType().scrollToEnd();
				}
				break;
			case vk.del:
				if (this.ctrl && !this.shift && this.start == this.end) {
					this.record();
					const initial = this.text.length;
					const leftSide = this.text.slice(0, this.cx);
					const rightSide = this.text.slice(this.cx, this.text.length).trimStart();
					const idx = rightSide.search(/ \b/);
					const boundary = idx == -1 ? rightSide.length : idx + 1;
					let newRightSide = rightSide.slice(boundary);
					if (newRightSide.length && !/\s$/.test(leftSide) && !/^\s/.test(newRightSide)) newRightSide = ' ' + newRightSide;
					this.text = leftSide + newRightSide;
					this.cx = !/\s$/.test(leftSide) ? leftSide.length + 1 : leftSide.length;
					if (this.offset > 0) {
						this.offset -= initial - this.text.length;
					}
					this.offset = this.offset >= this.end - this.start ? this.offset - this.end + this.start : 0;
					this.start = this.end = this.cx;
				} else this.on_char('delete');
				break;
		}
		this.repaint();
		return true;
	}

	on_focus(p_is_focused) {
		if (!p_is_focused) {
			this.clearTimer(this.timer);
			this.cursor = false;
			this.repaint();
		}
	}

	on_key_up(vkey) {
		if (!ppt.showAlb || panel.halt()) return;
		if (vkey == vk.ctrl) {
			this.ctrl = false;
		}
		if (vkey == vk.shift) {
			this.shift = false;
			this.shift_x = this.cx;
		}
	}

	metrics() {
		switch (this.type) {
			case 'filter': {
				const paddingRight = [but.b.x - but.b.w1 * 8.23 - but.tagOffset - but.userOffset, but.b.x - but.b.w1 * 9.77 - but.lbOffset, but.b.x - but.b.w1 * 6.06][ppt.mb];
				this.font = ui.font.filterB;
				this.x = paddingRight - but.b.w1 * 2.75 + but.b.w1 * 0.1;
				this.y = but.b.y2;
				this.w1 = but.b.w1 * 2 - but.b.w1 * 0.3;
				this.w2 = this.w1;
				this.h = but.b.h1;

				this.bg.x = paddingRight - but.b.w1 * 2.75 - but.b.w1 * 0.1;
				this.bg.y = this.y - 1;
				this.bg.w = but.b.w1 * 2.5;
				this.bg.arc = 6 * but.scale;
				break;
			}
			case 'search':
				this.font = ui.font.main;
				this.x = alb.x;
				this.w2 = alb.w;
				this.h = alb.row.h;
				this.w3 = this.w2 - [
					alb.statistics.show(ppt.lfmReleaseType) ? alb.names.item.w.lfm + (ppt.showSource ? alb.names.item.w.pos : 0) : alb.names.item.w.chart, 
					ppt.mbReleaseType != 5 ? 0 : alb.statistics.show(6) ? alb.names.item.w.lfm + (ppt.showSource ? alb.names.item.w.pos : 0) : alb.names.item.w.chart, 
					alb.names.item.w.chart][ppt.mb];
				this.bg.x = this.x;
				this.bg.w = this.w2;
				break;
		}
	}

	rbtn_up(x, y) {
		this.paste = $.getClipboardData() ? true : false;
		this.type == 'search' ? searchMenu.load(x, y) : filterMenu.load(x, y);
	}

	record() {
		this.lg.push(this.text);
		this.log = [];
		if (this.lg.length > 30) this.lg.shift();
	}

	releaseType() {
		return [alb.type.lfm[ppt.lfmReleaseType] + (ppt.lfmReleaseType != 4 ? ':' : ''), alb.type.mb[ppt.mbReleaseType] + (ppt.mbReleaseType != 5 ? ':' : ''), 'Singles Chart', 'User Name'][ppt.mb];
	}

	releaseWidth() {
		return this.type == 'filter' ? 0 : [this.lfm_rel.w[ppt.lfmReleaseType], this.mb_rel.w[ppt.mbReleaseType], this.chart_rel_w, this.user_rel_w][ppt.mb] + alb.names.item.w.sp;
	}

	repaint() {
		if (!ppt.showAlb || panel.halt() || ppt.mb == 2 && this.type == 'search') return;
		if (txt.rp) window.RepaintRect(this.x, Math.floor(this.y), this.type == 'filter' ? this.w1 : this.w2, this.h + 1);
	}

	setText(ns) {
		this.text = ns ? ns : alb.searchText();
		if (!ns) {
			this.active = false;
			this.offset = this.start = this.end = this.cx = 0;
		}
		this.repaint();
	}

	clearTimer(timer) {
		if (timer) clearTimeout(timer);
		timer = null;
	}

	cursorTimer(clear) {
		if (clear) this.clearTimer(this.timer);
		if (!this.cursor) this.cursor = true;
		this.timer = setInterval(() => {
			this.cursor = !this.cursor;
			this.repaint();
		}, 530);
	}
}