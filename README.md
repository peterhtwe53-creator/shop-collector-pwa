# Shop Collector PWA

A modern, installable web app to collect:
- Shop Name
- Remark
- Shop Popularity (⭐ rating)
- GPS location (captured on open)
- A photo (uses your phone camera)

Data goes to Google Sheets; photos go to Google Drive (named after the Shop Name).

## Files
- `index.html` — UI
- `style.css` — Modern Native UI styles
- `app.js` — Logic (edit `SCRIPT_URL` after deploying Apps Script)
- `manifest.webmanifest` — PWA manifest
- `service-worker.js` — Caching for offline shell
- `icons/` — PWA icons
- `apps_script/Code.gs` — Google Apps Script backend
- `apps_script/README.txt` — How to deploy the Apps Script

## Quick start
1) Deploy Apps Script backend (see `apps_script/README.txt`) and paste the Web App URL into `app.js` as `SCRIPT_URL`.
2) Host this folder on HTTPS (e.g., GitHub Pages) to enable camera + geolocation + PWA install.
3) Open on your phone, allow permissions, and submit. 🎉
