/**
 * main.js - The Main Process
 * This file handles the application lifecycle, window management, 
 * File System (FS) operations for data persistence, and secure API communication.
 */

const { app, BrowserWindow, ipcMain, net } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// DATA PERSISTENCE: Define the path for the local JSON database (watchlist.json)
// Uses app.getAppPath() to ensure the file is stored within the project directory.
const dataPath = path.join(app.getAppPath(), 'watchlist.json');

/**
 * HELPER: Reads the watchlist from the local JSON file.
 * Demonstrates 'Read' operation from CRUD and Error Handling.
 */
function readData() {
    try {
        if (!fs.existsSync(dataPath)) {
            // Create an empty array file if it doesn't exist yet
            fs.writeFileSync(dataPath, '[]');
            return [];
        }
        return JSON.parse(fs.readFileSync(dataPath, 'utf8') || '[]');
    } catch (e) { 
        console.error("Failed to read watchlist:", e);
        return []; 
    }
}

/**
 * HELPER: Writes data to the local JSON file.
 * Ensures data persistence so user changes are saved after closing the app.
 */
function writeData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// WINDOW MANAGEMENT: Initialize the Graphical User Interface (GUI)
app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1200, 
        height: 900,
        webPreferences: { 
            nodeIntegration: true,    // Allows the use of 'require' in renderer
            contextIsolation: false   // Simplifies IPC communication for this project
        }
    });

    // Load the initial Home page
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'home.html'));
});

/** * --- IPC HANDLERS (CRUD Implementation) ---
 * These functions bridge the gap between the UI (Renderer) and the System (Main).
 */

// READ: Retrieve the full watchlist for the Watchlist Page
ipcMain.handle('get-watchlist', () => readData());

// CREATE: Add a new bus route to the watchlist with a unique ID and timestamp
ipcMain.handle('add-to-watchlist', (event, item) => {
    const data = readData();
    // Logic: Append new item with a unique ID based on the current time
    data.push({ _id: Date.now().toString(), ...item, note: '' });
    writeData(data);
    return true;
});

// UPDATE: Modify the personal 'note' field for a specific saved route
ipcMain.handle('update-watchlist', (event, { id, note }) => {
    const data = readData();
    const index = data.findIndex(i => i._id === id);
    if (index !== -1) {
        data[index].note = note;
        writeData(data);
        return true;
    }
    return false;
});

// DELETE: Remove a route from the watchlist by filtering out its unique ID
ipcMain.handle('delete-watchlist', (event, id) => {
    let data = readData();
    data = data.filter(i => i._id !== id);
    writeData(data);
    return true;
});

/**
 * EXTERNAL API INTEGRATION: Fetching Live KMB Bus Data
 * Demonstrates the use of 'net' module for asynchronous HTTP requests.
 */
ipcMain.handle('fetch-kmb', async (event, route) => {
    return new Promise((resolve, reject) => {
        // ENDPOINT: Route-ETA provides live GPS data for every stop on a specific line
        const url = `https://data.etabus.gov.hk/v1/transport/kmb/route-eta/${route}/1`;
        
        const request = net.request(url);
        
        request.on('response', (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    // DATA FILTERING LOGIC:
                    // The API returns many results (one for every stop). 
                    // We use a Set to filter for 'Unique Destinations' so the UI only shows 
                    // the next immediate bus for each direction (Inbound vs Outbound).
                    if (json.data && json.data.length > 0) {
                        const seenDestinations = new Set();
                        const uniqueBuses = json.data.filter(bus => {
                            const duplicate = seenDestinations.has(bus.dest_en);
                            seenDestinations.add(bus.dest_en);
                            // Filter condition: must be a new destination and have a valid ETA
                            return !duplicate && bus.eta !== null;
                        });
                        
                        resolve({ data: uniqueBuses });
                    } else {
                        resolve({ data: [] });
                    }
                } catch (e) {
                    resolve({ data: [] });
                }
            });
        });
        
        request.on('error', (err) => { resolve({ data: [] }); });
        request.end();
    });
});
