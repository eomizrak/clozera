# clozera
Open-source language learning app built around cloze-based practice.

## Development

Create a local backend environment file before running Docker Compose:

```sh
cp backend/.env.example backend/.env
```

Then start the development services:

```sh
docker compose up --build
```

## Local MongoDB

Local Docker tracks the latest MongoDB 8.0 patch with `mongo:8.0`. Refresh the
database image before testing with `docker compose up -d --pull always mongodb`.
Compose also sets `pull_policy: always` for MongoDB, so normal startup checks for updates.
Local and Atlas Free use the same MongoDB 8.0 release series. Atlas manages its
patch schedule, so exact patch versions can differ. Server versions cannot be
manually selected on the free tier. Changing the Compose image does not change Atlas.

Compose uses the `mongodb80-data` volume key. Existing `mongodb-data` volumes
are not copied automatically. Before starting an existing installation, identify
its current MongoDB version, FCV and mounted volume, then prepare a verified copy
for the new volume. Do not attach data from an incompatible release directly to
MongoDB 8.0; follow the supported migration procedure on the restored copy.

Before changing the MongoDB release series or data volume, stop application writes,
take a consistent backup and validate a restored copy using MongoDB's supported
migration procedure. Keep the source volume until the new copy is verified.
Use `docker compose stop` for ordinary shutdowns; `docker compose down -v` deletes
the declared database volume.
