# Local development with Docker

Run Clozera's frontend, backend, and MongoDB services together with Docker
Compose. Run the following commands from the project root, where
`docker-compose.yml` is located.

## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose must be installed and running.
- A `backend/.env` file must exist. If it is missing, copy the example configuration:

  ```bash
  cp backend/.env.example backend/.env
  ```

  Do not overwrite an existing `.env` file. For local development, use
  `FRONTEND_URL=http://localhost:5173` and replace `SESSION_SECRET` with a long,
  random string. Compose points the backend's MongoDB connection to the
  `mongodb` service on its internal network.

- Ports `5173`, `3000`, and `27017` must be available. For example, stop any
  local Vite server before starting the frontend container.

## Starting the services

```bash
docker compose up -d --build
```

This command builds the application images and starts all three services in
the background:

| Service | Address |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| MongoDB | localhost:27017 |

`--build` rebuilds the application images using the current source code and
dependencies. `-d` runs the services in the background, leaving your terminal
available. Compose waits for MongoDB's health check, then the backend's health
check, before starting the frontend.

Open **http://localhost:5173** in your browser. Use `localhost` consistently
for session cookies and CORS settings.

To check service status and follow logs:

```bash
docker compose ps
docker compose logs -f api frontend
```

Pressing `Ctrl+C` to stop following logs does not stop the services.

To verify that the backend is ready:

```bash
curl http://localhost:3000/health/ready
```

The endpoint returns `{"status":"ready"}` when ready. The database may be
empty on the first run; the startup command does not automatically seed it.

## Stopping the services

```bash
docker compose stop
```

This command stops the frontend, backend, and MongoDB containers. It preserves
the containers and the volume storing MongoDB data, so the data remains available
the next time you start the services.

To start them again, use the same startup command:

```bash
docker compose up -d --build
```

Use `docker compose stop` to stop services during normal development.
`docker compose down -v` also deletes volumes and can cause database data loss.
