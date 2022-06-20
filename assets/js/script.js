// setting up headers to work with eBird
var myHeaders = new Headers();
myHeaders.append("X-eBirdApiToken", "or9hiuus7eg7");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

var loadMoreBtnEl = document.querySelector("#load-more-btn");
var searchResultsEl = document.querySelector("#search-results-display");
var searchResults = null;
var displayStartIndex = 0;
var displayEndIndex = 20;

// having api keys out in the open is, generally, a security risk
// however, these keys can only request data, not send it to the servers we're communicating with
// and it doesn't cost me any money to be making those fetch requests
// i suppose i could teach myself some backend js to hide them

function getCoordinates(location) {
    // reformat text
    var locationFormatted = location.replace(" ", "-").toLowerCase();
    // TODO: Allow country selection
    var country = "US";

    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${locationFormatted},${country}&appid=39a500d5662d1686e6e49030185b149b`)
    .then(response => {
        return response.json();
    })
    .then(data => {
        // data is returned as an object inside an array, i think to account for cities with the same name
        var lat = data[0].lat;
        var lon = data[0].lon;
        
        getSightings(lat, lon);
    });
};

// hardcoded to get 20 observations
function getSightings(latitude, longitude) {
    // https://documenter.getpostman.com/view/664302/S1ENwy59#62b5ffb3-006e-4e8a-8e50-21d90d036edc
    // documentation of query parameters(? word?) in here
    // note that this fetch will return only one sighting for each species - no dupes
    fetch(`https://api.ebird.org/v2/data/obs/geo/recent?lat=${latitude}&lng=${longitude}`, requestOptions)
    .then(response => {
        return response.json();
    })
    .then(data => {
        // would also be good to give the option to change what the results are sorted by
        // this puts them in alphabetical order based on common names
        data.sort((a, b) => {
            if (a.comName < b.comName) {
                return -1;
            } else if (a.comName > b.comName) {
                return 1;
            } else {
                return 0;
            };
        });
        // searchResults is a global variable, so we can set its value here and refer to that object in multiple places
        // i think
        searchResults = data;
        displaySpecies(data);
    });
};

function displaySpecies(data) {
    // using displayStartIndex and displayEndIndex here to make this function easier to reuse
    for (var i = displayStartIndex; i < displayEndIndex; i++) {
        var speciesEl = document.createElement("div");
        var comNameEl = document.createElement("h3");
        var sciNameEl = document.createElement("p");

        speciesEl.classList = "species";
        comNameEl.textContent = data[i].comName;
        sciNameEl.innerHTML = "<i>" + data[i].sciName + "</i>";

        speciesEl.appendChild(comNameEl);
        speciesEl.appendChild(sciNameEl);

        searchResultsEl.appendChild(speciesEl);
    };
};

loadMoreBtnEl.addEventListener("click", function() {
    // move the indexes up
    displayStartIndex += 20;
    displayEndIndex += 20;

    // keep the page from trying to make elements with data that doesnt exist
    // remember, displaySpecies() stops at the index one less than displayEndIndex
    if (displayEndIndex >= searchResults.length) {
        displayEndIndex = searchResults.length;
        loadMoreBtnEl.setAttribute("disabled", true);
    };

    displaySpecies(searchResults);
});

// TODO: Capture data from form
getCoordinates("Salt Lake City");