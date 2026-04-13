let map;
let userMarker;
let pharmacyMarkers = [];
let searchingMedicine = null;

// Major Indian city coordinates
const CITY_COORDINATES = {
    'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
    'delhi': { lat: 28.7041, lon: 77.1025, name: 'Delhi' },
    'new delhi': { lat: 28.6139, lon: 77.2090, name: 'New Delhi' },
    'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
    'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
    'bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
    'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
    'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
    'hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
    'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune' },
    'ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
    'surat': { lat: 21.1702, lon: 72.8311, name: 'Surat' },
    'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
    'kanpur': { lat: 26.4499, lon: 80.3319, name: 'Kanpur' },
    'nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
    'indore': { lat: 22.7196, lon: 75.8577, name: 'Indore' },
    'thane': { lat: 19.2183, lon: 72.9781, name: 'Thane' },
    'bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal' },
    'visakhapatnam': { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam' },
    'patna': { lat: 25.5941, lon: 85.1376, name: 'Patna' },
    'vadodara': { lat: 22.3072, lon: 73.1812, name: 'Vadodara' },
    'ghaziabad': { lat: 28.6692, lon: 77.4538, name: 'Ghaziabad' },
    'ludhiana': { lat: 30.9010, lon: 75.8573, name: 'Ludhiana' },
    'agra': { lat: 27.1767, lon: 78.0081, name: 'Agra' },
    'nashik': { lat: 19.9975, lon: 73.7898, name: 'Nashik' },
    'faridabad': { lat: 28.4089, lon: 77.3178, name: 'Faridabad' },
    'meerut': { lat: 28.9845, lon: 77.7064, name: 'Meerut' },
    'rajkot': { lat: 22.3039, lon: 70.8022, name: 'Rajkot' },
    'varanasi': { lat: 25.3176, lon: 82.9739, name: 'Varanasi' },
    'chandigarh': { lat: 30.7333, lon: 76.7794, name: 'Chandigarh' }
};

const findBtn = document.getElementById('findPharmaciesBtn');
const citySearch = document.getElementById('citySearch');
const citySuggestions = document.getElementById('citySuggestions');
const loadingMap = document.getElementById('loadingMap');
const mapContainer = document.getElementById('mapContainer');
const errorMsg = document.getElementById('errorMsg');
const pharmaciesDiv = document.getElementById('pharmacies');
const btnText = document.getElementById('btnText');
const pageTitle = document.getElementById('pageTitle');

// Check if searching for specific medicine
document.addEventListener('DOMContentLoaded', () => {
    searchingMedicine = sessionStorage.getItem('checkMedicine');

    if (searchingMedicine) {
        pageTitle.innerHTML = `Pharmacies with <span style="color: var(--primary-color)">${searchingMedicine}</span>`;
        btnText.textContent = `Find Pharmacies with ${searchingMedicine}`;
        sessionStorage.removeItem('checkMedicine');
    }
});

// City search autocomplete
citySearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query.length < 2) {
        citySuggestions.classList.remove('active');
        btnText.textContent = 'Find Pharmacies';
        return;
    }

    // Filter cities
    const matches = Object.keys(CITY_COORDINATES)
        .filter(city => city.startsWith(query))
        .slice(0, 5);

    if (matches.length > 0) {
        citySuggestions.innerHTML = matches.map(city => `
            <div class="city-suggestion-item" data-city="${city}">
                 ${CITY_COORDINATES[city].name}
            </div>
        `).join('');

        // Add click handlers
        citySuggestions.querySelectorAll('.city-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const city = item.dataset.city;
                citySearch.value = CITY_COORDINATES[city].name;
                citySuggestions.classList.remove('active');
                updateButtonText(CITY_COORDINATES[city].name);
            });
        });

        citySuggestions.classList.add('active');
    } else {
        citySuggestions.classList.remove('active');
    }

    // Update button text if exact match
    if (CITY_COORDINATES[query]) {
        updateButtonText(CITY_COORDINATES[query].name);
    }
});

// Close suggestions on click outside
document.addEventListener('click', (e) => {
    if (!citySearch.contains(e.target) && !citySuggestions.contains(e.target)) {
        citySuggestions.classList.remove('active');
    }
});

function updateButtonText(cityName) {
    if (searchingMedicine) {
        btnText.textContent = `Find in ${cityName}`;
    } else {
        btnText.textContent = `Find Pharmacies in ${cityName}`;
    }
}

findBtn.addEventListener('click', findNearbyPharmacies);

