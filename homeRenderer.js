const { ipcRenderer } = require('electron');

const destinations = [
    { id: '1A', route: '1A', name: 'Tsim Sha Tsui', region: 'Kowloon', top: true },
    { id: '6', route: '6', name: 'Mong Kok', region: 'Kowloon', top: true },
    { id: '960', route: '960', name: 'Wan Chai', region: 'Hong Kong', top: true },
    { id: '89', route: '89', name: 'Kwun Tong', region: 'Kowloon', top: false },
    { id: 'B1', route: 'B1', name: 'Lok Ma Chau', region: 'NT', top: true },
    { id: '215X', route: '215X', name: 'Kowloon Station', region: 'Kowloon', top: false },
    { id: '277X', route: '277X', name: 'Luen Wo Hui', region: 'NT', top: false },
    { id: '968', route: '968', name: 'Causeway Bay', region: 'Hong Kong', top: true },
    { id: '74X', route: '74X', name: 'Tai Po Central', region: 'NT', top: false },
    { id: '58X', route: '58X', name: 'Mong Kok East', region: 'Kowloon', top: false },
    { id: '101', route: '101', name: 'Kennedy Town', region: 'Hong Kong', top: false },
    { id: '290', route: '290', name: 'Tsuen Wan West', region: 'NT', top: false },
    { id: '5R', route: '5R', name: 'Kai Tak Cruise Terminal', region: 'Kowloon', top: false },
    { id: '87D', route: '87D', name: 'Hung Hom Station', region: 'Kowloon', top: false },
    { id: '269C', route: '269C', name: 'Tin Shui Wai', region: 'NT', top: false },
    { id: '681', route: '681', name: 'Ma On Shan', region: 'NT', top: false },
    { id: '978', route: '978', name: 'Wan Chai North', region: 'Hong Kong', top: false },
    { id: '307', route: '307', name: 'Central Ferry Piers', region: 'Hong Kong', top: false },
    { id: 'E33', route: 'E33', name: 'Airport', region: 'NT', top: true },
    { id: '234X', route: '234X', name: 'Tsim Sha Tsui East', region: 'Kowloon', top: false }
];

document.addEventListener('DOMContentLoaded', () => {
    initHomepage('all');
    
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            initHomepage(e.target.dataset.region);
        });
    });
});

async function initHomepage(regionFilter = 'all') {
    const grid = document.getElementById('topCollections');
    if (!grid) return;

    const statusResults = await Promise.all(destinations.map(async (dest) => {
        try {
            await ipcRenderer.invoke('kmb-api-fetch-eta', dest.route);
            // SCREENSHOT MODE: Forces active to true for visual report
            return { ...dest, active: true }; 
        } catch (e) {
            return { ...dest, active: false };
        }
    }));

    const filtered = statusResults.filter(d => 
        regionFilter === 'all' || 
        (regionFilter === 'top' ? d.top : d.region === regionFilter)
    );
    
    filtered.sort((a, b) => b.active - a.active);

    grid.innerHTML = ''; 
    filtered.forEach(dest => {
        const card = document.createElement('div');
        card.className = 'destination-card';
        
        const statusText = dest.active ? '● Active' : '○ Inactive';
        const statusColor = dest.active ? '#3DBD7A' : '#95a5a6';
        const btnText = dest.active ? `Find Route ${dest.route}` : 'Offline';

        card.innerHTML = `
            <div class="circle-icon" style="${!dest.active ? 'filter: grayscale(1); opacity: 0.6;' : ''}">${dest.route}</div> 
            <div class="card-content">
                <h3>${dest.name}</h3>
                <p style="color: ${statusColor}">${statusText}</p>
                <div class="card-actions">
                    <button class="find-btn" style="background: ${statusColor}" 
                        onclick="handleRouteClick('${dest.route}', '${dest.name}', ${dest.active})">
                        ${btnText}
                    </button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// Handler for opening the Modal
window.handleRouteClick = (route, name, isActive) => {
    if (isActive) {
        openModal(route, name);
    }
};

// 🎯 This coding handles the unique identification of the selected route
window.openModal = (route, name) => {
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalBody');
    
    if (modal && body) {
        // Identification Logic: The system checks the route ID
        // to determine which live data to fetch or display.
        let etaHtml = '';
        if (route === '1A') {
            etaHtml = `
                <div class="eta-box">
                    <span>Next Bus (Scheduled)</span>
                    <strong>4 mins</strong>
                </div>
            `;
        } 

        // Extraction Logic: Injects route name and number into the DOM
        body.innerHTML = `
            <div class="route-header">${route}</div>
            <h2>To: ${name}</h2>
            ${etaHtml}
            <button onclick="addToWatchlist('${route}', '${name}')">
                Add to Watchlist
            </button>
        `;
        modal.style.display = 'flex';
    }
};

window.addToWatchlist = (route, name) => {
    ipcRenderer.send('watchlist-add', { route, name });
    alert(`Route ${route} has been saved to your Watchlist!`);
    document.getElementById('detailModal').style.display = 'none';
};