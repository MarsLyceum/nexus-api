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
    redacted_command = command.replace(DATABASE_PASSWORD, "****")
    print(color_text(f"Running command: {redacted_command}", OKBLUE + BOLD))
    result = subprocess.run(
        command, shell=True, env=env, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(color_text(f"Command failed: {redacted_command}", FAIL))
        print(result.stderr)
        sys.exit(result.returncode)
    return result.stdout


def find_env_file():
    current_dir = os.getcwd()
    while current_dir != os.path.dirname(current_dir):
        env_path = os.path.join(current_dir, ".env")
        if os.path.isfile(env_path):
            return env_path
        current_dir = os.path.dirname(current_dir)
    print(color_text(".env file not found", FAIL))
    sys.exit(1)


def load_env_variables(env_file):
    env_vars = {}
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, value = line.split("=", 1)
                env_vars[key] = value
    return env_vars


def main():
    project_id = "hephaestus-418809"
    region = "us-west1"
    api_gateway_region = "us-west2"
    cloud_sql_instance = "hephaestus-418809:us-west1:user-api"
    api_config_file = "peeps-web-service.yml"
    api_gateway_name = "peeps-web-service-api-gateway"
    api_id = "peeps-web-service-api"

    # Find the .env file
    env_file = find_env_file()
    print(color_text(f"Using .env file: {env_file}", OKGREEN))

    # Load environment variables from .env file
    env_vars = load_env_variables(env_file)
    global DATABASE_PASSWORD
    DATABASE_PASSWORD = env_vars.get("DATABASE_PASSWORD", "")

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

    # Enable required APIs
    print(color_text("Enabling required APIs...", OKCYAN))
    run_command(
        f"gcloud services enable run.googleapis.com apigateway.googleapis.com --project={project_id}"
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

    # Prepare the environment variables for Cloud Run
    env_var_flags = ",".join(
        [f"{key}={value}" for key, value in env_vars.items()]
    )

    # Deploy to Cloud Run
    print(color_text("Deploying to Cloud Run...", OKCYAN))
    run_command(
        f"gcloud run deploy hephaestus-api "
        f"--image=gcr.io/{project_id}/hephaestus-api:latest "
        f"--region={region} "
        f"--platform=managed "
        f"--add-cloudsql-instances {cloud_sql_instance} "
        f"--project={project_id} "
        f'--set-env-vars INSTANCE_CONNECTION_NAME="{cloud_sql_instance}",{env_var_flags}'
    )

    # Create or update API Gateway
    print(color_text("Creating or updating API Gateway...", OKCYAN))
    run_command(
        f"gcloud api-gateway api-configs create {api_id} "
        f"--api={api_gateway_name} "
        f"--openapi-spec={api_config_file} "
        f"--project={project_id}"
    )

    # Deploy API Gateway
    run_command(
        f"gcloud api-gateway gateways create {api_gateway_name}-gateway "
        f"--api={api_gateway_name} "
        f"--api-config={api_id} "
        f"--location={api_gateway_region} "
        f"--project={project_id}"
    )

    # Get API Gateway URL
    print(color_text("Retrieving API Gateway URL...", OKCYAN))
    gateway_info = run_command(
        f"gcloud api-gateway gateways describe {api_gateway_name}-gateway "
        f"--location={api_gateway_region} "
        f"--project={project_id}"
    )

    # Extract the defaultHostname from the gateway info
    for line in gateway_info.splitlines():
        if "defaultHostname" in line:
            api_gateway_url = line.split(":")[1].strip()
            print(
                color_text(
                    f"API Gateway URL: https://{api_gateway_url}", OKGREEN
                )
            )
            break
    else:
        print(color_text("API Gateway URL not found in the output.", FAIL))


if __name__ == "__main__":
    main()
