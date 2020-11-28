let topThreeTracks = document.getElementById('top-three-tracks');
let trackSearch = document.getElementById('query');
let displayName = document.getElementById('displayName');
let playlists = document.getElementById("playlist-scroll");
let playlistViewHeader = document.getElementById("playlist-view-header");
let searchPlaylist = document.getElementById("searchPlaylist");
let addButtonText = document.getElementById("add-button-text");
let trackPreview = document.getElementById("track-preview");
let resultBlock = document.getElementById("results");

var selectedSongID ='';
var selectedTrackURI='';
var ownedPlaylists = [];
var finalPlaylists = [];
let top3songs = [];
let highlightedText = '';
let ACCESS_TOKEN='';

var notifications = new Notyf(
    { 
        duration: 2000,
        dismissible: true,
        ripple: true,
        icon: true
    }
);

var toasts = new Notyf({
    types: [
      {
        duration: 1500,
        dismissible: true,
        type: 'canAdd',
        background: '#1DB954'
      },

      {
        duration: 2500,
        dismissible: true,
        type: 'cannotAdd',
        background: '#323232'
      }
    ]
});
  

function getToken(){
    chrome.storage.sync.get('access_token', result => {
        console.log("ACCESS_TOKEN: " + result['access_token']);
        ACCESS_TOKEN  = result['access_token'];
        if (ACCESS_TOKEN != undefined && ACCESS_TOKEN!='' && ACCESS_TOKEN.toString().trim().length > 0) {
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
                window.close();
            });
        }
        else{
            if(data.display_name.length > 22){
                displayName.innerHTML = data.display_name.toString().substring(0, 20) + "..";
            }
            else{
                displayName.innerHTML = data.display_name;
            }
            resultBlock.style.marginTop = '60px';
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
        chrome.storage.sync.get('access_token', result => {
            ACCESS_TOKEN  = result['access_token'];
        });
    }

    if(query!=null && query!=' '&& query.trim().length>0 && query!=undefined){
        fetch("https://api.spotify.com/v1/search?q=" + encodeURI(query) + "&type=track",
            {headers: {'Authorization': 'Bearer ' + ACCESS_TOKEN}})
        .then(response => response.json()) 
        .then(songsJSON => {
            trackSearch.value = query;
            topThreeTracks.innerHTML = "";
            trackPreview.innerHTML = null;
            resultBlock.style.marginTop = '80px';
            top3songs.length = 0; 
            try{
                if(songsJSON['tracks']!=undefined){
                    if(songsJSON['tracks']['items'].length > 0){
                        document.getElementById("searchBox").style.marginTop = "0px";
                        if(songsJSON['tracks']['items'].length >= 3 ){
                            topThreeTracks.style.height = "88px";
                        }else{
                            topThreeTracks.style.height = "auto";
                        }
                        for (let i = 0; i < songsJSON['tracks']['items'].length; i++){
                            if(songsJSON['tracks']['items'][i]!=undefined){
                                var track = songsJSON['tracks']['items'][i]['name'];
                                var artist = songsJSON['tracks']['items'][i]['artists'][0]['name'];
                                var trackID = songsJSON['tracks']['items'][i]['id'];
                                let trackURI = songsJSON['tracks']['items'][i]['uri'];
                                // var songLink = songsJSON['tracks']['items'][i]['external_urls']['spotify'];
                                if(i==0){
                                    selectedSongID = trackID;
                                    selectedTrackURI = trackURI;
                                } //setting first result as selectedsong by default
                                top3songs.push(trackID);
                                const song = document.createElement('li');
                                song.setAttribute('id',trackID);
                                song.setAttribute('class','top3');
                                // song.setAttribute('onclick',songLink);
                                song.innerHTML = track + " - " + artist;
                                song.onclick = function() {trackSelected(this.id, trackURI)};
                                topThreeTracks.append(song);
                                playlistViewHeader.innerHTML = "select one or more playlists to add to:";
                            }
                        }
                    }else {
                        trackSearch.value = query;
                        resultBlock.style.marginTop = '80px';
                        const noSongMessage = document.createElement('p');
                        noSongMessage.setAttribute('class','noSongMessage');
                        noSongMessage.innerHTML= "modify search and try again!";
                        noSongMessage.style.fontSize = '12px';
                        noSongMessage.style.marginLeft = '14px';
                        topThreeTracks.style.height = "auto";
                        topThreeTracks.append(noSongMessage);
                        playlistViewHeader.innerHTML = "ownded playlists:";
                    }
                }else{
                    console.log("400 Status Error");
                    console.log("Error: " + songsJSON['error']['status']);
                    console.log("ACC" + ACCESS_TOKEN);
                    clickToSearchBlock();
                }
            } catch(err){
                trackSearch.value = query;
                console.log("Caught error :" + err + " while searching for: " + query);
                clickToSearchBlock();
            }
        });
    }else{
        playlistViewHeader.innerHTML = "owned playlists:";
        topThreeTracks.innerHTML = '';
        topThreeTracks.style.height = "auto";
        selectedSongID = '';
        selectedTrackURI = '';
        trackPreview.innerHTML = null;
        resultBlock.style.marginTop = '60px';
        for(let i=0;i<finalPlaylists.length;i++){
            var currPlaylist  = document.getElementById(finalPlaylists[i]);
            currPlaylist.style.background="none";
        }
        finalPlaylists.length = 0;
        addButtonText.innerHTML = "ADD";
        addButtonText.style.fontSize = "18px";
    }
}

