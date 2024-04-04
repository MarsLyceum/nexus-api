provider "google" {
  credentials = file("hephaestus-418809-26f13a75446e.json")
  project     = "hephaestus-418809"
  region      = "us-east1"
}

resource "kubernetes_secret" "cloudsql_creds" {
  metadata {
    name = "cloudsql-instance-credentials"
  }

  data = {
    "credentials.json" = file("hephaestus-418809-26f13a75446e.json")
  }
}


resource "google_container_cluster" "hephaestus-api-cluster" {
  name                     = "hephaestus-api-cluster"
  location                 = "us-east1"
  deletion_protection      = false
  remove_default_node_pool = true
  initial_node_count       = 1

  # node_pool {
  #   name       = "hephaestus-api-cluster-pool"
  #   node_count = 1

  #   node_config {
  #     machine_type = "e2-micro"
  #   }
  # }
}

resource "google_container_node_pool" "primary_preemptible_nodes" {
  name       = "hephaestus-api-node-pool"
  cluster    = google_container_cluster.primary.id
  node_count = 1

  node_config {
    preemptible  = true
    machine_type = "e2-micro"

    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    service_account = google_service_account.default.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}


provider "kubernetes" {
  host                   = google_container_cluster.hephaestus-api-cluster.endpoint
  token                  = data.google_client_config.current.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.hephaestus-api-cluster.master_auth[0].cluster_ca_certificate)
}

data "google_client_config" "current" {}
