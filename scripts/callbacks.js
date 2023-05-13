'use strict';

function on_char(code) {
	filter.on_char(code);
	search.on_char(code);
}

function on_colours_changed() {
	ui.getColours();
	alb_scrollbar.setCol();
	art_scrollbar.setCol();
	if (ui.style.isBlur) panel.image.show = true;
	alb.calcText();
	but.createImages();
	but.refresh();
	alb_scrollbar.resetAuto();
	art_scrollbar.resetAuto();
	img.createImages();
	img.on_size();
	txt.paint();
}

function on_focus(is_focused) {
	filter.on_focus(is_focused);
	search.on_focus(is_focused);
}

function on_font_changed() {
	alb.deactivateTooltip();
	ui.getFont();
	alb_scrollbar.resetAuto();
	art_scrollbar.resetAuto();
	txt.paint();
}

function on_get_album_art_done(handle, art_id, image, image_path) {
	img.on_get_album_art_done(handle, art_id, image, image_path);
}

function on_key_down(vkey) {
	alb.on_key_down(vkey);
	filter.on_key_down(vkey);
	search.on_key_down(vkey);
	if (!ui.style.textOnly || ui.style.isBlur) img.on_key_down(vkey)
}

function on_key_up(vkey) {
	filter.on_key_up(vkey);
	search.on_key_up(vkey);
}

function on_item_focus_change() {
	if (!panel.block() && !ppt.showAlb && !ui.style.isBlur) txt.repaint();
	if (!ui.style.textOnly || ui.style.isBlur) {
		if (panel.block()) {
			img.get = true;
			img.artistReset();
		} else if (!fb.IsPlaying) img.get = false;
	}
	if (!ppt.showAlb) {
		if (!ui.style.isBlur) txt.repaint();
		alb.get = true;
	}
	if (!ui.style.textOnly || ui.style.isBlur) img.focusLoad();
	alb.focusServer();
	if (!ui.style.textOnly || ui.style.isBlur) img.focusServer();
}

function on_library_items_added(handleList) {
	lib.update.artists = true; 
	lib.update.library = true;
	if (alb.v2_init) {
		alb.v2_init = false;
		if (ppt.mtagsInstalled) {
			lib.getArtistTracks(name.artist());
		}
		lib.getAlbumMetadb();
		ml.execute();
		alb.get = true;
		alb.getAlbumsFallback();
		return;
	}
	handleList.Convert().some(h => {
		if (h.Path.endsWith('!!.tags')) {
			lib.getAlbumMetadb(true);
			return true;
		}
	});
}

function on_library_items_changed() {
	if ((ppt.sortType > 1) && (fb.PlaybackTime > 59 && fb.PlaybackTime < 65)) return;
	if (fb.IsPlaying) {
		const handle = fb.GetNowPlaying();
		if (handle && handle.Path.slice(-7) == '!!.tags') return; /*!!.tags use mtags_mng due to m-TAGS/YouTube popup triggers*/
	}
	lib.update.artists = true;
	lib.update.library = true;
}

function on_library_items_removed() {
	lib.update.artists = true;
	lib.update.library = true;
}

function on_load_image_done(id, image, image_path) {
	img.on_load_image_done(image, image_path);
}

function on_metadb_changed() {
	if (panel.isRadio()) return;
	if (!panel.block() && !ppt.showAlb && !ui.style.isBlur) txt.repaint();
	if (!ui.style.textOnly || ui.style.isBlur) {
		img.focusLoad();
		img.focusServer();
	}
	alb.metadbServer(true); 
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	if (panel.displayLogo()) return;
	but.lbtn_dn(x, y);
	filter.lbtn_dblclk(x, y);
	search.lbtn_dblclk(x, y);
	if (alb.scrollbarType()) alb.scrollbarType().lbtn_dblclk(x, y);
	if (!ppt.dblClickToggle) return;
	if (ppt.touchControl) panel.id.last_pressed_coord = {
		x: x,
		y: y
	};
	if (utils.IsKeyPressed(0x12)) mask = 'remove';
	panel.click(x, y, mask);
}

function on_mouse_lbtn_down(x, y) {
	if (panel.displayLogo()) return;
	if (ppt.touchControl) panel.id.last_pressed_coord = {
		x: x,
		y: y
	};
	if (!ui.style.textOnly) {
		seeker.lbtn_dn(x, y);
		img.lbtn_dn(x);
	}
	but.lbtn_dn(x, y);
	filter.lbtn_dn(x, y);
	search.lbtn_dn(x, y);
	if (alb.scrollbarType()) alb.scrollbarType().lbtn_dn(x, y);
}

