import os
import sys
import zipfile
import uuid
from glob import glob
from typing import Dict
from google.cloud import run_v2
from google.cloud import functions_v2
from google.cloud import apigateway_v1
from google.cloud.functions_v2.types import (
    Source,
    StorageSource,
    Function,
    BuildConfig,
    ServiceConfig,
)
from google.cloud.apigateway_v1.types import ApiConfig, Gateway
from google.oauth2.service_account import Credentials
from google.api_core.exceptions import NotFound, AlreadyExists
from google.cloud import storage
from datetime import timedelta

# ANSI escape sequences for colors
HEADER: str = "\033[95m"
OKBLUE: str = "\033[94m"
OKCYAN: str = "\033[96m"
OKGREEN: str = "\033[92m"
WARNING: str = "\033[93m"
FAIL: str = "\033[91m"
ENDC: str = "\033[0m"
BOLD: str = "\033[1m"
UNDERLINE: str = "\033[4m"


# Function to color text output
def color_text(text: str, color_code: str) -> str:
    return f"{color_code}{text}{ENDC}"


# Function to find the service account key file
def find_key_file() -> str:
    key_files = glob("./terraform/hephaestus-418809-*.json")
    if not key_files:
        print(color_text("No service account key file found", FAIL))
        sys.exit(1)
    return key_files[0]


# Function to find the .env file in the directory tree
def find_env_file() -> str:
    current_dir = os.getcwd()
    while current_dir != os.path.dirname(current_dir):
        env_path = os.path.join(current_dir, ".env")
        if os.path.isfile(env_path):
            return env_path
        current_dir = os.path.dirname(current_dir)
    print(color_text(".env file not found", FAIL))
    sys.exit(1)


# Function to load environment variables from the .env file
def load_env_variables(env_file: str) -> Dict[str, str]:
    env_vars: Dict[str, str] = {}
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, value = line.split("=", 1)
                env_vars[key] = value
    return env_vars


def zip_directory(directory_path: str, zip_path: str) -> None:
    """Zip the contents of the directory, excluding node_modules."""
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(directory_path):
            if "node_modules" in dirs:
                dirs.remove("node_modules")  # Exclude node_modules directory
            if "__pycache__" in dirs:
                dirs.remove("__pycache__")
            if "terraform" in dirs:
                dirs.remove("terraform")
            for file in files:
                file_path = os.path.join(root, file)
                # Exclude the zip file itself from being added to the archive
                if os.path.abspath(file_path) == os.path.abspath(zip_path):
                    continue
                zipf.write(
                    file_path, os.path.relpath(file_path, directory_path)
                )


def upload_to_bucket(
    local_file_path: str,
    bucket_name: str,
    destination_blob_name: str,
    credentials: Credentials,
) -> str:
    """
    Upload a file to a Google Cloud Storage bucket and return the gs:// URL.
    """
    storage_client = storage.Client(credentials=credentials)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(local_file_path)

    # Return the gs:// URL for the uploaded file
    return f"gs://{bucket_name}/{destination_blob_name}"


def generate_bucket_name(project_id: str) -> str:
    """Generate a unique bucket name."""
    return f"{project_id}-{uuid.uuid4()}"


def zip_and_upload_directory(
    directory_path: str, project_id: str, credentials: Credentials
) -> tuple[str, str]:
    """Zip the directory and upload to a new bucket, returning blob name and bucket name."""
    zip_path = os.path.join(os.getcwd(), "service.zip")
    zip_directory(directory_path, zip_path)

    bucket_name = generate_bucket_name(project_id)
    storage_client = storage.Client(credentials=credentials)
    storage_client.create_bucket(bucket_name)

    destination_blob_name = os.path.basename(zip_path)
    upload_to_bucket(zip_path, bucket_name, destination_blob_name, credentials)

    return destination_blob_name, bucket_name


