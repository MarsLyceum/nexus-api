#!/bin/sh

# Build the Docker image
docker build -t local-test .

# Run the Docker container in detached mode
docker run --name local-test-container -d -p 4000:4000 local-test
RUN_STATUS=$?

# Check if the container started successfully
if [ $RUN_STATUS -ne 0 ]; then
  echo "Failed to start the container"
  docker logs local-test-container
  exit 1
fi

# Wait for a few seconds to ensure the container starts
sleep 5

# Attach to the container logs
docker logs -f local-test-container &
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
  docker logs local-test-container
  # Wait for the logs process to finish
  wait $LOGS_PID
  exit 1
fi
