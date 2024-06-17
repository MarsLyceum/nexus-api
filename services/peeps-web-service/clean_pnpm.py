import os
import platform
import subprocess
import shutil


def run_command(command):
    result = subprocess.run(
        command, shell=True, text=True, capture_output=True
    )
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    else:
        print(result.stdout)


def clean_pnpm():
    # Prune pnpm store
    run_command("pnpm store prune")

    # Remove node_modules and pnpm-lock.yaml based on OS
    if platform.system() == "Windows":
        if os.path.exists("node_modules"):
            shutil.rmtree("node_modules")
        if os.path.exists("pnpm-lock.yaml"):
            os.remove("pnpm-lock.yaml")
    else:
        run_command("rm -rf node_modules pnpm-lock.yaml")


if __name__ == "__main__":
    clean_pnpm()