def check_api_config_exists(
    client: apigateway_v1.ApiGatewayServiceClient,
    project_id: str,
    api_id: str,
    api_config_id: str,
) -> bool:
    try:
        client.get_api_config(
            name=(
                f"projects/{project_id}/locations/global/apis/{api_id}/"
                f"configs/{api_config_id}"
            )
        )
        print(color_text(f"API config {api_config_id} exists.", OKGREEN))
        return True
    except NotFound:
        print(
            color_text(f"API config {api_config_id} does not exist.", WARNING)
        )
        return False


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


def create_gateway(
    client: apigateway_v1.ApiGatewayServiceClient,
    project_id: str,
    location: str,
    gateway_name: str,
    api_id: str,
    api_config_id: str,
) -> None:
    gateway = Gateway(
        name=(
            f"projects/{project_id}/locations/{location}/gateways/"
            f"{gateway_name}"
        ),
        api_config=(
            f"projects/{project_id}/locations/global/apis/{api_id}/"
            f"configs/{api_config_id}"
        ),
    )
    client.create_gateway(
        parent=f"projects/{project_id}/locations/{location}",
        gateway_id=gateway_name,
        gateway=gateway,
    )
    print(color_text(f"Gateway {gateway_name} created.", OKGREEN))


def delete_bucket(bucket_name: str, credentials: Credentials) -> None:
    """Delete a Google Cloud Storage bucket."""
    storage_client = storage.Client(credentials=credentials)
    bucket = storage_client.bucket(bucket_name)

    # Delete all objects in the bucket
    blobs = bucket.list_blobs()
    for blob in blobs:
        blob.delete()

    # Delete the bucket
    bucket.delete()
    print(color_text(f"Deleted bucket {bucket_name}", OKGREEN))


def delete_function(
    functions_client: functions_v2.FunctionServiceClient,
    function_name: str,
) -> None:
    """Delete an existing Cloud Function if it exists."""
    try:
        functions_client.delete_function(name=function_name)
        print(
            color_text(f"Deleted existing function {function_name}", OKGREEN)
        )
    except NotFound:
        print(
            color_text(
                f"Function {function_name} not found, no need to delete",
                WARNING,
            )
        )


def delete_existing_cloud_run_service(
    service_name: str, project_id: str, region: str, credentials: Credentials
) -> None:
    # Initialize Cloud Run client
    client = run_v2.ServicesClient(credentials=credentials)
    service_path = client.service_path(project_id, region, service_name)

    try:
        client.delete_service(name=service_path)
        print(
            color_text(
                f"Deleted existing Cloud Run service {service_name}", OKGREEN
            )
        )
    except NotFound:
        print(
            color_text(
                f"Cloud Run service {service_name} not found, no need to delete",
                WARNING,
            )
        )


def create_api(
    client: apigateway_v1.ApiGatewayServiceClient, project_id: str, api_id: str
) -> None:
    """Create an API if it doesn't exist."""
    try:
        client.get_api(
            name=f"projects/{project_id}/locations/global/apis/{api_id}"
        )
        print(color_text(f"API {api_id} already exists.", OKGREEN))
    except NotFound:
        api = apigateway_v1.types.Api(
            display_name=api_id,
        )
        client.create_api(
            parent=f"projects/{project_id}/locations/global",
            api=api,
            api_id=api_id,
        )
        print(color_text(f"Created API {api_id}.", OKGREEN))


