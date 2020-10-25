const CLIENT_ID = encodeURIComponent('e398a5b2c6eb42bfa305efab6caefc72');
const RESPONSE_TYPE = encodeURIComponent('token');
const REDIRECT_URI = encodeURIComponent('https://gfhecgoaelkeeippfcekipomkpfmdkjp.chromiumapp.org/');
const SHOW_DIALOG = encodeURIComponent('true');

const SCOPE = encodeURIComponent("user-library-modify", "playlist-read-private", "playlist-modify-public", "playlist-modify-private");

let STATE = '';
let ACCESS_TOKEN = '';

let user_signed_in = false;

function create_spotify_end_point(){
    STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2,15));

    let oauth2_url =
        `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=${SCOPE}&show_dialog=${SHOW_DIALOG}`;

    return oauth2_url;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
    if(request.message === 'login'){
        if(user_signed_in){
            console.log("user is already signed in");
        }
        else{
            chrome.identity.launchWebAuthFlow({
                url: create_spotify_end_point(),
                interactive: true
            }, function(redirect_url){
                if(chrome.runtime.lastError){
                    sendResponse({message: 'fail'});
                } else {
                    if(redirect_url.includes('callback?error=access_denied')){
                        sendResponse({message: 'fail'});
                    }else{
                       // console.log("re-direct" , redirect_url);
                        ACCESS_TOKEN = redirect_url.substring(redirect_url.indexOf('access_token=')+13);
                        ACCESS_TOKEN = ACCESS_TOKEN.substring(0,ACCESS_TOKEN.indexOf('&'));
                        let state = redirect_url.substring(redirect_url.indexOf('state=')+6);       
                        if(state===STATE){
                            console.log("SUCCESS");
                            user_signed_in = true;

                            // setTimeout(()=>{
                            //     ACCESS_TOKEN = '';
                            //     user_signed_in = false;
                            // }, 3600000); //every 60 minutes sign the user out

                            chrome.browserAction.setPopup({popup: './popup-signed-in.html'}, () => {
                                sendResponse({message: 'success'});
                            });
                        }else {
                            sendResponse({message: 'fail'});
                        }  
                    }
                }
            });
        }
        return true;
    } 

    else if (request.message ===  'logout'){
        user_signed_in = false;
        chrome.browserAction.setPopup({popup: './popup.html'},()=>{
            sendResponse({message: 'success'});
        });
        return true;
    }
});