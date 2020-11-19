var resultsPlaceholder = document.getElementById('results');
var displayName = document.getElementById('displayName');
var playlists = document.getElementById("playlists");
var playlistViewHeader = document.getElementById("playlist-view-header");
var searchInput = document.getElementById("query");

function getToken(){
    chrome.storage.sync.get('access_token', result => {
        console.log("ACCESS_TOKEN: " + result['access_token']);
        ACCESS_TOKEN  = result['access_token'];
        if (ACCESS_TOKEN != undefined) {
            getUserName(ACCESS_TOKEN);
        }
    });
}

function getLastSearch(){
    chrome.storage.sync.get('last_search', result => {
        console.log("Last Search Query: " + result['last_search']['selectionText']);
        var query  = result['last_search']['selectionText'];
        searchInput.value = query;
        chrome.runtime.sendMessage({ message: 'search', 'data': query })
    });
}

function  getUserName(ACCESS_TOKEN){
    fetch('https://api.spotify.com/v1/me', 
        { headers: {'Authorization':'Bearer '+ ACCESS_TOKEN}
    }).then(response => response.json())
    .then(data => {
        displayName.innerHTML = data.display_name;
        getPlaylists(ACCESS_TOKEN, data.id);
        getLastSearch();
        return data.display_name;
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

    if(query!=null && query!=' '&& query.trim().length>0 && query!=undefined){
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
                                var track = songsJSON['tracks']['items'][i]['name'];
                                var artist = songsJSON['tracks']['items'][i]['artists'][0]['name'];
                                var trackID = songsJSON['tracks']['items'][i]['id'];
                                // var songLink = songsJSON['tracks']['items'][i]['external_urls']['spotify'];
                                if(i==0){selectedSongID = trackID;} //setting first result as selectedsong by default
                                top3songs.push(trackID);
                                const song = document.createElement('li');
                                song.setAttribute('id',trackID);
                                song.setAttribute('class','top3');
                                // song.setAttribute('onclick',songLink);
                                song.innerHTML = track + " - " + artist;
                                song.onclick = function() {trackSelected(this.id)};
                                topThreeTracks.append(song);
                                playlistViewHeader.innerHTML = "select one or more playlists to add to:";
                            }
                        }
                    }else {
                        trackSearch.value = query;
                        const noSongMessage = document.createElement('p');
                        noSongMessage.setAttribute('class','noSongMessage');
                        noSongMessage.innerHTML= "modify search and try again!";
                        noSongMessage.style.fontSize = '12px';
                        topThreeTracks.append(noSongMessage);
                        playlistViewHeader.innerHTML = "ownded playlists:";
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
    }else{
        playlistViewHeader.innerHTML = "owned playlists:";
        topThreeTracks.innerHTML = '';
    }
}

/*function to get append liked playlist to the list of displayed playlists*/
function likedSongsDisplay(){
    let likedSongsID = 'liked-songs';
    ownedPlaylists.push('Liked Songs');
    var each_playlist = document.createElement("div");
    each_playlist.setAttribute("id", likedSongsID);
    each_playlist.setAttribute("class", "singlePlaylist");
    var playlist_cover = document.createElement("img");
    playlist_cover.src = './../images/liked_songs.png';;
    playlist_cover.width = "90";
    playlist_cover.height ="90";
    playlist_cover.setAttribute('class','playlist-cover');
    var playlist_name = document.createElement("p");
    playlist_name.setAttribute('class','playlist-name');
    playlist_name.appendChild(document.createTextNode('Liked Songs'));
    // playlist_name.innerHTML = playlist_name;
    each_playlist.appendChild(playlist_cover);
    each_playlist.appendChild(playlist_name);
    playlists.appendChild(each_playlist);
    each_playlist.onclick = () => selectPlaylist(ACCESS_TOKEN, likedSongsID);
}

/*in one call, maximum number of playlists items returned is 50. If .length == 50, 
make another call using offset to get the next 50 items, as no. of playlists can be > 50*/

