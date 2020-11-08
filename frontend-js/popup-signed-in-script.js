var topThreeTracks = document.getElementById('topThreeTracks');
var trackSearch = document.getElementById('query');
var displayName = document.getElementById('displayName');
var playlists = document.getElementById("playlists");
var playlistViewHeader = document.getElementById("playlist-view-header");
var addButton = document.getElementById("ADD");

var selectedSongID ='';
var ACCESS_TOKEN='';

function getToken(){
    chrome.storage.sync.get('access_token', result => {
        console.log("ACCESS_TOKEN: " + result['access_token']);
        ACCESS_TOKEN  = result['access_token'];
        if (ACCESS_TOKEN != undefined) {
            getUserName(ACCESS_TOKEN);
        }
    });
    // chrome.storage.sync.get(null, function(items) {
    //     var allKeys = Object.keys(items);
    //     console.log(allKeys);
    // });
}

function  getUserName(ACCESS_TOKEN){
    fetch('https://api.spotify.com/v1/me', 
        { headers: {'Authorization':'Bearer '+ ACCESS_TOKEN}
    }).then(response => response.json())
    .then(data => {
        displayName.innerHTML = data.display_name;
        getPlaylists(ACCESS_TOKEN, data.id);
        return data.display_name;
    });
}

/*in one call, maximum number of playlists items returned is 50. If .length == 50, 
make another call using offset to get the next 50 items, as no. of playlists can be > 50*/

/*Get all playlists where user is the creater or where playlist collaborative value is true*/
/* currently collaboarative playlists are not being fetched inspite of scope containing the required parameters MmmMmmmM need to figure*/
function getPlaylists(ACCESS_TOKEN, user_id){
    var owned_playlists = [];
    playlists.style.display = "block";
    playlistViewHeader.style.display = "block";
    addButton.style.display ="block";
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

getToken();

document.querySelector('#sign-out').addEventListener('click', function () {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success') window.close();
    });
});

document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    console.log("Searching for songs... " + document.getElementById('query').value)
    // chrome.runtime.sendMessage({ message: 'search', 'data': document.getElementById('query').value })
    fetch("https://api.spotify.com/v1/search?q=" + encodeURI(document.getElementById('query').value) + "&type=track",
        {headers: {'Authorization': 'Bearer ' + ACCESS_TOKEN}})
    .then(response => response.json()) //display only top 3 results
    .then(songsJSON => {
        topThreeTracks.innerHTML = "";
        //getting first 3
        if(songsJSON['tracks']['items'].length > 0){
            playlists.style.display = "block";
            playlistViewHeader.style.display = "block";
            addButton.style.display ="block";
            document.getElementById("searchBox").style.marginTop = "0px";
            for (var i = 0; i < 3; i++){
                track = songsJSON['tracks']['items'][i]['name'];
                artist = songsJSON['tracks']['items'][i]['artists'][0]['name'];
                trackID = songsJSON['tracks']['items'][i]['id'];
                const song = document.createElement('li');
                song.setAttribute('id',trackID);
                song.setAttribute('class','top3');
                song.innerHTML = track + " - " + artist;
                song.onclick = function() {trackSelected(this.id)};
                topThreeTracks.append(song);
            }
        }
        else {
            const noSongMessage = document.createElement('p');
            noSongMessage.setAttribute('class','noSongMessage');
            noSongsMessageList = ['nothing here, search again!',
                                  'OHNO! search again?',
                                  'nothing here, try again!',
                                  'mmMm, let\'s search again!',
                                  'oops! try again maybe!'];
            noSongMessage.innerHTML = noSongsMessageList[Math.floor(Math.random() * noSongsMessageList.length)];
            topThreeTracks.append(noSongMessage);
            
            document.getElementById("searchBox").style.marginTop = "50px";
            noSongMessage.style.marginTop="25px";
            noSongMessage.style.paddingTop="5px";
            playlists.style.display = "none";
            playlistViewHeader.style.display = "none";
            addButton.style.display ="none";
        }
    }); 
}, false);

