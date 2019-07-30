//Relevant DOM Manipulation //

const stationContainer = document.createElement("ul");
stationContainer.setAttribute("id", "stationContainer");
const pageBody = document.querySelector("body");
pageBody.append(stationContainer);
let stationMarker = document.querySelectorAll("div");
let allStationData = [];

//Fetches initial station data and sends it to getUnique //
function fetchData() {
  // fetch('https://cors-anywhere.herokuapp.com/http://lapi.transitchicago.com/api/1.0/ttpositions.aspx?key=ba92028c4ac34d1c89d827de312bb41d&rt=red&outputType=JSON', {mode: 'cors'})
  fetch(
    "https://cors-anywhere.herokuapp.com/https://data.cityofchicago.org/resource/8pix-ypme.json",
    { mode: "cors" }
  ) //station name and id
    .then(resp => resp.json())
    .then(parsedJson => getUnique(parsedJson));
}

//Removes duplicate station names and sends to fetchNewData
function getUnique(arr, station_descriptive_name) {
  const unique = arr
    .map(e => e["station_descriptive_name"])
    .map((e, i, final) => final.indexOf(e) === i && i)
    .filter(e => arr[e])
    .map(e => arr[e]);
  fetchNewData(unique);
}

function fetchNewData(array) {
  var newData = [];
  for (var i = 0; i < array.length; i++) {
    var station_name = fetchProperty(array[i], "station_descriptive_name");
    var map_id = fetchProperty(array[i], "map_id");
    var blue = fetchProperty(array[i], "blue");
    var brown = fetchProperty(array[i], "brn");
    var green = fetchProperty(array[i], "g");
    var orange = fetchProperty(array[i], "o");
    var purple = fetchProperty(array[i], "p");
    var purpleExpress = fetchProperty(array[i], "pexp");
    var pink = fetchProperty(array[i], "pnk");
    var red = fetchProperty(array[i], "red");
    var yellow = fetchProperty(array[i], "y");
    var tempJSON = {};
    tempJSON.station_descriptive_name = station_name;
    tempJSON.map_id = map_id;
    tempJSON.blue = blue;
    tempJSON.brn = brown;
    tempJSON.g = green;
    tempJSON.o = orange;
    tempJSON.p = purple;
    tempJSON.pexp = purpleExpress;
    tempJSON.pnk = pink;
    tempJSON.red = red;
    tempJSON.y = yellow;
    newData.push(tempJSON);
  }
  allStationData = newData;

  renderStations(newData);
}
fetchData();

//Renders list of stations //
function renderStations(arr) {
  for (let station of arr) {
    let station_div = document.createElement("div");
    station_div.class = station;
    station_div.setAttribute("id", station.map_id);
    station_div.innerHTML = station.station_descriptive_name;

    station_div.addEventListener(
      "click",
      event => grabArrivals(event, station),
      {
        once: true
      }
    );
    stationContainer.append(station_div);
  }
}

function grabArrivals(event, station) {
  event.preventDefault();
  // event.currentTarget.removeEventListener(event.type, arguments.callee);
  fetch(
    "https://cors-anywhere.herokuapp.com/http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=ba92028c4ac34d1c89d827de312bb41d&max=6&mapid=" +
      station.map_id +
      "&outputType=JSON",
    { mode: "cors" }
  )
    .then(resp => resp.json())
    .then(arrivals => showArrivals(arrivals));
}

function showArrivals(arrivals) {
  let stationDiv = document.getElementById(arrivals.ctatt.eta[0].staId);
  let title = stationDiv.firstChild;
  title.addEventListener("click", event => clearDiv(event, stationDiv), {
    once: true
  });

  let arrivalCard = document.createElement("ul");
  arrivalCard.setAttribute("class", "arrivalCard");
  for (arrival of arrivals.ctatt.eta) {
    let arrivalListing = document.createElement("p");
    let currentDate = new Date();
    let currentTime = currentDate.getTime();
    let etaDate = new Date(arrival.arrT);
    let etaTime = etaDate.getTime();
    let arrivalTime = Math.round((etaTime - currentTime) / 1000 / 60);

    arrivalListing.innerHTML = `To ${arrival.destNm} | ETA: ${
      arrivalTime >= 0 && arrivalTime <= 2
        ? "Approaching"
        : arrivalTime + " " + "minutes" && arrivalTime < 0
        ? "Delayed"
        : arrivalTime + " " + "minutes"
    }`;

    arrivalCard.append(arrivalListing);
    stationDiv.append(arrivalCard);
  }
  let stationNumber = stationDiv.id;
  let commentContainer = document.createElement("ul");
  fetch("http://localhost:3000/api/v1/comments/")
    .then(resp => resp.json())
    .then(comments =>
      comments.forEach(comment => {
        if (comment.stationNum == stationNumber) {
          let commentLi = document.createElement("p");
          commentLi.innerHTML = comment.content;

          commentContainer.append(commentLi);
          arrivalCard.append(commentContainer);
        }
      })
    );
  let commentForm = document.createElement("form");
  let commentInput = document.createElement("input");
  let commentButton = document.createElement("button");
  commentButton.innerHTML = "submit";
  commentInput.placeholder = "What's new at this station?";
  commentForm.append(commentInput, commentButton);
  arrivalCard.append(commentForm);
  commentForm.addEventListener("submit", event =>
    submitComment(event, commentInput, stationNumber)
  );
  // closeButton = document.createElement("button");
  // closeButton.innerHTML = "X";
  // stationDiv.append(closeButton);
}

