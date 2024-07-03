import subprocess
import os

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
    f"docker build -f {os.getcwd()}/Dockerfile -t local-test ../.."
)
print(build_output)
if build_status != 0:
    print(build_error)
    exit(1)

# Remove any existing container with the same name
print("Removing any existing container with the same name...")
remove_status, remove_output, remove_error = run_command(
    "docker rm -f local-test-container"
)
if remove_status != 0:
    print(f"Warning: Could not remove existing container: {remove_error}")

# Print the command to run the Docker container with an interactive shell
print("To run the Docker container with an interactive shell, execute the following command in your terminal:")
print("docker run --name local-test-container -it local-test sh")
