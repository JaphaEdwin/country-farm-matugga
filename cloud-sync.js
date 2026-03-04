/**
 * Country Farm Matugga - Cloud Sync (Hostinger PHP Backend)
 * 
 * This module handles persistent storage using a PHP API backend.
 * All changes made in the admin panel are saved to the server and visible to all visitors.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Upload all files to Hostinger via File Manager or FTP
 * 2. Make sure the 'api' folder is uploaded with all PHP files
 * 3. Edit api/config.php and change API_SECRET_KEY to a random string
 * 4. Update API_SECRET_KEY below to match
 * 5. Update API_BASE_URL to your actual domain
 * 6. Set permissions: api/data folder needs write access (755 or 775)
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Your API endpoint URL - CHANGE THIS to your actual domain
const API_BASE_URL = '/api/data.php';

// API secret key - MUST MATCH the key in api/config.php
const API_SECRET_KEY = 'change-this-to-a-random-string-123';

// ============================================
// CLOUD SYNC MODULE
// ============================================
const CloudSync = (function() {
  let isInitialized = false;
  let isConfigured = false;
  let lastSyncTime = 0;
  
  // Data keys to sync
  const SYNC_KEYS = [
    'farmProducts',
    'farmVideos', 
    'websiteContent',
    'farmQuotes',
    'farmOrders',
    'farmCustomers',
    'farmExpenses'
  ];

  // Check if API is configured (not using placeholder values)
  function checkConfig() {
    return API_SECRET_KEY !== 'change-this-to-a-random-string-123';
  }

  // Initialize the sync module
  async function init() {
    if (isInitialized) return true;
    
    isConfigured = checkConfig();
    
    if (!isConfigured) {
      console.warn('CloudSync: API not configured. Using localStorage only.');
      console.info('CloudSync: To enable cloud sync, update API_SECRET_KEY in cloud-sync.js and api/config.php');
      return false;
    }

    try {
      // Test API connection
      const response = await fetch(API_BASE_URL);
      if (response.ok) {
        isInitialized = true;
        console.log('CloudSync: API connected successfully');
        return true;
      } else {
        console.warn('CloudSync: API not responding correctly');
        return false;
      }
    } catch (error) {
      console.error('CloudSync: Failed to connect to API:', error);
      return false;
    }
  }

  // Clean object URLs from data (they won't work on server)
  function cleanData(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const cleaned = Array.isArray(obj) ? [...obj] : {...obj};
    
    for (const key in cleaned) {
      const val = cleaned[key];
      // Remove blob URLs and large data URLs
      if (typeof val === 'string' && (val.startsWith('blob:') || (val.startsWith('data:') && val.length > 100000))) {
        cleaned[key] = '';
      } else if (typeof val === 'object' && val !== null) {
        cleaned[key] = cleanData(val);
      }
    }
    
    // Remove session-only media markers
    if (cleaned.isObjURL) {
      return null;
    }
    
    return cleaned;
  }

  // Save a single key to server
  async function saveToCloud(key, data) {
    if (!isInitialized) return false;
    
    try {
      let cleanedData = data;
      if (Array.isArray(data)) {
        cleanedData = data.filter(item => !item || !item.isObjURL).map(item => cleanData(item));
      } else if (typeof data === 'object') {
        cleanedData = cleanData(data);
      }
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_SECRET_KEY
        },
        body: JSON.stringify({
          key: key,
          data: cleanedData
        })
      });
      
      if (response.ok) {
        console.log('CloudSync: Saved', key);
        return true;
      } else {
        const error = await response.json();
        console.error('CloudSync: Error saving', key, error);
        return false;
      }
    } catch (error) {
      console.error('CloudSync: Error saving', key, error);
      return false;
    }
  }

  // Load a single key from server
  async function loadFromCloud(key) {
    try {
      const response = await fetch(`${API_BASE_URL}?key=${encodeURIComponent(key)}`);
      if (response.ok) {
        const result = await response.json();
        console.log('CloudSync: Loaded', key, result.data ? '(found)' : '(empty)');
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('CloudSync: Error loading', key, error);
      return null;
    }
  }

  // Sync all data from localStorage to server
  async function syncToCloud() {
    if (!isInitialized) return false;
    
    console.log('CloudSync: Starting sync to cloud...');
    
    try {
      const updates = {};
      
      for (const key of SYNC_KEYS) {
        const localData = localStorage.getItem(key);
        if (localData) {
          try {
            let parsed = JSON.parse(localData);
            if (Array.isArray(parsed)) {
              parsed = parsed.filter(item => !item || !item.isObjURL).map(item => cleanData(item));
            } else {
              parsed = cleanData(parsed);
            }
            updates[key] = parsed;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_SECRET_KEY
        },
        body: JSON.stringify({ updates: updates })
      });
      
      if (response.ok) {
        lastSyncTime = Date.now();
        console.log('CloudSync: Sync complete');
        return true;
      } else {
        const error = await response.json();
        console.error('CloudSync: Sync failed:', error);
        return false;
      }
    } catch (error) {
      console.error('CloudSync: Sync failed:', error);
      return false;
    }
  }

  // Load all data from server to localStorage
  async function loadAllFromCloud() {
    if (!isInitialized) {
      const success = await init();
      if (!success) return false;
    }
    
    console.log('CloudSync: Loading all data from cloud...');
    
    try {
      const response = await fetch(`${API_BASE_URL}?action=all`);
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          for (const key of SYNC_KEYS) {
            if (result.data[key] !== undefined && result.data[key] !== null) {
              localStorage.setItem(key, JSON.stringify(result.data[key]));
            }
          }
        }
        console.log('CloudSync: All data loaded from cloud');
        return true;
      }
      return false;
    } catch (error) {
      console.error('CloudSync: Failed to load from cloud:', error);
      return false;
    }
  }

  // Wrapper to save to both localStorage and cloud
  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    
    if (isInitialized && SYNC_KEYS.includes(key)) {
      saveToCloud(key, data).catch(err => {
        console.warn('CloudSync: Background save failed for', key, err);
      });
    }
  }

  // Check connection status
  function isOnline() {
    return isInitialized && isConfigured;
  }

  // Get sync status info
  function getStatus() {
    return {
      configured: isConfigured,
      initialized: isInitialized,
      lastSync: lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'
    };
  }

  // Public API
  return {
    init,
    save,
    saveToCloud,
    loadFromCloud,
    syncToCloud,
    loadAllFromCloud,
    isOnline,
    getStatus,
    SYNC_KEYS
  };
})();

// Auto-expose to window
if (typeof window !== 'undefined') {
  window.CloudSync = CloudSync;
}
