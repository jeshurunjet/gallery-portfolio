# Gallery Portfolio

A personal, media-rich gallery portfolio web application with a React + Vite frontend and a Spring Boot backend. The site showcases projects, artwork, and media (images, PDFs, audio, video) and includes a lightweight admin interface to create and edit project content using the Tiptap rich-text editor.

## Features

- Responsive project listing with tag-based filtering
- Rich project pages supporting image galleries, embedded PDFs, audio and video playback
- Admin interface with Tiptap editor for rich content and media uploads
- Protected admin routes and session-based authentication helpers
- Local H2 file database for development

## Tech stack

- Frontend: React, Vite, TypeScript, Tiptap
- Backend: Spring Boot (Java), Maven
- Dev database: H2 (file-backed for local development)

## Local development

The frontend is configured to talk to the local backend at `http://localhost:8082`.

Run the backend (from the repo root):

```bash
cd backend-java
mvn spring-boot:run -Dspring-boot.run.profiles=devlocal
```

Run the frontend (from the repo root):

```bash
cd frontend
npm install
npm run dev
```

Open the frontend in your browser at:

```bash
http://localhost:5173
```

Important local defaults:

- Backend local port: `8082`
- Frontend API URL: `http://localhost:8082`
- Local database: H2 file database via `application-local.properties`

## Usage examples

- Browse projects on the home page and click through to view detailed project pages with media.
- Sign in to the admin UI (local config) to add or edit projects and upload media files.

## Contributing

Contributions are welcome. For small changes, open a pull request with a clear description. If you'd like to add features or fix bugs, please file an issue first so we can discuss the approach.

## License

This repository does not include a license file. Add a `LICENSE` file if you want to make the project's license explicit.

---

For frontend-specific notes see `frontend/README.md`.
