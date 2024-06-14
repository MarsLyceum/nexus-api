# hephaestus_api

The backend API for Hephaestus.

## Required Tools

- Python 3 for build and deploy scripts
- Terraform
- GCloud CLI

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

```

or this one

```docker run --rm --network=host gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.6.1 --address 0.0.0.0 --port 5432 --auto-iam-authn --credentials-file hephaestus-418809-aca9086bcf82.json hephaestus-418809:us-west1:hephaestus-postgres


```

## Testing Local Changes

To test a Google Cloud Run change locally you can run these Docker commands

```sh
docker build -t local-test .
docker run -it --rm -p 4000:4000 local-test
```
