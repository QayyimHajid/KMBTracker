const { ipcRenderer } = require('electron');

// Helper for the "Popular Chips" and Dropdown to trigger search immediately
window.fillAndSearch = (route) => {
    const input = document.getElementById('routeInput');
    input.value = route;
    performSearch(route);
};

// This coding handles the interactive search and quick-select features
async function performSearch(route) {
    const container = document.getElementById('resultsContainer');
    if (!route) return;
    const cleanRoute = route.trim().toUpperCase();

    try {
        // The coding builds the API URL with the route query that 
        // user made at the search bar or selected from the dropdown. 
        const response = await ipcRenderer.invoke('kmb-api-fetch-eta', cleanRoute);
        
        if (response && response.data && response.data.length > 0) {
            // It then uses the returned bus data to display the search result.
            renderSearchResults(cleanRoute, response.data);
        } else {
            container.innerHTML = `<div class="result-card"><h3>No live data found</h3></div>`;
        }
    } catch (err) {
        console.error("Search Error:", err);
    }
}

async function renderSearchResults(route, etaData = []) {
    const container = document.getElementById('resultsContainer');
    const firstBus = etaData[0];
    const currentStopId = firstBus.stop || firstBus.stop_id || firstBus.stop_tag;

    // 1. Build ETA rows
    const etaListHtml = etaData.slice(0, 4).map((bus, index) => {
        const arrival = new Date(bus.eta);
        const mins = Math.max(0, Math.round((arrival - new Date()) / 60000));
        const badge = index === 0 ? `<span style="background:#E8F5E9; color:#3DBD7A; padding:2px 8px; border-radius:10px; font-size:10px; margin-left:10px; border:1px solid #3DBD7A;">NEXT BUS</span>` : '';
        
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 15px 0; border-bottom: 1px solid #eee;">
                <span>Bus ${index + 1} ${badge}</span>
                <b style="font-size: 16px;">${mins} mins</b>
            </div>`;
    }).join('');

    // 2. Render Card Shell
    container.innerHTML = `
        <div class="result-card" style="padding: 30px; border-radius: 20px; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 600px; margin: 20px auto;">
            <div style="display: flex; gap: 20px; margin-bottom: 25px;">
                <div style="background:#3DBD7A; color:white; width:80px; height:80px; display:flex; align-items:center; justify-content:center; border-radius:12px; font-size: 32px; font-weight:bold;">${route}</div>
                <div>
                    <div id="stop-name" style="font-weight:bold; font-size: 20px; color:#333;">📍 Loading Stop...</div>
                    <div id="coords-text" style="font-size: 13px; color: #888; margin-top: 4px;">Fetching coordinates...</div>
                    <button id="map-btn" style="display:none; margin-top:10px; background:white; border:1px solid #3DBD7A; color:#3DBD7A; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:12px; font-weight:bold;">🗺️ VIEW ON MAP</button>
                </div>
            </div>
            ${etaListHtml}
            <button onclick="alert('Added to Watchlist!')" style="width:100%; margin-top:25px; padding:15px; background:#f5f5f5; border:1px solid #ddd; border-radius:10px; color:#666; font-weight:bold; cursor:pointer;">⭐ Add to Watchlist</button>
        </div>`;

    // 3. Fetch Metadata (Stop Name & Map)
    if (currentStopId) {
        const stopRes = await ipcRenderer.invoke('kmb-stop-details', currentStopId);
        if (stopRes && stopRes.data) {
            const s = stopRes.data;
            document.getElementById('stop-name').innerText = `📍 ${s.name_en}`;
            document.getElementById('coords-text').innerText = `Lat: ${s.lat}, Long: ${s.long}`;
            
            const mBtn = document.getElementById('map-btn');
            mBtn.style.display = "block";
            mBtn.onclick = () => {
                // Fixed the variable insertion with ${}
                window.open(`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.long}`, '_blank');
            };
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const routeInput = document.getElementById('routeInput');

    if (searchBtn) {
        searchBtn.onclick = () => performSearch(routeInput.value);
    }

    // Allow pressing "Enter" to search
    routeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch(routeInput.value);
    });
});

// In home.js or search.js
window.openModal = async (route, name) => {
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalBody');
    modal.style.display = 'flex';

    // The coding works by the system searching the unique identifier 
    // such as the route number (e.g., 960) to display details.
    body.innerHTML = `
        <div style="padding: 40px; text-align: center;">
            <div class="modal-route-circle">${route}</div>
            <h2>To: ${name}</h2>
            <p>This route is currently being tracked via KMB Live Data.</p>
            <button onclick="addToWatchlist('${route}', '${name}')" class="save-btn">
                ⭐ Add to My Watchlist
            </button>
        </div>
    `;
};

window.addToWatchlist = (route, name) => {
    ipcRenderer.send('watchlist-add', { route, dest_en: name });
    alert(`${route} added!`);
    document.getElementById('detailModal').style.display = 'none';
};