function on_mouse_lbtn_up(x, y, mask) {
	if (panel.showLogo) {
		panel.showLogo = false;
		window.Repaint();
		return;
	}
	if (panel.displayLogo()) return;
	if (!ui.style.textOnly && img.touch.dn) {
		img.touch.dn = false;
		img.touch.start = x;
	}
	alb_scrollbar.lbtn_drag_up();
	art_scrollbar.lbtn_drag_up();
	if (utils.IsKeyPressed(0x12)) mask = 'remove';
	if (!ppt.dblClickToggle && !but.Dn && !seeker.dn) panel.click(x, y, mask);
	but.lbtn_up(x, y);
	filter.lbtn_up();
	search.lbtn_up();
	alb_scrollbar.lbtn_up();
	art_scrollbar.lbtn_up();
	panel.clicked = false;
	if (seeker.dn) {
		img.paint();
		seeker.dn = false;
	}
	seeker.down = false;
}

function on_mouse_leave() {
	but.leave();
	alb.leave();
	alb_scrollbar.leave();
	art_scrollbar.leave();
	if (!ui.style.textOnly) img.leave();
}

function on_mouse_mbtn_down(x, y) {
	if (panel.displayLogo() || but.btns['play'].trace(x, y)) return;
	alb.mbtn_dn(x, y);
}

function on_mouse_mbtn_up(x, y, mask) {
	// hacks at default settings blocks on_mouse_mbtn_up, at least in windows; workaround configure hacks: main window > move with > caption only & ensure pseudo-caption doesn't overlap buttons
	if (panel.showLogo) {
		ppt.showLogo = false;
		window.Repaint();
		return;
	}
	if (panel.displayLogo()) return;
	if (but.btns['play'].trace(x, y)) {
		alb.mbtn_up(x, y);
	}
	alb.move(x, y);
	alb.load(x, y, mask, true);
	dj.mbtn_up(x, y);
}

function on_mouse_move(x, y) {
	if (panel.displayLogo()) return;
	if (panel.m.x == x && panel.m.y == y) return;
	panel.m.x = x;
	panel.m.y = y;
	but.move(x, y);
	alb.move(x, y);
	filter.move(x, y);
	search.move(x, y);
	if (!ui.style.textOnly) {
		seeker.move(x, y);
		img.move(x, y);
	}
	if (!alb.scrollbarType()) return;
	if (panel.sbar.show == 1) {
		alb_scrollbar.move(x, y);
		art_scrollbar.move(x, y);
	} else alb.scrollbarType().move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	if (panel.displayLogo()) return;
	if (search.edit) search.rbtn_up(x, y);
	else if (filter.edit) filter.rbtn_up(x, y);
	else men.rbtn_up(x, y);
	return true;
}

function on_mouse_wheel(step) {
	if (panel.displayLogo()) return;
	switch (utils.IsKeyPressed(0x11)) {
		case false:
			if (panel.halt()) break;
			if (!ppt.showAlb && panel.image.show || ppt.showAlb && ppt.imgBg && !ppt.btn_mode && panel.m.y < search.y && !but.trace) img.wheel(step);
			if (!ppt.showAlb && panel.image.show || !alb.scrollbarType()) break;
			alb.scrollbarType().wheel(step, false);
			break;
		case true:
			but.wheel(step);
			ui.wheel(step);
			break;
	}
}

function on_notify_data(name, info) {
	if (info == 'bio_blacklist') {
		img.blackList.artist = '';
		img.chkArtImg();
	} else switch (name) {
		case 'fp_autoDj':
		case 'fp_playTracks':
			ppt.autoRad = false;
			ppt.playTracks = false;
			break;
		case 'fp_notProcessor': {
			const recTimestamp = info;
			if (recTimestamp >= panel.notifyTimestamp) {
				$.processor = false;
			}
			break;
		}
		case 'fp_scriptUnload':
			$.processor = true;
			panel.notifyTimestamp = Date.now();
			window.NotifyOthers('fp_notProcessor', panel.notifyTimestamp);
			break;
		case 'newThemeColours':
			if (!ppt.themed) break;
			ppt.theme = info.theme;
			ppt.themeBgImage = info.themeBgImage;
			ppt.themeColour = info.themeColour;
			on_colours_changed();
			break;
		case 'Sync col': {
			if (!ppt.themed) break;
			const themeLight = ppt.themeLight;
			if (themeLight != info.themeLight) {
				ppt.themeLight = info.themeLight;		
				on_colours_changed();
			}
			break;
		}
		case'Sync image':
			if (!ppt.themed) break;
			sync.image(new GdiBitmap(info.image), info.id);
			break;
		case 'biographyTags':
			if (!ppt.integrateBio) break;
			panel.processBioTags(JSON.parse(JSON.stringify(info).replace(/Last\.fm/g, 'Lastfm')));
			break;
	}
}

