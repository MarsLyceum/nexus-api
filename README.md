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
