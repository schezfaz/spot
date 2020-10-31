var resultsPlaceholder = document.getElementById('results');
var displayName = document.getElementById('displayName');

function getToken(){
    chrome.storage.sync.get('access_token', result => {
        console.log("ACCESS_TOKEN: " + result['access_token']);
        var ACCESS_TOKEN  = result['access_token'];
        if (ACCESS_TOKEN != undefined) getUserName(ACCESS_TOKEN);
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
    .then(data => displayName.innerHTML = data.display_name);
}

getToken();

document.querySelector('#sign-out').addEventListener('click', function () {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success') window.close();
    });
});



chrome.extension.onMessage.addListener(function (message, messageSender, sendResponse) {
    if (message != null) {
        if(message['type']=='displayName'){
            console.log("display name");
            displayName.innerHTML = message['data'];
        } 

        if (message['type'] == 'searchResp') {
            tableResp = '<table class="table table-dark"><thead><tr><th>Track</th><th>Artist</th></tr></thead><tbody>';
            for (var i = 0; i < message['data']['tracks']['items'].length; i++) {
                tableResp += "<tr><td>" + message['data']['tracks']['items'][i]['name'] + "</td>";
                tableResp += "<td>" + message['data']['tracks']['items'][i]['artists'][0]['name'] + "</td></tr>";
            }
            tableResp += "</tbody></table>"
            resultsPlaceholder.innerHTML = tableResp;
        }   
    }

        
});

document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    console.log("Searching for songs... " + document.getElementById('query').value)
    chrome.runtime.sendMessage({ message: 'search', 'data': document.getElementById('query').value })
}, false);