let topThreeTracks = document.getElementById('topThreeTracks');
let trackSearch = document.getElementById('query');
let displayName = document.getElementById('displayName');
let playlists = document.getElementById("playlists");
let playlistViewHeader = document.getElementById("playlist-view-header");
let addButton = document.getElementById("ADD");

var selectedSongID ='';
let top3songs = [];
let highlightedText = '';
let ACCESS_TOKEN='';

function getToken(){
    chrome.storage.sync.get('access_token', result => {
        console.log("ACCESS_TOKEN: " + result['access_token']);
        ACCESS_TOKEN  = result['access_token'];
        if (ACCESS_TOKEN != undefined) {
            getUserName(ACCESS_TOKEN);
        }
    });
}

getToken();

function  getUserName(ACCESS_TOKEN){
    fetch('https://api.spotify.com/v1/me', 
        { headers: {'Authorization':'Bearer '+ ACCESS_TOKEN}
    }).then(response => response.json())
    .then(data => {
        if(data.display_name==undefined){
            chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
                if (response.message === 'success') window.close();
            });
        }
        else{
            displayName.innerHTML = data.display_name;
            getPlaylists(ACCESS_TOKEN, data.id);
            return data.display_name;
        }
    });
}

chrome.storage.sync.get('highlighted_text', result => {
    highlightedText = result['highlighted_text'];
    console.log("highlighted text: " + highlightedText);
    if(highlightedText!=='' && highlightedText!==null && highlightedText.length > 0){
        highlightedTextActions(highlightedText);
    }
});

function highlightedTextActions(highlightedText){
    trackSearch.value = highlightedText;
    searchSongSpotify(highlightedText);
    
    chrome.storage.sync.set({'highlighted_text': ""},function(){
        console.log("reset highlighlighted_text value");
     });
}

function searchSongSpotify(query){
    trackSearch.value = query;
    console.log("Searching for: " + query + "!");
    if(ACCESS_TOKEN==undefined || ACCESS_TOKEN=='' || ACCESS_TOKEN==null || ACCESS_TOKEN==' '){
        console.log('first if');
        chrome.storage.sync.get('access_token', result => {
            ACCESS_TOKEN  = result['access_token'];
        });
    }

    fetch("https://api.spotify.com/v1/search?q=" + encodeURI(query) + "&type=track",
        {headers: {'Authorization': 'Bearer ' + ACCESS_TOKEN}})
    .then(response => response.json()) //display only top 3 results
    .then(songsJSON => {
        topThreeTracks.innerHTML = "";
        top3songs.length = 0; 
        try{
            if(songsJSON['tracks']!=undefined){
                if(songsJSON['tracks']['items'].length > 0){
                    document.getElementById("searchBox").style.marginTop = "0px";
                    for (let i = 0; i < 3; i++){
                        if(songsJSON['tracks']['items'][i]!=undefined){
                            track = songsJSON['tracks']['items'][i]['name'];
                            artist = songsJSON['tracks']['items'][i]['artists'][0]['name'];
                            trackID = songsJSON['tracks']['items'][i]['id'];
                            if(i==0){selectedSongID = trackID;} //setting first result as selectedsong by default
                            top3songs.push(trackID);
                            const song = document.createElement('li');
                            song.setAttribute('id',trackID);
                            song.setAttribute('class','top3');
                            song.innerHTML = track + " - " + artist;
                            song.onclick = function() {trackSelected(this.id)};
                            topThreeTracks.append(song);
                        }
                    }
                }else {
                    trackSearch.value = query;
                    const noSongMessage = document.createElement('p');
                    noSongMessage.setAttribute('class','noSongMessage');
                    noSongMessage.innerHTML= "no results,modify search and try again!";
                    noSongMessage.style.fontSize = '12px';
                    topThreeTracks.append(noSongMessage);
                }
            }else{
                console.log("400 Status Error, Calling function again!");
                searchSongSpotify(query);
            }
        } catch(err){
            trackSearch.value = query;
            console.log("Caught error :" + err + " while searching for: " + query);
            const needToClick = document.createElement('p');
            needToClick.setAttribute('class','noSongMessage');
            needToClick.innerHTML = 'click to search!';
            needToClick.style.fontSize = '15px';
            needToClick.style.marginLeft='38px';
            topThreeTracks.append(needToClick);
        }
    });
}



/*in one call, maximum number of playlists items returned is 50. If .length == 50, 
make another call using offset to get the next 50 items, as no. of playlists can be > 50*/

