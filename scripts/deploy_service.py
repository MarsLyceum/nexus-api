#!/usr/bin/env python3
import os
import argparse
import sys

from gcp_microservice_management import (
    find_env_file,
    load_env_variables,
    find_key_file,
    deploy_to_cloud_run,
    color_text,
    run_command,
    OKCYAN,
    OKGREEN,
)


# Tell Python to use UTF‑8 for stdout/stderr, replacing unprintable chars
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore


def deploy_service(
    service_name: str,
    project_id: str = "hephaestus-418809",
    region: str = "us-west1",
) -> None:
    # compute repo root (one level up from scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, os.pardir))
    dockerfile_path = os.path.join(repo_root, "Dockerfile")
    context_path = repo_root

    # load .env
    env_file = find_env_file()
    if env_file:
        print(color_text(f"Using .env file: {env_file}", OKGREEN))
        env_vars = load_env_variables(env_file)
    else:
        env_vars = {}

    # set DB password globally if present
    global DATABASE_PASSWORD
    DATABASE_PASSWORD = env_vars.get("DATABASE_PASSWORD", "")

    # find service account key
    key_file = find_key_file(
        os.path.join(repo_root, "service-account-keys"), f"{project_id}-*.json"
    )
    if key_file:
        print(color_text(f"Using key file: {key_file}", OKGREEN))
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file
        print(
            color_text(
                "Authenticating gcloud with a service account...", OKCYAN
            )
        )

    # build
    print(color_text("Building Docker image...", OKCYAN))
    env = os.environ.copy()
    env["DOCKER_BUILDKIT"] = "1"
    run_command(
        "docker build "
        f"--build-arg SERVICE_NAME={service_name} "
        f"-f {dockerfile_path} "
        f"-t gcr.io/{project_id}/{service_name}:latest "
        f"{context_path}",
        env=env,
    )

    # push
    print(color_text("Pushing Docker image...", OKCYAN))
    run_command(f"docker push gcr.io/{project_id}/{service_name}:latest")

    # deploy
    deploy_to_cloud_run(
        project_id,
        region,
        service_name,
        env_vars,
        force_recreate=True,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Build, push & deploy a service to Cloud Run"
    )
    parser.add_argument("service_name", help="the service folder to deploy")
    parser.add_argument(
        "--project", default="hephaestus-418809", help="GCP project id"
    )
    parser.add_argument("--region", default="us-west1", help="GCP region")
    args = parser.parse_args()
    deploy_service(
        args.service_name, project_id=args.project, region=args.region
    )
