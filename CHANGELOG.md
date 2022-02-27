# v1.0.1

### Release highlight
Track popularity tagger

### Changed
- now uses package-data folder for storage (find-&-play-cache etc). Anything wanted from previous yttm location* can be moved in, as the folder & file structure are the same.
* data is in lastfm folder which can be moved

### Added
- ability to send thumbails and details with video so always immediately available
- track popularity tagger (see below)

### Fix
- Wine stabilisation: biography should no longer give errors in Wine, but some limitations remain:
    - copy & paste into search box using clipboard may not work.
    - options dialog may not load: menu now indicates there was a problem & console explains what to do instead

### Popularity tagger
- context menu > playlists
- writes last.fm playcount (scrobbles), listeners & a combined score (1-100) as a multi-value tag
- scores rank the long-term popularity of tracks on a 1-100 scale using total scrobbles and listeners. The highest scoring track at last.fm is set to a score of 100.

- access tag values as e.g:
```
$meta(Track Statistics Last.fm,1[playcount])
$meta(Track Statistics Last.fm,3[listeners])
$meta(Track Statistics Last.fm,5[score])
```

- something like "$meta(Track Statistics Last.fm,5[score])" GREATER 69 can be used to filter for better tracks.

- possible library tree view (note that this view requires that artist and album statistics are similary tagged [use biography]).

```View by score: $nodisplay{$sub(9999,$meta(Artist Statistics Last.fm,5[score]))}[$meta(Artist Statistics Last.fm,5[score]) - ]%artist%|$nodisplay{$sub(9999,$meta(Album Statistics Last.fm,5[score]))}[$meta(Album Statistics Last.fm,5[score]) - ]$if2(%album%,εXtra)|$nodisplay{$sub(9999,$meta(Track Statistics Last.fm,5[score]))}[$meta(Track Statistics Last.fm,5[score]) - ]%title%```
