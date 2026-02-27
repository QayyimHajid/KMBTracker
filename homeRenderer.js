/**
 * homeRenderer.js - Logic for the Discover/Home Page
 * Handles dynamic grid generation, regional filtering, and modal interactions.
 */

const { ipcRenderer } = require('electron');

// 1. DATA SOURCE: Local array containing geographic data for major KMB terminals.
// This serves as the 'Hardcoded Dataset' for the Discovery feature.
const destinations = [
    { id: '1A', route: '1A', name: 'Tsim Sha Tsui', region: 'Kowloon', top: true, lat: 22.2988, lng: 114.1742 },
    { id: '6', route: '6', name: 'Mong Kok', region: 'Kowloon', top: true, lat: 22.3193, lng: 114.1694 },
    { id: '960', route: '960', name: 'Wan Chai', region: 'Hong Kong', top: true, lat: 22.2797, lng: 114.1717 },
    { id: 'B1', route: 'B1', name: 'Lok Ma Chau', region: 'NT', top: true, lat: 22.5135, lng: 114.0658 },
    { id: 'E33', route: 'E33', name: 'Airport', region: 'NT', top: true, lat: 22.2981, lng: 113.9348 },
    { id: '89', route: '89', name: 'Kwun Tong', region: 'Kowloon', top: false, lat: 22.3132, lng: 114.2258 },
    { id: '215X', route: '215X', name: 'Kowloon Station', region: 'Kowloon', top: false, lat: 22.3049, lng: 114.1615 },
    { id: '277X', route: '277X', name: 'Luen Wo Hui', region: 'NT', top: false, lat: 22.4997, lng: 114.1432 },
    { id: '968', route: '968', name: 'Causeway Bay', region: 'Hong Kong', top: true, lat: 22.2808, lng: 114.1839 },
    { id: '74X', route: '74X', name: 'Tai Po Central', region: 'NT', top: false, lat: 22.4508, lng: 114.1657 },
    { id: '58X', route: '58X', name: 'Mong Kok East', region: 'Kowloon', top: false, lat: 22.3224, lng: 114.1693 },
    { id: '101', route: '101', name: 'Kennedy Town', region: 'Hong Kong', top: false, lat: 22.2831, lng: 114.1277 },
    { id: '290', route: '290', name: 'Tsuen Wan West', region: 'NT', top: false, lat: 22.3686, lng: 114.1105 },
    { id: '5R', route: '5R', name: 'Kai Tak Cruise Terminal', region: 'Kowloon', top: false, lat: 22.3121, lng: 114.2173 },
    { id: '87D', route: '87D', name: 'Hung Hom Station', region: 'Kowloon', top: false, lat: 22.3029, lng: 114.1815 },
    { id: '269C', route: '269C', name: 'Tin Shui Wai', region: 'NT', top: false, lat: 22.4571, lng: 114.0049 },
    { id: '681', route: '681', name: 'Ma On Shan', region: 'NT', top: false, lat: 22.4255, lng: 114.2319 },
    { id: '978', route: '978', name: 'Wan Chai North', region: 'Hong Kong', top: false, lat: 22.2825, lng: 114.1751 },
    { id: '307', route: '307', name: 'Central Ferry Piers', region: 'Hong Kong', top: false, lat: 22.2871, lng: 114.1578 },
    { id: '234X', route: '234X', name: 'Tsim Sha Tsui East', region: 'Kowloon', top: false, lat: 22.2985, lng: 114.1775 }
];

// INITIALIZATION: Runs once the HTML document is fully parsed.
document.addEventListener('DOMContentLoaded', () => {
    renderGrid('all'); // Default view shows all routes
    
    // UI Feature: A live clock updated every second for user convenience
    setInterval(() => {
        const clock = document.getElementById('clock');
        if (clock) clock.innerText = new Date().toLocaleTimeString();
    }, 1000);
});

/**
 * CORE LOGIC: Filters and Renders the bus route cards.
 * @param {string} filter - The filter category (all, top, or region name).
 */
function renderGrid(filter) {
    const grid = document.getElementById('topCollections');
    if (!grid) return;
    
    grid.innerHTML = ''; // Clear current grid before re-rendering
    
    // Filtering logic based on user selection
    destinations
        .filter(d => filter === 'all' || d.region === filter || (filter === 'top' && d.top))
        .forEach(dest => {
            const div = document.createElement('div');
            div.className = 'destination-card';
            
            // Injecting HTML for the bus stop visual and action button
            div.innerHTML = `
                <h3>${dest.route}</h3>
                <p>${dest.name}</p>
                <button onclick="showInfo('${dest.route}')">View Info</button>
            `;
            grid.appendChild(div);
        });
}

/**
 * UI INTERACTION: Opens the Modal and displays static geographic data.
 * This demonstrates the ability to pass object properties to a GUI component.
 */
window.showInfo = (route) => {
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalBody');
    const dest = destinations.find(d => d.route === route);

    if (!dest) return;

    modal.style.display = 'flex'; // Reveal modal using Flexbox centering
    
    // Injecting dynamic route data into the modal window
    body.innerHTML = `
        <div style="color: #333; text-align: left;">
            <h2 style="color: #3DBD7A; margin-top: 0;">Route ${dest.route}</h2>
            <p><strong>Destination:</strong> ${dest.name}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
            <p><strong>GPS Coordinates:</strong></p>
            <div style="background: #f4f4f4; padding: 10px; border-radius: 8px; font-family: monospace;">
                Lat: ${dest.lat}<br>
                Long: ${dest.lng}
            </div>
            <div style="margin: 20px 0;">
                <a href="https://www.google.com/maps/search/?api=1&query=${dest.lat},${dest.lng}" 
                   target="_blank" 
                   style="display: block; text-align: center; background: #4285F4; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                   📍 View on Google Maps
                </a>
            </div>
            <button onclick="saveRoute('${dest.route}', '${dest.name}')" 
                    style="width: 100%; background: #3DBD7A; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                ⭐ Add to Watchlist
            </button>
        </div>
    `;
};

/**
 * CRUD OPERATION (CREATE): Invokes the IPC bridge to save data to watchlist.json.
 */
window.saveRoute = async (route, name) => {
    // Communicate with main process to write to file
    await ipcRenderer.invoke('add-to-watchlist', { route, name });
    alert("✅ SUCCESS: Saved to your local watchlist!");
    document.getElementById('detailModal').style.display = 'none';
};
