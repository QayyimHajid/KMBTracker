/* Preload Script: KMB Transit Tracker
   Serves as the bridge between Main Process and Renderer Process
   Maintains 100% structure of the provided template
*/
const { contextBridge, ipcRenderer } = require('electron');

// Debugging: Confirms the preload script has initialized
console.log("KMB Tracker Preload Script Active");

contextBridge.exposeInMainWorld('kmbAPI', {
  // GET: Retrieve all saved bus routes
  getAll: () => ipcRenderer.invoke('watchlist-get'),
  
  // POST: Add a new bus route to favorites
  // 'bus' should be an object: { route: '1A', dest_en: 'Star Ferry' }
  add: (bus) => ipcRenderer.invoke('watchlist-add', bus),
  
  // DELETE: Remove a route by ID (ID format: 'Route||Destination')
  remove: (id) => ipcRenderer.invoke('watchlist-remove', id),
  
  // UPDATE: Update notes or other data for a specific route
  update: (id, updates) => ipcRenderer.invoke('watchlist-update', id, updates),
  
  // CHECK: See if a route is already in the watchlist
  isBookmarked: (id) => ipcRenderer.invoke('watchlist-check', id)
});