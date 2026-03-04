# Hostinger Cloud Sync Setup Guide

This guide will help you set up cloud storage on Hostinger so that all changes made in the admin panel are saved to the server and visible to all website visitors.

## How It Works

Your website uses a simple PHP backend to store data:
- **Admin makes changes** → Data saved to server as JSON files
- **Visitors view site** → Data loaded from server
- **No external services needed** → Everything runs on your Hostinger hosting

## Quick Start (10 minutes)

### Step 1: Upload Files to Hostinger

1. Log in to your [Hostinger control panel](https://hpanel.hostinger.com/)
2. Go to **Files** → **File Manager**
3. Navigate to your website folder (usually `public_html`)
4. Upload ALL your website files including the `api` folder

Your folder structure should look like:
```
public_html/
├── index.html
├── admin.html
├── admin-login.html
├── firebase-sync.js
├── Logo.png
└── api/
    ├── config.php
    ├── data.php
    ├── .htaccess
    └── data/
        └── README.md
```

### Step 2: Set Up API Security Key

1. In File Manager, open `api/config.php`
2. Find this line:
   ```php
   define('API_SECRET_KEY', 'change-this-to-a-random-string-123');
   ```
3. Replace with a strong random string (e.g., generate one at [random.org](https://www.random.org/strings/)):
   ```php
   define('API_SECRET_KEY', 'xK9m2Np5qR8sT3vW6yB4cF7hJ');
   ```
4. Save the file

### Step 3: Update JavaScript Config

1. Open `firebase-sync.js` in File Manager
2. Find these lines near the top:
   ```javascript
   const API_SECRET_KEY = 'change-this-to-a-random-string-123';
   ```
3. Replace with the SAME key you used in config.php:
   ```javascript
   const API_SECRET_KEY = 'xK9m2Np5qR8sT3vW6yB4cF7hJ';
   ```
4. Save the file

### Step 4: Set Folder Permissions

1. In File Manager, navigate to the `api` folder
2. Right-click on the `data` folder
3. Click **Permissions** (or **Change Permissions**)
4. Set permissions to **755** or **775**
5. Click **Save**

### Step 5: Update Allowed Origins

1. Open `api/config.php`
2. Find the `ALLOWED_ORIGINS` section:
   ```php
   define('ALLOWED_ORIGINS', [
       'http://localhost',
       'http://127.0.0.1',
       'https://yourdomain.com',      // Replace with your actual domain
       'https://www.yourdomain.com',  // Replace with your actual domain
   ]);
   ```
3. Replace with your actual domain:
   ```php
   define('ALLOWED_ORIGINS', [
       'https://countryfarmmatugga.com',
       'https://www.countryfarmmatugga.com',
   ]);
   ```
4. Save the file

### Step 6: Test the API

1. Visit `https://yourdomain.com/api/data.php` in your browser
2. You should see a JSON response like:
   ```json
   {
     "success": true,
     "message": "Country Farm Matugga API",
     "endpoints": {...}
   }
   ```

### Step 7: Test the Admin Panel

1. Go to your admin panel: `https://yourdomain.com/admin-login.html`
2. Log in and make a change (edit a product, save website content, etc.)
3. You should see "☁️ Cloud sync connected!" toast
4. The topbar will show "✓ Cloud" indicator

## Verifying Data is Saved

After making changes in admin:

1. In Hostinger File Manager, go to `api/data/`
2. You should see JSON files like:
   - `farmProducts.json`
   - `websiteContent.json`
   - etc.

## Troubleshooting

### "Local only" indicator shows instead of "Cloud"

**Cause:** API keys don't match or API isn't accessible

**Fix:**
1. Make sure `API_SECRET_KEY` in `firebase-sync.js` matches `config.php`
2. Check that `api/data.php` is accessible (visit it in browser)
3. Check browser console (F12) for error messages

### "Permission denied" or blank pages

**Cause:** PHP files can't write to data folder

**Fix:**
1. Set `api/data` folder permissions to 755 or 775
2. If still failing, contact Hostinger support about file permissions

### Changes not appearing for visitors

**Cause:** Old data cached or API not loading

**Fix:**
1. Clear browser cache (Ctrl+Shift+R)
2. Check that `index.html` has the `<script src="firebase-sync.js">` line
3. Verify JSON files exist in `api/data/`

### API returns 500 error

**Cause:** PHP error in the API

**Fix:**
1. In `api/config.php`, temporarily set:
   ```php
   define('DEBUG_MODE', true);
   ```
2. Check the error message
3. Set back to `false` after fixing

### CORS errors in browser console

**Cause:** Your domain not in allowed origins

**Fix:**
1. Add your exact domain to `ALLOWED_ORIGINS` in `config.php`
2. Include both with and without `www.`

## Security Notes

1. **Never share your API_SECRET_KEY** - It allows write access to your data
2. **Keep DEBUG_MODE false** in production
3. **The .htaccess file** prevents direct access to JSON data files
4. **Backup your data** - Periodically download the `api/data` folder

## What Gets Synced

| Data | Synced? | Notes |
|------|---------|-------|
| Products | ✅ Yes | Full sync |
| Videos | ✅ Yes | URLs only (use YouTube/external links) |
| Website Content | ✅ Yes | Text and image URLs |
| Quote Requests | ✅ Yes | From visitors |
| Orders | ✅ Yes | Full sync |
| Customers | ✅ Yes | Full sync |
| Expenses | ✅ Yes | Full sync |
| Media Library | ❌ No | Use external image hosting |

### For Images and Videos

Since Hostinger has limited storage, use external hosting:

- **Images**: [ImgBB](https://imgbb.com/), [Cloudinary](https://cloudinary.com/), or Hostinger's file manager
- **Videos**: YouTube, Google Drive (with sharing enabled), or Vimeo

Then paste the URL in the admin panel.

## File Size Limits

Hostinger shared hosting typically allows:
- **Max upload**: 128MB per file
- **Max POST size**: 128MB
- **Storage**: Depends on your plan

For a farm website, you'll have plenty of space for text data.

## Need Help?

1. Check browser console for errors (F12 → Console)
2. Check `api/data.php` directly in browser for API status
3. Contact Hostinger support for hosting-specific issues
