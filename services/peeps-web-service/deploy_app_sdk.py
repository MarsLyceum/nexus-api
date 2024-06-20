import os
import sys
from glob import glob
from google.cloud import run_v2, apigateway_v1
from google.cloud.apigateway_v1.types import Gateway
from google.oauth2.service_account import Credentials
from google.api_core.exceptions import NotFound
import docker
from dotenv import load_dotenv
from docker.errors import DockerException
import subprocess
import time
import datetime

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
    load_dotenv(env_file)
    return {
        key: os.getenv(key)
        for key in os.environ
        if key.startswith("DATABASE_")
    }


# Function to build and push Docker image using Docker SDK
def build_and_push_docker_image(project_id, service_name, docker_client):
    image_tag = f"gcr.io/{project_id}/{service_name}:latest"
    print(color_text("Building Docker image...", OKCYAN))
    docker_client.images.build(path=".", tag=image_tag)
    print(color_text("Pushing Docker image...", OKCYAN))
    docker_client.images.push(image_tag)


# Function to check if a resource is deleted
def wait_for_deletion(get_func, name):
    while True:
        try:
            get_func(name=name)
            print(
                color_text(
                    f"Waiting for {name} to be completely deleted...", WARNING
                )
            )
            time.sleep(5)  # wait for 5 seconds before checking again
        except NotFound:
            break


# Function to deploy the service to Cloud Run using Google Cloud SDK
def deploy_to_cloud_run(
    project_id, region, service_name, cloud_sql_instance, env_vars
):
    print(color_text("Deploying to Google Cloud Run...", OKCYAN))
    client = run_v2.ServicesClient()
    service_path = (
        f"projects/{project_id}/locations/{region}/services/{service_name}"
    )

    # Define the service configuration
    service = run_v2.Service(
        template=run_v2.RevisionTemplate(
            containers=[
                run_v2.Container(
                    image=f"gcr.io/{project_id}/{service_name}:latest",
                    env=[
                        run_v2.EnvVar(name=key, value=value)
                        for key, value in env_vars.items()
                    ],
                    volume_mounts=[
                        run_v2.VolumeMount(
                            name="cloudsql", mount_path="/cloudsql"
                        )
                    ],
                )
            ],
            volumes=[
                run_v2.Volume(
                    name="cloudsql",
                    cloud_sql_instance=run_v2.CloudSqlInstance(
                        instances=[cloud_sql_instance]
                    ),
                )
            ],
            annotations={
                "run.googleapis.com/cloudsql-instances": cloud_sql_instance
            },
        ),
    )

    # Check if the service already exists
    try:
        existing_service = client.get_service(name=service_path)
        if existing_service:
            print(
                color_text(
                    f"Service {service_name} already exists. Deleting...",
                    WARNING,
                )
            )
            client.delete_service(name=service_path)
            print(
                color_text(
                    f"Service {service_name} deleted. Waiting for complete deletion...",
                    OKGREEN,
                )
            )
            wait_for_deletion(
                client.get_service,
                service_path,
            )
    except NotFound:
        print(
            color_text(
                f"Service {service_name} does not exist. Creating new service...",
                OKGREEN,
            )
        )

    # Create the new service
    client.create_service(
        parent=f"projects/{project_id}/locations/{region}",
        service=service,
        service_id=service_name,
    )

    # Wait until the service is successfully created
    print(color_text(f"Waiting for {service_name} to be created...", OKCYAN))
    while True:
        try:
            client.get_service(name=service_path)
            print(
                color_text(f"Service {service_name} is now active.", OKGREEN)
            )
            break
        except NotFound:
            print(
                color_text(
                    f"Waiting for {service_name} to be created...", WARNING
                )
            )
            time.sleep(5)  # wait for 5 seconds before checking again


