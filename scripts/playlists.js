'use strict';

class Playlists {
	constructor() {
		this.enabled = [];
		this.menu = [];
		this.saveName = '';

		this.playlists_changed();

		this.saveDjTracks = $.debounce((playlistIndex) => {
			this.saveAutoDjTracks(playlistIndex);
		}, 1500);
	}

	// Methods

	cache() {
		return plman.FindOrCreatePlaylist(ppt.playlistCache, false);
	}

	clear(playlistIndex) {
		plman.UndoBackup(playlistIndex);
		plman.ClearPlaylist(playlistIndex);
	}

	dj() {
		return plman.FindOrCreatePlaylist(ppt.playlistDj, false);
	}
	
	getCache() {
		return plman.FindPlaylist(ppt.playlistCache);
	}

	getDJ() {
		return plman.FindPlaylist(ppt.playlistDj);
	}

	getSoft() { 
		return plman.FindPlaylist(ppt.playlistGenerator);
	}

	love() {
		const loved = this.loved();
		const np = plman.GetPlayingItemLocation();
		let pid, pn;
		if (fb.IsPlaying && np.IsValid) {
			pid = np.PlaylistItemIndex;
			pn = plman.PlayingPlaylist;
		} else {
			pid = plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist);
			pn = plman.ActivePlaylist;
		}
		plman.ClearPlaylistSelection(pn);
		plman.SetPlaylistSelectionSingle(pn, pid, true);
		if (loved != pn) {
			plman.UndoBackup(loved);
			plman.InsertPlaylistItems(loved, plman.PlaylistItemCount(loved), plman.GetPlaylistSelectedItems(pn), false);
		} else {
			plman.UndoBackup(loved);
			plman.RemovePlaylistSelection(loved, false);
		}
	}

	loved() {
		return plman.FindOrCreatePlaylist(ppt.playlistLoved, false);
	}

	playlists_changed() {
		this.setShortCutPl();
		this.menu = [];
		for (let i = 0; i < plman.PlaylistCount; i++) this.menu.push({
			name: plman.GetPlaylistName(i).replace(/&/g, '&&'),
			ix: i
		});
	}

	saveAutoDjTracks(playlistIndex) {
		const savePl = ppt.playTracks ? ppt.albSavePlaylists : ppt.djSaveTracks;
		if (playlistIndex != this.dj() || !savePl) return;

		switch (true) {
			case ppt.playTracks:
				if ((!ppt.mb && ppt.lfmReleaseType != 4 || ppt.mb == 1 && ppt.mbReleaseType == 5 || ppt.mb == 2) && !search.text) return;
				break;
			case !ppt.playTracks:
				if (!index.cur_dj_source) return;
				this.saveName = ppt.playlistDj + ' ' + ppt.playlistTracks + ': ' + index.cur_dj_source + (index.cur_dj_type == 2 ? ' and Similar Artists' : '');
				break;
		}

		let djTracks = [];
		const save_pl_index = plman.FindOrCreatePlaylist(this.saveName, false);
		const existingTracks = plman.GetPlaylistItems(save_pl_index);
		
		for (let i = 0; i < existingTracks.Count; i++) {
			const v = existingTracks[i];
			djTracks.push({id: v.Path + v.SubSong, handle: v});
		}

		const newTracks = plman.GetPlaylistItems(playlistIndex);
		for (let i = 0; i < newTracks.Count; i++) {
			const v = newTracks[i];
			djTracks.push({id: v.Path + v.SubSong, handle: v});
		}

		djTracks = Object.values(djTracks.reduce((a, c) => (a[`${c.id}`] = c, a), {}));
		if (!djTracks.length)  return;
		
		const items = new FbMetadbHandleList();
		plman.UndoBackup(save_pl_index);
		for (let i = 0; i < djTracks.length; i++) {
			items.Add(djTracks[i].handle)
		}
		plman.ClearPlaylist(save_pl_index);
		plman.InsertPlaylistItems(save_pl_index, 0, items);
	}

	selection() {
		return plman.FindOrCreatePlaylist(ppt.playlistSelection, false);
	}

	soft() {
		return plman.FindOrCreatePlaylist(ppt.playlistGenerator, false);
	}

	setShortCutPl() {
		const names = ['selection', 'dj', 'soft', 'loved'];
		this.enabled = [];
		['playlistSelection', 'playlistDj', 'playlistGenerator', 'playlistLoved'].forEach(v => {
			const ix = plman.FindPlaylist(ppt[v]);
			if (ix != -1) this.enabled.push({
				name: ppt[v],
				ix: ix
			});
		});
	}
}