function trackSelected(trackID){
    var trackElement = document.getElementById(trackID);
    trackSearch.value = trackElement.innerHTML;
    selectedSongID = trackID;
    console.log("Selected Song ID: " + selectedSongID);
}


chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    /*re-initialising access_token as when 2 requests are made for the same url, 
    it cannot fetch access_token value due to the async nature of javascript*/
    ACCESS_TOKEN = ACCESS_TOKEN; 
    let url = tabs[0].url;
    console.log("Current URL: " + url);
    if(url.includes("https://www.youtube.com/watch?")){
        // console.log("raw TITLE: " +tabs[0].title);
        title = tabs[0].title;
        title = title.toLowerCase();
        //cleaning the title of the video
        removeWords = ['youtube', ' - youtube','|','+','video', 'studio','music video','music','Official Video - YouTube','Official Video','(official video)',
                'Official Video w// Lyrics','24 hour version', '(Official Audio) - YouTube', 'w/', '(explicit)',
                ' | official music video','official music video', 'audio','-audio', ' - audio ',
                'featuring', 'official music video','(official music video)', '(acoustic cover)','starring -','- starring',
                '- cover','cover - ', '(official)',  ' - ', ' -', '- ',
                'official', 'music video', 'official video', 'original video','(audio)','audio only', 'lyrics video',
                '- lyrics',  'lyrics', '(lyrics)','(official lyric video)','lyric','ft. ' ,'cover', 'original cover','  ','   '];
        
        for(var i =0; i<removeWords.length;i++){
            title = title.replaceAll(removeWords[i].toLowerCase()," ");
        }

        title = title.trim().replace(/\(\d+\)/g, "");
        title = title.replaceAll('(','').replaceAll(')','').replaceAll('[','').replaceAll(']','').replaceAll('"','');
        title = title.replaceAll('( )','').replaceAll('[ ]','').replaceAll('()',"").replaceAll('[]','').replaceAll('[  ]','');
        title = title.trim();
        // console.log("cleaned title= " +  title);
        trackSearch.value = title;

        if(title != undefined){
            fetch("https://api.spotify.com/v1/search?q=" + encodeURI(title) + "&type=track",
            {headers: {'Authorization': 'Bearer ' + ACCESS_TOKEN}})
            .then(response => response.json()) //display only top 3 results
            .then(songsJSON => {
                topThreeTracks.innerHTML = "";
                //getting first 3
                try{
                    if(songsJSON['tracks']['items'].length > 0){
                        playlists.style.display = "block";
                        playlistViewHeader.style.display = "block";
                        addButton.style.display ="block";
                        document.getElementById("searchBox").style.marginTop = "0px";
                        for (var i = 0; i < 3; i++){
                            track = songsJSON['tracks']['items'][i]['name'];
                            artist = songsJSON['tracks']['items'][i]['artists'][0]['name'];
                            trackID = songsJSON['tracks']['items'][i]['id'];
                            const song = document.createElement('li');
                            song.setAttribute('id',trackID);
                            song.setAttribute('class','top3');
                            song.innerHTML = track + " - " + artist;
                            song.onclick = function() {trackSelected(this.id)};
                            topThreeTracks.append(song);
                        }
                    }
                    else {
                        const youtubeSongMessage = document.createElement('p');
                        youtubeSongMessage.setAttribute('class','noSongMessage');
                        youtubeSongMessage.innerHTML = 'no results,modify the title and try!';
                        youtubeSongMessage.style.fontSize = '12px';
                        topThreeTracks.append(youtubeSongMessage);
                        }
                }
                catch(err){
                    const needToClick = document.createElement('p');
                    needToClick.setAttribute('class','noSongMessage');
                    needToClick.innerHTML = 'click to search!';
                    needToClick.style.fontSize = '15px';
                    needToClick.style.marginLeft='38px';
                    topThreeTracks.append(needToClick);
                }
            }); 
        }
    }
});