// function showComments(comments, stationNumber) {
//   comments.forEach(comment => {
//     if (comment.stationNum == stationNumber) {
//       let commentLi = document.createElement("li");
//       commentLi.innerHTML = comment.content;
//
//       arrivalCard.append(commentLi);
//     }
//   });
// }

function clearDiv(event, stationDiv) {
  event.preventDefault();
  stationDiv.removeChild(stationDiv.childNodes[1]);
}
function submitComment(event, commentInput, stationNumber) {
  event.preventDefault();

  fetch("http://localhost:3000/api/v1/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      content: commentInput.value,
      stationNum: stationNumber
    })
  });
  let newComment = document.createElement("p");
  newComment.innerHTML = commentInput.value;
  event.target.nextSibling.append(newComment);

  event.target.reset();
}
//lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=ba92028c4ac34d1c89d827de312bb41d&max=6&mapid=40360&outputType=JSON
//Helper function for fetchNewData
function fetchProperty(data, property) {
  for (var key in data) {
    if (key === property) {
      return data[key];
    }
  }
}

function filterAll(c) {
  if (c == "all") {
    stationContainer.innerHTML = "";
    fetchData();
  }
}
function filterOrange(c) {
  renderOrangeStations(allStationData);
}

function filterPink(c) {
  renderPinkStations(allStationData);
}

function filterGreen(c) {
  renderGreenStations(allStationData);
}
function filterRed(c) {
  renderRedStations(allStationData);
}
function filterBrown(c) {
  renderBrownStations(allStationData);
}
function filterPurple(c) {
  renderPurpleStations(allStationData);
}
function filterBlue(c) {
  renderBlueStations(allStationData);
}
function filterYellow(c) {
  renderYellowStations(allStationData);
}

function renderOrangeStations() {
  let orangeTrains = allStationData.filter(station => station.o);
  stationContainer.innerHTML = "";
  renderStations(orangeTrains);
}
function renderPinkStations() {
  let pinkTrains = allStationData.filter(station => station.pnk);
  stationContainer.innerHTML = "";
  renderStations(pinkTrains);
}
function renderGreenStations() {
  let greenTrains = allStationData.filter(station => station.g);
  stationContainer.innerHTML = "";
  renderStations(greenTrains);
}

function renderRedStations() {
  let redTrains = allStationData.filter(station => station.red);
  stationContainer.innerHTML = "";
  renderStations(redTrains);
}
function renderBrownStations() {
  let brownTrains = allStationData.filter(station => station.brn);
  stationContainer.innerHTML = "";
  renderStations(brownTrains);
}
function renderPurpleStations() {
  let purpleTrains = allStationData.filter(
    station => station.p || station.pexp
  );
  stationContainer.innerHTML = "";
  renderStations(purpleTrains);
}
function renderBlueStations() {
  let blueTrains = allStationData.filter(station => station.blue);
  stationContainer.innerHTML = "";
  renderStations(blueTrains);
}
function renderYellowStations() {
  let yellowTrains = allStationData.filter(station => station.y);
  stationContainer.innerHTML = "";
  renderStations(yellowTrains);
}

// Event Listeners//

// arrT - arrival time;
// staId - station id
// staNm - station name
// isApp - approaching?
// rt - route
// http://lapi.transitchicago.com/api/1.0/ttpositions.aspx?key=4ba28f6b2b8843bf9cef1c0fcc05f874&rt=red&outputType=JSON
// http://lapi.transitchicago.com/api/1.0/ttpositions.aspx?key=ba92028c4ac34d1c89d827de312bb41d&rt=red&outputType=JSON
//
//