def main() -> None:
    # Project and service configuration
    project_id: str = "hephaestus-418809"
    region: str = "us-west1"
    api_gateway_region: str = "us-west2"
    api_config_file: str = os.path.join(os.getcwd(), "peeps-web-service.yml")
    api_gateway_name: str = "peeps-web-service-api-gateway"
    api_id: str = "peeps-web-service-api"
    api_config_id: str = f"{api_id}-config"
    service_name: str = "peeps-web-service"
    entry_point: str = "graphqlHandler"
    runtime: str = "nodejs18"

    # Find and load environment variables
    env_file: str = find_env_file()
    print(color_text(f"Using .env file: {env_file}", OKGREEN))
    env_vars: Dict[str, str] = load_env_variables(env_file)

    # Find the service account key file
    key_file: str = find_key_file()
    print(color_text(f"Using key file: {key_file}", OKGREEN))
    credentials: Credentials = Credentials.from_service_account_file(key_file)

    # Initialize clients
    functions_client: functions_v2.FunctionServiceClient = (
        functions_v2.FunctionServiceClient(credentials=credentials)
    )
    api_gateway_client: apigateway_v1.ApiGatewayServiceClient = (
        apigateway_v1.ApiGatewayServiceClient(credentials=credentials)
    )

    function_name = (
        f"projects/{project_id}/locations/{region}/functions/{service_name}"
    )

    # Delete the existing function if it exists
    print(color_text("Deleting existing function if it exists...", OKCYAN))
    delete_function(functions_client, function_name)
    delete_existing_cloud_run_service(
        service_name, project_id, region, credentials
    )

    # Deploy the function to Google Cloud Functions
    env_var_flags: Dict[str, str] = {
        key: value for key, value in env_vars.items()
    }
    print(color_text("Deploying to Google Cloud Functions...", OKCYAN))

    (bucket_blob_name, bucket_name) = (
        zip_and_upload_directory(".", project_id, credentials),
    )[0]

    service_function = Function(
        name=function_name,
        build_config=BuildConfig(
            runtime=runtime,
            entry_point=entry_point,
            source=Source(
                storage_source=StorageSource(
                    bucket=bucket_name, object=bucket_blob_name
                )
            ),
        ),
        service_config=ServiceConfig(
            environment_variables=env_var_flags,
            ingress_settings=ServiceConfig.IngressSettings.ALLOW_ALL,
        ),
    )
    functions_client.create_function(
        parent=f"projects/{project_id}/locations/{region}",
        function=service_function,
        function_id=service_name,
    )

    # Retrieve and print the function URL
    print(color_text("Retrieving Cloud Function URL...", OKCYAN))
    function_info = functions_client.get_function(name=service_function.name)
    print(
        color_text(
            f"Cloud Function URL: {function_info.service_config.uri}", OKGREEN
        )
    )
    delete_bucket(bucket_name, credentials)

    print(color_text("Creating new API...", OKCYAN))
    create_api(api_gateway_client, project_id, api_id)

    # Create or update the API configuration
    print(color_text("Creating new API configuration...", OKCYAN))
    if not check_api_config_exists(
        api_gateway_client, project_id, api_id, api_config_id
    ):
        api_config = ApiConfig(
            name=(
                f"projects/{project_id}/locations/global/apis/{api_id}/"
                f"configs/{api_config_id}"
            ),
            openapi_documents=[{"document": {"path": api_config_file}}],
        )
        try:
            api_gateway_client.create_api_config(
                parent=f"projects/{project_id}/locations/global/apis/{api_id}",
                api_config=api_config,
                api_config_id=api_config_id,
            )
        except AlreadyExists:
            print(color_text("Gateway config already exists", WARNING))

    if not check_gateway_exists(
        api_gateway_client, project_id, api_gateway_region, api_gateway_name
    ):
        create_gateway(
            api_gateway_client,
            project_id,
            api_gateway_region,
            api_gateway_name,
            api_id,
            api_config_id,
        )

    # Retrieve and print the API Gateway URL
    print(color_text("Retrieving API Gateway URL...", OKCYAN))
    gateway_info = api_gateway_client.get_gateway(
        name=(
            f"projects/{project_id}/locations/{api_gateway_region}/"
            f"gateways/{api_gateway_name}"
        )
    )
    print(
        color_text(
            f"API Gateway URL: https://{gateway_info.default_hostname}",
            OKGREEN,
        )
    )


if __name__ == "__main__":
    main()
