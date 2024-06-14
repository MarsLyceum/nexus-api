import os
import subprocess
import sys
from glob import glob

# ANSI escape sequences for colors
HEADER = "\033[95m"
OKBLUE = "\033[94m"
OKCYAN = "\033[96m"
OKGREEN = "\033[92m"
WARNING = "\033[93m"
FAIL = "\033[91m"
ENDC = "\033[0m"
BOLD = "\033[1m"
UNDERLINE = "\033[4m"


def color_text(text, color_code):
    return f"{color_code}{text}{ENDC}"


def find_key_file():
    key_files = glob("./terraform/hephaestus-418809-*.json")
    if not key_files:
        print(color_text("No service account key file found", FAIL))
        sys.exit(1)
    return key_files[0]


def run_command(command, env=None):
    print(color_text(f"Running command: {command}", OKBLUE + BOLD))
    result = subprocess.run(command, shell=True, env=env)
    if result.returncode != 0:
        print(color_text(f"Command failed: {command}", FAIL))
        sys.exit(result.returncode)


def main():
    project_id = "hephaestus-418809"
    region = "us-west1"

    # Find the service account key file
    key_file = find_key_file()
    print(color_text(f"Using key file: {key_file}", OKGREEN))

    # Set environment variable for gcloud authentication
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    # Configure Docker to use gcloud as a credential helper
    print(
        color_text(
            "Configuring Docker to use gcloud as a credential helper...",
            OKCYAN,
        )
    )
    run_command("gcloud auth configure-docker --quiet")

    # Authenticate gcloud with a service account
    print(
        color_text("Authenticating gcloud with a service account...", OKCYAN)
    )
    run_command(f"gcloud auth activate-service-account --key-file={key_file}")

    # Ensure the correct project is set for gcloud commands
    run_command(f"gcloud config set project {project_id}")

    # Enable Cloud Run Admin API
    print(color_text("Enabling Cloud Run Admin API...", OKCYAN))
    run_command(
        f"gcloud services enable run.googleapis.com --project={project_id}"
    )

    # Build Docker image with BuildKit enabled
    print(color_text("Building Docker image...", OKCYAN))
    env = os.environ.copy()
    env["DOCKER_BUILDKIT"] = "1"
    run_command(
        "docker build -t gcr.io/hephaestus-418809/hephaestus-api:latest .",
        env=env,
    )

    # Push Docker image
    print(color_text("Pushing Docker image...", OKCYAN))
    run_command("docker push gcr.io/hephaestus-418809/hephaestus-api:latest")

    # Deploy to Cloud Run
    print(color_text("Deploying to Cloud Run...", OKCYAN))
    run_command(
        f"gcloud run deploy hephaestus-api "
        f"--image=gcr.io/{project_id}/hephaestus-api:latest "
        f"--region={region} "
        f"--platform=managed "
        f"--allow-unauthenticated "
        f"--project={project_id} "
        f"--add-cloudsql-instances {project_id}:{region}:hephaestus-postgres"
    )

    # Enable unauthenticated calls
    print(color_text("Enabling unauthenticated calls...", OKCYAN))
    run_command(
        f"gcloud run services add-iam-policy-binding hephaestus-api "
        f'--member="allUsers" '
        f'--role="roles/run.invoker" '
        f"--region={region}"
    )


if __name__ == "__main__":
    main()
