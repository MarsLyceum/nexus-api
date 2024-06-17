import subprocess
import argparse
import os

# Constants
PROJECT_ID = "YOUR_PROJECT_ID"
API_ID = "YOUR_API_ID"
DISPLAY_NAME = "Your API Display Name"
REGION = "global"
OPENAPI_SPEC_PATH = (
    "path/to/your/openapi.yaml"  # Relative path to the OpenAPI YAML file
)


def create_api_gateway(api_key):
    # Command to create an API
    create_api_command = [
        "gcloud",
        "api-gateway",
        "apis",
        "create",
        API_ID,
        "--project",
        PROJECT_ID,
        "--display-name",
        DISPLAY_NAME,
        "--location",
        REGION,
    ]

    try:
        # Execute the command to create the API
        result = subprocess.run(
            create_api_command, check=True, capture_output=True, text=True
        )
        print("API created:", result.stdout)
    except subprocess.CalledProcessError as e:
        print("Error creating API:", e.stderr)
        return

    # Command to create an API config with the API key
    api_config_id = f"{API_ID}-config"
    create_api_config_command = [
        "gcloud",
        "api-gateway",
        "api-configs",
        "create",
        api_config_id,
        "--api",
        API_ID,
        "--openapi-spec",
        OPENAPI_SPEC_PATH,
        "--project",
        PROJECT_ID,
        "--location",
        REGION,
    ]

    try:
        # Read the OpenAPI spec and replace the API key placeholder
        with open(OPENAPI_SPEC_PATH, "r") as file:
            openapi_spec = file.read().replace("YOUR_API_KEY", api_key)

        result = subprocess.run(
            create_api_config_command,
            input=openapi_spec,
            text=True,
            check=True,
            capture_output=True,
        )
        print("API config created:", result.stdout)
    except subprocess.CalledProcessError as e:
        print("Error creating API config:", e.stderr)
        return

    # Command to create a gateway
    gateway_id = f"{API_ID}-gateway"
    create_gateway_command = [
        "gcloud",
        "api-gateway",
        "gateways",
        "create",
        gateway_id,
        "--api",
        API_ID,
        "--api-config",
        api_config_id,
        "--project",
        PROJECT_ID,
        "--location",
        REGION,
    ]

    try:
        # Execute the command to create the gateway
        result = subprocess.run(
            create_gateway_command, check=True, capture_output=True, text=True
        )
        print("Gateway created:", result.stdout)
    except subprocess.CalledProcessError as e:
        print("Error creating gateway:", e.stderr)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Create a Google Cloud Platform API Gateway API."
    )
    parser.add_argument("api_key", help="The API key to protect the API")

    args = parser.parse_args()

    create_api_gateway(args.api_key)
