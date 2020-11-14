const CLIENT_ID = encodeURIComponent('e398a5b2c6eb42bfa305efab6caefc72'); // change this according to your Spotify OAuth Client ID
const EXTENSION_ID = 'hflkbdhappjboleecikmjbfnjhifdhhm'; // Change this according to your extension
const RESPONSE_TYPE = encodeURIComponent('token');
const REDIRECT_URI = encodeURIComponent('https://gfhecgoaelkeeippfcekipomkpfmdkjp.chromiumapp.org/');
const SHOW_DIALOG = encodeURIComponent('true');

const SCOPE = ["user-library-modify",  "playlist-modify-private","playlist-read-collaborative","playlist-read-private", "playlist-modify-public"];

let STATE = '';
let ACCESS_TOKEN = '';

let user_signed_in = false;

var highlightedTextContextMenu = {
    "id": "highlightedText",
    "title": "SPOTTED! Search on Spotify?",
    "contexts":["selection"]
}

chrome.contextMenus.create(highlightedTextContextMenu);

chrome.contextMenus.onClicked.addListener(function(highlighted){
    if(highlighted.menuItemId  == "highlightedText" && highlighted.selectionText){
        console.log("highlighted: "+ highlighted.selectionText);
        chrome.storage.sync.set({'highlighted_text': highlighted.selectionText},function(){
            var textSpottedNotif = {
                type: 'basic',
                iconUrl: 'images/spot-48.png',
                title: 'SPOTTED!',
                message: 'Search results for "'+ highlighted.selectionText +'" are ready. Open the SPOT extention to add the best match to your Spotify playlists!'
            };
            chrome.notifications.create('SpottedNotif',textSpottedNotif);
        })
    }
});

function create_spotify_end_point() {
    STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));

    let oauth2_url =
        `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=${SCOPE}&show_dialog=${SHOW_DIALOG}`;
    console.log(oauth2_url);
    return oauth2_url;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'login') {
        if (user_signed_in) {
            console.log("user is already signed in");
        }
        else {
            console.log("Launching web auth")
            chrome.identity.launchWebAuthFlow({
                url: create_spotify_end_point(),
                interactive: true
            }, function (redirect_url) {
                console.log("re-direct", redirect_url);
                if (chrome.runtime.lastError) {
                    sendResponse({ message: 'fail' });
                } else {
                    if (redirect_url.includes('callback?error=access_denied')) {
                        sendResponse({ message: 'fail' });
                    } else {
                        ACCESS_TOKEN = redirect_url.substring(redirect_url.indexOf('access_token=') + 13);
                        ACCESS_TOKEN = ACCESS_TOKEN.substring(0, ACCESS_TOKEN.indexOf('&'));
                        let state = redirect_url.substring(redirect_url.indexOf('state=') + 6);
                        if (state === STATE) {
                            console.log("SUCCESS");
                            console.log("ACCESS TOKEN " + ACCESS_TOKEN)
                            user_signed_in = true;

                            var access_token_obj = { "access_token": ACCESS_TOKEN };

                            //Store a flag so that the sign in popup does not appear every time
                            chrome.storage.sync.set({ "signed_in": true }, function () {
                                console.log("User signed in. Data saved.");
                            });

                            chrome.storage.sync.set(access_token_obj, function () {
                                console.log("Access token saved.");
                            });

                            setTimeout(()=>{
                                ACCESS_TOKEN = '';
                                user_signed_in = false;
                            }, 3600000); //every 60 minutes sign the user out

                            chrome.browserAction.setPopup({ popup: './popup-signed-in.html' }, () => {
                                sendResponse({ message: 'success' });
                            });
                        } else {
                            sendResponse({ message: 'fail' });
                        }
                    }
                }
            });
        }
        return true;
    }

    else if (request.message === 'logout') {
        user_signed_in = false;
        chrome.browserAction.setPopup({ popup: './popup.html' }, () => {
            sendResponse({ message: 'success' });
        });
        return true;
    }
});