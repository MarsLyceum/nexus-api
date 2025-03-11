import subprocess


def create_instance():
    """
    Create a Google Compute Engine instance for PostgreSQL.
    """
    cmd = [
        "gcloud.cmd",
        "compute",
        "instances",
        "create",
        "nexus-postgres-vm",
        "--zone=us-west1-a",
        "--machine-type=e2-small",
        "--image-family=debian-11",
        "--image-project=debian-cloud",
        "--tags=postgres-server",
    ]
    subprocess.run(cmd, check=True)
    print("Compute Engine instance 'nexus-postgres-vm' created successfully.")


def create_firewall_rule(source_range):
    """
    Create a firewall rule to allow access on TCP port 5432.
    """
    cmd = [
        "gcloud.cmd",
        "compute",
        "firewall-rules",
        "create",
        "allow-postgres",
        "--allow",
        "tcp:5432",
        "--target-tags=postgres-server",
        "--direction=INGRESS",
        "--priority=1000",
        f"--source-ranges={source_range}",
    ]
    subprocess.run(cmd, check=True)
    print("Firewall rule 'allow-postgres' created successfully.")


def main():
    # Replace this with your actual allowed IP range (e.g., "192.168.1.0/24")
    allowed_ip_range = "0.0.0.0/0"

    try:
        print("Creating Compute Engine instance...")
        create_instance()
        print("Creating Firewall rule...")
        create_firewall_rule(allowed_ip_range)
        print("Deployment complete.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
