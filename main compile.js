'use strict';

if (typeof my_utils === 'undefined') include('utils.js');

const loadAsync = window.GetProperty('Load Find & Play Asynchronously', true);
let compile = '';

async function readFiles(files) {
	for (const file of files) {
		compile = compile += '\r\n\r\n' + utils.ReadTextFile(my_utils.getScriptPath + file);
		if (window.ID) { // fix pss issue
			await include(my_utils.getScriptPath + file);
		}
	}
}

const files = [
	'helpers.js',
	'properties.js',
	'interface.js',
	'names.js',
	'panel.js',
	'medialibrary.js',
	'text.js',
	'playlists.js',
	'library.js',
	'blacklistvideo.js',
	'web.js',
	'mtags.js',
	'scrollbar.js',
	'autodj.js',
	'albums.js',
	'search.js',
	'buttons.js',
	'images.js',
	'timers.js',
	'menu.js',
	'tagger.js',
	'popupbox.js',
	'initialise.js',
	'callbacks.js'
];

if (loadAsync) {
	readFiles(files).then(() => {
		console.log('compile', compile);
		if (!window.ID) return; // fix pss issue
		on_size();
		window.Repaint();
	});
} else {
	files.forEach(v => include(my_utils.getScriptPath + v));
}