# Researchthon 2025

A modern web application built using Vite, React, and Tailwind CSS for the Researchthon 2025 event portal. This project is organized for extendibility and developer ease, enabling fast frontend enhancements and Firebase hosting integration.

## Features
- Lightning-fast Vite + React setup
- Tailwind CSS for rapid styling
- Firebase-compatible for hosting and announcements
- Modular structure for scalable development

## Folder Structure
```
Researchthon-2025/
│
├── src/
│   ├── pages/                        # Full-screen pages/components
│   │   ├── LandingPage.jsx
│   │   ├── AnnouncementsPage.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── NotFound.jsx
│   ├── components/                   # Reusable UI components
│   │   ├── AnnouncementCard.jsx
│   │   ├── AnnouncementList.jsx
│   │   ├── AdminAnnouncementForm.jsx
│   │   ├── FileUploadButton.jsx
│   │   ├── Loader.jsx
│   │   └── ProtectedRoute.jsx
│   ├── layout/                       # Shared structure (Navigation/Footer)
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── firebase/                     # Firebase logic and config
│   │   ├── client.js                 # Firebase initialization
│   │   ├── refs.js                   # Firestore refs/storage paths
│   │   ├── upload.js                 # Storage upload helpers
│   │   └── queries.js                # Announcement actions
│   ├── utils/                        # General-purpose helpers
│   │   ├── formatTimestamp.js
│   │   ├── randomId.js
│   │   ├── sanitizeFileName.js
│   │   └── localAuth.js              # Local login logic
│   ├── App.jsx                       # App routes and global layout
│   ├── main.jsx                      # React root mount
│   └── index.css                     # Tailwind CSS config
├── public/                           # Static assets
│   ├── logo.png
│   └── favicon.ico

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Deployment
- Hosted using Firebase. Production build output is automatically served from `dist`.
- To deploy, build and use Firebase CLI:
   ```bash
   npm run build
   firebase deploy
   ```

## Development Notes
- All sensitive configuration (Firebase keys, user credentials) must be kept secure and never committed to the repository.
- Folder structure can be easily extended.
- All enhancement features (backgrounds, animations) should be added into respective page/component/layout files for maintainability.

## Contributing
Pull requests and suggestions are welcome. Please open issues for feature requests or bug reports related to the Researchthon 2025 portal interface.

## License
MIT
