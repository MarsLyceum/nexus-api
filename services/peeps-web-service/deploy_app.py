import os
import subprocess
import sys
from glob import glob


# ANSI escape sequences for coloring
class bcolors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


def find_key_file():
    key_files = glob("./terraform/hephaestus-418809-*.json")
    if not key_files:
        print(f"{bcolors.FAIL}No service account key file found{bcolors.ENDC}")
        sys.exit(1)
    return key_files[0]


def run_command(command, env=None):
    print(
        f"{bcolors.OKBLUE}Running command: {bcolors.BOLD}{command}{bcolors.ENDC}"
    )
    result = subprocess.run(command, shell=True, env=env)
    if result.returncode != 0:
        print(f"{bcolors.FAIL}Command failed: {command}{bcolors.ENDC}")
        sys.exit(result.returncode)


def main():
    # Find the service account key file
    key_file = find_key_file()
    print(f"{bcolors.OKGREEN}Using key file: {key_file}{bcolors.ENDC}")

    # Set environment variable for gcloud authentication
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    # Configure Docker to use gcloud as a credential helper
    print(
        f"{bcolors.OKCYAN}Configuring Docker to use gcloud as a credential helper...{bcolors.ENDC}"
    )
    run_command("gcloud auth configure-docker --quiet")

    # Authenticate gcloud with a service account
    print(
        f"{bcolors.OKCYAN}Authenticating gcloud with a service account...{bcolors.ENDC}"
    )
    run_command(f"gcloud auth activate-service-account --key-file={key_file}")

    # Build Docker image
    print(f"{bcolors.OKCYAN}Building Docker image...{bcolors.ENDC}")
    run_command(
        "DOCKER_BUILDKIT=1 docker build -t gcr.io/hephaestus-418809/hephaestus-api:latest ."
    )

    # Push Docker image
    print(f"{bcolors.OKCYAN}Pushing Docker image...{bcolors.ENDC}")
    run_command("docker push gcr.io/hephaestus-418809/hephaestus-api:latest")

    # Deploy to Cloud Run
    print(f"{bcolors.OKCYAN}Deploying to Cloud Run...{bcolors.ENDC}")
    run_command(
        "gcloud run deploy hephaestus-api "
        "--image=gcr.io/hephaestus-418809/hephaestus-api:latest "
        "--region=us-west1 "
        "--platform=managed "
        "--allow-unauthenticated "
        "--project=hephaestus-418809 "
        "--add-cloudsql-instances hephaestus-418809:us-west1:hephaestus-postgres"
    )

    # Enable unauthenticated calls
    print(f"{bcolors.OKCYAN}Enabling unauthenticated calls...{bcolors.ENDC}")
    run_command(
        "gcloud run services add-iam-policy-binding hephaestus-api "
        '--member="allUsers" '
        '--role="roles/run.invoker" '
        "--region=us-west1"
    )


if __name__ == "__main__":
    main()
