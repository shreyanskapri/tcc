# Trinity Computer Council — Pure HTML/CSS/JS

This version is intentionally built with **only HTML, CSS and JavaScript**. There is no Node.js, Express or database.

## Run

Open `index.html` directly in a browser, or use VS Code Live Server.

Admin dashboard:
`admin.html`

## Demo admin login

- Username: `admin`
- Password: `tcc2026`

Change this in `js/admin.js` before sharing the site.

## Included

- Responsive animated homepage
- About section
- Upcoming/past events
- Admin event creation/deletion
- Student registration
- Student ID validation for `SC26-1234` / `MG26-1234`
- Trinity email validation
- Magazine PDF uploads
- Executive board photo/name/position/introduction uploads
- Registration dashboard and CSV export
- Local browser persistence using `localStorage`
- Session-only admin login using `sessionStorage`

## Important limitation

Because this is pure frontend code, the data is stored in the **browser's localStorage**. That means:

- An admin upload is not automatically visible on another student's computer.
- Registrations are not shared between browsers/devices.
- Clearing browser data removes the local data.
- The demo admin authentication is not secure enough for production.

For a real college deployment, keep this frontend but connect it to a backend/database or a managed service such as Supabase/Firebase. Then registrations and uploaded magazines/team photos can be shared across all devices securely.

## File limits

The browser implementation limits magazine PDFs and images to approximately 8 MB. Large base64 files can consume browser storage quickly, so this version is best for prototyping/demo use.
