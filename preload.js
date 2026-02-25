/* Preload Script: KMB Transit Tracker
   Serves as the secure bridge between Main Process and Renderer Process
*/
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kmbAPI', {
  // READ: Get the current watchlist
  getAll: () => ipcRenderer.invoke('watchlist-get'),
  
  // CREATE: Add a new route
  add: (item) => ipcRenderer.invoke('watchlist-add', item),
  
  // UPDATE: Change notes for a specific ID
  update: (id, note) => ipcRenderer.invoke('watchlist-update', { id, note }),
  
  // DELETE: Remove a route from favorites
  remove: (id) => ipcRenderer.invoke('watchlist-remove', id),
  
  // API: Fetch live data from KMB
  fetchETA: (route) => ipcRenderer.invoke('kmb-api-fetch-eta', route)
});

console.log("KMB Tracker Preload Bridge: Initialized Successfully");