# Function to create or update the API configuration using Google Cloud SDK
def create_or_update_api_config(
    project_id, api_id, api_config_id, api_config_file
):
    print(color_text("Creating or Updating API Config...", OKCYAN))
    client = apigateway_v1.ApiGatewayServiceClient()
    parent = client.api_path(project_id, api_id)
    api_config_name = f"projects/{project_id}/locations/global/apis/{api_id}/configs/{api_config_id}"

    api_config = apigateway_v1.ApiConfig(
        name=api_config_name,
        display_name=api_config_id,
        openapi_documents=[
            apigateway_v1.ApiConfig.OpenApiDocument(
                document=apigateway_v1.ApiConfig.File(path=api_config_file)
            )
        ],
    )

    try:
        existing_config = client.get_api_config(name=api_config_name)
        if existing_config:
            print(
                color_text(
                    f"API Config {api_config_id} already exists. Deleting...",
                    WARNING,
                )
            )
            client.delete_api_config(name=api_config_name)
            print(
                color_text(
                    f"API Config {api_config_id} deleted. Waiting for complete deletion...",
                    OKGREEN,
                )
            )
            wait_for_deletion(client.get_api_config, api_config_name)
    except NotFound:
        print(
            color_text(
                f"API Config {api_config_id} does not exist. Creating new API Config...",
                OKGREEN,
            )
        )

    start_time = datetime.datetime.now()
    max_duration = datetime.timedelta(minutes=10)
    while True:
        try:
            client.create_api_config(
                parent=parent,
                api_config=api_config,
                api_config_id=api_config_id,
            )
            print(color_text(f"API Config {api_config_id} created.", OKGREEN))
            break
        except Exception as e:
            print(color_text(f"Error creating API Config: {e}", WARNING))
            elapsed_time = datetime.datetime.now() - start_time
            if elapsed_time > max_duration:
                print(color_text("Max duration reached. Exiting...", FAIL))
                raise RuntimeError(
                    "Failed to create API Config within the allowed time frame."
                )
            print(color_text("Retrying in 5 seconds...", WARNING))
            time.sleep(5)  # wait for 5 seconds before retrying


def create_api_gateway_service(
    client: apigateway_v1.ApiGatewayServiceClient, project_id: str, api_id: str
) -> None:
    """Create an API if it doesn't exist and wait until it is created."""
    api_name = f"projects/{project_id}/locations/global/apis/{api_id}"
    try:
        existing_api = client.get_api(name=api_name)
        if existing_api:
            print(
                color_text(
                    f"API {api_id} already exists. Deleting...", WARNING
                )
            )
            client.delete_api(name=api_name)
            print(
                color_text(
                    f"API {api_id} deleted. Waiting for complete deletion...",
                    OKGREEN,
                )
            )
            wait_for_deletion(client.get_api, api_name)
    except NotFound:
        print(
            color_text(
                f"API {api_id} does not exist. Creating new API...", OKGREEN
            )
        )

    api = apigateway_v1.Api(display_name=api_id)
    client.create_api(
        parent=f"projects/{project_id}/locations/global",
        api=api,
        api_id=api_id,
    )
    print(color_text(f"Waiting for API {api_id} to be created...", OKCYAN))

    # Wait until the API is successfully created
    while True:
        try:
            client.get_api(name=api_name)
            print(color_text(f"API {api_id} is now active.", OKGREEN))
            break
        except NotFound:
            print(
                color_text(
                    f"Waiting for API {api_id} to be created...", WARNING
                )
            )
            time.sleep(5)  # wait for 5 seconds before checking again


