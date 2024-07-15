var map = L.map('map').setView([37.8, -96], 4);

// Base Layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// Draw Control
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
    draw: false
});
map.addControl(drawControl);

// Event Listener for drawing
map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;

    // Get the selected color
    var color = document.getElementById('colorPicker').value;

    // Set the style for the drawn layer
    layer.setStyle({
        color: color
    });

    // Prompt the user for a message
    var message = prompt("Enter a message for this shape:");
    if (message) {
        layer.bindPopup(message);
    }

    drawnItems.addLayer(layer);
});

// Highlight Feature
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
}

// Reset Highlight
function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

// Zoom to Feature
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

// On Each Feature
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });

    if (feature.properties && feature.properties.description) {
        layer.bindPopup('<b>' + feature.properties.name + '</b><br>' + feature.properties.description);
    }
}

// Load GeoJSON Data
$.getJSON("states.geojson", function(statesData) {
    var statesLayer = L.geoJson(statesData, {
        style: {
            color: "#ff7800",
            weight: 2,
            opacity: 1
        },
        onEachFeature: onEachFeature
    }).addTo(map);

    var baseMaps = {
        "States": statesLayer
    };

    $.getJSON("counties.geojson", function(countiesData) {
        var countiesLayer = L.geoJson(countiesData, {
            style: {
                color: "#0078ff",
                weight: 1,
                opacity: 0.7
            },
            onEachFeature: onEachFeature
        });

        $.getJSON("cities.geojson", function(citiesData) {
            var citiesLayer = L.geoJson(citiesData, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng);
                },
                onEachFeature: onEachFeature
            });

            var overlayMaps = {
                "Counties": countiesLayer,
                "Cities": citiesLayer
            };

            L.control.layers(baseMaps, overlayMaps).addTo(map);
        });
    });
});

// Fetch Weather Alerts
function fetchWeatherAlerts() {
    $.getJSON('https://api.weather.gov/alerts/active', function(data) {
        data.features.forEach(function(feature) {
            var coords = feature.geometry.coordinates[0].map(function(coord) {
                return [coord[1], coord[0]];
            });
            var polygon = L.polygon(coords, {
                color: 'red',
                fillOpacity: 0.5
            }).addTo(map);

            var popupContent = '<b>' + feature.properties.headline + '</b><br>' + feature.properties.description;
            polygon.bindPopup(popupContent);
        });
    });
}

fetchWeatherAlerts();

// List of authorized users
var authorizedUsers = [
    { username: 'blaket05', password: '123456', role: 'admin'},
    { username: 'user1', password: 'user1123', role: 'drawer' },
    { username: 'user2', password: 'user2123', role: 'viewer' }
];

var currentUserRole = '';

function login() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Check if user is authorized
    var user = authorizedUsers.find(function(u) {
        return u.username === username && u.password === password;
    });

    if (user) {
        currentUserRole = user.role;
        document.getElementById('userRole').innerText = 'Logged in as: ' + user.role;
        configureDrawControl(user.role);
    } else {
        currentUserRole = 'viewer';
        document.getElementById('userRole').innerText = 'Login failed. Logged in as: viewer';
        configureDrawControl('viewer');
    }
}

function configureDrawControl(role) {
    // Remove existing draw control
    map.removeControl(drawControl);

    if (role === 'admin' || role === 'drawer') {
        drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems
            },
            draw: {
                polyline: {
                    shapeOptions: {
                        color: document.getElementById('colorPicker').value,
                        weight: 10
                    }
                },
                polygon: {
                    allowIntersection: false, // Restricts shapes to simple polygons
                    drawError: {
                        color: '#e1e100', // Color the shape will turn when intersects
                        message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                    },
                    shapeOptions: {
                        color: document.getElementById('colorPicker').value
                    }
                },
                rectangle: {
                    shapeOptions: {
                        color: document.getElementById('colorPicker').value
                    }
                },
                circle: {
                    shapeOptions: {
                        color: document.getElementById('colorPicker').value
                    }
                },
                marker: {}
            }
        });
    } else {
        drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems
            },
            draw: false
        });
    }

    // Add the updated draw control to the map
    map.addControl(drawControl);
}

// Initially disable all draw options
configureDrawControl('viewer');

// Load radar layer
var radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/1/1_1.png', {
    opacity: 0.5,
    zIndex: 10
}).addTo(map);
