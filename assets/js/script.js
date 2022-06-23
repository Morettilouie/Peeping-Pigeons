// setting up headers to work with eBird
var myHeaders = new Headers();
myHeaders.append("X-eBirdApiToken", "or9hiuus7eg7");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

// having api keys out in the open is, generally, a security risk
// however, these keys can only request data, not send it to the servers we're communicating with
// and it doesn't cost me any money to be making those fetch requests
// i suppose i could teach myself some backend js to hide them

var searchResultsEl = document.querySelector("#search-results-display");
var searchResults = null;
var pageIndex = 0;

// Modal elements
var modalEl = document.querySelector("#modal");
var modalContentEl = document.querySelector("#modal-content");
var closeModalEl = document.querySelector(".close");

// Page button elements
var nextPage = document.querySelector("#next-page");
var prevPage = document.querySelector("#prev-page");

function getCoordinates(city, country) {
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city},${country}&appid=39a500d5662d1686e6e49030185b149b`)
    .then(response => {
        return response.json();
    })
    .then(data => {
        // data is returned as an object inside an array, i think to account for cities with the same name
        var lat = data[0].lat;
        var lon = data[0].lon;

        localStorage.setItem("peepingpigeons", city);
        
        getSightings(lat, lon);
    })
    .catch(() => {
        modalEl.style.display = "flex";
    });
};

function getSightings(latitude, longitude) {
    // https://documenter.getpostman.com/view/664302/S1ENwy59#62b5ffb3-006e-4e8a-8e50-21d90d036edc
    // documentation of query parameters(? word?) in here
    // note that this fetch will return only one sighting for each species - no dupes
    fetch(`https://api.ebird.org/v2/data/obs/geo/recent?lat=${latitude}&lng=${longitude}`, requestOptions)
    .then(response => {
        return response.json();
    })
    .then(data => {
        // TODO: Allow user to change what the results are sorted by
        // this puts them in alphabetical order based on scientific names
        data.sort((a, b) => {
            if (a.sciName < b.sciName) {
                return -1;
            } else if (a.sciName > b.sciName) {
                return 1;
            } else {
                return 0;
            };
        });
        // searchResults is a global variable, so we can set its value here and refer to that object in multiple places
        searchResults = data;
        
        setPage(0);

        displaySpecies();
    });
};

function displaySpecies() {
    // putting this up here rather than with the event listeners
    searchResultsEl.innerHTML = "";

    var startArrIndex = pageIndex * 20;
    var endArrIndex = startArrIndex + 20;

    if (endArrIndex > searchResults.length) {
        endArrIndex = searchResults.length
    };

    for (var i = startArrIndex; i < endArrIndex; i++) {
        var speciesEl = document.createElement("div");
        var comNameEl = document.createElement("h3");
        var sciNameEl = document.createElement("p");

        speciesEl.classList = "species";
        comNameEl.textContent = searchResults[i].comName;
        sciNameEl.innerHTML = "<i>" + searchResults[i].sciName + "</i>";

        speciesEl.appendChild(comNameEl);
        speciesEl.appendChild(sciNameEl);

        searchResultsEl.appendChild(speciesEl);
    };
};

function setPage(integer) {
    var maxPageIndex = Math.floor(searchResults.length / 20);

    if (integer === 1) {
        pageIndex += 1;
    } else if (integer === -1) {
        pageIndex -= 1;
    };

    // data validation
    if (pageIndex <= 0) {
        pageIndex = 0;
        prevPage.disabled = true;
    } else if (pageIndex >= maxPageIndex) {
        pageIndex = maxPageIndex;
        nextPage.disabled = true;
    } else {
        prevPage.disabled = false;
        nextPage.disabled = false;
    };

    displaySpecies();
};

function loadPage() {
    var cityName = localStorage.getItem("peepingpigeons");

    if (!cityName) {
        return false;
    };

    // TODO: Allow country selection
    var countryCode = "US";

    getCoordinates(cityName, countryCode);
};

// when the submit button is clicked:
// the search value will be saved in localStorage
// when the page is opened, the value from localStorage will be read and displayed

// Close the modal
var closeModal = function() {
    modalEl.style.display = "none";
};

var outsideClose = function(e) {
    if (e.target !== modalContentEl) {
        modal.style.display = "none";
    };
};

// page navigation
nextPage.addEventListener("click", function() {
    setPage(1);
});

prevPage.addEventListener("click", function() {
    setPage(-1);
});

closeModalEl.addEventListener("click", closeModal);
window.addEventListener("click", outsideClose);

// the target of a submit event is the form the button is in, not the button itself
// weird but what can you do
document.querySelector("#user-form").addEventListener("submit", function(event) {
    event.preventDefault();

    var cityName = document.querySelector("#city-name").value.toLowerCase();
    // TODO: Allow country selection
    var countryCode = "US";

    getCoordinates(cityName, countryCode);
});

loadPage();