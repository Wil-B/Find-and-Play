# Find and Play

<!-- <img src= "https://img.shields.io/github/v/release/Wil-b/Find-and-Play?include_prereleases">[![CodeFactor](https://www.codefactor.io/repository/github/wil-b/smp-scripts/badge?s=e31aef34da666a7f881d60c035843654ee451e7d)](https://www.codefactor.io/repository/github/wil-b/smp-scripts) -->

 Feature rich plug-in for foobar2000 that finds and plays music.
 Works great with youtube and your own media library.
 
<img src="https://user-images.githubusercontent.com/35600752/118047701-09164f00-b373-11eb-986b-05db56d6fe22.png" width=70% height=48%>

### FEATURES
#### Display & play:
- full album and track discographies
- top tracks, similar artists, similar songs, decades
- top 100 charts (current and historic back to 1952)
- can use queries or track matching with last.fm tag database (so files don't need to be tagged in any special way to identify tracks of specific genres, mood or artist locale)
#### Auto DJ:
- auto DJ option with automated weighting algorithmn that can use last.fm or own data to help select better tracks
#### Other features:
- operates on a minimum number of playlists, so there's no awkward playlist management
- nowplaying pane that provides feedback or displays configurable info on current track
### USAGE
To load & play music:
- click items in album & tracks pane or use context menu.
- click the +  in album & tracks pane for multiple items.
- choose 'Auto DJ...' or 'Find tracks in library...' on context menu. Loads a new selection in a chosen style.

### REQUIREMENTS:
- [foobar2000](https://www.foobar2000.org)
- [Spider Monkey Panel 1.4.1+](https://www.foobar2000.org/components)
- IE9 or later
- [FontAwesome](https://github.com/FortAwesome/Font-Awesome/blob/fa-4/fonts/fontawesome-webfont.ttf?raw=true)
##### Optional
[foo_youtube: ](https://www.foobar2000.org/components)required for use of youtube functionality.

### INSTALLATION
This version has to be installed as package.
1) Add a spider monkey panel to foobar2000.
1) Right click the spider monkey panel while pressing the windows key + shift. Choose configure panel.
2) On the script tab choose package.
3) Click the import button and import the library tree package.

##### Troubleshooting
Please note that the package manager is a new feature of spider monkey panel. If you experience issues with the spider monkey panel installer follow the guide below.

<i>Portable foobar2000 installs</i>

1) Create a new package first. Call it, e.g. test, & delete it afterwards. This should create a missing folder which then allows Find & Play to be installed.
2) Try using the development build of spider monkey panel which has the required bug fix.

<i>Standard foobar2000 installs</i>

You'll need to install the package manually or wait for fixed spider monkey panel release. For completeness the below covers portable installs as well.
To do a manual install, create the following path in YOUR_FOOBAR_PROFILE_PATH: foo_spider_monkey_panel\packages\\{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}.
You need to end up with the following master folder:
- For standard installations of any version of foobar2000: .\foobar2000\foo_spider_monkey_panel\packages\\{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}
- For portable installations of foobar2000 v1.6 or later: .\foobar2000\profile\foo_spider_monkey_panel\packages\\{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}
- For portable installations of foobar2000 1.5 or earlier: .\foobar2000\foo_spider_monkey_panel\packages\\{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}

Extract the Find & Play.zip. Copy the content, ie. the assets folder, the scripts folder and the two files, main.js and package.json, into the above folder.