/*Get all playlists where user is the creater or where playlist collaborative value is true*/
/* currently collaboarative playlists are not being fetched inspite of scope containing the required parameters MmmMmmmM need to figure*/
function getPlaylists(ACCESS_TOKEN, user_id){
    var owned_playlists = [];
    document.getElementById("searchBox").style.marginTop = "0px";
    fetch('https://api.spotify.com/v1/me/playlists?limit=50',
        { headers: {'Authorization':'Bearer '+ACCESS_TOKEN}
    }).then(response=>response.json())
    .then(data => {
        console.log("No. of Playlists" + Object.keys(data.items).length);
        console.log("User ID: " + user_id);
        // console.log("All Playlist Names"+ data.items.map(playlist=>playlist.name+"\n"));
        console.log("All owned playlists:");
        data.items.forEach(playlist => {
            if(playlist.owner.id == user_id){ //this will be the final list of playlists displayed as user can add songs to only these playlists
                owned_playlists.push(playlist.name);
                var each_playlist = document.createElement("div");
                var playlist_cover = document.createElement("img");
                playlist_cover.src = playlist.images[0].url;
                playlist_cover.width = "100";
                playlist_cover.height ="100";
                var playlist_name = document.createElement("p");
                playlist_name.appendChild(document.createTextNode(playlist.name));
                // playlist_name.innerHTML = playlist_name;
                each_playlist.appendChild(playlist_cover);
                each_playlist.appendChild(playlist_name);
                playlists.appendChild(each_playlist);
                // playlists.innerHTML= playlists.innerHTML + playlist.name + "\n";
                console.log(playlist.name);

                each_playlist.onclick = () => selectPlaylist(ACCESS_TOKEN, playlist.id);
            }
        });
        console.log(owned_playlists.length);
        playlistViewHeader.innerHTML = "Choose from " + owned_playlists.length + " playlists!";
    })
}

function selectPlaylist(ACCESS_TOKEN, playlist_id){
    console.log("Playlist Selected: "  + playlist_id);
}


document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    console.log("Searching for songs... " + trackSearch.value);
    trackSearch.value = trackSearch.value;
    searchSongSpotify(trackSearch.value);
}, false);

function trackSelected(trackID){
    let trackElement = document.getElementById(trackID);
    trackSearch.value = trackElement.innerHTML;
    selectedSongID = trackID;
    console.log("Selected Song ID: " + selectedSongID);
    for(let i = 0; i<top3songs.length ;i++){
        let song = document.getElementById(top3songs[i]);
        song.style.color = 'white';
        if(trackID == top3songs[i]){
            trackElement.style.color = '#1DB954';
        }
    }
}

/*if tab open is youtube.com/watch: fetch title i.e. name of video being watched */
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    /*re-initialising access_token as when 2 requests are made for the same url, 
    it cannot fetch access_token value due to the async nature of javascript*/
    ACCESS_TOKEN = ACCESS_TOKEN; 
    let url = tabs[0].url;
    console.log("Current URL: " + url);
    if(url.includes("https://www.youtube.com/watch?")){
        title = tabs[0].title;
        title = title.toLowerCase();
        //cleaning the title of the video
        removeWords = ['youtube', ' - youtube','|','+','&','video', 'featuring', 'feat.',  'Watch Now', '!', 'by',
                'studio','music video','music','Official Video - YouTube','Official Video','(official video)',
                'Official Video w// Lyrics','24 hour version', '(Official Audio) - YouTube', 'w/', '(explicit)',
                ' | official music video','official music video', 'audio','-audio', ' - audio ',
                'featuring', 'official music video','(official music video)', '(acoustic cover)','starring -','- starring',
                '- cover','cover - ', '(official)',  ' - ', ' -', '- ',
                'official', 'music video', 'official video', 'original video','(audio)','audio only', 'lyrics video',
                '- lyrics',  'lyrics', '(lyrics)','(official lyric video)','lyric','ft. ' ,'cover', 'original cover','  ','   '];
        
        for(let i =0; i<removeWords.length;i++){
            title = title.replaceAll(removeWords[i].toLowerCase()," ");
        }

        title = title.trim().replace(/\(\d+\)/g, "");
        title = title.replaceAll('(','').replaceAll(')','').replaceAll('[','').replaceAll(']','').replaceAll('"','');
        title = title.replaceAll('( )','').replaceAll('[ ]','').replaceAll('()',"").replaceAll('[]','').replaceAll('[  ]','');
        title = title.trim();

        if(title != undefined || title != "" || title != null){
            searchSongSpotify(title); 
        }
    }
});

document.querySelector('#sign-out').addEventListener('click', function () {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success') window.close();
    });
});

document.querySelector('#add-song').addEventListener('click', function () {
    console.log("Selected song value: " + selectedSongID);
});


    
