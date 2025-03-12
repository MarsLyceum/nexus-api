# nexus_api

The backend API for Nexus.

## Architecture

-   Microservices with GCP on Google Cloud Run
-   Google Compute Engine VM running the Database
-   Google Cloud Storage for Images and Media
-   Squarespace for Domain: my-nexus.net
-   Cloudflare for CDN
-   Upstash for Redis Cache Around DB and Storage Requests

## DB

We use a Google Compute Engine VM running Postgres for our database. This is
cheaper than managed Google Cloud SQL and faster than Supabase.

You manage it by SSHing in and using the Postgres CLI.

````
gcloud compute ssh nexus-postgres-vm --zone=us-west1-a
```

To connect you can either setup a SSH Tunnel with this:

```
gcloud compute start-iap-tunnel nexus-postgres-vm 5432 --local-host-port=localhost:5432
```

or just connect with the public ip:
```
psql -h 34.169.241.220 -U postgres -d postgres
```

## Docker

On Windows Docker takes up a lot of space so periodically you have to clear
the space by first pruning the volumes with `docker system prune -a --volumes`
and then shrinking the docker wsl hard drive with
`Optimize-VHD -Path "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -Mode Full`.

## Required Development Tools

-   Python 3 for build and deploy scripts
-   Terraform
-   GCloud CLI
-   Docker
-   PostgreSQL for local DB config if you want to run it locally
-   pnpm package manager
-   Poetry Python package manager
-   The following Python packages:
    -   google-cloud-functions
    -   google-cloud-deploy
    -   google-auth
    -   python-dotenv
    -   types-protobuf
    -   google-cloud-api-gateway
    -   google-cloud-storage
    -   google-cloud-run
    -   docker
    -   setuptools
    -   gcp-microservice-management (our custom package)

## DB

We are using PostgreSQL for the Database.
To connect use the database name: "postgresql".

To connect we need to run the `downloadPrivateKeyFromGSM.py`
script to download the `private_key.pem` file to decrypt the password.

This requires the Google SDK to be setup as it uses the Google Secrets Manager
to download the file securely.

## Google SDK

We need to authenticate with the Google SDK with this command
`gcloud auth application-default login`.

## Docker Config

The Ansible `deploy_app.yml` script requires that Docker is authenticated with
GCloud with `gcloud auth configure-docker`.

## Cloud SQL Proxy

To connect to the Cloud SQL Database from your local machine you can use the
Cloud SQL Proxy simply download it from https://github.com/GoogleCloudPlatform/cloud-sql-proxy
and run it.
First you need to authenticate with `gcloud auth application-default login`
then you need to run it with `.\cloud-sql-proxy.exe hephaestus-418809:us-west1:hephaestus-postgres`

You can also run it using docker with this command:

```docker run --rm --network=host gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.6.1 --address 0.0.0.0 --port 5432 --token=$(gcloud auth print-access-token) --login-token=$(gcloud sql generate-login-token) --auto-iam-authn $(gcloud sql instances describe hephaestus-postgres --format='value(connectionName)')

````

or this one

```docker run --rm --network=host gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.6.1 --address 0.0.0.0 --port 5432 --auto-iam-authn --credentials-file hephaestus-418809-aca9086bcf82.json hephaestus-418809:us-west1:hephaestus-postgres


```

## Testing Local Changes

To test a Google Cloud Run change locally you can run these Docker commands

```sh
docker build -t local-test .
docker run -it --rm -p 4000:4000 local-test
```

### Testing WebSocket Connection

To test the WebSocket connection you can do the following:

Connect with

```sh
wscat -c ws://localhost:4000/graphql -s graphql-transport-ws
```

or on Google Cloud Run with

```sh
wscat -c wss://hephaestus-api-iwesf7iypq-uw.a.run.app/graphql -s graphql-transport-ws
```

Send the initialization message with

```sh
{"type":"connection_init","payload":{"reconnect":true}}
```

Send the GraphQL subscription message:

```sh
 {"id":"1","type":"subscribe","payload":{"query":"subscription OnGreeting { greetings }"}}
```

To access the database you will need the credentials. If you want to run things
such as TypeORM migrations or run the service locally and connect to the Cloud DB
you will need to make a .env file and put the following information in it

```.env
DATABASE_NAME=...
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
```

you can get this information from David, make sure that you do not check it into git.

## Port Binding Error

Sometimes when running a service on Windows you will get this error:
`listen EACCES: permission denied 0.0.0.0:4000` if this happens the solution
is to stop and restart the Windows NAT driver service with [listen-eacces-permission-denied-in-windows](#https://stackoverflow.com/questions/59428844/listen-eacces-permission-denied-in-windows)

```sh
net stop winnat
net start winnat
```

## Migrations

TypeORM requires that we generate and perform migrations each time we change one of the entities
as that changes the structure of the database. In order to do this run
the scripts in the package.json for the service: `typeorm:migration:generate`.
Then you should move any generated migrations into a `migrations` folder.
Then you should run `npx tsc` from the `migrations` folder to generate
JavaScript migrations from the TypeScript migrations.

Then once you have the JavaScript migrations in the `migrations` folder, which
will be connected to the TypeORM `DataSource` run `typeorm:migrations:run` and
it will scan that folder and run the migrations to apply the changes to the database.
