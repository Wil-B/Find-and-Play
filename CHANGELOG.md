# v1.3.0

### Changed
#### Album & tracks pane
As flagged in features early February:
- Improved last.fm choices through new drop down menu selectors, all playable from media library else YouTube
	- Recommendations: standard, mix, neighbours, radio
	- User library: scrobble history over various time periods
	- User loved
	- Artist: top tracks / last.fm mixes (aka stations): last 7 days, last 30 days, last 90 days, last 180 days, last 365 days, all time
	- Tags: top tracks / last.fm mixes (aka stations): similar artists, similar songs, genres (includes styles & subgenres), moods, themes, decades, years, locales
- Reworked buttons
	- :arrow_forward: Play at click of button
		- on the fly options for playback order, track ranges etc (middle click button)
		- changed the shuffle method to use the smart shuffle method as used by autoDj, so same artists should be spread
	- :arrows_counterclockwise: Refresh to load new recommendations, mixes or sync last.fm charts in real time
- Source icons: choice now includes font based icons in text colour (options > display tab)
- Moved play button action to main drop down menu
- Reworked playlist handling to load max reasonable and preserve original track order
- Made it easy to show album art as background
	- Album covers
	- Artist photos
	- Enable on display submenu
	- Configurable opacity
	- Short cuts
		- click top of pane to switch between cover & photo (can be set to double click: options > behaviour tab)
		- mouse wheel over same area to scroll through artist photos
#### Auto DJ
Added last.fm radio as an alternative to inbuilt

#### Search
- Improved matching of items in library through better asymmetric searching
- Improved search suggestions for similar songs if there are no playback statistics

#### m-TAGS
- save folder path can now be set in panel properties ```m-TAGS Save Folder...```

### Added

#### Last.fm youtube links
- Bypass searching of youtube
- Easier to load large playlists, for tracks not in library.
Or just play library tracks...

#### Automatic retrieval of virtual tags from [biography](https://github.com/Wil-B/Biography) (requires biography 1.4.0+ installed)
- boosts menu choices related to the current track: genres (including sub-genres & styles), moods, themes, locales
- doesn't alter music files

### Fixed
- Add Locations to cache playlist becoming inefficient as cache size increases

<br />

# v1.2.1
### Changed
- Minor update that improves compatibility with foobar2000 v2.0
- Node styles used for albums reworked for improved look on foobar2000 v2.0. The previous style, now called light, can be set on the display tab\album node style

<br />

# v1.2.0
### Changed
- [Readme](https://github.com/Wil-B/Find-and-Play/blob/main/README.md) rewritten with new screenshots to more fully reflect capabilities
- Standard matching now ignores diacritics, e.g. a = á
- Tagger now respects partial match setting

### Added
- Library playlist generator
    - Easily create awesome playlists by songs, artists, genres, moods, themes, decades, locale or queries
- AutoDJ & library playlist generator
	- search suggestions
	- inbuilt support for 1,000+ genres, 350 moods & 250 themes + choose your own
	- smart mix feature for library playlist generator
	- browse & search dialog that offers full search options with autocomplete + 'try another' if no matches
		- this is an html dialog that is supported on standard Windows installations. If you're using WINE or something else that isn't fully compliant with Spider Monkey panel features, browse & search dialog may not be available. Instead the flyout menus have an alternative 'More...' option for searching

### Fixed
- Album & tracks pane with library source incorrectly allowing calls to YouTube
- Occasional issues with the options dialog not opening due to the feature checker wrongly reporting Spider Monkey Panel Show HTML Dialog as unsupported. In such cases there is now a confirm to guard against false negatives. Additionally, there is a manual setting in the first panel property
- Index is out of bounds error
- Charts sometimes not loading due to timeout being too short
- Search text was difficult to read with certain theme and colour combinations

<br />

# v1.1.1

### Added
- Checks to test if ShowHtmlDialog is supported, with fallback to an alternative where possible (thx to regor)
- Menu configure that opens Spider Monkey Panel configuration (right click + shift)

<br />

# v1.1.0

### Added
- Track popularity tagger (see below)
- New random colour dark theme
- Option to directly send thumbnails and details with video so not reliant on foo_youtube (search tab)

### Changed
- Now uses package-data folder for storage (find-&-play-cache etc). Anything wanted from previous location can be moved in, as the folder & file structure are the same.
     * data is in lastfm folder which can be moved

### Fix
- Wine stabilisation: Find & Play should no longer give errors in Wine, but some limitations remain:
    - copy & paste into search box may not work. It can be fixed by installing [this version of Spider Monkey Panel (v1.6.2-dev+7c0928bf)](https://github.com/Wil-B/Find-and-Play/files/8575143/foo_spider_monkey_panel.zip) which includes marc2k3's utils.GetClipboardText/utils.SetClipboardText (thx to marc2k3)
    - options dialog may not load: menu now indicates there was a problem & console explains what to do instead
- Miscellaneous fixes

### Track popularity tagger
- Context menu > playlists
- Writes last.fm playcount (scrobbles), listeners & a combined score (1-100) as a multi-value tag
- Scores rank the long-term popularity of tracks on a 1-100 scale using total scrobbles and listeners. The highest scoring track at last.fm is set to a score of 100

- Access tag values as e.g:
```
$meta(Track Statistics Last.fm,1[playcount])
$meta(Track Statistics Last.fm,3[listeners])
$meta(Track Statistics Last.fm,5[score])
```
#### Possible library tree filters:
- 5* tracks (last.fm score) `"$meta(Track Statistics Last.fm,5[score])" GREATER 69`
- 5/4* tracks (last.fm score) `"$meta(Track Statistics Last.fm,5[score])" GREATER 59`
- 5/4/3* tracks (last.fm score) `"$meta(Track Statistics Last.fm,5[score])" GREATER 49`

#### Possible library tree view (note that this view requires that artist and album statistics are similary tagged [use biography])

```View by score: $nodisplay{$sub(9999,$meta(Artist Statistics Last.fm,5[score]))}[$meta(Artist Statistics Last.fm,5[score]) - ]%artist%|$nodisplay{$sub(9999,$meta(Album Statistics Last.fm,5[score]))}[$meta(Album Statistics Last.fm,5[score]) - ]$if2(%album%,εXtra)|$nodisplay{$sub(9999,$meta(Track Statistics Last.fm,5[score]))}[$meta(Track Statistics Last.fm,5[score]) - ]%title%```
