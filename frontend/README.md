# Frontend Local Development

This frontend is configured to talk to the local backend at:

```bash
http://localhost:8082
```

The project editor is fully standardized on Tiptap.

## Run locally

Backend:

```bash
cd backend-java
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

```bash
http://localhost:5173
```

## Important local defaults

- Backend local port: `8082`
- Frontend API URL: `http://localhost:8082`
- Local database: H2 file database via `application-local.properties`