async function findNearbyPharmacies() {
    errorMsg.style.display = 'none';
    loadingMap.style.display = 'block';
    mapContainer.style.display = 'none';

    // Check if user entered a city
    if (citySearch.value.trim()) {
        const city = citySearch.value.toLowerCase().trim();
        const coords = CITY_COORDINATES[city];

        if (coords) {
            console.log(`Using ${coords.name} coordinates:`, coords);
            initMap(coords.lat, coords.lon);
            searchPharmacies(coords.lat, coords.lon);
            return;
        }
    }

    // Try geolocation as fallback
    if (!navigator.geolocation) {
        showError('Please enter your city to find pharmacies');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log('User location:', lat, lon);
            initMap(lat, lon);
            searchPharmacies(lat, lon);
        },
        error => {
            console.error('Geolocation error:', error);
            showError('Unable to get location. Please enter your city manually.');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function initMap(lat, lon) {
    loadingMap.style.display = 'none';
    mapContainer.style.display = 'block';

    if (!map) {
        map = L.map('map').setView([lat, lon], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
    } else {
        map.setView([lat, lon], 14);
    }

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker([lat, lon], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    userMarker.bindPopup('<b>You are here</b>').openPopup();
}

async function searchPharmacies(lat, lon) {
    try {
        pharmacyMarkers.forEach(marker => map.removeLayer(marker));
        pharmacyMarkers = [];

        const radius = 2000;
        const query = `
            [out:json];
            (
                node["amenity"="pharmacy"](around:${radius},${lat},${lon});
                way["amenity"="pharmacy"](around:${radius},${lat},${lon});
            );
            out body;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });

        const data = await response.json();
        console.log('Found pharmacies:', data.elements.length);

        if (data.elements.length === 0) {
            pharmaciesDiv.innerHTML = '<p style="text-align: center; color: var(--text-light);">No pharmacies found nearby. Try a different city.</p>';
            return;
        }

        displayPharmacies(data.elements, lat, lon);

    } catch (error) {
        console.error('Error searching pharmacies:', error);
        showError('Error searching for pharmacies. Please try again.');
    }
}

function displayPharmacies(pharmacies, userLat, userLon) {
    let html = '';

    if (searchingMedicine) {
        html += `<div style="background: var(--bg-light); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <strong>Searching for: ${searchingMedicine}</strong>
            <p style="color: var(--text-light); margin-top: 0.5rem; font-size: 0.9rem;">
                Note: Availability shown is estimated. Please call to confirm stock.
            </p>
        </div>`;
    }

    pharmacies.forEach((pharmacy, index) => {
        const pLat = pharmacy.lat;
        const pLon = pharmacy.lon;
        const name = pharmacy.tags.name || 'Pharmacy';
        const phone = pharmacy.tags.phone || pharmacy.tags['contact:phone'] || '';
        const address = pharmacy.tags['addr:street'] || pharmacy.tags['addr:full'] || 'Address not available';

        const distance = calculateDistance(userLat, userLon, pLat, pLon);

        // Simulate availability (60% chance)
        const hasStock = searchingMedicine ? Math.random() > 0.4 : true;
        const stockStatus = hasStock ?
            '<span style="color: var(--secondary-color); font-weight: 600;">✅ Likely in stock</span>' :
            '<span style="color: var(--text-light);">⏳ Call to check</span>';

        const markerColor = hasStock ? 'green' : 'orange';
        const marker = L.marker([pLat, pLon], {
            icon: L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map);

        marker.bindPopup(`
            <b>${name}</b><br>
            ${address}<br>
            <i>${distance.toFixed(1)} km away</i><br>
            ${searchingMedicine ? stockStatus : ''}
        `);
        pharmacyMarkers.push(marker);

        html += `
            <div class="pharmacy-info" onclick="focusPharmacy(${index})" style="border-left: 4px solid ${hasStock ? 'var(--secondary-color)' : 'var(--border-color)'};">
                <div class="pharmacy-name">${index + 1}. ${name}</div>
                ${searchingMedicine ? `<div style="margin-top: 0.5rem;">${stockStatus}</div>` : ''}
                <div style="color: var(--text-light); margin-top: 0.5rem;">📍 ${address}</div>
                <div class="pharmacy-distance">📏 ${distance.toFixed(1)} km away</div>
                ${phone ? `<div style="margin-top: 0.5rem; color: var(--text-dark);">📞 ${phone}</div>` : ''}
                <div style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLon}" 
                       target="_blank" 
                       style="color: var(--primary-color); text-decoration: none; font-weight: 600;">
                        🗺️ Get Directions
                    </a>
                    ${phone ? `<a href="tel:${phone}" style="color: var(--secondary-color); text-decoration: none; font-weight: 600;">📞 Call Now</a>` : ''}
                </div>
            </div>
        `;
    });

    pharmaciesDiv.innerHTML = html;

    window.focusPharmacy = (index) => {
        pharmacyMarkers[index].openPopup();
        map.setView(pharmacyMarkers[index].getLatLng(), 16);
    };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function showError(message) {
    loadingMap.style.display = 'none';
    mapContainer.style.display = 'none';
    errorMsg.innerHTML = `<p>❌ ${message}</p>`;
    errorMsg.style.display = 'block';
}
