var resultsPlaceholder = document.getElementById('results');

document.querySelector('#sign-out').addEventListener('click', function () {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success') window.close();
    });
});

chrome.extension.onMessage.addListener(function (message, messageSender, sendResponse) {
    if (message != null) {
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
    console.log("Searching for songs..." + document.getElementById('query').value)
    chrome.runtime.sendMessage({ message: 'search', 'data': document.getElementById('query').value })
}, false);