#!/usr/bin/env python3
import os
import sys

# ensure repo-root/scripts is on PYTHONPATH
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(THIS_DIR, os.pardir, os.pardir))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))

from deploy_service import deploy_service

if __name__ == "__main__":
    deploy_service("group-api")
