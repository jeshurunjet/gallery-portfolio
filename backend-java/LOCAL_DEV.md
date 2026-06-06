Use the installed Maven on this machine for local backend testing.

Recommended setup:

1. Copy `src/main/resources/application-devlocal.example.properties` to `src/main/resources/application-devlocal.properties`
2. Adjust any local-only values in that copied file
3. Run the backend with:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=devlocal
```

Notes:

- `application-devlocal.properties` is gitignored
- `backend-java/.mvn/` is gitignored if you want to add local wrapper files or Maven config for testing
- the repo already has H2-friendly local config values in the example file
