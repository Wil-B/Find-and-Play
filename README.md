# Find and Play

Feature rich plug-in for [foobar2000](https://www.foobar2000.org) that works great with youtube and your own media library.
- Media library and YouTube track manager
- Intelligent playlist generator
- AutoDJ
- Popularity tagger

### Screenshots
![Album and tracks pane](https://user-images.githubusercontent.com/35600752/188287763-b8172327-0660-4ab5-b05d-20040787b6c9.png)

Start-up logos + various modes of albums & tracks view in several themes. Middle bottom (artist photo) is using dark theme with blur settings of auto-fill enabled, level 0 & opacity 30.

## FEATURES

### Album & tracks view
Great for discovering new tracks and albums. Supports YouTube (optional > drop down menu)
#### Display & play:
- **Last.fm:** top tracks, top albums and similar songs
- **MusicBrainz:** full album & track discographies
- **Charts:** top 100 (current and historic back to 1952)
- All items can be played either from the media library else YouTube:
     - click items to play or use the context menu
     - click > to expand albums and show tracks (bottom middle of screenshot)
     - click the **+**  in album & tracks pane for multiple items
     - click a similar artist, play a different artist or type an artist name in the search bar to load a new list

### Library playlist generator and autoDJ (context menu)
Easily create awesome playlists. Either by songs, artists, genres, moods, themes, decades, locale or queries. Choose from 1,000+ genres, 350 moods & 250 themes, inbuilt, or custom.

Just click 'New library mix' or 'New autoDJ on the context menu and select an item. Either:
- one of the dynamic items related to the current track
- one of the suggestions on the flyout menus
- or open the full browse & search dialogue (has autocomplete + 'try another' if no matches)

For feedback, use the nowplaying view (context menu). The inbuilt genre list includes styles and subgenres.

##### Two methods are supported:

- Last.fm data (default)
     - songs are selected using last.fm recommendations
     - no special tagging needed
     - easily play the best music
     - track and artist similarities + popularities are determined from the vast breadth of data at last.fm
     - popularity level is configurable (playlist tab), so mix can be fine tuned from a tight selection of popular tracks to more varied sounds
- Own data
     - selections are mostly based on your own tags and play counts or ratings
     - autoDJ and smart mix can favour most played, highest rated or most popular tracks for a great selection
     - can still use last.fm info to accurately identify similar artists and similar songs (default pool sizes can be increased by changing the _last.fm_ data option for track, e.g. to 'Tracks: Favour: Varied')
     - skip tracks feature to keep the track standard high (playlist tab)

- Library playlist generator vs autoDJ
     - autoDJ uses smart algorithms to automatically choose tracks
     - autoDJ optionally supports YouTube offering greater variety and so is not restricted to what's in the media library
     - autoDJ is great for music discovery if YouTube is used
     - autoDJ removes played tracks & keeps a consistent playlist size of up to 25 tracks (set size on playlists tab)
     - autoDJ is really just an auto-play method; it's similar to radio and autoDJ modes found elsewhere
     - library playlist generator has smart mix feature (default), with configurable playlist size (playlist tab), for best mix
     - library playlist generator creates the complete playlist up front allowing choice of the tracks played
     - library playlist generator doesn't support YouTube as it would require too many calls in one go
     - both methods support favourites (aka history if used in auto-mode)

### Nowplaying view (context menu)
- Two modes:
     1. Provides feedback on library playlist generator & autoDJ
     2. Displays configurable info on current track
-  Click text to toggle type, or image to toggle album cover vs artist photos

### Track popularity tagger (context menu > playlists)
- Writes last.fm playcount (scrobbles), listeners & a combined score (1-100) as a multi-value tag
- Scores rank the long-term popularity of tracks on a 1-100 scale using total scrobbles and listeners
- The highest scoring track at last.fm is set to a score of 100
- Score is used as the default popularity tag (search tab)
- Access tag values as e.g:
```
$meta(Track Statistics Last.fm,1[playcount])
$meta(Track Statistics Last.fm,3[listeners])
$meta(Track Statistics Last.fm,5[score])
```
- Remove punctuation from playcount & listeners if used in queries, sorting or arithmetic title formatting functions, e.g.
```
$replace($meta(Track Statistics Last.fm,1[playcount]),',',,.,, ,)
```
#### Possible library tree filters:
- 5* tracks (last.fm score) `"$meta(Track Statistics Last.fm,5[score])" GREATER 69`
- 5/4* tracks (last.fm score) `"$meta(Track Statistics Last.fm,5[score])" GREATER 59`
- 5/4/3* tracks (last.fm score) `"$meta(Track Statistics Last.fm,5[score])" GREATER 49`

## REQUIREMENTS:
- [foobar2000](https://www.foobar2000.org)
- [Spider Monkey Panel 1.5.2+](https://www.foobar2000.org/components)
- IE9 or later
- [FontAwesome](https://github.com/FortAwesome/Font-Awesome/blob/fa-4/fonts/fontawesome-webfont.ttf?raw=true)
##### Optional
[foo_youtube: ](https://www.foobar2000.org/components)required for use of youtube functionality.

## INSTALLATION
Install as a package as follows.

New install or update:
1) Add a spider monkey panel to foobar2000 if required
2) Close any instances of windows explorer using foobar2000 folders or subfolders
3) Right click the spider monkey panel while pressing the windows key + shift
4) Choose configure panel
5) On the script tab ensure package is selected
6) Open package manager if it doesn't open automatically
7) Import the package

Set up tips
1) If YouTube is used, in foobar2000\preferences\shell integration, it's recommended to uncheck "Bring to front when adding new files" to ensure that foobar2000 doesn't grab focus away from other applications
2) If own data mode is used check the skip tracks query in case the default isn't suitable (playlists tab). Suggested possible skip queries are:
     - %rating% IS 1
     - %rating% IS 1 OR %rating% IS 2
     - %play_count% GREATER 0 AND %play_count% LESS 3
     - "$meta(Track Statistics Last.fm,5[score])" LESS 30. This is a popularity score that can be added with the popularity tagger.  It's a great choice if you don't have your own ratings
     - adjust numbers as required
3) If your library lacks suitable genre, mood etc tags, biography can write them as multi-value tags that work well. Alternatively, use the last.fm data methods which do track based look-ups of such items
4) Operating system. Certain options require compliance with the full range of Spider Monkey Panel features. If you're using windows all should be supported. If you're using WINE or something else that isn't fully compliant, browse & search dialog may not be available. Instead the flyout menus have an alternative 'More...' option.

### Browse and search
<img src="https://user-images.githubusercontent.com/35600752/184456470-5e08b4d9-2eca-4e29-b603-957d0205e59f.png" width=32% hspace=1%><img src="https://user-images.githubusercontent.com/35600752/184456490-ec9c4560-471b-4e65-979d-0a32523d8b4b.png" width=32% hspace=1%><img src="https://user-images.githubusercontent.com/35600752/184456505-cfbbe3bb-5f88-4a46-ba9b-71015c5301fc.png" width=32%>
Some autocomplete suggestions depend on media library content.

### Nowplaying panel in feedback mode
<img src="https://user-images.githubusercontent.com/35600752/184193138-fd41a474-b230-4d14-8e98-fdbf6f4c8173.png" width=64%>

## SUPPORT
The official discussion thread for Find and Play is located at [HydrogenAudio](https://hydrogenaud.io/index.php?topic=121006.0) and that's a great place to go for questions and other support issues.

## Technical notes
##### Last.fm tags
Find and Play does a full search of the last.fm database, and may include results (e.g. for track tags) that aren't normally displayed on the last.fm web-site.
