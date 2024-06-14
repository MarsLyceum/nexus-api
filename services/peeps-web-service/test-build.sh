#!/bin/sh

# Build the Docker image
docker build -t local-test .

# Remove any existing container with the same name
docker rm -f local-test-container > /dev/null 2>&1

# Run the Docker container in detached mode
docker run --name local-test-container -d -p 4000:4000 local-test
RUN_STATUS=$?

# Function to highlight logs
highlight_logs() {
  docker logs local-test-container 2>&1 | awk '
  {
    if ($0 ~ /(error|failed|warning)/) {
      print "\033[31m" $0 "\033[39m" # Red for error, failed, warning
    } else if ($0 ~ /(info|note)/) {
      print "\033[32m" $0 "\033[39m" # Green for info, note
    } else {
      print $0
    }
  }'
}

# Check if the container started successfully
if [ $RUN_STATUS -ne 0 ]; then
  echo "Failed to start the container"
  highlight_logs
  exit 1
fi

# Wait for a few seconds to ensure the container starts
sleep 5

# Attach to the container logs
highlight_logs &
LOGS_PID=$!

# Wait a bit more to let the application initialize
sleep 5

# Check if the container is still running
if docker ps | grep -q local-test-container; then
  echo "Container started successfully"
  # Stop the container
  docker stop local-test-container
  # Wait for the logs process to finish
  wait $LOGS_PID
else
  echo "Container failed to start"
  # Show the logs if the container is not running
  highlight_logs
  # Wait for the logs process to finish
  wait $LOGS_PID
  exit 1
fi
