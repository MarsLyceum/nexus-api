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


# Function to color text output
def color_text(text, color_code):
    return f"{color_code}{text}{ENDC}"


# Function to find the service account key file
def find_key_file():
    key_files = glob("./terraform/hephaestus-418809-*.json")
    if not key_files:
        print(color_text("No service account key file found", FAIL))
        sys.exit(1)
    return key_files[0]


# Function to run a command in the shell
def run_command(command, env=None):
    redacted_command = command.replace(DATABASE_PASSWORD, "****")
    print(color_text(f"Running command: {redacted_command}", OKBLUE + BOLD))
    result = subprocess.run(
        command, shell=True, env=env, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(color_text(f"Command failed: {redacted_command}", FAIL))
        print(result.stderr)
        raise RuntimeError(result.stderr)
    return result.stdout


# Function to run a command with a retry mechanism
def run_command_with_retry(command, error_message, retry_command, env=None):
    try:
        return run_command(command, env)
    except RuntimeError as e:
        if error_message in str(e):
            print(
                color_text(
                    "Resource already exists. Deleting and recreating...",
                    WARNING,
                )
            )
            run_command(retry_command, env)
            return run_command(command, env)
        else:
            raise


# Function to find the .env file in the directory tree
def find_env_file():
    current_dir = os.getcwd()
    while current_dir != os.path.dirname(current_dir):
        env_path = os.path.join(current_dir, ".env")
        if os.path.isfile(env_path):
            return env_path
        current_dir = os.path.dirname(current_dir)
    print(color_text(".env file not found", FAIL))
    sys.exit(1)


# Function to load environment variables from the .env file
def load_env_variables(env_file):
    env_vars = {}
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, value = line.split("=", 1)
                env_vars[key] = value
    return env_vars


# Function to check if an API configuration is in use
def check_api_config_usage(project_id, api_gateway_name, api_config_id):
    try:
        result = run_command(
            f"gcloud api-gateway gateways list --project={project_id} --filter='apiConfig:{api_config_id}'"
        )
        return api_config_id in result
    except RuntimeError as e:
        return False


def check_api_config_exists(project_id, api_id, api_config_id):
    command = (
        f"gcloud api-gateway api-configs describe {api_config_id} "
        f"--api={api_id} "
        f"--project={project_id}"
    )
    try:
        run_command(command)
        print(color_text(f"API config {api_config_id} exists.", OKGREEN))
        return True
    except RuntimeError as e:
        if "NOT_FOUND" in str(e):
            print(
                color_text(
                    f"API config {api_config_id} does not exist.", WARNING
                )
            )
            return False
        else:
            raise


def check_gateway_exists(project_id, location, gateway_name):
    command = f"gcloud api-gateway gateways list --project={project_id} --location={location}"
    gateways = run_command(command)
    if gateway_name in gateways:
        print(color_text(f"Gateway {gateway_name} already exists.", OKGREEN))
        return True
    else:
        print(color_text(f"Gateway {gateway_name} does not exist.", WARNING))
        return False


def create_gateway(project_id, location, gateway_name, api_id, api_config_id):
    command = (
        f"gcloud api-gateway gateways create {gateway_name} "
        f"--api={api_id} "
        f"--api-config={api_config_id} "
        f"--location={location} "
        f"--project={project_id}"
    )
    run_command(command)
    print(color_text(f"Gateway {gateway_name} created.", OKGREEN))


def main():
    # Project and service configuration
    project_id = "hephaestus-418809"
    region = "us-west1"
    api_gateway_region = "us-west2"
    cloud_sql_instance = "hephaestus-418809:us-west1:user-api"
    api_config_file = "peeps-web-service.yml"
    api_gateway_name = "peeps-web-service-api-gateway"
    api_id = "peeps-web-service-api"
    api_config_id = f"{api_id}-config"
    service_name = "peeps-web-service"

    # Find and load environment variables
    env_file = find_env_file()
    print(color_text(f"Using .env file: {env_file}", OKGREEN))
    env_vars = load_env_variables(env_file)
    global DATABASE_PASSWORD
    DATABASE_PASSWORD = env_vars.get("DATABASE_PASSWORD", "")

    # Find the service account key file
    key_file = find_key_file()
    print(color_text(f"Using key file: {key_file}", OKGREEN))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    # Configure Docker to use gcloud as a credential helper
    print(
        color_text(
            "Configuring Docker to use gcloud as a credential helper...",
            OKCYAN,
        )
    )
    run_command("gcloud auth configure-docker --quiet")

    # Authenticate gcloud with the service account
    print(
        color_text("Authenticating gcloud with a service account...", OKCYAN)
    )
    run_command(f"gcloud auth activate-service-account --key-file={key_file}")

    # Set the Google Cloud project
    run_command(f"gcloud config set project {project_id}")

    # Enable required APIs
    print(color_text("Enabling required APIs...", OKCYAN))
    run_command(
        f"gcloud services enable run.googleapis.com apigateway.googleapis.com --project={project_id}"
    )

    # Build and push the Docker image
    print(color_text("Building Docker image...", OKCYAN))
    env = os.environ.copy()
    env["DOCKER_BUILDKIT"] = "1"
    run_command(
        f"docker build -t gcr.io/{project_id}/{service_name}:latest .",
        env=env,
    )
    print(color_text("Pushing Docker image...", OKCYAN))
    run_command(f"docker push gcr.io/{project_id}/{service_name}:latest")

    # Deploy the service to Cloud Run
    env_var_flags = ",".join(
        [f"{key}={value}" for key, value in env_vars.items()]
    )
    print(color_text("Deploying to Cloud Run...", OKCYAN))
    run_command(
        f"gcloud run deploy {service_name} "
        f"--image=gcr.io/{project_id}/{service_name}:latest "
        f"--region={region} "
        f"--platform=managed "
        f"--add-cloudsql-instances {cloud_sql_instance} "
        f"--project={project_id} "
        f'--set-env-vars INSTANCE_CONNECTION_NAME="{cloud_sql_instance}",{env_var_flags}'
    )

    # # Retrieve and print the Cloud Run URL
    # print(color_text("Retrieving Cloud Run URL...", OKCYAN))
    # cloud_run_info = run_command(
    #     f"gcloud run services describe {service_name} "
    #     f"--region={region} "
    #     f"--format='value(status.url)'"
    # )
    # print(color_text(f"Cloud Run URL: {cloud_run_info}", OKGREEN))

    # Create or update the API configuration
    print(color_text("Creating new API configuration...", OKCYAN))
    create_command = (
        f"gcloud api-gateway api-configs create {api_config_id} "
        f"--api={api_gateway_name} "
        f"--openapi-spec={api_config_file} "
        f"--project={project_id}"
    )
    # delete_command = (
    #     f"gcloud api-gateway api-configs delete {api_config_id} "
    #     f"--api={api_gateway_name} "
    #     f"--project={project_id} "
    #     f"--quiet"
    # )

    try:
        run_command(create_command)
    except Exception:
        print(
            color_text(
                "Gateway config already exists",
                WARNING,
            )
        )

    # if check_api_config_usage(project_id, api_gateway_name, api_config_id):
    #     print(
    #         color_text("API config is currently in use, updating...", OKCYAN)
    #     )
    #     try:
    #         run_command(
    #             f"gcloud api-gateway gateways update {api_gateway_name} "
    #             f"--api-config={api_config_id} "
    #             f"--location={api_gateway_region} "
    #             f"--project={project_id}"
    #         )
    #     except RuntimeError as e:
    #         if "NOT_FOUND" in str(e):
    #             print(
    #                 color_text(
    #                     "Gateway not found. Creating a new gateway...",
    #                     WARNING,
    #                 )
    #             )
    #             run_command(
    #                 f"gcloud api-gateway gateways create {api_gateway_name} "
    #                 f"--api={api_gateway_name} "
    #                 f"--api-config={api_config_id} "
    #                 f"--location={api_gateway_region} "
    #                 f"--project={project_id}"
    #             )
    #         else:
    #             raise
    # else:
    #     run_command_with_retry(
    #         create_command, "ALREADY_EXISTS", delete_command
    #     )

    if not check_gateway_exists(
        project_id, api_gateway_region, api_gateway_name
    ):
        create_gateway(
            project_id,
            api_gateway_region,
            api_gateway_name,
            api_id,
            api_config_id,
        )

    # Retrieve and print the API Gateway URL
    print(color_text("Retrieving API Gateway URL...", OKCYAN))
    gateway_info = run_command(
        f"gcloud api-gateway gateways describe {api_gateway_name} "
        f"--location={api_gateway_region} "
        f"--project={project_id}"
    )

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