function on_paint(gr) {
	ui.draw(gr);
	if (panel.displayLogo()) {
		panel.draw(gr);
		return;
	}
	if (!ui.style.textOnly || ui.style.isBlur) {
		img.draw(gr);
		seeker.draw(gr);
	}
	if (!ppt.showAlb) dj.draw(gr);
	else {
		search.drawSearch(gr);
		filter.drawFilter(gr);
		alb.draw(gr);
	}
	but.draw(gr);
	tag.draw(gr);
}

function on_playlists_changed() {
	pl.playlists_changed();
}

function on_playback_dynamic_info_track() {
	if (!ppt.lock) alb.orig_artist = alb.artist = name.artist();
	timer.clear(timer.dl);
	if (panel.image.show) img.on_playback_dynamic_track();
	if (ppt.dl_art_img) dl_art.run();
	alb.on_playback_new_track();
}

function on_playback_new_track() {
	ml.execute();
	if (ml.upd_yt_mtags || ml.upd_lib_mtags) mtags.check();
	if (!ppt.lock) alb.orig_artist = alb.artist = name.artist();
	if (fb.PlaybackLength > 0) timer.clear(timer.dl);
	if (!ui.style.textOnly || ui.style.isBlur) img.on_playback_new_track();
	if (ppt.dl_art_img && fb.PlaybackLength > 0) dl_art.run();
	dj.removePlayed();
	dj.on_playback_new_track();
	alb.on_playback_new_track();
	if (panel.youTube.backUp) sv.track(panel.isYtVideo(true) ? true : false);
}

function on_playback_stop(reason) {
	if (reason == 2) return;
	on_item_focus_change();
}

function on_playback_time(pbt) {
	ml.on_playback_time();
	if (!(pbt % 25)) timer.dj();
}

function on_playlist_items_added(pn) {
	if (pn == pl.getDJ()) {
		yt_dj.added = true;
		if (!yt_dj.timer) yt_dj.runAddLoc(panel.add_loc.std);
		dj.setDjSelection(pn);
		pl.saveDjTracks(pn);
	}
	if (pn == pl.selection()) yt_dj.added = true;
	if (pn == pl.cache()) lib.getAlbumMetadb();
	else on_item_focus_change();
}

function on_playlist_items_removed(pn) {
	if (pn == pl.cache()) lib.getAlbumMetadb();
	else on_item_focus_change();
}

function on_playlist_switch() {
	on_item_focus_change();
}

function on_script_unload() {
	if ($.processor) {
		window.NotifyOthers('fp_scriptUnload', 0);
	}
}

const windowMetricsPath = `${fb.ProfilePath}settings\\themed\\windowMetrics.json`;
function on_size() {
	txt.rp = false;
	panel.w = window.Width;
	panel.h = window.Height;
	if (!panel.w || !panel.h) return;
	const scrollBars = [alb_scrollbar, art_scrollbar];
	const scrollPos = scrollBars.map(v => v.scroll);
	panel.on_size();
	ui.getParams();
	if (ppt.themed && ppt.theme) {
		const themed_image = `${fb.ProfilePath}settings\\themed\\themed_image.bmp`;	
		if ($.file(themed_image)) sync.image(gdi.Image(themed_image));
	}
	tooltip.SetMaxWidth(Math.max(panel.w, 800));
	but.refresh(true);
	filter.metrics();
	search.metrics();
	if (!ui.style.textOnly || ui.style.isBlur) img.on_size();
	dj.on_size();
	scrollBars.forEach((v, i) => v.setScroll(scrollPos[i]));
	txt.rp = true;
	
	if (!ppt.themed) return;
	const windowMetrics = $.jsonParse(windowMetricsPath, {}, 'file');
	windowMetrics[window.Name] = {
		w: panel.w,
		h: panel.h
	}
	$.save(windowMetricsPath, JSON.stringify(windowMetrics, null, 3), true);
}