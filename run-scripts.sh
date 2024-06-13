#!/bin/bash

# Check if a script name was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <script>"
  exit 1
fi

SCRIPT=$1

# Define the directory containing your packages
PACKAGES_DIR="services"

# Iterate over each package directory
for PACKAGE in $PACKAGES_DIR/*; do
  if [ -d "$PACKAGE" ]; then
    # Navigate to the package directory
    cd "$PACKAGE"

    # Run the script in the package directory if package.json exists
    if [ -f "package.json" ]; then
      echo "Running $SCRIPT in $PACKAGE"
      npm run $SCRIPT
    fi

    # Navigate back to the root directory
    cd - > /dev/null
  fi
done
