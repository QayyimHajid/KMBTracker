/**
 * search.js - Live Data Logic
 * This script manages the search functionality, time-based calculations, 
 * and dynamic UI rendering for the KMB live feed.
 */

const { ipcRenderer } = require('electron');

// 1. UI UTILITY: Updates the clock in the header every second.
function startClock() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        setInterval(() => {
            clockElement.innerText = new Date().toLocaleTimeString();
        }, 1000);
    }
}

// 2. SEARCH HELPER: Fills the input and triggers a search from the "Popular Chips".
window.fillAndSearch = (r) => {
    const input = document.getElementById('routeInput');
    if (input) {
        input.value = r;
        doSearch();
    }
};

/**
 * CORE LOGIC: Renders the API data into visual cards.
 * Demonstrates DATA CALCULATION: Converts ETA timestamp to "Minutes Remaining".
 * @param {string} route - The bus route number.
 * @param {Array} busData - Array of bus objects from the KMB API.
 */
function renderBusResults(route, busData) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `<h3 style="color: #333; margin-bottom: 15px;">Live Results for ${route}</h3>`;
    
    // Limits display to top 4 immediate buses for better UX
    busData.slice(0, 4).forEach(bus => {
        const now = new Date();
        const etaTime = new Date(bus.eta);
        
        // CALCULATION: Finding the difference between now and arrival in minutes
        const diff = etaTime - now;
        const wait = Math.max(0, Math.round(diff / 60000));
        
        const div = document.createElement('div');
        div.className = 'result-card'; 
        div.innerHTML = `
            <div style="flex: 1;">
                <strong style="font-size: 1.2rem; color: #333;">To: ${bus.dest_en}</strong><br>
                <small style="color: #666;">Next Arrival: ${etaTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                <div style="margin-top: 10px; font-size: 1.8rem; font-weight: 800; color: #3DBD7A;">
                    ${wait} <span style="font-size: 0.7rem; letter-spacing: 1px;">MINS</span>
                </div>
            </div>
            <button class="add-watchlist-btn" onclick="saveFromSearch('${route}', '${bus.dest_en}')">
                ⭐ Save
            </button>
        `;
        container.appendChild(div);
    });
}

// 4. MOCK DATA: Fallback for demonstration purposes during off-service hours.
window.runMockDemo = (route) => {
    const mockBuses = [
        { dest_en: "Demo Terminus (Inbound)", eta: new Date(Date.now() + 7 * 60000).toISOString() },
        { dest_en: "Demo Terminus (Outbound)", eta: new Date(Date.now() + 14 * 60000).toISOString() }
    ];
    renderBusResults(route, mockBuses);
};

/**
 * PRIMARY ACTION: Triggers the IPC call to main.js to fetch live data.
 * Includes Loading States and Error Handling for API failures.
 */
async function doSearch() {
    const routeInput = document.getElementById('routeInput');
    const container = document.getElementById('resultsContainer');
    if (!routeInput || !container) return;

    const route = routeInput.value.trim().toUpperCase();
    if (!route) {
        alert("Please enter a route number.");
        return;
    }

    // FEEDBACK: Show loading spinner while waiting for asynchronous response
    container.innerHTML = `<div class="no-service-box"><div class="spinner"></div><p>Scanning KMB Feed...</p></div>`;

    try {
        const res = await ipcRenderer.invoke('fetch-kmb', route);
        
        if (res.data && res.data.length > 0) {
            renderBusResults(route, res.data); // SUCCESS: Render results
        } else {
            // NO SERVICE: Handles empty results (e.g., searching a route at 3 AM)
            container.innerHTML = `<div class="no-service-box">
                <h2>No active buses found</h2>
                <p>Route <strong>${route}</strong> isn't transmitting GPS data right now.</p>
                <button class="demo-btn" onclick="runMockDemo('${route}')">Show Mock Results</button>
            </div>`;
        }
    } catch (err) {
        console.error("IPC Error:", err);
    }
}

// 6. CRUD CREATE: Passes search result data to the Watchlist logic in main.js
window.saveFromSearch = async (route, name) => {
    const success = await ipcRenderer.invoke('add-to-watchlist', { route, name });
    if (success) alert("✅ Success: Route saved to your watchlist!");
};

// 7. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    document.getElementById('searchBtn').onclick = doSearch;
    document.getElementById('routeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });
});
