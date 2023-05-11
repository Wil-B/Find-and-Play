# Find and Play

Feature rich media manager and browser for [foobar2000](https://www.foobar2000.org) that integrates your music library with web resources.
- **Last.fm:**
 	- personalised recommendations:
 		- standard
 		- mix
 		- neighbours
 		- radio
	- last.fm library, including playcounts & loved
	- music discovery
	- top tracks / last.fm mixes:
		- similar artists
		- sounds like (aka similar songs)
		- genres (including sub-genres & styles), moods, themes, decades, years, locales
		- artists: last 7 days, last 30 days, last 90 days, last 180 days, last 365 days, all time
	- top albums: expandable to show track lists
	- charts: real time & loved
	- statistics if supplied by last.fm
		- playcount or
		- listeners
- **MusicBrainz:**
	- albums
	- compilations
	- singles & EPs
	- remixes
	- expandable to show track lists
<!--
  - **ListenBrainz:**
	- personalized recommendations
	- personal listening statistics
	- site-wide listening statistics
	- top tracks and mixes
	- integrated with MusicBrainz 
-->
- **Official charts:**
 	- any date within range:
 	- 1952 to current
- **Intelligent playlist generator**
	- smart mix feature
	- configurable
- **AutoDJ**
	- inbuilt with smart algorithms or
	- last.fm radio
- **Automatic retrieval of virtual tags** from [biography](https://github.com/Wil-B/Biography) (requires biography v1.4.0+ installed)
	- boosts menu choices related to the current track: genres (including sub-genres & styles), moods, themes, locales
	- doesn't alter music files
- **Popularity tagger**
	- writes last.fm statistics and a popularity score as a multi-value tag, e.g.
	- Playcount; 4,062,763; Listeners; 547,236; Score; 81
	- see [below](https://github.com/Wil-B/Find-and-Play#track-popularity-tagger-context-menu--playlists) for more info
- **Search bar**
- **Preview browser**
	- explore what's available without interfering with playlists
- **Now playing pane**
- **Button mode**
	- library mixes
	- autoDJ
- **Album art**
	- album covers
	- artist photos
- **Play items from:**
<br>&emsp; <img src="https://user-images.githubusercontent.com/35600752/232258441-96cabbad-f267-40d1-a7da-f735faaca15f.png" width=1.5%> Media library
<br>&emsp; <img src="https://user-images.githubusercontent.com/35600752/232258489-4f2ea159-5ec6-44d5-bcb1-0e0380336f20.png" width=1.5%> YouTube (direct)
<br>&emsp; <img src="https://user-images.githubusercontent.com/35600752/232258585-b7efbbbb-7e9a-4373-9522-b9993f2696df.png" width=1.5%> YouTube (last.fm links)
<br>&emsp; <img src="https://user-images.githubusercontent.com/35600752/232258523-d2a3931f-e61b-478f-89aa-54657f0fd316.png" width=1.5%> YouTube (cache)
- :arrow_forward: **Play at click of button**
	- on the fly options for playback order, track ranges etc (middle click button)
	- shuffle option uses smart shuffle, so same artists should be spread, like used in autoDJ
- :arrows_counterclockwise: **Refresh** to load new recommendations, mixes or sync last.fm charts in real time
- **Themes (options > display tab):**
	- user interface
	- dark
	- blend
	- light
	- random
- **Button size:** Ctrl + wheel over buttons to change size if required
- **Text:** uses foobar2000 user interface setting by default or Ctrl + wheel over text to change size if required or see options > custom tab
-  **Async:** web, addLocations, image loading etc

### Screenshot with image background enabled
<img src="https://user-images.githubusercontent.com/35600752/235265621-fb401b01-06e3-4eb0-b41e-8593a4d75edd.png" width=75%>

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
1) If **YouTube** is used, in foobar2000\preferences\shell integration, it's recommended to uncheck "Bring to front when adding new files" to ensure that foobar2000 doesn't grab focus away from other applications
2) **Button size**: press Ctrl and rotate the mouse wheel while hovering over buttons to change size if required.
3) **Last.fm** recommendations require entering a last.fm user name either in ```options > maintenance``` or ```panel properties > Album Manager Lfm User Name```. That can be your own name or you can explore others. Scrobbled tracks need to be present at last.fm. It's recommended to use foo_scrobble: https://github.com/gix/foo_scrobble'. Button can be hidden in maintenance tab or with panel property 'Album Manager Lfm User Show Recommendations'.
4) Operating system. Certain options require compliance with the full range of Spider Monkey Panel features. If you're using windows all should be supported. If you're using WINE or something else that isn't fully compliant, browse & search dialog may not be available. Instead the flyout menus have an alternative option.
<!--
4) **ListenBrainz** site-wide statistics are available to anyone. Recommendations and personal listening data require entering a ListenBrainz user name either in options > maintenance or panel properties > 'Album Manager LB User Name'. That can be your own name or you can explore others. A placeholder name is present, so it can be seen working. Listens also need to be present at ListenBrainz. It's recommended to use foo_listenbrainz2: https://github.com/phw/foo_listenbrainz2.
--> 

## SUPPORT
The official discussion thread for Find and Play is located at [HydrogenAudio](https://hydrogenaud.io/index.php?topic=121006.0) and that's a great place to go for questions and other support issues.

### Nowplaying panel in feedback mode
<img src="https://user-images.githubusercontent.com/35600752/184193138-fd41a474-b230-4d14-8e98-fdbf6f4c8173.png" width=64%>

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
