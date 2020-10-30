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

/* Stuff for the animated search bar */
$(document).ready(function () {

    var $searchTrigger = $('[data-ic-class="search-trigger"]'),
        $searchInput = $('[data-ic-class="search-input"]'),
        $searchClear = $('[data-ic-class="search-clear"]');

    $searchTrigger.click(function () {
        var $this = $('[data-ic-class="search-trigger"]');
        $this.addClass('active');
        $searchInput.focus();
    });

    $searchInput.blur(function () {
        if ($searchInput.val().length > 0) {
            return false;
        } else {
            $searchTrigger.removeClass('active');
        }
    });

    $searchClear.click(function () {
        $searchInput.val('');
    });

    $searchInput.focus(function () {
        $searchTrigger.addClass('active');
    });

});