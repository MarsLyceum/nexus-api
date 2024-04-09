# hephaestus_api

The backend API for Hephaestus.

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

## Kubernetes Config

The Ansible script uses the Kubernetes configuration that is created by
Terraform to run you can get this saved to your local `.kube/config`
file by running the command `gcloud container clusters get-credentials $(terraform output -raw cluster_name) --region $(terraform output -raw cluster_location)` then you can simply replace
the contents of `.kubeconfig` with this file. The Terraform
outputs _should_ be doing this but they don't seem to be working for some
reason.

To keep billing low, let's only use Terraform clusters in bursts. We have
to pay for having the cluster running so let's just run `terraform destroy`
anytime we aren't actively testing stuff.

## Docker Config

The Ansible `deploy_app.yml` script requires that Docker is authenticated with
GCloud with `gcloud auth configure-docker`.

## Cloud SQL Proxy

To connect to the Cloud SQL Database from your local machine you can use the
Cloud SQL Proxy simply download it from https://github.com/GoogleCloudPlatform/cloud-sql-proxy
and run it.
First you need to authenticate with `gcloud auth application-default login`
then you need to run it with `.\cloud-sql-proxy.exe hephaestus-418809:us-west1:hephaestus-postgres`
