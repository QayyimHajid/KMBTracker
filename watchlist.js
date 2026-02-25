const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    init();
    // Connect the refresh button to the init function
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.onclick = () => init();
});

// READ: Reads watchlist data from system local memory to display saved routes
async function init() {
    const container = document.getElementById('bookmarksList');
    const emptyMsg = document.getElementById('emptyMsg');
    
    if (!container) return;
    container.innerHTML = ""; // Clear existing cards before reload

    const list = await ipcRenderer.invoke('watchlist-get');
    
    if (list && list.length > 0) {
        if (emptyMsg) emptyMsg.style.display = 'none';
        
        // Loop through each saved item to create its UI card
        for (const item of list) {
            const card = await createRouteCard(item);
            container.appendChild(card);
        }
    } else {
        if (emptyMsg) emptyMsg.style.display = 'block';
    }
}

async function createRouteCard(item) {
    const card = document.createElement('div');
    card.className = 'bookmark-row';
    
    let etaHtml = 'Checking for buses...';
    let themeColor = '#3DBD7A'; 

    try {
        const res = await ipcRenderer.invoke('kmb-api-fetch-eta', item.route);
        const now = new Date();
        const validEtas = (res.data || [])
            .filter(b => b.eta && new Date(b.eta) > now)
            .sort((a, b) => new Date(a.eta) - new Date(b.eta));

        if (validEtas.length > 0) {
            etaHtml = validEtas.slice(0, 2).map((bus, i) => {
                const diff = Math.floor((new Date(bus.eta) - now) / 60000);
                return `<div style="margin-bottom:5px;">${i === 0 ? '<strong>Next:</strong>' : 'Following:'} ${diff === 0 ? 'Arriving' : diff + ' mins'}</div>`;
            }).join('');
        } else {
            etaHtml = 'Service ended.';
        }
    } catch (e) { etaHtml = 'API Error'; }

    card.innerHTML = `
        <div class="route-badge">${item.route}</div>
        <div class="row-info">
            <div style="display:flex; justify-content:space-between;">
                <h3 style="margin:0;">To: ${item.dest_en}</h3>
                <span style="color:${themeColor}; font-weight:bold; font-size:12px;">● ACTIVE</span>
            </div>
            <div class="eta-box">${etaHtml}</div>
            <textarea class="note-input" placeholder="Add a travel note...">${item.note || ''}</textarea>
            <div class="row-actions">
                <button class="save-btn" style="background:#3DBD7A; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Update Note</button>
                <button class="remove-btn" style="background:#ff4d4d; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Remove</button>
            </div>
        </div>
    `;

    // UPDATE Implementation: Saves the note to local memory
    const saveBtn = card.querySelector('.save-btn');
    const noteInput = card.querySelector('.note-input');

    saveBtn.addEventListener('click', async () => {
        const note = noteInput.value.trim(); 
        await ipcRenderer.invoke('watchlist-update', { id: item._id, note });
        alert("Note Saved!");
    });

    // DELETE Implementation: Removes the route from memory and UI
    const removeBtn = card.querySelector('.remove-btn');

    removeBtn.addEventListener('click', async () => {
        // Verification: Pop-up ensures user intent before deleting
        if (confirm("Are you sure you want to remove this route?")) {
            const res = await ipcRenderer.invoke('watchlist-remove', item._id);
            // UI Sync: Removes the card from the view immediately if successful
            if (res.success) card.remove();
        }
    });

    return card;
}