/**
 * watchlist.js - CRUD Controller for Saved Routes
 * Handles the 'Read', 'Update', and 'Delete' operations by communicating 
 * with the Main process via IPC.
 */

const { ipcRenderer } = require('electron');

/**
 * CRUD: READ OPERATION
 * Fetches the saved routes from the JSON database and renders them as UI components.
 */
async function loadWatchlist() {
    const container = document.getElementById('bookmarksList');
    const emptyMsg = document.getElementById('emptyMsg');
    
    // VISUAL FEEDBACK: Show loading state while reading the file system
    container.innerHTML = '<div class="no-service-box"><div class="spinner"></div><p>Syncing with watchlist.json...</p></div>';

    // Invoke the 'get-watchlist' handler in main.js
    const list = await ipcRenderer.invoke('get-watchlist');

    if (!list || list.length === 0) {
        emptyMsg.style.display = 'block';
        container.innerHTML = '';
        return;
    }

    emptyMsg.style.display = 'none';
    container.innerHTML = ''; // Clear spinner

    // DATA MAPPING: Converting JSON objects into HTML Card Elements
    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'result-card'; 
        
        div.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #3DBD7A; color: white; padding: 5px 12px; border-radius: 8px; font-weight: 900; font-size: 1.2rem;">
                        ${item.route}
                    </span>
                    <strong style="font-size: 1.1rem; color: #333;">to ${item.name}</strong>
                </div>
                
                <div style="margin-top: 15px;">
                    <label style="font-size: 0.8rem; color: #888; display: block; margin-bottom: 5px;">Travel Notes:</label>
                    <input type="text" id="note-${item._id}" value="${item.note || ''}" 
                           placeholder="e.g. Morning commute" 
                           style="width: 85%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem;">
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px; margin-left: 20px;">
                <button onclick="saveNote('${item._id}')" 
                        style="background: #3DBD7A; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    Update Note
                </button>
                <button onclick="deleteItem('${item._id}')" 
                        style="background: #ff4d4d; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    Remove
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

/**
 * CRUD: UPDATE OPERATION
 * Captures the user's input from the text field and updates the specific 
 * object in watchlist.json using its unique ID.
 */
window.saveNote = async (id) => {
    const note = document.getElementById(`note-${id}`).value;
    const success = await ipcRenderer.invoke('update-watchlist', { id, note });
    
    if (success) {
        alert("ℹ️ UPDATE: Note successfully saved to watchlist.json!");
    } else {
        alert("❌ Error: Could not update note.");
    }
};

/**
 * CRUD: DELETE OPERATION
 * Removes the selected route from the JSON database.
 */
window.deleteItem = async (id) => {
    // Confirmation dialog to prevent accidental deletion (Standard UX practice)
    if (confirm("Are you sure you want to remove this route from your watchlist?")) {
        const success = await ipcRenderer.invoke('delete-watchlist', id);
        if (success) {
            alert("⚠️ DELETE: Route removed from watchlist.");
            loadWatchlist(); // Immediate UI refresh after data change
        }
    }
};

// INITIALIZATION: Setup event listeners and initial data fetch
document.addEventListener('DOMContentLoaded', () => {
    loadWatchlist();
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.onclick = loadWatchlist;
});
