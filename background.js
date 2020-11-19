const CLIENT_ID = encodeURIComponent('64fb35d3e3de4fecb0e0d60cd76dd006'); // change this according to your Spotify OAuth Client ID
const EXTENSION_ID = 'hflkbdhappjboleecikmjbfnjhifdhhm'; // Change this according to your extension
const RESPONSE_TYPE = encodeURIComponent('token');
const REDIRECT_URI = encodeURIComponent('https://bbnpcfnidfdaickpffjmdodaadbgefem.chromiumapp.org/');
const SHOW_DIALOG = encodeURIComponent('true');

const SCOPE = ["user-library-modify","playlist-modify-private","playlist-read-collaborative","playlist-read-private", "playlist-modify-public"];

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


// This function queries the currently open tab. 
// If the open URL is youtube, it fetches the title of the video
function queryTab() {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        let url = tabs[0].url;
        console.log("URL is -->" + url);
    });
}

// This function updates the popup if the user is already signed in
function updatePopup() {
    chrome.browserAction.setPopup({ popup: './popup-signed-in.html' }, () => {
        //queryTab();
        sendResponse({ message: 'success' });
    });
}


// This function may get executed multiple times for the same website. Careful what we write here
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log("Querying tab");
    queryTab();

    //TODO Remove this and place it somewhere it's accessed a little less often
    chrome.storage.sync.get(["signed_in"], function (items) {
        //  items = [ { "signed_in": true } ]
        if (items != null && items[0] != null) {
            if (items[0]["signed_in"]) {
                user_signed_in = true;
                updatePopup();
            }
        }
    });

    chrome.storage.sync.get(["access_token"], function (items) {
        //  items = [ { "signed_in": true } ]
        if (items != null && items[0] != null) {
            if (items[0]["access_token"]!=null) {
                ACCESS_TOKEN = items[0]["access_token"];
            }
        }
    });

});

// Utility function for formatting query params
function formatParams(params) {
    return "?" + Object
        .keys(params)
        .map(function (key) {
            return key + "=" + encodeURIComponent(params[key])
        })
        .join("&")
}

function rightClickSearch(word){
    //Store the word in storage, so it can be accessed by the frontend.
    chrome.storage.sync.set({ "last_search": word }, function () {
        console.log("Last Query saved.");
        chrome.tabs.create({
            url: chrome.extension.getURL('popup-signed-in.html'),
            active: false
        }, function(tab) {
            // After the tab has been created, open a window to inject the tab
            chrome.windows.create({
                tabId: tab.id,
                type: 'popup',
                focused: true
            });
        });
    });
}

// Add right-click functionality
chrome.contextMenus.create({
    title: "SPOT!",
    contexts:["selection"],
    onclick: rightClickSearch
})

// Search spotify function
function searchSpotify(query) {
    var xhr = new XMLHttpRequest();
    var params = {
        q: query,
        type: 'track'
    }
    xhr.open("GET", "https://api.spotify.com/v1/search" + formatParams(params), true);
    if(ACCESS_TOKEN==null){
        console.log("Error, ACCESS_TOKEN undefined");
        return
    }
    xhr.setRequestHeader('Authorization', 'Bearer '+ACCESS_TOKEN)
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            // JSON.parse does not evaluate the attacker's scripts.
            var resp = JSON.parse(xhr.responseText);
            chrome.runtime.sendMessage({type:'searchResp', data: resp});
        }
    }
    xhr.send();
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

                            // setTimeout(()=>{
                            //     ACCESS_TOKEN = '';
                            //     user_signed_in = false;
                            // }, 3600000); //every 60 minutes sign the user out

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