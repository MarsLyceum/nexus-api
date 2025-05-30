import subprocess
import time
import os
import sys

if len(sys.argv) > 1:
    service_name = sys.argv[1]
else:
    service_name = os.path.basename(os.getcwd())

# resolve the path to the repo root and its Dockerfile
script_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.abspath(os.path.join(script_dir, os.pardir))
dockerfile_path = os.path.join(repo_root, "Dockerfile")


def run_command(command):
    result = subprocess.run(
        command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    return (
        result.returncode,
        result.stdout.decode("utf-8"),
        result.stderr.decode("utf-8"),
    )


def highlight_logs(logs):
    lines = logs.splitlines()
    for line in lines:
        if any(
            keyword in line.lower()
            for keyword in ["error", "failed", "warning"]
        ):
            print(f"\033[31m{line}\033[39m")  # Red for error, failed, warning
        elif any(keyword in line.lower() for keyword in ["info", "note"]):
            print(f"\033[32m{line}\033[39m")  # Green for info, note
        else:
            print(line)


# Build the Docker image
print("Building Docker image...")
build_status, build_output, build_error = run_command(
    f"docker build -f {dockerfile_path} -t local-test-{service_name} --build-arg SERVICE_NAME={service_name} ../.."
)
print(build_output)
if build_status != 0:
    print(build_error)
    exit(1)

# Remove any existing container with the same name
print("Removing any existing container with the same name...")
remove_status, remove_output, remove_error = run_command(
    f"docker rm -f local-test-container-{service_name}"
)
if remove_status != 0:
    print(f"Warning: Could not remove existing container: {remove_error}")

# Run the Docker container in detached mode
print("Running Docker container in detached mode...")
run_status, run_output, run_error = run_command(
    f"docker run --name local-test-container-{service_name} "
    f"--env-file {repo_root}/services/{service_name}/.env "
    f"-v {repo_root}/service-account-keys:/service-account-keys "
    f" -d local-test-{service_name} "
)
if run_status != 0:
    print("Failed to start the container")
    highlight_logs(run_error)
    exit(1)

# Wait for a few seconds to ensure the container starts
time.sleep(5)

# Attach to the container logs
print("Attaching to container logs...")
log_status, log_output, log_error = run_command(
    f"docker logs local-test-container-{service_name} 2>&1"
)

# Check if the container is still running
print("Checking if the container is still running...")
ps_status, ps_output, ps_error = run_command(
    f"docker ps | grep local-test-container-{service_name}"
)

if ps_status == 0:
    print("Container started successfully")
    # Stop the container
    run_command(f"docker stop local-test-container-{service_name}")
    # Display the logs
    highlight_logs(log_output)
else:
    print("Container failed to start")
    highlight_logs(log_output)
    exit(1)
