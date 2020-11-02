# SPOT
An extension that allows you to directly add a song to your spotify playlist, on the go.

## Installation Instructions

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
- Rename ```config_sample.js``` to ```config.js```
- Open ```config.js```
- Replace ```CLIENT_ID``` and ```EXTENSION_ID``` with your own values
- Reload the extension

## How to use
- Any time during web browsing, click on the extension and search for a song
- Coming soon: add to playlist
