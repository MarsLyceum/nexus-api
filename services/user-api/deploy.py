import os
from google.oauth2.service_account import Credentials
from google.cloud import apigateway_v1
from gcp_microservice_management import (
    find_env_file,
    load_env_variables,
    find_key_file,
    deploy_to_cloud_run,
    color_text,
    run_command,
    OKCYAN,
    OKGREEN,
)


def main():
    project_id = "hephaestus-418809"
    region = "us-west1"
    cloud_sql_instance = "hephaestus-418809:us-west1:user-api"
    service_name = "peeps-web-service"

    env_file = find_env_file()
    print(color_text(f"Using .env file: {env_file}", OKGREEN))
    env_vars = load_env_variables(env_file)
    global DATABASE_PASSWORD
    DATABASE_PASSWORD = env_vars.get("DATABASE_PASSWORD", "")

    key_file = find_key_file()
    print(color_text(f"Using key file: {key_file}", OKGREEN))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file


    print(
        color_text("Authenticating gcloud with a service account...", OKCYAN)
    )
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    print(color_text("Building Docker image...", OKCYAN))
    env = os.environ.copy()
    env["DOCKER_BUILDKIT"] = "1"
    run_command(
        f"docker build -t gcr.io/{project_id}/{service_name}:latest --progress=plain .",
        env=env,
    )
    print(color_text("Pushing Docker image...", OKCYAN))
    run_command(f"docker push gcr.io/{project_id}/{service_name}:latest")

    deploy_to_cloud_run(
        project_id, region, service_name, cloud_sql_instance, env_vars
    )


if __name__ == "__main__":
    main()
