import os
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
    service_name = "group-api"

    # Locate and load the .env file
    env_file = find_env_file()
    print(color_text(f"Using .env file: {env_file}", OKGREEN))
    env_vars = load_env_variables(env_file)
    global DATABASE_PASSWORD
    DATABASE_PASSWORD = env_vars.get("DATABASE_PASSWORD", "")

    # Locate the GCP service account key
    key_file = find_key_file("../../service-account-keys", "hephaestus-418809-*.json")
    print(color_text(f"Using key file: {key_file}", OKGREEN))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    # Authenticate with gcloud
    print(color_text("Authenticating gcloud with a service account...", OKCYAN))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    # Build and push Docker image
    print(color_text("Building Docker image...", OKCYAN))
    env = os.environ.copy()
    env["DOCKER_BUILDKIT"] = "1"
    run_command(
        f"docker build -f {os.getcwd()}/Dockerfile -t gcr.io/{project_id}/{service_name}:latest --progress=plain ../..",
        env=env,
    )
    print(color_text("Pushing Docker image...", OKCYAN))
    run_command(f"docker push gcr.io/{project_id}/{service_name}:latest")

    # Deploy to Cloud Run without Cloud SQL
    print(color_text("Deploying to Cloud Run...", OKCYAN))
    deploy_to_cloud_run(
        project_id=project_id,
        region=region,
        service_name=service_name,
        env_vars=env_vars,  # Pass environment variables to Cloud Run
        force_recreate=True
    )


if __name__ == "__main__":
    main()
