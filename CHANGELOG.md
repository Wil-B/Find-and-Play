# v1.0.1

### Added
- Track popularity tagger (see below)
- Option to directly send thumbnails and details with video so not reliant on foo_youtube (search tab)

### Changed
- Now uses package-data folder for storage (find-&-play-cache etc). Anything wanted from previous yttm location* can be moved in, as the folder & file structure are the same.
     * data is in lastfm folder which can be moved

### Fix
- Wine stabilisation: Find & Play should no longer give errors in Wine, but some limitations remain:
    - Copy & paste into search box using clipboard may not work.
    - Options dialog may not load: menu now indicates there was a problem & console explains what to do instead

### Track popularity tagger
- Context menu > playlists
- Writes last.fm playcount (scrobbles), listeners & a combined score (1-100) as a multi-value tag
- Scores rank the long-term popularity of tracks on a 1-100 scale using total scrobbles and listeners. The highest scoring track at last.fm is set to a score of 100.

- Access tag values as e.g:
```
$meta(Track Statistics Last.fm,1[playcount])
$meta(Track Statistics Last.fm,3[listeners])
$meta(Track Statistics Last.fm,5[score])
```

- Something like "$meta(Track Statistics Last.fm,5[score])" GREATER 69 can be used to filter for better tracks.

- Possible library tree view (note that this view requires that artist and album statistics are similary tagged [use biography]).

```View by score: $nodisplay{$sub(9999,$meta(Artist Statistics Last.fm,5[score]))}[$meta(Artist Statistics Last.fm,5[score]) - ]%artist%|$nodisplay{$sub(9999,$meta(Album Statistics Last.fm,5[score]))}[$meta(Album Statistics Last.fm,5[score]) - ]$if2(%album%,εXtra)|$nodisplay{$sub(9999,$meta(Track Statistics Last.fm,5[score]))}[$meta(Track Statistics Last.fm,5[score]) - ]%title%```
