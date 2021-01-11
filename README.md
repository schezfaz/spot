# SPOT

A Chrome extension that allows you to add *any* song to your spotify playlist, directly from your browser!

Install now, from the [Chrome Web Store](https://chrome.google.com/webstore/detail/spot/cciagoimobpkdkejimpkjpmcekigdejb?hl=en-GB&authuser=0)

## Usage

- **Login  & Authentication**

    Click on 'sign-in & authenticate' to log in and grant access permissions.

    <img src="images/spot-login.gif" width="auto" height="400"/>

- **Search for music & Preview**
     
    Enter the title of the song, and hit enter to search!

    <a href="https://open.spotify.com/album/3DIkSBAbpiVqzckLlRuojY"><img src="images/spot-search.gif" width="450" height="650"/></a>

- **Add to playlist(s)**

    Select one or more playlists to add the selected song to, simultaneously.

    <a href="https://open.spotify.com/track/5u4wpinsyz7gdHMG8pzUAQ"><img src="images/spot-add-to-playlist.gif" width="450" height="650"/></a>

## Features

- **Add a song playing on your active YouTube Tab:**

    If you're listening to a song on YouTube and wish to add it to one of your Spotify playlists, open SPOT in the same tab, and it will have the best match results ready for the music you are streaming on YouTube!

    <a href="https://www.youtube.com/watch?v=NNI5R-eG4O8"><img src="images/spot-youtube.gif" width="auto" height="500"/></a>

- **Search for text spotted on the internet - Highlight & Right Click!**

    Ever came across a name of a song while scrolling through reddit/instagram? Search for the corresponding song on Spotify to add to your playlists!

    Steps:
    - Highlight SPOTTED text
    - Right Click & Select 'SPOTTED! Search on Spotify?'
    - Notification indicates that your search results are ready
    - Open the SPOT extension to add best match results to your playlists!

    <a href="https://open.spotify.com/track/2qzhDx0YbKNHWkRZj6o8rV"><img src="images/spot-rightclick.gif" width="auto" height="500"/></a>

- **Search for text spotted on the internet -  Highlight & CTRL + SHIFT + S!**

    Trigger a spotify search for highlighted text, using the keyboard shortcut: `CTRL + SHIFT + S`

    <a href="https://open.spotify.com/track/15yni6BXSkY79rPmi3fvfM"><img src="images/spot-crtlshift.gif" width="auto" height="500"/></a>

## Local Installation Instructions

### Chrome Extension
- Open Chrome Extensions and enable developer mode
- Clone the repo
- Click on "Load Unpacked" and point to the location of the extension
- Note the ID of the extension

### Spotify client
- Create a free spotify developer account https://developer.spotify.com/dashboard/login
- Once inside, create an app and give it a name
- Note the ```client ID```
- Click on EDIT SETTINGS and add redirect URI as ```https://<your-chrome-extension-id>.chromiumapp.org/```
- Done!

### Config Changes
- Open ```background.js```
- Replace ```CLIENT_ID``` and ```REDIRECT_URI``` with your own values
- Reload the extension