/*Get all playlists where user is the creater or where playlist collaborative value is true*/
function getPlaylists(ACCESS_TOKEN, user_id){
    document.getElementById("searchBox").style.marginTop = "0px";
    fetch('https://api.spotify.com/v1/me/playlists?limit=50',
        { headers: {'Authorization':'Bearer '+ACCESS_TOKEN}
    }).then(response=>response.json())
    .then(data => {
        console.log("No. of Playlists" + Object.keys(data.items).length);
        console.log("User ID: " + user_id);
        likedSongsDisplay();
        data.items.forEach(playlist => {
            if(playlist.owner.id == user_id){ //this will be the final list of playlists displayed as user can add songs to only these playlists
                ownedPlaylists.push(playlist.name);
                var each_playlist = document.createElement("div");
                each_playlist.setAttribute("id", playlist.id);
                each_playlist.setAttribute("class", "singlePlaylist");
                var playlist_cover = document.createElement("img");
                try{
                    playlist_cover.src = playlist.images[0].url;
                }catch(err){
                    playlist_cover.src = './../images/empty_playlist_cover.png';
                }
                playlist_cover.width = "90";
                playlist_cover.height ="90";
                playlist_cover.setAttribute('class','playlist-cover');
                var playlist_name = document.createElement("p");
                playlist_name.setAttribute('class','playlist-name');
                playlist_name.appendChild(document.createTextNode(playlist.name));
                each_playlist.appendChild(playlist_cover);
                each_playlist.appendChild(playlist_name);
                playlists.appendChild(each_playlist);
                each_playlist.onclick = () => selectPlaylist(ACCESS_TOKEN, playlist.id);
            }
        });
    })
}

searchPlaylist.onkeyup = function filterPlaylist(){
    var input = document.getElementById("searchPlaylist");
    var filter = input.value;
    var single_playlist = document.getElementsByClassName('singlePlaylist');
    for (var i = 0; i < single_playlist.length; i++){
        var p_tag = single_playlist[i].getElementsByTagName("p")[0];
        var p_value = p_tag.textContent || p_tag.innerText;
        if(p_value.toLowerCase().indexOf(filter.toLowerCase()) > -1){
            single_playlist[i].style.display = "";
        }else{
            single_playlist[i].style.display = "none";
        }
    }
}

function selectPlaylist(ACCESS_TOKEN, playlist_id){
    // console.log("Playlist Selected: "  + playlist_id  + " AT: " + ACCESS_TOKEN);
    var current_playlist = document.getElementById(playlist_id);
    if(finalPlaylists.includes(playlist_id)){
        current_playlist.style.background="none";
        finalPlaylists = finalPlaylists.filter(pl => pl !== playlist_id);
    }
    else{
        current_playlist.style.background="rgba(29,185,84,0.8)";
        finalPlaylists.push(playlist_id);
    }
    // console.log("final list of selected playlists: " + finalPlaylists);
    if(finalPlaylists.length!=0){
        addButtonText.innerHTML = "ADD TO " + finalPlaylists.length + " PLAYLIST(S)";
        addButtonText.style.fontSize = "13px";
    } else if(finalPlaylists.length == 0){
        addButtonText.innerHTML = "ADD";
        addButtonText.style.fontSize = "18px";
    }
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
    let url = tabs[0].url;
    console.log("Current URL: " + url);
    if(url.includes("https://www.youtube.com/watch?")){
        title = tabs[0].title;
        title = title.toLowerCase();
        //cleaning the title of the video
        removeWords = ['youtube', ' - youtube','|','+','&','video', 'featuring', 'feat.',  'Watch Now', '!', 'by',
                'studio','music video','music','Official Video - YouTube','Official Video','(official video)',
                'Official Video w// Lyrics','24 hour version', '(Official Audio) - YouTube', 'w/', '(explicit)',
                ' | official music video','official music video', 'audio','-audio', ' - audio ', 'audio version', 
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
    console.log("Final playlists to add to: " + finalPlaylists);
});