def create_gateway(
    client: apigateway_v1.ApiGatewayServiceClient,
    project_id: str,
    location: str,
    gateway_name: str,
    api_id: str,
    api_config_id: str,
) -> None:
    gateway_name_full = (
        f"projects/{project_id}/locations/{location}/gateways/{gateway_name}"
    )
    print(color_text("Creating API Gateway...", OKCYAN))

    try:
        existing_gateway = client.get_gateway(name=gateway_name_full)
        if existing_gateway:
            print(
                color_text(
                    f"Gateway {gateway_name} already exists. Deleting...",
                    WARNING,
                )
            )
            client.delete_gateway(name=gateway_name_full)
            print(
                color_text(
                    f"Gateway {gateway_name} deleted. Waiting for complete deletion...",
                    OKGREEN,
                )
            )
            wait_for_deletion(client.get_gateway, gateway_name_full)
    except NotFound:
        print(
            color_text(
                f"Gateway {gateway_name} does not exist. Creating new Gateway...",
                OKGREEN,
            )
        )

    gateway = Gateway(
        name=gateway_name_full,
        api_config=f"projects/{project_id}/locations/global/apis/{api_id}/configs/{api_config_id}",
    )
    client.create_gateway(
        parent=f"projects/{project_id}/locations/{location}",
        gateway_id=gateway_name,
        gateway=gateway,
    )
    print(color_text(f"Gateway {gateway_name} created.", OKGREEN))


def build_docker_client():
    try:
        docker_client = docker.from_env()
        docker_client.ping()
        print(color_text("Docker daemon is running.", OKGREEN))
        return docker_client
    except DockerException as e:
        print(color_text(f"Docker error: {e}", FAIL))
        sys.exit(1)


def check_gateway_exists(
    client: apigateway_v1.ApiGatewayServiceClient,
    project_id: str,
    location: str,
    gateway_name: str,
) -> bool:
    try:
        response = client.list_gateways(
            parent=f"projects/{project_id}/locations/{location}"
        )
        for gateway in response.gateways:
            if gateway_name == gateway.name:
                print(
                    color_text(
                        f"Gateway {gateway_name} already exists.", OKGREEN
                    )
                )
                return True
        print(color_text(f"Gateway {gateway_name} does not exist.", WARNING))
        return False
    except NotFound:
        return False


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


def main():
    # Project and service configuration
    project_id = "hephaestus-418809"
    region = "us-west1"
    api_gateway_region = "us-west2"
    cloud_sql_instance = "hephaestus-418809:us-west1:user-api"
    api_config_file = os.path.join(os.getcwd(), "peeps-web-service.yml")
    api_gateway_name = "peeps-web-service-api-gateway"
    service_name = "peeps-web-service"
    api_id = "peeps-web-service-api"
    api_config_id = f"{api_id}-config"

    # Find and load environment variables
    env_file = find_env_file()
    print(color_text(f"Using .env file: {env_file}", OKGREEN))
    env_vars = load_env_variables(env_file)
    global DATABASE_PASSWORD
    DATABASE_PASSWORD = env_vars.get("DATABASE_PASSWORD", "")

    # Find the service account key file
    key_file = find_key_file()
    print(color_text(f"Using key file: {key_file}", OKGREEN))
    credentials = Credentials.from_service_account_file(key_file)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    api_gateway_client = apigateway_v1.ApiGatewayServiceClient(
        credentials=credentials
    )

    # Authenticate gcloud with the service account
    print(
        color_text("Authenticating gcloud with a service account...", OKCYAN)
    )
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    # Build and push the Docker image
    print(color_text("Building Docker image...", OKCYAN))
    env = os.environ.copy()
    env["DOCKER_BUILDKIT"] = "1"
    run_command(
        f"docker build -t gcr.io/{project_id}/{service_name}:latest --progress=plain .",
        env=env,
    )
    print(color_text("Pushing Docker image...", OKCYAN))
    run_command(f"docker push gcr.io/{project_id}/{service_name}:latest")

    # Deploy the service to Cloud Run
    deploy_to_cloud_run(
        project_id, region, service_name, cloud_sql_instance, env_vars
    )

    print(color_text("Creating new API...", OKCYAN))
    create_api_gateway_service(api_gateway_client, project_id, api_id)

    # Create or update the API configuration
    create_or_update_api_config(
        project_id, api_id, api_config_id, api_config_file
    )

    create_gateway(
        api_gateway_client,
        project_id,
        api_gateway_region,
        api_gateway_name,
        api_id,
        api_config_id,
    )


if __name__ == "__main__":
    main()
