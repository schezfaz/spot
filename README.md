# SPOT
> An browser extension that allows you to directly add a song to your spotify playlist

![spot-landing page](images/spot-landing.PNG) 

## Usage

- **Login  & Authentication**

    Click on 'sign-in & authenticate' to log in and grant access permissions.

    <img src="images/spot-login.gif" width="500" height="300"/>

- **Search for music & Preview**
     
    Enter the title of the song, and hit enter to search!

    <img src="images/spot-search.gif" width="450" height="650"/>

- **Add to playlist(s)**

    Select one or more playlists to add the selected song to, simultaneously.

    <img src="images/spot-add-to-playlist.gif" width="450" height="650"/>

- **Log-out**

    Click on the 'sign-out' button below your username to log-out.

    <img src="images/spot-logout.gif" width="450" height="650"/>


## Features

- **Listening on active YouTube Tab:**

    If you're listening to a song on YouTube and wish to add it to one of your Spotify playlists, open SPOT in the said tab, and it will have the best match  results ready for the music you are streaming on YouTube!

    <img src="images/spot-youtube.gif" width="auto" height="500"/>

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