function clickToSearchBlock(){
    resultBlock.style.marginTop = '80px';
    const needToClick = document.createElement('p');
    needToClick.setAttribute('class','noSongMessage');
    needToClick.innerHTML = 'click to search!';
    needToClick.style.fontSize = '15px';
    needToClick.style.marginLeft='38px';
    topThreeTracks.style.height = "auto";
    topThreeTracks.append(needToClick);
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
    each_playlist.onclick = () => selectPlaylist(likedSongsID);
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
                each_playlist.onclick = () => selectPlaylist(playlist.id);
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

function selectPlaylist(playlist_id){
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

function createPreview(trackID){
    trackPreview.innerHTML = null;
    trackPreview.style.display = 'initial';
    var preview = document.createElement('iframe');
    preview.setAttribute("width", 290);
    preview.setAttribute("height", 80);
    preview.setAttribute("frameborder", "0");
    preview.setAttribute("allowtransparency", "true");
    preview.setAttribute("allow", "encrypted-media");
    preview.src = "https://open.spotify.com/embed/track/" + trackID;
    trackPreview.appendChild(preview);
}

function trackSelected(trackID, trackURI){
    createPreview(trackID);
    let trackElement = document.getElementById(trackID);
    trackSearch.value = trackElement.innerHTML;
    selectedSongID = trackID;
    selectedTrackURI = trackURI;
    console.log("track selected URI: " + selectedTrackURI);
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
                '- cover','cover - ', '(official)',  ' - ', ' -', '- ', '(teaser)','teaser', '//','/', '(Full Album)',
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
        window.close();
    });
});

document.querySelector('#add-song').addEventListener('click', function () {
    console.log("Selected song value: " + selectedSongID);
    console.log("Final playlists to add to: " + finalPlaylists);
    console.log("Access Token: " + ACCESS_TOKEN);

    if((selectedSongID!=''  && selectedSongID!=undefined && selectedSongID!=null) && (finalPlaylists.length > 0) 
        && (ACCESS_TOKEN!=undefined && ACCESS_TOKEN!='' && ACCESS_TOKEN!=null && ACCESS_TOKEN!=' ')){
        console.log
        const finalSongName = document.getElementById(selectedSongID).innerHTML;
        // toasts.open({
        //     type: 'canAdd',
        //     message: "Adding '" + finalSongName + "' to " + finalPlaylists.length + " playlist(s)!"
        // })

        for(let i = 0; i < finalPlaylists.length; i++){
            let addingToPlaylistName = document.getElementById(finalPlaylists[i]).getElementsByTagName("p")[0].innerHTML;
            if(finalPlaylists[i]=='liked-songs'){
                fetch("https://api.spotify.com/v1/me/tracks?ids="+selectedSongID, {
                        method: 'PUT',
                        headers: { 'Authorization': 'Bearer ' + ACCESS_TOKEN}
                    }).then(response => {
                        console.log("added to liked-songs!");
                        toasts.open({
                            type: 'canAdd',
                            message: "Added to: "+ addingToPlaylistName +" Successfully!"
                        });
                    }).catch(err => notifications.error("Error occured while adding to Liked Songs, try again!")
                )
            }

            else{
                console.log("add for normal playlist"); 
                fetch("https://api.spotify.com/v1/playlists/"+finalPlaylists[i]+"/tracks?uris="+selectedTrackURI,{
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + ACCESS_TOKEN}
                }).then(response=> {
                    console.log("added to playlist: " + finalPlaylists[i]);                 
                    toasts.open({
                        type: 'canAdd',
                        message: "Added to: "+ addingToPlaylistName +" Successfully!"
                    });
                }).catch(err=> {
                    notifications.error("Error occured while adding to: " + addingToPlaylistName +", try again!");
                })
            }
        }         
    }
    
    else if((selectedSongID!='' && selectedSongID!=undefined && selectedSongID!=null) && (finalPlaylists.length == 0)){
        toasts.open({
            type: 'cannotAdd',
            message: "Select alteast one playlist!"
        })
    }
    
    else if((selectedSongID=='' || selectedSongID==undefined || selectedSongID==null) && (finalPlaylists.length > 0)){
        toasts.open({
            type: 'cannotAdd',
            message: "Search and select a song!"
        })
    }

    else if((selectedSongID=='' || selectedSongID==undefined || selectedSongID==null) && (finalPlaylists.length == 0)){
        notifications.error("no song /playlist selected");
    }
});